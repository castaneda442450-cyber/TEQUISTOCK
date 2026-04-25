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

export interface ChartDataPoint {
  fecha: string;
  valor: number;
}

export interface MetricsData {
  totalInventory: number;
  monthPurchases: number;
  monthMerma: number;
  criticalCount: number;
}

export interface DashboardData extends MetricsData {
  topProductos: Producto[];
  topProveedores: Proveedor[];
  topMermas: { motivo: string; cantidad: number; valor: number }[];
  spendingTrend: ChartDataPoint[];
  gastoPorCategoria: { categoria: string; valor: number }[];
}
