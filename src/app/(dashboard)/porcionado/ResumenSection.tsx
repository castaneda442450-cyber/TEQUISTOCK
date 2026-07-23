"use client";

import { Scissors, Package, AlertTriangle } from "lucide-react";
import { formatNumber } from "@/lib/format";
import type { ResumenPorcion } from "@/types";

interface Props {
  resumen: ResumenPorcion[];
  onPorcionar: (productId: string) => void;
  onConfigurar: () => void;
}

function semaforoColor(r: ResumenPorcion): string {
  if (r.porciones_porcionadas_hoy === 0) return "hsl(var(--terracota))";
  if (r.estado === "bajo") return "hsl(var(--gold))";
  return "hsl(var(--green))";
}

export default function ResumenSection({ resumen, onPorcionar, onConfigurar }: Props) {
  if (resumen.length === 0) {
    return (
      <div
        style={{
          border: "1.5px dashed hsl(var(--border-strong))",
          borderRadius: 12,
          padding: "40px 24px",
          textAlign: "center",
          background: "hsl(var(--surface))",
        }}
      >
        <Scissors
          size={32}
          style={{ color: "hsl(var(--text-muted))", margin: "0 auto 12px" }}
        />
        <h2
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: "hsl(var(--text-main))",
            margin: "0 0 6px",
          }}
        >
          Aún no hay productos configurados
        </h2>
        <p
          style={{
            fontSize: 13,
            color: "hsl(var(--text-sub))",
            margin: "0 0 18px",
          }}
        >
          Configura qué productos se porcionan y su tamaño estándar de porción.
        </p>
        <button
          onClick={onConfigurar}
          style={{
            padding: "9px 18px",
            background: "hsl(var(--terracota))",
            color: "white",
            border: "none",
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "inherit",
            boxShadow: "0 2px 8px hsl(var(--terracota) / 0.30)",
          }}
        >
          Configurar primer producto
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        gap: 16,
      }}
    >
      {resumen.map((r) => {
        const cfg = r.porcion_config;
        const color = semaforoColor(r);
        const tieneMerma = r.merma_hoy > 0;
        return (
          <div
            key={r.product_id}
            style={{
              background: "hsl(var(--surface))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 10,
              padding: 18,
              boxShadow: "0 2px 8px hsl(var(--shadow, 0 0% 0% / 0.06))",
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
              <h3
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: "hsl(var(--text-main))",
                  margin: 0,
                  lineHeight: 1.3,
                }}
              >
                {r.nombre}
              </h3>
              {cfg && (
                <span
                  style={{
                    flexShrink: 0,
                    fontSize: 11,
                    fontWeight: 600,
                    color: "hsl(var(--text-sub))",
                    background: "hsl(var(--surface-alt))",
                    borderRadius: 99,
                    padding: "2px 10px",
                    whiteSpace: "nowrap",
                  }}
                >
                  {formatNumber(cfg.porcion_size)} {cfg.porcion_unit}/porción
                </span>
              )}
            </div>

            {/* Dos datos separados */}
            <div style={{ display: "flex", gap: 12 }}>
              <div
                style={{
                  flex: 1,
                  background: `${
                    color === "hsl(var(--green))"
                      ? "hsl(var(--green) / 0.10)"
                      : color === "hsl(var(--gold))"
                        ? "hsl(var(--gold) / 0.12)"
                        : "hsl(var(--terracota) / 0.10)"
                  }`,
                  borderRadius: 8,
                  padding: "10px 12px",
                }}
              >
                <div style={labelStyle}>Porcionado hoy</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                  <span style={{ fontSize: 26, fontWeight: 800, color, lineHeight: 1 }}>
                    {formatNumber(r.porciones_porcionadas_hoy)}
                  </span>
                  <span style={{ fontSize: 12, color: "hsl(var(--text-sub))" }}>
                    porcion{r.porciones_porcionadas_hoy !== 1 ? "es" : ""}
                  </span>
                </div>
              </div>

              <div
                style={{
                  flex: 1,
                  background: "hsl(var(--surface-alt))",
                  borderRadius: 8,
                  padding: "10px 12px",
                }}
              >
                <div style={labelStyle}>En inventario</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                  <span
                    style={{
                      fontSize: 22,
                      fontWeight: 800,
                      color: "hsl(var(--text-main))",
                      lineHeight: 1,
                    }}
                  >
                    {formatNumber(r.stock_actual_display)}
                  </span>
                  <span style={{ fontSize: 12, color: "hsl(var(--text-sub))" }}>
                    {r.unidad_producto}
                  </span>
                </div>
              </div>
            </div>

            <div
              style={{
                fontSize: 12.5,
                color: "hsl(var(--text-sub))",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Package size={14} style={{ color: "hsl(var(--navy))" }} />
              Rinden ~
              <strong style={{ color: "hsl(var(--navy))" }}>
                {formatNumber(r.porciones_posibles_con_stock)}
              </strong>{" "}
              porciones con el stock actual
            </div>

            {tieneMerma && (
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "hsl(var(--gold))",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <AlertTriangle size={14} />
                Merma de hoy: {formatNumber(r.merma_hoy)} {r.merma_unidad}
              </div>
            )}

            <button
              onClick={() => onPorcionar(r.product_id)}
              style={{
                marginTop: "auto",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                padding: "8px 14px",
                background: "hsl(var(--terracota) / 0.10)",
                color: "hsl(var(--terracota))",
                border: "1px solid hsl(var(--terracota) / 0.25)",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              <Scissors size={14} />
              Porcionar ahora
            </button>
          </div>
        );
      })}
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  fontSize: 10.5,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  color: "hsl(var(--text-sub))",
  marginBottom: 5,
};
