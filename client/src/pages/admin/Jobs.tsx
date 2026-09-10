import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Briefcase } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { PageHeader, Spinner, Badge, EmptyState } from "@/components/ui";
import { salaryRange, formatDate } from "@/lib/utils";

interface AdminJob {
  id: string;
  title: string;
  company_name: string | null;
  salary_min: number | null;
  salary_max: number | null;
  status: string;
  approval_status: string;
  created_at: string;
}

const statusTone: Record<string, string> = {
  active: "green",
  draft: "slate",
  paused: "amber",
  closed: "red",
};

const approvalTone: Record<string, string> = {
  approved: "green",
  rejected: "red",
  pending: "amber",
  removed: "red",
};

export default function Jobs() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-jobs"],
    queryFn: () => api.get<{ jobs: AdminJob[] }>("/admin/jobs"),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin-jobs"] });
  const onError = (err: unknown) => alert(err instanceof ApiError ? err.message : "Could not update job");

  const approval = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/admin/jobs/${id}/approval`, { status }),
    onSuccess: invalidate,
    onError,
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.patch(`/admin/jobs/${id}/remove`),
    onSuccess: invalidate,
    onError,
  });

  const jobs = data?.jobs ?? [];

  return (
    <div>
      <PageHeader title="Jobs" description="Moderate every job posted across the platform." />

      {isLoading ? (
        <Spinner />
      ) : jobs.length === 0 ? (
        <EmptyState icon={Briefcase} title="No jobs yet" description="Posted jobs will appear here." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                <th className="px-4 py-3">Job</th>
                <th className="px-4 py-3">Salary</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Approval</th>
                <th className="px-4 py-3">Posted</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {jobs.map((j) => (
                <tr key={j.id} className="align-middle">
                  <td className="px-4 py-3">
                    <Link to={`/jobs/${j.id}`} className="font-medium text-ink hover:text-brand-600">
                      {j.title}
                    </Link>
                    <p className="mt-0.5 text-xs text-slate-500">{j.company_name || "—"}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{salaryRange(j.salary_min, j.salary_max)}</td>
                  <td className="px-4 py-3">
                    <Badge tone={statusTone[j.status] ?? "slate"} className="capitalize">{j.status}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={approvalTone[j.approval_status] ?? "slate"} className="capitalize">{j.approval_status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{formatDate(j.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => approval.mutate({ id: j.id, status: "approved" })}
                        disabled={approval.isPending}
                        className="btn-primary btn-sm"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => approval.mutate({ id: j.id, status: "rejected" })}
                        disabled={approval.isPending}
                        className="btn-outline btn-sm text-red-600"
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        onClick={() => remove.mutate(j.id)}
                        disabled={remove.isPending}
                        className="btn-ghost btn-sm text-red-600"
                      >
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
