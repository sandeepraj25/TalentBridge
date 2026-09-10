import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ShieldCheck } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { PageHeader, Spinner, Badge, EmptyState } from "@/components/ui";
import { cn, timeAgo } from "@/lib/utils";
import { REPORT_STATUS } from "@/lib/constants";

interface Report {
  id: string;
  target_type: string;
  target_id: string;
  reason: string;
  details: string | null;
  status: string;
  created_at: string;
}

const statusTone: Record<string, string> = {
  open: "amber",
  reviewing: "blue",
  resolved: "green",
  dismissed: "slate",
};

const targetTone: Record<string, string> = {
  job: "violet",
  company: "blue",
  user: "orange",
};

export default function Reports() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-reports"],
    queryFn: () => api.get<{ reports: Report[] }>("/admin/reports"),
  });

  const update = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/admin/reports/${id}`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-reports"] }),
    onError: (err) => alert(err instanceof ApiError ? err.message : "Could not update report"),
  });

  if (isLoading) return <Spinner />;

  const reports = data?.reports ?? [];

  return (
    <div>
      <PageHeader title="Reports" description="Review content flagged by the community." />

      {reports.length === 0 ? (
        <EmptyState icon={ShieldCheck} title="Nothing flagged" description="There are no reports to review right now." />
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <div key={r.id} className="card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-ink">{r.reason}</p>
                    <Badge tone={targetTone[r.target_type] ?? "slate"} className="capitalize">{r.target_type}</Badge>
                  </div>
                  {r.details && <p className="mt-1 text-sm text-slate-600">{r.details}</p>}
                  <p className="mt-1 text-xs text-slate-400">
                    Target #{r.target_id} · {timeAgo(r.created_at)}
                  </p>
                </div>
                <Badge tone={statusTone[r.status] ?? "slate"} className="capitalize">{r.status}</Badge>
              </div>

              <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                {REPORT_STATUS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => update.mutate({ id: r.id, status: s })}
                    disabled={update.isPending || r.status === s}
                    className={cn(
                      "btn-sm capitalize",
                      r.status === s ? "btn-primary" : "btn-outline"
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
