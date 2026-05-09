"use client";

import React, { useState, useTransition } from "react";
import { toast } from "sonner";
import { ChevronDown, ChevronUp, Plus, Eye, Pencil, Trash2, FileText } from "lucide-react";
import { deleteOrden } from "@/lib/actions/compras.actions";
import { formatCurrency, formatDate } from "@/lib/format";
import { CategoryBadge } from "@/components/shared/CategoryBadge";
import { CompraModal } from "@/components/compras/CompraModal";
import { CompraDetailModal } from "@/components/compras/CompraDetailModal";
import { CompraDeleteModal } from "@/components/compras/CompraDeleteModal";
import type { OrdenCompra, Proveedor, Producto, Categoria } from "@/types";

interface InitialFilters {
  desde: string;
  hasta: string;
  supplier_id: string;
}

interface Props {
  ordenes: OrdenCompra[];
  proveedores: Proveedor[];
  productos: Producto[];
  initialFilters: InitialFilters;
}

type ModalState = "create" | "edit" | "view" | "delete" | null;


export default function ComprasClient({ ordenes: initial, proveedores, productos, initialFilters }: Props) {
  const [ordenes, setOrdenes] = useState(initial);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState>(null);
  const [selected, setSelected] = useState<OrdenCompra | null>(null);
  const [filterSupp, setFilterSupp] = useState(initialFilters.supplier_id);
  const [filterDesde, setFilterDesde] = useState(initialFilters.desde);
  const [filterHasta, setFilterHasta] = useState(initialFilters.hasta);
  const [, startTransition] = useTransition();

  const hasFilters = filterSupp || filterDesde || filterHasta;

  const filtered = ordenes.filter((o) => {
    if (filterSupp && o.supplier_id !== filterSupp) return false;
    const fechaStr = o.fecha?.split("T")[0] ?? o.fecha;
    if (filterDesde && fechaStr < filterDesde) return false;
    if (filterHasta && fechaStr > filterHasta) return false;
    return true;
  });

  const filteredTotal = filtered.reduce((s, o) => s + (Number(o.total) || 0), 0);

  function clearFilters() {
    setFilterSupp("");
    setFilterDesde("");
    setFilterHasta("");
  }

  function openCreate() {
    setSelected(null);
    setModal("create");
  }

  function openView(o: OrdenCompra) {
    setSelected(o);
    setModal("view");
  }

  function openEdit(o: OrdenCompra) {
    setSelected(o);
    setModal("edit");
  }

  function openDelete(o: OrdenCompra) {
    setSelected(o);
    setModal("delete");
  }

  function closeModal() {
    setModal(null);
    setSelected(null);
  }

  function handleCreate(orden: OrdenCompra) {
    setOrdenes((prev) => [orden, ...prev]);
  }

  function handleUpdate(orden: OrdenCompra) {
    setOrdenes((prev) => prev.map((o) => (o.id === orden.id ? { ...o, ...orden } : o)));
  }

  function handleDelete() {
    if (!selected) return;
    const id = selected.id;
    startTransition(async () => {
      const res = await deleteOrden(id);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      setOrdenes((prev) => prev.filter((o) => o.id !== id));
      toast.success("Compra eliminada");
      closeModal();
    });
  }

  const COL_WIDTHS = "32px 120px 140px 1fr 90px 110px 80px 100px";

  return (
    <div style={{ padding: 28 }}>
      {/* Page header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "hsl(var(--text-main))", margin: 0 }}>
          Registro de Compras
        </h1>
        <p style={{ fontSize: 13, color: "hsl(var(--text-sub))", margin: "2px 0 0" }}>
          Historial y registro de compras
        </p>
      </div>

      {/* Filters row */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <input
          type="date"
          value={filterDesde}
          onChange={(e) => setFilterDesde(e.target.value)}
          style={filterInputStyle}
          title="Desde"
        />
        <span style={{ fontSize: 13, color: "hsl(var(--text-muted))" }}>a</span>
        <input
          type="date"
          value={filterHasta}
          onChange={(e) => setFilterHasta(e.target.value)}
          style={filterInputStyle}
          title="Hasta"
        />
        <select
          value={filterSupp}
          onChange={(e) => setFilterSupp(e.target.value)}
          style={{ ...filterInputStyle, minWidth: 180 }}
        >
          <option value="">Todos los proveedores</option>
          {proveedores.map((p) => (
            <option key={p.id} value={p.id}>{p.company}</option>
          ))}
        </select>

        {hasFilters && (
          <button
            onClick={clearFilters}
            style={{
              padding: "8px 14px",
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
            Limpiar
          </button>
        )}

        <div style={{ marginLeft: "auto" }}>
          <button
            onClick={openCreate}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "9px 18px",
              borderRadius: 8,
              border: "none",
              backgroundColor: "hsl(var(--green))",
              color: "white",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            <Plus size={15} />
            Registrar Compra
          </button>
        </div>
      </div>

      {/* Table card */}
      <div style={{
        backgroundColor: "hsl(var(--surface))",
        borderRadius: 10,
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        overflow: "hidden",
      }}>
        {/* Table header bar */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 20px",
          borderBottom: "1px solid hsl(var(--border))",
        }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: "hsl(var(--text-main))" }}>Compras</span>
          <span style={{ fontSize: 12, color: "hsl(var(--text-muted))" }}>
            {filtered.length} compra(s) · Total: {formatCurrency(filteredTotal)}
          </span>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ backgroundColor: "hsl(var(--surface-alt))" }}>
                <th style={thStyle}></th>
                <th style={thStyle}>Fecha</th>
                <th style={thStyle}>Folio</th>
                <th style={thStyle}>Proveedor</th>
                <th style={{ ...thStyle, textAlign: "center" }}>Productos</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Total</th>
                <th style={{ ...thStyle, textAlign: "center" }}>Factura</th>
                <th style={{ ...thStyle, textAlign: "center" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, ri) => {
                const isExpanded = expanded === row.id;
                const proveedor = row.proveedor as any;
                const detalles = (row.detalles ?? []) as any[];
                const rowBg = ri % 2 === 0 ? "hsl(var(--surface))" : "hsl(var(--surface-alt))";

                return (
                  <React.Fragment key={row.id}>
                    <tr
                      style={{
                        borderBottom: "1px solid hsl(var(--border))",
                        backgroundColor: rowBg,
                        cursor: "pointer",
                        transition: "background-color 0.1s",
                      }}
                      onClick={() => setExpanded(isExpanded ? null : row.id)}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "hsl(var(--surface-hover))")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = rowBg)}
                    >
                      {/* Chevron */}
                      <td style={{ padding: "11px 14px", width: 32, color: "hsl(var(--text-muted))" }}>
                        {isExpanded
                          ? <ChevronUp size={14} />
                          : <ChevronDown size={14} />
                        }
                      </td>

                      {/* Fecha */}
                      <td style={{ padding: "11px 14px" }}>
                        <span style={{ fontSize: 12, color: "hsl(var(--text-main))" }}>
                          {formatDate(row.fecha)}
                        </span>
                      </td>

                      {/* Folio */}
                      <td style={{ padding: "11px 14px" }}>
                        <span style={{ fontFamily: "monospace", fontSize: 12, color: "hsl(var(--text-sub))" }}>
                          {row.folio}
                        </span>
                      </td>

                      {/* Proveedor */}
                      <td style={{ padding: "11px 14px" }}>
                        <span style={{ fontSize: 13, fontWeight: 500, color: "hsl(var(--text-main))" }}>
                          {proveedor?.company ?? "—"}
                        </span>
                      </td>

                      {/* # Productos badge */}
                      <td style={{ padding: "11px 14px", textAlign: "center" }}>
                        <span style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          minWidth: 24,
                          height: 24,
                          padding: "0 8px",
                          borderRadius: 99,
                          fontSize: 11,
                          fontWeight: 700,
                          backgroundColor: "hsl(var(--navy) / 0.12)",
                          color: "hsl(var(--navy))",
                        }}>
                          {detalles.length}
                        </span>
                      </td>

                      {/* Total */}
                      <td style={{ padding: "11px 14px", textAlign: "right" }}>
                        <span style={{ fontWeight: 700, fontSize: 14, color: "hsl(var(--text-main))", fontVariantNumeric: "tabular-nums" }}>
                          {formatCurrency(Number(row.total))}
                        </span>
                      </td>

                      {/* Factura */}
                      <td style={{ padding: "11px 14px", textAlign: "center" }}>
                        {row.has_invoice
                          ? <FileText size={16} style={{ color: "hsl(var(--green))" }} />
                          : <span style={{ color: "hsl(var(--text-muted))", fontSize: 13 }}>—</span>
                        }
                      </td>

                      {/* Acciones */}
                      <td style={{ padding: "11px 14px" }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: "flex", gap: 5, justifyContent: "center" }}>
                          <ActionBtn
                            icon={<Eye size={13} />}
                            color="hsl(var(--green))"
                            onClick={() => openView(row)}
                            title="Ver detalle"
                          />
                          <ActionBtn
                            icon={<Pencil size={13} />}
                            color="hsl(var(--navy))"
                            onClick={() => openEdit(row)}
                            title="Editar"
                          />
                          <ActionBtn
                            icon={<Trash2 size={13} />}
                            color="hsl(var(--terracota))"
                            onClick={() => openDelete(row)}
                            title="Eliminar"
                          />
                        </div>
                      </td>
                    </tr>

                    {/* Expanded detail row */}
                    {isExpanded && (
                      <tr style={{ backgroundColor: "hsl(var(--surface-alt))" }}>
                        <td colSpan={8} style={{ padding: "12px 24px 16px" }}>
                          <div style={{
                            fontSize: 11,
                            fontWeight: 700,
                            textTransform: "uppercase",
                            letterSpacing: "0.04em",
                            color: "hsl(var(--text-muted))",
                            marginBottom: 10,
                          }}>
                            Detalle de Productos
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            {detalles.map((d: any, li: number) => {
                              const prod = d.productos ?? d.producto;
                              const cat = prod?.categorias ?? prod?.categoria;
                              return (
                                <div
                                  key={d.id ?? li}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 12,
                                    backgroundColor: "hsl(var(--surface))",
                                    borderRadius: 6,
                                    padding: "8px 14px",
                                  }}
                                >
                                  <CategoryBadge category={cat} />
                                  <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: "hsl(var(--text-main))" }}>
                                    {prod?.nombre ?? "Producto"}
                                  </span>
                                  <span style={{ fontSize: 12, color: "hsl(var(--text-sub))" }}>
                                    {d.qty} {prod?.unidad}
                                  </span>
                                  <span style={{ fontSize: 12, color: "hsl(var(--text-sub))" }}>
                                    × {formatCurrency(d.price)}
                                  </span>
                                  <span style={{ fontSize: 13, fontWeight: 700, color: "hsl(var(--text-main))", fontVariantNumeric: "tabular-nums" }}>
                                    {formatCurrency(d.qty * d.price)}
                                  </span>
                                </div>
                              );
                            })}

                            {/* Indicador factura */}
                            {row.has_invoice && (
                              <div style={{
                                alignSelf: "flex-start",
                                display: "flex",
                                alignItems: "center",
                                gap: 5,
                                marginTop: 4,
                                padding: "4px 10px",
                                borderRadius: 99,
                                backgroundColor: "hsl(var(--green) / 0.1)",
                                color: "hsl(var(--green))",
                                fontSize: 11,
                                fontWeight: 600,
                              }}>
                                <FileText size={11} />
                                Con factura
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ padding: 48, textAlign: "center", color: "hsl(var(--text-muted))", fontSize: 14 }}>
                    {hasFilters ? "Sin compras con los filtros aplicados" : "Sin compras registradas"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modales */}
      <CompraModal
        open={modal === "create" || modal === "edit"}
        editTarget={modal === "edit" ? selected : null}
        proveedores={proveedores}
        productos={productos}
        onClose={closeModal}
        onSuccess={(orden) => {
          if (modal === "create") handleCreate(orden);
          else handleUpdate(orden);
          closeModal();
        }}
      />

      <CompraDetailModal
        orden={modal === "view" ? selected : null}
        onClose={closeModal}
      />

      <CompraDeleteModal
        orden={modal === "delete" ? selected : null}
        onConfirm={handleDelete}
        onCancel={closeModal}
      />
    </div>
  );
}

function ActionBtn({
  icon,
  color,
  onClick,
  title,
}: {
  icon: React.ReactNode;
  color: string;
  onClick: () => void;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 28,
        height: 28,
        borderRadius: 6,
        border: "none",
        backgroundColor: color + "18",
        color,
        cursor: "pointer",
      }}
    >
      {icon}
    </button>
  );
}

const thStyle: React.CSSProperties = {
  padding: "11px 14px",
  textAlign: "left",
  fontWeight: 600,
  fontSize: 11,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  color: "hsl(var(--text-sub))",
  borderBottom: "1.5px solid hsl(var(--border))",
  whiteSpace: "nowrap",
};

const filterInputStyle: React.CSSProperties = {
  padding: "8px 12px",
  fontSize: 13,
  borderRadius: 8,
  border: "1px solid hsl(var(--border))",
  backgroundColor: "hsl(var(--surface))",
  color: "hsl(var(--text-main))",
  outline: "none",
  fontFamily: "inherit",
};
