"use client";

// This module must only be loaded client-side via dynamic import.
// @react-pdf/renderer uses canvas/browser APIs that break SSR/Turbopack static analysis.
import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { formatCurrency, formatDate } from "@/lib/format";
import type {
  GastoProductoResult,
  GastoProveedorResult,
  MermaResult,
  MovimientosResult,
  ResumenSemanalResult,
} from "@/lib/actions/reportes.actions";

export type ReportType = "gastos_producto" | "gastos_proveedor" | "merma" | "movimientos" | "resumen_semanal";

export type ReportData =
  | { type: "gastos_producto"; result: GastoProductoResult }
  | { type: "gastos_proveedor"; result: GastoProveedorResult }
  | { type: "merma"; result: MermaResult }
  | { type: "movimientos"; result: MovimientosResult }
  | { type: "resumen_semanal"; result: ResumenSemanalResult };

export interface ReportPDFProps {
  reportData: ReportData;
  desde: string;
  hasta: string;
}

const REPORT_NAMES: Record<ReportType, string> = {
  gastos_producto: "Gastos por Producto",
  gastos_proveedor: "Gastos por Proveedor",
  merma: "Análisis de Merma",
  movimientos: "Movimientos de Inventario",
  resumen_semanal: "Resumen Semanal de Inventario",
};

const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    paddingTop: 36,
    paddingBottom: 52,
    paddingLeft: 36,
    paddingRight: 36,
    color: "#1C2028",
  },
  header: { marginBottom: 14 },
  brand: { fontSize: 20, fontFamily: "Helvetica-Bold", color: "#BA3026" },
  reportName: { fontSize: 13, fontFamily: "Helvetica-Bold", color: "#1C2028", marginTop: 3 },
  meta: { fontSize: 8, color: "#9CA3AF", marginTop: 3 },
  separator: { height: 2, backgroundColor: "#BA3026", marginBottom: 14, marginTop: 8 },
  tableHead: {
    flexDirection: "row",
    backgroundColor: "#1C2028",
    borderRadius: 3,
    paddingVertical: 5,
    paddingHorizontal: 6,
    marginBottom: 1,
  },
  thText: { color: "#FFFFFF", fontSize: 8, fontFamily: "Helvetica-Bold" },
  row: {
    flexDirection: "row",
    paddingVertical: 5,
    paddingHorizontal: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: "#E5E7EB",
  },
  rowEven: { backgroundColor: "#FFFFFF" },
  rowOdd: { backgroundColor: "#F9FAFB" },
  cell: { fontSize: 8.5, color: "#1C2028" },
  cellRight: { fontSize: 8.5, color: "#1C2028", textAlign: "right" },
  cellCenter: { fontSize: 8.5, color: "#1C2028", textAlign: "center" },
  cellMuted: { fontSize: 8, color: "#6B7280" },
  cellBold: { fontSize: 8.5, fontFamily: "Helvetica-Bold", color: "#BA3026", textAlign: "right" },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    borderTopWidth: 1.5,
    borderTopColor: "#E5E7EB",
    backgroundColor: "#F3F4F6",
    padding: 8,
  },
  totalsLabel: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "#4B5563" },
  totalsValue: { fontSize: 10, fontFamily: "Helvetica-Bold", color: "#BA3026" },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 36,
    right: 36,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: { fontSize: 8, color: "#9CA3AF" },
  metricRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
  metricCard: { flex: 1, backgroundColor: "#F3F4F6", borderRadius: 4, padding: 8 },
  metricLabel: { fontSize: 7, color: "#6B7280", fontFamily: "Helvetica-Bold", marginBottom: 3 },
  metricValue: { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#0B4455" },
  sectionTitle: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "#0B4455", marginBottom: 6, marginTop: 14 },
  highlightRow: { backgroundColor: "#FCEBEB" },
  alertText: { fontSize: 8, color: "#BA3026", marginBottom: 3 },
  successText: { fontSize: 8, color: "#106653" },
});

function Header({ type, desde, hasta }: { type: ReportType; desde: string; hasta: string }) {
  const today = new Date().toISOString().slice(0, 10);
  const periodo = desde && hasta ? `${formatDate(desde)} – ${formatDate(hasta)}` : "Todo el tiempo";
  return (
    <View style={s.header}>
      <Text style={s.brand}>TEQUISTOCK</Text>
      <Text style={s.reportName}>{REPORT_NAMES[type]}</Text>
      <Text style={s.meta}>
        {"Período: " + periodo + "   ·   Generado: " + formatDate(today)}
      </Text>
    </View>
  );
}

