"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search, X } from "lucide-react";
import { productoSchema, type ProductoInput } from "@/lib/schemas/producto.schema";
import { createProducto, updateProducto, deleteProducto } from "@/lib/actions/productos.actions";
import { formatCurrency, getStockEstado } from "@/lib/format";
import { UNIDADES } from "@/lib/constants";
import type { Producto, Categoria } from "@/types";

interface Props {
  productos: Producto[];
  categorias: Categoria[];
}

export default function ProductosClient({ productos: initial, categorias }: Props) {
  const [productos, setProductos] = useState(initial);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Producto | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = productos.filter((p) =>
    p.nombre.toLowerCase().includes(search.toLowerCase()) ||
    (p.categoria as any)?.nombre?.toLowerCase().includes(search.toLowerCase()),
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProductoInput>({
    resolver: zodResolver(productoSchema),
    defaultValues: { nombre: "", categoria_id: "", unidad: "kg", stock_minimo: 5, last_price: 0 },
  });

  function openCreate() {
    setEditTarget(null);
    reset({ nombre: "", categoria_id: categorias[0]?.id ?? "", unidad: "kg", stock_minimo: 5, last_price: 0 });
    setShowModal(true);
  }

  function openEdit(p: Producto) {
    setEditTarget(p);
    reset({
      nombre: p.nombre,
      categoria_id: p.categoria_id,
      unidad: p.unidad,
      stock_minimo: p.stock_minimo,
      last_price: p.last_price,
    });
    setShowModal(true);
  }

  function onSubmit(data: ProductoInput) {
    startTransition(async () => {
      if (editTarget) {
        const res = await updateProducto(editTarget.id, data);
        if (res.error) { toast.error(res.error); return; }
        setProductos((prev) => prev.map((p) => (p.id === editTarget.id ? { ...p, ...data } : p)));
        toast.success("Producto actualizado");
      } else {
        const res = await createProducto(data);
        if (res.error) { toast.error(res.error); return; }
        if (res.data) setProductos((prev) => [...prev, res.data!]);
        toast.success("Producto creado");
      }
      setShowModal(false);
    });
  }

  function handleDelete(p: Producto) {
    if (!confirm(`¿Eliminar "${p.nombre}"? Esta acción no se puede deshacer.`)) return;
    startTransition(async () => {
      const res = await deleteProducto(p.id);
      if (res.error) { toast.error(res.error); return; }
      setProductos((prev) => prev.filter((x) => x.id !== p.id));
      toast.success("Producto eliminado");
    });
  }

  const catColor = (catId: string) => {
    const cat = categorias.find((c) => c.id === catId);
    return cat?.color ?? "#78909C";
  };
  const catNombre = (p: Producto) => (p.categoria as any)?.nombre ?? categorias.find((c) => c.id === p.categoria_id)?.nombre ?? "-";

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "hsl(var(--text-main))" }}>Productos</h1>
          <p className="text-sm mt-0.5" style={{ color: "hsl(var(--text-sub))" }}>{productos.length} productos registrados</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90"
          style={{ backgroundColor: "hsl(var(--terracota))" }}
        >
          <Plus size={16} />
          Nuevo producto
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-xs">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "hsl(var(--text-muted))" }} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar producto..."
          className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border outline-none focus:ring-2"
          style={{
            backgroundColor: "hsl(var(--surface))",
            borderColor: "hsl(var(--border))",
            color: "hsl(var(--text-main))",
          }}
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: "hsl(var(--border))", backgroundColor: "hsl(var(--surface))" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: "hsl(var(--surface-alt))", borderBottom: "1px solid hsl(var(--border))" }}>
              {["Nombre", "Categoría", "Stock", "Mínimo", "Precio", "Acciones"].map((h) => (
                <th key={h} className="px-4 py-3 text-left font-semibold uppercase text-[11px] tracking-wide" style={{ color: "hsl(var(--text-sub))" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((p, i) => {
              const estado = getStockEstado(p.stock_actual, p.stock_minimo);
              const color = catColor(p.categoria_id);
              return (
                <tr
                  key={p.id}
                  style={{
                    backgroundColor: i % 2 === 0 ? "hsl(var(--surface))" : "hsl(var(--surface-alt))",
                    borderBottom: "1px solid hsl(var(--border))",
                  }}
                >
                  <td className="px-4 py-3 font-medium" style={{ color: "hsl(var(--text-main))" }}>{p.nombre}</td>
                  <td className="px-4 py-3">
                    <span
                      className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
                      style={{ backgroundColor: color + "22", color }}
                    >
                      {catNombre(p)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="font-semibold tabular-nums text-xs px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: estado === "critico" ? "#BA302622" : estado === "bajo" ? "#C2972E22" : "#10665322",
                        color: estado === "critico" ? "#BA3026" : estado === "bajo" ? "#C2972E" : "#106653",
                      }}
                    >
                      {p.stock_actual} {p.unidad}
                    </span>
                  </td>
                  <td className="px-4 py-3 tabular-nums" style={{ color: "hsl(var(--text-sub))" }}>{p.stock_minimo} {p.unidad}</td>
                  <td className="px-4 py-3 tabular-nums font-medium" style={{ color: "hsl(var(--text-main))" }}>{formatCurrency(p.last_price)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEdit(p)}
                        className="p-1.5 rounded-md hover:bg-black/5 transition-colors"
                        title="Editar"
                      >
                        <Pencil size={14} style={{ color: "hsl(var(--text-sub))" }} />
                      </button>
                      <button
                        onClick={() => handleDelete(p)}
                        className="p-1.5 rounded-md hover:bg-red-50 transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 size={14} style={{ color: "#BA3026" }} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-sm" style={{ color: "hsl(var(--text-muted))" }}>
                  {search ? "Sin resultados para tu búsqueda" : "No hay productos registrados"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
          <div className="w-full max-w-md rounded-xl shadow-2xl p-6" style={{ backgroundColor: "hsl(var(--surface))" }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold" style={{ color: "hsl(var(--text-main))" }}>
                {editTarget ? "Editar producto" : "Nuevo producto"}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1 rounded hover:bg-black/5">
                <X size={18} style={{ color: "hsl(var(--text-muted))" }} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "hsl(var(--text-sub))" }}>Nombre</label>
                <input
                  {...register("nombre")}
                  placeholder="Ej: Carne de Res"
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2"
                  style={{ borderColor: errors.nombre ? "#BA3026" : "hsl(var(--border))", backgroundColor: "hsl(var(--bg))", color: "hsl(var(--text-main))" }}
                />
                {errors.nombre && <p className="text-xs mt-1" style={{ color: "#BA3026" }}>{errors.nombre.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "hsl(var(--text-sub))" }}>Categoría</label>
                  <select
                    {...register("categoria_id")}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                    style={{ borderColor: "hsl(var(--border))", backgroundColor: "hsl(var(--bg))", color: "hsl(var(--text-main))" }}
                  >
                    {categorias.map((c) => (
                      <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "hsl(var(--text-sub))" }}>Unidad</label>
                  <select
                    {...register("unidad")}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                    style={{ borderColor: "hsl(var(--border))", backgroundColor: "hsl(var(--bg))", color: "hsl(var(--text-main))" }}
                  >
                    {UNIDADES.map((u) => <option key={u} value={u}>{u}</option>)}
                    <option value="litro">litro</option>
                    <option value="pieza">pieza</option>
                    <option value="manojo">manojo</option>
                    <option value="gramo">gramo</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "hsl(var(--text-sub))" }}>Stock mínimo</label>
                  <input
                    {...register("stock_minimo", { valueAsNumber: true })}
                    type="number"
                    min={0}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none tabular-nums"
                    style={{ borderColor: errors.stock_minimo ? "#BA3026" : "hsl(var(--border))", backgroundColor: "hsl(var(--bg))", color: "hsl(var(--text-main))" }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "hsl(var(--text-sub))" }}>Precio unitario (MXN)</label>
                  <input
                    {...register("last_price", { valueAsNumber: true })}
                    type="number"
                    step="0.01"
                    min={0}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none tabular-nums"
                    style={{ borderColor: errors.last_price ? "#BA3026" : "hsl(var(--border))", backgroundColor: "hsl(var(--bg))", color: "hsl(var(--text-main))" }}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors hover:bg-black/5"
                  style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--text-sub))" }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                  style={{ backgroundColor: "hsl(var(--terracota))" }}
                >
                  {isPending ? "Guardando..." : editTarget ? "Actualizar" : "Crear producto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
