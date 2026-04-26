import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="px-7 py-7 flex flex-col gap-[22px]">
      {/* Filter bar skeleton */}
      <Skeleton className="h-[120px] w-full rounded-card" />

      {/* Metrics row */}
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[88px] rounded-card" />
        ))}
      </div>

      {/* Rankings row */}
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-[400px] rounded-card" />
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-[300px] rounded-card" />
        <Skeleton className="h-[300px] rounded-card" />
      </div>
    </div>
  );
}
