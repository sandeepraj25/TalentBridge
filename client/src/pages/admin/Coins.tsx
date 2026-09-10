import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Coins as CoinsIcon, TrendingUp, TrendingDown } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { PageHeader, Spinner, StatCard } from "@/components/ui";

interface CoinRule {
  action: string;
  label: string;
  cost: number;
}

interface CoinRulesData {
  rules: CoinRule[];
  issued: number;
  spent: number;
}

export default function Coins() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-coin-rules"],
    queryFn: () => api.get<CoinRulesData>("/admin/coin-rules"),
  });

  if (isLoading) return <Spinner />;

  const rules = data?.rules ?? [];
  const issued = data?.issued ?? 0;
  const spent = data?.spent ?? 0;

  return (
    <div>
      <PageHeader title="Coin economy" description="Set the coin cost of each recruiter action." />

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <StatCard label="Coins issued" value={issued.toLocaleString("en-IN")} icon={TrendingUp} tone="green" />
        <StatCard label="Coins spent" value={spent.toLocaleString("en-IN")} icon={TrendingDown} tone="amber" />
      </div>

      <div className="space-y-3">
        {rules.map((rule) => (
          <RuleRow key={rule.action} rule={rule} />
        ))}
      </div>
    </div>
  );
}

function RuleRow({ rule }: { rule: CoinRule }) {
  const queryClient = useQueryClient();
  const [cost, setCost] = useState(String(rule.cost));

  const save = useMutation({
    mutationFn: (value: number) => api.patch(`/admin/coin-rules/${rule.action}`, { cost: value }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-coin-rules"] }),
    onError: (err) => alert(err instanceof ApiError ? err.message : "Could not update rule"),
  });

  return (
    <div className="card flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <CoinsIcon className="h-5 w-5" />
        </div>
        <div>
          <p className="font-medium text-ink">{rule.label}</p>
          <p className="font-mono text-xs text-slate-400">{rule.action}</p>
        </div>
      </div>
      <form
        className="flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate(Number(cost) || 0);
        }}
      >
        <input
          type="number"
          min={0}
          value={cost}
          onChange={(e) => setCost(e.target.value)}
          className="input w-24 py-1.5"
          aria-label={`Cost for ${rule.label}`}
        />
        <span className="text-sm text-slate-400">coins</span>
        <button type="submit" disabled={save.isPending} className="btn-primary btn-sm">
          {save.isPending ? "Saving…" : "Save"}
        </button>
      </form>
    </div>
  );
}
