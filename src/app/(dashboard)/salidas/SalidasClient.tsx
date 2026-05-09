"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { LogOut, Trash2, Plus } from "lucide-react";
import { anularMovimiento } from "@/lib/actions/salidas.actions";
import { formatCurrency, formatDate } from "@/lib/format";
import { MERMA_COLORS } from "@/lib/constants";
import { ConsumoModal } from "@/components/salidas/ConsumoModal";
import { MermaModal } from "@/components/salidas/MermaModal";
import { SalidaDeleteModal } from "@/components/salidas/SalidaDeleteModal";
import type { Movimiento, Producto } from "@/types";

interface Props {
  movimientos: Movimiento[];
  productos: Producto[];
}

type Tab = "consumo" | "merma";

function CategoryBadge({ cat }: { cat?: { nombre: string; color: string } | null }) {
  if (!cat) return <span style={{ fontSize: 11, color: "hsl(var(--text-muted))" }}>Sin categoría</span>;
  return (
    <span style={{
      backgroundColor: cat.color + "22",
      color: cat.color,
      borderRadius: 99,
      fontSize: 11,
      fontWeight: 600,
      padding: "2px 10px",
      whiteSpace: "nowrap",
    }}>
      {cat.nombre}
    </span>
  );
}

function MermaBadge({ tipo }: { tipo: string }) {
  const color = MERMA_COLORS[tipo] ?? "#78909C";
  return (
    <span style={{
      backgroundColor: color + "22",
      color,
      borderRadius: 99,
      fontSize: 11,
      fontWeight: 600,
      padding: "2px 10px",
      whiteSpace: "nowrap",
    }}>
      {tipo}
    </span>
  );
}

