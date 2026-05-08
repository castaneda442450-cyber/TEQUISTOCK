"use client";

import React, { useState, useTransition, useEffect, useRef } from "react";
import { BarChart3, X, Printer, FileDown, Sheet, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Bar } from "react-chartjs-2";
import "@/components/dashboard/ChartSetup";
import { CategoryBadge } from "@/components/shared/CategoryBadge";
import { MermaBadge } from "@/components/shared/MermaBadge";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  getGastosPorProducto,
  getGastosPorProveedor,
  getMermaAnalisis,
  getMovimientosReporte,
} from "@/lib/actions/reportes.actions";
import type {
  GastoProductoResult,
  GastoProveedorResult,
  MermaResult,
  MovimientosResult,
} from "@/lib/actions/reportes.actions";

export type ReportType = "gastos_producto" | "gastos_proveedor" | "merma" | "movimientos";

type ReportData =
  | { type: "gastos_producto"; result: GastoProductoResult }
  | { type: "gastos_proveedor"; result: GastoProveedorResult }
  | { type: "merma"; result: MermaResult }
  | { type: "movimientos"; result: MovimientosResult };

const REPORT_NAMES: Record<ReportType, string> = {
  gastos_producto: "Gastos por Producto",
  gastos_proveedor: "Gastos por Proveedor",
  merma: "Análisis de Merma",
  movimientos: "Movimientos de Inventario",
};

const TIPO_COLORS: Record<string, { bg: string; fg: string; label: string }> = {
  entrada: { bg: "#10665322", fg: "#106653", label: "Entrada" },
  salida: { bg: "#0B445522", fg: "#0B4455", label: "Consumo" },
  merma: { bg: "#BA302622", fg: "#BA3026", label: "Merma" },
};

function firstDayOfMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function buildFilename(type: ReportType, desde: string, hasta: string, ext: "pdf" | "xlsx") {
  const tipo = {
    gastos_producto: "gastos-producto",
    gastos_proveedor: "gastos-proveedor",
    merma: "merma",
    movimientos: "movimientos",
  }[type];
  const periodo = desde && hasta ? `${desde}_${hasta}` : "todo";
  return `tequistock-${tipo}-${periodo}-${today()}.${ext}`;
}

// ─── Shared table styles ──────────────────────────────────────────────────────

const thStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  color: "hsl(var(--text-sub))",
  padding: "10px 12px",
  textAlign: "left",
  background: "hsl(var(--surface-alt))",
  whiteSpace: "nowrap",
};

function tdStyle(ri: number, align?: "right" | "center"): React.CSSProperties {
  return {
    padding: "10px 12px",
    borderBottom: "1px solid hsl(var(--border))",
    background: ri % 2 === 0 ? "hsl(var(--surface))" : "hsl(var(--surface-alt))",
    textAlign: align ?? "left",
    fontSize: 13,
    color: "hsl(var(--text-main))",
    verticalAlign: "middle",
  };
}

function NavyBadge({ label }: { label: number | string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        borderRadius: 99,
        fontSize: 11,
        fontWeight: 700,
        padding: "2px 10px",
        background: "#0B445518",
        color: "#0B4455",
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {label}
    </span>
  );
}

function GrandTotal({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        background: "hsl(var(--surface-alt))",
        borderRadius: 8,
        padding: "12px 18px",
        marginTop: 12,
      }}
    >
      <span style={{ fontSize: 11, fontWeight: 600, color: "hsl(var(--text-sub))", letterSpacing: "0.04em", textTransform: "uppercase" }}>
        {label}
      </span>
      <span style={{ fontSize: 18, fontWeight: 800, color: color ?? "#BA3026", fontVariantNumeric: "tabular-nums" }}>
        {formatCurrency(value)}
      </span>
    </div>
  );
}

// ─── Tables ───────────────────────────────────────────────────────────────────

