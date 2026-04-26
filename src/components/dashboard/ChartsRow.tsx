import { BarChart3, TrendingUp } from "lucide-react";
import { SectionCard } from "@/components/shared/SectionCard";
import { SpendingTrendChart } from "./SpendingTrendChart";
import { CategorySpendChart } from "./CategorySpendChart";
import type { SpendingTrendPoint } from "@/types";

interface ChartsRowProps {
  trend: SpendingTrendPoint[];
  gastoPorCategoria: Record<string, number>;
}

export function ChartsRow({ trend, gastoPorCategoria }: ChartsRowProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <SectionCard
        title="Tendencia de Gastos"
        icon={<TrendingUp size={15} color="#BA3026" strokeWidth={2.2} />}
        iconBg="rgba(186, 48, 38, 0.13)"
      >
        <SpendingTrendChart data={trend} />
      </SectionCard>
      <SectionCard
        title="Gasto por Categoría"
        icon={<BarChart3 size={15} color="#0B4455" strokeWidth={2.2} />}
        iconBg="rgba(11, 68, 85, 0.13)"
      >
        <CategorySpendChart data={gastoPorCategoria} />
      </SectionCard>
    </div>
  );
}
