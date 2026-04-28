import type { ReactNode } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: string;
  icon: ReactNode;
  iconBg: string;
  change?: number;
  invertChangeColor?: boolean;
  valueColor?: string;
  changeLabel?: string;
}

export function MetricCard({
  label,
  value,
  icon,
  iconBg,
  change,
  invertChangeColor,
  valueColor,
  changeLabel = "vs mes anterior",
}: MetricCardProps) {
  const showChange = change !== undefined && Number.isFinite(change);
  const up = (change ?? 0) > 0;
  const isGood = invertChangeColor ? !up : up;
  const changeColor = isGood ? "#106653" : "#BA3026";

  return (
    <div
      style={{
        background: "hsl(var(--surface))",
        borderRadius: 10,
        border: "1px solid hsl(var(--border))",
        boxShadow: "0 1px 3px var(--shadow-color), 0 6px 18px var(--shadow-color)",
        padding: "24px 28px",
        display: "flex",
        alignItems: "center",
        gap: 16,
        transition: "transform 150ms ease-out, box-shadow 150ms ease-out",
      }}
    >
      <div
        style={{
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 44,
          height: 44,
          borderRadius: 999,
          background: iconBg,
        }}
      >
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            color: "hsl(var(--text-muted))",
            marginBottom: 6,
          }}
        >
          {label}
        </div>
        <div
          className="tabular-nums"
          style={{
            fontSize: 24,
            fontWeight: 800,
            lineHeight: 1,
            color: valueColor ?? "hsl(var(--text-main))",
          }}
        >
          {value}
        </div>
        {showChange && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              marginTop: 8,
            }}
          >
            {up ? (
              <ArrowUp size={12} color={changeColor} strokeWidth={2.6} />
            ) : (
              <ArrowDown size={12} color={changeColor} strokeWidth={2.6} />
            )}
            <span
              className="tabular-nums"
              style={{ fontSize: 12, fontWeight: 600, color: changeColor }}
            >
              {Math.abs(change!).toFixed(1)}%
            </span>
            <span style={{ fontSize: 12, color: "hsl(var(--text-muted))" }}>{changeLabel}</span>
          </div>
        )}
      </div>
    </div>
  );
}
