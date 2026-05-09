"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireAuth } from "@/lib/actions/auth.actions";
import { productoSchema, type ProductoInput } from "@/lib/schemas/producto.schema";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { Producto } from "@/types";

const sb = () => createAdminClient();

const PER_PAGE = 10;

function escapeLike(input: string): string {
  return input.replace(/[\\%_]/g, (m) => `\\${m}`);
}

export interface GetProductosParams {
  search?: string;
  categoriaId?: string;
  page?: number;
}

export interface GetProductosResult {
  data: Producto[];
  count: number;
  totalPages: number;
  page: number;
  error: string | null;
}

export async function getProductos(
  params: GetProductosParams = {},
): Promise<GetProductosResult> {
  const page = Math.max(1, params.page ?? 1);
  const from = (page - 1) * PER_PAGE;
  const to = from + PER_PAGE - 1;

  let query = sb()
    .from("productos")
    .select("*, categorias:categoria_id(id,nombre,color)", { count: "exact" });

  if (params.search && params.search.trim()) {
    const term = escapeLike(params.search.trim());
    query = query.ilike("nombre", `%${term}%`);
  }
  if (params.categoriaId && params.categoriaId.trim()) {
    query = query.eq("categoria_id", params.categoriaId);
  }

  const { data, error, count } = await query
    .order("nombre")
    .range(from, to);

  if (error) {
    return { data: [], count: 0, totalPages: 0, page, error: error.message };
  }

  const total = count ?? 0;
  return {
    data: (data ?? []) as unknown as Producto[],
    count: total,
    totalPages: Math.max(1, Math.ceil(total / PER_PAGE)),
    page,
    error: null,
  };
}

export async function getProductoById(
  id: string,
): Promise<{ data: Producto | null; error: string | null }> {
  const { data, error } = await sb()
    .from("productos")
    .select("*, categorias:categoria_id(id,nombre,color)")
    .eq("id", id)
    .single();
  if (error) return { data: null, error: error.message };
  return { data: data as unknown as Producto, error: null };
}

export async function createProducto(
  input: ProductoInput,
): Promise<{ data: Producto | null; error: string | null }> {
  const authErr = await requireAuth();
  if (authErr) return { data: null, error: authErr.error };
  const parsed = productoSchema.safeParse(input);
  if (!parsed.success) return { data: null, error: "Datos inválidos" };

  const { count } = await sb()
    .from("productos")
    .select("id", { count: "exact", head: true })
    .ilike("nombre", parsed.data.nombre);
  if (count && count > 0)
    return { data: null, error: `Ya existe un producto con el nombre "${parsed.data.nombre}"` };

  const { data, error } = await sb()
    .from("productos")
    .insert({ ...parsed.data, stock_actual: 0 })
    .select("*, categorias:categoria_id(id,nombre,color)")
    .single();
  if (error) return { data: null, error: error.message };

  revalidatePath("/productos");
  revalidatePath("/dashboard");
  return { data: data as unknown as Producto, error: null };
}

export async function updateProducto(
  id: string,
  input: ProductoInput,
): Promise<{ data: Producto | null; error: string | null }> {
  const authErr = await requireAuth();
  if (authErr) return { data: null, error: authErr.error };
  const parsed = productoSchema.safeParse(input);
  if (!parsed.success) return { data: null, error: "Datos inválidos" };

  const { data, error } = await sb()
    .from("productos")
    .update(parsed.data)
    .eq("id", id)
    .select("*, categorias:categoria_id(id,nombre,color)")
    .single();
  if (error) return { data: null, error: error.message };

  revalidatePath("/productos");
  revalidatePath("/dashboard");
  return { data: data as unknown as Producto, error: null };
}

export async function deleteProducto(
  id: string,
): Promise<{ error: string | null }> {
  const authErr = await requireAuth();
  if (authErr) return { error: authErr.error };
  const { count } = await sb()
    .from("movimientos")
    .select("*", { count: "exact", head: true })
    .eq("product_id", id);
  if (count && count > 0)
    return { error: "No puedes eliminar un producto con movimientos registrados" };

  const { error } = await sb().from("productos").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/productos");
  revalidatePath("/dashboard");
  return { error: null };
}

export async function getAllProductos(): Promise<{
  data: Producto[];
  error: string | null;
}> {
  const { data, error } = await sb()
    .from("productos")
    .select("*, categorias:categoria_id(id,nombre,color)")
    .order("nombre");
  if (error) return { data: [], error: error.message };
  return { data: (data ?? []) as unknown as Producto[], error: null };
}

export async function getCategorias() {
  const { data, error } = await sb()
    .from("categorias")
    .select("id,nombre,color,created_at")
    .order("nombre");
  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

const categoriaSchema = z.object({
  nombre: z.string().trim().min(2, "Nombre mínimo 2 caracteres").max(40, "Máximo 40 caracteres"),
  color: z
    .string()
    .regex(/^#([0-9A-Fa-f]{6})$/, "Color hex inválido (formato #RRGGBB)"),
});

export type CategoriaInput = z.infer<typeof categoriaSchema>;

export async function createCategoria(
  input: CategoriaInput,
): Promise<{ data: { id: string; nombre: string; color: string } | null; error: string | null }> {
  const authErr = await requireAuth();
  if (authErr) return { data: null, error: authErr.error };
  const parsed = categoriaSchema.safeParse(input);
  if (!parsed.success) {
    return { data: null, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const { data, error } = await sb()
    .from("categorias")
    .insert(parsed.data)
    .select("id,nombre,color")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { data: null, error: "Ya existe una categoría con ese nombre" };
    }
    return { data: null, error: error.message };
  }

  revalidatePath("/productos");
  return { data, error: null };
}

export async function deleteCategoria(
  id: string,
  targetCategoriaId?: string | null,
): Promise<{ error: string | null; affectedCount?: number; newCategoria?: { id: string; nombre: string; color: string } }> {
  const authErr = await requireAuth();
  if (authErr) return { error: authErr.error };
  const supabase = sb();

  // Contar productos usando esta categoría
  const { count } = await supabase
    .from("productos")
    .select("id", { count: "exact", head: true })
    .eq("categoria_id", id);

  // Si hay productos vinculados y no se indicó destino, informar para que el usuario elija
  if (count && count > 0 && targetCategoriaId === undefined) {
    return { error: null, affectedCount: count };
  }

  // Reasignar productos al destino elegido
  if (count && count > 0 && targetCategoriaId !== undefined) {
    const { error: updateErr } = await supabase
      .from("productos")
      .update({ categoria_id: targetCategoriaId })
      .eq("categoria_id", id);
    if (updateErr) return { error: updateErr.message };
  }

  const { error } = await supabase.from("categorias").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/productos");
  return { error: null, affectedCount: 0 };
}
