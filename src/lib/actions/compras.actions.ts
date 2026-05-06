"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { ordenSchema, updateOrdenSchema, type OrdenInput, type UpdateOrdenInput } from "@/lib/schemas/compra.schema";
import { revalidatePath } from "next/cache";
import type { OrdenCompra } from "@/types";

const sb = () => createAdminClient();
const CARLOS_USER_ID = "00000000-0000-0000-0000-000000000001";

async function nextFolio(): Promise<string> {
  const year = new Date().getFullYear();
  const { count } = await sb()
    .from("ordenes_compra")
    .select("*", { count: "exact", head: true })
    .gte("created_at", `${year}-01-01`)
    .lt("created_at", `${year + 1}-01-01`);
  const n = ((count ?? 0) + 1).toString().padStart(3, "0");
  return `ORD-${year}-${n}`;
}

interface GetOrdenesOpts {
  desde?: string;
  hasta?: string;
  supplier_id?: string;
  limit?: number;
}

export async function getOrdenes(
  opts: GetOrdenesOpts = {},
): Promise<{ data: OrdenCompra[] | null; error: string | null }> {
  const { desde, hasta, supplier_id, limit = 200 } = opts;

  let query = sb()
    .from("ordenes_compra")
    .select(
      "*, proveedores:supplier_id(id,company), detalle_orden(id,product_id,qty,price,subtotal,productos:product_id(id,nombre,unidad,categoria_id,categorias:categoria_id(id,nombre,color)))",
    )
    .order("fecha", { ascending: false })
    .limit(limit);

  if (desde) query = query.gte("fecha", desde);
  if (hasta) query = query.lte("fecha", hasta);
  if (supplier_id) query = query.eq("supplier_id", supplier_id);

  const { data, error } = await query;
  if (error) return { data: null, error: error.message };
  return { data: data as unknown as OrdenCompra[], error: null };
}

export async function getOrdenById(
  id: string,
): Promise<{ data: OrdenCompra | null; error: string | null }> {
  const { data, error } = await sb()
    .from("ordenes_compra")
    .select(
      "*, proveedores:supplier_id(id,company), detalle_orden(id,product_id,qty,price,subtotal,productos:product_id(id,nombre,unidad,categoria_id,categorias:categoria_id(id,nombre,color)))",
    )
    .eq("id", id)
    .single();
  if (error) return { data: null, error: error.message };
  return { data: data as unknown as OrdenCompra, error: null };
}

export async function createOrden(
  input: OrdenInput,
): Promise<{ data: OrdenCompra | null; error: string | null }> {
  const parsed = ordenSchema.safeParse(input);
  if (!parsed.success) return { data: null, error: "Datos inválidos" };

  const { supplier_id, fecha, detalles, has_invoice, invoice_url, folio: folioInput } = parsed.data;
  const total = detalles.reduce((s, d) => s + d.qty * d.price, 0);
  const folio = folioInput?.trim() || (await nextFolio());

  // 1. Create order
  const { data: orden, error: oErr } = await sb()
    .from("ordenes_compra")
    .insert({
      folio,
      supplier_id,
      fecha,
      total,
      has_invoice: has_invoice ?? false,
      invoice_url: invoice_url ?? null,
    })
    .select("*")
    .single();
  if (oErr) return { data: null, error: oErr.message };

  // 2. Insert detalles
  const { error: dErr } = await sb()
    .from("detalle_orden")
    .insert(detalles.map((d) => ({ orden_id: orden.id, product_id: d.product_id, qty: d.qty, price: d.price })));
  if (dErr) {
    await sb().from("ordenes_compra").delete().eq("id", orden.id);
    return { data: null, error: dErr.message };
  }

  // 3. Register movimientos entrada (trigger updates stock_actual)
  const { error: mErr } = await sb()
    .from("movimientos")
    .insert(
      detalles.map((d) => ({
        product_id: d.product_id,
        tipo: "entrada",
        qty: d.qty,
        fecha,
        user_id: CARLOS_USER_ID,
        notes: `Compra ${folio}`,
        ref_id: orden.id,
      })),
    );
  if (mErr) {
    await sb().from("detalle_orden").delete().eq("orden_id", orden.id);
    await sb().from("ordenes_compra").delete().eq("id", orden.id);
    return { data: null, error: mErr.message };
  }

  // 4. Update total_spent on proveedor
  const { data: prov } = await sb().from("proveedores").select("total_spent").eq("id", supplier_id).single();
  if (prov) {
    await sb().from("proveedores").update({ total_spent: Number(prov.total_spent) + total }).eq("id", supplier_id);
  }

  // 5. Update last_price on productos
  for (const d of detalles) {
    await sb().from("productos").update({ last_price: d.price }).eq("id", d.product_id);
  }

  revalidatePath("/compras");
  revalidatePath("/dashboard");
  revalidatePath("/productos");
  return { data: orden as unknown as OrdenCompra, error: null };
}

