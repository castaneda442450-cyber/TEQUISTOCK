"use client";

import { useState, useEffect, useMemo, useTransition } from "react";
import { useIsTablet } from "@/hooks/useIsTablet";
import { sileo } from "sileo";
import { Plus, Pencil, Trash2, Search, X } from "lucide-react";
import {
  deleteZona,
  toggleZonaActivo,
  asignarProductos,
} from "@/lib/actions/zonas.actions";
import { getZonaIcon } from "./zonaIcons";
import { ZonaFormModal, cancelBtnStyle, primaryBtnStyle } from "./ZonaFormModal";
import type { Zona, Producto } from "@/types";

interface Props {
  zonas: Zona[];
  productos: Producto[];
  initialTab?: "mis-zonas" | "asignar";
  initialZonaId?: string;
  onClose: () => void;
}

type Tab = "mis-zonas" | "asignar";

// ─── Confirmar eliminar zona ─────────────────────────────────────────────────

function ConfirmarEliminarZonaModal({
  zona,
  onConfirm,
  onClose,
  isPending,
}: {
  zona: Zona;
  onConfirm: () => void;
  onClose: () => void;
  isPending: boolean;
}) {
  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.45)", padding: 16 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: "hsl(var(--surface))", borderRadius: 12, boxShadow: "0 32px 80px rgba(0,0,0,0.28)", width: "100%", maxWidth: 400, padding: 24, animation: "modalIn 0.18s ease-out" }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: "hsl(var(--text-main))", margin: "0 0 8px" }}>Eliminar zona</h3>
        <p style={{ fontSize: 14, color: "hsl(var(--text-sub))", margin: "0 0 20px", lineHeight: 1.5 }}>
          ¿Eliminar <strong style={{ color: "hsl(var(--text-main))" }}>"{zona.nombre}"</strong>? Esta acción no se puede deshacer.
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={cancelBtnStyle}>Cancelar</button>
          <button onClick={onConfirm} disabled={isPending} style={primaryBtnStyle(isPending)}>
            {isPending ? "Eliminando..." : "Sí, eliminar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Mis zonas ───────────────────────────────────────────────────────────

function ZonaRow({ zona, onEdit }: { zona: Zona; onEdit: () => void }) {
  const [deleteTarget, setDeleteTarget] = useState(false);
  const [isPendingToggle, startToggleTransition] = useTransition();
  const [isPendingDelete, startDeleteTransition] = useTransition();
  const Icon = getZonaIcon(zona.icono);

  function handleToggle() {
    startToggleTransition(async () => {
      const res = await toggleZonaActivo(zona.id, !zona.activo);
      if (res.error) sileo.error({ title: res.error });
      else sileo.success({ title: zona.activo ? "Zona desactivada" : "Zona activada" });
    });
  }

  function handleDelete() {
    startDeleteTransition(async () => {
      const res = await deleteZona(zona.id);
      if (res.error) {
        sileo.error({ title: res.error });
        setDeleteTarget(false);
        return;
      }
      sileo.success({ title: "Zona eliminada" });
      setDeleteTarget(false);
    });
  }

  return (
    <>
      {deleteTarget && (
        <ConfirmarEliminarZonaModal zona={zona} onConfirm={handleDelete} onClose={() => setDeleteTarget(false)} isPending={isPendingDelete} />
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 4px", borderBottom: "1px solid hsl(var(--border))" }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: `${zona.color}22`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon size={15} style={{ color: zona.color }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "hsl(var(--text-main))", display: "block" }}>{zona.nombre}</span>
          <span style={{ fontSize: 11, color: "hsl(var(--text-muted))" }}>
            {zona.total_productos ?? 0} producto{(zona.total_productos ?? 0) !== 1 ? "s" : ""}
          </span>
        </div>
        <span
          style={{
            padding: "2px 10px",
            borderRadius: 99,
            fontSize: 11,
            fontWeight: 600,
            background: zona.activo ? "hsl(var(--green) / 0.12)" : "hsl(var(--text-muted) / 0.12)",
            color: zona.activo ? "hsl(var(--green))" : "hsl(var(--text-muted))",
            flexShrink: 0,
          }}
        >
          {zona.activo ? "Activa" : "Inactiva"}
        </span>
        <div style={{ position: "relative", width: 32, height: 18, flexShrink: 0 }}>
          <input
            type="checkbox"
            checked={zona.activo}
            disabled={isPendingToggle}
            onChange={handleToggle}
            style={{ opacity: 0, width: 0, height: 0, position: "absolute" }}
          />
          <div
            onClick={handleToggle}
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: 99,
              background: zona.activo ? "hsl(var(--green))" : "hsl(var(--border-strong))",
              transition: "background 0.2s",
              opacity: isPendingToggle ? 0.5 : 1,
              cursor: "pointer",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 2,
              left: zona.activo ? 16 : 2,
              width: 14,
              height: 14,
              borderRadius: "50%",
              background: "white",
              transition: "left 0.2s",
              boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
              pointerEvents: "none",
            }}
          />
        </div>
        <button
          data-icon-btn
          onClick={onEdit}
          title="Editar"
          style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: 6, border: "none", background: "hsl(var(--navy) / 0.08)", color: "hsl(var(--navy))", cursor: "pointer", flexShrink: 0 }}
        >
          <Pencil size={13} />
        </button>
        <button
          data-icon-btn
          onClick={() => setDeleteTarget(true)}
          title="Eliminar"
          style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: 6, border: "none", background: "hsl(var(--terracota) / 0.08)", color: "hsl(var(--terracota))", cursor: "pointer", flexShrink: 0 }}
        >
          <Trash2 size={13} />
        </button>
      </div>
    </>
  );
}

