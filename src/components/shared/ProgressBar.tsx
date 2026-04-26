interface ProgressBarProps {
  value: number;
  color?: string;
}

export function ProgressBar({ value, color = "#BA3026" }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      className="h-1 rounded-pill overflow-hidden mt-1.5"
      style={{ background: "var(--surface-hover)" }}
    >
      <div
        className="h-full rounded-pill transition-[width] duration-500 ease-out"
        style={{ width: `${clamped}%`, background: color }}
      />
    </div>
  );
}
