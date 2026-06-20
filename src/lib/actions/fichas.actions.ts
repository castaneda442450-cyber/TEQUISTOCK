"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/actions/auth.actions";
import { nuevoPlatilloSchema } from "@/lib/schemas/ficha.schema";
import type { FichaTecnica, Producto } from "@/types";

export async function getFichas(): Promise<{
  data: FichaTecnica[];
  error: string | null;
}> {
  const auth = await requireAuth();
  if (auth.error) return { data: [], error: auth.error };

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("fichas_tecnicas")
    .select("*, producto:producto_id(id, nombre, unidad, last_price, stock_actual, stock_minimo, categoria_id, imagen_url, created_at, frecuencia_conteo)")
    .order("platillo_nombre")
    .order("created_at");

  if (error) return { data: [], error: error.message };
  return { data: (data ?? []) as unknown as FichaTecnica[], error: null };
}

export async function createFichasPlatillo(
  platillo_nombre: string,
  ingredientes: { producto_id: string; qty_por_porcion: number }[],
  productos: Producto[]
): Promise<{ error?: string }> {
  const auth = await requireAuth();
  if (auth.error) return { error: auth.error };

  const parsed = nuevoPlatilloSchema.safeParse({ platillo_nombre, ingredientes });
  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message ?? "Datos inválidos";
    return { error: first };
  }

  const supabase = await createServerClient();

  // Verificar que no exista un platillo con el mismo nombre (case-insensitive)
  const { data: existing } = await supabase
    .from("fichas_tecnicas")
    .select("id")
    .ilike("platillo_nombre", parsed.data.platillo_nombre)
    .limit(1);

  if (existing && existing.length > 0) {
    return { error: "Ya existe un platillo con ese nombre" };
  }

  // Construir rows con la unidad copiada del producto
  const rows = parsed.data.ingredientes.map((ing) => {
    const prod = productos.find((p) => p.id === ing.producto_id);
    return {
      platillo_nombre: parsed.data.platillo_nombre,
      producto_id: ing.producto_id,
      qty_por_porcion: ing.qty_por_porcion,
      unidad: prod?.unidad ?? "",
    };
  });

  const { error } = await supabase.from("fichas_tecnicas").insert(rows);
  if (error) return { error: error.message };

  revalidatePath("/fichas");
  return {};
}

export async function updateFichaQty(
  id: string,
  qty_por_porcion: number
): Promise<{ error?: string }> {
  const auth = await requireAuth();
  if (auth.error) return { error: auth.error };

  if (!qty_por_porcion || qty_por_porcion <= 0) {
    return { error: "La cantidad debe ser mayor a 0" };
  }

  const supabase = await createServerClient();
  const { error } = await supabase
    .from("fichas_tecnicas")
    .update({ qty_por_porcion })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/fichas");
  return {};
}

export async function deleteFicha(id: string): Promise<{ error?: string }> {
  const auth = await requireAuth();
  if (auth.error) return { error: auth.error };

  const supabase = await createServerClient();
  const { error } = await supabase
    .from("fichas_tecnicas")
    .delete()
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/fichas");
  return {};
}

export async function deletePlatillo(
  platillo_nombre: string
): Promise<{ error?: string }> {
  const auth = await requireAuth();
  if (auth.error) return { error: auth.error };

  const supabase = await createServerClient();
  const { error } = await supabase
    .from("fichas_tecnicas")
    .delete()
    .eq("platillo_nombre", platillo_nombre);

  if (error) return { error: error.message };

  revalidatePath("/fichas");
  return {};
}

export async function toggleFichaActivo(
  platillo_nombre: string,
  activo: boolean
): Promise<{ error?: string }> {
  const auth = await requireAuth();
  if (auth.error) return { error: auth.error };

  const supabase = await createServerClient();
  const { error } = await supabase
    .from("fichas_tecnicas")
    .update({ activo })
    .eq("platillo_nombre", platillo_nombre);

  if (error) return { error: error.message };

  revalidatePath("/fichas");
  return {};
}