function TabMisZonas({ zonas }: { zonas: Zona[] }) {
  const [formTarget, setFormTarget] = useState<"new" | Zona | null>(null);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
        <button
          onClick={() => setFormTarget("new")}
          style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", background: "hsl(var(--terracota) / 0.10)", color: "hsl(var(--terracota))", border: "1px solid hsl(var(--terracota) / 0.25)", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
        >
          <Plus size={13} />
          Nueva zona
        </button>
      </div>

      {zonas.length === 0 ? (
        <p style={{ fontSize: 13, color: "hsl(var(--text-muted))", textAlign: "center", padding: "24px 0" }}>
          No hay zonas creadas todavía
        </p>
      ) : (
        <div>
          {zonas.map((z) => (
            <ZonaRow key={z.id} zona={z} onEdit={() => setFormTarget(z)} />
          ))}
        </div>
      )}

      {formTarget && (
        <ZonaFormModal
          zona={formTarget === "new" ? null : formTarget}
          onClose={() => setFormTarget(null)}
        />
      )}
    </div>
  );
}

// ─── Tab: Asignar productos ───────────────────────────────────────────────────

function TabAsignar({
  zonas,
  productos,
  initialZonaId,
  onSaved,
}: {
  zonas: Zona[];
  productos: Producto[];
  initialZonaId?: string;
  onSaved: () => void;
}) {
  const zonasActivas = useMemo(() => zonas.filter((z) => z.activo), [zonas]);
  const [selectedZonaId, setSelectedZonaId] = useState<string | null>(
    initialZonaId && zonasActivas.some((z) => z.id === initialZonaId)
      ? initialZonaId
      : (zonasActivas[0]?.id ?? null),
  );
  const [query, setQuery] = useState("");
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  const selectedZona = zonasActivas.find((z) => z.id === selectedZonaId) ?? null;

  useEffect(() => {
    setChecked(new Set((selectedZona?.productos ?? []).map((p) => p.id)));
  }, [selectedZonaId, selectedZona]);

  const filtered = useMemo(() => {
    if (!query.trim()) return productos;
    const q = query.trim().toLowerCase();
    return productos.filter((p) => p.nombre.toLowerCase().includes(q));
  }, [productos, query]);

  function toggleProduct(id: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function handleGuardar() {
    if (!selectedZonaId) return;
    startTransition(async () => {
      const res = await asignarProductos(selectedZonaId, Array.from(checked));
      if (res.error) {
        sileo.error({ title: res.error });
        return;
      }
      sileo.success({ title: "Asignación guardada" });
      onSaved();
    });
  }

  if (zonasActivas.length === 0) {
    return (
      <p style={{ fontSize: 13, color: "hsl(var(--text-muted))", textAlign: "center", padding: "24px 0" }}>
        Crea una zona activa primero
      </p>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
        {zonasActivas.map((z) => {
          const selected = z.id === selectedZonaId;
          return (
            <button
              key={z.id}
              onClick={() => setSelectedZonaId(z.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 12px",
                borderRadius: 99,
                border: `1.5px solid ${selected ? "hsl(var(--terracota))" : "hsl(var(--border))"}`,
                background: selected ? "hsl(var(--terracota) / 0.08)" : "hsl(var(--surface))",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 600,
                color: "hsl(var(--text-main))",
                fontFamily: "inherit",
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: z.color, flexShrink: 0 }} />
              {z.nombre}
            </button>
          );
        })}
      </div>

      <div style={{ position: "relative", marginBottom: 10 }}>
        <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "hsl(var(--text-muted))" }} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar producto..."
          style={{ width: "100%", padding: "8px 12px 8px 30px", borderRadius: 8, border: "1px solid hsl(var(--border))", fontSize: 13, color: "hsl(var(--text-main))", background: "hsl(var(--surface))", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
        />
      </div>

      <div style={{ maxHeight: 280, overflowY: "auto", border: "1px solid hsl(var(--border))", borderRadius: 8 }}>
        {filtered.length === 0 ? (
          <p style={{ fontSize: 13, color: "hsl(var(--text-muted))", textAlign: "center", padding: 16 }}>Sin resultados</p>
        ) : (
          filtered.map((p) => (
            <label
              key={p.id}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderBottom: "1px solid hsl(var(--border))", cursor: "pointer" }}
            >
              <input type="checkbox" checked={checked.has(p.id)} onChange={() => toggleProduct(p.id)} style={{ width: 15, height: 15, accentColor: "hsl(var(--terracota))", cursor: "pointer" }} />
              <span style={{ fontSize: 13, color: "hsl(var(--text-main))", flex: 1 }}>{p.nombre}</span>
              <span style={{ fontSize: 12, color: "hsl(var(--text-muted))" }}>{p.unidad}</span>
              {p.categoria && (
                <span style={{ background: `${p.categoria.color}22`, color: p.categoria.color, borderRadius: 99, fontSize: 10, fontWeight: 600, padding: "1px 8px" }}>
                  {p.categoria.nombre}
                </span>
              )}
            </label>
          ))
        )}
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}>
        <button onClick={handleGuardar} disabled={isPending} style={primaryBtnStyle(isPending)}>
          {isPending ? "Guardando..." : "Guardar asignación"}
        </button>
      </div>
    </div>
  );
}

