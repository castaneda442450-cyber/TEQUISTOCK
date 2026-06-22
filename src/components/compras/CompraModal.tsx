"use client";

import { useState, useEffect, useTransition, useMemo } from "react";
import { useForm } from "react-hook-form";
import { sileo } from "sileo";
import { X, Check, Loader2, Plus } from "lucide-react";
import { ProductoSearchSelect } from "@/components/ui/ProductoSearchSelect";
import { ordenSchema, type OrdenInput } from "@/lib/schemas/compra.schema";
import { createOrden, updateOrden } from "@/lib/actions/compras.actions";
import { formatCurrency } from "@/lib/format";
import type { OrdenCompra, Proveedor, Producto } from "@/types";

interface LineItem {
  product_id: string;
  qty: number;
  price: number;
}

interface HeaderForm {
  supplier_id: string;
  fecha: string;
  folio: string;
  has_invoice: boolean;
}

interface CompraModalProps {
  open: boolean;
  editTarget: OrdenCompra | null;
  proveedores: Proveedor[];
  productos: Producto[];
  onClose: () => void;
  onSuccess: (o: OrdenCompra) => void;
}

export function CompraModal({
  open,
  editTarget,
  proveedores,
  productos,
  onClose,
  onSuccess,
}: CompraModalProps) {
  const [isPending, startTransition] = useTransition();
  const [lines, setLines] = useState<LineItem[]>([{ product_id: "", qty: 1, price: 0 }]);
  // supplierHint: sugerencia de proveedor cuando el producto elegido pertenece a proveedores
  const [supplierHint, setSupplierHint] = useState<{ lineIdx: number; options: Proveedor[] } | null>(null);

  const { register, handleSubmit, watch, reset, setValue, formState: { errors } } = useForm<HeaderForm>({
    defaultValues: {
      supplier_id: proveedores[0]?.id ?? "",
      fecha: new Date().toISOString().split("T")[0],
      folio: "",
      has_invoice: false,
    },
  });

  const selectedSupplierId = watch("supplier_id");

  // Mapa inverso: product_id → proveedores que lo venden
  const productSupplierMap = useMemo(() => {
    const map = new Map<string, Proveedor[]>();
    for (const prov of proveedores) {
      for (const pid of prov.producto_ids ?? []) {
        if (!map.has(pid)) map.set(pid, []);
        map.get(pid)!.push(prov);
      }
    }
    return map;
  }, [proveedores]);

  // Productos del proveedor seleccionado (para optgroup)
  const supplierProductIds = useMemo(() => {
    const supp = proveedores.find((p) => p.id === selectedSupplierId);
    return new Set(supp?.producto_ids ?? []);
  }, [proveedores, selectedSupplierId]);

  const supplierProds = productos.filter((p) => supplierProductIds.has(p.id));
  const otherProds = productos.filter((p) => !supplierProductIds.has(p.id));

  useEffect(() => {
    if (!open) return;
    setSupplierHint(null);
    if (editTarget) {
      const detalles = (editTarget.detalles ?? []) as any[];
      reset({
        supplier_id: editTarget.supplier_id,
        fecha: editTarget.fecha?.split("T")[0] ?? new Date().toISOString().split("T")[0],
        folio: editTarget.folio ?? "",
        has_invoice: editTarget.has_invoice ?? false,
      });
      setLines(
        detalles.length > 0
          ? detalles.map((d: any) => ({ product_id: d.product_id, qty: d.qty, price: d.price }))
          : [{ product_id: "", qty: 1, price: 0 }],
      );
    } else {
      reset({
        supplier_id: proveedores[0]?.id ?? "",
        fecha: new Date().toISOString().split("T")[0],
        folio: "",
        has_invoice: false,
      });
      setLines([{ product_id: "", qty: 1, price: 0 }]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editTarget]);

  function addLine() {
    setLines((prev) => [...prev, { product_id: "", qty: 1, price: 0 }]);
  }

  function removeLine(i: number) {
    if (lines.length === 1) return;
    setLines((prev) => prev.filter((_, idx) => idx !== i));
    if (supplierHint?.lineIdx === i) setSupplierHint(null);
  }

  function updateLine(i: number, field: keyof LineItem, value: string | number) {
    const next = lines.map((l, idx) => {
      if (idx !== i) return l;
      const updated = { ...l, [field]: value };
      if (field === "product_id" && value) {
        const prod = productos.find((p) => p.id === value);
        if (prod) updated.price = prod.last_price;
      }
      return updated;
    });
    setLines(next);

    if (field !== "product_id") return;

    if (!value) {
      setSupplierHint(null);
      return;
    }

    const suppliersForProd = productSupplierMap.get(value as string) ?? [];
    if (suppliersForProd.length === 0) {
      setSupplierHint(null);
      return;
    }

    const alreadyCorrect = suppliersForProd.some((s) => s.id === selectedSupplierId);
    if (alreadyCorrect) {
      setSupplierHint(null);
    } else if (suppliersForProd.length === 1 && !selectedSupplierId) {
      setValue("supplier_id", suppliersForProd[0].id);
      setSupplierHint(null);
    } else {
      setSupplierHint({ lineIdx: i, options: suppliersForProd });
    }
  }

  const total = lines.reduce((s, l) => s + (Number(l.qty) || 0) * (Number(l.price) || 0), 0);

  function onSubmit(data: HeaderForm) {
    const validLines = lines.filter((l) => l.product_id && Number(l.qty) > 0 && Number(l.price) > 0);
    if (validLines.length === 0) {
      sileo.error({ title: "Agrega al menos un producto con cantidad y precio válidos" });
      return;
    }

    const input: OrdenInput = {
      supplier_id: data.supplier_id,
      fecha: data.fecha,
      folio: data.folio || undefined,
      has_invoice: data.has_invoice,
      invoice_url: null,
      detalles: validLines.map((l) => ({
        product_id: l.product_id,
        qty: Number(l.qty),
        price: Number(l.price),
      })),
    };

    startTransition(async () => {
      if (editTarget) {
        const res = await updateOrden(editTarget.id, input);
        if (res.error) { sileo.error({ title: res.error }); return; }
        sileo.success({ title: "Compra actualizada" });
        onSuccess(res.data!);
      } else {
        const res = await createOrden(input);
        if (res.error) { sileo.error({ title: res.error }); return; }
        sileo.success({ title: "Compra registrada — stock actualizado" });
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
          maxWidth: 780,
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
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "20px 24px",
          borderBottom: "1px solid hsl(var(--border))",
          flexShrink: 0,
        }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: "hsl(var(--text-main))", margin: 0 }}>
            {editTarget ? `Editar Compra: ${editTarget.folio}` : "Registrar Compra"}
          </h2>
          <button
            onClick={onClose}
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

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
          <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Info General */}
            <div>
              <div style={sectionTitleStyle}>Información General</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <label style={labelStyle}>Fecha de Compra *</label>
                  <input
                    {...register("fecha")}
                    type="date"
                    style={inputStyle(!!errors.fecha)}
                  />
                  {errors.fecha && <p style={errorStyle}>{errors.fecha.message}</p>}
                </div>

                <div>
                  <label style={labelStyle}>Proveedor *</label>
                  <select
                    {...register("supplier_id")}
                    style={inputStyle(!!errors.supplier_id)}
                  >
                    <option value="">Seleccionar proveedor...</option>
                    {proveedores.map((p) => (
                      <option key={p.id} value={p.id}>{p.company}</option>
                    ))}
                  </select>
                  {errors.supplier_id && <p style={errorStyle}>{errors.supplier_id.message}</p>}
                </div>

                <div>
                  <label style={labelStyle}>Folio / # Factura</label>
                  <input
                    {...register("folio")}
                    type="text"
                    placeholder="ORD-2026-001 (auto si vacío)"
                    style={inputStyle(false)}
                  />
                </div>

                <div style={{ display: "flex", alignItems: "center", paddingTop: 22 }}>
                  <label style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    cursor: "pointer",
                    fontSize: 13,
                    color: "hsl(var(--text-main))",
                  }}>
                    <input
                      {...register("has_invoice")}
                      type="checkbox"
                      style={{ width: 16, height: 16, cursor: "pointer", accentColor: "hsl(var(--green))" }}
                    />
                    ¿Tiene factura?
                  </label>
                </div>
              </div>
            </div>

            {/* Productos */}
            <div style={{ borderTop: "1px solid hsl(var(--border))", paddingTop: 20 }}>
              <div style={sectionTitleStyle}>Productos</div>

              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 32px", gap: 8, marginBottom: 6 }}>
                {["Producto", "Cantidad", "Precio Unit.", ""].map((h) => (
                  <div key={h} style={labelStyle}>{h}</div>
                ))}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {lines.map((line, i) => (
                  <div key={i}>
                    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 32px", gap: 8, alignItems: "center" }}>
                      {/* Buscador de producto */}
                      <ProductoSearchSelect
                        productos={[...supplierProds, ...otherProds]}
                        value={line.product_id}
                        onChange={(id) => updateLine(i, "product_id", id)}
                      />

                      <input
                        type="number"
                        min={0}
                        step="0.001"
                        value={line.qty || ""}
                        onChange={(e) => updateLine(i, "qty", e.target.value)}
                        placeholder="0"
                        style={{ ...inputStyle(false), fontVariantNumeric: "tabular-nums" }}
                      />
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={line.price || ""}
                        onChange={(e) => updateLine(i, "price", e.target.value)}
                        placeholder="0.00"
                        style={{ ...inputStyle(false), fontVariantNumeric: "tabular-nums" }}
                      />
                      <button
                        type="button"
                        onClick={() => removeLine(i)}
                        disabled={lines.length === 1}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: 32,
                          height: 36,
                          borderRadius: 6,
                          border: "none",
                          backgroundColor: lines.length === 1 ? "transparent" : "hsl(var(--terracota) / 0.1)",
                          color: "hsl(var(--terracota))",
                          cursor: lines.length === 1 ? "not-allowed" : "pointer",
                          opacity: lines.length === 1 ? 0.3 : 1,
                          flexShrink: 0,
                        }}
                      >
                        <X size={14} />
                      </button>
                    </div>

                    {/* Hint de proveedor: aparece debajo de la línea cuando el producto elegido
                        pertenece a un proveedor distinto al seleccionado en el header */}
                    {supplierHint?.lineIdx === i && (
                      <div style={{
                        gridColumn: "1 / -1",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        marginTop: 4,
                        padding: "6px 10px",
                        borderRadius: 8,
                        backgroundColor: "hsl(var(--gold) / 0.1)",
                        border: "1px solid hsl(var(--gold) / 0.3)",
                      }}>
                        <span style={{ fontSize: 11, color: "hsl(var(--gold))", fontWeight: 600 }}>
                          ¿Proveedor?
                        </span>
                        <span style={{ fontSize: 11, color: "hsl(var(--text-sub))" }}>
                          Este producto lo surten:
                        </span>
                        {supplierHint.options.map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => {
                              setValue("supplier_id", s.id);
                              setSupplierHint(null);
                            }}
                            style={{
                              padding: "3px 10px",
                              borderRadius: 99,
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: "pointer",
                              border: "1.5px solid hsl(var(--gold))",
                              backgroundColor: "hsl(var(--gold) / 0.15)",
                              color: "hsl(var(--gold))",
                              fontFamily: "inherit",
                              transition: "all 0.12s ease",
                            }}
                          >
                            {s.company}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => setSupplierHint(null)}
                          style={{
                            marginLeft: "auto",
                            padding: 2,
                            border: "none",
                            background: "transparent",
                            cursor: "pointer",
                            color: "hsl(var(--text-muted))",
                            display: "flex",
                          }}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={addLine}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginTop: 10,
                  padding: "7px 14px",
                  borderRadius: 8,
                  border: "1px solid hsl(var(--border))",
                  backgroundColor: "transparent",
                  color: "hsl(var(--text-sub))",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                <Plus size={14} />
                Agregar producto
              </button>
            </div>

            {/* Total */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 18px",
              borderRadius: 8,
              backgroundColor: "hsl(var(--surface-alt))",
            }}>
              <span style={{ fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", color: "hsl(var(--text-sub))" }}>
                Total General
              </span>
              <span style={{ fontSize: 22, fontWeight: 800, color: "hsl(var(--terracota))", fontVariantNumeric: "tabular-nums" }}>
                {formatCurrency(total)}
              </span>
            </div>
          </div>

          {/* Footer */}
          <div style={{
            display: "flex",
            gap: 10,
            padding: "16px 24px 20px",
            borderTop: "1px solid hsl(var(--border))",
            flexShrink: 0,
          }}>
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
                flex: 2,
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
              {isPending ? "Guardando..." : editTarget ? "Actualizar Compra" : "Guardar Compra"}
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

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  color: "hsl(var(--text-main))",
  marginBottom: 14,
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
