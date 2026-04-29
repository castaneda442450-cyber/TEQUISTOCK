"use client";

import { useState, useTransition, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { X, Check, Plus, Loader2 } from "lucide-react";
import { productoSchema, type ProductoInput } from "@/lib/schemas/producto.schema";
import {
  createProducto,
  updateProducto,
  createCategoria,
} from "@/lib/actions/productos.actions";
import { UNIDADES } from "@/lib/constants";
import type { Producto, Categoria } from "@/types";

interface ProductoModalProps {
  open: boolean;
  editTarget: Producto | null;
  categorias: Categoria[];
  onClose: () => void;
  onSuccess: (p: Producto) => void;
  onCategoriaCreated: (c: Categoria) => void;
}

export function ProductoModal({
  open,
  editTarget,
  categorias,
  onClose,
  onSuccess,
  onCategoriaCreated,
}: ProductoModalProps) {
  const [isPending, startTransition] = useTransition();
  const [showNewCat, setShowNewCat] = useState(false);
  const [newCatNombre, setNewCatNombre] = useState("");
  const [newCatColor, setNewCatColor] = useState("#106653");
  const [newCatError, setNewCatError] = useState("");
  const [savingCat, setSavingCat] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ProductoInput>({
    resolver: zodResolver(productoSchema),
    defaultValues: {
      nombre: "",
      categoria_id: categorias[0]?.id ?? "",
      unidad: "kg",
      stock_minimo: 5,
      last_price: 0,
    },
  });

  // Reset form whenever modal opens or editTarget changes
  useEffect(() => {
    if (!open) return;
    if (editTarget) {
      reset({
        nombre: editTarget.nombre,
        categoria_id: editTarget.categoria_id,
        unidad: editTarget.unidad,
        stock_minimo: editTarget.stock_minimo,
        last_price: editTarget.last_price,
      });
    } else {
      reset({
        nombre: "",
        categoria_id: categorias[0]?.id ?? "",
        unidad: "kg",
        stock_minimo: 5,
        last_price: 0,
      });
    }
    // Also reset the new category mini-form
    setShowNewCat(false);
    setNewCatNombre("");
    setNewCatColor("#106653");
    setNewCatError("");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editTarget]);

  function onSubmit(data: ProductoInput) {
    startTransition(async () => {
      if (editTarget) {
        const res = await updateProducto(editTarget.id, data);
        if (res.error) { toast.error(res.error); return; }
        toast.success("Producto actualizado");
        onSuccess(res.data!);
      } else {
        const res = await createProducto(data);
        if (res.error) { toast.error(res.error); return; }
        toast.success("Producto creado");
        onSuccess(res.data!);
      }
      onClose();
    });
  }

  async function handleSaveCategoria() {
    setNewCatError("");
    if (!newCatNombre.trim()) { setNewCatError("El nombre es requerido"); return; }
    setSavingCat(true);
    const res = await createCategoria({ nombre: newCatNombre.trim(), color: newCatColor });
    setSavingCat(false);
    if (res.error) { setNewCatError(res.error); return; }
    const created = res.data! as Categoria & { created_at?: string };
    const newCat: Categoria = {
      id: created.id,
      nombre: created.nombre,
      color: created.color,
      created_at: created.created_at ?? new Date().toISOString(),
    };
    onCategoriaCreated(newCat);
    setValue("categoria_id", newCat.id);
    setShowNewCat(false);
    setNewCatNombre("");
    setNewCatColor("#106653");
    toast.success(`Categoría "${newCat.nombre}" creada`);
  }

  if (!open) return null;

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
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 540,
          borderRadius: 12,
          boxShadow: "0 32px 80px rgba(0,0,0,0.28)",
          backgroundColor: "hsl(var(--surface))",
          animation: "modalIn 0.18s ease-out",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 24px 0",
          }}
        >
          <h2 style={{ fontSize: 17, fontWeight: 700, color: "hsl(var(--text-main))", margin: 0 }}>
            {editTarget ? `Editar: ${editTarget.nombre}` : "Nuevo Producto"}
          </h2>
          <button
            onClick={onClose}
            style={{
              padding: 6,
              borderRadius: 6,
              border: "none",
              background: "transparent",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              color: "hsl(var(--text-muted))",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)}>
          <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Nombre — full width */}
            <div>
              <label style={labelStyle}>Nombre del Producto *</label>
              <input
                {...register("nombre")}
                placeholder="Ej. Arrachera de Res"
                autoFocus
                style={inputStyle(!!errors.nombre)}
              />
              {errors.nombre && <p style={errorStyle}>{errors.nombre.message}</p>}
            </div>

            {/* Categoría + Unidad */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div>
                <label style={labelStyle}>Categoría *</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <select
                    {...register("categoria_id")}
                    style={{ ...inputStyle(!!errors.categoria_id), flex: 1 }}
                  >
                    {categorias.map((c) => (
                      <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    title="Nueva categoría"
                    onClick={() => setShowNewCat((v) => !v)}
                    style={{
                      flexShrink: 0,
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      border: `1px solid hsl(var(--border))`,
                      backgroundColor: showNewCat
                        ? "hsl(var(--terracota) / 0.10)"
                        : "hsl(var(--surface-alt))",
                      color: showNewCat
                        ? "hsl(var(--terracota))"
                        : "hsl(var(--text-sub))",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <Plus size={14} />
                  </button>
                </div>
                {errors.categoria_id && <p style={errorStyle}>{errors.categoria_id.message}</p>}

                {/* Inline nueva categoría */}
                {showNewCat && (
                  <div
                    style={{
                      marginTop: 10,
                      padding: 12,
                      borderRadius: 8,
                      border: "1px solid hsl(var(--border))",
                      backgroundColor: "hsl(var(--surface-alt))",
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                    }}
                  >
                    <p style={{ fontSize: 11, fontWeight: 600, color: "hsl(var(--text-sub))", margin: 0, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                      Nueva categoría
                    </p>
                    <input
                      value={newCatNombre}
                      onChange={(e) => setNewCatNombre(e.target.value)}
                      placeholder="Nombre"
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleSaveCategoria(); } }}
                      style={inputStyle(!!newCatError)}
                    />
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <label style={{ fontSize: 12, color: "hsl(var(--text-sub))", flexShrink: 0 }}>Color:</label>
                      <input
                        type="color"
                        value={newCatColor}
                        onChange={(e) => setNewCatColor(e.target.value)}
                        style={{
                          width: 36,
                          height: 28,
                          borderRadius: 6,
                          border: "1px solid hsl(var(--border))",
                          padding: 2,
                          cursor: "pointer",
                          backgroundColor: "hsl(var(--surface))",
                        }}
                      />
                      <span style={{ fontSize: 12, color: "hsl(var(--text-muted))", fontFamily: "monospace" }}>
                        {newCatColor}
                      </span>
                      <button
                        type="button"
                        onClick={handleSaveCategoria}
                        disabled={savingCat}
                        style={{
                          marginLeft: "auto",
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          padding: "4px 10px",
                          fontSize: 12,
                          fontWeight: 600,
                          borderRadius: 6,
                          border: "none",
                          backgroundColor: "hsl(var(--green))",
                          color: "white",
                          cursor: savingCat ? "wait" : "pointer",
                          opacity: savingCat ? 0.6 : 1,
                          fontFamily: "inherit",
                        }}
                      >
                        {savingCat ? <Loader2 size={12} style={{ animation: "spin 0.7s linear infinite" }} /> : <Check size={12} />}
                        Guardar
                      </button>
                    </div>
                    {newCatError && <p style={errorStyle}>{newCatError}</p>}
                  </div>
                )}
              </div>

              <div>
                <label style={labelStyle}>Unidad de Medida</label>
                <select {...register("unidad")} style={inputStyle(false)}>
                  {UNIDADES.map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Stock mínimo + Precio */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div>
                <label style={labelStyle}>Stock Mínimo *</label>
                <input
                  {...register("stock_minimo", { valueAsNumber: true })}
                  type="number"
                  min={0}
                  placeholder="0"
                  style={inputStyle(!!errors.stock_minimo)}
                />
                {errors.stock_minimo && <p style={errorStyle}>{errors.stock_minimo.message}</p>}
              </div>

              <div>
                <label style={labelStyle}>Precio Unitario *</label>
                <div style={{ position: "relative" }}>
                  <span
                    style={{
                      position: "absolute",
                      left: 11,
                      top: "50%",
                      transform: "translateY(-50%)",
                      fontSize: 13,
                      color: "hsl(var(--text-muted))",
                      pointerEvents: "none",
                    }}
                  >
                    $
                  </span>
                  <input
                    {...register("last_price", { valueAsNumber: true })}
                    type="number"
                    step="0.01"
                    min={0}
                    placeholder="0.00"
                    style={{ ...inputStyle(!!errors.last_price), paddingLeft: 22 }}
                  />
                </div>
                {errors.last_price && <p style={errorStyle}>{errors.last_price.message}</p>}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              display: "flex",
              gap: 10,
              padding: "16px 24px 20px",
              borderTop: "1px solid hsl(var(--border))",
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                padding: "9px 16px",
                fontSize: 13,
                fontWeight: 600,
                borderRadius: 8,
                border: "1px solid hsl(var(--border))",
                backgroundColor: "transparent",
                color: "hsl(var(--text-sub))",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              <X size={14} />
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                padding: "9px 16px",
                fontSize: 13,
                fontWeight: 600,
                borderRadius: 8,
                border: "none",
                backgroundColor: "hsl(var(--green))",
                color: "white",
                cursor: isPending ? "wait" : "pointer",
                opacity: isPending ? 0.6 : 1,
                fontFamily: "inherit",
              }}
            >
              {isPending
                ? <Loader2 size={14} style={{ animation: "spin 0.7s linear infinite" }} />
                : <Check size={14} />
              }
              {isPending ? "Guardando..." : editTarget ? "Actualizar" : "Crear Producto"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 11,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  color: "hsl(var(--text-sub))",
  marginBottom: 6,
};

function inputStyle(hasError: boolean): React.CSSProperties {
  return {
    width: "100%",
    padding: "9px 12px",
    fontSize: 13,
    borderRadius: 8,
    border: `1px solid ${hasError ? "hsl(var(--terracota))" : "hsl(var(--border))"}`,
    backgroundColor: "hsl(var(--bg))",
    color: "hsl(var(--text-main))",
    outline: "none",
    fontFamily: "inherit",
    boxSizing: "border-box",
  };
}

const errorStyle: React.CSSProperties = {
  fontSize: 11,
  marginTop: 4,
  color: "hsl(var(--terracota))",
};
