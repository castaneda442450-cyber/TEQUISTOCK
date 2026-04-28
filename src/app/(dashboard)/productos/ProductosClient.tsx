"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
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
  count: number;
  totalPages: number;
  currentPage: number;
  categorias: Categoria[];
  initialSearch: string;
  initialCategoria: string;
}

export default function ProductosClient({
  productos,
  count,
  categorias,
  initialSearch,
  initialCategoria,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [searchInput, setSearchInput] = useState(initialSearch);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Producto | null>(null);
  const [isPending, startTransition] = useTransition();
  const [, startNavTransition] = useTransition();

  // Sync local search input if URL changes externally
  useEffect(() => {
    setSearchInput(initialSearch);
  }, [initialSearch]);

  // Debounced URL update for search
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (searchInput === initialSearch) return;

    debounceRef.current = setTimeout(() => {
      updateUrlParams({ search: searchInput || null, page: null });
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  function updateUrlParams(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === "") params.delete(key);
      else params.set(key, value);
    }
    const queryString = params.toString();
    startNavTransition(() => {
      router.push(`${pathname}${queryString ? `?${queryString}` : ""}`);
    });
  }

  function handleCategoriaChange(value: string) {
    updateUrlParams({ categoria: value || null, page: null });
  }

  function clearSearch() {
    setSearchInput("");
    updateUrlParams({ search: null, page: null });
  }

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
        toast.success("Producto actualizado");
      } else {
        const res = await createProducto(data);
        if (res.error) { toast.error(res.error); return; }
        toast.success("Producto creado");
      }
      setShowModal(false);
      router.refresh();
    });
  }

  function handleDelete(p: Producto) {
    if (!confirm(`¿Eliminar "${p.nombre}"? Esta acción no se puede deshacer.`)) return;
    startTransition(async () => {
      const res = await deleteProducto(p.id);
      if (res.error) { toast.error(res.error); return; }
      toast.success("Producto eliminado");
      router.refresh();
    });
  }

  const catColor = (catId: string) => {
    const cat = categorias.find((c) => c.id === catId);
    return cat?.color ?? "#78909C";
  };
  const catNombre = (p: Producto) =>
    (p.categoria as Categoria | undefined)?.nombre ??
    categorias.find((c) => c.id === p.categoria_id)?.nombre ??
    "-";

  return (
    <div style={{ padding: 28 }}>
      {/* Header: search + filter + nuevo */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          marginBottom: 22,
          flexWrap: "wrap",
        }}
      >
        {/* Search input */}
        <div style={{ position: "relative", width: 240 }}>
          <Search
            size={15}
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              color: "hsl(var(--text-muted))",
              pointerEvents: "none",
            }}
          />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Buscar por nombre..."
            style={{
              width: "100%",
              padding: "9px 32px 9px 36px",
              fontSize: 13,
              borderRadius: 8,
              border: "1px solid hsl(var(--border))",
              backgroundColor: "hsl(var(--surface))",
              color: "hsl(var(--text-main))",
              outline: "none",
            }}
          />
          {searchInput && (
            <button
              type="button"
              onClick={clearSearch}
              style={{
                position: "absolute",
                right: 8,
                top: "50%",
                transform: "translateY(-50%)",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: 4,
                color: "hsl(var(--text-muted))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              aria-label="Limpiar búsqueda"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Categoria select */}
        <select
          value={initialCategoria}
          onChange={(e) => handleCategoriaChange(e.target.value)}
          style={{
            width: 180,
            padding: "9px 32px 9px 12px",
            fontSize: 13,
            borderRadius: 8,
            border: "1px solid hsl(var(--border))",
            backgroundColor: "hsl(var(--surface))",
            color: "hsl(var(--text-main))",
            outline: "none",
            appearance: "none",
            backgroundImage:
              "url(\"data:image/svg+xml;charset=US-ASCII,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%237A7068' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 12px center",
            cursor: "pointer",
          }}
        >
          <option value="">Todas las categorías</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>

        {/* Nuevo producto button */}
        <div style={{ marginLeft: "auto" }}>
          <button
            onClick={openCreate}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "9px 16px",
              fontSize: 13,
              fontWeight: 600,
              color: "white",
              backgroundColor: "hsl(var(--green))",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              transition: "opacity 0.15s ease",
              fontFamily: "inherit",
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = "0.9")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = "1")}
          >
            <Plus size={15} />
            Nuevo Producto
          </button>
        </div>
      </div>

      {/* Card container */}
      <div
        style={{
          backgroundColor: "hsl(var(--surface))",
          borderRadius: 10,
          boxShadow: "0 2px 8px hsl(var(--shadow))",
          overflow: "hidden",
          border: "1px solid hsl(var(--border))",
        }}
      >
        {/* Card header */}
        <div
          style={{
            padding: "14px 20px",
            borderBottom: "1px solid hsl(var(--border))",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontSize: 14, fontWeight: 700, color: "hsl(var(--text-main))" }}>
            Catálogo de Productos
          </span>
          <span style={{ fontSize: 12, color: "hsl(var(--text-muted))" }}>
            {count} producto(s)
          </span>
        </div>

        {/* Table */}
        <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
          <thead>
            <tr
              style={{
                backgroundColor: "hsl(var(--surface-alt))",
                borderBottom: "1px solid hsl(var(--border))",
              }}
            >
              {["Nombre", "Categoría", "Stock", "Mínimo", "Precio", "Acciones"].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: "12px 16px",
                    textAlign: "left",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    fontSize: 11,
                    letterSpacing: "0.04em",
                    color: "hsl(var(--text-sub))",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {productos.map((p, i) => {
              const estado = getStockEstado(p.stock_actual, p.stock_minimo);
              const color = catColor(p.categoria_id);
              return (
                <tr
                  key={p.id}
                  style={{
                    backgroundColor:
                      i % 2 === 0 ? "hsl(var(--surface))" : "hsl(var(--surface-alt))",
                    borderBottom: "1px solid hsl(var(--border))",
                  }}
                >
                  <td
                    style={{
                      padding: "12px 16px",
                      fontWeight: 500,
                      color: "hsl(var(--text-main))",
                    }}
                  >
                    {p.nombre}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        padding: "2px 10px",
                        borderRadius: 99,
                        backgroundColor: color + "22",
                        color,
                      }}
                    >
                      {catNombre(p)}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span
                      style={{
                        fontWeight: 600,
                        fontVariantNumeric: "tabular-nums",
                        fontSize: 12,
                        padding: "2px 8px",
                        borderRadius: 99,
                        backgroundColor:
                          estado === "critico"
                            ? "#BA302622"
                            : estado === "bajo"
                              ? "#C2972E22"
                              : "#10665322",
                        color:
                          estado === "critico"
                            ? "#BA3026"
                            : estado === "bajo"
                              ? "#C2972E"
                              : "#106653",
                      }}
                    >
                      {p.stock_actual} {p.unidad}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: "12px 16px",
                      fontVariantNumeric: "tabular-nums",
                      color: "hsl(var(--text-sub))",
                    }}
                  >
                    {p.stock_minimo} {p.unidad}
                  </td>
                  <td
                    style={{
                      padding: "12px 16px",
                      fontVariantNumeric: "tabular-nums",
                      fontWeight: 500,
                      color: "hsl(var(--text-main))",
                    }}
                  >
                    {formatCurrency(p.last_price)}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <button
                        onClick={() => openEdit(p)}
                        style={{
                          padding: 6,
                          borderRadius: 6,
                          border: "none",
                          background: "transparent",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                        title="Editar"
                      >
                        <Pencil size={14} style={{ color: "hsl(var(--text-sub))" }} />
                      </button>
                      <button
                        onClick={() => handleDelete(p)}
                        style={{
                          padding: 6,
                          borderRadius: 6,
                          border: "none",
                          background: "transparent",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                        title="Eliminar"
                      >
                        <Trash2 size={14} style={{ color: "#BA3026" }} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {productos.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  style={{
                    padding: "48px 16px",
                    textAlign: "center",
                    fontSize: 13,
                    color: "hsl(var(--text-muted))",
                  }}
                >
                  {initialSearch || initialCategoria
                    ? "No se encontraron productos con esos filtros"
                    : "No hay productos registrados"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            backgroundColor: "rgba(0,0,0,0.4)",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 480,
              borderRadius: 12,
              boxShadow: "0 32px 80px rgba(0,0,0,0.28)",
              padding: 24,
              backgroundColor: "hsl(var(--surface))",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 20,
              }}
            >
              <h2 style={{ fontSize: 17, fontWeight: 700, color: "hsl(var(--text-main))", margin: 0 }}>
                {editTarget ? "Editar producto" : "Nuevo producto"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  padding: 4,
                  borderRadius: 6,
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                }}
              >
                <X size={18} style={{ color: "hsl(var(--text-muted))" }} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={labelStyle}>Nombre</label>
                <input
                  {...register("nombre")}
                  placeholder="Ej: Carne de Res"
                  style={inputStyle(!!errors.nombre)}
                />
                {errors.nombre && <p style={errorStyle}>{errors.nombre.message}</p>}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={labelStyle}>Categoría</label>
                  <select {...register("categoria_id")} style={inputStyle(!!errors.categoria_id)}>
                    {categorias.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Unidad</label>
                  <select {...register("unidad")} style={inputStyle(false)}>
                    {UNIDADES.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={labelStyle}>Stock mínimo</label>
                  <input
                    {...register("stock_minimo", { valueAsNumber: true })}
                    type="number"
                    min={0}
                    style={inputStyle(!!errors.stock_minimo)}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Precio (MXN)</label>
                  <input
                    {...register("last_price", { valueAsNumber: true })}
                    type="number"
                    step="0.01"
                    min={0}
                    style={inputStyle(!!errors.last_price)}
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: 12, paddingTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    flex: 1,
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
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  style={{
                    flex: 1,
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
                  {isPending ? "Guardando..." : editTarget ? "Actualizar" : "Crear"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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
    border: `1px solid ${hasError ? "#BA3026" : "hsl(var(--border))"}`,
    backgroundColor: "hsl(var(--bg))",
    color: "hsl(var(--text-main))",
    outline: "none",
    fontFamily: "inherit",
  };
}

const errorStyle: React.CSSProperties = {
  fontSize: 11,
  marginTop: 4,
  color: "#BA3026",
};
