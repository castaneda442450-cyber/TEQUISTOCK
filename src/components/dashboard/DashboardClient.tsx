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
    <div className="flex flex-col" style={{ padding: "32px 32px 48px", gap: 28 }}>
      {filterBar}
      {criticalAlerts}
      {metricsRow}
      {rankingsRow}
      {chartsRow}
    </div>
  );
}