function GastoProductoTable({ result }: { result: GastoProductoResult }) {
  const top10 = result.rows.slice(0, 10);
  const chartData = {
    labels: top10.map((r) => (r.nombre.length > 18 ? r.nombre.slice(0, 16) + "…" : r.nombre)),
    datasets: [
      {
        label: "Gasto Total",
        data: top10.map((r) => r.gasto_total),
        backgroundColor: "#BA3026CC",
        borderColor: "#BA3026",
        borderRadius: 6,
        borderWidth: 1,
      },
    ],
  };

  return (
    <>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={thStyle}>Producto</th>
              <th style={{ ...thStyle, textAlign: "center" }}>Cant. Comprada</th>
              <th style={{ ...thStyle, textAlign: "center" }}>Veces Comprado</th>
              <th style={{ ...thStyle, textAlign: "right" }}>Gasto Total</th>
              <th style={{ ...thStyle, textAlign: "right" }}>Promedio / Compra</th>
            </tr>
          </thead>
          <tbody>
            {result.rows.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ ...tdStyle(0), textAlign: "center", color: "hsl(var(--text-muted))", padding: "32px" }}>
                  Sin datos para el período seleccionado
                </td>
              </tr>
            ) : (
              result.rows.map((row, ri) => (
                <tr key={row.product_id}>
                  <td style={tdStyle(ri)}>
                    <div style={{ fontWeight: 600 }}>{row.nombre}</div>
                    <CategoryBadge category={row.categoria} />
                  </td>
                  <td style={tdStyle(ri, "center")}>{row.cant_comprada}</td>
                  <td style={{ ...tdStyle(ri, "center") }}>
                    <NavyBadge label={row.veces_comprado} />
                  </td>
                  <td style={{ ...tdStyle(ri, "right"), fontWeight: 700, color: "#BA3026", fontVariantNumeric: "tabular-nums" }}>
                    {formatCurrency(row.gasto_total)}
                  </td>
                  <td style={{ ...tdStyle(ri, "right"), fontVariantNumeric: "tabular-nums" }}>
                    {formatCurrency(row.promedio_por_compra)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {result.rows.length > 0 && (
        <>
          <GrandTotal label="Total Gastado" value={result.total_gastado} />
          <div style={{ height: 220, marginTop: 20 }}>
            <Bar
              data={chartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  y: {
                    ticks: {
                      callback: (v) => {
                        const n = Number(v);
                        return n >= 1000 ? `$${(n / 1000).toFixed(0)}k` : formatCurrency(n);
                      },
                    },
                  },
                },
              }}
            />
          </div>
        </>
      )}
    </>
  );
}

