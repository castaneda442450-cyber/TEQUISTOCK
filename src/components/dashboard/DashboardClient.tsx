"use client";

import type { ReactNode } from "react";

interface DashboardClientProps {
  filterBar: ReactNode;
  criticalAlerts?: ReactNode;
  metricsRow: ReactNode;
  rankingsRow: ReactNode;
  chartsRow: ReactNode;
}

/**
 * Client orchestration shell. Renders the dashboard layout container
 * (28px padding, 22px gap) and slots in server-rendered children.
 */
export function DashboardClient({
  filterBar,
  criticalAlerts,
  metricsRow,
  rankingsRow,
  chartsRow,
}: DashboardClientProps) {
  return (
    <div className="px-7 py-7 flex flex-col gap-[22px]">
      {filterBar}
      {criticalAlerts}
      {metricsRow}
      {rankingsRow}
      {chartsRow}
    </div>
  );
}
