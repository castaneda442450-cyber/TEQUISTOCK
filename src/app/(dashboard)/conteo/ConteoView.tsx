"use client";

import { useState, useMemo, useTransition } from "react";
import { useIsTablet } from "@/hooks/useIsTablet";
import { sileo } from "sileo";
import {
  CheckCircle,
  AlertTriangle,
  Loader2,
  Clock3,
  CalendarDays,
  CalendarRange,
  Check,
} from "lucide-react";
import { getProductosDeZona, procesarConteo } from "@/lib/actions/zonas.actions";
import { getZonaIcon } from "./zonaIcons";
import type { Zona, ConteoSesion, ConteoResumen } from "@/types";

interface Props {
  zonas: Zona[];
  onVolverALista: () => void;
}

type Frecuencia = "diario" | "semanal" | "mensual";

const FRECUENCIA_OPTS: { value: Frecuencia; label: string; desc: string; icon: typeof Clock3 }[] = [
  { value: "diario", label: "Diario", desc: "Productos de rotación diaria", icon: Clock3 },
  { value: "semanal", label: "Semanal", desc: "Productos de rotación semanal", icon: CalendarDays },
  { value: "mensual", label: "Mensual", desc: "Productos de rotación mensual", icon: CalendarRange },
];

type SemaforoColor = "sin-dato" | "verde" | "amarillo" | "rojo";

const SEMAFORO: Record<SemaforoColor, { bg: string; text: string }> = {
  "sin-dato": { bg: "transparent", text: "#B0A89E" },
  verde: { bg: "#EAF3DE", text: "#27500A" },
  amarillo: { bg: "#FAEEDA", text: "#633806" },
  rojo: { bg: "#FCEBEB", text: "#791F1F" },
};

function semaforoDeDiff(fisicaNum: number | null, stockActual: number): SemaforoColor {
  if (fisicaNum === null) return "sin-dato";
  const diff = fisicaNum - stockActual;
  if (diff >= 0) return "verde";
  const pct = stockActual > 0 ? Math.abs(diff) / stockActual : 1;
  if (pct <= 0.05) return "verde";
  if (pct <= 0.15) return "amarillo";
  return "rojo";
}

