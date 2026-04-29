"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = getVisiblePages(currentPage, totalPages);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        padding: "14px 0",
      }}
    >
      <PageBtn
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
        ariaLabel="Página anterior"
      >
        <ChevronLeft size={14} />
      </PageBtn>

      {pages.map((p, idx) =>
        p === "ellipsis" ? (
          <span
            key={`e-${idx}`}
            style={{
              padding: "0 4px",
              fontSize: 13,
              color: "hsl(var(--text-muted))",
              userSelect: "none",
            }}
          >
            …
          </span>
        ) : (
          <PageBtn
            key={p}
            active={p === currentPage}
            onClick={() => onPageChange(p)}
            ariaLabel={`Ir a página ${p}`}
          >
            {p}
          </PageBtn>
        ),
      )}

      <PageBtn
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        ariaLabel="Página siguiente"
      >
        <ChevronRight size={14} />
      </PageBtn>
    </div>
  );
}

interface PageBtnProps {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
}

function PageBtn({ children, onClick, active = false, disabled = false, ariaLabel }: PageBtnProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-current={active ? "page" : undefined}
      style={{
        minWidth: 32,
        height: 32,
        padding: "0 10px",
        fontSize: 13,
        fontWeight: 600,
        fontVariantNumeric: "tabular-nums",
        borderRadius: 8,
        border: "1px solid",
        borderColor: active ? "hsl(var(--terracota))" : "hsl(var(--border))",
        backgroundColor: active ? "hsl(var(--terracota))" : "hsl(var(--surface))",
        color: active ? "white" : "hsl(var(--text-sub))",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.4 : 1,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all 0.15s ease",
        fontFamily: "inherit",
      }}
      onMouseEnter={(e) => {
        if (!active && !disabled) {
          (e.currentTarget as HTMLButtonElement).style.borderColor = "hsl(var(--border-strong))";
          (e.currentTarget as HTMLButtonElement).style.color = "hsl(var(--text-main))";
        }
      }}
      onMouseLeave={(e) => {
        if (!active && !disabled) {
          (e.currentTarget as HTMLButtonElement).style.borderColor = "hsl(var(--border))";
          (e.currentTarget as HTMLButtonElement).style.color = "hsl(var(--text-sub))";
        }
      }}
    >
      {children}
    </button>
  );
}

function getVisiblePages(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | "ellipsis")[] = [1];

  if (current > 3) pages.push("ellipsis");

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);

  if (current < total - 2) pages.push("ellipsis");

  pages.push(total);
  return pages;
}