function PDFFooter() {
  return (
    <View style={s.footer} fixed>
      <Text style={s.footerText}>TequiStock</Text>
      <Text
        style={s.footerText}
        render={({ pageNumber, totalPages }: { pageNumber: number; totalPages: number }) =>
          `Página ${pageNumber} de ${totalPages}`
        }
        fixed
      />
    </View>
  );
}

function GastoProductoTable({ result }: { result: GastoProductoResult }) {
  const cols = [180, 58, 58, 82, 82];
  return (
    <View>
      <View style={s.tableHead}>
        <Text style={[s.thText, { width: cols[0] }]}>PRODUCTO</Text>
        <Text style={[s.thText, { width: cols[1], textAlign: "center" }]}>CANT.</Text>
        <Text style={[s.thText, { width: cols[2], textAlign: "center" }]}>VECES</Text>
        <Text style={[s.thText, { width: cols[3], textAlign: "right" }]}>GASTO TOTAL</Text>
        <Text style={[s.thText, { width: cols[4], textAlign: "right" }]}>PROMEDIO</Text>
      </View>
      {result.rows.map((row, i) => (
        <View key={row.product_id} style={[s.row, i % 2 === 0 ? s.rowEven : s.rowOdd]}>
          <View style={{ width: cols[0] }}>
            <Text style={s.cell}>{row.nombre}</Text>
            <Text style={s.cellMuted}>{row.categoria}</Text>
          </View>
          <Text style={[s.cellCenter, { width: cols[1] }]}>{String(row.cant_comprada)}</Text>
          <Text style={[s.cellCenter, { width: cols[2] }]}>{String(row.veces_comprado)}</Text>
          <Text style={[s.cellBold, { width: cols[3] }]}>{formatCurrency(row.gasto_total)}</Text>
          <Text style={[s.cellRight, { width: cols[4] }]}>{formatCurrency(row.promedio_por_compra)}</Text>
        </View>
      ))}
      <View style={s.totalsRow}>
        <Text style={s.totalsLabel}>TOTAL GASTADO</Text>
        <Text style={s.totalsValue}>{formatCurrency(result.total_gastado)}</Text>
      </View>
    </View>
  );
}

function GastoProveedorTable({ result }: { result: GastoProveedorResult }) {
  const cols = [160, 55, 65, 92, 88];
  return (
    <View>
      <View style={s.tableHead}>
        <Text style={[s.thText, { width: cols[0] }]}>PROVEEDOR</Text>
        <Text style={[s.thText, { width: cols[1], textAlign: "center" }]}>COMPRAS</Text>
        <Text style={[s.thText, { width: cols[2], textAlign: "center" }]}>PRODUCTOS</Text>
        <Text style={[s.thText, { width: cols[3], textAlign: "right" }]}>TOTAL GASTADO</Text>
        <Text style={[s.thText, { width: cols[4], textAlign: "right" }]}>TICKET PROM.</Text>
      </View>
      {result.rows.map((row, i) => (
        <View key={row.supplier_id} style={[s.row, i % 2 === 0 ? s.rowEven : s.rowOdd]}>
          <View style={{ width: cols[0] }}>
            <Text style={s.cell}>{row.company}</Text>
            {row.contact ? <Text style={s.cellMuted}>{row.contact}</Text> : null}
          </View>
          <Text style={[s.cellCenter, { width: cols[1] }]}>{String(row.num_compras)}</Text>
          <Text style={[s.cellCenter, { width: cols[2] }]}>{String(row.num_productos_distintos)}</Text>
          <Text style={[s.cellBold, { width: cols[3] }]}>{formatCurrency(row.total_gastado)}</Text>
          <Text style={[s.cellRight, { width: cols[4] }]}>{formatCurrency(row.ticket_promedio)}</Text>
        </View>
      ))}
      <View style={s.totalsRow}>
        <Text style={s.totalsLabel}>TOTAL GASTADO</Text>
        <Text style={s.totalsValue}>{formatCurrency(result.total_gastado)}</Text>
      </View>
    </View>
  );
}

