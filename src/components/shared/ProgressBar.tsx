interface ProgressBarProps {
  value: number;
  color?: string;
}

export function ProgressBar({ value, color = "#BA3026" }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      className="overflow-hidden mt-2"
      style={{
        background: "#F0EDE8",
        height: 3,
        borderRadius: 99,
      }}
    >
      <div
        className="h-full transition-[width] duration-500 ease-out"
        style={{ width: `${clamped}%`, background: color, borderRadius: 99 }}
      />
    </div>
  );
}
