import { Link } from "react-router-dom";
import { MapPin, Briefcase, Building2, Sparkles, Clock } from "lucide-react";
import { Badge } from "./ui";
import { salaryRange, timeAgo } from "@/lib/utils";
import { JOB_TYPES, WORK_MODES, label } from "@/lib/constants";
import type { Job } from "@/lib/types";

export function JobCard({ job }: { job: Job }) {
  const company = job.company;
  return (
    <Link to={`/jobs/${job.id}`} className="card group block p-5 transition hover:-translate-y-0.5 hover:shadow-lift">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100 text-slate-400">
          {company?.logo_url ? (
            <img src={company.logo_url} alt={company.name} className="h-full w-full object-cover" />
          ) : (
            <Building2 className="h-6 w-6" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate text-base font-semibold text-ink group-hover:text-brand-600">{job.title}</h3>
              <p className="truncate text-sm text-slate-500">{company?.name ?? "Company"}</p>
            </div>
            {job.is_featured && (
              <Badge tone="orange" className="shrink-0"><Sparkles className="h-3 w-3" /> Featured</Badge>
            )}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {job.location || "—"}</span>
            <span className="inline-flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" /> {label(WORK_MODES, job.work_mode)}</span>
            <span className="font-medium text-ink-soft">{salaryRange(job.salary_min, job.salary_max)}</span>
          </div>
          {job.skills?.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {job.skills.slice(0, 4).map((s) => (
                <span key={s} className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{s}</span>
              ))}
            </div>
          )}
          <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
            <Badge tone="blue">{label(JOB_TYPES, job.job_type)}</Badge>
            <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {timeAgo(job.created_at)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
