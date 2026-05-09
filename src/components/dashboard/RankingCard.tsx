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
            <div
              key={it.key}
              style={{ marginBottom: i < items.length - 1 ? 18 : 0 }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "hsl(var(--text-muted))" }}>#{i + 1}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "hsl(var(--text-main))", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {it.name}
                    </span>
                  </div>
                  {it.badge && <div style={{ marginTop: 5 }}>{it.badge}</div>}
                </div>
                <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 8 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: accentColor, fontVariantNumeric: "tabular-nums" }}>
                    {formatCurrency(it.value)}
                  </div>
                  <div style={{ fontSize: 11, color: "hsl(var(--text-muted))", marginTop: 1 }}>
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
