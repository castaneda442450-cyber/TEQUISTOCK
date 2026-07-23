"use client";

import { useMemo } from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { Package, Pencil, Trash2, Sun, CalendarDays, CalendarCheck } from "lucide-react";
import { formatCurrency, getStockEstado } from "@/lib/format";
import type { Producto, Categoria } from "@/types";

const FREQ_CONFIG = {
  diario:  { label: "Diario",  Icon: Sun,           bg: "#FCEBEB", color: "#791F1F" },
  semanal: { label: "Semanal", Icon: CalendarDays,  bg: "#FAEEDA", color: "#633806" },
  mensual: { label: "Mensual", Icon: CalendarCheck, bg: "#EAF3DE", color: "#27500A" },
} as const;

const CYCLE: Record<string, "diario" | "semanal" | "mensual"> = {
  diario: "semanal", semanal: "mensual", mensual: "diario",
};

function proveedoresLabel(proveedores?: { id: string; company: string }[]): string {
  if (!proveedores || proveedores.length === 0) return "Sin proveedor asignado";
  if (proveedores.length === 1) return proveedores[0].company;
  if (proveedores.length === 2) return `${proveedores[0].company} · ${proveedores[1].company}`;
  return `${proveedores[0].company} +${proveedores.length - 1} más`;
}

interface ProductosTableProps {
  productos: Producto[];
  categorias: Categoria[];
  onEdit: (p: Producto) => void;
  onDelete: (p: Producto) => void;
  onFrecuenciaChange: (id: string, nombre: string, freq: "diario" | "semanal" | "mensual") => void;
}

