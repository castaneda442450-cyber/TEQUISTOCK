"use client";

import { Package, Plus } from "lucide-react";

interface EmptyStateProps {
  hasFilters: boolean;
  onCreate: () => void;
}

export function EmptyState({ hasFilters, onCreate }: EmptyStateProps) {
  return (
    <div
      style={{
        padding: "60px 24px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: 16,
          background: "hsl(var(--surface-alt))",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Package size={32} style={{ color: "hsl(var(--text-muted))" }} />
      </div>

      <div>
        <p
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: "hsl(var(--text-main))",
            margin: 0,
          }}
        >
          {hasFilters ? "No se encontraron productos" : "No hay productos registrados"}
        </p>
        <p
          style={{
            fontSize: 13,
            color: "hsl(var(--text-muted))",
            margin: "4px 0 0 0",
            maxWidth: 320,
          }}
        >
          {hasFilters
            ? "Intenta ajustar los filtros o limpiar la búsqueda."
            : "Empieza agregando tu primer producto al catálogo."}
        </p>
      </div>

      {!hasFilters && (
        <button
          onClick={onCreate}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "9px 18px",
            fontSize: 13,
            fontWeight: 600,
            color: "white",
            backgroundColor: "hsl(var(--green))",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            fontFamily: "inherit",
            transition: "opacity 0.15s ease",
            marginTop: 4,
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = "0.9")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = "1")}
        >
          <Plus size={15} />
          Crear primero
        </button>
      )}
    </div>
  );
}
