"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { X, Check, Loader2, Plus, FileText, Upload } from "lucide-react";
import { ordenSchema, type OrdenInput } from "@/lib/schemas/compra.schema";
import {
  createOrden,
  updateOrden,
  uploadFactura,
  deleteFactura,
} from "@/lib/actions/compras.actions";
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
  const [invoiceUploading, setInvoiceUploading] = useState(false);
  const [invoiceUploaded, setInvoiceUploaded] = useState<{ path: string; name: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, watch, reset, setValue, formState: { errors } } = useForm<HeaderForm>({
    defaultValues: {
      supplier_id: proveedores[0]?.id ?? "",
      fecha: new Date().toISOString().split("T")[0],
      folio: "",
      has_invoice: false,
    },
  });

  const hasInvoice = watch("has_invoice");
  const selectedSupplierId = watch("supplier_id");

  // Filter products by selected supplier
  const suppProds = (() => {
    const supp = proveedores.find((p) => p.id === selectedSupplierId);
    if (supp && supp.producto_ids && supp.producto_ids.length > 0) {
      const filtered = productos.filter((p) => supp.producto_ids.includes(p.id));
      return filtered.length > 0 ? filtered : productos;
    }
    return productos;
  })();

  useEffect(() => {
    if (!open) return;
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
      if (editTarget.invoice_url) {
        const parts = editTarget.invoice_url.split("_");
        const name = parts.slice(1).join("_") || editTarget.invoice_url;
        setInvoiceUploaded({ path: editTarget.invoice_url, name });
      } else {
        setInvoiceUploaded(null);
      }
    } else {
      reset({
        supplier_id: proveedores[0]?.id ?? "",
        fecha: new Date().toISOString().split("T")[0],
        folio: "",
        has_invoice: false,
      });
      setLines([{ product_id: "", qty: 1, price: 0 }]);
      setInvoiceUploaded(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editTarget]);

  function addLine() {
    setLines((prev) => [...prev, { product_id: "", qty: 1, price: 0 }]);
  }

  function removeLine(i: number) {
    if (lines.length === 1) return;
    setLines((prev) => prev.filter((_, idx) => idx !== i));
  }

  function updateLine(i: number, field: keyof LineItem, value: string | number) {
    setLines((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: value };
      if (field === "product_id") {
        const prod = productos.find((p) => p.id === value);
        if (prod) next[i].price = prod.last_price;
      }
      return next;
    });
  }

  const total = lines.reduce((s, l) => s + (Number(l.qty) || 0) * (Number(l.price) || 0), 0);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setInvoiceUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await uploadFactura(fd);
      if (res.error) {
        toast.error(`Error al subir factura: ${res.error}`);
      } else {
        setInvoiceUploaded({ path: res.path!, name: file.name });
      }
    } finally {
      setInvoiceUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function removeInvoice() {
    if (!invoiceUploaded) return;
    // Only delete from Storage if it's a new upload (not the original from editTarget)
    const isOriginal = editTarget?.invoice_url === invoiceUploaded.path;
    if (!isOriginal) {
      await deleteFactura(invoiceUploaded.path);
    }
    setInvoiceUploaded(null);
    setValue("has_invoice", false);
  }

  function onSubmit(data: HeaderForm) {
    const validLines = lines.filter((l) => l.product_id && Number(l.qty) > 0 && Number(l.price) > 0);
    if (validLines.length === 0) {
      toast.error("Agrega al menos un producto con cantidad y precio válidos");
      return;
    }

    const input: OrdenInput = {
      supplier_id: data.supplier_id,
      fecha: data.fecha,
      folio: data.folio || undefined,
      has_invoice: data.has_invoice,
      invoice_url: data.has_invoice && invoiceUploaded ? invoiceUploaded.path : null,
      detalles: validLines.map((l) => ({
        product_id: l.product_id,
        qty: Number(l.qty),
        price: Number(l.price),
      })),
    };

    startTransition(async () => {
      if (editTarget) {
        const res = await updateOrden(editTarget.id, input);
        if (res.error) {
          toast.error(res.error);
          return;
        }
        toast.success("Compra actualizada");
        onSuccess(res.data!);
      } else {
        const res = await createOrden(input);
        if (res.error) {
          // Rollback new invoice upload if it failed
          if (invoiceUploaded && !editTarget) {
            await deleteFactura(invoiceUploaded.path);
          }
          toast.error(res.error);
          return;
        }
        toast.success("Compra registrada — stock actualizado");
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

        {/* Scrollable body */}
        <form onSubmit={handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
          <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Section: Info General */}
            <div>
              <div style={sectionTitleStyle}>Información General</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                {/* Fecha */}
                <div>
                  <label style={labelStyle}>Fecha de Compra *</label>
                  <input
                    {...register("fecha")}
                    type="date"
                    style={inputStyle(!!errors.fecha)}
                  />
                  {errors.fecha && <p style={errorStyle}>{errors.fecha.message}</p>}
                </div>

                {/* Proveedor */}
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

                {/* Folio */}
                <div>
                  <label style={labelStyle}>Folio / # Factura</label>
                  <input
                    {...register("folio")}
                    type="text"
                    placeholder="ORD-2026-001 (auto si vacío)"
                    style={inputStyle(false)}
                  />
                </div>

                {/* Checkbox tiene factura */}
                <div style={{ display: "flex", alignItems: "center" }}>
                  <div style={{ paddingTop: 22 }}>
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
            </div>

            {/* Section: Subir Factura (condicional) */}
            {hasInvoice && (
              <div>
                <div style={sectionTitleStyle}>Archivo de Factura</div>
                {invoiceUploading ? (
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "14px 18px",
                    borderRadius: 8,
                    border: "1px dashed hsl(var(--border))",
                    backgroundColor: "hsl(var(--surface-alt))",
                    color: "hsl(var(--text-sub))",
                    fontSize: 13,
                  }}>
                    <Loader2 size={16} style={{ animation: "spin 0.7s linear infinite", color: "hsl(var(--navy))" }} />
                    Subiendo factura...
                  </div>
                ) : invoiceUploaded ? (
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "12px 16px",
                    borderRadius: 8,
                    border: "1px solid hsl(var(--green) / 0.3)",
                    backgroundColor: "hsl(var(--green) / 0.07)",
                  }}>
                    <div style={{
                      width: 30, height: 30, borderRadius: 6,
                      backgroundColor: "hsl(var(--green) / 0.15)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0,
                    }}>
                      <Check size={15} style={{ color: "hsl(var(--green))" }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "hsl(var(--text-main))", wordBreak: "break-all" }}>
                        {invoiceUploaded.name}
                      </div>
                      <div style={{ fontSize: 11, color: "hsl(var(--green))", marginTop: 2 }}>
                        Factura subida correctamente
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={removeInvoice}
                      style={{
                        padding: 6, borderRadius: 6, border: "none",
                        background: "hsl(var(--terracota) / 0.1)",
                        cursor: "pointer", display: "flex", alignItems: "center",
                        color: "hsl(var(--terracota))",
                        flexShrink: 0,
                      }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileSelect}
                      style={{ display: "none" }}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        width: "100%",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        padding: "24px 16px",
                        borderRadius: 8,
                        border: "2px dashed hsl(var(--border))",
                        backgroundColor: "hsl(var(--surface-alt))",
                        cursor: "pointer",
                        transition: "border-color 0.15s, background-color 0.15s",
                        fontFamily: "inherit",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.borderColor = "hsl(var(--navy))";
                        (e.currentTarget as HTMLElement).style.backgroundColor = "hsl(var(--navy) / 0.04)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.borderColor = "hsl(var(--border))";
                        (e.currentTarget as HTMLElement).style.backgroundColor = "hsl(var(--surface-alt))";
                      }}
                    >
                      <div style={{
                        width: 40, height: 40, borderRadius: 10,
                        backgroundColor: "hsl(var(--navy) / 0.1)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <Upload size={18} style={{ color: "hsl(var(--navy))" }} />
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "hsl(var(--text-main))", textAlign: "center" }}>
                          Haz clic para seleccionar archivo
                        </div>
                        <div style={{ fontSize: 12, color: "hsl(var(--text-muted))", textAlign: "center", marginTop: 2 }}>
                          PDF, JPG o PNG — se sube inmediatamente
                        </div>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Section: Productos */}
            <div style={{ borderTop: "1px solid hsl(var(--border))", paddingTop: 20 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <div style={sectionTitleStyle}>Productos</div>
              </div>

              {/* Column headers */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr 1fr 32px",
                gap: 8,
                marginBottom: 6,
              }}>
                {["Producto", "Cantidad", "Precio Unit.", ""].map((h) => (
                  <div key={h} style={labelStyle}>{h}</div>
                ))}
              </div>

              {/* Lines */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {lines.map((line, i) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 32px", gap: 8, alignItems: "center" }}>
                    <select
                      value={line.product_id}
                      onChange={(e) => updateLine(i, "product_id", e.target.value)}
                      style={inputStyle(false)}
                    >
                      <option value="">Seleccionar...</option>
                      {suppProds.map((p) => (
                        <option key={p.id} value={p.id}>{p.nombre} ({p.unidad})</option>
                      ))}
                    </select>
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
