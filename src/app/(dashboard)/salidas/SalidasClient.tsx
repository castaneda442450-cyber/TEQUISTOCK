"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, X, TrendingDown, AlertTriangle } from "lucide-react";
import { consumoSchema, mermaSchema, type ConsumoInput, type MermaInput } from "@/lib/schemas/salida.schema";
import { createConsumo, createMerma } from "@/lib/actions/salidas.actions";
import { formatCurrency, formatDate, formatTime } from "@/lib/format";
import { MERMA_TYPES, MERMA_COLORS } from "@/lib/constants";
import type { Movimiento, Producto } from "@/types";

interface Props {
  movimientos: Movimiento[];
  productos: Producto[];
}

type ModalMode = "consumo" | "merma" | null;

export default function SalidasClient({ movimientos: initial, productos }: Props) {
  const [movimientos, setMovimientos] = useState(initial);
  const [modal, setModal] = useState<ModalMode>(null);
  const [tab, setTab] = useState<"todos" | "salida" | "merma">("todos");
  const [isPending, startTransition] = useTransition();

  const filtered = movimientos.filter((m) => tab === "todos" || m.tipo === tab);

  // Consumo form
  const consumoForm = useForm<ConsumoInput>({
    resolver: zodResolver(consumoSchema),
    defaultValues: { product_id: productos[0]?.id ?? "", qty: 1, notes: "" },
  });

  // Merma form
  const mermaForm = useForm<MermaInput>({
    resolver: zodResolver(mermaSchema),
    defaultValues: { product_id: productos[0]?.id ?? "", qty: 1, motivo_merma: "Vencimiento", notes: "" },
  });

  const selectedConsumoProduct = productos.find((p) => p.id === consumoForm.watch("product_id"));
  const selectedMermaProduct = productos.find((p) => p.id === mermaForm.watch("product_id"));

  function onConsumo(data: ConsumoInput) {
    startTransition(async () => {
      const res = await createConsumo(data);
      if (res.error) { toast.error(res.error); return; }
      toast.success("Consumo registrado");
      setModal(null);
      consumoForm.reset({ product_id: productos[0]?.id ?? "", qty: 1, notes: "" });
    });
  }

  function onMerma(data: MermaInput) {
    startTransition(async () => {
      const res = await createMerma(data);
      if (res.error) { toast.error(res.error); return; }
      toast.success("Merma registrada");
      setModal(null);
      mermaForm.reset({ product_id: productos[0]?.id ?? "", qty: 1, motivo_merma: "Vencimiento", notes: "" });
    });
  }

  const salidasCount = movimientos.filter((m) => m.tipo === "salida").length;
  const mermasCount = movimientos.filter((m) => m.tipo === "merma").length;
  const mermasValue = movimientos
    .filter((m) => m.tipo === "merma")
    .reduce((s, m) => s + Number(m.value_lost ?? 0), 0);

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "hsl(var(--text-main))" }}>Salidas</h1>
          <p className="text-sm mt-0.5" style={{ color: "hsl(var(--text-sub))" }}>Consumos y mermas de inventario</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { mermaForm.reset({ product_id: productos[0]?.id ?? "", qty: 1, motivo_merma: "Vencimiento", notes: "" }); setModal("merma"); }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border"
            style={{ borderColor: "#BA3026", color: "#BA3026" }}
          >
            <AlertTriangle size={15} /> Merma
          </button>
          <button
            onClick={() => { consumoForm.reset({ product_id: productos[0]?.id ?? "", qty: 1, notes: "" }); setModal("consumo"); }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white"
            style={{ backgroundColor: "hsl(var(--terracota))" }}
          >
            <Plus size={16} /> Consumo
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Salidas", value: salidasCount, unit: "movimientos", color: "hsl(var(--navy))" },
          { label: "Total Mermas", value: mermasCount, unit: "movimientos", color: "#BA3026" },
          { label: "Valor Mermas", value: formatCurrency(mermasValue), unit: "", color: "#BA3026" },
        ].map(({ label, value, unit, color }) => (
          <div key={label} className="rounded-xl p-4 border" style={{ backgroundColor: "hsl(var(--surface))", borderColor: "hsl(var(--border))" }}>
            <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "hsl(var(--text-sub))" }}>{label}</p>
            <p className="text-2xl font-black tabular-nums" style={{ color }}>{value}</p>
            {unit && <p className="text-xs mt-0.5" style={{ color: "hsl(var(--text-muted))" }}>{unit}</p>}
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-lg w-fit" style={{ backgroundColor: "hsl(var(--surface-alt))" }}>
        {(["todos", "salida", "merma"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-all"
            style={{
              backgroundColor: tab === t ? "hsl(var(--surface))" : "transparent",
              color: tab === t ? "hsl(var(--text-main))" : "hsl(var(--text-sub))",
              boxShadow: tab === t ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
            }}
          >
            {t === "todos" ? "Todos" : t === "salida" ? "Consumos" : "Mermas"}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: "hsl(var(--border))", backgroundColor: "hsl(var(--surface))" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: "hsl(var(--surface-alt))", borderBottom: "1px solid hsl(var(--border))" }}>
              {["Tipo", "Producto", "Cantidad", "Motivo", "Pérdida", "Fecha", "Notas"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide" style={{ color: "hsl(var(--text-sub))" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((m, i) => {
              const prod = (m.producto as any) ?? productos.find((p) => p.id === m.product_id);
              const motivoColor = m.motivo_merma ? MERMA_COLORS[m.motivo_merma] ?? "#78909C" : null;
              return (
                <tr key={m.id} style={{ backgroundColor: i % 2 === 0 ? "hsl(var(--surface))" : "hsl(var(--surface-alt))", borderBottom: "1px solid hsl(var(--border))" }}>
                  <td className="px-4 py-3">
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: m.tipo === "merma" ? "#BA302622" : "#0B445522",
                        color: m.tipo === "merma" ? "#BA3026" : "#0B4455",
                      }}
                    >
                      {m.tipo === "salida" ? "Consumo" : "Merma"}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium" style={{ color: "hsl(var(--text-main))" }}>{prod?.nombre ?? "-"}</td>
                  <td className="px-4 py-3 tabular-nums" style={{ color: "hsl(var(--text-sub))" }}>{m.qty} {prod?.unidad ?? ""}</td>
                  <td className="px-4 py-3">
                    {m.motivo_merma && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: (motivoColor ?? "#78909C") + "22", color: motivoColor ?? "#78909C" }}>
                        {m.motivo_merma}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 tabular-nums" style={{ color: m.value_lost ? "#BA3026" : "hsl(var(--text-muted))" }}>
                    {m.value_lost ? formatCurrency(Number(m.value_lost)) : "-"}
                  </td>
                  <td className="px-4 py-3" style={{ color: "hsl(var(--text-sub))" }}>
                    {formatDate(m.fecha)} {formatTime(m.fecha)}
                  </td>
                  <td className="px-4 py-3 max-w-[180px] truncate" style={{ color: "hsl(var(--text-muted))" }}>
                    {m.notes ?? "-"}
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-sm" style={{ color: "hsl(var(--text-muted))" }}>
                  No hay movimientos registrados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Consumo */}
      {modal === "consumo" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
          <div className="w-full max-w-md rounded-xl shadow-2xl p-6" style={{ backgroundColor: "hsl(var(--surface))" }}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg" style={{ backgroundColor: "hsl(var(--navy))" }}>
                  <TrendingDown size={18} className="text-white" />
                </div>
                <h2 className="text-lg font-bold" style={{ color: "hsl(var(--text-main))" }}>Registrar consumo</h2>
              </div>
              <button onClick={() => setModal(null)} className="p-1 rounded hover:bg-black/5">
                <X size={18} style={{ color: "hsl(var(--text-muted))" }} />
              </button>
            </div>
            <form onSubmit={consumoForm.handleSubmit(onConsumo)} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "hsl(var(--text-sub))" }}>Producto</label>
                <select
                  {...consumoForm.register("product_id")}
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                  style={{ borderColor: "hsl(var(--border))", backgroundColor: "hsl(var(--bg))", color: "hsl(var(--text-main))" }}
                >
                  {productos.map((p) => (
                    <option key={p.id} value={p.id}>{p.nombre} (stock: {p.stock_actual} {p.unidad})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "hsl(var(--text-sub))" }}>
                  Cantidad {selectedConsumoProduct ? `(${selectedConsumoProduct.unidad})` : ""}
                </label>
                <input
                  {...consumoForm.register("qty", { valueAsNumber: true })}
                  type="number"
                  min={1}
                  max={selectedConsumoProduct?.stock_actual}
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none tabular-nums"
                  style={{ borderColor: consumoForm.formState.errors.qty ? "#BA3026" : "hsl(var(--border))", backgroundColor: "hsl(var(--bg))", color: "hsl(var(--text-main))" }}
                />
                {selectedConsumoProduct && (
                  <p className="text-xs mt-1" style={{ color: "hsl(var(--text-muted))" }}>
                    Disponible: {selectedConsumoProduct.stock_actual} {selectedConsumoProduct.unidad}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "hsl(var(--text-sub))" }}>Notas (opcional)</label>
                <input
                  {...consumoForm.register("notes")}
                  placeholder="Ej: Para el servicio del mediodía"
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                  style={{ borderColor: "hsl(var(--border))", backgroundColor: "hsl(var(--bg))", color: "hsl(var(--text-main))" }}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModal(null)} className="flex-1 py-2 rounded-lg text-sm font-semibold border" style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--text-sub))" }}>Cancelar</button>
                <button type="submit" disabled={isPending} className="flex-1 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-60" style={{ backgroundColor: "hsl(var(--navy))" }}>
                  {isPending ? "Guardando..." : "Registrar consumo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Merma */}
      {modal === "merma" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
          <div className="w-full max-w-md rounded-xl shadow-2xl p-6" style={{ backgroundColor: "hsl(var(--surface))" }}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg" style={{ backgroundColor: "#BA3026" }}>
                  <AlertTriangle size={18} className="text-white" />
                </div>
                <h2 className="text-lg font-bold" style={{ color: "hsl(var(--text-main))" }}>Registrar merma</h2>
              </div>
              <button onClick={() => setModal(null)} className="p-1 rounded hover:bg-black/5">
                <X size={18} style={{ color: "hsl(var(--text-muted))" }} />
              </button>
            </div>
            <form onSubmit={mermaForm.handleSubmit(onMerma)} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "hsl(var(--text-sub))" }}>Producto</label>
                <select
                  {...mermaForm.register("product_id")}
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                  style={{ borderColor: "hsl(var(--border))", backgroundColor: "hsl(var(--bg))", color: "hsl(var(--text-main))" }}
                >
                  {productos.map((p) => (
                    <option key={p.id} value={p.id}>{p.nombre} (stock: {p.stock_actual} {p.unidad})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "hsl(var(--text-sub))" }}>
                    Cantidad {selectedMermaProduct ? `(${selectedMermaProduct.unidad})` : ""}
                  </label>
                  <input
                    {...mermaForm.register("qty", { valueAsNumber: true })}
                    type="number"
                    min={1}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none tabular-nums"
                    style={{ borderColor: mermaForm.formState.errors.qty ? "#BA3026" : "hsl(var(--border))", backgroundColor: "hsl(var(--bg))", color: "hsl(var(--text-main))" }}
                  />
                  {selectedMermaProduct && (
                    <p className="text-xs mt-1" style={{ color: "hsl(var(--text-muted))" }}>
                      Disponible: {selectedMermaProduct.stock_actual}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "hsl(var(--text-sub))" }}>Pérdida estimada</label>
                  <div className="px-3 py-2 rounded-lg border text-sm font-semibold tabular-nums" style={{ borderColor: "hsl(var(--border))", backgroundColor: "hsl(var(--surface-alt))", color: "#BA3026" }}>
                    {formatCurrency((mermaForm.watch("qty") || 0) * (selectedMermaProduct?.last_price ?? 0))}
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "hsl(var(--text-sub))" }}>Motivo</label>
                <div className="flex flex-wrap gap-2">
                  {MERMA_TYPES.map((tipo) => {
                    const sel = mermaForm.watch("motivo_merma") === tipo;
                    const color = MERMA_COLORS[tipo];
                    return (
                      <button
                        key={tipo}
                        type="button"
                        onClick={() => mermaForm.setValue("motivo_merma", tipo as any)}
                        className="text-xs px-3 py-1.5 rounded-full border font-semibold transition-all"
                        style={{
                          backgroundColor: sel ? color : "transparent",
                          color: sel ? "white" : color,
                          borderColor: color,
                        }}
                      >
                        {tipo}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "hsl(var(--text-sub))" }}>Notas (opcional)</label>
                <input
                  {...mermaForm.register("notes")}
                  placeholder="Descripción de la merma"
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                  style={{ borderColor: "hsl(var(--border))", backgroundColor: "hsl(var(--bg))", color: "hsl(var(--text-main))" }}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModal(null)} className="flex-1 py-2 rounded-lg text-sm font-semibold border" style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--text-sub))" }}>Cancelar</button>
                <button type="submit" disabled={isPending} className="flex-1 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-60" style={{ backgroundColor: "#BA3026" }}>
                  {isPending ? "Guardando..." : "Registrar merma"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
