import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PlusCircle, MapPin, Users, Eye, Sparkles, Rocket, Pencil, Trash2, Clock, Briefcase } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { Badge, EmptyState, Spinner, PageHeader } from "@/components/ui";
import { JOB_STATUS } from "@/lib/constants";
import { salaryRange, timeAgo, pluralize } from "@/lib/utils";

interface RecruiterJob {
  id: string;
  title: string;
  status: string;
  is_featured: boolean;
  is_boosted: boolean;
  application_count: number;
  views: number;
  salary_min: number | null;
  salary_max: number | null;
  location: string | null;
  created_at: string;
  skills: string[];
}

const statusTone: Record<string, string> = {
  draft: "slate",
  active: "green",
  paused: "amber",
  closed: "red",
};

export default function Jobs() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["recruiter-jobs"],
    queryFn: () => api.get<{ jobs: RecruiterJob[] }>("/recruiter/jobs"),
  });
  const jobs = data?.jobs ?? [];

  const invalidate = () => qc.invalidateQueries({ queryKey: ["recruiter-jobs"] });

  const promote = useMutation({
    mutationFn: ({ id, kind }: { id: string; kind: "boost" | "feature" }) =>
      api.post(`/recruiter/jobs/${id}/promote`, { kind }),
    onSuccess: invalidate,
    onError: (err) => {
      if (err instanceof ApiError && (err.status === 402 || err.code === "INSUFFICIENT_COINS")) {
        alert("Not enough coins. Top up on the Coins page to promote this job.");
      } else {
        alert(err instanceof ApiError ? err.message : "Could not promote job.");
      }
    },
  });

  const changeStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/recruiter/jobs/${id}/status`, { status }),
    onSuccess: invalidate,
    onError: (err) => alert(err instanceof ApiError ? err.message : "Could not update status."),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.del(`/recruiter/jobs/${id}`),
    onSuccess: invalidate,
    onError: (err) => alert(err instanceof ApiError ? err.message : "Could not delete job."),
  });

  return (
    <div>
      <PageHeader
        title="My jobs"
        description="Manage your postings, promote them, and track applicants."
        action={<Link to="/dashboard/recruiter/jobs/new" className="btn-primary"><PlusCircle className="h-4 w-4" /> Post a job</Link>}
      />

      {isLoading ? (
        <Spinner />
      ) : jobs.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No jobs yet"
          description="Post your first job to start receiving applications."
          action={{ label: "Post a job", href: "/dashboard/recruiter/jobs/new" }}
        />
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <div key={job.id} className="card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link to={`/jobs/${job.id}`} className="text-base font-semibold text-ink hover:text-brand-600">{job.title}</Link>
                    <Badge tone={statusTone[job.status] ?? "slate"}>{job.status}</Badge>
                    {job.is_featured && <Badge tone="orange"><Sparkles className="h-3 w-3" /> Featured</Badge>}
                    {job.is_boosted && <Badge tone="blue"><Rocket className="h-3 w-3" /> Boosted</Badge>}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span className="font-medium text-ink-soft">{salaryRange(job.salary_min, job.salary_max)}</span>
                    <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {job.location || "—"}</span>
                    <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> posted {timeAgo(job.created_at)}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {pluralize(job.application_count ?? 0, "applicant")}</span>
                    <span className="inline-flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> {pluralize(job.views ?? 0, "view")}</span>
                  </div>
                </div>
                <select
                  className="input w-auto py-1.5 text-xs"
                  value={job.status}
                  onChange={(e) => changeStatus.mutate({ id: job.id, status: e.target.value })}
                  aria-label="Job status"
                >
                  {JOB_STATUS.map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
                </select>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
                <Link to={`/dashboard/recruiter/applications?job=${job.id}`} className="btn-outline btn-sm"><Users className="h-3.5 w-3.5" /> Applicants</Link>
                <Link to={`/dashboard/recruiter/jobs/${job.id}/edit`} className="btn-outline btn-sm"><Pencil className="h-3.5 w-3.5" /> Edit</Link>
                <button className="btn-ghost btn-sm" disabled={promote.isPending} onClick={() => promote.mutate({ id: job.id, kind: "boost" })}><Rocket className="h-3.5 w-3.5" /> Boost</button>
                <button className="btn-ghost btn-sm" disabled={promote.isPending} onClick={() => promote.mutate({ id: job.id, kind: "feature" })}><Sparkles className="h-3.5 w-3.5" /> Feature</button>
                <button
                  className="btn-ghost btn-sm ml-auto text-red-600 hover:bg-red-50"
                  disabled={remove.isPending}
                  onClick={() => { if (confirm("Delete this job? This cannot be undone.")) remove.mutate(job.id); }}
                ><Trash2 className="h-3.5 w-3.5" /> Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
