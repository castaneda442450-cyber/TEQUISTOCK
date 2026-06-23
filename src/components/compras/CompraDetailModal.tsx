"use client";

import { X } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/format";
import type { OrdenCompra } from "@/types";

interface CompraDetailModalProps {
  orden: OrdenCompra | null;
  onClose: () => void;
}

export function CompraDetailModal({ orden, onClose }: CompraDetailModalProps) {
  if (!orden) return null;

  const proveedor = orden.proveedor as any;
  const detalles = (orden.detalles ?? []) as any[];
  const total = detalles.reduce((s: number, d: any) => s + (d.qty || 0) * (d.price || 0), 0) || orden.total;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        backgroundColor: "rgba(0,0,0,0.45)",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 560,
          borderRadius: 12,
          boxShadow: "0 32px 80px rgba(0,0,0,0.28)",
          backgroundColor: "hsl(var(--surface))",
          animation: "modalIn 0.18s ease-out",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "20px 24px",
          borderBottom: "1px solid hsl(var(--border))",
          flexShrink: 0,
        }}>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: "hsl(var(--text-main))", margin: 0 }}>
              Compra{" "}
              <span style={{ fontFamily: "monospace", color: "hsl(var(--text-sub))" }}>{orden.folio}</span>
            </h2>
          </div>
          <button
            data-icon-btn
            onClick={onClose}
            style={{
              padding: 6, borderRadius: 6, border: "none",
              background: "transparent", cursor: "pointer",
              display: "flex", alignItems: "center",
              color: "hsl(var(--text-muted))",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1 }}>
          {/* Info grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
            {[
              ["Fecha", formatDate(orden.fecha)],
              ["Proveedor", proveedor?.company ?? "—"],
              ["Folio", orden.folio],
              ["Factura", orden.has_invoice ? "Sí" : "No"],
            ].map(([label, value]) => (
              <div key={label}>
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", color: "hsl(var(--text-muted))", marginBottom: 4 }}>
                  {label}
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "hsl(var(--text-main))" }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Indicador factura */}
          {orden.has_invoice && (
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 20,
              padding: "6px 12px",
              borderRadius: 99,
              backgroundColor: "hsl(var(--green) / 0.1)",
              color: "hsl(var(--green))",
              fontSize: 12,
              fontWeight: 600,
            }}>
              Con factura
            </div>
          )}

          {/* Productos */}
          <div style={{ borderTop: "1px solid hsl(var(--border))", paddingTop: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "hsl(var(--text-muted))", marginBottom: 10 }}>
              Productos
            </div>
            {detalles.map((d: any, i: number) => {
              const prod = d.productos ?? d.producto;
              return (
                <div
                  key={d.id ?? i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 0",
                    borderBottom: i < detalles.length - 1 ? "1px solid hsl(var(--border))" : "none",
                  }}
                >
                  <span style={{ fontSize: 13, color: "hsl(var(--text-main))", fontWeight: 500 }}>
                    {prod?.nombre ?? "Producto"}
                  </span>
                  <span style={{ fontSize: 12, color: "hsl(var(--text-sub))" }}>
                    {d.qty} {prod?.unidad} × {formatCurrency(d.price)}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "hsl(var(--text-main))" }}>
                    {formatCurrency(d.qty * d.price)}
                  </span>
                </div>
              );
            })}

            {/* Total */}
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16, paddingTop: 12, borderTop: "1px solid hsl(var(--border))" }}>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", color: "hsl(var(--text-sub))", marginBottom: 4 }}>
                  Total General
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "hsl(var(--terracota))", fontVariantNumeric: "tabular-nums" }}>
                  {formatCurrency(total)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: "16px 24px 20px",
          borderTop: "1px solid hsl(var(--border))",
          flexShrink: 0,
        }}>
          <button
            onClick={onClose}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              padding: "9px 24px",
              fontSize: 13,
              fontWeight: 600,
              borderRadius: 8,
              border: "1px solid hsl(var(--border))",
              backgroundColor: "transparent",
              color: "hsl(var(--text-sub))",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
