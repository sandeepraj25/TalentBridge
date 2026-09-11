import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Package as PackageIcon, Clock } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { Spinner, PageHeader } from "@/components/ui";
import { formatINR, formatDate } from "@/lib/utils";
import { startPlanCheckout, type CreatePaymentResponse } from "@/lib/checkout";
import type { Package } from "@/lib/types";

interface PackagesResp {
  packages: Package[];
  active: { package: { name: string }; remaining_job_posts: number; remaining_unlocks: number; expires_at: string } | null;
}

export default function Packages() {
  const { data, isLoading } = useQuery({
    queryKey: ["recruiter-packages"],
    queryFn: () => api.get<PackagesResp>("/recruiter/packages"),
  });
  const packages = data?.packages ?? [];
  const active = data?.active ?? null;

  return (
    <div>
      <PageHeader title="Packages" description="Bundle coins, job posts and unlocks into a plan and save." />

      {isLoading ? (
        <Spinner />
      ) : (
        <>
          {active && (
            <div className="card mb-6 border-brand-200 bg-brand-50/50 p-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-brand-600">Current plan</p>
                  <p className="text-lg font-bold text-ink">{active.package?.name ?? "Active plan"}</p>
                  <p className="text-xs text-slate-500">Expires {formatDate(active.expires_at)}</p>
                </div>
                <div className="flex gap-6">
                  <div>
                    <p className="text-xl font-bold text-ink">{active.remaining_job_posts}</p>
                    <p className="text-xs text-slate-500">Job posts left</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-ink">{active.remaining_unlocks}</p>
                    <p className="text-xs text-slate-500">Unlocks left</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {packages.length === 0 ? (
            <div className="card p-8 text-center text-sm text-slate-500">No packages available right now.</div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {packages.map((p) => <PackageCard key={p.id} pkg={p} />)}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function PackageCard({ pkg }: { pkg: Package }) {
  const qc = useQueryClient();
  const [coupon, setCoupon] = useState("");
  const [pendingApproval, setPendingApproval] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buy = useMutation({
    mutationFn: async () => {
      // Step 1: Create payment via backend (determines price, gateway, etc.)
      const created = await api.post<CreatePaymentResponse>("/payments/create", {
        package_id: pkg.id,
        coupon: coupon || undefined,
      });

      // Step 2: Open gateway checkout (Razorpay or Cashfree — determined by backend)
      // Step 3: After checkout, verify payment with backend
      const result = await startPlanCheckout(created);
      return result;
    },
    onSuccess: () => {
      setPendingApproval(true);
      setError(null);
      qc.invalidateQueries({ queryKey: ["recruiter-packages"] });
    },
    onError: (err) => {
      const message = err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Checkout failed.";
      // Don't show error for user-cancelled payments
      if (message === "Payment was cancelled.") {
        setError(null);
      } else {
        setError(message);
      }
    },
  });

  const features = Array.isArray(pkg.features) ? pkg.features : [];

  return (
    <div className="card flex flex-col p-5">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600"><PackageIcon className="h-5 w-5" /></div>
      <h3 className="mt-3 text-base font-semibold text-ink">{pkg.name}</h3>
      <p className="mt-1">
        <span className="text-2xl font-bold text-ink">{formatINR(pkg.price)}</span>
        <span className="text-xs text-slate-400"> / {pkg.validity_days} days</span>
      </p>
      <ul className="mt-4 flex-1 space-y-2 text-sm text-slate-600">
        {pkg.coins > 0 && <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" /> {pkg.coins} coins</li>}
        {pkg.job_posts > 0 && <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" /> {pkg.job_posts} job posts</li>}
        {pkg.candidate_unlocks > 0 && <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" /> {pkg.candidate_unlocks} candidate unlocks</li>}
        {features.map((f) => <li key={f} className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" /> {f}</li>)}
      </ul>

      {pendingApproval ? (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 shrink-0" />
            <span>Payment successful — pending admin approval.</span>
          </div>
        </div>
      ) : (
        <div className="mt-4 space-y-2">
          <input className="input py-2 text-xs" placeholder="Coupon code (optional)" value={coupon} onChange={(e) => setCoupon(e.target.value)} />
          {error && <p className="text-xs text-red-600">{error}</p>}
          <button className="btn-primary btn-sm w-full" disabled={buy.isPending} onClick={() => buy.mutate()}>
            {buy.isPending ? "Processing…" : `Buy ${pkg.name}`}
          </button>
        </div>
      )}
    </div>
  );
}
