import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: LucideIcon;
  trend?: "up" | "down" | "flat";
  accent?: "orange" | "teal" | "green" | "yellow";
}

const accentMap = {
  orange: { bg: "bg-bo-orange/10", text: "text-bo-orange", border: "border-bo-orange/20" },
  teal:   { bg: "bg-sky-500/10",   text: "text-sky-400",   border: "border-sky-500/20" },
  green:  { bg: "bg-green-500/10", text: "text-green-400", border: "border-green-500/20" },
  yellow: { bg: "bg-yellow-500/10",text: "text-yellow-400",border: "border-yellow-500/20" },
};

export default function StatCard({ label, value, sub, icon: Icon, accent = "orange" }: StatCardProps) {
  const a = accentMap[accent];
  return (
    <div className={cn("bo-card p-5 flex items-start gap-4", a.border)}>
      <div className={cn("rounded-xl p-2.5 flex-shrink-0", a.bg)}>
        <Icon size={20} className={a.text} />
      </div>
      <div className="min-w-0">
        <div className="text-bo-subtle text-xs font-medium uppercase tracking-wider mb-1">{label}</div>
        <div className="text-2xl font-bold text-bo-text leading-none stat-animate">{value}</div>
        {sub && <div className="text-bo-subtle text-xs mt-1">{sub}</div>}
      </div>
    </div>
  );
}
