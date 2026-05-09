"use client";

import { useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { X, Check, Loader2 } from "lucide-react";
import { consumoSchema, type ConsumoInput } from "@/lib/schemas/salida.schema";
import { createConsumo } from "@/lib/actions/salidas.actions";
import { formatCurrency } from "@/lib/format";
import type { Movimiento, Producto } from "@/types";

interface ConsumoModalProps {
  open: boolean;
  productos: Producto[];
  onClose: () => void;
  onSuccess: (m: Movimiento) => void;
}

export function ConsumoModal({ open, productos, onClose, onSuccess }: ConsumoModalProps) {
  const [isPending, startTransition] = useTransition();

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<ConsumoInput>({
    resolver: zodResolver(consumoSchema),
    defaultValues: {
      product_id: productos[0]?.id ?? "",
      qty: undefined,
      fecha: new Date().toISOString().split("T")[0],
      notes: "",
    },
  });

  const productId = watch("product_id");
  const qty = watch("qty");
  const selectedProd = productos.find((p) => p.id === productId);
  const qtyNum = Number(qty) || 0;
  const valorEstimado = qtyNum * (selectedProd?.last_price ?? 0);
  const stockInsuficiente = qtyNum > 0 && selectedProd && qtyNum > selectedProd.stock_actual;
  const stockBajo = qtyNum > 0 && selectedProd && !stockInsuficiente && qtyNum > selectedProd.stock_actual * 0.8;

  useEffect(() => {
    if (!open) return;
    reset({
      product_id: productos[0]?.id ?? "",
      qty: undefined,
      fecha: new Date().toISOString().split("T")[0],
      notes: "",
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function onSubmit(data: ConsumoInput) {
    if (stockInsuficiente) {
      toast.error(`Stock insuficiente. Disponible: ${selectedProd?.stock_actual} ${selectedProd?.unidad}`);
      return;
    }
    startTransition(async () => {
      const res = await createConsumo(data);
      if (res.error) { toast.error(res.error); return; }
      toast.success("Consumo registrado");
      onSuccess(res.data!);
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
          maxWidth: 520,
          borderRadius: 12,
          boxShadow: "0 32px 80px rgba(0,0,0,0.28)",
          backgroundColor: "hsl(var(--surface))",
          animation: "modalIn 0.18s ease-out",
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "20px 24px", borderBottom: "1px solid hsl(var(--border))", flexShrink: 0,
        }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: "hsl(var(--text-main))", margin: 0 }}>
            Registrar Consumo
          </h2>
          <button onClick={onClose} style={{ padding: 6, borderRadius: 6, border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", color: "hsl(var(--text-muted))" }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
          <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Fecha */}
            <div>
              <label style={labelStyle}>Fecha</label>
              <input
                {...register("fecha")}
                type="date"
                style={inputStyle(false)}
              />
            </div>

            {/* Producto */}
            <div>
              <label style={labelStyle}>Producto *</label>
              <select
                {...register("product_id")}
                style={inputStyle(!!errors.product_id)}
              >
                <option value="">Seleccionar producto...</option>
                {productos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre} — Stock: {p.stock_actual} {p.unidad}
                  </option>
                ))}
              </select>
              {errors.product_id && <p style={errorStyle}>{errors.product_id.message}</p>}
            </div>

            {/* Cantidad */}
            <div>
              <label style={labelStyle}>
                Cantidad *{selectedProd ? ` (${selectedProd.unidad})` : ""}
              </label>
              <input
                {...register("qty", { valueAsNumber: true })}
                type="number"
                min={0}
                step="0.001"
                placeholder="0"
                style={inputStyle(!!errors.qty || !!stockInsuficiente)}
              />
              {errors.qty && <p style={errorStyle}>{errors.qty.message}</p>}
              {stockInsuficiente && (
                <p style={errorStyle}>
                  Stock insuficiente. Disponible: {selectedProd?.stock_actual} {selectedProd?.unidad}
                </p>
              )}
            </div>

            {/* Card valor estimado */}
            {selectedProd && qtyNum > 0 && (
              <div style={{
                backgroundColor: "hsl(var(--surface-alt))",
                borderRadius: 8,
                padding: "10px 14px",
                fontSize: 13,
              }}>
                <span style={{ color: "hsl(var(--text-sub))" }}>Valor estimado: </span>
                <strong style={{ color: "hsl(var(--navy))" }}>{formatCurrency(valorEstimado)}</strong>
                {stockBajo && (
                  <div style={{ color: "#E67E22", fontSize: 12, marginTop: 4 }}>
                    ⚠ Esto deja el stock bajo mínimo
                  </div>
                )}
              </div>
            )}

            {/* Notas */}
            <div>
              <label style={labelStyle}>Notas (opcional)</label>
              <textarea
                {...register("notes")}
                placeholder="Descripción opcional..."
                rows={3}
                style={{ ...inputStyle(false), resize: "none", minHeight: 64 }}
              />
            </div>
          </div>

          {/* Footer */}
          <div style={{
            display: "flex", gap: 10,
            padding: "16px 24px 20px",
            borderTop: "1px solid hsl(var(--border))",
            flexShrink: 0,
          }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                padding: "9px 16px", fontSize: 13, fontWeight: 600,
                borderRadius: 8, border: "1px solid hsl(var(--border))",
                backgroundColor: "transparent", color: "hsl(var(--text-sub))",
                cursor: "pointer", fontFamily: "inherit",
              }}
            >
              <X size={14} />
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending || !!stockInsuficiente}
              style={{
                flex: 2, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                padding: "9px 16px", fontSize: 13, fontWeight: 600,
                borderRadius: 8, border: "none",
                backgroundColor: "hsl(var(--navy))", color: "white",
                cursor: isPending || stockInsuficiente ? "not-allowed" : "pointer",
                opacity: isPending || stockInsuficiente ? 0.6 : 1,
                fontFamily: "inherit",
              }}
            >
              {isPending ? <Loader2 size={14} style={{ animation: "spin 0.7s linear infinite" }} /> : <Check size={14} />}
              {isPending ? "Guardando..." : "Guardar"}
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
