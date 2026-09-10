import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDistanceToNow, format } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatINR(value: number | null | undefined, opts?: { compact?: boolean }) {
  if (value === null || value === undefined) return "—";
  const v = Number(value);
  if (opts?.compact) {
    if (v >= 10000000) return `₹${(v / 10000000).toFixed(v % 10000000 === 0 ? 0 : 1)} Cr`;
    if (v >= 100000) return `₹${(v / 100000).toFixed(v % 100000 === 0 ? 0 : 1)} L`;
    if (v >= 1000) return `₹${(v / 1000).toFixed(0)}K`;
  }
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(v);
}

export function salaryRange(min: number | null | undefined, max: number | null | undefined) {
  if (!min && !max) return "Not disclosed";
  if (min && max) return `${formatINR(min, { compact: true })} – ${formatINR(max, { compact: true })}`;
  return formatINR(min || max, { compact: true });
}

export function timeAgo(date: string | Date | null | undefined) {
  if (!date) return "";
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  } catch {
    return "";
  }
}

export function formatDate(date: string | Date | null | undefined, fmt = "d MMM yyyy") {
  if (!date) return "—";
  try {
    return format(new Date(date), fmt);
  } catch {
    return "—";
  }
}

export function initials(name: string | null | undefined) {
  if (!name) return "?";
  return name.split(" ").map((n) => n[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

export function pluralize(count: number, word: string, plural?: string) {
  return `${count} ${count === 1 ? word : plural || word + "s"}`;
}

export function toList(value: string | string[] | null | undefined): string[] {
  if (Array.isArray(value)) return value;
  return String(value || "").split(",").map((s) => s.trim()).filter(Boolean);
}
