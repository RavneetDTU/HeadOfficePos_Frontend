import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function fmtZAR(val: number) {
  return `R ${Number(val || 0).toLocaleString("en-ZA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function fmtDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-ZA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** Percent off MRP, or null when there is no discount. */
export function discountPercent(mrp?: number | null, sellingPrice?: number | null) {
  const list = Number(mrp || 0);
  const sell = Number(sellingPrice || 0);
  if (list <= 0 || sell <= 0 || list <= sell) return null;
  return Math.round(((list - sell) / list) * 100);
}
