"use server";

import { createServerClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/actions/auth.actions";
import { productoSchema, type ProductoInput } from "@/lib/schemas/producto.schema";
import { categoriaSchema, type CategoriaInput } from "@/lib/schemas/categoria.schema";
import { revalidatePath } from "next/cache";
import type { Producto } from "@/types";

const PER_PAGE = 10;

function escapeLike(input: string): string {
  return input.replace(/[\\%_]/g, (m) => `\\${m}`);
}

function mapProductoRow(row: any): Producto {
  const { proveedor_productos, ...rest } = row;
  return {
    ...rest,
    proveedores: (proveedor_productos ?? [])
      .map((pp: any) => pp.proveedores)
      .filter(Boolean),
  } as Producto;
}

export interface GetProductosParams {
  search?: string;
  categoriaId?: string;
  frecuencia?: string;
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
  const auth = await requireAuth();
  if (auth.error) return { data: [], count: 0, totalPages: 0, page, error: auth.error };
  const supabase = await createServerClient();

  const from = (page - 1) * PER_PAGE;
  const to = from + PER_PAGE - 1;

  let query = supabase
    .from("productos")
    .select(
      "*, categorias:categoria_id(id,nombre,color), proveedor_productos(proveedores(id,company))",
      { count: "exact" },
    );

  if (params.search && params.search.trim()) {
    const term = escapeLike(params.search.trim());
    query = query.ilike("nombre", `%${term}%`);
  }
  if (params.categoriaId && params.categoriaId.trim()) {
    query = query.eq("categoria_id", params.categoriaId);
  }
  if (params.frecuencia && ["diario", "semanal", "mensual"].includes(params.frecuencia)) {
    query = query.eq("frecuencia_conteo", params.frecuencia);
  }

  const { data, error, count } = await query
    .order("nombre")
    .range(from, to);

  if (error) {
    return { data: [], count: 0, totalPages: 0, page, error: error.message };
  }

  const total = count ?? 0;
  return {
    data: (data ?? []).map(mapProductoRow),
    count: total,
    totalPages: Math.max(1, Math.ceil(total / PER_PAGE)),
    page,
    error: null,
  };
}

export async function getAllProductos(): Promise<{ data: Producto[]; error: string | null }> {
  const auth = await requireAuth();
  if (auth.error) return { data: [], error: auth.error };
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("productos")
    .select("*, categorias:categoria_id(id,nombre,color), proveedor_productos(proveedores(id,company))")
    .order("nombre");
  if (error) return { data: [], error: error.message };
  return { data: (data ?? []).map(mapProductoRow), error: null };
}

export async function getProductoById(
  id: string,
): Promise<{ data: Producto | null; error: string | null }> {
  const auth = await requireAuth();
  if (auth.error) return { data: null, error: auth.error };
  const supabase = await createServerClient();
  const { data, error } = await supabase
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
  const auth = await requireAuth();
  if (auth.error) return { data: null, error: auth.error };
  const parsed = productoSchema.safeParse(input);
  if (!parsed.success) return { data: null, error: "Datos inválidos" };
  const supabase = await createServerClient();

  const { count } = await supabase
    .from("productos")
    .select("id", { count: "exact", head: true })
    .ilike("nombre", parsed.data.nombre);
  if (count && count > 0)
    return { data: null, error: `Ya existe un producto con el nombre "${parsed.data.nombre}"` };

  const { supplier_ids, ...productoFields } = parsed.data;

  const { data, error } = await supabase
    .from("productos")
    .insert({ ...productoFields, stock_actual: 0 })
    .select("*, categorias:categoria_id(id,nombre,color)")
    .single();
  if (error) return { data: null, error: error.message };

  if (supplier_ids.length > 0) {
    await supabase
      .from("proveedor_productos")
      .insert(supplier_ids.map((sid) => ({ supplier_id: sid, product_id: data.id })));
  }

  revalidatePath("/productos");
  revalidatePath("/dashboard");
  return { data: data as unknown as Producto, error: null };
}

export async function updateProducto(
  id: string,
  input: ProductoInput,
): Promise<{ data: Producto | null; error: string | null }> {
  const auth = await requireAuth();
  if (auth.error) return { data: null, error: auth.error };
  const parsed = productoSchema.safeParse(input);
  if (!parsed.success) return { data: null, error: "Datos inválidos" };
  const supabase = await createServerClient();

  const { supplier_ids, ...productoFields } = parsed.data;

  const { data, error } = await supabase
    .from("productos")
    .update(productoFields)
    .eq("id", id)
    .select("*, categorias:categoria_id(id,nombre,color)")
    .single();
  if (error) return { data: null, error: error.message };

  // Sync supplier links: delete old, insert new
  await supabase.from("proveedor_productos").delete().eq("product_id", id);
  // NOTA: si el INSERT falla aquí, el producto queda sin
  // proveedores asignados temporalmente. El usuario puede
  // volver a editar para reasignar. No es crítico porque
  // proveedor_productos no afecta el stock ni los movimientos.
  if (supplier_ids.length > 0) {
    await supabase
      .from("proveedor_productos")
      .insert(supplier_ids.map((sid) => ({ supplier_id: sid, product_id: id })));
  }

  revalidatePath("/productos");
  revalidatePath("/dashboard");
  return { data: data as unknown as Producto, error: null };
}

export async function getProveedoresDeProducto(
  product_id: string,
): Promise<{ data: string[]; error: string | null }> {
  const auth = await requireAuth();
  if (auth.error) return { data: [], error: auth.error };
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("proveedor_productos")
    .select("supplier_id")
    .eq("product_id", product_id);
  if (error) return { data: [], error: error.message };
  return { data: (data ?? []).map((r: any) => r.supplier_id as string), error: null };
}

export async function deleteProducto(
  id: string,
): Promise<{ error: string | null }> {
  const auth = await requireAuth();
  if (auth.error) return { error: auth.error };
  const supabase = await createServerClient();
  const { count } = await supabase
    .from("movimientos")
    .select("*", { count: "exact", head: true })
    .eq("product_id", id);
  if (count && count > 0)
    return { error: "No puedes eliminar un producto con movimientos registrados" };

  const { error } = await supabase.from("productos").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/productos");
  revalidatePath("/dashboard");
  return { error: null };
}

export async function getCategorias() {
  const auth = await requireAuth();
  if (auth.error) return { data: null, error: auth.error };
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("categorias")
    .select("id,nombre,color,created_at")
    .order("nombre");
  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

export type { CategoriaInput };

export async function createCategoria(
  input: CategoriaInput,
): Promise<{ data: { id: string; nombre: string; color: string } | null; error: string | null }> {
  const auth = await requireAuth();
  if (auth.error) return { data: null, error: auth.error };
  const parsed = categoriaSchema.safeParse(input);
  if (!parsed.success) {
    return { data: null, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const supabase = await createServerClient();

  const { data, error } = await supabase
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

export async function quickUpdateFrecuencia(
  id: string,
  frecuencia: "diario" | "semanal" | "mensual",
): Promise<{ error: string | null }> {
  const auth = await requireAuth();
  if (auth.error) return { error: auth.error };
  const supabase = await createServerClient();
  const { error } = await supabase
    .from("productos")
    .update({ frecuencia_conteo: frecuencia })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/productos");
  return { error: null };
}

export async function deleteCategoria(
  id: string,
  targetCategoriaId?: string | null,
): Promise<{ error: string | null; affectedCount?: number; newCategoria?: { id: string; nombre: string; color: string } }> {
  const auth = await requireAuth();
  if (auth.error) return { error: auth.error };
  const supabase = await createServerClient();

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
