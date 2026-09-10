import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Building2, Briefcase } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { PageHeader, Spinner, EmptyState } from "@/components/ui";
import { timeAgo } from "@/lib/utils";

interface PendingJob {
  id: string;
  title: string;
  company_name: string | null;
  created_at: string;
}

interface PendingCompany {
  id: string;
  name: string;
  slug: string;
  industry: string | null;
  created_at: string;
}

export default function Approvals() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-approvals"],
    queryFn: () => api.get<{ jobs: PendingJob[]; companies: PendingCompany[] }>("/admin/approvals"),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin-approvals"] });
  const onError = (err: unknown) => alert(err instanceof ApiError ? err.message : "Could not update");

  const companyVerify = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/admin/companies/${id}/verification`, { status }),
    onSuccess: invalidate,
    onError,
  });

  const jobApproval = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/admin/jobs/${id}/approval`, { status }),
    onSuccess: invalidate,
    onError,
  });

  if (isLoading) return <Spinner />;

  const jobs = data?.jobs ?? [];
  const companies = data?.companies ?? [];
  const empty = jobs.length === 0 && companies.length === 0;

  return (
    <div>
      <PageHeader title="Approvals" description="Clear the queue of pending verifications and jobs." />

      {empty ? (
        <EmptyState icon={CheckCircle2} title="All caught up" description="There's nothing waiting for your review right now." />
      ) : (
        <div className="space-y-8">
          <section>
            <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-ink">
              <Building2 className="h-5 w-5 text-slate-400" /> Company verifications
              <span className="text-sm font-normal text-slate-400">({companies.length})</span>
            </h2>
            {companies.length === 0 ? (
              <p className="text-sm text-slate-500">No pending company verifications.</p>
            ) : (
              <div className="space-y-3">
                {companies.map((c) => (
                  <div key={c.id} className="card flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-base font-semibold text-ink">{c.name}</p>
                      <p className="mt-0.5 text-sm text-slate-500">
                        {c.industry || "—"}
                        <span className="mx-1.5 text-slate-300">•</span>
                        <span className="text-xs text-slate-400">requested {timeAgo(c.created_at)}</span>
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        onClick={() => companyVerify.mutate({ id: c.id, status: "approved" })}
                        disabled={companyVerify.isPending}
                        className="btn-primary btn-sm"
                      >
                        Verify
                      </button>
                      <button
                        type="button"
                        onClick={() => companyVerify.mutate({ id: c.id, status: "rejected" })}
                        disabled={companyVerify.isPending}
                        className="btn-outline btn-sm text-red-600"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-ink">
              <Briefcase className="h-5 w-5 text-slate-400" /> Pending jobs
              <span className="text-sm font-normal text-slate-400">({jobs.length})</span>
            </h2>
            {jobs.length === 0 ? (
              <p className="text-sm text-slate-500">No pending jobs.</p>
            ) : (
              <div className="space-y-3">
                {jobs.map((j) => (
                  <div key={j.id} className="card flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-base font-semibold text-ink">{j.title}</p>
                      <p className="mt-0.5 text-sm text-slate-500">
                        {j.company_name || "—"}
                        <span className="mx-1.5 text-slate-300">•</span>
                        <span className="text-xs text-slate-400">{timeAgo(j.created_at)}</span>
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        onClick={() => jobApproval.mutate({ id: j.id, status: "approved" })}
                        disabled={jobApproval.isPending}
                        className="btn-primary btn-sm"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => jobApproval.mutate({ id: j.id, status: "rejected" })}
                        disabled={jobApproval.isPending}
                        className="btn-outline btn-sm text-red-600"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
