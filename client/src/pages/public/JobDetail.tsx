import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  MapPin, Wallet, Briefcase, Users, Building2, BadgeCheck, Sparkles,
  Clock, CheckCircle2, Bookmark, ArrowLeft,
} from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { Badge, Spinner } from "@/components/ui";
import { JOB_TYPES, WORK_MODES, label } from "@/lib/constants";
import { salaryRange, timeAgo } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import type { Job } from "@/lib/types";

export default function JobDetail() {
  const { id } = useParams();
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["job", id],
    queryFn: () => api.get<{ job: Job }>(`/jobs/${id}`),
    enabled: !!id,
  });
  const job = data?.job;

  if (isLoading) return <div className="container-page py-8"><Spinner /></div>;
  if (!job) {
    return (
      <div className="container-page py-20 text-center">
        <h1 className="text-xl font-semibold text-ink">Job not found</h1>
        <p className="mt-2 text-sm text-slate-500">This role may have been closed or removed.</p>
        <Link to="/jobs" className="btn-primary mt-6">Browse jobs</Link>
      </div>
    );
  }

  const company = job.company;
  const experienceText =
    job.experience_min != null || job.experience_max != null
      ? job.experience_min != null && job.experience_max != null
        ? `${job.experience_min}–${job.experience_max} yrs`
        : `${job.experience_min ?? job.experience_max}+ yrs`
      : "Any";

  const metaItems = [
    { icon: MapPin, label: "Location", value: job.location || "—" },
    { icon: Wallet, label: "Salary", value: salaryRange(job.salary_min, job.salary_max) },
    { icon: Briefcase, label: "Experience", value: experienceText },
    { icon: Users, label: "Openings", value: String(job.openings ?? 1) },
  ];

  return (
    <div className="container-page py-8">
      <Link to="/jobs" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-brand-600">
        <ArrowLeft className="h-4 w-4" /> Back to jobs
      </Link>

      <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_20rem]">
        {/* Main */}
        <div className="space-y-6">
          <div className="card p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100 text-slate-400">
                {company?.logo_url ? (
                  <img src={company.logo_url} alt={company.name} className="h-full w-full object-cover" />
                ) : (
                  <Building2 className="h-7 w-7" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl font-bold text-ink">{job.title}</h1>
                {company && (
                  <Link
                    to={`/companies/${company.slug}`}
                    className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-brand-600"
                  >
                    {company.name}
                    {company.is_verified && <BadgeCheck className="h-4 w-4 text-brand-600" />}
                  </Link>
                )}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Badge tone="blue">{label(JOB_TYPES, job.job_type)}</Badge>
                  <Badge tone="slate">{label(WORK_MODES, job.work_mode)}</Badge>
                  {job.category && <Badge tone="slate">{job.category}</Badge>}
                  {job.is_featured && (
                    <Badge tone="orange"><Sparkles className="h-3 w-3" /> Featured</Badge>
                  )}
                  <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                    <Clock className="h-3 w-3" /> {timeAgo(job.created_at)}
                  </span>
                </div>
              </div>
            </div>

            {/* Meta grid */}
            <div className="mt-6 grid grid-cols-2 gap-3 border-t border-slate-100 pt-6 sm:grid-cols-4">
              {metaItems.map((m) => (
                <div key={m.label}>
                  <p className="inline-flex items-center gap-1.5 text-xs text-slate-400">
                    <m.icon className="h-3.5 w-3.5" /> {m.label}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-ink">{m.value}</p>
                </div>
              ))}
            </div>
          </div>

          {job.description && (
            <Section title="Job description">
              <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600">{job.description}</p>
            </Section>
          )}
          {job.responsibilities && (
            <Section title="Responsibilities">
              <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600">{job.responsibilities}</p>
            </Section>
          )}
          {job.requirements && (
            <Section title="Requirements">
              <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600">{job.requirements}</p>
            </Section>
          )}
          {job.skills?.length > 0 && (
            <Section title="Skills">
              <div className="flex flex-wrap gap-2">
                {job.skills.map((s) => (
                  <span key={s} className="rounded-md bg-slate-100 px-2.5 py-1 text-sm text-slate-600">{s}</span>
                ))}
              </div>
            </Section>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <ApplyPanel job={job} user={user} />
          {company && (
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-ink">About the company</h3>
              <div className="mt-3 flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100 text-slate-400">
                  {company.logo_url ? (
                    <img src={company.logo_url} alt={company.name} className="h-full w-full object-cover" />
                  ) : (
                    <Building2 className="h-5 w-5" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="inline-flex items-center gap-1 truncate text-sm font-semibold text-ink">
                    {company.name}
                    {company.is_verified && <BadgeCheck className="h-3.5 w-3.5 text-brand-600" />}
                  </p>
                  {company.industry && <p className="truncate text-xs text-slate-500">{company.industry}</p>}
                </div>
              </div>
              {company.description && (
                <p className="mt-3 line-clamp-4 text-sm text-slate-500">{company.description}</p>
              )}
              <Link to={`/companies/${company.slug}`} className="btn-outline btn-sm mt-4 w-full">
                View company
              </Link>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card p-6">
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function ApplyPanel({ job, user }: { job: Job; user: ReturnType<typeof useAuth>["user"] }) {
  const [showForm, setShowForm] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const [saved, setSaved] = useState(false);

  const applyMutation = useMutation({
    mutationFn: () => api.post("/candidate/applications", { job_id: job.id, cover_letter: coverLetter }),
  });

  const saveMutation = useMutation({
    mutationFn: () => api.post<{ saved?: boolean }>("/candidate/saved/toggle", { job_id: job.id }),
    onSuccess: (res) => setSaved(res?.saved ?? !saved),
  });

  const applyError = applyMutation.error as ApiError | null;
  const alreadyApplied = applyError?.status === 409;
  const applied = applyMutation.isSuccess;

  // Not logged in
  if (!user) {
    return (
      <div className="card p-5">
        <p className="text-sm text-slate-500">Log in to apply for this role.</p>
        <Link to={`/login?next=${encodeURIComponent(`/jobs/${job.id}`)}`} className="btn-primary mt-3 w-full">
          Log in to apply
        </Link>
      </div>
    );
  }

  // Recruiter / admin
  if (user.role !== "candidate") {
    return (
      <div className="card p-5">
        <p className="text-sm text-slate-500">
          You&rsquo;re signed in as a {user.role}. Only candidate accounts can apply to jobs.
        </p>
      </div>
    );
  }

  // Candidate
  return (
    <div className="card p-5">
      {applied || alreadyApplied ? (
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <p className="mt-3 text-sm font-semibold text-ink">
            {alreadyApplied ? "Already applied" : "Applied ✓"}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {alreadyApplied
              ? "You have already applied to this role."
              : "Your application has been sent. Track it in your dashboard."}
          </p>
          <Link to="/dashboard/candidate/applications" className="btn-outline btn-sm mt-4 w-full">
            View my applications
          </Link>
        </div>
      ) : (
        <>
          <h3 className="text-sm font-semibold text-ink">Interested in this role?</h3>
          <p className="mt-1 text-xs text-slate-500">Apply in one click with your Talent Hai profile.</p>

          {!showForm ? (
            <button onClick={() => setShowForm(true)} className="btn-primary mt-4 w-full">
              Apply now
            </button>
          ) : (
            <div className="mt-4 space-y-3">
              <textarea
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                rows={5}
                placeholder="Add a short cover letter (optional)"
                className="input resize-none"
              />
              {applyError && !alreadyApplied && (
                <p className="text-xs font-medium text-red-600">{applyError.message}</p>
              )}
              <button
                onClick={() => applyMutation.mutate()}
                disabled={applyMutation.isPending}
                className="btn-primary w-full"
              >
                {applyMutation.isPending ? "Submitting…" : "Submit application"}
              </button>
            </div>
          )}

          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="btn-outline btn-sm mt-2 w-full"
          >
            <Bookmark className={saved ? "h-4 w-4 fill-brand-600 text-brand-600" : "h-4 w-4"} />
            {saved ? "Saved" : "Save job"}
          </button>
        </>
      )}
    </div>
  );
}
