import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import { Spinner, PageHeader } from "@/components/ui";
import { APPLICATION_STAGES } from "@/lib/constants";
import { initials } from "@/lib/utils";

interface Appn {
  id: string;
  candidate_id: string;
  status: string;
  job_title?: string;
  candidate_name?: string;
}

const borderTone: Record<string, string> = {
  slate: "border-t-slate-400",
  blue: "border-t-brand-500",
  amber: "border-t-amber-400",
  violet: "border-t-violet-400",
  green: "border-t-emerald-500",
  red: "border-t-red-400",
};

export default function Pipeline() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["recruiter-applications", "pipeline"],
    queryFn: () => api.get<{ applications: Appn[] }>("/recruiter/applications"),
  });
  const applications = data?.applications ?? [];

  const move = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => api.patch(`/recruiter/applications/${id}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["recruiter-applications"] }),
    onError: (err) => alert(err instanceof ApiError ? err.message : "Could not move candidate."),
  });

  return (
    <div>
      <PageHeader title="Hiring pipeline" description="Track every candidate from applied to hired." />

      {isLoading ? (
        <Spinner />
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {APPLICATION_STAGES.map((stage) => {
            const items = applications.filter((a) => a.status === stage.value);
            return (
              <div key={stage.value} className={`w-72 shrink-0 rounded-xl border border-t-4 border-slate-200 bg-slate-50/60 ${borderTone[stage.tone] ?? "border-t-slate-400"}`}>
                <div className="flex items-center justify-between px-3 py-3">
                  <h3 className="text-sm font-semibold text-ink">{stage.label}</h3>
                  <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-500">{items.length}</span>
                </div>
                <div className="space-y-2 px-3 pb-3">
                  {items.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-slate-200 py-6 text-center text-xs text-slate-400">No candidates</p>
                  ) : (
                    items.map((a) => (
                      <div key={a.id} className="card p-3">
                        <Link to={`/dashboard/recruiter/candidates/${a.candidate_id}`} className="flex items-center gap-2">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
                            {initials(a.candidate_name)}
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-medium text-ink">{a.candidate_name || "Candidate"}</span>
                            <span className="block truncate text-xs text-slate-500">{a.job_title || "—"}</span>
                          </span>
                        </Link>
                        <select
                          className="input mt-2 w-full py-1 text-xs"
                          value={a.status}
                          onChange={(e) => move.mutate({ id: a.id, status: e.target.value })}
                          aria-label="Move candidate to stage"
                        >
                          {APPLICATION_STAGES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
