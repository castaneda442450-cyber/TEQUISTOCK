"use client";

import { useMemo, useState, useTransition } from "react";
import { useIsTablet } from "@/hooks/useIsTablet";
import { sileo } from "sileo";
import { X, Search, Pencil, Trash2, Plus, Check } from "lucide-react";
import {
  upsertPorcionConfig,
  deletePorcionConfig,
} from "@/lib/actions/porcionado.actions";
import { areCompatible, getCompatibleUnits } from "@/lib/units";
import { formatNumber } from "@/lib/format";
import type { PorcionConfig, Producto, ResumenPorcion } from "@/types";

interface Props {
  productos: Producto[];
  resumen: ResumenPorcion[];
  onClose: () => void;
}

export default function ConfigurarProductosModal({ productos, resumen, onClose }: Props) {
  const isTablet = useIsTablet();
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Producto | null>(null);

  const configMap = useMemo(() => {
    const m = new Map<string, PorcionConfig>();
    for (const r of resumen) if (r.porcion_config) m.set(r.product_id, r.porcion_config);
    return m;
  }, [resumen]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? productos.filter(
          (p) => p.nombre.toLowerCase().includes(q) || p.unidad.toLowerCase().includes(q),
        )
      : productos;
    // Configurados primero
    return [...list].sort((a, b) => {
      const ca = configMap.has(a.id) ? 0 : 1;
      const cb = configMap.has(b.id) ? 0 : 1;
      if (ca !== cb) return ca - cb;
      return a.nombre.localeCompare(b.nombre);
    });
  }, [productos, query, configMap]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.45)",
        padding: 16,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
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
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 24px 16px",
            borderBottom: "1px solid hsl(var(--border))",
          }}
        >
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "hsl(var(--text-main))", margin: 0 }}>
            Configurar productos
          </h2>
          <button
            data-icon-btn
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: "hsl(var(--text-muted))", padding: 4, display: "flex" }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: "16px 24px 0" }}>
          <div style={{ position: "relative", marginBottom: 4 }}>
            <Search
              size={14}
              style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "hsl(var(--text-muted))" }}
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar producto..."
              style={{
                width: "100%",
                padding: "8px 12px 8px 30px",
                borderRadius: 8,
                border: "1px solid hsl(var(--border))",
                fontSize: 13,
                color: "hsl(var(--text-main))",
                background: "hsl(var(--surface))",
                outline: "none",
                fontFamily: "inherit",
                boxSizing: "border-box",
              }}
            />
          </div>
        </div>

        <div style={{ padding: "12px 24px 20px", overflowY: "auto", flex: 1 }}>
          {filtered.length === 0 ? (
            <p style={{ fontSize: 13, color: "hsl(var(--text-muted))", textAlign: "center", padding: 16 }}>
              Sin resultados
            </p>
          ) : (
            filtered.map((p) => (
              <ProductoRow
                key={p.id}
                producto={p}
                config={configMap.get(p.id) ?? null}
                isEditing={editing === p.id}
                onEdit={() => setEditing(p.id)}
                onCancelEdit={() => setEditing(null)}
                onSaved={() => setEditing(null)}
                onDelete={() => setDeleteTarget(p)}
              />
            ))
          )}
        </div>
      </div>

      {deleteTarget && (
        <ConfirmarEliminarConfig
          producto={deleteTarget}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

function ProductoRow({
  producto,
  config,
  isEditing,
  onEdit,
  onCancelEdit,
  onSaved,
  onDelete,
}: {
  producto: Producto;
  config: PorcionConfig | null;
  isEditing: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSaved: () => void;
  onDelete: () => void;
}) {
  return (
    <div style={{ borderBottom: "1px solid hsl(var(--border))", padding: "10px 0" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "hsl(var(--text-main))", display: "block" }}>
            {producto.nombre}
          </span>
          <span style={{ fontSize: 11, color: "hsl(var(--text-muted))" }}>
            Inventario en {producto.unidad}
            {config && (
              <>
                {" · "}
                Porción {formatNumber(config.porcion_size)} {config.porcion_unit} · mín{" "}
                {formatNumber(config.min_porciones)} · alerta {formatNumber(config.merma_alerta_pct)}%
              </>
            )}
          </span>
        </div>

        {config && (
          <span
            style={{
              padding: "2px 10px",
              borderRadius: 99,
              fontSize: 11,
              fontWeight: 600,
              background: "hsl(var(--green) / 0.12)",
              color: "hsl(var(--green))",
              flexShrink: 0,
            }}
          >
            Configurado
          </span>
        )}

        {!isEditing &&
          (config ? (
            <>
              <button
                data-icon-btn
                onClick={onEdit}
                title="Editar"
                style={iconBtn("navy")}
              >
                <Pencil size={13} />
              </button>
              <button
                data-icon-btn
                onClick={onDelete}
                title="Eliminar configuración"
                style={iconBtn("terracota")}
              >
                <Trash2 size={13} />
              </button>
            </>
          ) : (
            <button
              onClick={onEdit}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                padding: "5px 10px",
                background: "hsl(var(--terracota) / 0.10)",
                color: "hsl(var(--terracota))",
                border: "1px solid hsl(var(--terracota) / 0.25)",
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
                flexShrink: 0,
              }}
            >
              <Plus size={12} />
              Configurar
            </button>
          ))}
      </div>

      {isEditing && (
        <ConfigForm
          producto={producto}
          config={config}
          onCancel={onCancelEdit}
          onSaved={onSaved}
        />
      )}
    </div>
  );
}

