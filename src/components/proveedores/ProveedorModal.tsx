"use client";

import { useTransition, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { X, Check, Loader2 } from "lucide-react";
import { proveedorFormSchema, type ProveedorFormValues } from "@/lib/schemas/proveedor.schema";
import type { ProveedorInput } from "@/lib/schemas/proveedor.schema";
import { createProveedor, updateProveedor } from "@/lib/actions/proveedores.actions";
import type { Proveedor, Producto } from "@/types";

interface ProveedorModalProps {
  open: boolean;
  editTarget: Proveedor | null;
  productos: Producto[];
  onClose: () => void;
  onSuccess: (p: Proveedor) => void;
}

export function ProveedorModal({
  open,
  editTarget,
  productos,
  onClose,
  onSuccess,
}: ProveedorModalProps) {
  const [isPending, startTransition] = useTransition();
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [productFilter, setProductFilter] = useState<"all" | "selected" | "unassigned">("all");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProveedorFormValues>({
    resolver: zodResolver(proveedorFormSchema),
    defaultValues: {
      company: "",
      contact: "",
      email: "",
      phone: "",
      address: "",
      producto_ids: [],
    },
  });

  useEffect(() => {
    if (!open) return;
    setProductFilter("all");
    if (editTarget) {
      setSelectedProductIds(editTarget.producto_ids ?? []);
      reset({
        company: editTarget.company,
        contact: editTarget.contact ?? "",
        email: editTarget.email ?? "",
        phone: editTarget.phone ?? "",
        address: editTarget.address ?? "",
        producto_ids: editTarget.producto_ids ?? [],
      });
    } else {
      setSelectedProductIds([]);
      reset({
        company: "",
        contact: "",
        email: "",
        phone: "",
        address: "",
        producto_ids: [],
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editTarget]);

  function toggleProduct(id: string) {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function onSubmit(data: ProveedorFormValues) {
    const payload: ProveedorInput = { ...data, producto_ids: selectedProductIds };
    startTransition(async () => {
      if (editTarget) {
        const res = await updateProveedor(editTarget.id, payload);
        if (res.error) { toast.error(res.error); return; }
        toast.success("Proveedor actualizado");
        onSuccess(res.data!);
      } else {
        const res = await createProveedor(payload);
        if (res.error) { toast.error(res.error); return; }
        toast.success("Proveedor creado");
        onSuccess(res.data!);
      }
      onClose();
    });
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
          maxWidth: 620,
          borderRadius: 12,
          boxShadow: "0 32px 80px rgba(0,0,0,0.28)",
          backgroundColor: "hsl(var(--surface))",
          animation: "modalIn 0.18s ease-out",
          maxHeight: "90vh",
          overflowY: "auto",
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
            {editTarget ? `Editar: ${editTarget.company}` : "Nuevo Proveedor"}
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

            {/* Nombre empresa — full width */}
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Nombre de Empresa *</label>
              <input
                {...register("company")}
                placeholder="Ej. Distribuidora Cárnicos del Norte"
                autoFocus
                style={inputStyle(!!errors.company)}
              />
              {errors.company && <p style={errorStyle}>{errors.company.message}</p>}
            </div>

            {/* Contacto + Email */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div>
                <label style={labelStyle}>Contacto</label>
                <input
                  {...register("contact")}
                  placeholder="Nombre del contacto"
                  style={inputStyle(false)}
                />
              </div>
              <div>
                <label style={labelStyle}>Email</label>
                <input
                  {...register("email")}
                  type="email"
                  placeholder="correo@empresa.mx"
                  style={inputStyle(!!errors.email)}
                />
                {errors.email && <p style={errorStyle}>{errors.email.message}</p>}
              </div>
            </div>

            {/* Teléfono */}
            <div>
              <label style={labelStyle}>Teléfono</label>
              <input
                {...register("phone")}
                placeholder="+52 55 0000 0000"
                style={inputStyle(false)}
              />
            </div>

            {/* Dirección — full width */}
            <div>
              <label style={labelStyle}>Dirección</label>
              <textarea
                {...register("address")}
                placeholder="Calle, colonia, ciudad, CP"
                rows={2}
                style={{
                  ...inputStyle(false),
                  resize: "vertical",
                  minHeight: 60,
                  fontFamily: "inherit",
                  lineHeight: 1.5,
                }}
              />
            </div>

            {/* Productos que surte */}
            <div>
              {/* Header con label y tabs */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <label style={{
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  color: "hsl(var(--text-sub))",
                }}>
                  Productos que surte
                </label>
                <div style={{ display: "flex", gap: 4 }}>
                  {(["all", "selected", "unassigned"] as const).map((mode) => {
                    const labels = {
                      all: `Todos (${productos.length})`,
                      selected: `Seleccionados (${selectedProductIds.length})`,
                      unassigned: `Sin asignar (${productos.length - selectedProductIds.length})`,
                    };
                    const active = productFilter === mode;
                    return (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setProductFilter(mode)}
                        style={{
                          padding: "3px 9px",
                          borderRadius: 99,
                          fontSize: 11,
                          fontWeight: active ? 700 : 500,
                          cursor: "pointer",
                          border: active
                            ? "1.5px solid hsl(var(--terracota))"
                            : "1.5px solid hsl(var(--border))",
                          backgroundColor: active
                            ? "hsl(var(--terracota) / 0.1)"
                            : "transparent",
                          color: active
                            ? "hsl(var(--terracota))"
                            : "hsl(var(--text-muted))",
                          fontFamily: "inherit",
                          transition: "all 0.12s ease",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {labels[mode]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Lista de pills filtrada */}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 6,
                  maxHeight: 140,
                  overflowY: "auto",
                  padding: "8px 0",
                  minHeight: 40,
                }}
              >
                {productos.length === 0 ? (
                  <span style={{ fontSize: 12, color: "hsl(var(--text-muted))" }}>
                    No hay productos disponibles
                  </span>
                ) : (() => {
                  const visible = productos.filter((p) => {
                    if (productFilter === "selected") return selectedProductIds.includes(p.id);
                    if (productFilter === "unassigned") return !selectedProductIds.includes(p.id);
                    return true;
                  });
                  if (visible.length === 0) {
                    return (
                      <span style={{ fontSize: 12, color: "hsl(var(--text-muted))", padding: "4px 0" }}>
                        {productFilter === "selected" ? "Ningún producto seleccionado aún" : "Todos los productos ya están asignados"}
                      </span>
                    );
                  }
                  return visible.map((p) => {
                    const selected = selectedProductIds.includes(p.id);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => toggleProduct(p.id)}
                        style={{
                          padding: "5px 12px",
                          borderRadius: 20,
                          fontSize: 12,
                          fontWeight: selected ? 600 : 400,
                          cursor: "pointer",
                          border: selected
                            ? "1.5px solid hsl(var(--green))"
                            : "1.5px solid hsl(var(--border))",
                          backgroundColor: selected
                            ? "hsl(var(--green) / 0.15)"
                            : "transparent",
                          color: selected
                            ? "hsl(var(--green))"
                            : "hsl(var(--text-sub))",
                          fontFamily: "inherit",
                          transition: "all 0.12s ease",
                        }}
                      >
                        {p.nombre}
                      </button>
                    );
                  });
                })()}
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
              {isPending ? "Guardando..." : editTarget ? "Actualizar" : "Crear Proveedor"}
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
