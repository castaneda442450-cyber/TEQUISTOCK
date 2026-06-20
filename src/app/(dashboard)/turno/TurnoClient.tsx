"use client";

import { useState, useMemo, useTransition } from "react";
import { sileo } from "sileo";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CheckCircle, AlertTriangle, Loader2 } from "lucide-react";
import { createCierreTurno } from "@/lib/actions/turno.actions";
import { formatCurrency } from "@/lib/format";
import type { Producto, CierreTurnoResumen } from "@/types";

interface Props {
  productos: Producto[];
}

type InputRow = { consumido: string; fisica: string };

type SemaforoColor = "sin-dato" | "verde" | "amarillo" | "rojo";

const SEMAFORO: Record<SemaforoColor, { bg: string; text: string }> = {
  "sin-dato": { bg: "transparent",  text: "#B0A89E" },
  verde:      { bg: "#EAF3DE",      text: "#27500A" },
  amarillo:   { bg: "#FAEEDA",      text: "#633806" },
  rojo:       { bg: "#FCEBEB",      text: "#791F1F" },
};

function getTurnoLabel(hora: number): string {
  if (hora >= 5  && hora < 12) return "Mañana";
  if (hora >= 12 && hora < 19) return "Tarde";
  return "Noche";
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function formatDiferencia(diff: number, unidad: string): string {
  const signo = diff >= 0 ? "+" : "−";
  return `${signo}${Math.abs(diff).toFixed(1)} ${unidad}`;
}

const inputBaseStyle: React.CSSProperties = {
  width: "100%",
  padding: "6px 10px",
  borderRadius: 8,
  borderWidth: "1.5px",
  borderStyle: "solid",
  borderColor: "hsl(var(--border))",
  backgroundColor: "hsl(var(--surface))",
  color: "hsl(var(--text-main))",
  fontSize: 14,
  fontFamily: "inherit",
  outline: "none",
  transition: "border-color 0.15s, box-shadow 0.15s",
};

const inputErrorStyle: React.CSSProperties = {
  ...inputBaseStyle,
  borderColor: "#BA3026",
  boxShadow: "0 0 0 3px #BA302622",
};

const inputDisabledStyle: React.CSSProperties = {
  ...inputBaseStyle,
  opacity: 0.45,
  cursor: "not-allowed",
  backgroundColor: "hsl(var(--surface-alt))",
};

export default function TurnoClient({ productos }: Props) {
  const [inputs, setInputs] = useState<Record<string, InputRow>>({});
  const [modalConfirm, setModalConfirm] = useState(false);
  const [modalExito, setModalExito] = useState(false);
  const [resumen, setResumen] = useState<CierreTurnoResumen | null>(null);
  const [isPending, startTransition] = useTransition();

  const now = new Date();
  const turnoLabel = getTurnoLabel(now.getHours());
  const fechaLabel = capitalize(format(now, "EEEE d 'de' MMMM", { locale: es }));

  const computed = useMemo(() => {
    return productos.map((prod) => {
      const row = inputs[prod.id] ?? { consumido: "", fisica: "" };

      const consumidoNum = row.consumido === "" ? null : parseFloat(row.consumido);
      const fisicaNum    = row.fisica    === "" ? null : parseFloat(row.fisica);

      const stockTeorico =
        consumidoNum !== null ? prod.stock_actual - consumidoNum : null;

      const diferencia =
        fisicaNum !== null && stockTeorico !== null
          ? fisicaNum - stockTeorico
          : null;

      let diferenciaPct: number | null = null;
      if (diferencia !== null && stockTeorico !== null && stockTeorico > 0) {
        diferenciaPct = diferencia / stockTeorico;
      }

      const errConsumo =
        consumidoNum !== null && consumidoNum > prod.stock_actual;

      const errFisica =
        fisicaNum !== null &&
        stockTeorico !== null &&
        fisicaNum > stockTeorico;

      let semaforoColor: SemaforoColor = "sin-dato";
      if (diferencia !== null && stockTeorico !== null) {
        if (stockTeorico === 0) {
          // Edge case: all consumed — física must be 0
          semaforoColor = fisicaNum === 0 ? "verde" : "rojo";
        } else if (diferenciaPct !== null) {
          if (diferenciaPct >= -0.05)       semaforoColor = "verde";
          else if (diferenciaPct >= -0.15)  semaforoColor = "amarillo";
          else                              semaforoColor = "rojo";
        }
      }

      const llenado = row.consumido !== "" && row.fisica !== "";

      return {
        prod,
        row,
        consumidoNum,
        fisicaNum,
        stockTeorico,
        diferencia,
        errConsumo,
        errFisica,
        semaforoColor,
        llenado,
      };
    });
  }, [inputs, productos]);

  const totalLlenados           = computed.filter((r) => r.llenado).length;
  const hayErrores              = computed.some((r) => r.errConsumo || r.errFisica);
  const totalConsumoValor       = computed.reduce((s, r) => s + (r.consumidoNum ?? 0) * r.prod.last_price, 0);
  const diferenciaRoja          = computed.filter((r) => r.semaforoColor === "rojo" && r.diferencia !== null);
  const productosBajoMinimoCount = computed.filter(
    (r) => r.stockTeorico !== null && r.stockTeorico < r.prod.stock_minimo,
  ).length;

  const btnDisabled  = totalLlenados < productos.length || hayErrores || isPending;
  const progresoPct  = productos.length > 0 ? (totalLlenados / productos.length) * 100 : 0;

  function setRow(id: string, field: "consumido" | "fisica", value: string) {
    setInputs((prev) => {
      const cur = prev[id] ?? { consumido: "", fisica: "" };
      const next = { ...cur, [field]: value };
      // Reset física when consumido is cleared
      if (field === "consumido" && value === "") {
        next.fisica = "";
      }
      return { ...prev, [id]: next };
    });
  }

  function ejecutarCierre() {
    startTransition(async () => {
      const items = computed.map((r) => ({
        product_id:    r.prod.id,
        qty_consumida: r.consumidoNum!,
        qty_fisica:    r.fisicaNum!,
        stock_actual:  r.prod.stock_actual,
        // notas: omitted intentionally for launch simplicity
      }));

      const res = await createCierreTurno({ items, tipo: "diario", fecha: new Date().toISOString().split("T")[0] });
      if (res.error) {
        sileo.error({ title: res.error });
        return;
      }
      setResumen(res.resumen!);
      setModalConfirm(false);
      setModalExito(true);
    });
  }

  function handleCerrarTurno() {
    if (diferenciaRoja.length > 0) {
      setModalConfirm(true);
    } else {
      ejecutarCierre();
    }
  }

  function handleAceptarExito() {
    setInputs({});
    setModalExito(false);
    setResumen(null);
  }

  const statusText = hayErrores
    ? "Corrige los errores antes de cerrar"
    : totalLlenados < productos.length
      ? `Faltan ${productos.length - totalLlenados} producto${productos.length - totalLlenados !== 1 ? "s" : ""} por llenar`
      : "Todo listo — puedes cerrar el turno";

  const statusColor = hayErrores
    ? "#BA3026"
    : totalLlenados < productos.length
      ? "hsl(var(--text-sub))"
      : "#106653";

  // ───────── RENDER ─────────
  return (
    <div style={{ padding: "28px 32px", maxWidth: 1100, margin: "0 auto" }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "hsl(var(--text-main))", margin: 0, letterSpacing: "-0.02em" }}>
              Cierre de turno — {turnoLabel}
            </h1>
            <p style={{ fontSize: 14, color: "hsl(var(--text-sub))", margin: "4px 0 0" }}>
              {fechaLabel}
            </p>
          </div>
          <span style={{
            backgroundColor: "#0B455522",
            color: "#0B4455",
            border: "1px solid #0B455540",
            borderRadius: 99,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.4px",
            padding: "4px 14px",
            textTransform: "uppercase",
          }}>
            Conteo diario
          </span>
        </div>

        {/* Progress */}
        <div style={{ marginTop: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 13, color: "hsl(var(--text-sub))", fontWeight: 500 }}>
              Progreso de llenado
            </span>
            <span style={{ fontSize: 13, fontWeight: 700, color: "hsl(var(--text-main))" }}>
              {totalLlenados} / {productos.length} productos
            </span>
          </div>
          <div style={{ height: 6, borderRadius: 99, backgroundColor: "hsl(var(--surface-alt))", overflow: "hidden" }}>
            <div style={{
              height: "100%",
              borderRadius: 99,
              backgroundColor: progresoPct === 100 ? "#106653" : "hsl(var(--terracota))",
              width: `${progresoPct}%`,
              transition: "width 0.3s ease, background-color 0.3s ease",
            }} />
          </div>
        </div>
      </div>

      {/* ── Empty state ── */}
      {productos.length === 0 && (
        <div style={{
          textAlign: "center",
          padding: "60px 24px",
          color: "hsl(var(--text-muted))",
          backgroundColor: "hsl(var(--surface))",
          borderRadius: 10,
          border: "1.5px solid hsl(var(--border))",
        }}>
          <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>Sin productos para contar</p>
          <p style={{ fontSize: 13 }}>
            Asigna frecuencia "diario" a los productos que quieres incluir en el cierre de turno.
          </p>
        </div>
      )}

      {/* ── Table ── */}
      {productos.length > 0 && (
        <div style={{
          backgroundColor: "hsl(var(--surface))",
          borderRadius: 10,
          border: "1.5px solid hsl(var(--border))",
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          overflow: "hidden",
        }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 800 }}>
              <thead>
                <tr style={{ backgroundColor: "hsl(var(--surface-alt))", borderBottom: "1.5px solid hsl(var(--border))" }}>
                  {["Producto", "Categoría", "Stock sistema", "Consumido hoy", "Físico en almacén", "Diferencia"].map((col) => (
                    <th key={col} style={{
                      padding: "10px 14px",
                      textAlign: col === "Producto" || col === "Categoría" ? "left" : "center",
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: "0.4px",
                      color: "hsl(var(--text-sub))",
                      textTransform: "uppercase",
                      whiteSpace: "nowrap",
                    }}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {computed.map((r, i) => {
                  const { prod, row, consumidoNum, fisicaNum, stockTeorico, diferencia, errConsumo, errFisica, semaforoColor } = r;
                  const fisicaDisabled = row.consumido === "";
                  const cat = prod.categoria;
                  const sem = SEMAFORO[semaforoColor];

                  return (
                    <tr
                      key={prod.id}
                      style={{
                        backgroundColor: i % 2 === 0 ? "hsl(var(--surface))" : "hsl(var(--surface-alt))",
                        borderBottom: "1px solid hsl(var(--border))",
                        transition: "background-color 0.1s",
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "hsl(var(--surface-hover))"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = i % 2 === 0 ? "hsl(var(--surface))" : "hsl(var(--surface-alt))"; }}
                    >
                      {/* Producto */}
                      <td style={{ padding: "10px 14px" }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: "hsl(var(--text-main))" }}>
                          {prod.nombre}
                        </span>
                        <span style={{ display: "block", fontSize: 11, color: "hsl(var(--text-muted))", marginTop: 1 }}>
                          {prod.unidad}
                        </span>
                      </td>

                      {/* Categoría */}
                      <td style={{ padding: "10px 14px" }}>
                        {cat ? (
                          <span style={{
                            backgroundColor: `${cat.color}22`,
                            color: cat.color,
                            borderRadius: 99,
                            fontSize: 11,
                            fontWeight: 600,
                            padding: "2px 10px",
                            whiteSpace: "nowrap",
                          }}>
                            {cat.nombre}
                          </span>
                        ) : (
                          <span style={{ color: "hsl(var(--text-muted))", fontSize: 12 }}>—</span>
                        )}
                      </td>

                      {/* Stock sistema */}
                      <td style={{ padding: "10px 14px", textAlign: "center" }}>
                        <span style={{ fontSize: 15, fontWeight: 700, fontVariantNumeric: "tabular-nums", color: "hsl(var(--text-main))" }}>
                          {prod.stock_actual.toFixed(1)}
                        </span>
                        {consumidoNum !== null && stockTeorico !== null && (
                          <span style={{ display: "block", fontSize: 11, color: "hsl(var(--text-muted))", marginTop: 1 }}>
                            Quedará: {stockTeorico.toFixed(1)}
                          </span>
                        )}
                      </td>

                      {/* Consumido hoy */}
                      <td style={{ padding: "8px 14px", textAlign: "center", minWidth: 130 }}>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          placeholder="0"
                          value={row.consumido}
                          onChange={(e) => setRow(prod.id, "consumido", e.target.value)}
                          style={errConsumo ? inputErrorStyle : inputBaseStyle}
                        />
                        {consumidoNum !== null && !errConsumo && (
                          <span style={{ display: "block", fontSize: 11, color: "hsl(var(--text-muted))", marginTop: 3 }}>
                            Quedará: {(prod.stock_actual - consumidoNum).toFixed(1)} {prod.unidad}
                          </span>
                        )}
                        {errConsumo && (
                          <span style={{ display: "block", fontSize: 11, color: "#BA3026", marginTop: 3, fontWeight: 500 }}>
                            Supera el stock del sistema ({prod.stock_actual} {prod.unidad})
                          </span>
                        )}
                      </td>

                      {/* Físico en almacén */}
                      <td style={{ padding: "8px 14px", textAlign: "center", minWidth: 150 }}>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          placeholder={fisicaDisabled ? "—" : "Contar ahora"}
                          disabled={fisicaDisabled}
                          value={row.fisica}
                          onChange={(e) => setRow(prod.id, "fisica", e.target.value)}
                          style={fisicaDisabled ? inputDisabledStyle : errFisica ? inputErrorStyle : inputBaseStyle}
                        />
                        {stockTeorico !== null && !errFisica && (
                          <span style={{ display: "block", fontSize: 11, color: "hsl(var(--text-muted))", marginTop: 3 }}>
                            Máx teórico: {stockTeorico.toFixed(1)} {prod.unidad}
                          </span>
                        )}
                        {errFisica && stockTeorico !== null && (
                          <span style={{ display: "block", fontSize: 11, color: "#BA3026", marginTop: 3, fontWeight: 500 }}>
                            No puede ser mayor al stock teórico ({stockTeorico.toFixed(1)} {prod.unidad}). ¿Te equivocaste al contar?
                          </span>
                        )}
                      </td>

                      {/* Diferencia */}
                      <td style={{ padding: "8px 14px", textAlign: "center" }}>
                        {diferencia === null ? (
                          <span style={{ color: sem.text, fontSize: 13 }}>—</span>
                        ) : (
                          <span style={{
                            display: "inline-block",
                            backgroundColor: sem.bg,
                            color: sem.text,
                            borderRadius: 6,
                            padding: "3px 10px",
                            fontSize: 13,
                            fontWeight: 700,
                            fontVariantNumeric: "tabular-nums",
                          }}>
                            {formatDiferencia(diferencia, prod.unidad)}
                            {semaforoColor === "rojo" && (
                              <span style={{ display: "block", fontSize: 11, fontWeight: 500, marginTop: 1 }}>
                                (≈ {formatCurrency(Math.abs(diferencia) * prod.last_price)})
                              </span>
                            )}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ── Summary bar ── */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 28,
            padding: "14px 20px",
            borderTop: "1.5px solid hsl(var(--border))",
            backgroundColor: "hsl(var(--surface-alt))",
            flexWrap: "wrap",
          }}>
            <div>
              <span style={{ fontSize: 11, fontWeight: 600, color: "hsl(var(--text-muted))", textTransform: "uppercase", letterSpacing: "0.4px" }}>
                Valor consumido hoy
              </span>
              <p style={{ margin: "2px 0 0", fontSize: 15, fontWeight: 700, color: "hsl(var(--text-main))", fontVariantNumeric: "tabular-nums" }}>
                {formatCurrency(totalConsumoValor)}
              </p>
            </div>
            <div style={{ width: 1, height: 36, backgroundColor: "hsl(var(--border))" }} />
            <div>
              <span style={{ fontSize: 11, fontWeight: 600, color: "hsl(var(--text-muted))", textTransform: "uppercase", letterSpacing: "0.4px" }}>
                Diferencias detectadas
              </span>
              <p style={{ margin: "2px 0 0", fontSize: 15, fontWeight: 700, color: diferenciaRoja.length > 0 ? "#BA3026" : "hsl(var(--text-main))" }}>
                {diferenciaRoja.length}
              </p>
            </div>
            <div style={{ width: 1, height: 36, backgroundColor: "hsl(var(--border))" }} />
            <div>
              <span style={{ fontSize: 11, fontWeight: 600, color: "hsl(var(--text-muted))", textTransform: "uppercase", letterSpacing: "0.4px" }}>
                Quedarán bajo mínimo
              </span>
              <p style={{ margin: "2px 0 0", fontSize: 15, fontWeight: 700, color: productosBajoMinimoCount > 0 ? "#C2972E" : "hsl(var(--text-main))" }}>
                {productosBajoMinimoCount} producto{productosBajoMinimoCount !== 1 ? "s" : ""}
              </p>
            </div>
            <span style={{ fontSize: 10, color: "hsl(var(--text-muted))", marginLeft: "auto", fontStyle: "italic" }}>
              Cifras estimadas — se confirman al cerrar
            </span>
          </div>
        </div>
      )}

      {/* ── Footer ── */}
      {productos.length > 0 && (
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: 20,
          padding: "16px 20px",
          backgroundColor: "hsl(var(--surface))",
          borderRadius: 10,
          border: "1.5px solid hsl(var(--border))",
          flexWrap: "wrap",
          gap: 12,
        }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: statusColor }}>
            {statusText}
          </span>
          <button
            disabled={btnDisabled}
            onClick={handleCerrarTurno}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 22px",
              borderRadius: 8,
              border: "none",
              backgroundColor: btnDisabled ? "hsl(var(--border))" : "hsl(var(--terracota))",
              color: btnDisabled ? "hsl(var(--text-muted))" : "white",
              fontSize: 14,
              fontWeight: 700,
              fontFamily: "inherit",
              cursor: btnDisabled ? "not-allowed" : "pointer",
              transition: "background-color 0.15s, opacity 0.15s",
              opacity: isPending ? 0.8 : 1,
            }}
            onMouseEnter={(e) => {
              if (!btnDisabled) (e.currentTarget as HTMLElement).style.backgroundColor = "hsl(var(--terracota-dark))";
            }}
            onMouseLeave={(e) => {
              if (!btnDisabled) (e.currentTarget as HTMLElement).style.backgroundColor = "hsl(var(--terracota))";
            }}
          >
            {isPending && <Loader2 size={15} style={{ animation: "spin 0.7s linear infinite" }} />}
            {isPending ? "Cerrando turno..." : "Cerrar turno"}
          </button>
        </div>
      )}

      {/* ══ MODAL CONFIRMACIÓN ══ */}
      {modalConfirm && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 50, backgroundColor: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
          onClick={() => { if (!isPending) setModalConfirm(false); }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: "hsl(var(--surface))",
              borderRadius: 12,
              boxShadow: "0 32px 80px rgba(0,0,0,0.28)",
              maxWidth: 520,
              width: "100%",
              animation: "modalIn 0.18s ease-out",
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <div style={{ padding: "20px 24px 0", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: "#FCEBEB", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <AlertTriangle size={18} color="#BA3026" />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "hsl(var(--text-main))" }}>
                  Diferencias detectadas
                </h2>
                <p style={{ margin: "2px 0 0", fontSize: 13, color: "hsl(var(--text-sub))" }}>
                  Se crearán mermas automáticas por estas cantidades
                </p>
              </div>
            </div>

            {/* List */}
            <div style={{ padding: "16px 24px", maxHeight: 260, overflowY: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid hsl(var(--border))" }}>
                    {["Producto", "Diferencia", "Valor est."].map((h) => (
                      <th key={h} style={{ padding: "6px 8px", fontSize: 11, fontWeight: 700, color: "hsl(var(--text-muted))", textTransform: "uppercase", letterSpacing: "0.4px", textAlign: "left" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {diferenciaRoja.map((r) => (
                    <tr key={r.prod.id} style={{ borderBottom: "1px solid hsl(var(--border))" }}>
                      <td style={{ padding: "8px", fontSize: 13, fontWeight: 600, color: "hsl(var(--text-main))" }}>
                        {r.prod.nombre}
                      </td>
                      <td style={{ padding: "8px", fontSize: 13, color: "#791F1F", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                        {formatDiferencia(r.diferencia!, r.prod.unidad)}
                      </td>
                      <td style={{ padding: "8px", fontSize: 13, color: "hsl(var(--text-sub))", fontVariantNumeric: "tabular-nums" }}>
                        {formatCurrency(Math.abs(r.diferencia!) * r.prod.last_price)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Actions */}
            <div style={{ padding: "12px 24px 20px", display: "flex", gap: 10, justifyContent: "flex-end", borderTop: "1px solid hsl(var(--border))" }}>
              <button
                onClick={() => setModalConfirm(false)}
                disabled={isPending}
                style={{ padding: "9px 18px", borderRadius: 8, border: "1.5px solid hsl(var(--border))", backgroundColor: "hsl(var(--surface))", color: "hsl(var(--text-main))", fontSize: 14, fontWeight: 600, fontFamily: "inherit", cursor: "pointer" }}
              >
                Revisar
              </button>
              <button
                onClick={ejecutarCierre}
                disabled={isPending}
                style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 18px", borderRadius: 8, border: "none", backgroundColor: "hsl(var(--terracota))", color: "white", fontSize: 14, fontWeight: 700, fontFamily: "inherit", cursor: isPending ? "not-allowed" : "pointer", opacity: isPending ? 0.75 : 1 }}
              >
                {isPending && <Loader2 size={14} style={{ animation: "spin 0.7s linear infinite" }} />}
                {isPending ? "Cerrando..." : "Confirmar y cerrar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ MODAL ÉXITO ══ */}
      {modalExito && resumen && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 50, backgroundColor: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
        >
          <div
            style={{
              backgroundColor: "hsl(var(--surface))",
              borderRadius: 12,
              boxShadow: "0 32px 80px rgba(0,0,0,0.28)",
              maxWidth: 440,
              width: "100%",
              animation: "modalIn 0.18s ease-out",
              padding: "32px 28px 24px",
              textAlign: "center",
            }}
          >
            {/* Icon */}
            <div style={{ width: 60, height: 60, borderRadius: "50%", backgroundColor: "#EAF3DE", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <CheckCircle size={30} color="#106653" />
            </div>

            <h2 style={{ margin: "0 0 6px", fontSize: 19, fontWeight: 800, color: "hsl(var(--text-main))" }}>
              ¡Turno cerrado exitosamente!
            </h2>
            <p style={{ margin: "0 0 20px", fontSize: 13, color: "hsl(var(--text-sub))" }}>
              Los movimientos han sido registrados en el inventario
            </p>

            {/* Summary */}
            <div style={{ backgroundColor: "hsl(var(--surface-alt))", borderRadius: 10, padding: "14px 16px", textAlign: "left", marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid hsl(var(--border))" }}>
                <span style={{ fontSize: 13, color: "hsl(var(--text-sub))" }}>Valor consumido</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "hsl(var(--text-main))", fontVariantNumeric: "tabular-nums" }}>
                  {formatCurrency(resumen.total_consumido_valor)}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid hsl(var(--border))" }}>
                <span style={{ fontSize: 13, color: "hsl(var(--text-sub))" }}>Mermas registradas</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: resumen.diferencias_detectadas > 0 ? "#BA3026" : "hsl(var(--text-main))" }}>
                  {resumen.diferencias_detectadas > 0 ? resumen.diferencias_detectadas : "Ninguna"}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0 0" }}>
                <span style={{ fontSize: 13, color: "hsl(var(--text-sub))" }}>Productos bajo mínimo</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: resumen.productos_bajo_minimo.length > 0 ? "#C2972E" : "hsl(var(--text-main))" }}>
                  {resumen.productos_bajo_minimo.length > 0
                    ? resumen.productos_bajo_minimo.join(", ")
                    : "Ninguno"}
                </span>
              </div>
            </div>

            <button
              onClick={handleAceptarExito}
              style={{ width: "100%", padding: "11px 0", borderRadius: 8, border: "none", backgroundColor: "hsl(var(--terracota))", color: "white", fontSize: 15, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "hsl(var(--terracota-dark))"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "hsl(var(--terracota))"; }}
            >
              Aceptar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
