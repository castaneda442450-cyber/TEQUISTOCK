"use server";

import { createServerClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/actions/auth.actions";
import { checkRateLimit } from "@/lib/ratelimit";
import { ordenSchema, updateOrdenSchema, type OrdenInput, type UpdateOrdenInput } from "@/lib/schemas/compra.schema";
import { revalidatePath } from "next/cache";
import type { OrdenCompra } from "@/types";

async function nextFolio(supabase: Awaited<ReturnType<typeof createServerClient>>): Promise<string> {
  const year = new Date().getFullYear();
  const { count } = await supabase
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
  const auth = await requireAuth();
  if (auth.error) return { data: null, error: auth.error };
  const supabase = await createServerClient();
  const { desde, hasta, supplier_id, limit = 200 } = opts;

  let query = supabase
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
  return { data: (data as any[]).map(remapOrden), error: null };
}

export async function getOrdenById(
  id: string,
): Promise<{ data: OrdenCompra | null; error: string | null }> {
  const auth = await requireAuth();
  if (auth.error) return { data: null, error: auth.error };
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("ordenes_compra")
    .select(
      "*, proveedores:supplier_id(id,company), detalle_orden(id,product_id,qty,price,subtotal,productos:product_id(id,nombre,unidad,categoria_id,categorias:categoria_id(id,nombre,color)))",
    )
    .eq("id", id)
    .single();
  if (error) return { data: null, error: error.message };
  return { data: remapOrden(data as any), error: null };
}

function remapOrden(row: any): OrdenCompra {
  return {
    ...row,
    proveedor: row.proveedores ?? null,
    detalles: (row.detalle_orden ?? []).map((d: any) => ({
      ...d,
      producto: d.productos ?? null,
    })),
  };
}

export async function createOrden(
  input: OrdenInput,
): Promise<{ data: OrdenCompra | null; error: string | null }> {
  const auth = await requireAuth();
  if (auth.error) return { data: null, error: auth.error };

  const rl = await checkRateLimit(`orden:${auth.userId}`);
  if (!rl.success) return { data: null, error: "Demasiadas operaciones. Intenta en unos minutos." };

  const parsed = ordenSchema.safeParse(input);
  if (!parsed.success) return { data: null, error: "Datos inválidos" };
  const supabase = await createServerClient();

  const { supplier_id, fecha, detalles, has_invoice, invoice_url, folio: folioInput } = parsed.data;
  const folio = folioInput?.trim() || (await nextFolio(supabase));
  const fechaNorm = fecha.slice(0, 10);

  // Single atomic RPC: orden + detalles + movimientos + total_spent + last_price
  const { data: rpcResult, error: rpcErr } = await supabase.rpc("crear_orden_compra", {
    p_supplier_id: supplier_id,
    p_fecha: fechaNorm,
    p_folio: folio,
    p_detalles: detalles.map((d) => ({ product_id: d.product_id, qty: d.qty, price: d.price })),
    p_has_invoice: has_invoice ?? false,
    p_invoice_url: invoice_url ?? null,
    p_user_id: auth.userId,
  });
  if (rpcErr) return { data: null, error: rpcErr.message };

  // If invoice_url was passed separately after upload, patch it now
  const ordenId = (rpcResult as any).orden_id as string;

  revalidatePath("/compras");
  revalidatePath("/dashboard");
  revalidatePath("/productos");
  return getOrdenById(ordenId);
}

export async function updateOrden(
  id: string,
  input: UpdateOrdenInput,
): Promise<{ data: OrdenCompra | null; error: string | null }> {
  const auth = await requireAuth();
  if (auth.error) return { data: null, error: auth.error };
  const parsed = updateOrdenSchema.safeParse(input);
  if (!parsed.success) return { data: null, error: "Datos inválidos" };
  const supabase = await createServerClient();

  const { supplier_id, fecha, detalles, has_invoice, invoice_url, folio } = parsed.data;

  // Fetch current order for rollback calculations
  const { data: currentOrden } = await supabase
    .from("ordenes_compra")
    .select("supplier_id,total,folio")
    .eq("id", id)
    .single();
  if (!currentOrden) return { data: null, error: "Orden no encontrada" };

  // 1. Delete old movimientos entrada (trigger reverses stock)
  await supabase.from("movimientos").delete().eq("ref_id", id).eq("tipo", "entrada");

  // 2. Delete old detalles
  await supabase.from("detalle_orden").delete().eq("orden_id", id);

  // 3. Insert new detalles
  if (detalles && detalles.length > 0) {
    const { error: dErr } = await supabase
      .from("detalle_orden")
      .insert(detalles.map((d) => ({ orden_id: id, product_id: d.product_id, qty: d.qty, price: d.price })));
    if (dErr) return { data: null, error: dErr.message };

    // 4. Insert new movimientos entrada
    const newFolio = folio?.trim() || currentOrden.folio;
    const { error: mErr } = await supabase
      .from("movimientos")
      .insert(
        detalles.map((d) => ({
          product_id: d.product_id,
          tipo: "entrada",
          qty: d.qty,
          fecha: fecha ?? new Date().toISOString().split("T")[0],
          user_id: auth.userId,
          notes: `Compra ${newFolio}`,
          ref_id: id,
        })),
      );
    if (mErr) return { data: null, error: mErr.message };

    // 5. Update last_price
    for (const d of detalles) {
      await supabase.from("productos").update({ last_price: d.price }).eq("id", d.product_id);
    }
  }

  // 6. Update total_spent on proveedor (reverse old, add new)
  const newTotal = detalles ? detalles.reduce((s, d) => s + d.qty * d.price, 0) : Number(currentOrden.total);
  const effectiveSupplierId = supplier_id ?? currentOrden.supplier_id;
  const { data: prov } = await supabase.from("proveedores").select("total_spent").eq("id", effectiveSupplierId).single();
  if (prov) {
    const adjusted = Math.max(0, Number(prov.total_spent) - Number(currentOrden.total)) + newTotal;
    await supabase.from("proveedores").update({ total_spent: adjusted }).eq("id", effectiveSupplierId);
  }

  // 7. Update orden fields
  const updateFields: Record<string, unknown> = { total: newTotal };
  if (supplier_id) updateFields.supplier_id = supplier_id;
  if (fecha) updateFields.fecha = fecha;
  if (folio?.trim()) updateFields.folio = folio.trim();
  if (has_invoice !== undefined) updateFields.has_invoice = has_invoice;
  if (invoice_url !== undefined) updateFields.invoice_url = invoice_url;

  const { error: uErr } = await supabase
    .from("ordenes_compra")
    .update(updateFields)
    .eq("id", id)
    .select("*")
    .single();
  if (uErr) return { data: null, error: uErr.message };

  revalidatePath("/compras");
  revalidatePath("/dashboard");
  revalidatePath("/productos");
  return getOrdenById(id);
}

export async function deleteOrden(id: string): Promise<{ error: string | null }> {
  const auth = await requireAuth();
  if (auth.error) return { error: auth.error };
  const supabase = await createServerClient();
  const { data: orden } = await supabase
    .from("ordenes_compra")
    .select("supplier_id,total,invoice_url")
    .eq("id", id)
    .single();

  // Delete movimientos entrada (trigger reverses stock)
  await supabase.from("movimientos").delete().eq("ref_id", id).eq("tipo", "entrada");

  // Reverse total_spent on proveedor
  if (orden) {
    const { data: prov } = await supabase.from("proveedores").select("total_spent").eq("id", orden.supplier_id).single();
    if (prov) {
      await supabase
        .from("proveedores")
        .update({ total_spent: Math.max(0, Number(prov.total_spent) - Number(orden.total)) })
        .eq("id", orden.supplier_id);
    }

    // Delete invoice from Storage if present
    if (orden.invoice_url) {
      await supabase.storage.from("facturas").remove([orden.invoice_url]);
    }
  }

  const { error } = await supabase.from("ordenes_compra").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/compras");
  revalidatePath("/dashboard");
  revalidatePath("/productos");
  return { error: null };
}

const ALLOWED_MIME = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

async function detectMagicBytes(file: File): Promise<boolean> {
  const buf = new Uint8Array(await file.slice(0, 4).arrayBuffer());
  const isPdf = buf[0] === 0x25 && buf[1] === 0x50; // %P
  const isJpg = buf[0] === 0xFF && buf[1] === 0xD8;
  const isPng = buf[0] === 0x89 && buf[1] === 0x50;
  const isWebp = buf[0] === 0x52 && buf[1] === 0x49; // RI (RIFF)
  return isPdf || isJpg || isPng || isWebp;
}

export async function uploadFactura(
  formData: FormData,
): Promise<{ path: string | null; error: string | null }> {
  const auth = await requireAuth();
  if (auth.error) return { path: null, error: auth.error };
  const file = formData.get("file") as File | null;
  if (!file) return { path: null, error: "No se recibió archivo" };

  if (!ALLOWED_MIME.has(file.type))
    return { path: null, error: "Tipo no permitido. Solo PDF, JPG, PNG o WEBP." };
  if (file.size > MAX_BYTES)
    return { path: null, error: "El archivo excede 10 MB." };
  if (!(await detectMagicBytes(file)))
    return { path: null, error: "El archivo no corresponde a su extensión declarada." };

  const supabase = await createServerClient();
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${timestamp}_${safeName}`;

  const { error } = await supabase
    .storage
    .from("facturas")
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error) return { path: null, error: error.message };
  return { path, error: null };
}

export async function deleteFactura(path: string): Promise<{ error: string | null }> {
  const auth = await requireAuth();
  if (auth.error) return { error: auth.error };
  const supabase = await createServerClient();
  const { error } = await supabase.storage.from("facturas").remove([path]);
  if (error) return { error: error.message };
  return { error: null };
}

export async function getFacturaSignedUrl(
  path: string,
): Promise<{ url: string | null; error: string | null }> {
  const auth = await requireAuth();
  if (auth.error) return { url: null, error: auth.error };
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .storage
    .from("facturas")
    .createSignedUrl(path, 3600);
  if (error) return { url: null, error: error.message };
  return { url: data.signedUrl, error: null };
}
