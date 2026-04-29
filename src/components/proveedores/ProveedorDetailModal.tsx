"use client";

import { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { getProveedorOrdenes } from "@/lib/actions/proveedores.actions";
import { formatCurrency } from "@/lib/format";
import type { Proveedor, Producto, OrdenCompra } from "@/types";

interface ProveedorDetailModalProps {
  proveedor: Proveedor | null;
  productos: Producto[];
  onClose: () => void;
}

type TabKey = "info" | "compras" | "productos";

export function ProveedorDetailModal({
  proveedor,
  productos,
  onClose,
}: ProveedorDetailModalProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("info");
  const [ordenes, setOrdenes] = useState<OrdenCompra[]>([]);
  const [loadingOrdenes, setLoadingOrdenes] = useState(false);

  useEffect(() => {
    if (!proveedor) return;
    setActiveTab("info");
    setOrdenes([]);
  }, [proveedor]);

  useEffect(() => {
    if (!proveedor || activeTab !== "compras") return;
    setLoadingOrdenes(true);
    getProveedorOrdenes(proveedor.id).then((res) => {
      setOrdenes(res.data ?? []);
      setLoadingOrdenes(false);
    });
  }, [proveedor, activeTab]);

  if (!proveedor) return null;

  const supplierProductos = productos.filter((p) =>
    proveedor.producto_ids.includes(p.id),
  );

  const tabs: { key: TabKey; label: string }[] = [
    { key: "info", label: "Información" },
    { key: "compras", label: "Compras" },
    { key: "productos", label: "Productos" },
  ];

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
          maxWidth: 680,
          borderRadius: 12,
          boxShadow: "0 32px 80px rgba(0,0,0,0.28)",
          backgroundColor: "hsl(var(--surface))",
          animation: "modalIn 0.18s ease-out",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 24px 0",
            flexShrink: 0,
          }}
        >
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: "hsl(var(--text-main))", margin: 0 }}>
              {proveedor.company}
            </h2>
            {proveedor.contact && (
              <p style={{ fontSize: 12, color: "hsl(var(--text-sub))", margin: "3px 0 0" }}>
                {proveedor.contact}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              padding: 6,
              borderRadius: 6,
              border: "none",
              background: "transparent",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              color: "hsl(var(--text-muted))",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: "flex",
            gap: 0,
            borderBottom: "1px solid hsl(var(--border))",
            padding: "16px 24px 0",
            flexShrink: 0,
          }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: "8px 18px",
                fontSize: 13,
                fontWeight: activeTab === tab.key ? 700 : 500,
                color:
                  activeTab === tab.key
                    ? "hsl(var(--terracota))"
                    : "hsl(var(--text-sub))",
                background: "transparent",
                border: "none",
                borderBottom:
                  activeTab === tab.key
                    ? "2.5px solid hsl(var(--terracota))"
                    : "2.5px solid transparent",
                cursor: "pointer",
                fontFamily: "inherit",
                marginBottom: -1,
                transition: "color 0.12s ease",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1 }}>

          {/* Tab: Información */}
          {activeTab === "info" && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 20,
              }}
            >
              <InfoField label="Empresa" value={proveedor.company} />
              <InfoField label="Contacto" value={proveedor.contact || "—"} />
              <InfoField label="Email" value={proveedor.email || "—"} />
              <InfoField label="Teléfono" value={proveedor.phone || "—"} />
              <div style={{ gridColumn: "1 / -1" }}>
                <InfoField label="Dirección" value={proveedor.address || "—"} />
              </div>
              <InfoField
                label="Gasto total"
                value={formatCurrency(proveedor.total_spent)}
                valueStyle={{ color: "hsl(var(--terracota))", fontWeight: 700 }}
              />
              <InfoField
                label="Estado"
                value={proveedor.activo ? "Activo" : "Inactivo"}
                valueStyle={{
                  color: proveedor.activo ? "hsl(var(--green))" : "hsl(var(--text-muted))",
                  fontWeight: 600,
                }}
              />
            </div>
          )}

          {/* Tab: Compras */}
          {activeTab === "compras" && (
            <div>
              {loadingOrdenes ? (
                <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
                  <Loader2
                    size={24}
                    style={{
                      color: "hsl(var(--text-muted))",
                      animation: "spin 0.7s linear infinite",
                    }}
                  />
                </div>
              ) : ordenes.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 0" }}>
                  <p style={{ fontSize: 13, color: "hsl(var(--text-muted))" }}>
                    Sin compras registradas
                  </p>
                </div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid hsl(var(--border))" }}>
                      {[
                        { label: "Fecha", align: "left" as const },
                        { label: "Folio", align: "left" as const },
                        { label: "Total", align: "right" as const },
                      ].map((col) => (
                        <th
                          key={col.label}
                          style={{
                            padding: "8px 10px",
                            fontSize: 11,
                            fontWeight: 600,
                            textTransform: "uppercase",
                            letterSpacing: "0.04em",
                            color: "hsl(var(--text-muted))",
                            textAlign: col.align,
                          }}
                        >
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ordenes.map((orden, i) => (
                      <tr
                        key={orden.id}
                        style={{
                          backgroundColor:
                            i % 2 === 0
                              ? "hsl(var(--surface))"
                              : "hsl(var(--surface-alt))",
                          borderBottom: "1px solid hsl(var(--border))",
                        }}
                      >
                        <td style={{ padding: "10px 10px", fontSize: 13, color: "hsl(var(--text-sub))" }}>
                          {formatDate(orden.fecha)}
                        </td>
                        <td style={{ padding: "10px 10px", fontSize: 13, color: "hsl(var(--text-main))", fontWeight: 500 }}>
                          {orden.folio}
                        </td>
                        <td style={{ padding: "10px 10px", fontSize: 13, fontWeight: 700, color: "hsl(var(--terracota))", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                          {formatCurrency(orden.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Tab: Productos */}
          {activeTab === "productos" && (
            <div>
              {supplierProductos.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 0" }}>
                  <p style={{ fontSize: 13, color: "hsl(var(--text-muted))" }}>
                    Sin productos asignados
                  </p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {supplierProductos.map((p) => (
                    <div
                      key={p.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "10px 12px",
                        borderRadius: 8,
                        backgroundColor: "hsl(var(--surface-alt))",
                        border: "1px solid hsl(var(--border))",
                      }}
                    >
                      {/* Category color dot */}
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          backgroundColor: p.categoria?.color ?? "#999",
                          flexShrink: 0,
                        }}
                      />
                      <span
                        style={{
                          flex: 1,
                          fontSize: 13,
                          fontWeight: 600,
                          color: "hsl(var(--text-main))",
                        }}
                      >
                        {p.nombre}
                      </span>
                      <span
                        style={{
                          fontSize: 12,
                          color: "hsl(var(--terracota))",
                          fontWeight: 500,
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {formatCurrency(p.last_price)} / {p.unidad}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "14px 24px 20px",
            borderTop: "1px solid hsl(var(--border))",
            flexShrink: 0,
          }}
        >
          <button
            onClick={onClose}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              padding: "9px 20px",
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
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoField({
  label,
  value,
  valueStyle,
}: {
  label: string;
  value: string;
  valueStyle?: React.CSSProperties;
}) {
  return (
    <div>
      <p
        style={{
          fontSize: 11,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          color: "hsl(var(--text-muted))",
          margin: "0 0 4px",
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontSize: 13,
          color: "hsl(var(--text-main))",
          margin: 0,
          ...valueStyle,
        }}
      >
        {value}
      </p>
    </div>
  );
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
