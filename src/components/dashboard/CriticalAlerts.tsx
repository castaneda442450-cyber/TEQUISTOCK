import { AlertTriangle } from "lucide-react";
import type { CriticalProductRow } from "@/types";

interface CriticalAlertsProps {
  products: CriticalProductRow[];
}

export function CriticalAlerts({ products }: CriticalAlertsProps) {
  if (!products.length) return null;

  return (
    <div
      className="rounded-card"
      style={{
        background: "rgba(186, 48, 38, 0.06)",
        border: "1.5px solid rgba(186, 48, 38, 0.20)",
        padding: "14px 18px",
      }}
    >
      <div className="flex items-center gap-2 mb-2.5">
        <AlertTriangle size={16} color="#BA3026" strokeWidth={2.2} />
        <span className="text-[13px] font-bold text-terracota">
          ⚠ {products.length} producto{products.length === 1 ? "" : "s"} con stock crítico
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {products.map((p) => (
          <div
            key={p.id}
            className="flex items-center gap-2.5 bg-surface rounded-md"
            style={{
              padding: "8px 14px",
              border: "1px solid rgba(186, 48, 38, 0.20)",
            }}
          >
            <span className="text-[12px] font-semibold text-text-main">{p.nombre}</span>
            <span className="text-[11px] text-terracota tabular-nums">
              {p.stock_actual} {p.unidad} / mín {p.stock_minimo} {p.unidad}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
