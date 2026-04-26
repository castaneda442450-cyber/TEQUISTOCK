import { CATEGORY_COLORS } from "@/lib/constants";

interface CategoryBadgeProps {
  category: string;
}

export function CategoryBadge({ category }: CategoryBadgeProps) {
  const color = CATEGORY_COLORS[category] ?? "#888";
  return (
    <span
      className="inline-flex items-center rounded-pill text-[11px] font-semibold whitespace-nowrap"
      style={{
        background: `${color}22`,
        color,
        padding: "2px 10px",
      }}
    >
      {category}
    </span>
  );
}
