import { addDays, format } from "date-fns";
import type {
  CriticalProductRow,
  DashboardMetrics,
  SpendingTrendPoint,
  TopMermaRow,
  TopProductoRow,
  TopProveedorRow,
} from "@/types";

// ─── Raw row shapes (matching Supabase select responses) ─────────────────────

export interface ProductoRaw {
  id: string;
  nombre: string;
  unidad: string;
  stock_actual: number;
  stock_minimo: number;
  last_price: number | null;
  categoria_id: string;
  categorias: { nombre: string } | { nombre: string }[] | null;
}

export interface ProveedorRaw {
  id: string;
  company: string;
}

export interface DetalleRaw {
  product_id: string;
  qty: number;
  price: number;
}

export interface OrdenRaw {
  id: string;
  supplier_id: string;
  fecha: string;
  total: number;
  detalle_orden: DetalleRaw[] | null;
}

export interface MermaRaw {
  id: string;
  product_id: string;
  fecha: string;
  qty: number;
  value_lost: number | null;
  motivo_merma: string | null;
}

// ─── Lookups ─────────────────────────────────────────────────────────────────

export interface ProductLookup {
  id: string;
  nombre: string;
  unidad: string;
  categoria: string;
  last_price: number;
}

export function buildProductLookup(productos: ProductoRaw[]): Map<string, ProductLookup> {
  const map = new Map<string, ProductLookup>();
  for (const p of productos) {
    const cat = Array.isArray(p.categorias) ? p.categorias[0] : p.categorias;
    map.set(p.id, {
      id: p.id,
      nombre: p.nombre,
      unidad: p.unidad,
      categoria: cat?.nombre ?? "Sin categoría",
      last_price: p.last_price ?? 0,
    });
  }
  return map;
}

export function buildSupplierLookup(proveedores: ProveedorRaw[]): Map<string, string> {
  return new Map(proveedores.map((s) => [s.id, s.company]));
}

// ─── Metrics ─────────────────────────────────────────────────────────────────

function pctChange(current: number, prior: number): number | undefined {
  if (prior === 0) return undefined;
  return ((current - prior) / prior) * 100;
}

export function aggregateMetrics(opts: {
  productos: ProductoRaw[];
  ordersCurrent: OrdenRaw[];
  ordersPrior: OrdenRaw[];
  mermasCurrent: MermaRaw[];
  mermasPrior: MermaRaw[];
  includeChange: boolean;
}): DashboardMetrics {
  const totalInventario = opts.productos.reduce(
    (s, p) => s + (p.stock_actual ?? 0) * (p.last_price ?? 0),
    0,
  );

  const sumOrders = (orders: OrdenRaw[]) => orders.reduce((s, o) => s + (o.total ?? 0), 0);
  const sumMermas = (m: MermaRaw[]) => m.reduce((s, x) => s + (x.value_lost ?? 0), 0);

  const comprasCurrent = sumOrders(opts.ordersCurrent);
  const comprasPrior = sumOrders(opts.ordersPrior);
  const mermaCurrent = sumMermas(opts.mermasCurrent);
  const mermaPrior = sumMermas(opts.mermasPrior);

  const productosCriticos = opts.productos.filter(
    (p) => (p.stock_actual ?? 0) < (p.stock_minimo ?? 0),
  ).length;

  return {
    totalInventario: { value: totalInventario },
    comprasDelMes: {
      value: comprasCurrent,
      change: opts.includeChange ? pctChange(comprasCurrent, comprasPrior) : undefined,
    },
    mermaDelMes: {
      value: mermaCurrent,
      change: opts.includeChange ? pctChange(mermaCurrent, mermaPrior) : undefined,
    },
    productosCriticos,
  };
}

// ─── Top productos / proveedores / merma ─────────────────────────────────────

export function aggregateTopProductos(
  orders: OrdenRaw[],
  products: Map<string, ProductLookup>,
): TopProductoRow[] {
  const spent = new Map<string, number>();
  for (const o of orders) {
    for (const d of o.detalle_orden ?? []) {
      const v = (d.qty ?? 0) * (d.price ?? 0);
      spent.set(d.product_id, (spent.get(d.product_id) ?? 0) + v);
    }
  }
  return [...spent.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, total]) => {
      const p = products.get(id);
      return {
        id,
        nombre: p?.nombre ?? "Producto desconocido",
        categoria: p?.categoria ?? "Sin categoría",
        unidad: p?.unidad ?? "",
        spent: total,
      };
    });
}

