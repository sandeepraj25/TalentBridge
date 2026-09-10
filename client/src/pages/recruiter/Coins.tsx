import { useState, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Coins, TrendingUp, TrendingDown, CheckCircle2, AlertTriangle } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { Badge, StatCard, Spinner, PageHeader } from "@/components/ui";
import { formatINR, timeAgo } from "@/lib/utils";

interface Txn {
  id: string;
  type: string;
  amount: number;
  balance_after: number;
  reason: string | null;
  created_at: string;
}
interface CoinsResp {
  balance: number;
  transactions: Txn[];
}

const PACKS = [
  { coins: 50, amount: 500 },
  { coins: 150, amount: 1400 },
  { coins: 500, amount: 4500 },
  { coins: 1200, amount: 10000 },
];

export default function CoinsPage() {
  const [params] = useSearchParams();
  const paid = params.get("paid");
  const need = params.get("need");
  const qc = useQueryClient();
  const [ok, setOk] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["recruiter-coins"],
    queryFn: () => api.get<CoinsResp>("/recruiter/coins"),
  });
  const balance = data?.balance ?? 0;
  const txns = data?.transactions ?? [];
  const earned = txns.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const spent = txns.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);

  const buy = useMutation({
    mutationFn: (pack: { coins: number; amount: number }) =>
      api.post("/recruiter/checkout", { kind: "coins", coins: pack.coins, amount: pack.amount }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["recruiter-coins"] });
      setOk(true);
      setTimeout(() => setOk(false), 3000);
    },
    onError: (err) => alert(err instanceof ApiError ? err.message : "Payment could not be completed."),
  });

  return (
    <div>
      <PageHeader title="Coins" description="Coins unlock candidate contacts and promote your jobs." />

      {paid && <Banner tone="green">Payment successful — your coins have been added.</Banner>}
      {need && <Banner tone="amber">You don't have enough coins for that action. Top up below.</Banner>}
      {ok && <Banner tone="green">Coins added to your balance.</Banner>}

      {isLoading ? (
        <Spinner />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Balance" value={balance} icon={Coins} tone="amber" />
            <StatCard label="Total earned" value={earned} icon={TrendingUp} tone="green" />
            <StatCard label="Total spent" value={spent} icon={TrendingDown} tone="violet" />
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <h2 className="mb-3 text-lg font-semibold text-ink">Transaction history</h2>
              {txns.length === 0 ? (
                <div className="card p-8 text-center text-sm text-slate-500">No transactions yet.</div>
              ) : (
                <div className="card divide-y divide-slate-100">
                  {txns.map((t) => (
                    <div key={t.id} className="flex items-center gap-3 p-4">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-ink">{t.reason || t.type}</p>
                        <p className="text-xs text-slate-400">{timeAgo(t.created_at)} · Balance {t.balance_after}</p>
                      </div>
                      <Badge tone="slate">{t.type}</Badge>
                      <span className={`shrink-0 text-sm font-semibold ${t.amount < 0 ? "text-red-600" : "text-emerald-600"}`}>
                        {t.amount > 0 ? "+" : ""}{t.amount}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h2 className="mb-3 text-lg font-semibold text-ink">Buy coins</h2>
              <div className="space-y-3">
                {PACKS.map((p) => (
                  <div key={p.coins} className="card flex items-center justify-between p-4">
                    <div>
                      <p className="text-base font-semibold text-ink">{p.coins} coins</p>
                      <p className="text-xs text-slate-500">{formatINR(p.amount)}</p>
                    </div>
                    <button className="btn-primary btn-sm" disabled={buy.isPending} onClick={() => buy.mutate(p)}>Buy</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Banner({ tone, children }: { tone: "green" | "amber"; children: ReactNode }) {
  const cls = tone === "green" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700";
  const Icon = tone === "green" ? CheckCircle2 : AlertTriangle;
  return (
    <div className={`mb-5 flex items-center gap-2 rounded-lg border px-4 py-3 text-sm ${cls}`}>
      <Icon className="h-4 w-4 shrink-0" /> {children}
    </div>
  );
}
