"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Calendar, CalendarDays, CalendarRange } from "lucide-react";
import type { FilterMeta, FilterMode, PeriodValue } from "@/types";

const MESES_FULL = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];
const MESES_SHORT = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const PERIODS: PeriodValue[] = [7, 14, 30, 60, 90];

interface FilterBarProps {
  meta: FilterMeta;
}

export function FilterBar({ meta }: FilterBarProps) {
  const router = useRouter();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const setParams = (next: URLSearchParams) => {
    startTransition(() => {
      router.replace(`/dashboard?${next.toString()}`, { scroll: false });
    });
  };

  const buildParams = (overrides: Record<string, string | number | undefined>) => {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(overrides)) {
      if (v === undefined) next.delete(k);
      else next.set(k, String(v));
    }
    return next;
  };

  const onMode = (mode: FilterMode) => {
    const next = new URLSearchParams();
    next.set("mode", mode);
    if (mode === "periodo") next.set("period", "30");
    if (mode === "mes") {
      const now = new Date();
      next.set("month", String(now.getMonth()));
      next.set("year", String(now.getFullYear()));
    }
    if (mode === "dia") next.set("day", "0");
    setParams(next);
  };

  const statusLine = buildStatusLine(meta);

  return (
    <div
      style={{
        opacity: isPending ? 0.7 : 1,
        transition: "opacity 150ms",
        background: "hsl(var(--surface))",
        border: "1px solid hsl(var(--border))",
        borderRadius: 10,
        padding: "14px 20px",
        boxShadow: "0 1px 3px var(--shadow-color), 0 6px 18px var(--shadow-color)",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      {/* Mode tabs */}
      <div style={{ display: "flex", gap: 6 }}>
        <ModePill active={meta.mode === "periodo"} onClick={() => onMode("periodo")} icon={<Calendar size={12} />}>
          Por período
        </ModePill>
        <ModePill active={meta.mode === "mes"} onClick={() => onMode("mes")} icon={<CalendarRange size={12} />}>
          Por mes
        </ModePill>
        <ModePill active={meta.mode === "dia"} onClick={() => onMode("dia")} icon={<CalendarDays size={12} />}>
          Por día
        </ModePill>
      </div>

      {/* Period pills */}
      {meta.mode === "periodo" && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: "hsl(var(--text-muted))", letterSpacing: "0.4px", textTransform: "uppercase" }}>
            RANGO:
          </span>
          {PERIODS.map((v) => (
            <ValuePill
              key={v}
              active={meta.period === v}
              onClick={() => setParams(buildParams({ mode: "periodo", period: v, month: undefined, year: undefined, day: undefined }))}
            >
              {v} días
            </ValuePill>
          ))}
        </div>
      )}

      {/* Month + Year pills */}
      {meta.mode === "mes" && (
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: "#B0A89E", letterSpacing: "0.4px", textTransform: "uppercase" }}>MES:</span>
            {MESES_SHORT.map((m, i) => (
              <ValuePill
                key={i}
                small
                active={meta.month === i}
                onClick={() => setParams(buildParams({ mode: "mes", month: i, year: meta.year, period: undefined, day: undefined }))}
              >
                {m}
              </ValuePill>
            ))}
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: "#B0A89E", letterSpacing: "0.4px", textTransform: "uppercase" }}>AÑO:</span>
            {meta.availableYears.map((y) => (
              <ValuePill
                key={y}
                small
                active={meta.year === y}
                onClick={() => setParams(buildParams({ mode: "mes", year: y, month: meta.month, period: undefined, day: undefined }))}
              >
                {y}
              </ValuePill>
            ))}
          </div>
        </div>
      )}

      {/* Day-of-week pills */}
      {meta.mode === "dia" && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: "#B0A89E", letterSpacing: "0.4px", textTransform: "uppercase" }}>DÍA:</span>
          {DIAS.map((d, i) => (
            <ValuePill
              key={d}
              active={meta.day === i}
              onClick={() => setParams(buildParams({ mode: "dia", day: i, period: undefined, month: undefined, year: undefined }))}
            >
              {d}
            </ValuePill>
          ))}
        </div>
      )}

      {/* Status line */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <div style={{ width: 6, height: 6, borderRadius: 99, background: "#BA3026", flexShrink: 0 }} />
        <span style={{ fontSize: 11, color: "hsl(var(--text-muted))" }}>
          {statusLine.prefix} ·{" "}
          <b style={{ color: "hsl(var(--text-sub))", fontWeight: 600 }}>{statusLine.count}</b>
        </span>
      </div>
    </div>
  );
}

function buildStatusLine(meta: FilterMeta): { prefix: string; count: string } {
  let prefix = "";
  if (meta.mode === "periodo") prefix = `Mostrando datos de los últimos ${meta.period} días`;
  else if (meta.mode === "mes") prefix = `Mostrando datos de ${MESES_FULL[meta.month ?? 0]} ${meta.year}`;
  else prefix = `Mostrando datos de los días ${DIAS[meta.day ?? 0]}`;

  const count =
    meta.purchasesCount === 1
      ? "1 compra"
      : `${meta.purchasesCount.toLocaleString("es-MX")} compras`;

  return { prefix, count };
}

// ─── Primitives ──────────────────────────────────────────────────────────────

interface PillProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function ModePill({ active, onClick, icon, children }: PillProps & { icon: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 16px",
        borderRadius: 99,
        border: `1.5px solid ${active ? "hsl(var(--terracota))" : "hsl(var(--border))"}`,
        background: active ? "hsl(var(--terracota))" : "hsl(var(--surface))",
        color: active ? "#FFFFFF" : "hsl(var(--text-sub))",
        fontSize: 12,
        fontWeight: 600,
        cursor: "pointer",
        fontFamily: "inherit",
        transition: "all 0.15s ease",
      }}
    >
      {icon}
      {children}
    </button>
  );
}

function ValuePill({ active, onClick, children, small }: PillProps & { small?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: small ? "4px 10px" : "4px 14px",
        borderRadius: 99,
        border: `1.5px solid ${active ? "hsl(var(--terracota))" : "hsl(var(--border))"}`,
        background: active ? "hsl(var(--terracota) / 0.08)" : "transparent",
        color: active ? "hsl(var(--terracota))" : "hsl(var(--text-sub))",
        fontSize: small ? 11 : 12,
        fontWeight: active ? 700 : 400,
        cursor: "pointer",
        fontFamily: "inherit",
        transition: "all 0.15s ease",
      }}
    >
      {children}
    </button>
  );
}
