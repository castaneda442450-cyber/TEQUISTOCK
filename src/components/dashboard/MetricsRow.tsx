import { AlertCircle, AlertTriangle, Package, ShoppingCart } from "lucide-react";
import { MetricCard } from "@/components/shared/MetricCard";
import { formatCurrency, formatNumber } from "@/lib/format";
import type { DashboardMetrics } from "@/types";

interface MetricsRowProps {
  metrics: DashboardMetrics;
}

export function MetricsRow({ metrics }: MetricsRowProps) {
  return (
    <div className="tablet-metrics-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20 }}>
      <MetricCard
        label="Total Inventario"
        value={formatCurrency(metrics.totalInventario.value)}
        icon={<Package size={20} color="#106653" strokeWidth={2.2} />}
        iconBg="rgba(16, 102, 83, 0.13)"
        change={metrics.totalInventario.change}
      />
      <MetricCard
        label="Compras del Mes"
        value={formatCurrency(metrics.comprasDelMes.value)}
        icon={<ShoppingCart size={20} color="#0B4455" strokeWidth={2.2} />}
        iconBg="rgba(11, 68, 85, 0.13)"
        change={metrics.comprasDelMes.change}
      />
      <MetricCard
        label="Merma del Mes"
        value={formatCurrency(metrics.mermaDelMes.value)}
        icon={<AlertCircle size={20} color="#BA3026" strokeWidth={2.2} />}
        iconBg="rgba(186, 48, 38, 0.13)"
        valueColor="#BA3026"
        change={metrics.mermaDelMes.change}
        invertChangeColor
      />
      <MetricCard
        label="Productos Críticos"
        value={formatNumber(metrics.productosCriticos)}
        icon={<AlertTriangle size={20} color="#BA3026" strokeWidth={2.2} />}
        iconBg="rgba(186, 48, 38, 0.13)"
      />
    </div>
  );
}
