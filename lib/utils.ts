import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return dateStr;
  }
}

export function pct(num: number, denom: number): string {
  if (!denom) return "0%";
  return `${Math.round((num / denom) * 100)}%`;
}

export function truncate(str: string | null, len = 60): string {
  if (!str) return "—";
  return str.length > len ? str.slice(0, len) + "…" : str;
}

export function priorityColor(p: string | null): string {
  if (!p) return "bo-badge-muted";
  const lower = p.toLowerCase();
  if (lower === "high") return "bo-badge-danger";
  if (lower === "medium") return "bo-badge-warning";
  if (lower === "low") return "bo-badge-info";
  return "bo-badge-muted";
}

export function progressColor(p: string | null): string {
  if (!p) return "bo-badge-muted";
  const lower = p.toLowerCase();
  if (lower.includes("complet")) return "bo-badge-success";
  if (lower.includes("progress")) return "bo-badge-info";
  if (lower.includes("review")) return "bo-badge-warning";
  return "bo-badge-muted";
}