export default function ConteoView({ zonas, onVolverALista }: Props) {
  const isTablet = useIsTablet();
  const zonasActivas = useMemo(() => zonas.filter((z) => z.activo), [zonas]);

  const [paso, setPaso] = useState<1 | 2>(1);
  const [zonaId, setZonaId] = useState<string | null>(zonasActivas[0]?.id ?? null);
  const [frecuencia, setFrecuencia] = useState<Frecuencia>("diario");
  const [sesion, setSesion] = useState<ConteoSesion | null>(null);
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [mostrarResumen, setMostrarResumen] = useState(false);
  const [warningSinProductos, setWarningSinProductos] = useState(false);
  const [resumenFinal, setResumenFinal] = useState<ConteoResumen | null>(null);
  const [isPendingIniciar, startIniciarTransition] = useTransition();
  const [isPendingAplicar, startAplicarTransition] = useTransition();

  const zonaSeleccionada = zonasActivas.find((z) => z.id === zonaId) ?? null;
  const productosZona = zonaSeleccionada?.productos ?? [];

  const countsPorFrecuencia = useMemo(() => {
    const counts: Record<Frecuencia, number> = { diario: 0, semanal: 0, mensual: 0 };
    productosZona.forEach((p) => {
      counts[p.frecuencia_conteo] = (counts[p.frecuencia_conteo] ?? 0) + 1;
    });
    return counts;
  }, [productosZona]);

  const computedItems = useMemo(() => {
    if (!sesion) return [];
    return sesion.items.map((item) => {
      const raw = inputs[item.product_id] ?? "";
      const fisicaNum = raw === "" ? null : parseFloat(raw);
      const diff = fisicaNum === null ? null : fisicaNum - item.stock_actual;
      const semaforoColor = semaforoDeDiff(fisicaNum, item.stock_actual);
      return { item, raw, fisicaNum, diff, semaforoColor };
    });
  }, [sesion, inputs]);

  const resumenPreview = useMemo(() => {
    let entradas = 0;
    let salidas = 0;
    let sin_cambio = 0;
    let sin_contar = 0;
    computedItems.forEach((r) => {
      if (r.fisicaNum === null) sin_contar++;
      else if (r.diff! > 0) entradas++;
      else if (r.diff! < 0) salidas++;
      else sin_cambio++;
    });
    return { ajustados: entradas + salidas, entradas, salidas, sin_cambio, sin_contar };
  }, [computedItems]);

  function resetAPaso1() {
    setPaso(1);
    setSesion(null);
    setInputs({});
    setMostrarResumen(false);
    setWarningSinProductos(false);
    setResumenFinal(null);
  }

  function handleIniciarConteo() {
    if (!zonaSeleccionada) return;
    if (countsPorFrecuencia[frecuencia] === 0) {
      setWarningSinProductos(true);
      return;
    }
    setWarningSinProductos(false);
    startIniciarTransition(async () => {
      const res = await getProductosDeZona(zonaSeleccionada.id, frecuencia);
      if (res.error) {
        sileo.error({ title: res.error });
        return;
      }
      if (res.data.length === 0) {
        setWarningSinProductos(true);
        return;
      }
      setSesion({ zona_id: zonaSeleccionada.id, frecuencia, items: res.data });
      setInputs({});
      setMostrarResumen(false);
      setPaso(2);
    });
  }

  function handleBotonPrincipal() {
    if (!mostrarResumen) {
      setMostrarResumen(true);
      return;
    }
    if (!sesion) return;
    const items = computedItems
      .filter((r) => r.fisicaNum !== null)
      .map((r) => ({ product_id: r.item.product_id, cantidad_contada: r.fisicaNum! }));
    if (items.length === 0) return;

    startAplicarTransition(async () => {
      const res = await procesarConteo({
        zona_id: sesion.zona_id,
        frecuencia: sesion.frecuencia,
        items,
        total_productos: sesion.items.length,
      });
      if (res.error) {
        sileo.error({ title: res.error });
        return;
      }
      setResumenFinal(res.resumen!);
    });
  }

  const btnAplicarDisabled =
    isPendingAplicar || (mostrarResumen && resumenPreview.sin_contar === sesion?.items.length);

  return (
    <div>
      {/* Barra de pasos */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <StepPill num={1} label="Zona y temporalidad" active={paso === 1} done={paso === 2} />
          <div style={{ flex: 1, maxWidth: 60, height: 2, background: "hsl(var(--border))" }} />
          <StepPill num={2} label="Contar y confirmar" active={paso === 2} done={false} />
        </div>
        <button
          onClick={onVolverALista}
          disabled={isPendingAplicar}
          style={{
            background: "none",
            border: "none",
            color: "hsl(var(--text-sub))",
            fontSize: 13,
            fontWeight: 600,
            cursor: isPendingAplicar ? "not-allowed" : "pointer",
            fontFamily: "inherit",
          }}
        >
          ← Volver a zonas
        </button>
      </div>

      {paso === 1 && (
        <div>
          {zonasActivas.length === 0 ? (
            <div
              style={{
                padding: "40px 24px",
                textAlign: "center",
                background: "hsl(var(--surface))",
                border: "1px dashed hsl(var(--border-strong))",
                borderRadius: 10,
                color: "hsl(var(--text-sub))",
                fontSize: 14,
              }}
            >
              No hay zonas activas. Crea una zona primero.
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 20 }}>
                <label style={sectionLabelStyle}>Elige una zona</label>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                    gap: 10,
                  }}
                >
                  {zonasActivas.map((z) => {
                    const Icon = getZonaIcon(z.icono);
                    const selected = z.id === zonaId;
                    return (
                      <div
                        key={z.id}
                        onClick={() => setZonaId(z.id)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "10px 14px",
                          borderRadius: 10,
                          border: `1.5px solid ${selected ? "hsl(var(--terracota))" : "hsl(var(--border))"}`,
                          background: selected ? "hsl(var(--terracota) / 0.06)" : "hsl(var(--surface))",
                          cursor: "pointer",
                          transition: "border-color 0.15s, background 0.15s",
                        }}
                      >
                        <div
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: 8,
                            background: `${z.color}22`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <Icon size={16} style={{ color: z.color }} />
                        </div>
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: "hsl(var(--text-main))",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {z.nombre}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={sectionLabelStyle}>Temporalidad</label>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: isTablet ? "1fr" : "repeat(3, 1fr)",
                    gap: 10,
                  }}
                >
                  {FRECUENCIA_OPTS.map((opt) => {
                    const selected = frecuencia === opt.value;
                    const count = countsPorFrecuencia[opt.value];
                    const Icon = opt.icon;
                    return (
                      <div
                        key={opt.value}
                        onClick={() => setFrecuencia(opt.value)}
                        style={{
                          padding: 14,
                          borderRadius: 10,
                          border: `1.5px solid ${selected ? "hsl(var(--terracota))" : "hsl(var(--border))"}`,
                          background: selected ? "hsl(var(--terracota) / 0.06)" : "hsl(var(--surface))",
                          cursor: "pointer",
                          transition: "border-color 0.15s, background 0.15s",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                          <Icon size={16} style={{ color: selected ? "hsl(var(--terracota))" : "hsl(var(--text-sub))" }} />
                          <span style={{ fontSize: 14, fontWeight: 700, color: "hsl(var(--text-main))" }}>
                            {opt.label}
                          </span>
                        </div>
                        <p style={{ margin: "0 0 8px", fontSize: 12, color: "hsl(var(--text-sub))" }}>{opt.desc}</p>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "hsl(var(--text-main))", fontVariantNumeric: "tabular-nums" }}>
                          {count} producto{count !== 1 ? "s" : ""}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {zonaSeleccionada && (
                <p style={{ fontSize: 14, color: "hsl(var(--text-sub))", marginBottom: 16 }}>
                  Vas a contar <strong style={{ color: "hsl(var(--text-main))" }}>{countsPorFrecuencia[frecuencia]}</strong> productos{" "}
                  {frecuencia === "diario" ? "diarios" : frecuencia === "semanal" ? "semanales" : "mensuales"} en{" "}
                  <strong style={{ color: "hsl(var(--text-main))" }}>{zonaSeleccionada.nombre}</strong>
                </p>
              )}

              {warningSinProductos && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "10px 14px",
                    background: "#FAEEDA",
                    border: "1px solid #E8C98A",
                    borderRadius: 8,
                    marginBottom: 16,
                    fontSize: 13,
                    color: "#633806",
                  }}
                >
                  <AlertTriangle size={15} />
                  No hay productos {frecuencia === "diario" ? "diarios" : frecuencia === "semanal" ? "semanales" : "mensuales"} asignados a esta zona
                </div>
              )}

              <button
                disabled={!zonaSeleccionada || isPendingIniciar}
                onClick={handleIniciarConteo}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "11px 22px",
                  borderRadius: 8,
                  border: "none",
                  background: !zonaSeleccionada ? "hsl(var(--border))" : "hsl(var(--terracota))",
                  color: !zonaSeleccionada ? "hsl(var(--text-muted))" : "white",
                  fontSize: 14,
                  fontWeight: 700,
                  fontFamily: "inherit",
                  cursor: !zonaSeleccionada ? "not-allowed" : "pointer",
                }}
              >
                {isPendingIniciar && <Loader2 size={15} style={{ animation: "spin 0.7s linear infinite" }} />}
                Iniciar conteo →
              </button>
            </>
          )}
        </div>
      )}

      {paso === 2 && sesion && (
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 14px",
              background: "hsl(var(--surface-alt))",
              borderRadius: 8,
              marginBottom: 16,
              fontSize: 13,
              color: "hsl(var(--text-sub))",
            }}
          >
            <strong style={{ color: "hsl(var(--text-main))" }}>{zonaSeleccionada?.nombre}</strong>
            <span>·</span>
            <span>
              {sesion.frecuencia === "diario" ? "Diario" : sesion.frecuencia === "semanal" ? "Semanal" : "Mensual"}
            </span>
          </div>

          <div
            style={{
              background: "hsl(var(--surface))",
              borderRadius: 10,
              border: "1.5px solid hsl(var(--border))",
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
              overflow: "hidden",
              marginBottom: 16,
            }}
          >
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 560 }}>
                <thead>
                  <tr style={{ backgroundColor: "hsl(var(--surface-alt))", borderBottom: "1.5px solid hsl(var(--border))" }}>
                    {["Producto", "Sistema", "Físico ahora", "Diferencia"].map((col) => (
                      <th
                        key={col}
                        style={{
                          padding: "10px 14px",
                          textAlign: col === "Producto" ? "left" : "center",
                          fontSize: 11,
                          fontWeight: 700,
                          letterSpacing: "0.4px",
                          color: "hsl(var(--text-sub))",
                          textTransform: "uppercase",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {computedItems.map((r, i) => {
                    const sem = SEMAFORO[r.semaforoColor];
                    return (
                      <tr
                        key={r.item.product_id}
                        style={{
                          backgroundColor: i % 2 === 0 ? "hsl(var(--surface))" : "hsl(var(--surface-alt))",
                          borderBottom: "1px solid hsl(var(--border))",
                        }}
                      >
                        <td style={{ padding: "10px 14px" }}>
                          <span style={{ fontSize: 14, fontWeight: 600, color: "hsl(var(--text-main))" }}>{r.item.nombre}</span>
                          <span style={{ display: "block", fontSize: 11, color: "hsl(var(--text-muted))", marginTop: 1 }}>
                            {r.item.unidad}
                          </span>
                        </td>
                        <td style={{ padding: "10px 14px", textAlign: "center" }}>
                          <span style={{ fontSize: 15, fontWeight: 700, fontVariantNumeric: "tabular-nums", color: "hsl(var(--text-main))" }}>
                            {r.item.stock_actual}
                          </span>
                        </td>
                        <td style={{ padding: "8px 14px", textAlign: "center", minWidth: 130 }}>
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            placeholder="—"
                            disabled={isPendingAplicar}
                            value={r.raw}
                            onChange={(e) =>
                              setInputs((prev) => ({ ...prev, [r.item.product_id]: e.target.value }))
                            }
                            style={{
                              width: "100%",
                              padding: "6px 10px",
                              borderRadius: 8,
                              borderWidth: "1.5px",
                              borderStyle: "solid",
                              borderColor: "hsl(var(--border))",
                              backgroundColor: isPendingAplicar ? "hsl(var(--surface-alt))" : "hsl(var(--surface))",
                              color: "hsl(var(--text-main))",
                              fontSize: 14,
                              fontFamily: "inherit",
                              outline: "none",
                              opacity: isPendingAplicar ? 0.6 : 1,
                            }}
                          />
                        </td>
                        <td style={{ padding: "8px 14px", textAlign: "center" }}>
                          {r.fisicaNum === null ? (
                            <span style={{ color: sem.text, fontSize: 13 }}>—</span>
                          ) : (
                            <span
                              style={{
                                display: "inline-block",
                                backgroundColor: sem.bg,
                                color: sem.text,
                                borderRadius: 6,
                                padding: "3px 10px",
                                fontSize: 13,
                                fontWeight: 700,
                                fontVariantNumeric: "tabular-nums",
                              }}
                            >
                              {r.diff! >= 0 ? "+" : "−"}
                              {Math.abs(r.diff!).toFixed(1)} {r.item.unidad}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {mostrarResumen && (
              <div style={{ borderTop: "1.5px solid hsl(var(--border))", padding: "16px 20px", background: "hsl(var(--surface-alt))" }}>
                <h3 style={{ margin: "0 0 10px", fontSize: 14, fontWeight: 700, color: "hsl(var(--text-main))" }}>
                  Resumen del conteo
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {computedItems.map((r) => {
                    const badge =
                      r.fisicaNum === null
                        ? { label: "Sin contar", bg: "hsl(var(--text-muted) / 0.15)", color: "hsl(var(--text-muted))" }
                        : r.diff! > 0
                          ? { label: "Entrada", bg: "hsl(var(--green) / 0.15)", color: "hsl(var(--green))" }
                          : r.diff! < 0
                            ? { label: "Salida", bg: "hsl(var(--terracota) / 0.15)", color: "hsl(var(--terracota))" }
                            : { label: "Sin cambio", bg: "hsl(var(--text-muted) / 0.15)", color: "hsl(var(--text-sub))" };
                    return (
                      <div
                        key={r.item.product_id}
                        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 0", fontSize: 13 }}
                      >
                        <span style={{ color: "hsl(var(--text-main))" }}>{r.item.nombre}</span>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ color: "hsl(var(--text-sub))", fontVariantNumeric: "tabular-nums" }}>
                            {r.item.stock_actual} → {r.fisicaNum ?? r.item.stock_actual}
                          </span>
                          <span
                            style={{
                              padding: "2px 8px",
                              borderRadius: 99,
                              fontSize: 11,
                              fontWeight: 600,
                              background: badge.bg,
                              color: badge.color,
                            }}
                          >
                            {badge.label}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {resumenPreview.sin_contar > 0 && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "10px 14px",
                      background: "#FAEEDA",
                      border: "1px solid #E8C98A",
                      borderRadius: 8,
                      marginTop: 12,
                      fontSize: 13,
                      color: "#633806",
                    }}
                  >
                    <AlertTriangle size={15} />
                    {resumenPreview.sin_contar} producto{resumenPreview.sin_contar !== 1 ? "s" : ""} sin contar — quedarán sin ajustar
                  </div>
                )}
              </div>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <button
              onClick={resetAPaso1}
              disabled={isPendingAplicar}
              style={{
                padding: "9px 18px",
                borderRadius: 8,
                border: "1.5px solid hsl(var(--border))",
                background: "hsl(var(--surface))",
                color: "hsl(var(--text-main))",
                fontSize: 14,
                fontWeight: 600,
                fontFamily: "inherit",
                cursor: isPendingAplicar ? "not-allowed" : "pointer",
              }}
            >
              ← Cambiar zona
            </button>
            <button
              onClick={handleBotonPrincipal}
              disabled={btnAplicarDisabled}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 22px",
                borderRadius: 8,
                border: "none",
                background: btnAplicarDisabled
                  ? "hsl(var(--border))"
                  : mostrarResumen
                    ? "#106653"
                    : "hsl(var(--terracota))",
                color: btnAplicarDisabled ? "hsl(var(--text-muted))" : "white",
                fontSize: 14,
                fontWeight: 700,
                fontFamily: "inherit",
                cursor: btnAplicarDisabled ? "not-allowed" : "pointer",
              }}
            >
              {isPendingAplicar && <Loader2 size={15} style={{ animation: "spin 0.7s linear infinite" }} />}
              {isPendingAplicar ? "Aplicando..." : mostrarResumen ? "✓ Aplicar ajustes" : "Ver resumen"}
            </button>
          </div>
        </div>
      )}

      {/* ══ ÉXITO ══ */}
      {resumenFinal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
            backgroundColor: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            style={{
              backgroundColor: "hsl(var(--surface))",
              borderRadius: 12,
              boxShadow: "0 32px 80px rgba(0,0,0,0.28)",
              maxWidth: isTablet ? "calc(100% - 24px)" : 440,
              width: "100%",
              animation: "modalIn 0.18s ease-out",
              padding: "32px 28px 24px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: "50%",
                backgroundColor: "#EAF3DE",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
              }}
            >
              <CheckCircle size={30} color="#106653" />
            </div>
            <h2 style={{ margin: "0 0 6px", fontSize: 19, fontWeight: 800, color: "hsl(var(--text-main))" }}>
              ¡Conteo aplicado!
            </h2>
            <p style={{ margin: "0 0 20px", fontSize: 13, color: "hsl(var(--text-sub))" }}>
              Los ajustes se registraron en el inventario
            </p>

            <div style={{ backgroundColor: "hsl(var(--surface-alt))", borderRadius: 10, padding: "14px 16px", textAlign: "left", marginBottom: 20 }}>
              <ResumenRow label="Ajustes aplicados" value={resumenFinal.ajustados} />
              <ResumenRow label="Entradas" value={resumenFinal.entradas} />
              <ResumenRow label="Salidas" value={resumenFinal.salidas} />
              <ResumenRow label="Sin cambio" value={resumenFinal.sin_cambio} />
              <ResumenRow label="Sin contar" value={resumenFinal.sin_contar} last />
            </div>

            <button
              onClick={resetAPaso1}
              style={{
                width: "100%",
                padding: "11px 0",
                borderRadius: 8,
                border: "none",
                backgroundColor: "hsl(var(--terracota))",
                color: "white",
                fontSize: 15,
                fontWeight: 700,
                fontFamily: "inherit",
                cursor: "pointer",
              }}
            >
              Hacer otro conteo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ResumenRow({ label, value, last }: { label: string; value: number; last?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "5px 0",
        borderBottom: last ? "none" : "1px solid hsl(var(--border))",
      }}
    >
      <span style={{ fontSize: 13, color: "hsl(var(--text-sub))" }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: "hsl(var(--text-main))", fontVariantNumeric: "tabular-nums" }}>
        {value}
      </span>
    </div>
  );
}

function StepPill({ num, label, active, done }: { num: number; label: string; active: boolean; done: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div
        style={{
          width: 24,
          height: 24,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 12,
          fontWeight: 700,
          flexShrink: 0,
          background: done ? "#106653" : active ? "hsl(var(--terracota))" : "hsl(var(--surface-alt))",
          color: done || active ? "white" : "hsl(var(--text-muted))",
          border: done || active ? "none" : "1.5px solid hsl(var(--border))",
        }}
      >
        {done ? <Check size={13} /> : num}
      </div>
      <span
        style={{
          fontSize: 13,
          fontWeight: active ? 700 : 500,
          color: active ? "hsl(var(--text-main))" : "hsl(var(--text-sub))",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </span>
    </div>
  );
}

const sectionLabelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: "0.4px",
  textTransform: "uppercase",
  color: "hsl(var(--text-sub))",
  marginBottom: 8,
};
