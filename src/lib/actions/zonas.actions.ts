"use server";

import { createServerClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/actions/auth.actions";
import { checkRateLimit } from "@/lib/ratelimit";
import {
  zonaSchema,
  conteoMultiZonaSchema,
  type ZonaInput,
  type ConteoMultiZonaInput,
} from "@/lib/schemas/zona.schema";
import { revalidatePath } from "next/cache";
import type { Zona, ConteoZonaItem, ConteoResumen, Producto } from "@/types";

export async function getZonas(): Promise<{ data: Zona[] | null; error: string | null }> {
  const auth = await requireAuth();
  if (auth.error) return { data: null, error: auth.error };
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("zonas")
    .select(
      "*, zona_productos(productos(*, categorias:categoria_id(id,nombre,color)))",
    )
    .order("nombre");

  if (error) return { data: null, error: error.message };

  const result: Zona[] = (data ?? []).map((row: any) => {
    const productos: Producto[] = (row.zona_productos ?? [])
      .map((zp: any) => zp.productos)
      .filter(Boolean);
    return {
      id: row.id,
      nombre: row.nombre,
      descripcion: row.descripcion ?? null,
      color: row.color,
      icono: row.icono,
      activo: row.activo,
      created_at: row.created_at,
      productos,
      total_productos: productos.length,
    };
  });

  return { data: result, error: null };
}

export async function getProductosDeZona(
  zonaId: string,
  frecuencia: "diario" | "semanal" | "mensual",
): Promise<{ data: ConteoZonaItem[]; error: string | null }> {
  const auth = await requireAuth();
  if (auth.error) return { data: [], error: auth.error };
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("productos")
    .select("id, nombre, unidad, stock_actual, zona_productos!inner(zona_id)")
    .eq("zona_productos.zona_id", zonaId)
    .eq("frecuencia_conteo", frecuencia)
    .order("nombre");

  if (error) return { data: [], error: error.message };

  const items: ConteoZonaItem[] = (data ?? []).map((p: any) => ({
    product_id: p.id,
    nombre: p.nombre,
    unidad: p.unidad,
    stock_actual: p.stock_actual,
    cantidad_contada: null,
  }));

  return { data: items, error: null };
}

export async function createZona(
  input: ZonaInput,
): Promise<{ data: Zona | null; error: string | null }> {
  const auth = await requireAuth();
  if (auth.error) return { data: null, error: auth.error };
  const parsed = zonaSchema.safeParse(input);
  if (!parsed.success) return { data: null, error: "Datos inválidos" };
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("zonas")
    .insert(parsed.data)
    .select("*")
    .single();
  if (error) return { data: null, error: error.message };

  revalidatePath("/conteo");
  return { data: { ...data, productos: [], total_productos: 0 }, error: null };
}

export async function updateZona(
  id: string,
  input: ZonaInput,
): Promise<{ error: string | null }> {
  const auth = await requireAuth();
  if (auth.error) return { error: auth.error };
  const parsed = zonaSchema.safeParse(input);
  if (!parsed.success) return { error: "Datos inválidos" };
  const supabase = await createServerClient();

  const { error } = await supabase.from("zonas").update(parsed.data).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/conteo");
  return { error: null };
}

export async function deleteZona(id: string): Promise<{ error: string | null }> {
  const auth = await requireAuth();
  if (auth.error) return { error: auth.error };
  const supabase = await createServerClient();

  const { count } = await supabase
    .from("zona_productos")
    .select("id", { count: "exact", head: true })
    .eq("zona_id", id);

  if (count && count > 0) {
    return {
      error:
        "No puedes eliminar una zona que tiene productos asignados. Quita los productos primero.",
    };
  }

  const { error } = await supabase.from("zonas").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/conteo");
  return { error: null };
}

export async function toggleZonaActivo(
  id: string,
  activo: boolean,
): Promise<{ error: string | null }> {
  const auth = await requireAuth();
  if (auth.error) return { error: auth.error };
  const supabase = await createServerClient();

  const { error } = await supabase.from("zonas").update({ activo }).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/conteo");
  return { error: null };
}

export async function asignarProductos(
  zonaId: string,
  productIds: string[],
): Promise<{ error: string | null }> {
  const auth = await requireAuth();
  if (auth.error) return { error: auth.error };
  const supabase = await createServerClient();

  const { error: delErr } = await supabase
    .from("zona_productos")
    .delete()
    .eq("zona_id", zonaId);
  if (delErr) return { error: delErr.message };

  if (productIds.length > 0) {
    const { error: insErr } = await supabase
      .from("zona_productos")
      .insert(productIds.map((productId) => ({ zona_id: zonaId, product_id: productId })));
    if (insErr) return { error: insErr.message };
  }

  revalidatePath("/conteo");
  return { error: null };
}

export async function procesarConteoMultiZona(
  input: ConteoMultiZonaInput,
): Promise<{ error: string | null; resumen?: ConteoResumen }> {
  const auth = await requireAuth();
  if (auth.error) return { error: auth.error };

  const rl = await checkRateLimit(`conteo:${auth.userId}`);
  if (!rl.success) return { error: "Demasiadas operaciones. Intenta en unos minutos." };

  const parsed = conteoMultiZonaSchema.safeParse(input);
  if (!parsed.success) return { error: "Datos inválidos" };

  const supabase = await createServerClient();
  const { frecuencia, totales } = parsed.data;

  // Orden determinístico de product_id para que los FOR UPDATE dentro del
  // RPC se adquieran siempre en el mismo orden entre llamadas concurrentes
  // y así se prevengan deadlocks.
  const sortedTotales = [...totales].sort((a, b) => a.product_id.localeCompare(b.product_id));

  const { data: rpcData, error: rpcErr } = await supabase.rpc("procesar_conteo_multizona", {
    p_totales: sortedTotales.map((t) => ({
      product_id: t.product_id,
      total_fisico: t.total_fisico,
    })),
    p_user_id: auth.userId,
    p_frecuencia: frecuencia,
  });

  if (rpcErr) return { error: rpcErr.message };

  const entradas = rpcData?.entradas ?? 0;
  const salidas = rpcData?.salidas ?? 0;
  const sin_cambio = rpcData?.sin_cambio ?? 0;

  revalidatePath("/conteo");
  revalidatePath("/productos");
  revalidatePath("/dashboard");
  revalidatePath("/reportes");

  return {
    error: null,
    resumen: { ajustados: entradas + salidas, entradas, salidas, sin_cambio },
  };
}

export async function getZonasPendientes(
  productIds: string[],
  frecuencia: "diario" | "semanal" | "mensual",
  zonasExcluidas: string[],
): Promise<{
  data: Array<{ id: string; nombre: string; color: string; icono: string }> | null;
  error: string | null;
}> {
  const auth = await requireAuth();
  if (auth.error) return { data: null, error: auth.error };
  if (productIds.length === 0) return { data: [], error: null };
  const supabase = await createServerClient();

  const { data, error } = await supabase.rpc("get_zonas_pendientes", {
    p_product_ids: productIds,
    p_frecuencia: frecuencia,
    p_zonas_excluidas: zonasExcluidas,
  });

  if (error) return { data: null, error: error.message };
  return { data: data ?? [], error: null };
}
