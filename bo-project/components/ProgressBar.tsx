import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number; // 0–100
  label?: string;
  color?: "orange" | "green" | "teal" | "yellow";
  size?: "sm" | "md";
}

const colors = {
  orange: "bg-bo-orange",
  green:  "bg-green-500",
  teal:   "bg-sky-500",
  yellow: "bg-yellow-500",
};

export default function ProgressBar({ value, label, color = "orange", size = "md" }: ProgressBarProps) {
  const h = size === "sm" ? "h-1.5" : "h-2";
  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between text-xs mb-1">
          <span className="text-bo-subtle">{label}</span>
          <span className="text-bo-text font-semibold">{value}%</span>
        </div>
      )}
      <div className={cn("w-full bg-bo-muted/40 rounded-full overflow-hidden", h)}>
        <div
          className={cn("h-full rounded-full transition-all duration-700", colors[color])}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    </div>
  );
}