export async function updateOrden(
  id: string,
  input: UpdateOrdenInput,
): Promise<{ data: OrdenCompra | null; error: string | null }> {
  const parsed = updateOrdenSchema.safeParse(input);
  if (!parsed.success) return { data: null, error: "Datos inválidos" };

  const { supplier_id, fecha, detalles, has_invoice, invoice_url, folio } = parsed.data;

  // Fetch current order for rollback calculations
  const { data: currentOrden } = await sb()
    .from("ordenes_compra")
    .select("supplier_id,total,folio")
    .eq("id", id)
    .single();
  if (!currentOrden) return { data: null, error: "Orden no encontrada" };

  // 1. Delete old movimientos entrada (trigger reverses stock)
  await sb().from("movimientos").delete().eq("ref_id", id).eq("tipo", "entrada");

  // 2. Delete old detalles
  await sb().from("detalle_orden").delete().eq("orden_id", id);

  // 3. Insert new detalles
  if (detalles && detalles.length > 0) {
    const { error: dErr } = await sb()
      .from("detalle_orden")
      .insert(detalles.map((d) => ({ orden_id: id, product_id: d.product_id, qty: d.qty, price: d.price })));
    if (dErr) return { data: null, error: dErr.message };

    // 4. Insert new movimientos entrada
    const newFolio = folio?.trim() || currentOrden.folio;
    const { error: mErr } = await sb()
      .from("movimientos")
      .insert(
        detalles.map((d) => ({
          product_id: d.product_id,
          tipo: "entrada",
          qty: d.qty,
          fecha: fecha ?? new Date().toISOString().split("T")[0],
          user_id: CARLOS_USER_ID,
          notes: `Compra ${newFolio}`,
          ref_id: id,
        })),
      );
    if (mErr) return { data: null, error: mErr.message };

    // 5. Update last_price
    for (const d of detalles) {
      await sb().from("productos").update({ last_price: d.price }).eq("id", d.product_id);
    }
  }

  // 6. Update total_spent on proveedor (reverse old, add new)
  const newTotal = detalles ? detalles.reduce((s, d) => s + d.qty * d.price, 0) : Number(currentOrden.total);
  const effectiveSupplierId = supplier_id ?? currentOrden.supplier_id;
  const { data: prov } = await sb().from("proveedores").select("total_spent").eq("id", effectiveSupplierId).single();
  if (prov) {
    const adjusted = Math.max(0, Number(prov.total_spent) - Number(currentOrden.total)) + newTotal;
    await sb().from("proveedores").update({ total_spent: adjusted }).eq("id", effectiveSupplierId);
  }

  // 7. Update orden fields
  const updateFields: Record<string, unknown> = { total: newTotal };
  if (supplier_id) updateFields.supplier_id = supplier_id;
  if (fecha) updateFields.fecha = fecha;
  if (folio?.trim()) updateFields.folio = folio.trim();
  if (has_invoice !== undefined) updateFields.has_invoice = has_invoice;
  if (invoice_url !== undefined) updateFields.invoice_url = invoice_url;

  const { data: updated, error: uErr } = await sb()
    .from("ordenes_compra")
    .update(updateFields)
    .eq("id", id)
    .select("*")
    .single();
  if (uErr) return { data: null, error: uErr.message };

  revalidatePath("/compras");
  revalidatePath("/dashboard");
  revalidatePath("/productos");
  return { data: updated as unknown as OrdenCompra, error: null };
}

export async function deleteOrden(id: string): Promise<{ error: string | null }> {
  // Get order info for cleanup
  const { data: orden } = await sb()
    .from("ordenes_compra")
    .select("supplier_id,total,invoice_url")
    .eq("id", id)
    .single();

  // Get detalles for stock reversal
  const { data: detalles } = await sb()
    .from("detalle_orden")
    .select("product_id,qty,price")
    .eq("orden_id", id);

  // Delete movimientos entrada (trigger reverses stock)
  await sb().from("movimientos").delete().eq("ref_id", id).eq("tipo", "entrada");

  // Reverse total_spent on proveedor
  if (orden) {
    const { data: prov } = await sb().from("proveedores").select("total_spent").eq("id", orden.supplier_id).single();
    if (prov) {
      await sb()
        .from("proveedores")
        .update({ total_spent: Math.max(0, Number(prov.total_spent) - Number(orden.total)) })
        .eq("id", orden.supplier_id);
    }

    // Delete invoice from Storage if present
    if (orden.invoice_url) {
      await sb().storage.from("facturas").remove([orden.invoice_url]);
    }
  }

  const { error } = await sb().from("ordenes_compra").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/compras");
  revalidatePath("/dashboard");
  revalidatePath("/productos");
  return { error: null };
}

export async function uploadFactura(
  formData: FormData,
): Promise<{ path: string | null; error: string | null }> {
  const file = formData.get("file") as File | null;
  if (!file) return { path: null, error: "No se recibió archivo" };

  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${timestamp}_${safeName}`;

  const { error } = await sb()
    .storage
    .from("facturas")
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error) return { path: null, error: error.message };
  return { path, error: null };
}

export async function deleteFactura(path: string): Promise<{ error: string | null }> {
  const { error } = await sb().storage.from("facturas").remove([path]);
  if (error) return { error: error.message };
  return { error: null };
}

export async function getFacturaSignedUrl(
  path: string,
): Promise<{ url: string | null; error: string | null }> {
  const { data, error } = await sb()
    .storage
    .from("facturas")
    .createSignedUrl(path, 3600);
  if (error) return { url: null, error: error.message };
  return { url: data.signedUrl, error: null };
}
