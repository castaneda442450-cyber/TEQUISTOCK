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
      className="bg-surface border border-border rounded-card px-5 py-4 flex flex-col gap-3.5 transition-opacity"
      style={{ opacity: isPending ? 0.7 : 1 }}
    >
      {/* Mode tabs */}
      <div className="flex gap-1.5">
        <ModePill active={meta.mode === "periodo"} onClick={() => onMode("periodo")} icon={<Calendar size={13} />}>
          Por período
        </ModePill>
        <ModePill active={meta.mode === "mes"} onClick={() => onMode("mes")} icon={<CalendarRange size={13} />}>
          Por mes
        </ModePill>
        <ModePill active={meta.mode === "dia"} onClick={() => onMode("dia")} icon={<CalendarDays size={13} />}>
          Por día
        </ModePill>
      </div>

      {/* Period pills */}
      {meta.mode === "periodo" && (
        <div className="flex gap-2 flex-wrap items-center">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">RANGO:</span>
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
        <div className="flex gap-4 flex-wrap items-center">
          <div className="flex gap-1.5 flex-wrap items-center">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted self-center">MES:</span>
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
          <div className="flex gap-1.5 items-center">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">AÑO:</span>
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
        <div className="flex gap-2 flex-wrap items-center">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">DÍA:</span>
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
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-terracota" />
        <span className="text-[11px] text-text-muted">
          {statusLine.prefix} · <b className="text-text-sub">{statusLine.count}</b>
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
      : `${meta.purchasesCount.toLocaleString("en-US")} compras`;

  return { prefix, count };
}

// ─── Pill primitives ─────────────────────────────────────────────────────────

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
      className={[
        "flex items-center gap-1.5 px-[18px] py-[7px] rounded-pill text-[12px] font-semibold border transition-all",
        active
          ? "bg-terracota text-white border-terracota"
          : "bg-surface text-text-sub border-border hover:border-border-strong",
      ].join(" ")}
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
      className={[
        "rounded-pill border transition-all",
        small ? "px-3 py-[5px] text-[11px]" : "px-[14px] py-[5px] text-[12px]",
        active
          ? "border-terracota text-terracota font-bold"
          : "border-border text-text-sub font-normal hover:border-border-strong",
      ].join(" ")}
      style={
        active
          ? { background: "rgba(186, 48, 38, 0.10)" }
          : { background: "transparent" }
      }
    >
      {children}
    </button>
  );
}
