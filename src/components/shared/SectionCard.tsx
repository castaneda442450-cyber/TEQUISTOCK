import type { ReactNode } from "react";

interface SectionCardProps {
  title: string;
  icon?: ReactNode;
  iconBg?: string;
  headerRight?: ReactNode;
  children: ReactNode;
  bodyClassName?: string;
}

export function SectionCard({
  title,
  icon,
  iconBg,
  headerRight,
  children,
  bodyClassName,
}: SectionCardProps) {
  return (
    <div
      style={{
        background: "hsl(var(--surface))",
        borderRadius: 10,
        border: "1px solid hsl(var(--border))",
        boxShadow: "0 1px 3px var(--shadow-color), 0 6px 18px var(--shadow-color)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          background: "hsl(var(--surface-alt))",
          borderBottom: "1px solid hsl(var(--border))",
          padding: "14px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {icon && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 6,
                padding: 6,
                background: iconBg ?? "rgba(186, 48, 38, 0.13)",
              }}
            >
              {icon}
            </div>
          )}
          <span
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: "hsl(var(--text-main))",
              letterSpacing: "-0.01em",
            }}
          >
            {title}
          </span>
        </div>
        {headerRight}
      </div>
      <div style={bodyClassName ? undefined : { padding: "22px 24px" }} className={bodyClassName}>
        {children}
      </div>
    </div>
  );
}
