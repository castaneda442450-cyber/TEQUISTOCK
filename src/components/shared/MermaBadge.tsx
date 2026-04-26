import { MERMA_COLORS } from "@/lib/constants";

interface MermaBadgeProps {
  type: string;
}

export function MermaBadge({ type }: MermaBadgeProps) {
  const color = MERMA_COLORS[type] ?? "#78909C";
  return (
    <span
      className="inline-flex items-center rounded-pill text-[11px] font-semibold whitespace-nowrap"
      style={{
        background: `${color}22`,
        color,
        padding: "2px 10px",
      }}
    >
      {type}
    </span>
  );
}
