"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { sileo } from "sileo";
import { Check, Loader2, Scissors, AlertTriangle } from "lucide-react";
import { ProductoSearchSelect } from "@/components/ui/ProductoSearchSelect";
import {
  registrarPorcionadoSchema,
  type RegistrarPorcionadoInput,
} from "@/lib/schemas/porcionado.schema";
import { registrarPorcionado } from "@/lib/actions/porcionado.actions";
import { convertUnit, getCompatibleUnits } from "@/lib/units";
import { formatCurrency, formatNumber } from "@/lib/format";
import type { ResumenPorcion } from "@/types";

interface Props {
  resumen: ResumenPorcion[];
  preseleccion: { id: string; nonce: number } | null;
}

export default function RegistrarPorcionadoForm({ resumen, preseleccion }: Props) {
  const [isPending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const configurados = useMemo(
    () => resumen.filter((r) => r.porcion_config),
    [resumen],
  );
  const productosSelect = useMemo(
    () =>
      configurados.map((r) => ({
        id: r.product_id,
        nombre: r.nombre,
        unidad: r.unidad_producto,
      })),
    [configurados],
  );

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<RegistrarPorcionadoInput>({
    resolver: zodResolver(registrarPorcionadoSchema),
    defaultValues: {
      product_id: "",
      cantidad_usada: undefined,
      unidad_usada: "",
      porciones_obtenidas: undefined,
      porcion_size_real: undefined,
      porcion_unit: "",
      notas: "",
    },
  });

  const productId = watch("product_id");
  const cantidadUsada = watch("cantidad_usada");
  const unidadUsada = watch("unidad_usada");
  const porciones = watch("porciones_obtenidas");
  const porcionSizeReal = watch("porcion_size_real");
  const porcionUnit = watch("porcion_unit");

  const selected = configurados.find((r) => r.product_id === productId) ?? null;
  const cfg = selected?.porcion_config ?? null;
  const unidadProducto = selected?.unidad_producto ?? "";
  const compatibles = unidadProducto ? getCompatibleUnits(unidadProducto) : [];

  // Prefill al seleccionar producto
  useEffect(() => {
    if (!selected || !cfg) return;
    setValue("unidad_usada", unidadProducto);
    setValue("porcion_unit", cfg.porcion_unit);
    setValue("porcion_size_real", cfg.porcion_size, { shouldValidate: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  // Preselección desde una card del resumen
  useEffect(() => {
    if (preseleccion?.id) {
      setValue("product_id", preseleccion.id, { shouldValidate: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preseleccion?.nonce]);

  // ─── Cálculo en tiempo real (refleja la lógica del server action) ───
  const calc = useMemo(() => {
    const cant = Number(cantidadUsada) || 0;
    const nPorc = Number(porciones) || 0;
    const sizeReal = Number(porcionSizeReal) || 0;

    if (!selected || cant <= 0 || !unidadUsada || !porcionUnit) return null;

    const cantEnProducto = convertUnit(cant, unidadUsada, unidadProducto);
    const cantEnPorcion = convertUnit(cant, unidadUsada, porcionUnit);
    if (cantEnProducto === null || cantEnPorcion === null) return null;

    const qtyMovimiento = Math.round(cantEnProducto);
    const stockInsuficiente = qtyMovimiento > selected.stock_actual;
    const qtyCero = qtyMovimiento < 1;

    const pesoTeorico = nPorc * sizeReal; // en porcionUnit
    const mermaEnPorcion = Math.max(0, cantEnPorcion - pesoTeorico);
    const mermaPct = cantEnPorcion > 0 ? (mermaEnPorcion / cantEnPorcion) * 100 : 0;
    const mermaEnProducto =
      convertUnit(mermaEnPorcion, porcionUnit, unidadProducto) ?? 0;
    const lastPrice = Number(cfg?.producto?.last_price ?? 0);
    const valorMerma = mermaEnProducto * lastPrice;

    const alertaPct = cfg?.merma_alerta_pct ?? 15;

    return {
      pesoTeorico,
      cantEnPorcion,
      mermaEnPorcion,
      mermaPct,
      mermaEnProducto: Math.round(mermaEnProducto * 1000) / 1000,
      valorMerma,
      qtyMovimiento,
      stockInsuficiente,
      qtyCero,
      alertaPct,
      mermaAlta: mermaPct >= alertaPct,
    };
  }, [
    selected,
    cfg,
    cantidadUsada,
    unidadUsada,
    porciones,
    porcionSizeReal,
    porcionUnit,
    unidadProducto,
  ]);

  const camposCompletos =
    !!productId &&
    Number(cantidadUsada) > 0 &&
    !!unidadUsada &&
    Number(porciones) > 0 &&
    Number(porcionSizeReal) > 0 &&
    !!porcionUnit;

  const bloqueado =
    !camposCompletos || !!calc?.stockInsuficiente || !!calc?.qtyCero;

  function doSubmit(data: RegistrarPorcionadoInput) {
    startTransition(async () => {
      const res = await registrarPorcionado(data);
      if (res.error) {
        sileo.error({ title: res.error, description: "Intenta nuevamente." });
        return;
      }
      const mermaMsg =
        res.merma_calculada > 0
          ? `Merma de corte: ${formatNumber(res.merma_calculada)} ${res.merma_unidad}.`
          : "Sin merma de corte.";
      sileo.success({
        title: "Porcionado registrado",
        description: `${mermaMsg} El stock fue descontado del inventario.`,
      });
      reset({
        product_id: "",
        cantidad_usada: undefined,
        unidad_usada: "",
        porciones_obtenidas: undefined,
        porcion_size_real: undefined,
        porcion_unit: "",
        notas: "",
      });
    });
  }

  function onSubmit(data: RegistrarPorcionadoInput) {
    if (bloqueado) return;
    if (calc?.mermaAlta) {
      setConfirmOpen(true);
      return;
    }
    doSubmit(data);
  }

  if (configurados.length === 0) return null;

  const mermaColor = !calc
    ? "hsl(var(--text-sub))"
    : calc.mermaEnPorcion <= 0
      ? "hsl(var(--green))"
      : calc.mermaAlta
        ? "hsl(var(--terracota))"
        : "hsl(var(--gold))";

  return (
    <div
      style={{
        background: "hsl(var(--surface))",
        border: "1px solid hsl(var(--border))",
        borderRadius: 12,
        padding: 22,
        boxShadow: "0 2px 8px hsl(var(--shadow, 0 0% 0% / 0.06))",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
        <Scissors size={18} style={{ color: "hsl(var(--terracota))" }} />
        <h2 style={{ fontSize: 16, fontWeight: 700, color: "hsl(var(--text-main))", margin: 0 }}>
          Registrar porcionado
        </h2>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Producto */}
        <div>
          <label style={labelStyle}>Producto *</label>
          <ProductoSearchSelect
            productos={productosSelect}
            value={productId}
            onChange={(id) => setValue("product_id", id, { shouldValidate: true })}
            placeholder="Selecciona un producto configurado..."
            hasError={!!errors.product_id}
          />
          {selected && cfg && (
            <div
              style={{
                marginTop: 8,
                fontSize: 12.5,
                color: "hsl(var(--text-sub))",
                display: "flex",
                flexWrap: "wrap",
                gap: "4px 16px",
              }}
            >
              <span>
                Stock:{" "}
                <strong style={{ color: "hsl(var(--text-main))" }}>
                  {formatNumber(selected.stock_actual)} {unidadProducto}
                </strong>
              </span>
              <span>
                Porción estándar:{" "}
                <strong style={{ color: "hsl(var(--text-main))" }}>
                  {formatNumber(cfg.porcion_size)} {cfg.porcion_unit}
                </strong>
              </span>
            </div>
          )}
        </div>

        {selected && (
          <>
            {/* Cantidad utilizada */}
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 2 }}>
                <label style={labelStyle}>Cantidad utilizada *</label>
                <input
                  {...register("cantidad_usada", { valueAsNumber: true })}
                  type="number"
                  min={0}
                  step="0.001"
                  placeholder="0"
                  style={inputStyle(!!errors.cantidad_usada || !!calc?.stockInsuficiente)}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Unidad *</label>
                <select {...register("unidad_usada")} style={selectStyle(!!errors.unidad_usada)}>
                  {compatibles.map((u) => (
                    <option key={u.key} value={u.key}>
                      {u.short}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {calc?.stockInsuficiente && (
              <p style={errorStyle}>
                Stock insuficiente. Disponible: {formatNumber(selected.stock_actual)}{" "}
                {unidadProducto}
              </p>
            )}
            {calc?.qtyCero && !calc?.stockInsuficiente && (
              <p style={errorStyle}>
                La cantidad convertida al inventario redondea a menos de 1{" "}
                {unidadProducto}. Aumenta la cantidad.
              </p>
            )}

            {/* Tamaño de porción */}
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 2 }}>
                <label style={labelStyle}>Tamaño de porción *</label>
                <input
                  {...register("porcion_size_real", { valueAsNumber: true })}
                  type="number"
                  min={0}
                  step="0.001"
                  placeholder="0"
                  style={inputStyle(!!errors.porcion_size_real)}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Unidad *</label>
                <select {...register("porcion_unit")} style={selectStyle(!!errors.porcion_unit)}>
                  {compatibles.map((u) => (
                    <option key={u.key} value={u.key}>
                      {u.short}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Porciones obtenidas */}
            <div>
              <label style={labelStyle}>Porciones obtenidas *</label>
              <input
                {...register("porciones_obtenidas", { valueAsNumber: true })}
                type="number"
                min={1}
                step="1"
                placeholder="0"
                style={inputStyle(!!errors.porciones_obtenidas)}
              />
              {errors.porciones_obtenidas && (
                <p style={errorStyle}>{errors.porciones_obtenidas.message}</p>
              )}
            </div>

            {/* Cálculo en tiempo real */}
            {calc && (
              <div
                style={{
                  border: `1px solid ${mermaColor}`,
                  background: "hsl(var(--surface-alt))",
                  borderRadius: 10,
                  padding: "14px 16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  fontSize: 13,
                }}
              >
                <Row
                  label="Peso teórico"
                  value={`${formatNumber(Number(porciones) || 0)} × ${formatNumber(
                    Number(porcionSizeReal) || 0,
                  )} ${porcionUnit} = ${formatNumber(
                    Math.round(calc.pesoTeorico * 1000) / 1000,
                  )} ${porcionUnit}`}
                />
                <Row
                  label="Peso real"
                  value={`${formatNumber(
                    Math.round(calc.cantEnPorcion * 1000) / 1000,
                  )} ${porcionUnit}`}
                />
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingTop: 8,
                    borderTop: "1px solid hsl(var(--border))",
                  }}
                >
                  <span style={{ color: "hsl(var(--text-sub))" }}>Merma de corte</span>
                  <span style={{ fontWeight: 700, color: mermaColor }}>
                    {formatNumber(calc.mermaEnProducto)} {unidadProducto}
                    {calc.mermaEnProducto > 0 && (
                      <> (~{formatCurrency(calc.valorMerma)})</>
                    )}
                    {calc.cantEnPorcion > 0 && (
                      <> · {calc.mermaPct.toFixed(1)}%</>
                    )}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span style={{ color: "hsl(var(--text-sub))" }}>
                    Descuento de inventario
                  </span>
                  <span style={{ fontWeight: 700, color: "hsl(var(--navy))" }}>
                    −{formatNumber(calc.qtyMovimiento)} {unidadProducto}
                  </span>
                </div>

                {calc.mermaAlta && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 7,
                      marginTop: 4,
                      padding: "8px 10px",
                      borderRadius: 8,
                      background: "hsl(var(--terracota) / 0.10)",
                      color: "hsl(var(--terracota))",
                      fontSize: 12.5,
                      fontWeight: 600,
                    }}
                  >
                    <AlertTriangle size={15} style={{ flexShrink: 0 }} />
                    Merma alta ({calc.mermaPct.toFixed(1)}%) — supera el umbral de{" "}
                    {formatNumber(calc.alertaPct)}%. Se pedirá confirmación.
                  </div>
                )}
              </div>
            )}

            {/* Notas */}
            <div>
              <label style={labelStyle}>Notas (opcional)</label>
              <textarea
                {...register("notas")}
                rows={2}
                placeholder="Descripción opcional..."
                style={{ ...inputStyle(false), resize: "none", minHeight: 52 }}
              />
            </div>

            <button
              type="submit"
              disabled={isPending || bloqueado}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                padding: "11px 16px",
                fontSize: 14,
                fontWeight: 600,
                borderRadius: 8,
                border: "none",
                background: "hsl(var(--terracota))",
                color: "white",
                cursor: isPending || bloqueado ? "not-allowed" : "pointer",
                opacity: isPending || bloqueado ? 0.55 : 1,
                fontFamily: "inherit",
                boxShadow: "0 2px 8px hsl(var(--terracota) / 0.30)",
              }}
            >
              {isPending ? (
                <Loader2 size={15} style={{ animation: "spin 0.7s linear infinite" }} />
              ) : (
                <Check size={15} />
              )}
              {isPending ? "Guardando..." : "Registrar porcionado"}
            </button>
          </>
        )}
      </form>

      {confirmOpen && calc && selected && (
        <ConfirmarMermaModal
          mermaPct={calc.mermaPct}
          mermaCantidad={calc.mermaEnProducto}
          mermaUnidad={unidadProducto}
          isPending={isPending}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={() => {
            setConfirmOpen(false);
            handleSubmit(doSubmit)();
          }}
        />
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
      <span style={{ color: "hsl(var(--text-sub))" }}>{label}</span>
      <span style={{ color: "hsl(var(--text-main))", fontWeight: 600, textAlign: "right" }}>
        {value}
      </span>
    </div>
  );
}

function ConfirmarMermaModal({
  mermaPct,
  mermaCantidad,
  mermaUnidad,
  isPending,
  onCancel,
  onConfirm,
}: {
  mermaPct: number;
  mermaCantidad: number;
  mermaUnidad: string;
  isPending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
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
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        style={{
          background: "hsl(var(--surface))",
          borderRadius: 12,
          boxShadow: "0 32px 80px rgba(0,0,0,0.28)",
          width: "100%",
          maxWidth: 420,
          padding: 24,
          animation: "modalIn 0.18s ease-out",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 10 }}>
          <AlertTriangle size={20} style={{ color: "hsl(var(--terracota))" }} />
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "hsl(var(--text-main))", margin: 0 }}>
            Merma elevada
          </h3>
        </div>
        <p style={{ fontSize: 14, color: "hsl(var(--text-sub))", margin: "0 0 20px", lineHeight: 1.5 }}>
          Hay una merma de corte de{" "}
          <strong style={{ color: "hsl(var(--terracota))" }}>{mermaPct.toFixed(1)}%</strong>{" "}
          ({formatNumber(mermaCantidad)} {mermaUnidad}). ¿Confirmas el registro?
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            onClick={onCancel}
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
            onClick={onConfirm}
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
            Sí, registrar
          </button>
        </div>
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

function selectStyle(hasError: boolean): React.CSSProperties {
  return { ...inputStyle(hasError), cursor: "pointer" };
}

const errorStyle: React.CSSProperties = {
  fontSize: 11,
  marginTop: -6,
  color: "hsl(var(--terracota))",
};
