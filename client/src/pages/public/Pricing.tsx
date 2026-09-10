import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Check, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import { Spinner } from "@/components/ui";
import { cn, formatINR } from "@/lib/utils";
import type { Package } from "@/lib/types";

export default function Pricing() {
  const { data, isLoading } = useQuery({
    queryKey: ["packages"],
    queryFn: () => api.get<{ packages: Package[] }>("/packages"),
  });
  const packages = data?.packages ?? [];

  return (
    <div className="container-page py-14">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="font-display text-4xl font-semibold text-ink">Simple, usage-based pricing</h1>
        <p className="mt-3 text-slate-500">
          Buy coins in a package that fits your hiring, then spend them to post jobs, unlock candidates, and boost roles.
        </p>
      </div>

      {isLoading ? (
        <Spinner />
      ) : packages.length === 0 ? (
        <p className="mt-10 text-center text-sm text-slate-500">Pricing details are being updated. Please check back soon.</p>
      ) : (
        <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {packages.map((pkg, i) => {
            const popular = i === 1;
            return (
              <div
                key={pkg.id}
                className={cn(
                  "card relative flex flex-col p-6",
                  popular && "border-brand-500 shadow-lift ring-1 ring-brand-500"
                )}
              >
                {popular && (
                  <span className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-brand-600 px-3 py-1 text-xs font-semibold text-white shadow-sm">
                    <Sparkles className="h-3 w-3" /> Most popular
                  </span>
                )}
                <h2 className="text-lg font-semibold text-ink">{pkg.name}</h2>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-ink">{formatINR(pkg.price)}</span>
                  <span className="text-sm text-slate-400">/ {pkg.validity_days} days</span>
                </div>

                <ul className="mt-6 flex-1 space-y-3">
                  {(pkg.features ?? []).map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
                      <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                        <Check className="h-3 w-3" />
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  to="/register?role=recruiter"
                  className={cn("mt-6 w-full", popular ? "btn-primary" : "btn-outline")}
                >
                  Get {pkg.name}
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
