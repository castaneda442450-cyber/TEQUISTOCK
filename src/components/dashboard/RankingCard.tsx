import type { ReactNode } from "react";
import { ProgressBar } from "@/components/shared/ProgressBar";
import { SectionCard } from "@/components/shared/SectionCard";
import { formatCurrency } from "@/lib/format";

interface RankingCardItem {
  key: string;
  name: string;
  badge?: ReactNode;
  value: number;
  /** Optional sublabel under the value (e.g., "1.5 kg") */
  sublabel?: string;
}

interface RankingCardProps {
  title: string;
  icon: ReactNode;
  iconBg: string;
  items: RankingCardItem[];
  /** Color used for the value text and progress bar fill. */
  accentColor: string;
  /**
   * Total used as the denominator for the percentage shown on the right.
   * If 0 (or undefined), the percentage row is hidden.
   */
  total?: number;
}

export function RankingCard({
  title,
  icon,
  iconBg,
  items,
  accentColor,
  total,
}: RankingCardProps) {
  const max = items.reduce((m, it) => Math.max(m, it.value), 0) || 1;

  return (
    <SectionCard title={title} icon={icon} iconBg={iconBg}>
      {items.length === 0 ? (
        <div className="py-8 text-center text-[12px] text-text-muted">
          Sin datos en este rango
        </div>
      ) : (
        <div className="flex flex-col">
          {items.map((it, i) => (
            <div key={it.key} className={i < items.length - 1 ? "mb-4" : ""}>
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-text-muted">#{i + 1}</span>
                    <span className="text-[12px] font-semibold text-text-main truncate">
                      {it.name}
                    </span>
                  </div>
                  {it.badge && <div className="mt-1">{it.badge}</div>}
                </div>
                <div className="text-right shrink-0 ml-2">
                  <div className="text-[14px] font-bold tabular-nums" style={{ color: accentColor }}>
                    {formatCurrency(it.value)}
                  </div>
                  <div className="text-[10px] text-text-muted">
                    {total && total > 0
                      ? `${((it.value / total) * 100).toFixed(1)}%`
                      : it.sublabel}
                  </div>
                </div>
              </div>
              <ProgressBar value={(it.value / max) * 100} color={accentColor} />
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
