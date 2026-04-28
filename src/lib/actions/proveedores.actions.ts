"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { proveedorSchema, type ProveedorInput } from "@/lib/schemas/proveedor.schema";
import { revalidatePath } from "next/cache";
import type { Proveedor } from "@/types";

const sb = () => createAdminClient();

export async function getProveedores(): Promise<{ data: Proveedor[] | null; error: string | null }> {
  const { data, error } = await sb()
    .from("proveedores")
    .select("*")
    .order("company");
  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

export async function getProveedorById(
  id: string,
): Promise<{ data: (Proveedor & { productos: { id: string; nombre: string }[] }) | null; error: string | null }> {
  const { data, error } = await sb()
    .from("proveedores")
    .select("*, proveedor_productos(product_id, productos(id,nombre))")
    .eq("id", id)
    .single();
  if (error) return { data: null, error: error.message };

  const productos = ((data as any).proveedor_productos ?? []).map(
    (pp: any) => pp.productos,
  );
  return { data: { ...data, productos } as any, error: null };
}

export async function createProveedor(
  input: ProveedorInput,
  productIds: string[] = [],
): Promise<{ data: Proveedor | null; error: string | null }> {
  const parsed = proveedorSchema.safeParse(input);
  if (!parsed.success) return { data: null, error: "Datos inválidos" };

  const { data, error } = await sb()
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

  if (productIds.length > 0) {
    await sb()
      .from("proveedor_productos")
      .insert(productIds.map((pid) => ({ supplier_id: data.id, product_id: pid })));
  }

  revalidatePath("/proveedores");
  return { data, error: null };
}

export async function updateProveedor(
  id: string,
  input: ProveedorInput,
  productIds: string[] = [],
): Promise<{ data: Proveedor | null; error: string | null }> {
  const parsed = proveedorSchema.safeParse(input);
  if (!parsed.success) return { data: null, error: "Datos inválidos" };

  const { data, error } = await sb()
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

  // Sync product links
  await sb().from("proveedor_productos").delete().eq("supplier_id", id);
  if (productIds.length > 0) {
    await sb()
      .from("proveedor_productos")
      .insert(productIds.map((pid) => ({ supplier_id: id, product_id: pid })));
  }

  revalidatePath("/proveedores");
  return { data, error: null };
}

export async function toggleActivo(
  id: string,
): Promise<{ error: string | null }> {
  const { data: prov } = await sb()
    .from("proveedores")
    .select("activo")
    .eq("id", id)
    .single();
  if (!prov) return { error: "Proveedor no encontrado" };

  const { error } = await sb()
    .from("proveedores")
    .update({ activo: !prov.activo })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/proveedores");
  return { error: null };
}

export async function deleteProveedor(
  id: string,
): Promise<{ error: string | null }> {
  const { count } = await sb()
    .from("ordenes_compra")
    .select("*", { count: "exact", head: true })
    .eq("supplier_id", id);
  if (count && count > 0)
    return { error: "No puedes eliminar un proveedor con órdenes de compra registradas" };

  const { error } = await sb().from("proveedores").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/proveedores");
  return { error: null };
}
