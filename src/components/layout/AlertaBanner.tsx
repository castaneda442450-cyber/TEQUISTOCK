"use client";

import Link from "next/link";
import { AlertTriangle, X } from "lucide-react";
import { useState } from "react";

interface AlertaBannerProps {
  criticalProducts: { id: string; nombre: string; stock_actual: number; stock_minimo: number }[];
}

export function AlertaBanner({ criticalProducts }: AlertaBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || criticalProducts.length === 0) return null;

  const shown = criticalProducts.slice(0, 3);
  const remaining = criticalProducts.length - 3;

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 text-sm relative"
      style={{
        backgroundColor: "#C2972E15",
        borderBottom: "1.5px solid #C2972E30",
      }}
    >
      <AlertTriangle size={16} style={{ color: "#C2972E", flexShrink: 0 }} />
      <span className="font-bold" style={{ color: "#7B5E2A" }}>
        {criticalProducts.length} producto{criticalProducts.length > 1 ? "s" : ""} con stock crítico:
      </span>
      <span style={{ color: "#7B5E2A" }}>
        {shown.map((p) => p.nombre).join(", ")}
        {remaining > 0 && ` y ${remaining} más`}
      </span>
      <Link
        href="/productos?estado=critico"
        className="ml-1 font-semibold underline underline-offset-2 hover:opacity-80 transition-opacity"
        style={{ color: "hsl(var(--terracota))" }}
      >
        Ver productos →
      </Link>
      <button
        onClick={() => setDismissed(true)}
        className="ml-auto p-1 rounded hover:opacity-70 transition-opacity"
        aria-label="Cerrar alerta"
        style={{ color: "#7B5E2A" }}
      >
        <X size={14} />
      </button>
    </div>
  );
}
