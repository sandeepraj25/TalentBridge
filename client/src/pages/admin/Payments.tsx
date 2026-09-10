import { useQuery } from "@tanstack/react-query";
import { IndianRupee, Receipt } from "lucide-react";
import { api } from "@/lib/api";
import { PageHeader, Spinner, Badge, StatCard, EmptyState } from "@/components/ui";
import { formatINR, formatDate } from "@/lib/utils";

interface Payment {
  id: string;
  invoice_no: string;
  amount: number;
  method: string;
  status: string;
  created_at: string;
  kind: string;
  coins: number | null;
  coupon_code: string | null;
  package_name: string | null;
}

const statusTone: Record<string, string> = {
  paid: "green",
  success: "green",
  completed: "green",
  pending: "amber",
  failed: "red",
  refunded: "slate",
};

export default function Payments() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-payments"],
    queryFn: () => api.get<{ payments: Payment[]; total: number }>("/admin/payments"),
  });

  if (isLoading) return <Spinner />;

  const payments = data?.payments ?? [];
  const total = data?.total ?? 0;

  return (
    <div>
      <PageHeader title="Payments" description="Every transaction across the platform." />

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <StatCard label="Total revenue" value={formatINR(total)} icon={IndianRupee} tone="green" />
        <StatCard label="Transactions" value={payments.length} icon={Receipt} tone="brand" />
      </div>

      {payments.length === 0 ? (
        <EmptyState icon={Receipt} title="No payments yet" description="Transactions will appear here once recruiters purchase." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                <th className="px-4 py-3">Invoice</th>
                <th className="px-4 py-3">Item</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payments.map((p) => (
                <tr key={p.id} className="align-middle">
                  <td className="px-4 py-3 font-mono text-xs text-slate-600">{p.invoice_no}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink">
                      {p.package_name || (p.coins != null ? `${p.coins} coins` : "—")}
                    </p>
                    {p.coupon_code && (
                      <p className="mt-0.5 text-xs text-slate-400">
                        Coupon <span className="font-mono">{p.coupon_code}</span>
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium text-ink">{formatINR(p.amount)}</td>
                  <td className="px-4 py-3 uppercase text-slate-500">{p.method || "—"}</td>
                  <td className="px-4 py-3">
                    <Badge tone={statusTone[p.status] ?? "slate"} className="capitalize">{p.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{formatDate(p.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
