"use client";

import { Trash2, X } from "lucide-react";
import type { OrdenCompra } from "@/types";

interface CompraDeleteModalProps {
  orden: OrdenCompra | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export function CompraDeleteModal({ orden, onConfirm, onCancel }: CompraDeleteModalProps) {
  if (!orden) return null;

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
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          borderRadius: 12,
          boxShadow: "0 32px 80px rgba(0,0,0,0.28)",
          backgroundColor: "hsl(var(--surface))",
          animation: "modalIn 0.18s ease-out",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              backgroundColor: "hsl(var(--terracota) / 0.12)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Trash2 size={15} style={{ color: "hsl(var(--terracota))" }} />
            </div>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: "hsl(var(--text-main))", margin: 0 }}>
              Eliminar Compra
            </h2>
          </div>
          <button
            onClick={onCancel}
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
        <div style={{ padding: "20px 24px" }}>
          <p style={{ fontSize: 14, color: "hsl(var(--text-sub))", margin: 0, lineHeight: 1.6 }}>
            ¿Eliminar la compra{" "}
            <span style={{ fontWeight: 700, color: "hsl(var(--text-main))", fontFamily: "monospace" }}>
              {orden.folio}
            </span>
            ? Se revertirá el stock agregado. Esta acción no se puede deshacer.
          </p>
        </div>

        {/* Footer */}
        <div style={{
          display: "flex", gap: 10,
          padding: "16px 24px 20px",
          borderTop: "1px solid hsl(var(--border))",
        }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              padding: "9px 16px", fontSize: 13, fontWeight: 600,
              borderRadius: 8, border: "1px solid hsl(var(--border))",
              backgroundColor: "transparent", color: "hsl(var(--text-sub))",
              cursor: "pointer", fontFamily: "inherit",
            }}
          >
            <X size={14} />
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              padding: "9px 16px", fontSize: 13, fontWeight: 600,
              borderRadius: 8, border: "none",
              backgroundColor: "hsl(var(--terracota))", color: "white",
              cursor: "pointer", fontFamily: "inherit",
            }}
          >
            <Trash2 size={14} />
            Sí, eliminar
          </button>
        </div>
      </div>
    </div>
  );
}
