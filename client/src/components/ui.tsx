import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import type { ComponentType, ReactNode } from "react";
import { cn } from "@/lib/utils";

const tones: Record<string, string> = {
  slate: "bg-slate-100 text-slate-700",
  blue: "bg-brand-50 text-brand-700",
  green: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-700",
  red: "bg-red-50 text-red-700",
  violet: "bg-violet-50 text-violet-700",
  orange: "bg-accent-50 text-accent-600",
};

export function Badge({ tone = "slate", className, children }: { tone?: string; className?: string; children: ReactNode }) {
  return <span className={cn("badge", tones[tone] ?? tones.slate, className)}>{children}</span>;
}

export function Field({
  label, htmlFor, hint, error, required, className, children,
}: {
  label?: string; htmlFor?: string; hint?: string; error?: string; required?: boolean; className?: string; children: ReactNode;
}) {
  return (
    <div className={cn("space-y-1", className)}>
      {label && (
        <label htmlFor={htmlFor} className="label">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      {children}
      {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
      {error && <p className="text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}

export function EmptyState({
  icon: Icon, title, description, action, className,
}: {
  icon?: ComponentType<{ className?: string }>; title: string; description?: string;
  action?: { label: string; href: string }; className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 py-14 text-center", className)}>
      {Icon && (
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600">
          <Icon className="h-6 w-6" />
        </div>
      )}
      <h3 className="text-base font-semibold text-ink">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>}
      {action && <Link to={action.href} className="btn-primary btn-sm mt-4">{action.label}</Link>}
    </div>
  );
}

export function StatCard({
  label, value, icon: Icon, hint, tone = "brand", className,
}: {
  label: string; value: string | number; icon?: ComponentType<{ className?: string }>; hint?: string;
  tone?: "brand" | "green" | "amber" | "violet" | "slate"; className?: string;
}) {
  const toneMap = {
    brand: "bg-brand-50 text-brand-600", green: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600", violet: "bg-violet-50 text-violet-600", slate: "bg-slate-100 text-slate-600",
  } as const;
  return (
    <div className={cn("card flex items-start justify-between p-5", className)}>
      <div>
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <p className="mt-1 text-2xl font-bold text-ink">{value}</p>
        {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
      </div>
      {Icon && (
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", toneMap[tone])}>
          <Icon className="h-5 w-5" />
        </div>
      )}
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center py-16 text-slate-400", className)}>
      <Loader2 className="h-6 w-6 animate-spin" />
    </div>
  );
}

export function PageHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-ink">{title}</h1>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  );
}

export function Logo({ className, to = "/" }: { className?: string; to?: string }) {
  return (
    <Link to={to} className={cn("inline-flex items-center gap-2 font-display text-xl font-semibold text-ink", className)}>
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8Z" />
          <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
        </svg>
      </span>
      <span>Talent Hai</span>
    </Link>
  );
}
