export function formatCurrency(n: number): string {
  return (n || 0).toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

export function formatDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatTime(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatNumber(n: number): string {
  return (n || 0).toLocaleString("es-MX");
}

export type StockEstado = "critico" | "bajo" | "optimo";

export function getStockEstado(actual: number, minimo: number): StockEstado {
  if (actual <= minimo) return "critico";
  if (actual < minimo * 1.5) return "bajo";
  return "optimo";
}
