"use server";

import { createServerClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/actions/auth.actions";
import { checkRateLimit } from "@/lib/ratelimit";
import {
  porcionConfigSchema,
  registrarPorcionadoSchema,
  type PorcionConfigInput,
  type RegistrarPorcionadoInput,
} from "@/lib/schemas/porcionado.schema";
import { areCompatible, convertUnit } from "@/lib/units";
import { revalidatePath } from "next/cache";
import type { PorcionConfig, ResumenPorcion } from "@/types";

const HOY = () => new Date().toISOString().split("T")[0];

export async function getPorcionConfigs(): Promise<{
  data: PorcionConfig[];
  error: string | null;
}> {
  const auth = await requireAuth();
  if (auth.error) return { data: [], error: auth.error };
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("porcion_config")
    .select(
      "*, producto:product_id(id,nombre,unidad,stock_actual,stock_minimo,last_price,categoria_id,imagen_url,created_at)",
    )
    .eq("activo", true)
    .order("created_at");

  if (error) return { data: [], error: error.message };

  const rows = (data ?? []) as unknown as PorcionConfig[];
  rows.sort((a, b) =>
    (a.producto?.nombre ?? "").localeCompare(b.producto?.nombre ?? ""),
  );
  return { data: rows, error: null };
}

export async function upsertPorcionConfig(
  input: PorcionConfigInput,
): Promise<{ error: string | null }> {
  const auth = await requireAuth();
  if (auth.error) return { error: auth.error };

  const parsed = porcionConfigSchema.safeParse(input);
  if (!parsed.success) return { error: "Datos inválidos" };
  const supabase = await createServerClient();

  const { data: prod } = await supabase
    .from("productos")
    .select("unidad")
    .eq("id", parsed.data.product_id)
    .single();
  if (!prod) return { error: "Producto no encontrado" };

  if (!areCompatible(parsed.data.porcion_unit, prod.unidad)) {
    return {
      error: `La unidad de porción (${parsed.data.porcion_unit}) no es compatible con la unidad del producto (${prod.unidad}). Usa una unidad de la misma familia.`,
    };
  }

  const { error } = await supabase.from("porcion_config").upsert(
    {
      product_id: parsed.data.product_id,
      porcion_size: parsed.data.porcion_size,
      porcion_unit: parsed.data.porcion_unit,
      min_porciones: parsed.data.min_porciones,
      merma_alerta_pct: parsed.data.merma_alerta_pct,
      activo: true,
    },
    { onConflict: "product_id" },
  );
  if (error) return { error: error.message };

  revalidatePath("/porcionado");
  return { error: null };
}

export async function deletePorcionConfig(
  product_id: string,
): Promise<{ error: string | null }> {
  const auth = await requireAuth();
  if (auth.error) return { error: auth.error };
  const supabase = await createServerClient();

  const { error } = await supabase
    .from("porcion_config")
    .delete()
    .eq("product_id", product_id);
  if (error) return { error: error.message };

  revalidatePath("/porcionado");
  return { error: null };
}

export async function getResumenPorciones(): Promise<{
  data: ResumenPorcion[];
  error: string | null;
}> {
  const auth = await requireAuth();
  if (auth.error) return { data: [], error: auth.error };
  const supabase = await createServerClient();

  const { data: configs, error: cfgErr } = await supabase
    .from("porcion_config")
    .select(
      "*, producto:product_id(id,nombre,unidad,stock_actual,stock_minimo,last_price,categoria_id,imagen_url,created_at)",
    )
    .eq("activo", true);
  if (cfgErr) return { data: [], error: cfgErr.message };

  const rows = (configs ?? []) as unknown as PorcionConfig[];
  if (rows.length === 0) return { data: [], error: null };

  const productIds = rows.map((r) => r.product_id);
  const { data: porcs, error: porcErr } = await supabase
    .from("porcionados")
    .select("product_id, porciones_obtenidas, merma_cantidad")
    .in("product_id", productIds)
    .eq("fecha", HOY());
  if (porcErr) return { data: [], error: porcErr.message };

  const agg = new Map<string, { porciones: number; merma: number }>();
  for (const p of porcs ?? []) {
    const cur = agg.get(p.product_id) ?? { porciones: 0, merma: 0 };
    cur.porciones += p.porciones_obtenidas ?? 0;
    cur.merma += Number(p.merma_cantidad ?? 0);
    agg.set(p.product_id, cur);
  }

  const resumen: ResumenPorcion[] = rows.map((cfg) => {
    const prod = cfg.producto;
    const unidadProducto = prod?.unidad ?? "";
    const stockActual = prod?.stock_actual ?? 0;
    const hoy = agg.get(cfg.product_id) ?? { porciones: 0, merma: 0 };

    const stockEnUnidadPorcion = convertUnit(
      stockActual,
      unidadProducto,
      cfg.porcion_unit,
    );
    const porcionesPosibles =
      stockEnUnidadPorcion !== null && cfg.porcion_size > 0
        ? Math.floor(stockEnUnidadPorcion / cfg.porcion_size)
        : 0;

    let estado: ResumenPorcion["estado"];
    if (hoy.porciones === 0) estado = "sin_porcionar";
    else if (hoy.porciones < cfg.min_porciones) estado = "bajo";
    else estado = "ok";

    return {
      product_id: cfg.product_id,
      nombre: prod?.nombre ?? "",
      unidad_producto: unidadProducto,
      stock_actual: stockActual,
      stock_actual_display: stockActual,
      porcion_config: cfg,
      porciones_porcionadas_hoy: hoy.porciones,
      porciones_posibles_con_stock: porcionesPosibles,
      merma_hoy: Math.round(hoy.merma * 1000) / 1000,
      merma_unidad: unidadProducto,
      estado,
    };
  });

  resumen.sort((a, b) => a.nombre.localeCompare(b.nombre));
  return { data: resumen, error: null };
}

export async function registrarPorcionado(
  input: RegistrarPorcionadoInput,
): Promise<{
  error: string | null;
  merma_calculada: number;
  merma_unidad: string;
}> {
  const auth = await requireAuth();
  if (auth.error)
    return { error: auth.error, merma_calculada: 0, merma_unidad: "" };

  const rl = await checkRateLimit(`porcionado:${auth.userId}`);
  if (!rl.success)
    return {
      error: "Demasiadas operaciones. Intenta en unos minutos.",
      merma_calculada: 0,
      merma_unidad: "",
    };

  const parsed = registrarPorcionadoSchema.safeParse(input);
  if (!parsed.success)
    return { error: "Datos inválidos", merma_calculada: 0, merma_unidad: "" };
  const supabase = await createServerClient();

  const { data: prod } = await supabase
    .from("productos")
    .select("stock_actual, unidad, last_price")
    .eq("id", parsed.data.product_id)
    .single();
  if (!prod)
    return {
      error: "Producto no encontrado",
      merma_calculada: 0,
      merma_unidad: "",
    };

  const { data: cfg } = await supabase
    .from("porcion_config")
    .select("id")
    .eq("product_id", parsed.data.product_id)
    .eq("activo", true)
    .maybeSingle();
  if (!cfg)
    return {
      error: "Este producto no tiene configuración de porción activa.",
      merma_calculada: 0,
      merma_unidad: "",
    };

  const unidadProducto = prod.unidad;

  if (!areCompatible(parsed.data.unidad_usada, unidadProducto)) {
    return {
      error: `La unidad utilizada (${parsed.data.unidad_usada}) no es compatible con la unidad del producto (${unidadProducto}).`,
      merma_calculada: 0,
      merma_unidad: "",
    };
  }
  if (!areCompatible(parsed.data.porcion_unit, unidadProducto)) {
    return {
      error: `La unidad de porción (${parsed.data.porcion_unit}) no es compatible con la unidad del producto (${unidadProducto}).`,
      merma_calculada: 0,
      merma_unidad: "",
    };
  }

  const cantidadEnUnidadProducto = convertUnit(
    parsed.data.cantidad_usada,
    parsed.data.unidad_usada,
    unidadProducto,
  );
  if (cantidadEnUnidadProducto === null)
    return {
      error: "No se pudo convertir la cantidad a la unidad del producto.",
      merma_calculada: 0,
      merma_unidad: "",
    };

  const qtyMovimiento = Math.round(cantidadEnUnidadProducto);
  if (qtyMovimiento < 1)
    return {
      error: `La cantidad convertida a la unidad del inventario redondea a menos de 1 ${unidadProducto}. Aumenta la cantidad.`,
      merma_calculada: 0,
      merma_unidad: "",
    };
  if (qtyMovimiento > prod.stock_actual)
    return {
      error: `Stock insuficiente. Disponible: ${prod.stock_actual} ${unidadProducto}`,
      merma_calculada: 0,
      merma_unidad: "",
    };

  // Merma de corte
  const cantidadEnUnidadPorcion = convertUnit(
    parsed.data.cantidad_usada,
    parsed.data.unidad_usada,
    parsed.data.porcion_unit,
  );
  if (cantidadEnUnidadPorcion === null)
    return {
      error: "No se pudo convertir la cantidad a la unidad de porción.",
      merma_calculada: 0,
      merma_unidad: "",
    };

  const pesoTeorico =
    parsed.data.porciones_obtenidas * parsed.data.porcion_size_real;
  const mermaEnUnidadPorcion = Math.max(0, cantidadEnUnidadPorcion - pesoTeorico);
  const mermaEnUnidadProducto =
    convertUnit(mermaEnUnidadPorcion, parsed.data.porcion_unit, unidadProducto) ??
    0;
  const mermaCantidad = Math.round(mermaEnUnidadProducto * 1000) / 1000;

  const { error } = await supabase.rpc("registrar_porcionado", {
    p_product_id: parsed.data.product_id,
    p_cantidad_usada: parsed.data.cantidad_usada,
    p_unidad_usada: parsed.data.unidad_usada,
    p_porciones_obtenidas: parsed.data.porciones_obtenidas,
    p_porcion_size_real: parsed.data.porcion_size_real,
    p_porcion_unit: parsed.data.porcion_unit,
    p_merma_cantidad: mermaCantidad,
    p_merma_unidad: unidadProducto,
    p_qty_movimiento: qtyMovimiento,
    p_user_id: auth.userId,
    p_notas: parsed.data.notas || null,
  });

  if (error) {
    if (error.code === "P0001" || error.message.includes("Stock insuficiente"))
      return {
        error: `Stock insuficiente. Disponible: ${prod.stock_actual} ${unidadProducto}`,
        merma_calculada: 0,
        merma_unidad: "",
      };
    return { error: error.message, merma_calculada: 0, merma_unidad: "" };
  }

  revalidatePath("/porcionado");
  revalidatePath("/productos");
  revalidatePath("/dashboard");
  return {
    error: null,
    merma_calculada: mermaCantidad,
    merma_unidad: unidadProducto,
  };
}
