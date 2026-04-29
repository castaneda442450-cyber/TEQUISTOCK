"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { toast } from "sonner";
import { Plus, Search, X, Users, Mail, Phone, Pencil, Trash2 } from "lucide-react";
import { deleteProveedor } from "@/lib/actions/proveedores.actions";
import { formatCurrency } from "@/lib/format";
import type { Proveedor, Producto } from "@/types";
import { ProveedorModal } from "@/components/proveedores/ProveedorModal";
import { ProveedorDetailModal } from "@/components/proveedores/ProveedorDetailModal";
import { DeleteConfirmModal } from "@/components/proveedores/DeleteConfirmModal";

interface Props {
  proveedores: Proveedor[];
  productos: Producto[];
  initialSearch: string;
}

export default function ProveedoresClient({
  proveedores: initialProveedores,
  productos,
  initialSearch,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [proveedores, setProveedores] = useState<Proveedor[]>(initialProveedores);
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [showModal, setShowModal] = useState<null | "create" | "edit" | "detail" | "delete">(null);
  const [selectedProveedor, setSelectedProveedor] = useState<Proveedor | null>(null);
  const [, startNavTransition] = useTransition();

  useEffect(() => {
    setProveedores(initialProveedores);
  }, [initialProveedores]);

  useEffect(() => {
    setSearchInput(initialSearch);
  }, [initialSearch]);

  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (searchInput === initialSearch) return;

    debounceRef.current = setTimeout(() => {
      updateUrlParams({ search: searchInput || null });
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
    const qs = params.toString();
    startNavTransition(() => {
      router.push(`${pathname}${qs ? `?${qs}` : ""}`);
    });
  }

  function clearSearch() {
    setSearchInput("");
    updateUrlParams({ search: null });
  }

  function openCreate() {
    setSelectedProveedor(null);
    setShowModal("create");
  }

  function openEdit(p: Proveedor) {
    setSelectedProveedor(p);
    setShowModal("edit");
  }

  function openDetail(p: Proveedor) {
    setSelectedProveedor(p);
    setShowModal("detail");
  }

  function openDelete(p: Proveedor) {
    setSelectedProveedor(p);
    setShowModal("delete");
  }

  function handleModalSuccess(saved: Proveedor) {
    if (showModal === "edit") {
      setProveedores((prev) => prev.map((x) => (x.id === saved.id ? saved : x)));
    } else {
      setProveedores((prev) => [...prev, saved]);
    }
  }

  function confirmDelete() {
    if (!selectedProveedor) return;
    deleteProveedor(selectedProveedor.id).then((res) => {
      if (res.error) { toast.error(res.error); return; }
      toast.success("Proveedor eliminado");
      setProveedores((prev) => prev.filter((x) => x.id !== selectedProveedor.id));
      setShowModal(null);
      setSelectedProveedor(null);
    });
  }

  return (
    <div style={{ padding: 28 }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          marginBottom: 22,
        }}
      >
        {/* Search */}
        <div style={{ position: "relative", width: 240, flexShrink: 0 }}>
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
            placeholder="Buscar proveedor..."
            style={{
              width: "100%",
              padding: "9px 32px 9px 36px",
              fontSize: 13,
              borderRadius: 8,
              border: "1px solid hsl(var(--border))",
              backgroundColor: "hsl(var(--surface))",
              color: "hsl(var(--text-main))",
              outline: "none",
              fontFamily: "inherit",
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
              boxSizing: "border-box",
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
              }}
              aria-label="Limpiar búsqueda"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Nuevo Proveedor */}
        <button
          onClick={openCreate}
          style={{
            marginLeft: "auto",
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
            fontFamily: "inherit",
            transition: "opacity 0.15s ease",
            flexShrink: 0,
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = "0.9")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = "1")}
        >
          <Plus size={15} />
          Nuevo Proveedor
        </button>
      </div>

      {/* Grid or Empty State */}
      {proveedores.length === 0 ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "60px 20px",
            gap: 12,
          }}
        >
          <Users size={40} style={{ color: "hsl(var(--border-strong))" }} />
          <p style={{ fontSize: 14, color: "hsl(var(--text-muted))", margin: 0 }}>
            No se encontraron proveedores
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 16,
          }}
        >
          {proveedores.map((proveedor) => (
            <SupplierCard
              key={proveedor.id}
              proveedor={proveedor}
              onEdit={() => openEdit(proveedor)}
              onDelete={() => openDelete(proveedor)}
              onDetail={() => openDetail(proveedor)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <ProveedorModal
        open={showModal === "create" || showModal === "edit"}
        editTarget={showModal === "edit" ? selectedProveedor : null}
        productos={productos}
        onClose={() => { setShowModal(null); setSelectedProveedor(null); }}
        onSuccess={(saved) => {
          handleModalSuccess(saved);
          setShowModal(null);
          setSelectedProveedor(null);
        }}
      />

      <ProveedorDetailModal
        proveedor={showModal === "detail" ? selectedProveedor : null}
        productos={productos}
        onClose={() => { setShowModal(null); setSelectedProveedor(null); }}
      />

      <DeleteConfirmModal
        proveedor={showModal === "delete" ? selectedProveedor : null}
        onConfirm={confirmDelete}
        onCancel={() => { setShowModal(null); setSelectedProveedor(null); }}
      />
    </div>
  );
}

// ─── SupplierCard ─────────────────────────────────────────────────────────────

interface SupplierCardProps {
  proveedor: Proveedor;
  onEdit: () => void;
  onDelete: () => void;
  onDetail: () => void;
}

function SupplierCard({ proveedor, onEdit, onDelete, onDetail }: SupplierCardProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      style={{
        backgroundColor: "hsl(var(--surface))",
        borderRadius: 10,
        boxShadow: hovered
          ? "0 6px 20px rgba(0,0,0,0.10)"
          : "0 2px 8px rgba(0,0,0,0.06)",
        padding: 22,
        border: "1px solid hsl(var(--border))",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        cursor: "pointer",
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
        transition: "transform 0.15s ease, box-shadow 0.15s ease",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onDetail}
    >
      {/* Top row: icon + action buttons */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            backgroundColor: "hsl(var(--navy) / 0.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Users size={20} style={{ color: "hsl(var(--navy))" }} />
        </div>

        <div
          style={{ display: "flex", gap: 4 }}
          onClick={(e) => e.stopPropagation()}
        >
          <ActionBtn onClick={onEdit} title="Editar proveedor" color="hsl(var(--navy))">
            <Pencil size={13} />
          </ActionBtn>
          <ActionBtn onClick={onDelete} title="Eliminar proveedor" color="hsl(var(--terracota))">
            <Trash2 size={13} />
          </ActionBtn>
        </div>
      </div>

      {/* Company name + contact */}
      <div>
        <p
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: "hsl(var(--text-main))",
            margin: 0,
            lineHeight: 1.3,
          }}
        >
          {proveedor.company}
        </p>
        {proveedor.contact && (
          <p style={{ fontSize: 12, color: "hsl(var(--text-sub))", margin: "3px 0 0" }}>
            {proveedor.contact}
          </p>
        )}
      </div>

      {/* Contact info */}
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        {proveedor.email && (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Mail size={12} style={{ color: "hsl(var(--text-muted))", flexShrink: 0 }} />
            <span
              style={{
                fontSize: 12,
                color: "hsl(var(--text-sub))",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {proveedor.email}
            </span>
          </div>
        )}
        {proveedor.phone && (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Phone size={12} style={{ color: "hsl(var(--text-muted))", flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: "hsl(var(--text-sub))" }}>
              {proveedor.phone}
            </span>
          </div>
        )}
      </div>

      {/* Pills: productos + compras */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <span
          style={{
            backgroundColor: "hsl(var(--green) / 0.15)",
            color: "hsl(var(--green))",
            borderRadius: 99,
            fontSize: 11,
            fontWeight: 600,
            padding: "2px 10px",
          }}
        >
          {proveedor.productos_count} productos
        </span>
        <span
          style={{
            backgroundColor: "hsl(var(--navy) / 0.15)",
            color: "hsl(var(--navy))",
            borderRadius: 99,
            fontSize: 11,
            fontWeight: 600,
            padding: "2px 10px",
          }}
        >
          {proveedor.compras_count} compras
        </span>
      </div>

      {/* Footer: total spent + Ver detalles */}
      <div
        style={{
          borderTop: "1px solid hsl(var(--border))",
          paddingTop: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <p
            style={{
              fontSize: 11,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              color: "hsl(var(--text-muted))",
              margin: 0,
            }}
          >
            Gasto total
          </p>
          <p
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: "hsl(var(--terracota))",
              margin: "2px 0 0",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {formatCurrency(proveedor.total_spent)}
          </p>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onDetail(); }}
          style={{
            padding: "6px 14px",
            fontSize: 12,
            fontWeight: 500,
            borderRadius: 8,
            border: "1px solid hsl(var(--border))",
            backgroundColor: "transparent",
            color: "hsl(var(--text-sub))",
            cursor: "pointer",
            fontFamily: "inherit",
            transition: "background-color 0.12s ease",
          }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.backgroundColor =
              "hsl(var(--surface-hover))")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent")
          }
        >
          Ver detalles
        </button>
      </div>
    </div>
  );
}

// ─── ActionBtn ────────────────────────────────────────────────────────────────

function ActionBtn({
  children,
  onClick,
  title,
  color,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  color: string;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 28,
        height: 28,
        borderRadius: 6,
        border: "none",
        cursor: "pointer",
        backgroundColor: hovered ? `${color}22` : "transparent",
        color,
        transition: "background-color 0.12s ease",
        fontFamily: "inherit",
      }}
    >
      {children}
    </button>
  );
}