function MermaTable({ result }: { result: MermaResult }) {
  const cols = [168, 58, 90, 84, 60];
  return (
    <View>
      <View style={s.tableHead}>
        <Text style={[s.thText, { width: cols[0] }]}>PRODUCTO</Text>
        <Text style={[s.thText, { width: cols[1], textAlign: "center" }]}>CANT.</Text>
        <Text style={[s.thText, { width: cols[2] }]}>TIPO PREDOMINANTE</Text>
        <Text style={[s.thText, { width: cols[3], textAlign: "right" }]}>VALOR PERDIDO</Text>
        <Text style={[s.thText, { width: cols[4], textAlign: "right" }]}>% TOTAL</Text>
      </View>
      {result.rows.map((row, i) => (
        <View key={row.product_id} style={[s.row, i % 2 === 0 ? s.rowEven : s.rowOdd]}>
          <View style={{ width: cols[0] }}>
            <Text style={s.cell}>{row.nombre}</Text>
            <Text style={s.cellMuted}>{row.categoria}</Text>
          </View>
          <Text style={[s.cellCenter, { width: cols[1] }]}>{String(row.cant_perdida)}</Text>
          <Text style={[s.cell, { width: cols[2] }]}>{row.tipo_predominante}</Text>
          <Text style={[s.cellBold, { width: cols[3] }]}>{formatCurrency(row.valor_perdido)}</Text>
          <Text style={[s.cellRight, { width: cols[4] }]}>{row.porcentaje_del_total + "%"}</Text>
        </View>
      ))}
      <View style={s.totalsRow}>
        <Text style={s.totalsLabel}>TOTAL PERDIDO</Text>
        <Text style={s.totalsValue}>{formatCurrency(result.total_perdido)}</Text>
      </View>
    </View>
  );
}

const TIPO_LABELS: Record<string, string> = {
  entrada: "Entrada",
  salida: "Consumo",
  merma: "Merma",
};

function MovimientosTable({ result }: { result: MovimientosResult }) {
  const cols = [68, 60, 170, 80, 82];
  return (
    <View>
      <View style={s.tableHead}>
        <Text style={[s.thText, { width: cols[0] }]}>FECHA</Text>
        <Text style={[s.thText, { width: cols[1] }]}>TIPO</Text>
        <Text style={[s.thText, { width: cols[2] }]}>PRODUCTO</Text>
        <Text style={[s.thText, { width: cols[3], textAlign: "right", paddingRight: 8 }]}>CANTIDAD</Text>
        <Text style={[s.thText, { width: cols[4], paddingLeft: 8 }]}>REFERENCIA</Text>
      </View>
      {result.rows.map((row, i) => {
        const isEntrada = row.tipo === "entrada";
        const qtyColor = isEntrada ? "#106653" : "#BA3026";
        const qtyStr = (isEntrada ? "+" : "-") + String(row.qty);
        return (
          <View key={row.id} style={[s.row, i % 2 === 0 ? s.rowEven : s.rowOdd]}>
            <Text style={[s.cell, { width: cols[0] }]}>{row.fecha}</Text>
            <Text style={[s.cell, { width: cols[1] }]}>{TIPO_LABELS[row.tipo] ?? row.tipo}</Text>
            <Text style={[s.cell, { width: cols[2] }]}>{row.nombre}</Text>
            <Text style={{ fontSize: 8.5, fontFamily: "Helvetica-Bold", color: qtyColor, textAlign: "right", paddingRight: 8, width: cols[3] }}>
              {qtyStr}
            </Text>
            <Text style={[s.cellMuted, { width: cols[4], paddingLeft: 8 }]}>{row.referencia ?? "—"}</Text>
          </View>
        );
      })}
      {result.rows.length >= 1000 && (
        <Text style={{ fontSize: 7.5, color: "#9CA3AF", marginTop: 6, textAlign: "center" }}>
          Mostrando primeros 1,000 registros del período
        </Text>
      )}
    </View>
  );
}

const TENDENCIA_COLORS_PDF: Record<string, string> = {
  mejorando: "#106653",
  estable: "#C2972E",
  empeorando: "#BA3026",
};
const TENDENCIA_LABELS_PDF: Record<string, string> = {
  mejorando: "Mejorando",
  estable: "Estable",
  empeorando: "Empeorando",
};

