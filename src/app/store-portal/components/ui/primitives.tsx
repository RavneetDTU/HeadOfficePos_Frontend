import { cn } from "@/app/store-portal/lib/utils";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
}) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed",
        variant === "primary" && "bg-teal-700 text-white hover:bg-teal-800",
        variant === "secondary" && "bg-white border border-slate-200 text-slate-800 hover:bg-slate-50",
        variant === "ghost" && "text-slate-600 hover:bg-slate-100",
        variant === "danger" && "bg-red-600 text-white hover:bg-red-700",
        className
      )}
      {...props}
    />
  );
}

export function Card({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("bg-white border border-slate-200 rounded-xl shadow-sm", className)}>
      {children}
    </div>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "ok" | "warn" | "danger" | "info";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold",
        tone === "neutral" && "bg-slate-100 text-slate-700",
        tone === "ok" && "bg-emerald-50 text-emerald-700",
        tone === "warn" && "bg-amber-50 text-amber-700",
        tone === "danger" && "bg-rose-50 text-rose-700",
        tone === "info" && "bg-sky-50 text-sky-700"
      )}
    >
      {children}
    </span>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
      </div>
      {actions}
    </div>
  );
}

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="text-center py-16 px-4">
      <p className="text-sm font-medium text-slate-800">{title}</p>
      {description && <p className="text-sm text-slate-500 mt-1">{description}</p>}
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 flex items-center justify-between gap-3">
      <span>{message}</span>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-slate-200/80", className)} />;
}

export function StockBadge({ available, alertQty = 0 }: { available: number; alertQty?: number }) {
  if (available <= 0) return <Badge tone="danger">Currently unavailable</Badge>;
  if (alertQty > 0 && available <= alertQty)
    return <Badge tone="warn">Only {available} left</Badge>;
  if (available <= 5) return <Badge tone="warn">Only {available} left</Badge>;
  return <Badge tone="ok">✓ {available} Available</Badge>;
}

export function Pagination({
  page,
  pages,
  total,
  onPage,
}: {
  page: number;
  pages: number;
  total?: number;
  onPage: (page: number) => void;
}) {
  if (pages <= 1) return total != null ? (
    <p className="text-sm text-slate-500 mt-6">{total} result{total === 1 ? "" : "s"}</p>
  ) : null;

  const windowSize = 5;
  const start = Math.max(1, Math.min(page - 2, pages - windowSize + 1));
  const nums = Array.from({ length: Math.min(windowSize, pages) }, (_, i) => start + i).filter(
    (n) => n >= 1 && n <= pages
  );

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mt-6">
      <p className="text-sm text-slate-500">
        Page {page} of {pages}
        {total != null ? ` · ${total} results` : ""}
      </p>
      <div className="flex items-center gap-1">
        <Button variant="secondary" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          Previous
        </Button>
        {nums.map((n) => (
          <Button
            key={n}
            variant={n === page ? "primary" : "secondary"}
            className="min-w-9 px-2"
            onClick={() => onPage(n)}
          >
            {n}
          </Button>
        ))}
        <Button variant="secondary" disabled={page >= pages} onClick={() => onPage(page + 1)}>
          Next
        </Button>
      </div>
    </div>
  );
}

/** Shown when a required backend endpoint is missing or incomplete */
export function BackendBanner({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 mb-4">
      <p className="font-semibold text-amber-950">BACKEND API REQUIRED</p>
      <div className="mt-1 text-amber-800/90">{children}</div>
    </div>
  );
}
