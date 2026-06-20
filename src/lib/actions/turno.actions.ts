"use server";

import { createServerClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/actions/auth.actions";
import { checkRateLimit } from "@/lib/ratelimit";
import { cierreTurnoSchema, type CierreTurnoInput } from "@/lib/schemas/turno.schema";
import { revalidatePath } from "next/cache";
import type { CierreTurnoResumen, ConteoFisico, Producto } from "@/types";

export async function createCierreTurno(
  input: CierreTurnoInput,
): Promise<{ error: string | null; resumen?: CierreTurnoResumen }> {
  const auth = await requireAuth();
  if (auth.error) return { error: auth.error };

  const rl = await checkRateLimit(`cierre:${auth.userId}`);
  if (!rl.success) return { error: "Demasiadas operaciones. Intenta en unos minutos." };

  const parsed = cierreTurnoSchema.safeParse(input);
  if (!parsed.success) return { error: "Datos inválidos" };

  const supabase = await createServerClient();
  const { items, fecha, tipo } = parsed.data;
  const productIds = items.map((i) => i.product_id);

  const { error: rpcErr } = await supabase.rpc("procesar_cierre_turno", {
    p_items: items.map((i) => ({
      product_id:    i.product_id,
      qty_consumida: i.qty_consumida,
      qty_fisica:    i.qty_fisica,
      notas:         i.notas ?? null,
    })),
    p_user_id: auth.userId,
    p_tipo:    tipo,
  });

  if (rpcErr) return { error: rpcErr.message };

  // Fetch fresh DB state after the RPC — never use client-supplied stock/price values
  const [{ data: dbProductos }, { data: dbConteos }] = await Promise.all([
    supabase
      .from("productos")
      .select("id, nombre, stock_actual, stock_minimo, last_price")
      .in("id", productIds),
    supabase
      .from("conteos_fisicos")
      .select("product_id, diferencia, qty_teorica")
      .eq("user_id", auth.userId)
      .eq("fecha", fecha)
      .eq("tipo_conteo", tipo)
      .in("product_id", productIds),
  ]);

  const prodMap = new Map((dbProductos ?? []).map((p) => [p.id, p]));

  const total_consumido_valor = items.reduce((sum, item) => {
    const prod = prodMap.get(item.product_id);
    return sum + item.qty_consumida * (prod?.last_price ?? 0);
  }, 0);

  const diferencias_detectadas = (dbConteos ?? []).filter((c) => {
    const dif = Number(c.diferencia);
    const teorica = Number(c.qty_teorica);
    return dif < -0.5 && teorica > 0 && Math.abs(dif) / teorica > 0.15;
  }).length;

  const productos_bajo_minimo = (dbProductos ?? [])
    .filter((p) => Number(p.stock_actual) < Number(p.stock_minimo))
    .map((p) => p.nombre);

  revalidatePath("/turno");
  revalidatePath("/dashboard");
  revalidatePath("/productos");
  revalidatePath("/reportes");

  return {
    error: null,
    resumen: { total_consumido_valor, diferencias_detectadas, productos_bajo_minimo },
  };
}

export async function getProductosParaCierre(): Promise<{
  data: Producto[] | null;
  error: string | null;
}> {
  const auth = await requireAuth();
  if (auth.error) return { data: null, error: auth.error };

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("productos")
    .select(
      "id, nombre, unidad, stock_actual, stock_minimo, last_price, frecuencia_conteo, imagen_url, categoria_id, created_at, categorias:categoria_id(id, nombre, color)",
    )
    .eq("frecuencia_conteo", "diario")
    .order("nombre", { ascending: true });

  if (error) return { data: null, error: error.message };
  return { data: data as unknown as Producto[], error: null };
}

export async function getHistorialCierres(
  dias: number,
  tipo: ConteoFisico["tipo_conteo"] = "diario",
): Promise<{ data: ConteoFisico[] | null; error: string | null }> {
  const auth = await requireAuth();
  if (auth.error) return { data: null, error: auth.error };

  const desde = new Date(Date.now() - dias * 86_400_000).toISOString().split("T")[0];

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("conteos_fisicos")
    .select("*, productos:product_id(id, nombre, unidad)")
    .gte("fecha", desde)
    .eq("tipo_conteo", tipo)
    .order("fecha", { ascending: false })
    .order("productos(nombre)", { ascending: true });

  if (error) return { data: null, error: error.message };
  return { data: data as unknown as ConteoFisico[], error: null };
}