function GastoProveedorTable({ result }: { result: GastoProveedorResult }) {
  return (
    <>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={thStyle}>Proveedor</th>
              <th style={{ ...thStyle, textAlign: "center" }}># Compras</th>
              <th style={{ ...thStyle, textAlign: "center" }}># Productos</th>
              <th style={{ ...thStyle, textAlign: "right" }}>Total Gastado</th>
              <th style={{ ...thStyle, textAlign: "right" }}>Ticket Promedio</th>
            </tr>
          </thead>
          <tbody>
            {result.rows.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ ...tdStyle(0), textAlign: "center", color: "hsl(var(--text-muted))", padding: "32px" }}>
                  Sin datos para el período seleccionado
                </td>
              </tr>
            ) : (
              result.rows.map((row, ri) => (
                <tr key={row.supplier_id}>
                  <td style={tdStyle(ri)}>
                    <div style={{ fontWeight: 600 }}>{row.company}</div>
                    {row.contact && (
                      <div style={{ fontSize: 11, color: "hsl(var(--text-muted))" }}>{row.contact}</div>
                    )}
                  </td>
                  <td style={{ ...tdStyle(ri, "center") }}>
                    <NavyBadge label={row.num_compras} />
                  </td>
                  <td style={{ ...tdStyle(ri, "center") }}>{row.num_productos_distintos}</td>
                  <td style={{ ...tdStyle(ri, "right"), fontWeight: 700, color: "#BA3026", fontVariantNumeric: "tabular-nums" }}>
                    {formatCurrency(row.total_gastado)}
                  </td>
                  <td style={{ ...tdStyle(ri, "right"), fontVariantNumeric: "tabular-nums" }}>
                    {formatCurrency(row.ticket_promedio)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {result.rows.length > 0 && <GrandTotal label="Total Gastado" value={result.total_gastado} />}
    </>
  );
}

function MermaTable({ result }: { result: MermaResult }) {
  return (
    <>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={thStyle}>Producto</th>
              <th style={{ ...thStyle, textAlign: "center" }}>Cant. Perdida</th>
              <th style={thStyle}>Tipo Predominante</th>
              <th style={{ ...thStyle, textAlign: "right" }}>Valor Perdido</th>
              <th style={{ ...thStyle, textAlign: "right" }}>% del Total</th>
            </tr>
          </thead>
          <tbody>
            {result.rows.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ ...tdStyle(0), textAlign: "center", color: "hsl(var(--text-muted))", padding: "32px" }}>
                  Sin mermas registradas para el período seleccionado
                </td>
              </tr>
            ) : (
              result.rows.map((row, ri) => (
                <tr key={row.product_id}>
                  <td style={tdStyle(ri)}>
                    <div style={{ fontWeight: 600 }}>{row.nombre}</div>
                    <CategoryBadge category={row.categoria} />
                  </td>
                  <td style={{ ...tdStyle(ri, "center") }}>{row.cant_perdida}</td>
                  <td style={tdStyle(ri)}>
                    <MermaBadge type={row.tipo_predominante} />
                  </td>
                  <td style={{ ...tdStyle(ri, "right"), fontWeight: 700, color: "#BA3026", fontVariantNumeric: "tabular-nums" }}>
                    {formatCurrency(row.valor_perdido)}
                  </td>
                  <td style={{ ...tdStyle(ri, "right"), fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                    {row.porcentaje_del_total}%
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {result.rows.length > 0 && (
        <GrandTotal label="Total Perdido" value={result.total_perdido} color="#BA3026" />
      )}
    </>
  );
}

function MovimientosTable({ result }: { result: MovimientosResult }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={thStyle}>Fecha</th>
            <th style={thStyle}>Tipo</th>
            <th style={thStyle}>Producto</th>
            <th style={{ ...thStyle, textAlign: "center" }}>Cantidad</th>
            <th style={{ ...thStyle, color: "hsl(var(--text-muted))" }}>Referencia</th>
          </tr>
        </thead>
        <tbody>
          {result.rows.length === 0 ? (
            <tr>
              <td colSpan={5} style={{ ...tdStyle(0), textAlign: "center", color: "hsl(var(--text-muted))", padding: "32px" }}>
                Sin movimientos para el período seleccionado
              </td>
            </tr>
          ) : (
            result.rows.map((row, ri) => {
              const tc = TIPO_COLORS[row.tipo];
              const isEntrada = row.tipo === "entrada";
              return (
                <tr key={row.id}>
                  <td style={{ ...tdStyle(ri), fontSize: 12, whiteSpace: "nowrap" }}>
                    {formatDate(row.fecha)}
                  </td>
                  <td style={tdStyle(ri)}>
                    {tc && (
                      <span style={{ background: tc.bg, color: tc.fg, borderRadius: 99, fontSize: 11, fontWeight: 600, padding: "2px 10px", whiteSpace: "nowrap" }}>
                        {tc.label}
                      </span>
                    )}
                  </td>
                  <td style={{ ...tdStyle(ri), fontWeight: 500 }}>{row.nombre}</td>
                  <td style={{ ...tdStyle(ri, "center"), fontWeight: 700, color: isEntrada ? "#106653" : "#BA3026", fontVariantNumeric: "tabular-nums" }}>
                    {isEntrada ? "+" : "−"}{row.qty}
                  </td>
                  <td style={{ ...tdStyle(ri), fontSize: 12, color: "hsl(var(--text-muted))" }}>
                    {row.referencia ?? "—"}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
      {result.rows.length >= 1000 && (
        <p style={{ fontSize: 12, color: "hsl(var(--text-muted))", textAlign: "center", padding: "8px 0" }}>
          Mostrando primeros 1,000 registros del período
        </p>
      )}
    </div>
  );
}

// ─── Build Excel rows ─────────────────────────────────────────────────────────

function buildSheetRows(data: ReportData): (string | number)[][] {
  if (data.type === "gastos_producto") {
    const header = ["Producto", "Categoría", "Cant. Comprada", "Veces Comprado", "Gasto Total (MXN)", "Promedio/Compra (MXN)"];
    const rows = data.result.rows.map((r) => [
      r.nombre, r.categoria, r.cant_comprada, r.veces_comprado, r.gasto_total, r.promedio_por_compra,
    ]);
    return [header, ...rows, [], ["", "", "", "TOTAL GASTADO", data.result.total_gastado, ""]];
  }
  if (data.type === "gastos_proveedor") {
    const header = ["Proveedor", "Contacto", "# Compras", "# Productos", "Total Gastado (MXN)", "Ticket Promedio (MXN)"];
    const rows = data.result.rows.map((r) => [
      r.company, r.contact, r.num_compras, r.num_productos_distintos, r.total_gastado, r.ticket_promedio,
    ]);
    return [header, ...rows, [], ["", "", "", "TOTAL GASTADO", data.result.total_gastado, ""]];
  }
  if (data.type === "merma") {
    const header = ["Producto", "Categoría", "Cant. Perdida", "Tipo Predominante", "Valor Perdido (MXN)", "% del Total"];
    const rows = data.result.rows.map((r) => [
      r.nombre, r.categoria, r.cant_perdida, r.tipo_predominante, r.valor_perdido, r.porcentaje_del_total,
    ]);
    return [header, ...rows, [], ["", "", "", "TOTAL PERDIDO", data.result.total_perdido, ""]];
  }
  // movimientos
  const header = ["Fecha", "Tipo", "Producto", "Cantidad", "Referencia"];
  const rows = data.result.rows.map((r) => [
    r.fecha,
    r.tipo === "salida" ? "Consumo" : r.tipo === "entrada" ? "Entrada" : "Merma",
    r.nombre,
    r.tipo === "entrada" ? r.qty : -r.qty,
    r.referencia ?? "",
  ]);
  return [header, ...rows];
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

interface ReportModalProps {
  type: ReportType;
  onClose: () => void;
}

export function ReportModal({ type, onClose }: ReportModalProps) {
  const [desde, setDesde] = useState(firstDayOfMonth);
  const [hasta, setHasta] = useState(today);
  const [data, setData] = useState<ReportData | null>(null);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [isPending, startTransition] = useTransition();
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    overlayRef.current?.focus();
  }, []);

  function handleGenerar() {
    startTransition(async () => {
      let res: { data: any; error: string | null };

      if (type === "gastos_producto") {
        res = await getGastosPorProducto(desde, hasta);
      } else if (type === "gastos_proveedor") {
        res = await getGastosPorProveedor(desde, hasta);
      } else if (type === "merma") {
        res = await getMermaAnalisis(desde, hasta);
      } else {
        res = await getMovimientosReporte(desde, hasta);
      }

      if (res.error) {
        toast.error("Error al generar el reporte: " + res.error);
        return;
      }

      setData({ type, result: res.data } as ReportData);
      setHasGenerated(true);
    });
  }

  async function handleExportPDF() {
    if (!data) return;
    try {
      const { pdf } = await import("@react-pdf/renderer");
      const { ReportPDF } = await import("@/components/reportes/ReportPDF");
      // @react-pdf/renderer pdf() expects DocumentProps but our component wraps Document internally
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const element = React.createElement(ReportPDF, { reportData: data, desde, hasta }) as any;
      const blob = await pdf(element).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = buildFilename(type, desde, hasta, "pdf");
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast.error("Error al generar el PDF");
      console.error(e);
    }
  }

  async function handleExportExcel() {
    if (!data) return;
    try {
      const XLSX = await import("xlsx");
      const sheetRows = buildSheetRows(data);
      const ws = XLSX.utils.aoa_to_sheet(sheetRows);
      ws["!cols"] = sheetRows[0]?.map(() => ({ wch: 22 }));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Reporte");
      XLSX.writeFile(wb, buildFilename(type, desde, hasta, "xlsx"));
    } catch (e) {
      toast.error("Error al exportar Excel");
      console.error(e);
    }
  }

  function handlePrint() {
    window.print();
  }

  return (
    <>
      <style>{`
        @media print {
          body > * { display: none !important; }
          .report-modal-panel { display: flex !important; position: static !important; box-shadow: none !important; max-height: none !important; overflow: visible !important; }
          .report-modal-panel .report-modal-header { border-bottom: 1px solid #eee !important; }
          .report-modal-panel .report-modal-footer { display: none !important; }
          .report-modal-panel .report-filter-row { display: none !important; }
        }
      `}</style>

      <div
        ref={overlayRef}
        tabIndex={-1}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
        onClick={(e) => e.target === e.currentTarget && onClose()}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 50,
          background: "rgba(0,0,0,0.45)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          outline: "none",
        }}
      >
        <div
          className="report-modal-panel"
          style={{
            width: 860,
            maxWidth: "calc(100vw - 32px)",
            borderRadius: 12,
            background: "hsl(var(--surface))",
            boxShadow: "0 32px 80px rgba(0,0,0,0.28)",
            display: "flex",
            flexDirection: "column",
            maxHeight: "90vh",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div
            className="report-modal-header"
            style={{
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "20px 24px",
              borderBottom: "1px solid hsl(var(--border))",
            }}
          >
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "hsl(var(--text-main))", margin: 0 }}>
                {REPORT_NAMES[type]}
              </h2>
              {hasGenerated && desde && hasta && (
                <p style={{ fontSize: 12, color: "hsl(var(--text-muted))", margin: "2px 0 0" }}>
                  {formatDate(desde)} – {formatDate(hasta)}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "hsl(var(--text-muted))",
                padding: 6,
                borderRadius: 6,
                display: "flex",
                alignItems: "center",
              }}
              aria-label="Cerrar"
            >
              <X size={20} />
            </button>
          </div>

          {/* Filter row */}
          <div
            className="report-filter-row"
            style={{
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "14px 24px",
              background: "hsl(var(--surface-alt))",
              borderBottom: "1px solid hsl(var(--border))",
              flexWrap: "wrap",
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 600, color: "hsl(var(--text-sub))" }}>Período:</span>
            <input
              type="date"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
              style={{
                border: "1px solid hsl(var(--border))",
                borderRadius: 8,
                padding: "7px 10px",
                fontSize: 13,
                background: "hsl(var(--surface))",
                color: "hsl(var(--text-main))",
                outline: "none",
              }}
            />
            <span style={{ color: "hsl(var(--text-muted))" }}>—</span>
            <input
              type="date"
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
              style={{
                border: "1px solid hsl(var(--border))",
                borderRadius: 8,
                padding: "7px 10px",
                fontSize: 13,
                background: "hsl(var(--surface))",
                color: "hsl(var(--text-main))",
                outline: "none",
              }}
            />
            <button
              onClick={handleGenerar}
              disabled={isPending}
              style={{
                background: "#BA3026",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "8px 18px",
                fontSize: 13,
                fontWeight: 600,
                cursor: isPending ? "not-allowed" : "pointer",
                opacity: isPending ? 0.7 : 1,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              {isPending ? <Loader2 size={14} style={{ animation: "spin 0.7s linear infinite" }} /> : null}
              Generar Reporte
            </button>
            {data && !isPending && (
              <span style={{ fontSize: 12, color: "#106653", fontWeight: 600 }}>✓ Reporte generado</span>
            )}
          </div>

          {/* Body */}
          <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px" }}>
            {isPending ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 48 }}>
                <Loader2 size={36} style={{ animation: "spin 0.7s linear infinite", color: "hsl(var(--text-muted))" }} />
              </div>
            ) : !hasGenerated ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: 48, color: "hsl(var(--text-muted))", gap: 12 }}>
                <BarChart3 size={48} color="hsl(var(--border))" />
                <p style={{ margin: 0, fontSize: 14 }}>Configura el período y presiona "Generar Reporte"</p>
              </div>
            ) : data?.type === "gastos_producto" ? (
              <GastoProductoTable result={data.result} />
            ) : data?.type === "gastos_proveedor" ? (
              <GastoProveedorTable result={data.result} />
            ) : data?.type === "merma" ? (
              <MermaTable result={data.result} />
            ) : data?.type === "movimientos" ? (
              <MovimientosTable result={data.result} />
            ) : null}
          </div>

          {/* Footer */}
          <div
            className="report-modal-footer"
            style={{
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "14px 24px",
              borderTop: "1px solid hsl(var(--border))",
              flexWrap: "wrap",
            }}
          >
            <FooterBtn icon={<Printer size={14} />} label="Imprimir" onClick={handlePrint} disabled={!data} />
            <FooterBtn icon={<FileDown size={14} />} label="Exportar PDF" onClick={handleExportPDF} disabled={!data} />
            <FooterBtn icon={<Sheet size={14} />} label="Exportar Excel" onClick={handleExportExcel} disabled={!data} />
            <div style={{ flex: 1 }} />
            <button
              onClick={onClose}
              style={{
                border: "1px solid hsl(var(--border))",
                background: "none",
                borderRadius: 8,
                padding: "8px 18px",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                color: "hsl(var(--text-sub))",
              }}
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function FooterBtn({
  icon,
  label,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        border: "1px solid hsl(var(--border))",
        background: disabled ? "hsl(var(--surface-alt))" : "hsl(var(--surface))",
        borderRadius: 8,
        padding: "8px 14px",
        fontSize: 13,
        fontWeight: 500,
        cursor: disabled ? "not-allowed" : "pointer",
        color: disabled ? "hsl(var(--text-muted))" : "hsl(var(--text-sub))",
        opacity: disabled ? 0.5 : 1,
        transition: "background 0.15s",
      }}
    >
      {icon}
      {label}
    </button>
  );
}
