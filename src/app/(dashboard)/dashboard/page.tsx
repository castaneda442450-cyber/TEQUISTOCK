import { getDashboardData } from "@/lib/actions/dashboard.actions";
import { parseFilters } from "@/lib/dashboard/filters";
import { DashboardClient } from "@/components/dashboard/DashboardClient";
import { FilterBar } from "@/components/dashboard/FilterBar";
import { CriticalAlerts } from "@/components/dashboard/CriticalAlerts";
import { MetricsRow } from "@/components/dashboard/MetricsRow";
import { RankingsRow } from "@/components/dashboard/RankingsRow";
import { ChartsRow } from "@/components/dashboard/ChartsRow";

interface DashboardPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const sp = await searchParams;
  const filters = parseFilters(sp);
  const data = await getDashboardData(filters);

  const totalCompras = data.metrics.comprasDelMes.value;
  const totalMerma = data.metrics.mermaDelMes.value;

  return (
    <DashboardClient
      filterBar={<FilterBar meta={data.filterMeta} />}
      criticalAlerts={<CriticalAlerts products={data.criticalProducts} />}
      metricsRow={<MetricsRow metrics={data.metrics} />}
      rankingsRow={
        <RankingsRow
          topProductos={data.topProductos}
          topProveedores={data.topProveedores}
          topMerma={data.topMerma}
          totals={{ compras: totalCompras, merma: totalMerma }}
        />
      }
      chartsRow={
        <ChartsRow
          trend={data.spendingTrend}
          gastoPorCategoria={data.gastoPorCategoria}
        />
      }
    />
  );
}
