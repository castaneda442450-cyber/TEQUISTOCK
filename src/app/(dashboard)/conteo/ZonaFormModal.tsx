"use client";

import { useState, useTransition } from "react";
import { useIsTablet } from "@/hooks/useIsTablet";
import { sileo } from "sileo";
import { X, Check } from "lucide-react";
import { createZona, updateZona } from "@/lib/actions/zonas.actions";
import { zonaSchema, type ZonaInput } from "@/lib/schemas/zona.schema";
import { ZONA_COLORS, ZONA_ICON_KEYS, getZonaIcon } from "./zonaIcons";
import type { Zona } from "@/types";

export function ZonaFormModal({
  zona,
  onClose,
}: {
  zona: Zona | null;
  onClose: () => void;
}) {
  const [nombre, setNombre] = useState(zona?.nombre ?? "");
  const [descripcion, setDescripcion] = useState(zona?.descripcion ?? "");
  const [color, setColor] = useState<string>(zona?.color ?? ZONA_COLORS[0]);
  const [icono, setIcono] = useState<string>(zona?.icono ?? ZONA_ICON_KEYS[0]);
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const isTablet = useIsTablet();

  function handleSubmit() {
    setFormError(null);
    const input: ZonaInput = {
      nombre: nombre.trim(),
      descripcion: descripcion.trim() || undefined,
      color,
      icono,
    };
    const parsed = zonaSchema.safeParse(input);
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? "Datos inválidos");
      return;
    }

    startTransition(async () => {
      const res = zona ? await updateZona(zona.id, input) : await createZona(input);
      if (res.error) {
        setFormError(res.error);
        return;
      }
      sileo.success({ title: zona ? "Zona actualizada" : `Zona "${input.nombre}" creada` });
      onClose();
    });
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 300,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.45)",
        padding: 16,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: "hsl(var(--surface))",
          borderRadius: 12,
          boxShadow: "0 32px 80px rgba(0,0,0,0.28)",
          width: "100%",
          maxWidth: isTablet ? "calc(100% - 24px)" : 440,
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          animation: "modalIn 0.18s ease-out",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px 14px", borderBottom: "1px solid hsl(var(--border))" }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "hsl(var(--text-main))" }}>
            {zona ? "Editar zona" : "Nueva zona"}
          </h3>
          <button
            data-icon-btn
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: "hsl(var(--text-muted))", padding: 4, display: "flex" }}
          >
            <X size={17} />
          </button>
        </div>

        <div style={{ padding: "18px 22px", overflowY: "auto", flex: 1 }}>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Nombre</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              maxLength={50}
              autoFocus
              placeholder="Ej: Refrigerador"
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Descripción (opcional)</label>
            <input
              type="text"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              maxLength={200}
              placeholder="Ej: Cuarto frío de carnes y lácteos"
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Color</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {ZONA_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: "50%",
                    background: c,
                    border: color === c ? "3px solid hsl(var(--text-main))" : "3px solid transparent",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 0,
                  }}
                >
                  {color === c && <Check size={14} color="white" strokeWidth={3} />}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={labelStyle}>Ícono</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {ZONA_ICON_KEYS.map((key) => {
                const Icon = getZonaIcon(key);
                const selected = icono === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setIcono(key)}
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 8,
                      border: `1.5px solid ${selected ? "hsl(var(--terracota))" : "hsl(var(--border))"}`,
                      background: selected ? "hsl(var(--terracota) / 0.10)" : "hsl(var(--surface))",
                      color: selected ? "hsl(var(--terracota))" : "hsl(var(--text-sub))",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Icon size={17} />
                  </button>
                );
              })}
            </div>
          </div>

          {formError && (
            <div style={{ marginTop: 14, padding: "10px 14px", background: "hsl(var(--terracota) / 0.08)", border: "1px solid hsl(var(--terracota) / 0.25)", borderRadius: 8, fontSize: 13, color: "hsl(var(--terracota))" }}>
              {formError}
            </div>
          )}
        </div>

        <div style={{ padding: "14px 22px", borderTop: "1px solid hsl(var(--border))", display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={cancelBtnStyle}>Cancelar</button>
          <button onClick={handleSubmit} disabled={isPending} style={primaryBtnStyle(isPending)}>
            {isPending ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: "0.4px",
  textTransform: "uppercase",
  color: "hsl(var(--text-sub))",
  marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "9px 12px",
  border: "1px solid hsl(var(--border))",
  borderRadius: 8,
  fontSize: 14,
  color: "hsl(var(--text-main))",
  background: "hsl(var(--surface))",
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "inherit",
};

export const cancelBtnStyle: React.CSSProperties = {
  padding: "9px 18px",
  borderRadius: 8,
  border: "1px solid hsl(var(--border))",
  background: "transparent",
  color: "hsl(var(--text-sub))",
  fontSize: 14,
  fontWeight: 500,
  cursor: "pointer",
  fontFamily: "inherit",
};

export function primaryBtnStyle(isPending: boolean): React.CSSProperties {
  return {
    padding: "9px 20px",
    borderRadius: 8,
    border: "none",
    background: isPending ? "hsl(var(--terracota) / 0.6)" : "hsl(var(--terracota))",
    color: "white",
    fontSize: 14,
    fontWeight: 600,
    cursor: isPending ? "not-allowed" : "pointer",
    fontFamily: "inherit",
  };
}
