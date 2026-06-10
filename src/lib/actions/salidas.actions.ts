"use server";

import { createServerClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/actions/auth.actions";
import { checkRateLimit } from "@/lib/ratelimit";
import { consumoSchema, mermaSchema, type ConsumoInput, type MermaInput } from "@/lib/schemas/salida.schema";
import { revalidatePath } from "next/cache";
import type { Movimiento } from "@/types";

export async function getMovimientos(
  tipo?: "entrada" | "salida" | "merma",
  limit = 200,
): Promise<{ data: Movimiento[] | null; error: string | null }> {
  const auth = await requireAuth();
  if (auth.error) return { data: null, error: auth.error };
  const supabase = await createServerClient();
  let query = supabase
    .from("movimientos")
    .select("*, productos:product_id(id,nombre,unidad,last_price,categoria_id,categorias:categoria_id(id,nombre,color))")
    .order("fecha", { ascending: false })
    .limit(limit);
  if (tipo) query = query.eq("tipo", tipo);

  const { data, error } = await query;
  if (error) return { data: null, error: error.message };
  return { data: data as unknown as Movimiento[], error: null };
}

export async function createConsumo(
  input: ConsumoInput,
): Promise<{ data: Movimiento | null; error: string | null }> {
  const auth = await requireAuth();
  if (auth.error) return { data: null, error: auth.error };

  const rl = await checkRateLimit(`consumo:${auth.userId}`);
  if (!rl.success) return { data: null, error: "Demasiadas operaciones. Intenta en unos minutos." };

  const parsed = consumoSchema.safeParse(input);
  if (!parsed.success) return { data: null, error: "Datos inválidos" };
  const supabase = await createServerClient();

  const { data: prod } = await supabase
    .from("productos")
    .select("stock_actual,nombre,last_price,unidad")
    .eq("id", parsed.data.product_id)
    .single();
  if (!prod) return { data: null, error: "Producto no encontrado" };
  if (prod.stock_actual < parsed.data.qty)
    return { data: null, error: `Stock insuficiente. Disponible: ${prod.stock_actual} ${prod.unidad}` };

  const fecha = parsed.data.fecha ?? new Date().toISOString().split("T")[0];

  const { data: mov, error } = await supabase
    .from("movimientos")
    .insert({
      product_id: parsed.data.product_id,
      tipo: "salida",
      qty: parsed.data.qty,
      fecha,
      user_id: auth.userId,
      notes: parsed.data.notes || null,
    })
    .select("*, productos:product_id(id,nombre,unidad,last_price,categoria_id,categorias:categoria_id(id,nombre,color))")
    .single();
  if (error) {
    if (error.code === "P0001" || error.message.includes("Stock insuficiente"))
      return { data: null, error: `Stock insuficiente. Disponible: ${prod.stock_actual} ${prod.unidad}` };
    return { data: null, error: error.message };
  }

  revalidatePath("/salidas");
  revalidatePath("/dashboard");
  revalidatePath("/productos");
  return { data: mov as unknown as Movimiento, error: null };
}

export async function createMerma(
  input: MermaInput,
): Promise<{ data: Movimiento | null; error: string | null }> {
  const auth = await requireAuth();
  if (auth.error) return { data: null, error: auth.error };

  const rl = await checkRateLimit(`merma:${auth.userId}`);
  if (!rl.success) return { data: null, error: "Demasiadas operaciones. Intenta en unos minutos." };

  const parsed = mermaSchema.safeParse(input);
  if (!parsed.success) return { data: null, error: "Datos inválidos" };
  const supabase = await createServerClient();

  const { data: prod } = await supabase
    .from("productos")
    .select("stock_actual,nombre,last_price,unidad")
    .eq("id", parsed.data.product_id)
    .single();
  if (!prod) return { data: null, error: "Producto no encontrado" };
  if (prod.stock_actual < parsed.data.qty)
    return { data: null, error: `Stock insuficiente. Disponible: ${prod.stock_actual} ${prod.unidad}` };

  const value_lost = parsed.data.qty * Number(prod.last_price);
  const fecha = parsed.data.fecha ?? new Date().toISOString().split("T")[0];

  const { data: mov, error } = await supabase
    .from("movimientos")
    .insert({
      product_id: parsed.data.product_id,
      tipo: "merma",
      qty: parsed.data.qty,
      fecha,
      user_id: auth.userId,
      notes: parsed.data.notes || null,
      motivo_merma: parsed.data.motivo_merma,
      value_lost,
    })
    .select("*, productos:product_id(id,nombre,unidad,last_price,categoria_id,categorias:categoria_id(id,nombre,color))")
    .single();
  if (error) {
    if (error.code === "P0001" || error.message.includes("Stock insuficiente"))
      return { data: null, error: `Stock insuficiente. Disponible: ${prod.stock_actual} ${prod.unidad}` };
    return { data: null, error: error.message };
  }

  revalidatePath("/salidas");
  revalidatePath("/dashboard");
  revalidatePath("/productos");
  return { data: mov as unknown as Movimiento, error: null };
}

export async function anularMovimiento(id: string): Promise<{ error: string | null }> {
  const auth = await requireAuth();
  if (auth.error) return { error: auth.error };
  const supabase = await createServerClient();
  const { data: mov } = await supabase
    .from("movimientos")
    .select("tipo,qty,product_id,fecha")
    .eq("id", id)
    .single();

  if (!mov) return { error: "Movimiento no encontrado" };
  if (mov.tipo === "entrada") return { error: "No se puede anular una entrada" };

  const { error } = await supabase
    .from("movimientos")
    .insert({
      product_id: mov.product_id,
      tipo: "entrada",
      qty: mov.qty,
      fecha: new Date().toISOString().split("T")[0],
      user_id: auth.userId,
      notes: `Anulación de ${mov.tipo} (ref: ${id})`,
      ref_id: id,
    });

  if (error) return { error: error.message };

  revalidatePath("/salidas");
  revalidatePath("/dashboard");
  revalidatePath("/productos");
  return { error: null };
}