// ─── Modal principal ──────────────────────────────────────────────────────────

export default function GestionarZonasModal({ zonas, productos, initialTab, initialZonaId, onClose }: Props) {
  const [tab, setTab] = useState<Tab>(initialTab ?? "mis-zonas");
  const isTablet = useIsTablet();

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.45)", padding: 16 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: "hsl(var(--surface))",
          borderRadius: 12,
          boxShadow: "0 32px 80px rgba(0,0,0,0.28)",
          width: "100%",
          maxWidth: isTablet ? "calc(100% - 24px)" : 620,
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          animation: "modalIn 0.18s ease-out",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px 0" }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "hsl(var(--text-main))", margin: 0 }}>Gestionar zonas</h2>
          <button
            data-icon-btn
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: "hsl(var(--text-muted))", padding: 4, display: "flex" }}
          >
            <X size={18} />
          </button>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: isTablet ? "column" : "row",
            gap: 8,
            padding: "16px 24px 0",
            borderBottom: "1px solid hsl(var(--border))",
          }}
        >
          {(["mis-zonas", "asignar"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: "8px 4px",
                background: "none",
                border: "none",
                borderBottom: !isTablet && tab === t ? "2px solid hsl(var(--terracota))" : "2px solid transparent",
                borderRadius: isTablet ? 8 : 0,
                backgroundColor: isTablet ? (tab === t ? "hsl(var(--terracota) / 0.08)" : "transparent") : "transparent",
                color: tab === t ? "hsl(var(--terracota))" : "hsl(var(--text-sub))",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
                textAlign: "left",
              }}
            >
              {t === "mis-zonas" ? "Mis zonas" : "Asignar productos"}
            </button>
          ))}
        </div>

        <div style={{ padding: "18px 24px", overflowY: "auto", flex: 1 }}>
          {tab === "mis-zonas" ? (
            <TabMisZonas zonas={zonas} />
          ) : (
            <TabAsignar zonas={zonas} productos={productos} initialZonaId={initialZonaId} onSaved={onClose} />
          )}
        </div>
      </div>
    </div>
  );
}
