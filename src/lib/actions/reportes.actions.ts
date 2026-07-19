"use server";

import { createServerClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/actions/auth.actions";

const sb = async () => createServerClient();

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GastoProductoRow {
  product_id: string;
  nombre: string;
  categoria: string;
  cant_comprada: number;
  veces_comprado: number;
  gasto_total: number;
  promedio_por_compra: number;
}

export interface GastoProductoResult {
  rows: GastoProductoRow[];
  total_gastado: number;
}

export interface GastoProveedorRow {
  supplier_id: string;
  company: string;
  contact: string;
  num_compras: number;
  num_productos_distintos: number;
  total_gastado: number;
  ticket_promedio: number;
}

export interface GastoProveedorResult {
  rows: GastoProveedorRow[];
  total_gastado: number;
}

export interface MermaRow {
  product_id: string;
  nombre: string;
  categoria: string;
  cant_perdida: number;
  tipo_predominante: string;
  valor_perdido: number;
  porcentaje_del_total: number;
}

export interface MermaResult {
  rows: MermaRow[];
  total_perdido: number;
}

export interface MovimientoReporteRow {
  id: string;
  fecha: string;
  tipo: "entrada" | "salida" | "merma";
  product_id: string;
  nombre: string;
  qty: number;
  referencia: string | null;
}

export interface MovimientosResult {
  rows: MovimientoReporteRow[];
}

// ─── Types: Stock Actual ──────────────────────────────────────────────────────

export type EstadoStock = "normal" | "bajo" | "critico";

export interface StockActualProductoRow {
  product_id: string;
  nombre: string;
  categoria: string;
  unidad: string;
  stock_actual: number;
  stock_minimo: number;
  last_price: number;
  valor_inventario: number;
  estado: EstadoStock;
}

export interface StockActualResumen {
  total_productos: number;
  productos_criticos: number;
  productos_bajos: number;
  productos_normales: number;
  valor_total_inventario: number;
  valor_criticos: number;
  generado_en: string;
}

export interface StockActualResult {
  resumen: StockActualResumen;
  productos: StockActualProductoRow[];
  filtros_aplicados: {
    categoria: string | null;
    estado: EstadoStock | null;
  };
}

// ─── Action 1: Gastos por Producto ───────────────────────────────────────────

export async function getGastosPorProducto(
  desde: string,
  hasta: string,
): Promise<{ data: GastoProductoResult | null; error: string | null }> {
  const auth = await requireAuth();
  if (auth.error) return { data: null, error: auth.error };
  const supabase = await sb();
  // Step 1: get order IDs in date range
  let ordenQuery = supabase
    .from("ordenes_compra")
    .select("id")
    .order("fecha", { ascending: false });

  if (desde) ordenQuery = ordenQuery.gte("fecha", desde);
  if (hasta) ordenQuery = ordenQuery.lte("fecha", hasta);

  const { data: ordenes, error: oErr } = await ordenQuery;
  if (oErr) return { data: null, error: oErr.message };
  if (!ordenes || ordenes.length === 0) {
    return { data: { rows: [], total_gastado: 0 }, error: null };
  }

  const ordenIds = ordenes.map((o) => o.id);

  // Step 2: get line items for those orders
  const { data: detalles, error: dErr } = await supabase
    .from("detalle_orden")
    .select(
      "qty, price, product_id, productos:product_id(nombre, categorias:categoria_id(nombre))",
    )
    .in("orden_id", ordenIds);

  if (dErr) return { data: null, error: dErr.message };

  // Step 3: aggregate in JS
  const map = new Map<
    string,
    {
      nombre: string;
      categoria: string;
      cant_comprada: number;
      veces_comprado: number;
      gasto_total: number;
    }
  >();

  for (const d of detalles as any[]) {
    const pid = d.product_id as string;
    const nombre = d.productos?.nombre ?? "Producto eliminado";
    const categoria = d.productos?.categorias?.nombre ?? "Sin categoría";
    const qty = Number(d.qty ?? 0);
    const price = Number(d.price ?? 0);
    const gasto = qty * price;

    const existing = map.get(pid);
    if (existing) {
      existing.cant_comprada += qty;
      existing.veces_comprado += 1;
      existing.gasto_total += gasto;
    } else {
      map.set(pid, {
        nombre,
        categoria,
        cant_comprada: qty,
        veces_comprado: 1,
        gasto_total: gasto,
      });
    }
  }

  const rows: GastoProductoRow[] = Array.from(map.entries())
    .map(([product_id, v]) => ({
      product_id,
      nombre: v.nombre,
      categoria: v.categoria,
      cant_comprada: v.cant_comprada,
      veces_comprado: v.veces_comprado,
      gasto_total: v.gasto_total,
      promedio_por_compra: v.veces_comprado > 0 ? v.gasto_total / v.veces_comprado : 0,
    }))
    .sort((a, b) => b.gasto_total - a.gasto_total);

  const total_gastado = rows.reduce((s, r) => s + r.gasto_total, 0);
  return { data: { rows, total_gastado }, error: null };
}

// ─── Action 2: Gastos por Proveedor ──────────────────────────────────────────

export async function getGastosPorProveedor(
  desde: string,
  hasta: string,
): Promise<{ data: GastoProveedorResult | null; error: string | null }> {
  const auth = await requireAuth();
  if (auth.error) return { data: null, error: auth.error };
  const supabase = await sb();
  let query = supabase
    .from("ordenes_compra")
    .select(
      "id, supplier_id, total, proveedores:supplier_id(company, contact), detalle_orden(product_id)",
    )
    .order("fecha", { ascending: false });

  if (desde) query = query.gte("fecha", desde);
  if (hasta) query = query.lte("fecha", hasta);

  const { data: ordenes, error } = await query;
  if (error) return { data: null, error: error.message };
  if (!ordenes || ordenes.length === 0) {
    return { data: { rows: [], total_gastado: 0 }, error: null };
  }

  const map = new Map<
    string,
    {
      company: string;
      contact: string;
      num_compras: number;
      product_ids: Set<string>;
      total_gastado: number;
    }
  >();

  for (const o of ordenes as any[]) {
    const sid = o.supplier_id as string;
    const company = o.proveedores?.company ?? "Proveedor eliminado";
    const contact = o.proveedores?.contact ?? "";
    const total = Number(o.total ?? 0);
    const detalleProducts: string[] = (o.detalle_orden ?? []).map(
      (d: any) => d.product_id as string,
    );

    const existing = map.get(sid);
    if (existing) {
      existing.num_compras += 1;
      existing.total_gastado += total;
      detalleProducts.forEach((pid) => existing.product_ids.add(pid));
    } else {
      map.set(sid, {
        company,
        contact,
        num_compras: 1,
        product_ids: new Set(detalleProducts),
        total_gastado: total,
      });
    }
  }

  const rows: GastoProveedorRow[] = Array.from(map.entries())
    .map(([supplier_id, v]) => ({
      supplier_id,
      company: v.company,
      contact: v.contact,
      num_compras: v.num_compras,
      num_productos_distintos: v.product_ids.size,
      total_gastado: v.total_gastado,
      ticket_promedio: v.num_compras > 0 ? v.total_gastado / v.num_compras : 0,
    }))
    .sort((a, b) => b.total_gastado - a.total_gastado);

  const total_gastado = rows.reduce((s, r) => s + r.total_gastado, 0);
  return { data: { rows, total_gastado }, error: null };
}

// ─── Action 3: Análisis de Merma ─────────────────────────────────────────────

export async function getMermaAnalisis(
  desde: string,
  hasta: string,
): Promise<{ data: MermaResult | null; error: string | null }> {
  const auth = await requireAuth();
  if (auth.error) return { data: null, error: auth.error };
  const supabase = await sb();
  let query = supabase
    .from("movimientos")
    .select(
      "id, product_id, qty, value_lost, motivo_merma, productos:product_id(nombre, categorias:categoria_id(nombre))",
    )
    .eq("tipo", "merma")
    .order("fecha", { ascending: false });

  if (desde) query = query.gte("fecha", desde);
  if (hasta) query = query.lte("fecha", hasta);

  const { data: mermas, error } = await query;
  if (error) return { data: null, error: error.message };
  if (!mermas || mermas.length === 0) {
    return { data: { rows: [], total_perdido: 0 }, error: null };
  }

  const map = new Map<
    string,
    {
      nombre: string;
      categoria: string;
      cant_perdida: number;
      valor_perdido: number;
      motivos: Record<string, number>;
    }
  >();

  for (const m of mermas as any[]) {
    const pid = m.product_id as string;
    const nombre = m.productos?.nombre ?? "Producto eliminado";
    const categoria = m.productos?.categorias?.nombre ?? "Sin categoría";
    const qty = Number(m.qty ?? 0);
    const value = Number(m.value_lost ?? 0);
    const motivo = (m.motivo_merma as string) ?? "Otro";

    const existing = map.get(pid);
    if (existing) {
      existing.cant_perdida += qty;
      existing.valor_perdido += value;
      existing.motivos[motivo] = (existing.motivos[motivo] ?? 0) + 1;
    } else {
      map.set(pid, {
        nombre,
        categoria,
        cant_perdida: qty,
        valor_perdido: value,
        motivos: { [motivo]: 1 },
      });
    }
  }

  const total_perdido = Array.from(map.values()).reduce((s, v) => s + v.valor_perdido, 0);

  const rows: MermaRow[] = Array.from(map.entries())
    .map(([product_id, v]) => {
      const tipo_predominante =
        Object.entries(v.motivos).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Otro";
      const pct = total_perdido > 0 ? (v.valor_perdido / total_perdido) * 100 : 0;
      return {
        product_id,
        nombre: v.nombre,
        categoria: v.categoria,
        cant_perdida: v.cant_perdida,
        tipo_predominante,
        valor_perdido: v.valor_perdido,
        porcentaje_del_total: Math.round(pct * 10) / 10,
      };
    })
    .sort((a, b) => b.valor_perdido - a.valor_perdido);

  return { data: { rows, total_perdido }, error: null };
}

// ─── Action 6: Stock Actual ───────────────────────────────────────────────────

export async function getReporteStockActual(
  categoriaId: string | null,
  estado: EstadoStock | null,
): Promise<{ data: StockActualResult | null; error: string | null }> {
  const auth = await requireAuth();
  if (auth.error) return { data: null, error: auth.error };
  const supabase = await sb();

  let query = supabase
    .from("productos")
    .select("id, nombre, unidad, stock_actual, stock_minimo, last_price, categorias:categoria_id(id, nombre)")
    .order("nombre", { ascending: true });

  if (categoriaId !== null) {
    query = query.eq("categoria_id", categoriaId);
  }

  const { data: productos, error } = await query;
  if (error) return { data: null, error: error.message };

  const rawProductos = (productos ?? []) as any[];

  // Calcular estado y valor_inventario en JS
  let rows: StockActualProductoRow[] = rawProductos.map((p) => {
    const stockActual = Number(p.stock_actual ?? 0);
    const stockMinimo = Number(p.stock_minimo ?? 0);
    const lastPrice = Number(p.last_price ?? 0);
    const valorInventario = stockActual * lastPrice;

    let estadoCalc: EstadoStock;
    if (stockActual < stockMinimo) {
      estadoCalc = "critico";
    } else if (stockActual < stockMinimo * 1.5) {
      estadoCalc = "bajo";
    } else {
      estadoCalc = "normal";
    }

    return {
      product_id: p.id as string,
      nombre: p.nombre as string,
      categoria: (p.categorias as any)?.nombre ?? "Sin categoría",
      unidad: p.unidad as string,
      stock_actual: stockActual,
      stock_minimo: stockMinimo,
      last_price: lastPrice,
      valor_inventario: valorInventario,
      estado: estadoCalc,
    };
  });

  // Filtrar por estado si se especificó
  if (estado !== null) {
    rows = rows.filter((r) => r.estado === estado);
  }

  // Ordenar: categoría asc, nombre asc
  rows.sort((a, b) => {
    const catCmp = a.categoria.localeCompare(b.categoria);
    return catCmp !== 0 ? catCmp : a.nombre.localeCompare(b.nombre);
  });

  // Calcular resumen desde el array ya filtrado
  const total_productos = rows.length;
  const productos_criticos = rows.filter((r) => r.estado === "critico").length;
  const productos_bajos = rows.filter((r) => r.estado === "bajo").length;
  const productos_normales = rows.filter((r) => r.estado === "normal").length;
  const valor_total_inventario = rows.reduce((s, r) => s + r.valor_inventario, 0);
  const valor_criticos = rows
    .filter((r) => r.estado === "critico")
    .reduce((s, r) => s + r.valor_inventario, 0);

  // Obtener nombre de categoría para filtros_aplicados
  let categoriaName: string | null = null;
  if (categoriaId !== null && rawProductos.length > 0) {
    categoriaName = (rawProductos[0].categorias as any)?.nombre ?? null;
  }

  return {
    data: {
      resumen: {
        total_productos,
        productos_criticos,
        productos_bajos,
        productos_normales,
        valor_total_inventario,
        valor_criticos,
        generado_en: new Date().toISOString(),
      },
      productos: rows,
      filtros_aplicados: {
        categoria: categoriaName,
        estado,
      },
    },
    error: null,
  };
}

// ─── Action 4: Movimientos de Inventario ─────────────────────────────────────

export async function getMovimientosReporte(
  desde: string,
  hasta: string,
): Promise<{ data: MovimientosResult | null; error: string | null }> {
  const auth = await requireAuth();
  if (auth.error) return { data: null, error: auth.error };
  const supabase = await sb();
  let query = supabase
    .from("movimientos")
    .select(
      "id, tipo, qty, fecha, notes, ref_id, product_id, productos:product_id(nombre)",
    )
    .order("fecha", { ascending: false })
    .limit(1000);

  if (desde) query = query.gte("fecha", desde);
  if (hasta) query = query.lte("fecha", hasta);

  const { data: movimientos, error } = await query;
  if (error) return { data: null, error: error.message };
  if (!movimientos) return { data: { rows: [] }, error: null };

  const rows: MovimientoReporteRow[] = (movimientos as any[]).map((m) => ({
    id: m.id,
    fecha: (m.fecha as string)?.slice(0, 10) ?? "",
    tipo: m.tipo as "entrada" | "salida" | "merma",
    product_id: m.product_id,
    nombre: m.productos?.nombre ?? "Producto eliminado",
    qty: Number(m.qty ?? 0),
    referencia: (m.notes as string | null) ?? (m.ref_id as string | null) ?? null,
  }));

  return { data: { rows }, error: null };
}