export function aggregateTopProveedores(
  orders: OrdenRaw[],
  suppliers: Map<string, string>,
): TopProveedorRow[] {
  const tally = new Map<string, { totalSpent: number; count: number }>();
  for (const o of orders) {
    const cur = tally.get(o.supplier_id) ?? { totalSpent: 0, count: 0 };
    cur.totalSpent += o.total ?? 0;
    cur.count += 1;
    tally.set(o.supplier_id, cur);
  }
  return [...tally.entries()]
    .filter(([, v]) => v.totalSpent > 0)
    .sort((a, b) => b[1].totalSpent - a[1].totalSpent)
    .slice(0, 5)
    .map(([id, v]) => ({
      id,
      company: suppliers.get(id) ?? "Proveedor desconocido",
      totalSpent: v.totalSpent,
      purchasesCount: v.count,
    }));
}

export function aggregateTopMerma(
  mermas: MermaRaw[],
  products: Map<string, ProductLookup>,
): TopMermaRow[] {
  const tally = new Map<
    string,
    { qty: number; value: number; motivos: Map<string, number> }
  >();
  for (const m of mermas) {
    const cur =
      tally.get(m.product_id) ?? { qty: 0, value: 0, motivos: new Map<string, number>() };
    cur.qty += m.qty ?? 0;
    cur.value += m.value_lost ?? 0;
    if (m.motivo_merma) {
      cur.motivos.set(m.motivo_merma, (cur.motivos.get(m.motivo_merma) ?? 0) + 1);
    }
    tally.set(m.product_id, cur);
  }
  return [...tally.entries()]
    .sort((a, b) => b[1].value - a[1].value)
    .slice(0, 5)
    .map(([productoId, v]) => {
      const p = products.get(productoId);
      const motivoTop = [...v.motivos.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Otro";
      return {
        productoId,
        nombre: p?.nombre ?? "Producto desconocido",
        unidad: p?.unidad ?? "",
        motivoMermaTop: motivoTop,
        qty: v.qty,
        value: v.value,
      };
    });
}

// ─── Critical products ───────────────────────────────────────────────────────

export function aggregateCriticalProducts(productos: ProductoRaw[]): CriticalProductRow[] {
  return productos
    .filter((p) => (p.stock_actual ?? 0) < (p.stock_minimo ?? 0))
    .map((p) => ({
      id: p.id,
      nombre: p.nombre,
      unidad: p.unidad,
      stock_actual: p.stock_actual ?? 0,
      stock_minimo: p.stock_minimo ?? 0,
    }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre));
}

// ─── Spending trend ──────────────────────────────────────────────────────────

export function aggregateSpendingTrend(opts: {
  orders: OrdenRaw[];
  mermas: MermaRaw[];
  startIso: string;
  bucketCount: number;
}): SpendingTrendPoint[] {
  // Build daily buckets keyed by yyyy-MM-dd
  const buckets = new Map<string, { compras: number; merma: number; label: string }>();
  const start = new Date(opts.startIso);
  for (let i = 0; i < opts.bucketCount; i++) {
    const d = addDays(start, i);
    const key = format(d, "yyyy-MM-dd");
    buckets.set(key, { compras: 0, merma: 0, label: format(d, "M/d") });
  }

  for (const o of opts.orders) {
    const key = format(new Date(o.fecha), "yyyy-MM-dd");
    const b = buckets.get(key);
    if (b) b.compras += o.total ?? 0;
  }
  for (const m of opts.mermas) {
    const key = format(new Date(m.fecha), "yyyy-MM-dd");
    const b = buckets.get(key);
    if (b) b.merma += m.value_lost ?? 0;
  }

  return [...buckets.values()].map((b) => ({
    label: b.label,
    compras: b.compras,
    merma: b.merma,
  }));
}

// ─── Gasto por categoría ─────────────────────────────────────────────────────

export function aggregateGastoPorCategoria(
  orders: OrdenRaw[],
  products: Map<string, ProductLookup>,
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const o of orders) {
    for (const d of o.detalle_orden ?? []) {
      const p = products.get(d.product_id);
      if (!p) continue;
      const v = (d.qty ?? 0) * (d.price ?? 0);
      out[p.categoria] = (out[p.categoria] ?? 0) + v;
    }
  }
  return out;
}
