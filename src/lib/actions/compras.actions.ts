"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { ordenSchema, type OrdenInput } from "@/lib/schemas/compra.schema";
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

export async function getOrdenes(limit = 50): Promise<{ data: OrdenCompra[] | null; error: string | null }> {
  const { data, error } = await sb()
    .from("ordenes_compra")
    .select("*, proveedores:supplier_id(id,company), detalle_orden(id,product_id,qty,price,subtotal,productos:product_id(id,nombre,unidad))")
    .order("fecha", { ascending: false })
    .limit(limit);
  if (error) return { data: null, error: error.message };
  return { data: data as unknown as OrdenCompra[], error: null };
}

export async function getOrdenById(
  id: string,
): Promise<{ data: OrdenCompra | null; error: string | null }> {
  const { data, error } = await sb()
    .from("ordenes_compra")
    .select("*, proveedores:supplier_id(id,company), detalle_orden(id,product_id,qty,price,subtotal,productos:product_id(id,nombre,unidad))")
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

  const { supplier_id, fecha, detalles, has_invoice, invoice_url } = parsed.data;
  const total = detalles.reduce((s, d) => s + d.qty * d.price, 0);
  const folio = await nextFolio();
  const fechaStr = typeof fecha === "string" ? fecha : fecha.toISOString();

  // 1. Create order
  const { data: orden, error: oErr } = await sb()
    .from("ordenes_compra")
    .insert({ folio, supplier_id, fecha: fechaStr, total, has_invoice: has_invoice ?? false, invoice_url: invoice_url ?? null })
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
        fecha: fechaStr,
        user_id: CARLOS_USER_ID,
        notes: `Compra ${folio}`,
        ref_id: orden.id,
      })),
    );
  if (mErr) return { data: null, error: mErr.message };

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

export async function deleteOrden(
  id: string,
): Promise<{ error: string | null }> {
  // Get detalles to reverse stock (delete movimientos)
  const { data: detalles } = await sb()
    .from("detalle_orden")
    .select("product_id,qty,price")
    .eq("orden_id", id);

  // Delete movimientos entrada linked to this order
  await sb().from("movimientos").delete().eq("ref_id", id).eq("tipo", "entrada");

  // Reverse stock manually for each product
  if (detalles) {
    for (const d of detalles) {
      const { data: prod } = await sb()
        .from("productos")
        .select("stock_actual")
        .eq("id", d.product_id)
        .single();
      if (prod) {
        await sb()
          .from("productos")
          .update({ stock_actual: Math.max(0, prod.stock_actual - d.qty) })
          .eq("id", d.product_id);
      }
    }
    // Reverse total_spent
    const { data: orden } = await sb().from("ordenes_compra").select("supplier_id,total").eq("id", id).single();
    if (orden) {
      const { data: prov } = await sb().from("proveedores").select("total_spent").eq("id", orden.supplier_id).single();
      if (prov) {
        await sb().from("proveedores").update({ total_spent: Math.max(0, Number(prov.total_spent) - Number(orden.total)) }).eq("id", orden.supplier_id);
      }
    }
  }

  const { error } = await sb().from("ordenes_compra").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/compras");
  revalidatePath("/dashboard");
  revalidatePath("/productos");
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
