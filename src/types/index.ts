import type { StockEstado } from "@/lib/format";

export type { StockEstado };

export interface Categoria {
  id: string;
  nombre: string;
  color: string;
  created_at: string;
}

export interface Producto {
  id: string;
  nombre: string;
  categoria_id: string;
  unidad: string;
  stock_actual: number;
  stock_minimo: number;
  last_price: number;
  imagen_url: string | null;
  frecuencia_conteo: 'diario' | 'semanal' | 'mensual';
  created_at: string;
  categoria?: Categoria;
}

export interface Proveedor {
  id: string;
  company: string;
  contact: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  total_spent: number;
  activo: boolean;
  created_at: string;
  // computed from joins
  productos_count: number;
  compras_count: number;
  producto_ids: string[];
}

export interface ProveedorProducto {
  supplier_id: string;
  product_id: string;
  proveedor?: Proveedor;
  producto?: Producto;
}

export interface OrdenCompra {
  id: string;
  folio: string;
  supplier_id: string;
  fecha: string;
  total: number;
  has_invoice: boolean;
  invoice_url: string | null;
  created_at: string;
  proveedor?: Proveedor;
  detalles?: DetalleOrden[];
}

export interface DetalleOrden {
  id: string;
  orden_id: string;
  product_id: string;
  qty: number;
  price: number;
  subtotal: number;
  producto?: Producto;
}

export type MovimientoTipo = "entrada" | "salida" | "merma";

export interface Movimiento {
  id: string;
  product_id: string;
  tipo: MovimientoTipo;
  qty: number;
  fecha: string;
  user_id: string;
  notes: string | null;
  ref_id: string | null;
  motivo_merma: string | null;
  value_lost: number | null;
  created_at: string;
  producto?: Producto;
}

// ─── Dashboard types ─────────────────────────────────────────────────────────

export type FilterMode = "periodo" | "mes" | "dia";
export type PeriodValue = 7 | 14 | 30 | 60 | 90;

export type DashboardFilters =
  | { mode: "periodo"; period: PeriodValue }
  | { mode: "mes"; month: number; year: number }
  | { mode: "dia"; day: number };

export interface FilterMeta {
  mode: FilterMode;
  period?: PeriodValue;
  month?: number;
  year?: number;
  day?: number;
  purchasesCount: number;
  availableYears: number[];
}

export interface MetricWithChange {
  value: number;
  change?: number;
}

export interface DashboardMetrics {
  totalInventario: MetricWithChange;
  comprasDelMes: MetricWithChange;
  mermaDelMes: MetricWithChange;
  productosCriticos: number;
}

export interface TopProductoRow {
  id: string;
  nombre: string;
  categoria: string;
  unidad: string;
  spent: number;
}

export interface TopProveedorRow {
  id: string;
  company: string;
  totalSpent: number;
  purchasesCount: number;
}

export interface TopMermaRow {
  productoId: string;
  nombre: string;
  unidad: string;
  motivoMermaTop: string;
  qty: number;
  value: number;
}

export interface CriticalProductRow {
  id: string;
  nombre: string;
  unidad: string;
  stock_actual: number;
  stock_minimo: number;
}

export interface SpendingTrendPoint {
  label: string;
  compras: number;
  merma: number;
}

export interface DashboardData {
  metrics: DashboardMetrics;
  topProductos: TopProductoRow[];
  topProveedores: TopProveedorRow[];
  topMerma: TopMermaRow[];
  criticalProducts: CriticalProductRow[];
  spendingTrend: SpendingTrendPoint[];
  gastoPorCategoria: Record<string, { value: number; color: string }>;
  filterMeta: FilterMeta;
}

// ─── Fichas técnicas ──────────────────────────────────────────────────────────

export interface FichaTecnica {
  id: string;
  platillo_nombre: string;
  producto_id: string;
  qty_por_porcion: number;
  unidad: string;
  activo: boolean;
  created_at: string;
  producto?: Producto;
}

// ─── Conteo por zonas ──────────────────────────────────────────────────────────

export interface Zona {
  id: string;
  nombre: string;
  descripcion: string | null;
  color: string;
  icono: string;
  activo: boolean;
  created_at: string;
  productos?: Producto[];
  total_productos?: number;
}

export interface ConteoZonaItem {
  product_id: string;
  nombre: string;
  unidad: string;
  stock_actual: number;
  cantidad_contada: number | null;
}

export interface ConteoSesion {
  zona_id: string;
  frecuencia: 'diario' | 'semanal' | 'mensual';
  items: ConteoZonaItem[];
}

export interface ConteoResumen {
  ajustados: number;
  entradas: number;
  salidas: number;
  sin_contar: number;
  sin_cambio: number;
}
