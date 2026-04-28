"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { consumoSchema, mermaSchema, type ConsumoInput, type MermaInput } from "@/lib/schemas/salida.schema";
import { revalidatePath } from "next/cache";
import type { Movimiento } from "@/types";

const sb = () => createAdminClient();
const CARLOS_USER_ID = "00000000-0000-0000-0000-000000000001";

export async function getMovimientos(
  tipo?: "entrada" | "salida" | "merma",
  limit = 100,
): Promise<{ data: Movimiento[] | null; error: string | null }> {
  let query = sb()
    .from("movimientos")
    .select("*, productos:product_id(id,nombre,unidad,last_price,categoria_id,categorias:categoria_id(nombre,color))")
    .order("fecha", { ascending: false })
    .limit(limit);
  if (tipo) query = query.eq("tipo", tipo);

  const { data, error } = await query;
  if (error) return { data: null, error: error.message };
  return { data: data as unknown as Movimiento[], error: null };
}

export async function createConsumo(
  input: ConsumoInput,
): Promise<{ error: string | null }> {
  const parsed = consumoSchema.safeParse(input);
  if (!parsed.success) return { error: "Datos inválidos" };

  // Validate stock
  const { data: prod } = await sb()
    .from("productos")
    .select("stock_actual,nombre")
    .eq("id", parsed.data.product_id)
    .single();
  if (!prod) return { error: "Producto no encontrado" };
  if (prod.stock_actual < parsed.data.qty)
    return { error: `Stock insuficiente. Disponible: ${prod.stock_actual}` };

  const { error } = await sb().from("movimientos").insert({
    product_id: parsed.data.product_id,
    tipo: "salida",
    qty: parsed.data.qty,
    fecha: new Date().toISOString(),
    user_id: CARLOS_USER_ID,
    notes: parsed.data.notes || null,
  });
  if (error) return { error: error.message };

  revalidatePath("/salidas");
  revalidatePath("/dashboard");
  revalidatePath("/productos");
  return { error: null };
}

export async function createMerma(
  input: MermaInput,
): Promise<{ error: string | null }> {
  const parsed = mermaSchema.safeParse(input);
  if (!parsed.success) return { error: "Datos inválidos" };

  const { data: prod } = await sb()
    .from("productos")
    .select("stock_actual,nombre,last_price")
    .eq("id", parsed.data.product_id)
    .single();
  if (!prod) return { error: "Producto no encontrado" };
  if (prod.stock_actual < parsed.data.qty)
    return { error: `Stock insuficiente. Disponible: ${prod.stock_actual}` };

  const value_lost = parsed.data.qty * Number(prod.last_price);

  const { error } = await sb().from("movimientos").insert({
    product_id: parsed.data.product_id,
    tipo: "merma",
    qty: parsed.data.qty,
    fecha: new Date().toISOString(),
    user_id: CARLOS_USER_ID,
    notes: parsed.data.notes || null,
    motivo_merma: parsed.data.motivo_merma,
    value_lost,
  });
  if (error) return { error: error.message };

  revalidatePath("/salidas");
  revalidatePath("/dashboard");
  revalidatePath("/productos");
  return { error: null };
}
