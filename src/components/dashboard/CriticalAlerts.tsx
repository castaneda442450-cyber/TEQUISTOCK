"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import type { CriticalProductRow } from "@/types";

interface CriticalAlertsProps {
  products: CriticalProductRow[];
}

export function CriticalAlerts({ products }: CriticalAlertsProps) {
  if (!products.length) return null;

  return (
    <div
      style={{
        background: "hsl(var(--surface))",
        border: "1px solid hsl(var(--border))",
        borderRadius: 10,
        padding: "12px 18px",
        boxShadow: "0 1px 3px var(--shadow-color)",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
        <AlertTriangle size={16} color="#BA3026" strokeWidth={2.3} />
        <span style={{ fontSize: 13, fontWeight: 700, color: "hsl(8, 74%, 58%)" }}>
          ⚠ {products.length} producto{products.length === 1 ? "" : "s"} con stock crítico
        </span>
        <Link
          href="/productos?filter=critico"
          style={{
            marginLeft: "auto",
            fontSize: 11,
            fontWeight: 600,
            color: "#BA3026",
            textDecoration: "none",
            opacity: 0.7,
            display: "flex",
            alignItems: "center",
            gap: 3,
          }}
        >
          Ver todos →
        </Link>
      </div>

      {/* Product chips */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {products.map((p) => (
          <Link
            key={p.id}
            href={`/productos?search=${encodeURIComponent(p.nombre)}`}
            style={{ textDecoration: "none" }}
          >
            <div className="critical-chip">
              <span style={{ fontSize: 12, fontWeight: 600, color: "hsl(var(--text-main))" }}>
                {p.nombre}
              </span>
              <span style={{ fontSize: 11, color: "hsl(8, 74%, 58%)", fontVariantNumeric: "tabular-nums" }}>
                {p.stock_actual} {p.unidad} / mín {p.stock_minimo} {p.unidad}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
