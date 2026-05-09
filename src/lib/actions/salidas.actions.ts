"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { consumoSchema, mermaSchema, type ConsumoInput, type MermaInput } from "@/lib/schemas/salida.schema";
import { revalidatePath } from "next/cache";
import type { Movimiento } from "@/types";

const sb = () => createAdminClient();
const CARLOS_USER_ID = "00000000-0000-0000-0000-000000000001";

export async function getMovimientos(
  tipo?: "entrada" | "salida" | "merma",
  limit = 200,
): Promise<{ data: Movimiento[] | null; error: string | null }> {
  let query = sb()
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
  const parsed = consumoSchema.safeParse(input);
  if (!parsed.success) return { data: null, error: "Datos inválidos" };

  const { data: prod } = await sb()
    .from("productos")
    .select("stock_actual,nombre,last_price,unidad")
    .eq("id", parsed.data.product_id)
    .single();
  if (!prod) return { data: null, error: "Producto no encontrado" };
  if (prod.stock_actual < parsed.data.qty)
    return { data: null, error: `Stock insuficiente. Disponible: ${prod.stock_actual} ${prod.unidad}` };

  const fecha = parsed.data.fecha ?? new Date().toISOString().split("T")[0];

  const { data: mov, error } = await sb()
    .from("movimientos")
    .insert({
      product_id: parsed.data.product_id,
      tipo: "salida",
      qty: parsed.data.qty,
      fecha,
      user_id: CARLOS_USER_ID,
      notes: parsed.data.notes || null,
    })
    .select("*, productos:product_id(id,nombre,unidad,last_price,categoria_id,categorias:categoria_id(id,nombre,color))")
    .single();
  if (error) return { data: null, error: error.message };

  revalidatePath("/salidas");
  revalidatePath("/dashboard");
  revalidatePath("/productos");
  return { data: mov as unknown as Movimiento, error: null };
}

export async function createMerma(
  input: MermaInput,
): Promise<{ data: Movimiento | null; error: string | null }> {
  const parsed = mermaSchema.safeParse(input);
  if (!parsed.success) return { data: null, error: "Datos inválidos" };

  const { data: prod } = await sb()
    .from("productos")
    .select("stock_actual,nombre,last_price,unidad")
    .eq("id", parsed.data.product_id)
    .single();
  if (!prod) return { data: null, error: "Producto no encontrado" };
  if (prod.stock_actual < parsed.data.qty)
    return { data: null, error: `Stock insuficiente. Disponible: ${prod.stock_actual} ${prod.unidad}` };

  const value_lost = parsed.data.qty * Number(prod.last_price);
  const fecha = parsed.data.fecha ?? new Date().toISOString().split("T")[0];

  const { data: mov, error } = await sb()
    .from("movimientos")
    .insert({
      product_id: parsed.data.product_id,
      tipo: "merma",
      qty: parsed.data.qty,
      fecha,
      user_id: CARLOS_USER_ID,
      notes: parsed.data.notes || null,
      motivo_merma: parsed.data.motivo_merma,
      value_lost,
    })
    .select("*, productos:product_id(id,nombre,unidad,last_price,categoria_id,categorias:categoria_id(id,nombre,color))")
    .single();
  if (error) return { data: null, error: error.message };

  revalidatePath("/salidas");
  revalidatePath("/dashboard");
  revalidatePath("/productos");
  return { data: mov as unknown as Movimiento, error: null };
}

export async function deleteMovimiento(id: string): Promise<{ error: string | null }> {
  // Fetch to know type and qty for stock reversal
  const { data: mov } = await sb()
    .from("movimientos")
    .select("tipo,qty,product_id")
    .eq("id", id)
    .single();

  if (mov && (mov.tipo === "salida" || mov.tipo === "merma")) {
    // Reverse stock: add qty back
    const { data: prod } = await sb()
      .from("productos")
      .select("stock_actual")
      .eq("id", mov.product_id)
      .single();
    if (prod) {
      await sb()
        .from("productos")
        .update({ stock_actual: prod.stock_actual + mov.qty })
        .eq("id", mov.product_id);
    }
  }

  const { error } = await sb().from("movimientos").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/salidas");
  revalidatePath("/dashboard");
  revalidatePath("/productos");
  return { error: null };
}
