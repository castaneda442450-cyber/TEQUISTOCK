import type { ReactNode } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: string;
  icon: ReactNode;
  iconBg: string;
  /** Percent change vs prior period. Positive=up, negative=down. Undefined hides the row. */
  change?: number;
  /** Lower-is-better metrics: invert the color (down=green, up=red). */
  invertChangeColor?: boolean;
  changeLabel?: string;
}

export function MetricCard({
  label,
  value,
  icon,
  iconBg,
  change,
  invertChangeColor,
  changeLabel = "vs mes anterior",
}: MetricCardProps) {
  const showChange = change !== undefined && Number.isFinite(change);
  const up = (change ?? 0) > 0;
  const isGood = invertChangeColor ? !up : up;
  const changeColor = isGood ? "#106653" : "#BA3026";

  return (
    <div className="flex items-center gap-4 bg-surface border border-border rounded-card shadow-card transition-all duration-150 hover:-translate-y-0.5 hover:shadow-hover px-[22px] py-5">
      <div
        className="flex shrink-0 items-center justify-center w-12 h-12 rounded-full"
        style={{ background: iconBg }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[11px] font-semibold uppercase tracking-[0.5px] text-text-sub mb-1">
          {label}
        </div>
        <div className="text-[22px] font-bold text-text-main leading-none tabular-nums">
          {value}
        </div>
        {showChange && (
          <div className="flex items-center gap-1 mt-1.5">
            {up ? (
              <ArrowUp size={12} color={changeColor} strokeWidth={2.5} />
            ) : (
              <ArrowDown size={12} color={changeColor} strokeWidth={2.5} />
            )}
            <span className="text-[11px] font-semibold" style={{ color: changeColor }}>
              {Math.abs(change!).toFixed(1)}%
            </span>
            <span className="text-[11px] text-text-muted">{changeLabel}</span>
          </div>
        )}
      </div>
    </div>
  );
}