export function ProductosTable({ productos, categorias, onEdit, onDelete, onFrecuenciaChange }: ProductosTableProps) {
  const catMap = useMemo(() => {
    const m = new Map<string, Categoria>();
    categorias.forEach((c) => m.set(c.id, c));
    return m;
  }, [categorias]);

  const columns = useMemo<ColumnDef<Producto>[]>(
    () => [
      {
        id: "producto",
        header: "Producto",
        cell: ({ row }) => {
          const p = row.original;
          const cat = catMap.get(p.categoria_id);
          const color = cat?.color ?? "#78909C";
          return (
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: `${color}22`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Package size={16} style={{ color }} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: "hsl(var(--text-main))" }}>
                  {p.nombre}
                </div>
                <div style={{ fontSize: 11, color: "hsl(var(--text-muted))" }}>{p.unidad}</div>
                <div style={{ fontSize: 11, color: "hsl(var(--text-muted))", marginTop: 2 }}>
                  {proveedoresLabel(p.proveedores)}
                </div>
              </div>
            </div>
          );
        },
      },
      {
        id: "categoria",
        header: "Categoría",
        cell: ({ row }) => {
          const p = row.original;
          const cat = catMap.get(p.categoria_id);
          const color = cat?.color ?? "#78909C";
          const nombre = cat?.nombre ?? "-";
          return (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                fontSize: 11,
                fontWeight: 600,
                padding: "2px 10px",
                borderRadius: 99,
                backgroundColor: `${color}22`,
                color,
                whiteSpace: "nowrap",
              }}
            >
              {nombre}
            </span>
          );
        },
      },
      {
        id: "conteo",
        header: "Conteo",
        meta: { align: "center" as const },
        cell: ({ row }) => {
          const p = row.original;
          const freq = p.frecuencia_conteo ?? "semanal";
          const cfg = FREQ_CONFIG[freq as keyof typeof FREQ_CONFIG] ?? FREQ_CONFIG.semanal;
          const next = CYCLE[freq];
          const { Icon } = cfg;
          return (
            <button
              title={`Clic para cambiar — actual: ${cfg.label}`}
              onClick={(e) => { e.stopPropagation(); onFrecuenciaChange(p.id, p.nombre, next); }}
              style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 99,
                backgroundColor: cfg.bg, color: cfg.color,
                border: "none", cursor: "pointer",
              }}
            >
              <Icon size={12} />
              {cfg.label}
            </button>
          );
        },
      },
      {
        id: "stock",
        header: "Stock Actual",
        meta: { align: "center" as const },
        cell: ({ row }) => {
          const p = row.original;
          const estado = getStockEstado(p.stock_actual, p.stock_minimo);
          const color =
            estado === "critico"
              ? "hsl(var(--terracota))"
              : estado === "bajo"
                ? "hsl(var(--gold))"
                : "hsl(var(--green))";
          const label = estado === "critico" ? "CRÍTICO" : estado === "bajo" ? "BAJO" : "OK";
          const bg =
            estado === "critico"
              ? "hsl(var(--terracota) / 0.12)"
              : estado === "bajo"
                ? "hsl(var(--gold) / 0.12)"
                : "hsl(var(--green) / 0.12)";
          return (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <span style={{ fontWeight: 700, fontSize: 14, fontVariantNumeric: "tabular-nums", color }}>
                {p.stock_actual}{" "}
                <span style={{ fontSize: 11, fontWeight: 400, color: "hsl(var(--text-muted))" }}>
                  {p.unidad}
                </span>
              </span>
              <span style={{
                fontSize: 10, fontWeight: 700, letterSpacing: "0.06em",
                padding: "2px 8px", borderRadius: 99,
                backgroundColor: bg, color,
              }}>
                {label}
              </span>
            </div>
          );
        },
      },
      {
        id: "stock_minimo",
        header: "Stock Mínimo",
        meta: { align: "center" as const },
        cell: ({ row }) => {
          const p = row.original;
          return (
            <span style={{ fontSize: 13, color: "hsl(var(--text-sub))", fontVariantNumeric: "tabular-nums" }}>
              {p.stock_minimo} {p.unidad}
            </span>
          );
        },
      },
      {
        id: "precio",
        header: "Último Precio",
        meta: { align: "right" as const },
        cell: ({ row }) => {
          const p = row.original;
          return (
            <span style={{ fontWeight: 600, fontSize: 13, color: "hsl(var(--text-main))", fontVariantNumeric: "tabular-nums" }}>
              {formatCurrency(p.last_price)} <span style={{ color: "hsl(var(--text-muted))", fontWeight: 400 }}>/ {p.unidad}</span>
            </span>
          );
        },
      },
      {
        id: "acciones",
        header: "Acciones",
        meta: { align: "center" as const },
        cell: ({ row }) => {
          const p = row.original;
          return (
            <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
              <ActionBtn
                varName="navy"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(p);
                }}
                title="Editar"
              >
                <Pencil size={14} />
              </ActionBtn>
              <ActionBtn
                varName="terracota"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(p);
                }}
                title="Eliminar"
              >
                <Trash2 size={14} />
              </ActionBtn>
            </div>
          );
        },
      },
    ],
    [catMap, onEdit, onDelete, onFrecuenciaChange],
  );

  const table = useReactTable({
    data: productos,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        {table.getHeaderGroups().map((hg) => (
          <tr
            key={hg.id}
            style={{
              backgroundColor: "hsl(var(--surface-alt))",
              borderBottom: "1px solid hsl(var(--border))",
            }}
          >
            {hg.headers.map((h) => {
              const align = (h.column.columnDef.meta as { align?: "left" | "center" | "right" } | undefined)?.align ?? "left";
              const hideOnTablet = ["categoria", "precio"].includes(h.column.id);
              return (
                <th
                  key={h.id}
                  className={hideOnTablet ? "tablet-col-hide" : undefined}
                  style={{
                    padding: "12px 16px",
                    textAlign: align,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    fontSize: 11,
                    letterSpacing: "0.06em",
                    color: "hsl(var(--text-sub))",
                    whiteSpace: "nowrap",
                  }}
                >
                  {flexRender(h.column.columnDef.header, h.getContext())}
                </th>
              );
            })}
          </tr>
        ))}
      </thead>
      <tbody>
        {table.getRowModel().rows.map((row, i) => (
          <tr
            key={row.id}
            style={{
              backgroundColor: i % 2 === 0 ? "hsl(var(--surface))" : "hsl(var(--surface-alt))",
              borderBottom: "1px solid hsl(var(--border))",
              transition: "background-color 0.1s ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLTableRowElement).style.backgroundColor = "hsl(var(--surface-hover))";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLTableRowElement).style.backgroundColor =
                i % 2 === 0 ? "hsl(var(--surface))" : "hsl(var(--surface-alt))";
            }}
          >
            {row.getVisibleCells().map((cell) => {
              const align = (cell.column.columnDef.meta as { align?: "left" | "center" | "right" } | undefined)?.align ?? "left";
              const hideOnTablet = ["categoria", "precio"].includes(cell.column.id);
              return (
                <td
                  key={cell.id}
                  className={hideOnTablet ? "tablet-col-hide" : undefined}
                  style={{
                    padding: "14px 16px",
                    textAlign: align,
                    verticalAlign: "middle",
                  }}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ActionBtn({
  children,
  varName,
  onClick,
  title,
}: {
  children: React.ReactNode;
  varName: "navy" | "terracota";
  onClick: (e: React.MouseEvent) => void;
  title: string;
}) {
  const color = `hsl(var(--${varName}))`;
  const bgIdle = `hsl(var(--${varName}) / 0.12)`;
  const bgHover = `hsl(var(--${varName}) / 0.22)`;
  return (
    <button
      data-icon-btn
      onClick={onClick}
      title={title}
      style={{
        background: bgIdle,
        border: "none",
        borderRadius: 6,
        padding: "6px 10px",
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        color,
        transition: "background-color 0.15s ease",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = bgHover;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = bgIdle;
      }}
    >
      {children}
    </button>
  );
}
