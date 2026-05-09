"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireAuth } from "@/lib/actions/auth.actions";
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
  const authErr = await requireAuth();
  if (authErr) return { data: null, error: authErr.error };
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
  const authErr = await requireAuth();
  if (authErr) return { data: null, error: authErr.error };
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

export async function anularMovimiento(id: string): Promise<{ error: string | null }> {
  const authErr = await requireAuth();
  if (authErr) return { error: authErr.error };
  const { data: mov } = await sb()
    .from("movimientos")
    .select("tipo,qty,product_id,fecha")
    .eq("id", id)
    .single();

  if (!mov) return { error: "Movimiento no encontrado" };
  if (mov.tipo === "entrada") return { error: "No se puede anular una entrada" };

  // Insertar movimiento compensatorio de entrada — el trigger actualiza stock_actual
  const { error } = await sb()
    .from("movimientos")
    .insert({
      product_id: mov.product_id,
      tipo: "entrada",
      qty: mov.qty,
      fecha: new Date().toISOString().split("T")[0],
      user_id: CARLOS_USER_ID,
      notes: `Anulación de ${mov.tipo} (ref: ${id})`,
      ref_id: id,
    });

  if (error) return { error: error.message };

  revalidatePath("/salidas");
  revalidatePath("/dashboard");
  revalidatePath("/productos");
  return { error: null };
}
