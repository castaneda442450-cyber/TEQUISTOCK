"use client";

import { useTransition, useEffect } from "react";
import { useIsTablet } from "@/hooks/useIsTablet";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { sileo } from "sileo";
import { X, Check, Loader2, Sun, CalendarDays, CalendarCheck } from "lucide-react";
import { productoSchema, type ProductoInput } from "@/lib/schemas/producto.schema";
import {
  createProducto,
  updateProducto,
} from "@/lib/actions/productos.actions";
import { UNIDADES } from "@/lib/constants";
import type { Producto, Categoria } from "@/types";

const FREQ_MODAL_CONFIG = {
  diario:  { color: "#791F1F", bg: "#FCEBEB" },
  semanal: { color: "#633806", bg: "#FAEEDA" },
  mensual: { color: "#27500A", bg: "#EAF3DE" },
} as const;

const OPCIONES_FRECUENCIA = [
  {
    key: "diario" as const,
    Icon: Sun,
    titulo: "Diario",
    desc: "Aparece en el cierre de turno cada noche. Usar para carnes, mariscos, lácteos, cervezas y licores.",
  },
  {
    key: "semanal" as const,
    Icon: CalendarDays,
    titulo: "Semanal",
    desc: "Se cuenta los lunes por la mañana. Usar para secos, congelados y bebidas embotelladas.",
  },
  {
    key: "mensual" as const,
    Icon: CalendarCheck,
    titulo: "Mensual",
    desc: "Conteo a fondo el primer lunes del mes. Usar para desechables y limpieza.",
  },
];

interface ProductoModalProps {
  open: boolean;
  editTarget: Producto | null;
  categorias: Categoria[];
  onClose: () => void;
  onSuccess: (p: Producto) => void;
}

export function ProductoModal({
  open,
  editTarget,
  categorias,
  onClose,
  onSuccess,
}: ProductoModalProps) {
  const [isPending, startTransition] = useTransition();
  const isTablet = useIsTablet();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProductoInput>({
    resolver: zodResolver(productoSchema),
    defaultValues: {
      nombre: "",
      categoria_id: categorias[0]?.id ?? "",
      unidad: "kg",
      stock_minimo: 5,
      last_price: 0,
      frecuencia_conteo: "semanal",
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
        frecuencia_conteo: editTarget.frecuencia_conteo ?? "semanal",
      });
    } else {
      reset({
        nombre: "",
        categoria_id: categorias[0]?.id ?? "",
        unidad: "kg",
        stock_minimo: 5,
        last_price: 0,
        frecuencia_conteo: "semanal",
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editTarget]);

  function onSubmit(data: ProductoInput) {
    startTransition(async () => {
      if (editTarget) {
        const res = await updateProducto(editTarget.id, data);
        if (res.error) { sileo.error({ title: res.error, description: "Por favor intenta nuevamente." }); return; }
        sileo.success({ title: "Producto actualizado", description: "Los cambios se guardaron correctamente." });
        onSuccess(res.data!);
      } else {
        const res = await createProducto(data);
        if (res.error) { sileo.error({ title: res.error, description: "Por favor intenta nuevamente." }); return; }
        sileo.success({ title: "Producto creado", description: "El producto se agregó al inventario." });
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
          maxWidth: isTablet ? "calc(100% - 24px)" : 540,
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
            data-icon-btn
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
            <div style={{ display: "grid", gridTemplateColumns: isTablet ? "1fr" : "1fr 1fr", gap: 14 }}>
              <div>
                <label style={labelStyle}>Categoría *</label>
                <select
                  {...register("categoria_id")}
                  style={inputStyle(!!errors.categoria_id)}
                >
                  {categorias.map((c) => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
                {errors.categoria_id && <p style={errorStyle}>{errors.categoria_id.message}</p>}
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
            <div style={{ display: "grid", gridTemplateColumns: isTablet ? "1fr" : "1fr 1fr", gap: 14 }}>
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

            {/* Frecuencia de conteo */}
            <div>
              <label style={labelStyle}>Frecuencia de Conteo</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 6 }}>
                {OPCIONES_FRECUENCIA.map(({ key, Icon, titulo, desc }) => {
                  const cfg = FREQ_MODAL_CONFIG[key];
                  const selected = watch("frecuencia_conteo") === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setValue("frecuencia_conteo", key, { shouldValidate: true })}
                      style={{
                        padding: "10px 8px", borderRadius: 8, textAlign: "left",
                        display: "flex", flexDirection: "column", gap: 4,
                        border: selected ? `2px solid ${cfg.color}` : "2px solid hsl(var(--border))",
                        backgroundColor: selected ? cfg.bg : "transparent",
                        cursor: "pointer",
                      }}
                    >
                      <Icon size={16} style={{ color: cfg.color }} />
                      <span style={{ fontSize: 12, fontWeight: 700, color: "hsl(var(--text-main))" }}>{titulo}</span>
                      <span style={{ fontSize: 10, color: "hsl(var(--text-sub))", lineHeight: 1.3 }}>{desc}</span>
                    </button>
                  );
                })}
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