function ConfigForm({
  producto,
  config,
  onCancel,
  onSaved,
}: {
  producto: Producto;
  config: PorcionConfig | null;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const compatibles = getCompatibleUnits(producto.unidad);
  const [isPending, startTransition] = useTransition();
  const [size, setSize] = useState<string>(config ? String(config.porcion_size) : "");
  const [unit, setUnit] = useState<string>(
    config?.porcion_unit ?? compatibles[0]?.key ?? producto.unidad,
  );
  const [minP, setMinP] = useState<string>(config ? String(config.min_porciones) : "0");
  const [alerta, setAlerta] = useState<string>(
    config ? String(config.merma_alerta_pct) : "15",
  );

  const sinCompatibles = compatibles.length === 0;

  function handleGuardar() {
    const sizeNum = Number(size);
    const minNum = Number(minP);
    const alertaNum = Number(alerta);

    if (!sizeNum || sizeNum <= 0) {
      sileo.error({ title: "El tamaño de porción debe ser mayor a 0" });
      return;
    }
    if (!areCompatible(unit, producto.unidad)) {
      sileo.error({
        title: `La unidad de porción (${unit}) no es compatible con la unidad del producto (${producto.unidad}).`,
        description: "Usa una unidad de la misma familia.",
      });
      return;
    }

    startTransition(async () => {
      const res = await upsertPorcionConfig({
        product_id: producto.id,
        porcion_size: sizeNum,
        porcion_unit: unit,
        min_porciones: Number.isFinite(minNum) ? Math.max(0, Math.round(minNum)) : 0,
        merma_alerta_pct: Number.isFinite(alertaNum) ? alertaNum : 15,
      });
      if (res.error) {
        sileo.error({ title: res.error });
        return;
      }
      sileo.success({ title: config ? "Configuración actualizada" : "Producto configurado" });
      onSaved();
    });
  }

  if (sinCompatibles) {
    return (
      <div
        style={{
          marginTop: 10,
          padding: "10px 12px",
          borderRadius: 8,
          background: "hsl(var(--gold) / 0.10)",
          fontSize: 12.5,
          color: "hsl(var(--text-sub))",
        }}
      >
        La unidad del producto ({producto.unidad}) es de conteo y no admite porcionado
        por conversión.{" "}
        <button
          onClick={onCancel}
          style={{ background: "none", border: "none", color: "hsl(var(--terracota))", cursor: "pointer", fontWeight: 600, fontFamily: "inherit", padding: 0 }}
        >
          Cerrar
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        marginTop: 12,
        padding: "14px 14px",
        borderRadius: 10,
        background: "hsl(var(--surface-alt))",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <div style={{ flex: "2 1 140px" }}>
          <label style={labelStyle}>Tamaño de porción</label>
          <input
            type="number"
            min={0}
            step="0.001"
            value={size}
            onChange={(e) => setSize(e.target.value)}
            placeholder="0"
            style={inputStyle}
          />
        </div>
        <div style={{ flex: "1 1 90px" }}>
          <label style={labelStyle}>Unidad</label>
          <select value={unit} onChange={(e) => setUnit(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
            {compatibles.map((u) => (
              <option key={u.key} value={u.key}>
                {u.short}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 120px" }}>
          <label style={labelStyle}>Mín. porciones (alerta)</label>
          <input
            type="number"
            min={0}
            step="1"
            value={minP}
            onChange={(e) => setMinP(e.target.value)}
            style={inputStyle}
          />
        </div>
        <div style={{ flex: "1 1 120px" }}>
          <label style={labelStyle}>Umbral merma (%)</label>
          <input
            type="number"
            min={0}
            max={100}
            step="0.5"
            value={alerta}
            onChange={(e) => setAlerta(e.target.value)}
            style={inputStyle}
          />
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button
          onClick={onCancel}
          style={{
            padding: "8px 14px",
            fontSize: 13,
            fontWeight: 600,
            borderRadius: 8,
            border: "1px solid hsl(var(--border))",
            background: "transparent",
            color: "hsl(var(--text-sub))",
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          Cancelar
        </button>
        <button
          onClick={handleGuardar}
          disabled={isPending}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 16px",
            fontSize: 13,
            fontWeight: 600,
            borderRadius: 8,
            border: "none",
            background: "hsl(var(--terracota))",
            color: "white",
            cursor: isPending ? "not-allowed" : "pointer",
            opacity: isPending ? 0.6 : 1,
            fontFamily: "inherit",
          }}
        >
          <Check size={14} />
          {isPending ? "Guardando..." : "Guardar"}
        </button>
      </div>
    </div>
  );
}

function ConfirmarEliminarConfig({
  producto,
  onClose,
}: {
  producto: Producto;
  onClose: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const res = await deletePorcionConfig(producto.id);
      if (res.error) {
        sileo.error({ title: res.error });
        return;
      }
      sileo.success({ title: "Configuración eliminada" });
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
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: "hsl(var(--surface))",
          borderRadius: 12,
          boxShadow: "0 32px 80px rgba(0,0,0,0.28)",
          width: "100%",
          maxWidth: 400,
          padding: 24,
          animation: "modalIn 0.18s ease-out",
        }}
      >
        <h3 style={{ fontSize: 16, fontWeight: 700, color: "hsl(var(--text-main))", margin: "0 0 8px" }}>
          Eliminar configuración
        </h3>
        <p style={{ fontSize: 14, color: "hsl(var(--text-sub))", margin: "0 0 20px", lineHeight: 1.5 }}>
          ¿Quitar la configuración de porción de{" "}
          <strong style={{ color: "hsl(var(--text-main))" }}>{producto.nombre}</strong>? Los
          registros de porcionado existentes se conservan.
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            style={{
              padding: "9px 16px",
              fontSize: 13,
              fontWeight: 600,
              borderRadius: 8,
              border: "1px solid hsl(var(--border))",
              background: "transparent",
              color: "hsl(var(--text-sub))",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleDelete}
            disabled={isPending}
            style={{
              padding: "9px 16px",
              fontSize: 13,
              fontWeight: 600,
              borderRadius: 8,
              border: "none",
              background: "hsl(var(--terracota))",
              color: "white",
              cursor: isPending ? "not-allowed" : "pointer",
              opacity: isPending ? 0.6 : 1,
              fontFamily: "inherit",
            }}
          >
            {isPending ? "Eliminando..." : "Sí, eliminar"}
          </button>
        </div>
      </div>
    </div>
  );
}

function iconBtn(tone: "navy" | "terracota"): React.CSSProperties {
  return {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 28,
    height: 28,
    borderRadius: 6,
    border: "none",
    background: `hsl(var(--${tone}) / 0.08)`,
    color: `hsl(var(--${tone}))`,
    cursor: "pointer",
    flexShrink: 0,
  };
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 10.5,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  color: "hsl(var(--text-sub))",
  marginBottom: 5,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 11px",
  fontSize: 13,
  borderRadius: 8,
  border: "1px solid hsl(var(--border))",
  backgroundColor: "hsl(var(--bg))",
  color: "hsl(var(--text-main))",
  outline: "none",
  fontFamily: "inherit",
  boxSizing: "border-box",
};
