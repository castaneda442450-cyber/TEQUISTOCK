"use client";

import "./ChartSetup";
import { Bar } from "react-chartjs-2";
import type { ChartOptions } from "chart.js";
import { CATEGORY_COLORS } from "@/lib/constants";
import { formatCurrency } from "@/lib/format";

interface CategorySpendChartProps {
  data: Record<string, number>;
}

export function CategorySpendChart({ data }: CategorySpendChartProps) {
  const sorted = Object.entries(data)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1]);

  const labels = sorted.map(([k]) => k);
  const values = sorted.map(([, v]) => v);
  const colors = labels.map((c) => CATEGORY_COLORS[c] ?? "#888");

  const chartData = {
    labels,
    datasets: [
      {
        label: "Gasto",
        data: values,
        backgroundColor: colors.map((c) => `${c}CC`),
        borderColor: colors,
        borderWidth: 2,
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  };

  const options: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => ` ${formatCurrency(ctx.parsed.y ?? 0)}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 11 } },
      },
      y: {
        grid: { display: false },
        ticks: {
          font: { size: 10 },
          callback: (v) => `$${(Number(v) / 1000).toFixed(0)}k`,
        },
      },
    },
  };

  if (labels.length === 0) {
    return (
      <div style={{ height: 220 }} className="flex items-center justify-center">
        <span className="text-[12px] text-text-muted">Sin gastos en este rango</span>
      </div>
    );
  }

  return (
    <div style={{ height: 220 }}>
      <Bar data={chartData} options={options} />
    </div>
  );
}
