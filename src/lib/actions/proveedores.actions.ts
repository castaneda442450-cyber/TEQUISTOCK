"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { proveedorSchema, type ProveedorInput } from "@/lib/schemas/proveedor.schema";
import { revalidatePath } from "next/cache";
import type { Proveedor, OrdenCompra } from "@/types";

const sb = () => createAdminClient();

function escapeLike(input: string): string {
  return input.replace(/[\\%_]/g, (m) => `\\${m}`);
}

export async function getProveedores(
  search?: string,
): Promise<{ data: Proveedor[] | null; error: string | null }> {
  let query = sb()
    .from("proveedores")
    .select(
      "*, proveedor_productos(product_id), ordenes_compra(id)",
    )
    .order("company");

  if (search && search.trim()) {
    const term = escapeLike(search.trim());
    query = query.or(`company.ilike.%${term}%,contact.ilike.%${term}%`);
  }

  const { data, error } = await query;
  if (error) return { data: null, error: error.message };

  const result: Proveedor[] = (data ?? []).map((row: any) => {
    const ppRows: any[] = row.proveedor_productos ?? [];
    const ocRows: any[] = row.ordenes_compra ?? [];
    return {
      id: row.id,
      company: row.company,
      contact: row.contact ?? "",
      email: row.email ?? null,
      phone: row.phone ?? null,
      address: row.address ?? null,
      total_spent: row.total_spent ?? 0,
      activo: row.activo ?? true,
      created_at: row.created_at,
      productos_count: ppRows.length,
      compras_count: ocRows.length,
      producto_ids: ppRows.map((pp: any) => pp.product_id),
    };
  });

  return { data: result, error: null };
}

export async function getProveedorOrdenes(
  supplierId: string,
): Promise<{ data: OrdenCompra[] | null; error: string | null }> {
  const { data, error } = await sb()
    .from("ordenes_compra")
    .select("id, folio, supplier_id, fecha, total, has_invoice, invoice_url, created_at")
    .eq("supplier_id", supplierId)
    .order("fecha", { ascending: false });

  if (error) return { data: null, error: error.message };
  return { data: (data ?? []) as unknown as OrdenCompra[], error: null };
}

export async function createProveedor(
  input: ProveedorInput,
): Promise<{ data: Proveedor | null; error: string | null }> {
  const supabase = sb();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { data: null, error: "No autorizado" };

  const parsed = proveedorSchema.safeParse(input);
  if (!parsed.success)
    return { data: null, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const { data, error } = await supabase
    .from("proveedores")
    .insert({
      company: parsed.data.company,
      contact: parsed.data.contact,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      address: parsed.data.address || null,
      total_spent: 0,
      activo: true,
    })
    .select("*")
    .single();

  if (error) return { data: null, error: error.message };

  const productIds = parsed.data.producto_ids ?? [];
  if (productIds.length > 0) {
    await supabase
      .from("proveedor_productos")
      .insert(productIds.map((pid: string) => ({ supplier_id: data.id, product_id: pid })));
  }

  revalidatePath("/proveedores");

  const newProveedor: Proveedor = {
    ...data,
    productos_count: productIds.length,
    compras_count: 0,
    producto_ids: productIds,
  };
  return { data: newProveedor, error: null };
}

export async function updateProveedor(
  id: string,
  input: ProveedorInput,
): Promise<{ data: Proveedor | null; error: string | null }> {
  const supabase = sb();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { data: null, error: "No autorizado" };

  const parsed = proveedorSchema.safeParse(input);
  if (!parsed.success)
    return { data: null, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const { data, error } = await supabase
    .from("proveedores")
    .update({
      company: parsed.data.company,
      contact: parsed.data.contact,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      address: parsed.data.address || null,
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) return { data: null, error: error.message };

  // Sync product links: delete old, insert new
  await supabase.from("proveedor_productos").delete().eq("supplier_id", id);
  const productIds = parsed.data.producto_ids ?? [];
  if (productIds.length > 0) {
    await supabase
      .from("proveedor_productos")
      .insert(productIds.map((pid: string) => ({ supplier_id: id, product_id: pid })));
  }

  // Get compras_count to preserve it
  const { count: comprasCount } = await supabase
    .from("ordenes_compra")
    .select("*", { count: "exact", head: true })
    .eq("supplier_id", id);

  revalidatePath("/proveedores");

  const updated: Proveedor = {
    ...data,
    productos_count: productIds.length,
    compras_count: comprasCount ?? 0,
    producto_ids: productIds,
  };
  return { data: updated, error: null };
}

export async function deleteProveedor(
  id: string,
): Promise<{ error: string | null }> {
  const supabase = sb();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autorizado" };

  const { count } = await supabase
    .from("ordenes_compra")
    .select("*", { count: "exact", head: true })
    .eq("supplier_id", id);

  if (count && count > 0)
    return {
      error: "No puedes eliminar un proveedor con órdenes de compra registradas",
    };

  // Remove product associations first
  await supabase.from("proveedor_productos").delete().eq("supplier_id", id);

  const { error } = await supabase.from("proveedores").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/proveedores");
  return { error: null };
}

export async function toggleActivo(id: string): Promise<{ error: string | null }> {
  const supabase = sb();
  const { data: prov } = await supabase
    .from("proveedores")
    .select("activo")
    .eq("id", id)
    .single();
  if (!prov) return { error: "Proveedor no encontrado" };

  const { error } = await supabase
    .from("proveedores")
    .update({ activo: !prov.activo })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/proveedores");
  return { error: null };
}
