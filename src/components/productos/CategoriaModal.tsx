"use client";

import { useState } from "react";
import { sileo } from "sileo";
import { X, Check, Loader2, Tag, Trash2, AlertTriangle, Plus, ChevronDown } from "lucide-react";
import { createCategoria, deleteCategoria } from "@/lib/actions/productos.actions";
import type { Categoria } from "@/types";

interface CategoriaModalProps {
  open: boolean;
  categorias: Categoria[];
  onClose: () => void;
  onCreated: (c: Categoria) => void;
  onDeleted: (id: string, refresh?: boolean) => void;
}

type ReasignarMode = "existente" | "nueva";

interface ConfirmState {
  cat: Categoria;
  count: number;
  mode: ReasignarMode;
  targetId: string;
  nuevaNombre: string;
  nuevaColor: string;
  saving: boolean;
}

export function CategoriaModal({ open, categorias, onClose, onCreated, onDeleted }: CategoriaModalProps) {
  const [nombre, setNombre] = useState("");
  const [color, setColor] = useState("#106653");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);

  async function handleSave() {
    setError("");
    if (!nombre.trim()) { setError("El nombre es requerido"); return; }
    setSaving(true);
    const res = await createCategoria({ nombre: nombre.trim(), color });
    setSaving(false);
    if (res.error) { setError(res.error); return; }
    const created = res.data! as Categoria & { created_at?: string };
    const newCat: Categoria = {
      id: created.id,
      nombre: created.nombre,
      color: created.color,
      created_at: created.created_at ?? new Date().toISOString(),
    };
    sileo.success({ title: `Categoría "${newCat.nombre}" creada` });
    setNombre("");
    setColor("#106653");
    onCreated(newCat);
  }

  async function handleDelete(cat: Categoria) {
    setDeletingId(cat.id);
    const res = await deleteCategoria(cat.id, undefined);
    setDeletingId(null);
    if (res.error) { sileo.error({ title: res.error }); return; }
    if (res.affectedCount && res.affectedCount > 0) {
      const otras = categorias.filter((c) => c.id !== cat.id);
      setConfirm({
        cat,
        count: res.affectedCount,
        mode: otras.length > 0 ? "existente" : "nueva",
        targetId: otras[0]?.id ?? "",
        nuevaNombre: "",
        nuevaColor: "#78909C",
        saving: false,
      });
      return;
    }
    sileo.success({ title: `Categoría "${cat.nombre}" eliminada` });
    onDeleted(cat.id);
  }

  async function handleConfirmDelete() {
    if (!confirm) return;
    setConfirm((prev) => prev ? { ...prev, saving: true } : null);

    let targetId = confirm.targetId;

    if (confirm.mode === "nueva") {
      if (!confirm.nuevaNombre.trim()) {
        setConfirm((prev) => prev ? { ...prev, saving: false } : null);
        sileo.error({ title: "El nombre de la nueva categoría es requerido" });
        return;
      }
      const res = await createCategoria({ nombre: confirm.nuevaNombre.trim(), color: confirm.nuevaColor });
      if (res.error) {
        setConfirm((prev) => prev ? { ...prev, saving: false } : null);
        sileo.error({ title: res.error });
        return;
      }
      const newCat: Categoria = {
        id: res.data!.id,
        nombre: res.data!.nombre,
        color: res.data!.color,
        created_at: new Date().toISOString(),
      };
      targetId = newCat.id;
      onCreated(newCat);
    }

    const catToDelete = confirm.cat;
    setConfirm(null);

    const res = await deleteCategoria(catToDelete.id, targetId);
    if (res.error) { sileo.error({ title: res.error }); return; }

    const destNombre = confirm.mode === "nueva"
      ? confirm.nuevaNombre.trim()
      : categorias.find((c) => c.id === targetId)?.nombre ?? "otra categoría";

    sileo.success({ title: `"${catToDelete.nombre}" eliminada. Productos movidos a "${destNombre}".` });
    onDeleted(catToDelete.id, true);
  }

  function handleClose() {
    setNombre("");
    setColor("#106653");
    setError("");
    setConfirm(null);
    onClose();
  }

  if (!open) return null;

  const otrasCateg = confirm ? categorias.filter((c) => c.id !== confirm.cat.id) : [];

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 50,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 16, backgroundColor: "rgba(0,0,0,0.45)",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div
        style={{
          width: "100%", maxWidth: 480,
          borderRadius: 12,
          boxShadow: "0 32px 80px rgba(0,0,0,0.28)",
          backgroundColor: "hsl(var(--surface))",
          animation: "modalIn 0.18s ease-out",
          maxHeight: "90vh", display: "flex", flexDirection: "column",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px 0", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              backgroundColor: "hsl(var(--green) / 0.12)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Tag size={15} style={{ color: "hsl(var(--green))" }} />
            </div>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: "hsl(var(--text-main))", margin: 0 }}>
              Gestionar Categorías
            </h2>
          </div>
          <button
            onClick={handleClose}
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

        {/* Scrollable body */}
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 20, overflowY: "auto" }}>

          {/* Nueva categoría */}
          <div>
            <p style={sectionLabelStyle}>Nueva categoría</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={labelStyle}>Nombre *</label>
                <input
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value.toUpperCase())}
                  placeholder="Ej. CARNES, BEBIDAS..."
                  autoFocus
                  onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
                  style={inputStyle(!!error)}
                />
                {error && <p style={errorStyle}>{error}</p>}
              </div>
              <div>
                <label style={labelStyle}>Color</label>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    style={{
                      width: 44, height: 36, borderRadius: 8,
                      border: "1px solid hsl(var(--border))",
                      padding: 3, cursor: "pointer",
                      backgroundColor: "hsl(var(--surface))",
                    }}
                  />
                  <div style={{
                    width: 28, height: 28, borderRadius: 99,
                    backgroundColor: `${color}22`, border: `2px solid ${color}`,
                  }} />
                  <span style={{ fontSize: 13, color: "hsl(var(--text-sub))", fontFamily: "monospace" }}>
                    {color}
                  </span>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    style={{
                      marginLeft: "auto",
                      display: "flex", alignItems: "center", gap: 6,
                      padding: "8px 16px", fontSize: 13, fontWeight: 600,
                      borderRadius: 8, border: "none",
                      backgroundColor: "hsl(var(--green))", color: "white",
                      cursor: saving ? "wait" : "pointer",
                      opacity: saving ? 0.6 : 1, fontFamily: "inherit",
                    }}
                  >
                    {saving
                      ? <Loader2 size={13} style={{ animation: "spin 0.7s linear infinite" }} />
                      : <Check size={13} />
                    }
                    Guardar
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Lista de categorías existentes */}
          <div>
            <p style={sectionLabelStyle}>Categorías existentes ({categorias.length})</p>
            {categorias.length === 0 ? (
              <p style={{ fontSize: 13, color: "hsl(var(--text-muted))", margin: 0 }}>
                No hay categorías registradas.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {categorias.map((cat) => (
                  <div
                    key={cat.id}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "8px 12px", borderRadius: 8,
                      border: `1px solid ${confirm?.cat.id === cat.id ? "hsl(var(--terracota) / 0.4)" : "hsl(var(--border))"}`,
                      backgroundColor: confirm?.cat.id === cat.id
                        ? "hsl(var(--terracota) / 0.06)"
                        : "hsl(var(--surface-alt))",
                      transition: "all 0.15s",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{
                        width: 22, height: 22, borderRadius: 99,
                        backgroundColor: `${cat.color}22`,
                        border: `2px solid ${cat.color}`,
                        flexShrink: 0,
                      }} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: "hsl(var(--text-main))" }}>
                        {cat.nombre}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDelete(cat)}
                      disabled={deletingId === cat.id || confirm?.cat.id === cat.id}
                      title="Eliminar categoría"
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "center",
                        width: 30, height: 30, borderRadius: 6, border: "none",
                        backgroundColor: "hsl(var(--terracota) / 0.10)",
                        color: "hsl(var(--terracota))",
                        cursor: (deletingId === cat.id || confirm?.cat.id === cat.id) ? "not-allowed" : "pointer",
                        opacity: (deletingId === cat.id || confirm?.cat.id === cat.id) ? 0.4 : 1,
                        flexShrink: 0,
                      }}
                    >
                      {deletingId === cat.id
                        ? <Loader2 size={13} style={{ animation: "spin 0.7s linear infinite" }} />
                        : <Trash2 size={13} />
                      }
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Panel de reasignación */}
        {confirm && (
          <div style={{
            margin: "0 24px 16px",
            borderRadius: 10,
            border: "1px solid hsl(var(--terracota) / 0.35)",
            backgroundColor: "hsl(var(--terracota) / 0.06)",
            overflow: "hidden",
            flexShrink: 0,
          }}>
            {/* Encabezado del panel */}
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "14px 16px 12px" }}>
              <AlertTriangle size={15} style={{ color: "hsl(var(--terracota))", flexShrink: 0, marginTop: 1 }} />
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: "hsl(var(--text-main))", margin: "0 0 2px 0" }}>
                  {confirm.count} producto{confirm.count !== 1 ? "s" : ""} usan &quot;{confirm.cat.nombre}&quot;
                </p>
                <p style={{ fontSize: 12, color: "hsl(var(--text-sub))", margin: 0 }}>
                  ¿A qué categoría quieres moverlos?
                </p>
              </div>
            </div>

            {/* Tabs: Existente / Nueva */}
            <div style={{ display: "flex", borderTop: "1px solid hsl(var(--border))", borderBottom: "1px solid hsl(var(--border))" }}>
              {otrasCateg.length > 0 && (
                <button
                  type="button"
                  onClick={() => setConfirm((p) => p ? { ...p, mode: "existente" } : null)}
                  style={{
                    flex: 1, padding: "8px 0", fontSize: 12, fontWeight: 600, border: "none",
                    borderBottom: confirm.mode === "existente" ? "2px solid hsl(var(--terracota))" : "2px solid transparent",
                    backgroundColor: "transparent",
                    color: confirm.mode === "existente" ? "hsl(var(--terracota))" : "hsl(var(--text-sub))",
                    cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
                  }}
                >
                  Categoría existente
                </button>
              )}
              <button
                type="button"
                onClick={() => setConfirm((p) => p ? { ...p, mode: "nueva" } : null)}
                style={{
                  flex: 1, padding: "8px 0", fontSize: 12, fontWeight: 600, border: "none",
                  borderBottom: confirm.mode === "nueva" ? "2px solid hsl(var(--terracota))" : "2px solid transparent",
                  backgroundColor: "transparent",
                  color: confirm.mode === "nueva" ? "hsl(var(--terracota))" : "hsl(var(--text-sub))",
                  cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
                }}
              >
                <Plus size={11} style={{ marginRight: 4, verticalAlign: "middle" }} />
                Crear nueva
              </button>
            </div>

            {/* Contenido del tab */}
            <div style={{ padding: "12px 16px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
              {confirm.mode === "existente" && otrasCateg.length > 0 && (
                <div style={{ position: "relative" }}>
                  <select
                    value={confirm.targetId}
                    onChange={(e) => setConfirm((p) => p ? { ...p, targetId: e.target.value } : null)}
                    style={{
                      width: "100%", padding: "8px 32px 8px 10px", fontSize: 13,
                      borderRadius: 8, border: "1px solid hsl(var(--border))",
                      backgroundColor: "hsl(var(--bg))", color: "hsl(var(--text-main))",
                      outline: "none", appearance: "none", cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    {otrasCateg.map((c) => (
                      <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                  </select>
                  <ChevronDown size={13} style={{
                    position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                    color: "hsl(var(--text-muted))", pointerEvents: "none",
                  }} />
                </div>
              )}

              {confirm.mode === "nueva" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <input
                    value={confirm.nuevaNombre}
                    onChange={(e) => setConfirm((p) => p ? { ...p, nuevaNombre: e.target.value.toUpperCase() } : null)}
                    placeholder="Nombre de la nueva categoría..."
                    autoFocus
                    style={inputStyle(false)}
                  />
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <input
                      type="color"
                      value={confirm.nuevaColor}
                      onChange={(e) => setConfirm((p) => p ? { ...p, nuevaColor: e.target.value } : null)}
                      style={{
                        width: 36, height: 30, borderRadius: 6,
                        border: "1px solid hsl(var(--border))",
                        padding: 2, cursor: "pointer",
                        backgroundColor: "hsl(var(--surface))",
                      }}
                    />
                    <div style={{
                      width: 22, height: 22, borderRadius: 99,
                      backgroundColor: `${confirm.nuevaColor}22`,
                      border: `2px solid ${confirm.nuevaColor}`,
                    }} />
                    <span style={{ fontSize: 12, color: "hsl(var(--text-sub))", fontFamily: "monospace" }}>
                      {confirm.nuevaColor}
                    </span>
                  </div>
                </div>
              )}

              {/* Botones */}
              <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
                <button
                  type="button"
                  onClick={() => setConfirm(null)}
                  disabled={confirm.saving}
                  style={{
                    flex: 1, padding: "7px 12px", fontSize: 12, fontWeight: 600,
                    borderRadius: 7, border: "1px solid hsl(var(--border))",
                    backgroundColor: "transparent", color: "hsl(var(--text-sub))",
                    cursor: confirm.saving ? "not-allowed" : "pointer", fontFamily: "inherit",
                    opacity: confirm.saving ? 0.5 : 1,
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={confirm.saving}
                  style={{
                    flex: 2, padding: "7px 12px", fontSize: 12, fontWeight: 600,
                    borderRadius: 7, border: "none",
                    backgroundColor: "hsl(var(--terracota))", color: "white",
                    cursor: confirm.saving ? "wait" : "pointer", fontFamily: "inherit",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    opacity: confirm.saving ? 0.7 : 1,
                  }}
                >
                  {confirm.saving
                    ? <Loader2 size={12} style={{ animation: "spin 0.7s linear infinite" }} />
                    : null
                  }
                  Confirmar y eliminar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{
          padding: "14px 24px 20px",
          borderTop: "1px solid hsl(var(--border))",
          flexShrink: 0,
        }}>
          <button
            type="button"
            onClick={handleClose}
            style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              padding: "9px 16px", fontSize: 13, fontWeight: 600,
              borderRadius: 8, border: "1px solid hsl(var(--border))",
              backgroundColor: "transparent", color: "hsl(var(--text-sub))",
              cursor: "pointer", fontFamily: "inherit",
            }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

const sectionLabelStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, textTransform: "uppercase",
  letterSpacing: "0.06em", color: "hsl(var(--text-muted))",
  margin: "0 0 10px 0",
};

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 11, fontWeight: 600,
  textTransform: "uppercase", letterSpacing: "0.04em",
  color: "hsl(var(--text-sub))", marginBottom: 6,
};

function inputStyle(hasError: boolean): React.CSSProperties {
  return {
    width: "100%", padding: "9px 12px", fontSize: 13,
    borderRadius: 8,
    border: `1px solid ${hasError ? "hsl(var(--terracota))" : "hsl(var(--border))"}`,
    backgroundColor: "hsl(var(--bg))", color: "hsl(var(--text-main))",
    outline: "none", fontFamily: "inherit", boxSizing: "border-box",
  };
}

const errorStyle: React.CSSProperties = {
  fontSize: 11, marginTop: 4, color: "hsl(var(--terracota))",
};