function ResumenSemanalPDF({ result }: { result: ResumenSemanalResult }) {
  const { resumen_general: rg, por_producto, alertas } = result;
  const cols = [140, 70, 65, 75, 60];

  return (
    <View>
      {/* Sección 1 — Métricas 2×2 */}
      <Text style={s.sectionTitle}>RESUMEN EJECUTIVO</Text>
      <View style={s.metricRow}>
        <View style={s.metricCard}>
          <Text style={s.metricLabel}>CIERRES REALIZADOS</Text>
          <Text style={s.metricValue}>{rg.total_cierres} de 7</Text>
        </View>
        <View style={s.metricCard}>
          <Text style={s.metricLabel}>VALOR CONSUMIDO</Text>
          <Text style={[s.metricValue, { color: "#106653" }]}>{formatCurrency(rg.valor_consumido_total)}</Text>
        </View>
      </View>
      <View style={[s.metricRow, { marginBottom: 14 }]}>
        <View style={s.metricCard}>
          <Text style={s.metricLabel}>MERMAS DETECTADAS</Text>
          <Text style={[s.metricValue, { color: "#BA3026" }]}>{formatCurrency(rg.valor_merma_total)}</Text>
        </View>
        <View style={s.metricCard}>
          <Text style={s.metricLabel}>DIFERENCIAS</Text>
          <Text style={[s.metricValue, { color: "#C2972E" }]}>{rg.diferencias_detectadas} productos</Text>
        </View>
      </View>

      {/* Sección 2 — Tabla por producto */}
      {por_producto.length > 0 && (
        <View>
          <Text style={s.sectionTitle}>DETALLE POR PRODUCTO</Text>
          <View style={s.tableHead}>
            <Text style={[s.thText, { width: cols[0] }]}>PRODUCTO</Text>
            <Text style={[s.thText, { width: cols[1], textAlign: "right" }]}>CONSUMO</Text>
            <Text style={[s.thText, { width: cols[2], textAlign: "right" }]}>DIFERENCIA</Text>
            <Text style={[s.thText, { width: cols[3], textAlign: "right" }]}>VALOR DIF.</Text>
            <Text style={[s.thText, { width: cols[4], textAlign: "center" }]}>TENDENCIA</Text>
          </View>
          {por_producto.map((row, i) => {
            const tColor = TENDENCIA_COLORS_PDF[row.tendencia] ?? "#1C2028";
            const tLabel = TENDENCIA_LABELS_PDF[row.tendencia] ?? row.tendencia;
            const isHighlight = row.diferencia_total < 0;
            const rowStyle = [s.row, i % 2 === 0 ? s.rowEven : s.rowOdd, isHighlight ? s.highlightRow : {}];
            return (
              <View key={row.product_id} style={rowStyle}>
                <View style={{ width: cols[0] }}>
                  <Text style={s.cell}>{row.nombre}</Text>
                  <Text style={s.cellMuted}>{row.unidad} · {row.categoria}</Text>
                </View>
                <Text style={[s.cellRight, { width: cols[1] }]}>{String(row.consumo_total_semana)}</Text>
                <Text style={[s.cellRight, { width: cols[2], fontFamily: "Helvetica-Bold", color: row.diferencia_total < 0 ? "#BA3026" : "#106653" }]}>
                  {row.diferencia_total > 0 ? "+" : ""}{row.diferencia_total.toFixed(2)}
                </Text>
                <Text style={[s.cellBold, { width: cols[3] }]}>{formatCurrency(Math.abs(row.valor_diferencia))}</Text>
                <Text style={[s.cellCenter, { width: cols[4], fontFamily: "Helvetica-Bold", color: tColor }]}>{tLabel}</Text>
              </View>
            );
          })}
        </View>
      )}

      {/* Sección 3 — Alertas */}
      <View>
        <Text style={s.sectionTitle}>ALERTAS DE LA SEMANA</Text>
        {alertas.length === 0 ? (
          <Text style={s.successText}>Sin alertas esta semana — todo dentro de parametros normales.</Text>
        ) : (
          alertas.map((a, i) => (
            <Text key={i} style={s.alertText}>{"• " + a}</Text>
          ))
        )}
      </View>

      {/* Sección 4 — Días sin cierre */}
      <View>
        <Text style={s.sectionTitle}>DIAS SIN CIERRE</Text>
        {rg.dias_sin_cierre.length === 0 ? (
          <Text style={s.successText}>Todos los dias registraron cierre correctamente.</Text>
        ) : (
          rg.dias_sin_cierre.map((d, i) => {
            const fecha = new Date(d + "T00:00:00").toLocaleDateString("es-MX", {
              weekday: "long", day: "numeric", month: "long",
            });
            return (
              <Text key={i} style={s.alertText}>{fecha} — Sin registro de cierre ese dia.</Text>
            );
          })
        )}
      </View>
    </View>
  );
}

export function ReportPDF({ reportData, desde, hasta }: ReportPDFProps) {
  return (
    <Document>
      <Page size="LETTER" style={s.page}>
        <Header type={reportData.type} desde={desde} hasta={hasta} />
        <View style={s.separator} />
        {reportData.type === "gastos_producto" && (
          <GastoProductoTable result={reportData.result} />
        )}
        {reportData.type === "gastos_proveedor" && (
          <GastoProveedorTable result={reportData.result} />
        )}
        {reportData.type === "merma" && <MermaTable result={reportData.result} />}
        {reportData.type === "movimientos" && <MovimientosTable result={reportData.result} />}
        {reportData.type === "resumen_semanal" && (
          <ResumenSemanalPDF result={reportData.result} />
        )}
        <PDFFooter />
      </Page>
    </Document>
  );
}
