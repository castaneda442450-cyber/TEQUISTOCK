"use client";

import { ScanBarcode } from "lucide-react";
import ZonaCard from "./ZonaCard";
import type { Zona } from "@/types";

interface Props {
  zonas: Zona[];
  onCrearPrimeraZona: () => void;
  onEditZona: (id: string) => void;
  onGestionarProductos: (id: string) => void;
}

export default function ListaView({ zonas, onCrearPrimeraZona, onEditZona, onGestionarProductos }: Props) {
  const zonasActivas = zonas.filter((z) => z.activo);

  if (zonasActivas.length === 0) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "60px 24px",
          background: "hsl(var(--surface))",
          border: "1px dashed hsl(var(--border-strong))",
          borderRadius: 10,
          gap: 12,
        }}
      >
        <ScanBarcode size={40} style={{ color: "hsl(var(--text-muted))" }} />
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 15, fontWeight: 600, color: "hsl(var(--text-sub))", margin: "0 0 4px" }}>
            Aún no tienes zonas configuradas
          </p>
          <p style={{ fontSize: 13, color: "hsl(var(--text-muted))", margin: 0 }}>
            Crea tu primera zona para empezar a contar
          </p>
        </div>
        <button
          onClick={onCrearPrimeraZona}
          style={{
            marginTop: 8,
            padding: "9px 18px",
            background: "hsl(var(--terracota))",
            color: "white",
            border: "none",
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          Crear primera zona
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
        gap: 14,
      }}
    >
      {zonasActivas.map((zona) => (
        <ZonaCard
          key={zona.id}
          zona={zona}
          onEdit={() => onEditZona(zona.id)}
          onGestionarProductos={() => onGestionarProductos(zona.id)}
        />
      ))}
    </div>
  );
}
