"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, Trash2, X, ShoppingCart, Minus } from "lucide-react";
import { ordenSchema, type OrdenInput } from "@/lib/schemas/compra.schema";
import { createOrden, deleteOrden } from "@/lib/actions/compras.actions";
import { formatCurrency, formatDate } from "@/lib/format";
import type { OrdenCompra, Proveedor, Producto } from "@/types";

interface Props {
  ordenes: OrdenCompra[];
  proveedores: Proveedor[];
  productos: Producto[];
}

interface LineItem {
  product_id: string;
  qty: number;
  price: number;
}

export default function ComprasClient({ ordenes: initial, proveedores, productos }: Props) {
  const [ordenes, setOrdenes] = useState(initial);
  const [showModal, setShowModal] = useState(false);
  const [lines, setLines] = useState<LineItem[]>([{ product_id: "", qty: 1, price: 0 }]);
  const [isPending, startTransition] = useTransition();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<Omit<OrdenInput, "detalles">>({
    defaultValues: {
      supplier_id: proveedores[0]?.id ?? "",
      fecha: new Date().toISOString().slice(0, 16),
      has_invoice: false,
    },
  });

  function openCreate() {
    reset({
      supplier_id: proveedores[0]?.id ?? "",
      fecha: new Date().toISOString().slice(0, 16),
      has_invoice: false,
    });
    setLines([{ product_id: productos[0]?.id ?? "", qty: 1, price: productos[0]?.last_price ?? 0 }]);
    setShowModal(true);
  }

  function addLine() {
    setLines((prev) => [...prev, { product_id: productos[0]?.id ?? "", qty: 1, price: productos[0]?.last_price ?? 0 }]);
  }

  function removeLine(i: number) {
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

  const lineTotal = lines.reduce((s, l) => s + (l.qty || 0) * (l.price || 0), 0);

  function onSubmit(data: Omit<OrdenInput, "detalles">) {
    const validLines = lines.filter((l) => l.product_id && l.qty > 0 && l.price > 0);
    if (validLines.length === 0) { toast.error("Agrega al menos un producto"); return; }

    const input: OrdenInput = {
      ...data,
      fecha: new Date(data.fecha as string).toISOString(),
      detalles: validLines,
    };

    startTransition(async () => {
      const res = await createOrden(input);
      if (res.error) { toast.error(res.error); return; }
      if (res.data) setOrdenes((prev) => [res.data as OrdenCompra, ...prev]);
      toast.success("Orden de compra registrada");
      setShowModal(false);
    });
  }

  function handleDelete(id: string) {
    if (!confirm("¿Eliminar esta orden? Se revertirá el stock agregado.")) return;
    startTransition(async () => {
      const res = await deleteOrden(id);
      if (res.error) { toast.error(res.error); return; }
      setOrdenes((prev) => prev.filter((o) => o.id !== id));
      toast.success("Orden eliminada");
    });
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "hsl(var(--text-main))" }}>Compras</h1>
          <p className="text-sm mt-0.5" style={{ color: "hsl(var(--text-sub))" }}>{ordenes.length} órdenes registradas</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white"
          style={{ backgroundColor: "hsl(var(--terracota))" }}
        >
          <Plus size={16} /> Nueva compra
        </button>
      </div>

      {/* Orders table */}
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: "hsl(var(--border))", backgroundColor: "hsl(var(--surface))" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: "hsl(var(--surface-alt))", borderBottom: "1px solid hsl(var(--border))" }}>
              {["Folio", "Proveedor", "Fecha", "Ítems", "Total", "Factura", ""].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide" style={{ color: "hsl(var(--text-sub))" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ordenes.map((o, i) => {
              const prov = o.proveedor as any;
              const detalles = (o.detalles ?? []) as any[];
              return (
                <tr key={o.id} style={{ backgroundColor: i % 2 === 0 ? "hsl(var(--surface))" : "hsl(var(--surface-alt))", borderBottom: "1px solid hsl(var(--border))" }}>
                  <td className="px-4 py-3 font-mono font-medium text-xs" style={{ color: "hsl(var(--text-main))" }}>{o.folio}</td>
                  <td className="px-4 py-3 font-medium" style={{ color: "hsl(var(--text-main))" }}>{prov?.company ?? "-"}</td>
                  <td className="px-4 py-3" style={{ color: "hsl(var(--text-sub))" }}>{formatDate(o.fecha)}</td>
                  <td className="px-4 py-3 tabular-nums" style={{ color: "hsl(var(--text-sub))" }}>{detalles.length}</td>
                  <td className="px-4 py-3 tabular-nums font-semibold" style={{ color: "hsl(var(--text-main))" }}>{formatCurrency(o.total)}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{
                      backgroundColor: o.has_invoice ? "#10665322" : "#BA302622",
                      color: o.has_invoice ? "#106653" : "#BA3026",
                    }}>
                      {o.has_invoice ? "Sí" : "No"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleDelete(o.id)} className="p-1.5 rounded-md hover:bg-red-50">
                      <Trash2 size={14} style={{ color: "#BA3026" }} />
                    </button>
                  </td>
                </tr>
              );
            })}
            {ordenes.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-sm" style={{ color: "hsl(var(--text-muted))" }}>
                  No hay órdenes de compra registradas
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal nueva compra */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
          <div className="w-full max-w-2xl rounded-xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto" style={{ backgroundColor: "hsl(var(--surface))" }}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg" style={{ backgroundColor: "hsl(var(--terracota))" }}>
                  <ShoppingCart size={18} className="text-white" />
                </div>
                <h2 className="text-lg font-bold" style={{ color: "hsl(var(--text-main))" }}>Nueva orden de compra</h2>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1 rounded hover:bg-black/5">
                <X size={18} style={{ color: "hsl(var(--text-muted))" }} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Header fields */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "hsl(var(--text-sub))" }}>Proveedor</label>
                  <select
                    {...register("supplier_id")}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                    style={{ borderColor: "hsl(var(--border))", backgroundColor: "hsl(var(--bg))", color: "hsl(var(--text-main))" }}
                  >
                    {proveedores.map((p) => (
                      <option key={p.id} value={p.id}>{p.company}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "hsl(var(--text-sub))" }}>Fecha</label>
                  <input
                    {...register("fecha")}
                    type="datetime-local"
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                    style={{ borderColor: "hsl(var(--border))", backgroundColor: "hsl(var(--bg))", color: "hsl(var(--text-main))" }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input {...register("has_invoice")} type="checkbox" id="has_invoice" className="rounded" />
                <label htmlFor="has_invoice" className="text-sm" style={{ color: "hsl(var(--text-sub))" }}>¿Tiene factura?</label>
              </div>

              {/* Line items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "hsl(var(--text-sub))" }}>Productos</label>
                  <button type="button" onClick={addLine} className="flex items-center gap-1 text-xs font-medium" style={{ color: "hsl(var(--terracota))" }}>
                    <Plus size={13} /> Agregar línea
                  </button>
                </div>
                <div className="space-y-2">
                  {lines.map((line, i) => (
                    <div key={i} className="grid grid-cols-[1fr_80px_100px_32px] gap-2 items-center">
                      <select
                        value={line.product_id}
                        onChange={(e) => updateLine(i, "product_id", e.target.value)}
                        className="px-3 py-2 rounded-lg border text-sm outline-none"
                        style={{ borderColor: "hsl(var(--border))", backgroundColor: "hsl(var(--bg))", color: "hsl(var(--text-main))" }}
                      >
                        <option value="">Seleccionar...</option>
                        {productos.map((p) => (
                          <option key={p.id} value={p.id}>{p.nombre}</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min={1}
                        value={line.qty}
                        onChange={(e) => updateLine(i, "qty", Number(e.target.value))}
                        placeholder="Cant."
                        className="px-3 py-2 rounded-lg border text-sm outline-none tabular-nums"
                        style={{ borderColor: "hsl(var(--border))", backgroundColor: "hsl(var(--bg))", color: "hsl(var(--text-main))" }}
                      />
                      <input
                        type="number"
                        step="0.01"
                        min={0}
                        value={line.price}
                        onChange={(e) => updateLine(i, "price", Number(e.target.value))}
                        placeholder="Precio"
                        className="px-3 py-2 rounded-lg border text-sm outline-none tabular-nums"
                        style={{ borderColor: "hsl(var(--border))", backgroundColor: "hsl(var(--bg))", color: "hsl(var(--text-main))" }}
                      />
                      <button
                        type="button"
                        onClick={() => removeLine(i)}
                        disabled={lines.length === 1}
                        className="p-1 rounded hover:bg-red-50 disabled:opacity-30"
                      >
                        <Minus size={14} style={{ color: "#BA3026" }} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="flex justify-end py-3 border-t" style={{ borderColor: "hsl(var(--border))" }}>
                <div className="text-right">
                  <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "hsl(var(--text-sub))" }}>Total</p>
                  <p className="text-2xl font-black tabular-nums" style={{ color: "hsl(var(--terracota))" }}>{formatCurrency(lineTotal)}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2 rounded-lg text-sm font-semibold border" style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--text-sub))" }}>
                  Cancelar
                </button>
                <button type="submit" disabled={isPending} className="flex-1 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-60" style={{ backgroundColor: "hsl(var(--terracota))" }}>
                  {isPending ? "Registrando..." : "Registrar compra"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
