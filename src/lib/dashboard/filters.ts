import { addDays, eachDayOfInterval, format, getDay } from "date-fns";
import type { DashboardFilters, FilterMode, PeriodValue } from "@/types";

const VALID_PERIODS: PeriodValue[] = [7, 14, 30, 60, 90];
const DEFAULT_PERIOD: PeriodValue = 30;

export function parseFilters(searchParams: Record<string, string | string[] | undefined>): DashboardFilters {
  const modeRaw = first(searchParams.mode);
  const mode: FilterMode =
    modeRaw === "mes" || modeRaw === "dia" ? modeRaw : "periodo";

  if (mode === "periodo") {
    const periodNum = Number(first(searchParams.period));
    const period = (VALID_PERIODS as number[]).includes(periodNum)
      ? (periodNum as PeriodValue)
      : DEFAULT_PERIOD;
    return { mode: "periodo", period };
  }

  if (mode === "mes") {
    const now = new Date();
    const monthNum = Number(first(searchParams.month));
    const yearNum = Number(first(searchParams.year));
    const month = Number.isInteger(monthNum) && monthNum >= 0 && monthNum <= 11 ? monthNum : now.getMonth();
    const year = Number.isInteger(yearNum) && yearNum >= 2000 && yearNum <= 2100 ? yearNum : now.getFullYear();
    return { mode: "mes", month, year };
  }

  // dia
  const dayNum = Number(first(searchParams.day));
  const day = Number.isInteger(dayNum) && dayNum >= 0 && dayNum <= 6 ? dayNum : 0;
  return { mode: "dia", day };
}

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export interface DateRange {
  /** ISO start (inclusive) */
  start: string;
  /** ISO end (exclusive) */
  end: string;
  /** ISO prior-period start (inclusive) */
  prevStart: string;
  /** ISO prior-period end (exclusive) — equals current `start` */
  prevEnd: string;
  /** Number of daily buckets to render in trend chart */
  bucketCount: number;
}

/**
 * Resolves a filter into concrete date ranges for the current and prior period.
 * For `dia` mode there is no meaningful prior — prevStart === prevEnd === start.
 */
export function resolveDateRange(filters: DashboardFilters, now: Date = new Date()): DateRange {
  // Use UTC-based date arithmetic throughout to avoid server-timezone day shifts.
  // todayUTC = current date in UTC as YYYY-MM-DD
  const todayUTC = now.toISOString().slice(0, 10);

  if (filters.mode === "periodo") {
    const end = todayUTC;
    const start = shiftDays(todayUTC, -(filters.period - 1));
    const prevEnd = start;
    const prevStart = shiftDays(start, -filters.period);
    return {
      start,
      end,
      prevStart,
      prevEnd,
      bucketCount: filters.period,
    };
  }

  if (filters.mode === "mes") {
    const start = `${filters.year}-${String(filters.month + 1).padStart(2, "0")}-01`;
    const nextMonth = filters.month === 11 ? 0 : filters.month + 1;
    const nextYear = filters.month === 11 ? filters.year + 1 : filters.year;
    const end = `${nextYear}-${String(nextMonth + 1).padStart(2, "0")}-01`;
    const prevMonth = filters.month === 0 ? 11 : filters.month - 1;
    const prevYear = filters.month === 0 ? filters.year - 1 : filters.year;
    const prevStart = `${prevYear}-${String(prevMonth + 1).padStart(2, "0")}-01`;
    const daysInMonth = new Date(filters.year, filters.month + 1, 0).getDate();
    return {
      start,
      end,
      prevStart,
      prevEnd: start,
      bucketCount: daysInMonth,
    };
  }

  // dia: span the last 30 days, then JS-filter by weekday
  const end = todayUTC;
  const start = shiftDays(todayUTC, -29);
  return {
    start,
    end,
    prevStart: start,
    prevEnd: start,
    bucketCount: 30,
  };
}

/**
 * Returns chronological daily bucket labels for the trend chart x-axis.
 * Format: "M/d" (e.g., "4/25").
 */
export function bucketLabels(range: DateRange): string[] {
  const [y, m, d] = range.start.slice(0, 10).split("-").map(Number);
  const start = new Date(y, m - 1, d);
  const buckets = eachDayOfInterval({
    start,
    end: addDays(start, range.bucketCount - 1),
  });
  return buckets.map((d) => format(d, "M/d"));
}

/**
 * Filters by Monday=0..Sunday=6 weekday using the project convention.
 */
export function isMatchingWeekday(dateIso: string, day: number): boolean {
  const d = new Date(dateIso);
  // getDay: Sun=0..Sat=6 → convert to Mon=0..Sun=6
  const dow = (getDay(d) + 6) % 7;
  return dow === day;
}

export function statusLineLabel(filters: DashboardFilters, purchasesCount: number): string {
  const months = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
  ];
  const days = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

  let prefix = "";
  if (filters.mode === "periodo") {
    prefix = `Mostrando datos de los últimos ${filters.period} días`;
  } else if (filters.mode === "mes") {
    prefix = `Mostrando datos de ${months[filters.month]} ${filters.year}`;
  } else {
    prefix = `Mostrando datos de los días ${days[filters.day]}`;
  }
  return `${prefix} · ${purchasesCount} compra${purchasesCount === 1 ? "" : "s"}`;
}

// Shift a YYYY-MM-DD string by n days (positive = forward, negative = backward).
// Avoids timezone issues by working with local-midnight Date objects.
function shiftDays(dateStr: string, n: number): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = addDays(new Date(year, month - 1, day), n);
  return format(d, "yyyy-MM-dd");
}
