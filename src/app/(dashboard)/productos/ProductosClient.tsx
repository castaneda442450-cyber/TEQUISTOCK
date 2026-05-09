"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { toast } from "sonner";
import { Plus, Search, X } from "lucide-react";
import { deleteProducto } from "@/lib/actions/productos.actions";
import type { Producto, Categoria } from "@/types";
import { ProductosTable } from "@/components/productos/ProductosTable";
import { Pagination } from "@/components/productos/Pagination";
import { EmptyState } from "@/components/productos/EmptyState";
import { ProductoModal } from "@/components/productos/ProductoModal";
import { CategoriaModal } from "@/components/productos/CategoriaModal";
import { DeleteConfirmModal } from "@/components/productos/DeleteConfirmModal";

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
  totalPages,
  currentPage,
  categorias: initialCategorias,
  initialSearch,
  initialCategoria,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [searchInput, setSearchInput] = useState(initialSearch);
  const [categorias, setCategorias] = useState<Categoria[]>(initialCategorias);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Producto | null>(null);
  const [showCatModal, setShowCatModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Producto | null>(null);
  const [, startNavTransition] = useTransition();

  // Sync categorias if server re-fetches with new list
  useEffect(() => {
    setCategorias(initialCategorias);
  }, [initialCategorias]);

  // Sync search input when URL changes externally
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

  function handlePageChange(page: number) {
    updateUrlParams({ page: page > 1 ? String(page) : null });
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function openCreate() {
    setEditTarget(null);
    setShowModal(true);
  }

  function openEdit(p: Producto) {
    setEditTarget(p);
    setShowModal(true);
  }

  function handleDelete(p: Producto) {
    setDeleteTarget(p);
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    deleteProducto(deleteTarget.id).then((res) => {
      if (res.error) { toast.error(res.error); return; }
      toast.success("Producto eliminado");
      setDeleteTarget(null);
      router.refresh();
    });
  }

  return (
    <div style={{ padding: 28 }}>
      {/* Header: filters row */}
      <div style={{ display: "flex", alignItems: "center", gap: 48, marginBottom: 22 }}>

        {/* Search */}
        <div style={{ position: "relative", width: 220, flexShrink: 0 }}>
          <Search
            size={15}
            style={{
              position: "absolute", left: 12, top: "50%",
              transform: "translateY(-50%)",
              color: "hsl(var(--text-muted))", pointerEvents: "none",
            }}
          />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Buscar por nombre..."
            style={{
              width: "100%", padding: "9px 32px 9px 36px", fontSize: 13,
              borderRadius: 8, border: "1px solid hsl(var(--border))",
              backgroundColor: "hsl(var(--surface))", color: "hsl(var(--text-main))",
              outline: "none", fontFamily: "inherit",
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
            }}
          />
          {searchInput && (
            <button
              type="button"
              onClick={clearSearch}
              style={{
                position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
                background: "transparent", border: "none", cursor: "pointer", padding: 4,
                color: "hsl(var(--text-muted))", display: "flex", alignItems: "center",
              }}
              aria-label="Limpiar búsqueda"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Categoría select */}
        <div style={{ position: "relative", zIndex: 10, flexShrink: 0 }}>
          <select
            value={initialCategoria}
            onChange={(e) => handleCategoriaChange(e.target.value)}
            style={{
              padding: "9px 32px 9px 12px", fontSize: 13,
              borderRadius: 8, border: "1px solid hsl(var(--border))",
              backgroundColor: "hsl(var(--surface))", color: "hsl(var(--text-main))",
              outline: "none", appearance: "none", cursor: "pointer", fontFamily: "inherit",
              backgroundImage: "url(\"data:image/svg+xml;charset=US-ASCII,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%237A7068' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")",
              backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center",
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
            }}
          >
            <option value="">Todas las categorías</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
        </div>

        {/* Acciones */}
        <div style={{ marginLeft: "auto", display: "flex", gap: 10, flexShrink: 0 }}>
          <button
            onClick={() => setShowCatModal(true)}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "9px 16px", fontSize: 13, fontWeight: 600,
              color: "hsl(var(--text-sub))",
              backgroundColor: "hsl(var(--surface))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 8, cursor: "pointer",
              fontFamily: "inherit", transition: "opacity 0.15s ease",
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = "0.8")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = "1")}
          >
            <Plus size={15} />
            Nueva Categoría
          </button>
          <button
            onClick={openCreate}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "9px 16px", fontSize: 13, fontWeight: 600,
              color: "white", backgroundColor: "hsl(var(--green))",
              border: "none", borderRadius: 8, cursor: "pointer",
              fontFamily: "inherit", transition: "opacity 0.15s ease",
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = "0.9")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = "1")}
          >
            <Plus size={15} />
            Nuevo Producto
          </button>
        </div>
      </div>

      {/* Card */}
      <div
        style={{
          backgroundColor: "hsl(var(--surface))",
          borderRadius: 10,
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          overflow: "hidden",
          border: "1px solid hsl(var(--border))",
        }}
      >
        {/* Card header */}
        <div
          style={{
            padding: "14px 20px",
            borderBottom: "1px solid hsl(var(--border))",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}
        >
          <span style={{ fontSize: 14, fontWeight: 700, color: "hsl(var(--text-main))" }}>
            Catálogo de Productos
          </span>
          <span style={{ fontSize: 12, color: "hsl(var(--text-muted))" }}>
            {count} producto(s)
          </span>
        </div>

        {/* Table or empty */}
        {productos.length === 0 ? (
          <EmptyState
            hasFilters={Boolean(initialSearch || initialCategoria)}
            onCreate={openCreate}
          />
        ) : (
          <ProductosTable
            productos={productos}
            categorias={categorias}
            onEdit={openEdit}
            onDelete={handleDelete}
          />
        )}

        {/* Pagination */}
        {productos.length > 0 && (
          <div style={{ padding: "0 16px", borderTop: "1px solid hsl(var(--border))" }}>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>

      {/* Modal producto */}
      <ProductoModal
        open={showModal}
        editTarget={editTarget}
        categorias={categorias}
        onClose={() => setShowModal(false)}
        onSuccess={() => {
          setShowModal(false);
          router.refresh();
        }}
      />

      {/* Modal categoría */}
      <CategoriaModal
        open={showCatModal}
        categorias={categorias}
        onClose={() => setShowCatModal(false)}
        onCreated={(newCat) => {
          setCategorias((prev) => [...prev, newCat].sort((a, b) => a.nombre.localeCompare(b.nombre)));
        }}
        onDeleted={(id, refresh) => {
          setCategorias((prev) => prev.filter((c) => c.id !== id));
          if (refresh) router.refresh();
        }}
      />

      {/* Modal eliminar */}
      <DeleteConfirmModal
        producto={deleteTarget}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
