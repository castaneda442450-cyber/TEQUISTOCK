"use client";

import { useState, useMemo, useTransition } from "react";
import { useIsTablet } from "@/hooks/useIsTablet";
import { Info, ChevronDown, ChevronRight, Plus, Minus, X, Pencil, Trash2, ChefHat } from "lucide-react";
import { sileo } from "sileo";
import { ProductoSearchSelect } from "@/components/ui/ProductoSearchSelect";
import type { FichaTecnica, Producto } from "@/types";
import {
  createFichasPlatillo,
  updateFichaQty,
  deleteFicha,
  deletePlatillo,
  toggleFichaActivo,
} from "@/lib/actions/fichas.actions";

interface Props {
  fichas: FichaTecnica[];
  productos: Producto[];
}

interface LineItem {
  producto_id: string;
  qty_por_porcion: number;
}

// ─── Modal Nuevo Platillo ────────────────────────────────────────────────────

function NuevoPlatilloModal({
  productos,
  onClose,
}: {
  productos: Producto[];
  onClose: () => void;
}) {
  const [platilloNombre, setPlatilloNombre] = useState("");
  const [lines, setLines] = useState<LineItem[]>([{ producto_id: "", qty_por_porcion: 1 }]);
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const isTablet = useIsTablet();

  const addLine = () =>
    setLines((prev) => [...prev, { producto_id: "", qty_por_porcion: 1 }]);

  const removeLine = (i: number) =>
    setLines((prev) => prev.filter((_, idx) => idx !== i));

  const updateLine = (i: number, field: keyof LineItem, value: string | number) =>
    setLines((prev) =>
      prev.map((l, idx) => (idx === i ? { ...l, [field]: value } : l))
    );

  const handleSubmit = () => {
    setFormError(null);

    if (!platilloNombre.trim() || platilloNombre.trim().length < 2) {
      setFormError("El nombre del platillo debe tener al menos 2 caracteres");
      return;
    }

    const validLines = lines.filter((l) => l.producto_id);
    if (validLines.length === 0) {
      setFormError("Agrega al menos un ingrediente");
      return;
    }

    const ids = validLines.map((l) => l.producto_id);
    if (new Set(ids).size !== ids.length) {
      setFormError("No puedes agregar el mismo ingrediente dos veces");
      return;
    }

    const invalidQty = validLines.find((l) => !l.qty_por_porcion || l.qty_por_porcion <= 0);
    if (invalidQty) {
      setFormError("Todas las cantidades deben ser mayores a 0");
      return;
    }

    startTransition(async () => {
      const result = await createFichasPlatillo(
        platilloNombre.trim(),
        validLines,
        productos
      );
      if (result.error) {
        setFormError(result.error);
        return;
      }
      sileo.success({ title: `Platillo "${platilloNombre.trim()}" guardado` });
      onClose();
    });
  };

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
        padding: "16px",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: "hsl(var(--surface))",
          borderRadius: 12,
          boxShadow: "0 32px 80px rgba(0,0,0,0.28)",
          width: "100%",
          maxWidth: isTablet ? "calc(100% - 24px)" : 560,
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          animation: "modalIn 0.18s ease-out",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 24px 16px",
            borderBottom: "1px solid hsl(var(--border))",
          }}
        >
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "hsl(var(--text-main))", margin: 0 }}>
              Nuevo platillo
            </h2>
            <p style={{ fontSize: 12, color: "hsl(var(--text-sub))", margin: "2px 0 0" }}>
              Registra los ingredientes y sus cantidades por porción
            </p>
          </div>
          <button
            data-icon-btn
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "hsl(var(--text-muted))",
              padding: 4,
              borderRadius: 6,
              display: "flex",
              alignItems: "center",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1 }}>
          {/* Nombre del platillo */}
          <div style={{ marginBottom: 20 }}>
            <label
              style={{
                display: "block",
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.4px",
                textTransform: "uppercase",
                color: "hsl(var(--text-sub))",
                marginBottom: 6,
              }}
            >
              Nombre del platillo
            </label>
            <input
              type="text"
              value={platilloNombre}
              onChange={(e) => setPlatilloNombre(e.target.value)}
              placeholder="Ej: Tacos de carne asada"
              maxLength={100}
              autoFocus
              style={{
                width: "100%",
                padding: "9px 12px",
                border: "1px solid hsl(var(--border))",
                borderRadius: 8,
                fontSize: 14,
                color: "hsl(var(--text-main))",
                background: "hsl(var(--surface))",
                outline: "none",
                boxSizing: "border-box",
                transition: "border-color 0.15s, box-shadow 0.15s",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "hsl(var(--terracota))";
                e.currentTarget.style.boxShadow = "0 0 0 3px hsl(var(--terracota) / 0.12)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "hsl(var(--border))";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
          </div>

          {/* Ingredientes */}
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 8,
              }}
            >
              <label
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: "0.4px",
                  textTransform: "uppercase",
                  color: "hsl(var(--text-sub))",
                }}
              >
                Ingredientes
              </label>
              <button
                type="button"
                onClick={addLine}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "4px 10px",
                  background: "hsl(var(--terracota) / 0.10)",
                  color: "hsl(var(--terracota))",
                  border: "1px solid hsl(var(--terracota) / 0.25)",
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                <Plus size={13} />
                Agregar
              </button>
            </div>

            {/* Header de columnas */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr 32px",
                gap: 8,
                marginBottom: 6,
                padding: "0 2px",
              }}
            >
              <span style={{ fontSize: 11, color: "hsl(var(--text-muted))", fontWeight: 600 }}>
                Producto
              </span>
              <span style={{ fontSize: 11, color: "hsl(var(--text-muted))", fontWeight: 600 }}>
                Cantidad / porción
              </span>
              <span />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {lines.map((line, i) => (
                <div
                  key={i}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "2fr 1fr 32px",
                    gap: 8,
                    alignItems: "center",
                  }}
                >
                  <ProductoSearchSelect
                    productos={productos}
                    value={line.producto_id}
                    onChange={(id) => updateLine(i, "producto_id", id)}
                    placeholder="Selecciona un producto..."
                  />

                  <input
                    type="number"
                    value={line.qty_por_porcion}
                    min={0.001}
                    step={0.001}
                    onChange={(e) =>
                      updateLine(i, "qty_por_porcion", parseFloat(e.target.value) || 0)
                    }
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      fontSize: 13,
                      color: "hsl(var(--text-main))",
                      background: "hsl(var(--surface))",
                      outline: "none",
                      fontFamily: "inherit",
                      boxSizing: "border-box",
                    }}
                  />

                  <button
                    data-icon-btn
                    type="button"
                    onClick={() => removeLine(i)}
                    disabled={lines.length === 1}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      border: "none",
                      background: lines.length === 1 ? "transparent" : "hsl(var(--terracota) / 0.08)",
                      color: lines.length === 1 ? "hsl(var(--text-muted))" : "hsl(var(--terracota))",
                      cursor: lines.length === 1 ? "not-allowed" : "pointer",
                      flexShrink: 0,
                    }}
                  >
                    <Minus size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {formError && (
            <div
              style={{
                marginTop: 14,
                padding: "10px 14px",
                background: "hsl(var(--terracota) / 0.08)",
                border: "1px solid hsl(var(--terracota) / 0.25)",
                borderRadius: 8,
                fontSize: 13,
                color: "hsl(var(--terracota))",
              }}
            >
              {formError}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid hsl(var(--border))",
            display: "flex",
            gap: 10,
            justifyContent: "flex-end",
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "9px 18px",
              borderRadius: 8,
              border: "1px solid hsl(var(--border))",
              background: "transparent",
              color: "hsl(var(--text-sub))",
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={isPending}
            style={{
              padding: "9px 20px",
              borderRadius: 8,
              border: "none",
              background: isPending ? "hsl(var(--terracota) / 0.6)" : "hsl(var(--terracota))",
              color: "white",
              fontSize: 14,
              fontWeight: 600,
              cursor: isPending ? "not-allowed" : "pointer",
              fontFamily: "inherit",
            }}
          >
            {isPending ? "Guardando..." : "Guardar platillo"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal Confirmar Eliminar Platillo ───────────────────────────────────────

function ConfirmarEliminarModal({
  platilloNombre,
  onConfirm,
  onClose,
  isPending,
}: {
  platilloNombre: string;
  onConfirm: () => void;
  onClose: () => void;
  isPending: boolean;
}) {
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
          maxWidth: 400,
          padding: 24,
          animation: "modalIn 0.18s ease-out",
        }}
      >
        <h3 style={{ fontSize: 16, fontWeight: 700, color: "hsl(var(--text-main))", margin: "0 0 8px" }}>
          Eliminar platillo
        </h3>
        <p style={{ fontSize: 14, color: "hsl(var(--text-sub))", margin: "0 0 20px", lineHeight: 1.5 }}>
          ¿Eliminar <strong style={{ color: "hsl(var(--text-main))" }}>"{platilloNombre}"</strong> y todos sus ingredientes? Esta acción no se puede deshacer.
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            style={{
              padding: "9px 18px",
              borderRadius: 8,
              border: "1px solid hsl(var(--border))",
              background: "transparent",
              color: "hsl(var(--text-sub))",
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            style={{
              padding: "9px 18px",
              borderRadius: 8,
              border: "none",
              background: isPending ? "hsl(var(--terracota) / 0.6)" : "hsl(var(--terracota))",
              color: "white",
              fontSize: 14,
              fontWeight: 600,
              cursor: isPending ? "not-allowed" : "pointer",
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

// ─── Fila de ingrediente ─────────────────────────────────────────────────────

function IngredienteRow({
  ficha,
  editRow,
  setEditRow,
}: {
  ficha: FichaTecnica;
  editRow: { id: string; qty: string } | null;
  setEditRow: (v: { id: string; qty: string } | null) => void;
}) {
  const [, startTransition] = useTransition();
  const isEditing = editRow?.id === ficha.id;

  const saveEdit = () => {
    const qty = parseFloat(editRow?.qty ?? "");
    if (!qty || qty <= 0) {
      sileo.error({ title: "La cantidad debe ser mayor a 0" });
      setEditRow(null);
      return;
    }
    if (qty === ficha.qty_por_porcion) {
      setEditRow(null);
      return;
    }
    startTransition(async () => {
      const result = await updateFichaQty(ficha.id, qty);
      if (result.error) sileo.error({ title: result.error });
      else sileo.success({ title: "Cantidad actualizada" });
      setEditRow(null);
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteFicha(ficha.id);
      if (result.error) sileo.error({ title: result.error });
      else sileo.success({ title: "Ingrediente eliminado" });
    });
  };

  return (
    <tr>
      <td
        style={{
          padding: "10px 14px",
          fontSize: 13,
          color: "hsl(var(--text-main))",
          borderBottom: "1px solid hsl(var(--border))",
        }}
      >
        {ficha.producto?.nombre ?? ficha.producto_id}
      </td>
      <td
        style={{
          padding: "10px 14px",
          borderBottom: "1px solid hsl(var(--border))",
        }}
      >
        {isEditing ? (
          <input
            type="number"
            defaultValue={ficha.qty_por_porcion}
            min={0.001}
            step={0.001}
            autoFocus
            onChange={(e) => setEditRow({ id: ficha.id, qty: e.target.value })}
            onBlur={saveEdit}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveEdit();
              if (e.key === "Escape") setEditRow(null);
            }}
            style={{
              width: 90,
              padding: "5px 8px",
              border: "1px solid hsl(var(--terracota))",
              borderRadius: 6,
              fontSize: 13,
              color: "hsl(var(--text-main))",
              background: "hsl(var(--surface))",
              outline: "none",
              boxShadow: "0 0 0 3px hsl(var(--terracota) / 0.12)",
              fontFamily: "inherit",
            }}
          />
        ) : (
          <span
            style={{
              fontSize: 13,
              color: "hsl(var(--text-main))",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {ficha.qty_por_porcion}
          </span>
        )}
      </td>
      <td
        style={{
          padding: "10px 14px",
          fontSize: 13,
          color: "hsl(var(--text-sub))",
          borderBottom: "1px solid hsl(var(--border))",
        }}
      >
        {ficha.unidad}
      </td>
      <td
        style={{
          padding: "10px 14px",
          borderBottom: "1px solid hsl(var(--border))",
          whiteSpace: "nowrap",
        }}
      >
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <button
            data-icon-btn
            onClick={() => setEditRow({ id: ficha.id, qty: String(ficha.qty_por_porcion) })}
            title="Editar cantidad"
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
            }}
          >
            <Pencil size={13} />
          </button>
          <button
            data-icon-btn
            onClick={handleDelete}
            title="Eliminar ingrediente"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 28,
              height: 28,
              borderRadius: 6,
              border: "none",
              background: "hsl(var(--terracota) / 0.08)",
              color: "hsl(var(--terracota))",
              cursor: "pointer",
            }}
          >
            <Trash2 size={13} />
          </button>
        </div>
      </td>
    </tr>
  );
}

// ─── Card de platillo ────────────────────────────────────────────────────────

function PlatilloCard({
  nombre,
  items,
  isExpanded,
  onToggleExpand,
}: {
  nombre: string;
  items: FichaTecnica[];
  isExpanded: boolean;
  onToggleExpand: () => void;
}) {
  const [editRow, setEditRow] = useState<{ id: string; qty: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [isPendingToggle, startToggleTransition] = useTransition();
  const [isPendingDelete, startDeleteTransition] = useTransition();

  const activo = items.every((f) => f.activo);

  const handleToggleActivo = () => {
    startToggleTransition(async () => {
      const result = await toggleFichaActivo(nombre, !activo);
      if (result.error) sileo.error({ title: result.error });
      else sileo.success({ title: activo ? "Ficha desactivada" : "Ficha activada" });
    });
  };

  const handleDeletePlatillo = () => {
    startDeleteTransition(async () => {
      const result = await deletePlatillo(nombre);
      if (result.error) sileo.error({ title: result.error });
      else sileo.success({ title: `Platillo "${nombre}" eliminado` });
      setDeleteTarget(null);
    });
  };

  return (
    <>
      {deleteTarget && (
        <ConfirmarEliminarModal
          platilloNombre={deleteTarget}
          onConfirm={handleDeletePlatillo}
          onClose={() => setDeleteTarget(null)}
          isPending={isPendingDelete}
        />
      )}

      <div
        style={{
          background: "hsl(var(--surface))",
          border: "1px solid hsl(var(--border))",
          borderRadius: 10,
          overflow: "hidden",
          boxShadow: "0 2px 8px var(--shadow-color)",
        }}
      >
        {/* Header del acordeón */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "14px 16px",
            cursor: "pointer",
            background: isExpanded ? "hsl(var(--surface-alt))" : "hsl(var(--surface))",
            transition: "background 0.15s",
            userSelect: "none",
          }}
          onClick={onToggleExpand}
        >
          {/* Icono expand */}
          <div style={{ color: "hsl(var(--text-muted))", flexShrink: 0 }}>
            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </div>

          {/* Nombre */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <span
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "hsl(var(--text-main))",
                display: "block",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {nombre}
            </span>
            <span style={{ fontSize: 12, color: "hsl(var(--text-sub))" }}>
              {items.length} {items.length === 1 ? "ingrediente" : "ingredientes"}
            </span>
          </div>

          {/* Badge activo/inactivo */}
          <span
            style={{
              padding: "2px 10px",
              borderRadius: 99,
              fontSize: 11,
              fontWeight: 600,
              background: activo
                ? "hsl(var(--green) / 0.12)"
                : "hsl(var(--text-muted) / 0.12)",
              color: activo ? "hsl(var(--green))" : "hsl(var(--text-muted))",
              border: `1px solid ${activo ? "hsl(var(--green) / 0.25)" : "hsl(var(--text-muted) / 0.25)"}`,
              flexShrink: 0,
            }}
          >
            {activo ? "Activa" : "Inactiva"}
          </span>

          {/* Acciones (stop propagation para no activar el toggle del acordeón) */}
          <div
            style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Toggle activo */}
            <label
              style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}
              title={activo ? "Desactivar ficha" : "Activar ficha"}
            >
              <div
                style={{
                  position: "relative",
                  width: 36,
                  height: 20,
                }}
              >
                <input
                  type="checkbox"
                  checked={activo}
                  disabled={isPendingToggle}
                  onChange={handleToggleActivo}
                  style={{ opacity: 0, width: 0, height: 0, position: "absolute" }}
                />
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: 99,
                    background: activo ? "hsl(var(--green))" : "hsl(var(--border-strong))",
                    transition: "background 0.2s",
                    opacity: isPendingToggle ? 0.5 : 1,
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    top: 3,
                    left: activo ? 19 : 3,
                    width: 14,
                    height: 14,
                    borderRadius: "50%",
                    background: "white",
                    transition: "left 0.2s",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
                  }}
                />
              </div>
            </label>

            {/* Eliminar platillo */}
            <button
              data-icon-btn
              onClick={() => setDeleteTarget(nombre)}
              title="Eliminar platillo"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 30,
                height: 30,
                borderRadius: 6,
                border: "none",
                background: "hsl(var(--terracota) / 0.08)",
                color: "hsl(var(--terracota))",
                cursor: "pointer",
              }}
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* Tabla de ingredientes */}
        {isExpanded && (
          <div style={{ borderTop: "1px solid hsl(var(--border))" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "hsl(var(--surface-alt))" }}>
                  {["Ingrediente", "Cantidad / porción", "Unidad", "Acciones"].map((col) => (
                    <th
                      key={col}
                      style={{
                        padding: "8px 14px",
                        textAlign: "left",
                        fontSize: 11,
                        fontWeight: 600,
                        letterSpacing: "0.4px",
                        textTransform: "uppercase",
                        color: "hsl(var(--text-sub))",
                      }}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((ficha) => (
                  <IngredienteRow
                    key={ficha.id}
                    ficha={ficha}
                    editRow={editRow}
                    setEditRow={setEditRow}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

// ─── Componente principal ────────────────────────────────────────────────────

export function FichasClient({ fichas, productos }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [showModal, setShowModal] = useState(false);
  const [bannerVisible, setBannerVisible] = useState(true);

  const platillos = useMemo(() => {
    const map = new Map<string, FichaTecnica[]>();
    fichas.forEach((f) => {
      if (!map.has(f.platillo_nombre)) map.set(f.platillo_nombre, []);
      map.get(f.platillo_nombre)!.push(f);
    });
    return Array.from(map.entries()).map(([nombre, items]) => ({ nombre, items }));
  }, [fichas]);

  const toggleExpand = (nombre: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(nombre) ? next.delete(nombre) : next.add(nombre);
      return next;
    });
  };

  return (
    <div className="tablet-page-content" style={{ padding: "28px 32px", maxWidth: 900, margin: "0 auto" }}>
      {/* Título de página */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 20,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <ChefHat size={22} style={{ color: "hsl(var(--terracota))" }} />
          <div>
            <h1
              style={{
                fontSize: 22,
                fontWeight: 800,
                color: "hsl(var(--text-main))",
                margin: 0,
                lineHeight: 1.2,
                letterSpacing: "-0.02em",
              }}
            >
              Fichas Técnicas
            </h1>
            <p style={{ fontSize: 13, color: "hsl(var(--text-sub))", margin: "2px 0 0" }}>
              {platillos.length === 0
                ? "No hay platillos registrados aún"
                : `${platillos.length} ${platillos.length === 1 ? "platillo" : "platillos"} · ${fichas.length} ${fichas.length === 1 ? "ingrediente" : "ingredientes"}`}
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowModal(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
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
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = "hsl(var(--terracota-dark))";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "hsl(var(--terracota))";
          }}
        >
          <Plus size={16} />
          Nuevo platillo
        </button>
      </div>

      {/* Banner informativo (dismissible por sesión) */}
      {bannerVisible && (
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 12,
            padding: "14px 16px",
            background: "#E6F1FB",
            border: "1px solid #B8D4EF",
            borderLeft: "4px solid #185FA5",
            borderRadius: 10,
            marginBottom: 24,
          }}
        >
          <Info size={16} style={{ color: "#185FA5", flexShrink: 0, marginTop: 1 }} />
          <p
            style={{
              flex: 1,
              fontSize: 13,
              color: "#1A3A5C",
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            <strong>Modo configuración:</strong> Las fichas técnicas se activarán automáticamente cuando se conecte Clover POS. Por ahora puedes cargar las recetas sin que afecten el inventario.
          </p>
          <button
            data-icon-btn
            onClick={() => setBannerVisible(false)}
            aria-label="Cerrar aviso"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              background: "none",
              border: "none",
              color: "#185FA5",
              cursor: "pointer",
              padding: 2,
              borderRadius: 4,
              opacity: 0.7,
            }}
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* Lista de platillos */}
      {platillos.length === 0 ? (
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
          <ChefHat size={40} style={{ color: "hsl(var(--text-muted))" }} />
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: "hsl(var(--text-sub))", margin: "0 0 4px" }}>
              Sin fichas técnicas
            </p>
            <p style={{ fontSize: 13, color: "hsl(var(--text-muted))", margin: 0 }}>
              Crea el primer platillo con el botón "Nuevo platillo"
            </p>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {platillos.map(({ nombre, items }) => (
            <PlatilloCard
              key={nombre}
              nombre={nombre}
              items={items}
              isExpanded={expanded.has(nombre)}
              onToggleExpand={() => toggleExpand(nombre)}
            />
          ))}
        </div>
      )}

      {/* Modal nuevo platillo */}
      {showModal && (
        <NuevoPlatilloModal
          productos={productos}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
