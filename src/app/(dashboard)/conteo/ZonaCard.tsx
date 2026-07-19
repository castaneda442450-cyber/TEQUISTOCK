"use client";

import { Pencil, Layers as LayersIcon } from "lucide-react";
import { getZonaIcon } from "./zonaIcons";
import type { Zona } from "@/types";

interface Props {
  zona: Zona;
  onEdit: () => void;
  onGestionarProductos: () => void;
}

export default function ZonaCard({ zona, onEdit, onGestionarProductos }: Props) {
  const Icon = getZonaIcon(zona.icono);

  return (
    <div
      style={{
        background: "hsl(var(--surface))",
        border: "1px solid hsl(var(--border))",
        borderRadius: 10,
        padding: 16,
        boxShadow: "0 2px 8px var(--shadow-color)",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: `${zona.color}22`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Icon size={20} style={{ color: zona.color }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: "hsl(var(--text-main))",
              display: "block",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {zona.nombre}
          </span>
          <span
            style={{
              fontSize: 12,
              color: "hsl(var(--text-sub))",
              display: "block",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {zona.descripcion || "Sin descripción"}
          </span>
        </div>
        <button
          data-icon-btn
          onClick={onEdit}
          title="Editar zona"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 28,
            height: 28,
            borderRadius: 6,
            border: "none",
            background: "hsl(var(--navy) / 0.08)",
            color: "hsl(var(--navy))",
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          <Pencil size={13} />
        </button>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            fontSize: 12,
            color: "hsl(var(--text-sub))",
          }}
        >
          <LayersIcon size={13} />
          {zona.total_productos ?? 0} producto{(zona.total_productos ?? 0) !== 1 ? "s" : ""}
        </span>
        <span
          style={{
            padding: "2px 10px",
            borderRadius: 99,
            fontSize: 11,
            fontWeight: 600,
            background: zona.activo ? "hsl(var(--green) / 0.12)" : "hsl(var(--text-muted) / 0.12)",
            color: zona.activo ? "hsl(var(--green))" : "hsl(var(--text-muted))",
            border: `1px solid ${zona.activo ? "hsl(var(--green) / 0.25)" : "hsl(var(--text-muted) / 0.25)"}`,
          }}
        >
          {zona.activo ? "Activa" : "Inactiva"}
        </span>
      </div>

      <button
        onClick={onGestionarProductos}
        style={{
          padding: "8px 0",
          borderRadius: 8,
          border: "1px solid hsl(var(--border))",
          background: "transparent",
          color: "hsl(var(--text-main))",
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
          fontFamily: "inherit",
        }}
      >
        Gestionar productos
      </button>
    </div>
  );
}
