import { MERMA_COLORS } from "@/lib/constants";

interface MermaBadgeProps {
  type: string;
}

export function MermaBadge({ type }: MermaBadgeProps) {
  const color = MERMA_COLORS[type] ?? "#78909C";
  return (
    <span
      style={{
        backgroundColor: color + "22",
        color,
        borderRadius: 99,
        fontSize: 11,
        fontWeight: 600,
        padding: "2px 10px",
        whiteSpace: "nowrap",
      }}
    >
      {type}
    </span>
  );
}
