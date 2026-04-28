"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, X, Search } from "lucide-react";
import { proveedorSchema, type ProveedorInput } from "@/lib/schemas/proveedor.schema";
import { createProveedor, updateProveedor, toggleActivo, deleteProveedor } from "@/lib/actions/proveedores.actions";
import { formatCurrency } from "@/lib/format";
import type { Proveedor, Producto } from "@/types";

interface Props {
  proveedores: Proveedor[];
  productos: Producto[];
}

export default function ProveedoresClient({ proveedores: initial, productos }: Props) {
  const [proveedores, setProveedores] = useState(initial);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Proveedor | null>(null);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  const filtered = proveedores.filter((p) =>
    p.company.toLowerCase().includes(search.toLowerCase()) ||
    p.contact.toLowerCase().includes(search.toLowerCase()),
  );

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProveedorInput>({
    resolver: zodResolver(proveedorSchema),
  });

  function openCreate() {
    setEditTarget(null);
    setSelectedProductIds([]);
    reset({ company: "", contact: "", email: "", phone: "", address: "" });
    setShowModal(true);
  }

  function openEdit(p: Proveedor) {
    setEditTarget(p);
    setSelectedProductIds([]);
    reset({ company: p.company, contact: p.contact, email: p.email ?? "", phone: p.phone ?? "", address: p.address ?? "" });
    setShowModal(true);
  }

  function toggleProductSelect(id: string) {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function onSubmit(data: ProveedorInput) {
    startTransition(async () => {
      if (editTarget) {
        const res = await updateProveedor(editTarget.id, data, selectedProductIds);
        if (res.error) { toast.error(res.error); return; }
        setProveedores((prev) => prev.map((p) => (p.id === editTarget.id ? { ...p, ...data } : p)));
        toast.success("Proveedor actualizado");
      } else {
        const res = await createProveedor(data, selectedProductIds);
        if (res.error) { toast.error(res.error); return; }
        if (res.data) setProveedores((prev) => [...prev, res.data!]);
        toast.success("Proveedor creado");
      }
      setShowModal(false);
    });
  }

  function handleToggle(p: Proveedor) {
    startTransition(async () => {
      const res = await toggleActivo(p.id);
      if (res.error) { toast.error(res.error); return; }
      setProveedores((prev) => prev.map((x) => (x.id === p.id ? { ...x, activo: !x.activo } : x)));
    });
  }

  function handleDelete(p: Proveedor) {
    if (!confirm(`¿Eliminar "${p.company}"?`)) return;
    startTransition(async () => {
      const res = await deleteProveedor(p.id);
      if (res.error) { toast.error(res.error); return; }
      setProveedores((prev) => prev.filter((x) => x.id !== p.id));
      toast.success("Proveedor eliminado");
    });
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "hsl(var(--text-main))" }}>Proveedores</h1>
          <p className="text-sm mt-0.5" style={{ color: "hsl(var(--text-sub))" }}>{proveedores.length} proveedores registrados</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white"
          style={{ backgroundColor: "hsl(var(--terracota))" }}
        >
          <Plus size={16} /> Nuevo proveedor
        </button>
      </div>

      <div className="relative max-w-xs">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "hsl(var(--text-muted))" }} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar proveedor..."
          className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border outline-none"
          style={{ backgroundColor: "hsl(var(--surface))", borderColor: "hsl(var(--border))", color: "hsl(var(--text-main))" }}
        />
      </div>

      <div className="rounded-xl border overflow-hidden" style={{ borderColor: "hsl(var(--border))", backgroundColor: "hsl(var(--surface))" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: "hsl(var(--surface-alt))", borderBottom: "1px solid hsl(var(--border))" }}>
              {["Empresa", "Contacto", "Email", "Teléfono", "Total compras", "Estado", "Acciones"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide" style={{ color: "hsl(var(--text-sub))" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((p, i) => (
              <tr key={p.id} style={{ backgroundColor: i % 2 === 0 ? "hsl(var(--surface))" : "hsl(var(--surface-alt))", borderBottom: "1px solid hsl(var(--border))" }}>
                <td className="px-4 py-3 font-semibold" style={{ color: "hsl(var(--text-main))" }}>{p.company}</td>
                <td className="px-4 py-3" style={{ color: "hsl(var(--text-sub))" }}>{p.contact}</td>
                <td className="px-4 py-3" style={{ color: "hsl(var(--text-sub))" }}>{p.email ?? "-"}</td>
                <td className="px-4 py-3" style={{ color: "hsl(var(--text-sub))" }}>{p.phone ?? "-"}</td>
                <td className="px-4 py-3 tabular-nums font-medium" style={{ color: "hsl(var(--text-main))" }}>{formatCurrency(p.total_spent)}</td>
                <td className="px-4 py-3">
                  <button onClick={() => handleToggle(p)} className="flex items-center gap-1.5">
                    {p.activo
                      ? <ToggleRight size={20} style={{ color: "#106653" }} />
                      : <ToggleLeft size={20} style={{ color: "hsl(var(--text-muted))" }} />}
                    <span className="text-xs font-medium" style={{ color: p.activo ? "#106653" : "hsl(var(--text-muted))" }}>
                      {p.activo ? "Activo" : "Inactivo"}
                    </span>
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEdit(p)} className="p-1.5 rounded-md hover:bg-black/5">
                      <Pencil size={14} style={{ color: "hsl(var(--text-sub))" }} />
                    </button>
                    <button onClick={() => handleDelete(p)} className="p-1.5 rounded-md hover:bg-red-50">
                      <Trash2 size={14} style={{ color: "#BA3026" }} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-sm" style={{ color: "hsl(var(--text-muted))" }}>
                  No hay proveedores registrados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
          <div className="w-full max-w-lg rounded-xl shadow-2xl p-6" style={{ backgroundColor: "hsl(var(--surface))" }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold" style={{ color: "hsl(var(--text-main))" }}>
                {editTarget ? "Editar proveedor" : "Nuevo proveedor"}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1 rounded hover:bg-black/5">
                <X size={18} style={{ color: "hsl(var(--text-muted))" }} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "hsl(var(--text-sub))" }}>Empresa</label>
                  <input {...register("company")} placeholder="Nombre empresa" className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: errors.company ? "#BA3026" : "hsl(var(--border))", backgroundColor: "hsl(var(--bg))", color: "hsl(var(--text-main))" }} />
                  {errors.company && <p className="text-xs mt-1" style={{ color: "#BA3026" }}>{errors.company.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "hsl(var(--text-sub))" }}>Contacto</label>
                  <input {...register("contact")} placeholder="Nombre contacto" className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: errors.contact ? "#BA3026" : "hsl(var(--border))", backgroundColor: "hsl(var(--bg))", color: "hsl(var(--text-main))" }} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "hsl(var(--text-sub))" }}>Email</label>
                  <input {...register("email")} type="email" placeholder="correo@empresa.mx" className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: "hsl(var(--border))", backgroundColor: "hsl(var(--bg))", color: "hsl(var(--text-main))" }} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "hsl(var(--text-sub))" }}>Teléfono</label>
                  <input {...register("phone")} placeholder="+52 55 0000 0000" className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: "hsl(var(--border))", backgroundColor: "hsl(var(--bg))", color: "hsl(var(--text-main))" }} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "hsl(var(--text-sub))" }}>Dirección</label>
                <input {...register("address")} placeholder="Calle, colonia, ciudad" className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: "hsl(var(--border))", backgroundColor: "hsl(var(--bg))", color: "hsl(var(--text-main))" }} />
              </div>

              {/* Product multiselect */}
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "hsl(var(--text-sub))" }}>Productos que suministra (opcional)</label>
                <div className="max-h-32 overflow-y-auto rounded-lg border p-2 flex flex-wrap gap-1.5" style={{ borderColor: "hsl(var(--border))", backgroundColor: "hsl(var(--bg))" }}>
                  {productos.map((p) => {
                    const sel = selectedProductIds.includes(p.id);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => toggleProductSelect(p.id)}
                        className="text-xs px-2.5 py-1 rounded-full border font-medium transition-all"
                        style={{
                          backgroundColor: sel ? "hsl(var(--terracota))" : "transparent",
                          color: sel ? "white" : "hsl(var(--text-sub))",
                          borderColor: sel ? "hsl(var(--terracota))" : "hsl(var(--border))",
                        }}
                      >
                        {p.nombre}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2 rounded-lg text-sm font-semibold border" style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--text-sub))" }}>
                  Cancelar
                </button>
                <button type="submit" disabled={isPending} className="flex-1 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-60" style={{ backgroundColor: "hsl(var(--terracota))" }}>
                  {isPending ? "Guardando..." : editTarget ? "Actualizar" : "Crear proveedor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
