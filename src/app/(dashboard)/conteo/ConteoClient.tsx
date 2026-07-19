"use client";

import { useState } from "react";
import { ScanBarcode } from "lucide-react";
import ListaView from "./ListaView";
import ConteoView from "./ConteoView";
import GestionarZonasModal from "./GestionarZonasModal";
import { ZonaFormModal } from "./ZonaFormModal";
import type { Zona, Producto } from "@/types";

interface Props {
  zonas: Zona[];
  productos: Producto[];
}

interface GestionModalState {
  initialTab?: "mis-zonas" | "asignar";
  initialZonaId?: string;
}

export default function ConteoClient({ zonas, productos }: Props) {
  const [vista, setVista] = useState<"lista" | "conteo">("lista");
  const [gestionModal, setGestionModal] = useState<GestionModalState | null>(null);
  const [editingZona, setEditingZona] = useState<Zona | null>(null);

  return (
    <div className="tablet-page-content" style={{ padding: "28px 32px", maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <ScanBarcode size={22} style={{ color: "hsl(var(--terracota))" }} />
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "hsl(var(--text-main))", margin: 0, letterSpacing: "-0.02em" }}>
              Conteo por zonas
            </h1>
            <p style={{ fontSize: 13, color: "hsl(var(--text-sub))", margin: "2px 0 0" }}>
              {zonas.filter((z) => z.activo).length} zona{zonas.filter((z) => z.activo).length !== 1 ? "s" : ""} activa
              {zonas.filter((z) => z.activo).length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {vista === "lista" ? (
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => setGestionModal({})}
              style={{
                padding: "9px 18px",
                background: "hsl(var(--surface))",
                color: "hsl(var(--text-main))",
                border: "1.5px solid hsl(var(--border))",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Gestionar zonas
            </button>
            <button
              onClick={() => setVista("conteo")}
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
              Nuevo conteo
            </button>
          </div>
        ) : null}
      </div>

      {vista === "lista" ? (
        <ListaView
          zonas={zonas}
          onCrearPrimeraZona={() => setGestionModal({ initialTab: "mis-zonas" })}
          onEditZona={(id) => setEditingZona(zonas.find((z) => z.id === id) ?? null)}
          onGestionarProductos={(id) => setGestionModal({ initialTab: "asignar", initialZonaId: id })}
        />
      ) : (
        <ConteoView zonas={zonas} onVolverALista={() => setVista("lista")} />
      )}

      {gestionModal && (
        <GestionarZonasModal
          zonas={zonas}
          productos={productos}
          initialTab={gestionModal.initialTab}
          initialZonaId={gestionModal.initialZonaId}
          onClose={() => setGestionModal(null)}
        />
      )}

      {editingZona && (
        <ZonaFormModal zona={editingZona} onClose={() => setEditingZona(null)} />
      )}
    </div>
  );
}
