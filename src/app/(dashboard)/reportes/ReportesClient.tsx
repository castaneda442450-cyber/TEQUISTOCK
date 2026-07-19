"use client";

import React, { useState } from "react";
import { Package, Users, Trash2, History, Archive } from "lucide-react";
import { ReportModal, type ReportType } from "@/components/reportes/ReportModal";

interface ReportCardConfig {
  type: ReportType;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  color: string;
  title: string;
  desc: string;
}

const REPORT_CARDS: ReportCardConfig[] = [
  {
    type: "gastos_producto",
    icon: Package,
    color: "#BA3026",
    title: "Gastos por Producto",
    desc: "Analiza cuánto se ha gastado en cada producto, frecuencia de compra y promedio por compra.",
  },
  {
    type: "gastos_proveedor",
    icon: Users,
    color: "#0B4455",
    title: "Gastos por Proveedor",
    desc: "Compara el gasto total por proveedor, número de compras y ticket promedio.",
  },
  {
    type: "merma",
    icon: Trash2,
    color: "#E67E22",
    title: "Análisis de Merma",
    desc: "Identifica los productos con mayor pérdida, tipo de merma predominante y valor total perdido.",
  },
  {
    type: "movimientos",
    icon: History,
    color: "#106653",
    title: "Movimientos de Inventario",
    desc: "Historial cronológico de entradas y salidas con balance acumulado por producto.",
  },
  {
    type: "stock_actual",
    icon: Archive,
    color: "#0B4455",
    title: "Stock Actual",
    desc: "Fotografía completa del inventario: todos los productos, su estado y el valor total en dinero. Filtrable por categoría y estado.",
  },
];

export default function ReportesClient() {
  const [openReport, setOpenReport] = useState<ReportType | null>(null);

  return (
    <div className="tablet-page-content" style={{ padding: 28 }}>
      {/* Page header */}
      <div style={{ marginBottom: 24 }}>
        <h1
          style={{
            fontSize: 26,
            fontWeight: 800,
            color: "hsl(var(--text-main))",
            letterSpacing: "-0.02em",
            margin: 0,
          }}
        >
          Reportes
        </h1>
        <p style={{ fontSize: 14, color: "hsl(var(--text-sub))", margin: "4px 0 0" }}>
          Análisis y exportación de datos
        </p>
      </div>

      <p style={{ fontSize: 14, color: "hsl(var(--text-sub))", marginBottom: 20 }}>
        Selecciona el tipo de reporte que deseas generar:
      </p>

      {/* 2×2 grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 20,
        }}
      >
        {REPORT_CARDS.map((card) => (
          <ReportCard key={card.type} card={card} onOpen={() => setOpenReport(card.type)} />
        ))}
      </div>

      {openReport && (
        <ReportModal type={openReport} onClose={() => setOpenReport(null)} />
      )}
    </div>
  );
}

function ReportCard({
  card,
  onOpen,
}: {
  card: ReportCardConfig;
  onOpen: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const Icon = card.icon;

  return (
    <div
      style={{
        background: "hsl(var(--surface))",
        borderRadius: 10,
        padding: 28,
        boxShadow: hovered
          ? "0 6px 20px rgba(0,0,0,0.10)"
          : "0 2px 8px rgba(0,0,0,0.06)",
        border: "1px solid hsl(var(--border))",
        display: "flex",
        gap: 20,
        alignItems: "flex-start",
        cursor: "default",
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
        transition: "transform 0.15s ease-out, box-shadow 0.15s ease-out",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Icon container */}
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: 12,
          background: card.color + "1A",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={24} color={card.color} />
      </div>

      {/* Body */}
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: "hsl(var(--text-main))",
            marginBottom: 6,
          }}
        >
          {card.title}
        </div>
        <div
          style={{
            fontSize: 13,
            color: "hsl(var(--text-sub))",
            lineHeight: 1.6,
            marginBottom: 16,
          }}
        >
          {card.desc}
        </div>
        <button
          onClick={onOpen}
          style={{
            background: card.color,
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "7px 16px",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            transition: "opacity 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          Generar Reporte
        </button>
      </div>
    </div>
  );
}
