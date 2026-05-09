import { CATEGORY_COLORS } from "@/lib/constants";

type CategoryProp =
  | { nombre: string; color: string }
  | string
  | null
  | undefined;

interface CategoryBadgeProps {
  category: CategoryProp;
}

export function CategoryBadge({ category }: CategoryBadgeProps) {
  if (!category) {
    return <span style={{ fontSize: 11, color: "hsl(var(--text-muted))" }}>Sin categoría</span>;
  }

  const nombre = typeof category === "string" ? category : category.nombre;
  const color =
    typeof category === "string"
      ? (CATEGORY_COLORS[category] ?? "#888")
      : category.color;

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
      {nombre}
    </span>
  );
}
