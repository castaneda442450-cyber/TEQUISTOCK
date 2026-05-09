"use client";

import "./ChartSetup";
import { useMemo } from "react";
import { Line } from "react-chartjs-2";
import type { ChartOptions } from "chart.js";
import { formatCurrency } from "@/lib/format";
import type { SpendingTrendPoint } from "@/types";

interface SpendingTrendChartProps {
  data: SpendingTrendPoint[];
}

const TERRACOTA = "#BA3026";
const GOLD = "#C2972E";
const GREEN = "#106653";

export function SpendingTrendChart({ data }: SpendingTrendChartProps) {
  const chartData = useMemo(() => ({
    labels: data.map((d) => d.label),
    datasets: [
      {
        label: "Compras",
        data: data.map((d) => d.compras),
        borderColor: TERRACOTA,
        backgroundColor: `${TERRACOTA}14`,
        fill: true,
        tension: 0.4,
        pointRadius: 2,
        borderWidth: 3,
      },
      {
        label: "Merma",
        data: data.map((d) => d.merma),
        borderColor: GOLD,
        backgroundColor: `${GOLD}14`,
        fill: true,
        tension: 0.4,
        pointRadius: 2,
        borderWidth: 2,
        borderDash: [5, 4],
      },
      {
        label: "Neto",
        data: data.map((d) => d.compras - d.merma),
        borderColor: GREEN,
        backgroundColor: "transparent",
        fill: false,
        tension: 0.4,
        pointRadius: 2,
        borderWidth: 2,
        borderDash: [3, 3],
      },
    ],
  }), [data]);

  const options = useMemo<ChartOptions<"line">>(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: { font: { size: 11 }, boxWidth: 12, usePointStyle: false },
      },
      tooltip: {
        mode: "index",
        intersect: false,
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: ${formatCurrency(ctx.parsed.y ?? 0)}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 10 }, maxTicksLimit: 8 },
      },
      y: {
        grid: { display: false },
        ticks: {
          font: { size: 10 },
          callback: (v) => `$${(Number(v) / 1000).toFixed(0)}k`,
        },
      },
    },
    interaction: { mode: "index", intersect: false },
  }), []);

  return (
    <div style={{ height: 220 }}>
      <Line data={chartData} options={options} />
    </div>
  );
}