export default function SalidasClient({ movimientos: initial, productos }: Props) {
  const [movimientos, setMovimientos] = useState(initial);
  const [tab, setTab] = useState<Tab>("consumo");
  const [modal, setModal] = useState<"consumo" | "merma" | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Movimiento | null>(null);
  const [, startTransition] = useTransition();

  const consumos = movimientos.filter((m) => m.tipo === "salida");
  const mermas = movimientos.filter((m) => m.tipo === "merma");

  const totalConsumoValue = consumos.reduce((s, m) => {
    const prod = (m as any).productos ?? (m as any).producto;
    return s + (m.qty * (prod?.last_price ?? 0));
  }, 0);
  const totalMermaValue = mermas.reduce((s, m) => s + Number(m.value_lost ?? 0), 0);

  function handleConsumoSuccess(mov: Movimiento) {
    setMovimientos((prev) => [mov, ...prev]);
  }

  function handleMermaSuccess(mov: Movimiento) {
    setMovimientos((prev) => [mov, ...prev]);
  }

  function confirmDelete(mov: Movimiento) {
    setDeleteTarget(mov);
  }

  function handleDelete() {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    startTransition(async () => {
      const res = await anularMovimiento(id);
      if (res.error) { toast.error(res.error); return; }
      setMovimientos((prev) => prev.filter((m) => m.id !== id));
      toast.success(deleteTarget.tipo === "salida" ? "Consumo anulado" : "Merma anulada");
      setDeleteTarget(null);
    });
  }

  return (
    <div style={{ padding: 28 }}>
      {/* Page header */}
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "hsl(var(--text-main))", margin: 0 }}>
          Salidas de Inventario
        </h1>
        <p style={{ fontSize: 13, color: "hsl(var(--text-sub))", margin: "2px 0 0" }}>
          Consumos y mermas del inventario
        </p>
      </div>

      {/* Tabs */}
      <div style={{
        display: "flex",
        borderBottom: "2px solid hsl(var(--border))",
        width: "fit-content",
        marginBottom: 22,
        gap: 0,
      }}>
        {([
          { id: "consumo" as Tab, label: "Consumo", Icon: LogOut },
          { id: "merma" as Tab, label: "Merma", Icon: Trash2 },
        ] as const).map(({ id, label, Icon }) => {
          const isActive = tab === id;
          return (
            <button
              key={id}
              onClick={() => setTab(id)}
              style={{
                padding: "11px 28px",
                border: "none",
                background: "none",
                cursor: "pointer",
                fontFamily: "inherit",
                fontSize: 14,
                fontWeight: isActive ? 700 : 400,
                color: isActive ? "hsl(var(--terracota))" : "hsl(var(--text-sub))",
                borderBottom: `2.5px solid ${isActive ? "hsl(var(--terracota))" : "transparent"}`,
                marginBottom: -2,
                display: "flex",
                alignItems: "center",
                gap: 8,
                transition: "all 0.15s ease",
              }}
            >
              <Icon size={15} />
              {label}
            </button>
          );
        })}
      </div>

      {/* ── Tab Consumo ─────────────────────────────── */}
      {tab === "consumo" && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: "hsl(var(--text-sub))" }}>
              <strong>{consumos.length}</strong> registros · Total consumido:{" "}
              <strong style={{ color: "hsl(var(--navy))" }}>{formatCurrency(totalConsumoValue)}</strong>
            </div>
            <button
              onClick={() => setModal("consumo")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "9px 16px",
                borderRadius: 8,
                border: "none",
                backgroundColor: "hsl(var(--navy))",
                color: "white",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              <Plus size={14} />
              Registrar Consumo
            </button>
          </div>

          <div style={{
            backgroundColor: "hsl(var(--surface))",
            borderRadius: 10,
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            overflow: "hidden",
          }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ backgroundColor: "hsl(var(--surface-alt))" }}>
                    {["Fecha", "Producto", "Cantidad", "Valor", "Notas", ""].map((h) => (
                      <th key={h} style={{ ...thStyle, textAlign: (h === "Cantidad" || h === "Valor") ? "center" : "left" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {consumos.map((m, i) => {
                    const prod = (m as any).productos ?? (m as any).producto;
                    const cat = prod?.categorias ?? prod?.categoria;
                    const valor = m.qty * (prod?.last_price ?? 0);
                    return (
                      <tr
                        key={m.id}
                        style={{
                          borderBottom: "1px solid hsl(var(--border))",
                          backgroundColor: i % 2 === 0 ? "hsl(var(--surface))" : "hsl(var(--surface-alt))",
                        }}
                      >
                        <td style={{ padding: "11px 14px", fontSize: 12, color: "hsl(var(--text-main))", whiteSpace: "nowrap" }}>
                          {formatDate(m.fecha)}
                        </td>
                        <td style={{ padding: "11px 14px" }}>
                          <div style={{ fontWeight: 600, fontSize: 13, color: "hsl(var(--text-main))", marginBottom: 3 }}>
                            {prod?.nombre ?? "—"}
                          </div>
                          <CategoryBadge cat={cat} />
                        </td>
                        <td style={{ padding: "11px 14px", textAlign: "center" }}>
                          <span style={{ fontWeight: 600, color: "hsl(var(--text-main))" }}>{m.qty}</span>
                          {" "}
                          <span style={{ fontSize: 11, color: "hsl(var(--text-muted))" }}>{prod?.unidad}</span>
                        </td>
                        <td style={{ padding: "11px 14px", textAlign: "center" }}>
                          <span style={{ fontWeight: 700, color: "hsl(var(--navy))", fontVariantNumeric: "tabular-nums" }}>
                            {formatCurrency(valor)}
                          </span>
                        </td>
                        <td style={{ padding: "11px 14px", maxWidth: 200 }}>
                          {m.notes
                            ? <span style={{ fontSize: 12, color: "hsl(var(--text-sub))" }}>{m.notes}</span>
                            : <span style={{ fontSize: 12, color: "hsl(var(--text-muted))", fontStyle: "italic" }}>Sin notas</span>
                          }
                        </td>
                        <td style={{ padding: "11px 14px" }}>
                          <button
                            onClick={() => confirmDelete(m)}
                            style={{
                              display: "flex", alignItems: "center", justifyContent: "center",
                              width: 28, height: 28, borderRadius: 6, border: "none",
                              backgroundColor: "hsl(var(--terracota) / 0.1)",
                              color: "hsl(var(--terracota))", cursor: "pointer",
                            }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {consumos.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ padding: 48, textAlign: "center", color: "hsl(var(--text-muted))", fontSize: 14 }}>
                        Sin consumos registrados
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ── Tab Merma ───────────────────────────────── */}
      {tab === "merma" && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: "hsl(var(--text-sub))" }}>
              <strong>{mermas.length}</strong> registros · Valor perdido:{" "}
              <strong style={{ color: "hsl(var(--terracota))" }}>{formatCurrency(totalMermaValue)}</strong>
            </div>
            <button
              onClick={() => setModal("merma")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "9px 16px",
                borderRadius: 8,
                border: "none",
                backgroundColor: "hsl(var(--terracota))",
                color: "white",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              <Plus size={14} />
              Registrar Merma
            </button>
          </div>

          <div style={{
            backgroundColor: "hsl(var(--surface))",
            borderRadius: 10,
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            overflow: "hidden",
          }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ backgroundColor: "hsl(var(--surface-alt))" }}>
                    {["Fecha", "Producto", "Cantidad", "Tipo", "Valor Perdido", "Motivo", ""].map((h) => (
                      <th key={h} style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {mermas.map((m, i) => {
                    const prod = (m as any).productos ?? (m as any).producto;
                    const cat = prod?.categorias ?? prod?.categoria;
                    return (
                      <tr
                        key={m.id}
                        style={{
                          borderBottom: "1px solid hsl(var(--border))",
                          backgroundColor: i % 2 === 0 ? "hsl(var(--surface))" : "hsl(var(--surface-alt))",
                        }}
                      >
                        <td style={{ padding: "11px 14px", fontSize: 12, color: "hsl(var(--text-main))", whiteSpace: "nowrap" }}>
                          {formatDate(m.fecha)}
                        </td>
                        <td style={{ padding: "11px 14px" }}>
                          <div style={{ fontWeight: 600, fontSize: 13, color: "hsl(var(--text-main))", marginBottom: 3 }}>
                            {prod?.nombre ?? "—"}
                          </div>
                          <CategoryBadge cat={cat} />
                        </td>
                        <td style={{ padding: "11px 14px", textAlign: "center" }}>
                          <span style={{ fontWeight: 600, color: "hsl(var(--text-main))" }}>{m.qty}</span>
                          {" "}
                          <span style={{ fontSize: 11, color: "hsl(var(--text-muted))" }}>{prod?.unidad}</span>
                        </td>
                        <td style={{ padding: "11px 14px" }}>
                          {m.motivo_merma ? <MermaBadge tipo={m.motivo_merma} /> : "—"}
                        </td>
                        <td style={{ padding: "11px 14px", textAlign: "right" }}>
                          <span style={{ fontWeight: 700, color: "hsl(var(--terracota))", fontVariantNumeric: "tabular-nums" }}>
                            {formatCurrency(Number(m.value_lost ?? 0))}
                          </span>
                        </td>
                        <td style={{ padding: "11px 14px", maxWidth: 200 }}>
                          {m.notes
                            ? <span style={{ fontSize: 12, color: "hsl(var(--text-sub))" }}>{m.notes}</span>
                            : <span style={{ fontSize: 12, color: "hsl(var(--text-muted))", fontStyle: "italic" }}>Sin notas</span>
                          }
                        </td>
                        <td style={{ padding: "11px 14px" }}>
                          <button
                            onClick={() => confirmDelete(m)}
                            style={{
                              display: "flex", alignItems: "center", justifyContent: "center",
                              width: 28, height: 28, borderRadius: 6, border: "none",
                              backgroundColor: "hsl(var(--terracota) / 0.1)",
                              color: "hsl(var(--terracota))", cursor: "pointer",
                            }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {mermas.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ padding: 48, textAlign: "center", color: "hsl(var(--text-muted))", fontSize: 14 }}>
                        Sin mermas registradas
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Modales */}
      <ConsumoModal
        open={modal === "consumo"}
        productos={productos}
        onClose={() => setModal(null)}
        onSuccess={(m) => { handleConsumoSuccess(m); setModal(null); }}
      />

      <MermaModal
        open={modal === "merma"}
        productos={productos}
        onClose={() => setModal(null)}
        onSuccess={(m) => { handleMermaSuccess(m); setModal(null); }}
      />

      <SalidaDeleteModal
        movimiento={deleteTarget}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
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
