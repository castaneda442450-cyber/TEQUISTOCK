"use client";

import "./ChartSetup";
import { useMemo } from "react";
import { Bar } from "react-chartjs-2";
import type { ChartOptions } from "chart.js";
import { formatCurrency } from "@/lib/format";

interface CategorySpendChartProps {
  data: Record<string, { value: number; color: string }>;
}

export function CategorySpendChart({ data }: CategorySpendChartProps) {
  const chartData = useMemo(() => {
    const sorted = Object.entries(data)
      .filter(([, v]) => v.value > 0)
      .sort((a, b) => b[1].value - a[1].value);
    const labels = sorted.map(([k]) => k);
    const values = sorted.map(([, v]) => v.value);
    const colors = sorted.map(([, v]) => v.color);
    return {
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
  }, [data]);

  const options = useMemo<ChartOptions<"bar">>(() => ({
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
  }), []);

  if (chartData.labels.length === 0) {
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
