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
    <div className="bg-surface border border-border rounded-card shadow-card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 bg-surface-alt border-b border-border">
        <div className="flex items-center gap-2.5">
          {icon && (
            <div
              className="flex items-center justify-center rounded-md p-1.5"
              style={{ background: iconBg ?? "rgba(186, 48, 38, 0.13)" }}
            >
              {icon}
            </div>
          )}
          <span className="text-[14px] font-bold text-text-main">{title}</span>
        </div>
        {headerRight}
      </div>
      <div className={bodyClassName ?? "p-5"}>{children}</div>
    </div>
  );
}
