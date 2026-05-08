import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { formatCurrency, formatDate } from "@/lib/format";
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

interface ReportPDFProps {
  reportData: ReportData;
  desde: string;
  hasta: string;
}

const REPORT_NAMES: Record<ReportType, string> = {
  gastos_producto: "Gastos por Producto",
  gastos_proveedor: "Gastos por Proveedor",
  merma: "Análisis de Merma",
  movimientos: "Movimientos de Inventario",
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
    paddingTop: 8,
    paddingHorizontal: 6,
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
});

function Header({ type, desde, hasta }: { type: ReportType; desde: string; hasta: string }) {
  const today = new Date().toISOString().slice(0, 10);
  const periodo = desde && hasta ? `${formatDate(desde)} – ${formatDate(hasta)}` : "Todo el tiempo";
  return (
    <View style={s.header}>
      <Text style={s.brand}>TEQUISTOCK</Text>
      <Text style={s.reportName}>{REPORT_NAMES[type]}</Text>
      <Text style={s.meta}>
        Período: {periodo}   ·   Generado: {formatDate(today)}
      </Text>
    </View>
  );
}

function Footer() {
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

// ─── Report 1: Gastos por Producto ───────────────────────────────────────────

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
          <Text style={[s.cellCenter, { width: cols[1] }]}>{row.cant_comprada}</Text>
          <Text style={[s.cellCenter, { width: cols[2] }]}>{row.veces_comprado}</Text>
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

// ─── Report 2: Gastos por Proveedor ──────────────────────────────────────────

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
          <Text style={[s.cellCenter, { width: cols[1] }]}>{row.num_compras}</Text>
          <Text style={[s.cellCenter, { width: cols[2] }]}>{row.num_productos_distintos}</Text>
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

// ─── Report 3: Análisis de Merma ─────────────────────────────────────────────

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
          <Text style={[s.cellCenter, { width: cols[1] }]}>{row.cant_perdida}</Text>
          <Text style={[s.cell, { width: cols[2] }]}>{row.tipo_predominante}</Text>
          <Text style={[s.cellBold, { width: cols[3] }]}>{formatCurrency(row.valor_perdido)}</Text>
          <Text style={[s.cellRight, { width: cols[4] }]}>{row.porcentaje_del_total}%</Text>
        </View>
      ))}
      <View style={s.totalsRow}>
        <Text style={s.totalsLabel}>TOTAL PERDIDO</Text>
        <Text style={s.totalsValue}>{formatCurrency(result.total_perdido)}</Text>
      </View>
    </View>
  );
}

// ─── Report 4: Movimientos de Inventario ─────────────────────────────────────

const TIPO_LABELS: Record<string, string> = {
  entrada: "Entrada",
  salida: "Consumo",
  merma: "Merma",
};

function MovimientosTable({ result }: { result: MovimientosResult }) {
  const cols = [62, 62, 185, 72, 79];
  return (
    <View>
      <View style={s.tableHead}>
        <Text style={[s.thText, { width: cols[0] }]}>FECHA</Text>
        <Text style={[s.thText, { width: cols[1] }]}>TIPO</Text>
        <Text style={[s.thText, { width: cols[2] }]}>PRODUCTO</Text>
        <Text style={[s.thText, { width: cols[3], textAlign: "right" }]}>CANTIDAD</Text>
        <Text style={[s.thText, { width: cols[4] }]}>REFERENCIA</Text>
      </View>
      {result.rows.map((row, i) => {
        const isEntrada = row.tipo === "entrada";
        const qtyColor = isEntrada ? "#106653" : "#BA3026";
        const qtyStr = `${isEntrada ? "+" : "-"}${row.qty}`;
        return (
          <View key={row.id} style={[s.row, i % 2 === 0 ? s.rowEven : s.rowOdd]}>
            <Text style={[s.cell, { width: cols[0] }]}>{row.fecha}</Text>
            <Text style={[s.cell, { width: cols[1] }]}>{TIPO_LABELS[row.tipo] ?? row.tipo}</Text>
            <Text style={[s.cell, { width: cols[2] }]}>{row.nombre}</Text>
            <Text style={[{ fontSize: 8.5, fontFamily: "Helvetica-Bold", color: qtyColor, textAlign: "right", width: cols[3] }]}>
              {qtyStr}
            </Text>
            <Text style={[s.cellMuted, { width: cols[4] }]}>{row.referencia ?? "—"}</Text>
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

// ─── Main PDF Component ───────────────────────────────────────────────────────

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
        {reportData.type === "merma" && (
          <MermaTable result={reportData.result} />
        )}
        {reportData.type === "movimientos" && (
          <MovimientosTable result={reportData.result} />
        )}

        <Footer />
      </Page>
    </Document>
  );
}
