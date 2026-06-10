"use client";

import { useState, useTransition, useEffect, useRef, useMemo } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { toast } from "sonner";
import {
  Plus, Search, X, Users, Mail, Phone, Pencil, Trash2,
  Package, ChevronDown, CheckCircle2,
} from "lucide-react";
import { deleteProveedor } from "@/lib/actions/proveedores.actions";
import { formatCurrency } from "@/lib/format";
import type { Proveedor, Producto, Categoria } from "@/types";
import { ProveedorModal } from "@/components/proveedores/ProveedorModal";
import { ProveedorDetailModal } from "@/components/proveedores/ProveedorDetailModal";
import { DeleteConfirmModal } from "@/components/proveedores/DeleteConfirmModal";

interface Props {
  proveedores: Proveedor[];
  productos: Producto[];
  assignedProductIds: string[];
  initialSearch: string;
}

export default function ProveedoresClient({
  proveedores: initialProveedores,
  productos,
  assignedProductIds,
  initialSearch,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [proveedores, setProveedores] = useState<Proveedor[]>(initialProveedores);
  const [assignedIds, setAssignedIds] = useState<Set<string>>(() => new Set(assignedProductIds));
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [showModal, setShowModal] = useState<null | "create" | "edit" | "detail" | "delete">(null);
  const [selectedProveedor, setSelectedProveedor] = useState<Proveedor | null>(null);
  const [, startNavTransition] = useTransition();

  useEffect(() => {
    setProveedores(initialProveedores);
  }, [initialProveedores]);

  useEffect(() => {
    setAssignedIds(new Set(assignedProductIds));
  }, [assignedProductIds]);

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
    // Update assigned IDs optimistically (add newly assigned products)
    setAssignedIds((prev) => {
      const next = new Set(prev);
      saved.producto_ids.forEach((id) => next.add(id));
      return next;
    });

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

      {/* Unassigned products panel */}
      <UnassignedPanel productos={productos} assignedIds={assignedIds} />

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

// ─── UnassignedPanel ──────────────────────────────────────────────────────────

interface UnassignedPanelProps {
  productos: Producto[];
  assignedIds: Set<string>;
}

function UnassignedPanel({ productos, assignedIds }: UnassignedPanelProps) {
  const [expanded, setExpanded] = useState(true);
  const [catFilter, setCatFilter] = useState<string>("");

  const unassigned = useMemo(
    () => productos.filter((p) => !assignedIds.has(p.id)),
    [productos, assignedIds],
  );

  const categories = useMemo<Categoria[]>(() => {
    const map = new Map<string, Categoria>();
    unassigned.forEach((p) => {
      if (p.categoria) map.set(p.categoria.id, p.categoria);
    });
    return Array.from(map.values()).sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [unassigned]);

  // Reset filter if selected category no longer has unassigned products
  useEffect(() => {
    if (catFilter && !categories.find((c) => c.id === catFilter)) {
      setCatFilter("");
    }
  }, [categories, catFilter]);

  const filtered = catFilter
    ? unassigned.filter((p) => p.categoria_id === catFilter)
    : unassigned;

  const hasUnassigned = unassigned.length > 0;

  return (
    <div
      style={{
        backgroundColor: "hsl(var(--surface))",
        borderRadius: 10,
        border: `1px solid ${hasUnassigned ? "hsl(var(--gold) / 0.45)" : "hsl(var(--border))"}`,
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        overflow: "hidden",
        marginBottom: 20,
      }}
    >
      {/* Collapsible header */}
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "13px 18px",
          background: hasUnassigned ? "hsl(var(--gold) / 0.06)" : "transparent",
          border: "none",
          cursor: "pointer",
          fontFamily: "inherit",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <Package size={15} style={{ color: hasUnassigned ? "hsl(var(--gold))" : "hsl(var(--text-muted))", flexShrink: 0 }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: "hsl(var(--text-main))" }}>
            Productos sin proveedor asignado
          </span>
          {hasUnassigned && (
            <span
              style={{
                backgroundColor: "hsl(var(--gold) / 0.18)",
                color: "hsl(var(--gold))",
                borderRadius: 99,
                fontSize: 11,
                fontWeight: 700,
                padding: "1px 8px",
              }}
            >
              {unassigned.length}
            </span>
          )}
        </div>
        <ChevronDown
          size={14}
          style={{
            color: "hsl(var(--text-muted))",
            transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.18s ease",
            flexShrink: 0,
          }}
        />
      </button>

      {/* Body */}
      {expanded && (
        <div style={{ padding: "0 18px 16px" }}>
          {!hasUnassigned ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                padding: "10px 0 2px",
                color: "hsl(var(--green))",
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              <CheckCircle2 size={14} />
              <span>Todos los productos tienen proveedor asignado</span>
            </div>
          ) : (
            <>
              {/* Category filter — only shown when 2+ categories present */}
              {categories.length > 1 && (
                <div
                  style={{
                    display: "flex",
                    gap: 6,
                    flexWrap: "wrap",
                    paddingBottom: 12,
                    marginBottom: 12,
                    borderBottom: "1px solid hsl(var(--border))",
                  }}
                >
                  <CatTab
                    active={catFilter === ""}
                    onClick={() => setCatFilter("")}
                    label="Todas"
                    count={unassigned.length}
                  />
                  {categories.map((cat) => (
                    <CatTab
                      key={cat.id}
                      active={catFilter === cat.id}
                      onClick={() => setCatFilter(cat.id)}
                      label={cat.nombre}
                      count={unassigned.filter((p) => p.categoria_id === cat.id).length}
                      color={cat.color}
                    />
                  ))}
                </div>
              )}

              {/* Product pills */}
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {filtered.map((p) => (
                  <ProductPill key={p.id} producto={p} />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── CatTab ───────────────────────────────────────────────────────────────────

function CatTab({
  active,
  onClick,
  label,
  count,
  color,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  color?: string;
}) {
  const activeColor = color ?? "hsl(var(--terracota))";
  const isHex = color !== undefined;

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 5,
        padding: "4px 10px",
        borderRadius: 99,
        fontSize: 12,
        fontWeight: 600,
        cursor: "pointer",
        fontFamily: "inherit",
        border: active
          ? `1px solid ${isHex ? `${color}88` : "hsl(var(--terracota) / 0.55)"}`
          : "1px solid hsl(var(--border))",
        backgroundColor: active
          ? isHex ? `${color}22` : "hsl(var(--terracota) / 0.12)"
          : "transparent",
        color: active
          ? activeColor
          : "hsl(var(--text-sub))",
        transition: "all 0.12s ease",
      }}
    >
      {label}
      <span
        style={{
          fontSize: 10,
          fontWeight: 700,
          backgroundColor: active
            ? isHex ? `${color}33` : "hsl(var(--terracota) / 0.18)"
            : "hsl(var(--surface-alt))",
          color: active ? activeColor : "hsl(var(--text-muted))",
          borderRadius: 99,
          padding: "0 5px",
          minWidth: 16,
          textAlign: "center" as const,
        }}
      >
        {count}
      </span>
    </button>
  );
}

// ─── ProductPill ──────────────────────────────────────────────────────────────

function ProductPill({ producto }: { producto: Producto }) {
  const color = producto.categoria?.color ?? "#78909C";

  return (
    <div
      title={`${producto.nombre} · ${producto.unidad}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "3px 10px",
        borderRadius: 99,
        backgroundColor: `${color}1A`,
        color,
        fontSize: 12,
        fontWeight: 600,
        border: `1px solid ${color}44`,
        maxWidth: 200,
        overflow: "hidden",
      }}
    >
      <span
        style={{
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {producto.nombre}
      </span>
      <span style={{ fontSize: 10, opacity: 0.65, flexShrink: 0 }}>
        · {producto.unidad}
      </span>
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
