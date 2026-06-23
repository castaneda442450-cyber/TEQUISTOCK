import { BarChart3, TrendingUp } from "lucide-react";
import { SectionCard } from "@/components/shared/SectionCard";
import { SpendingTrendChart } from "./SpendingTrendChart";
import { CategorySpendChart } from "./CategorySpendChart";
import type { SpendingTrendPoint } from "@/types";

interface ChartsRowProps {
  trend: SpendingTrendPoint[];
  gastoPorCategoria: Record<string, { value: number; color: string }>;
}

export function ChartsRow({ trend, gastoPorCategoria }: ChartsRowProps) {
  return (
    <div className="tablet-charts-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
      <SectionCard
        title="Tendencia de Gastos"
        icon={<TrendingUp size={15} color="#BA3026" strokeWidth={2.2} />}
        iconBg="rgba(186, 48, 38, 0.13)"
      >
        <SpendingTrendChart data={trend} />
      </SectionCard>
      <SectionCard
        title="Gasto por Categoría"
        icon={<BarChart3 size={15} color="#C2972E" strokeWidth={2.2} />}
        iconBg="rgba(194, 151, 46, 0.13)"
      >
        <CategorySpendChart data={gastoPorCategoria} />
      </SectionCard>
    </div>
  );
}
