import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { FileText, Bookmark, CalendarClock, Gauge, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { StatCard, Spinner, Badge, EmptyState } from "@/components/ui";
import { timeAgo } from "@/lib/utils";
import { APPLICATION_STAGES, label } from "@/lib/constants";
import type { Application, Candidate } from "@/lib/types";

interface OverviewData {
  stats: { applications: number; saved: number; interviews: number };
  recent: Application[];
  candidate: Candidate;
}

function stageTone(status: string) {
  return APPLICATION_STAGES.find((s) => s.value === status)?.tone ?? "slate";
}

function profileCompletion(candidate: Candidate | null | undefined) {
  if (!candidate) return 0;
  const checks = [
    Boolean(candidate.headline),
    Boolean(candidate.about),
    Boolean(candidate.location),
    Boolean(candidate.resume_url),
    (candidate.skills?.length ?? 0) > 0,
  ];
  const filled = checks.filter(Boolean).length;
  return Math.round((filled / checks.length) * 100);
}

export default function Overview() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["candidate-overview"],
    queryFn: () => api.get<OverviewData>("/candidate/overview"),
  });

  if (isLoading) return <Spinner />;

  const stats = data?.stats ?? { applications: 0, saved: 0, interviews: 0 };
  const recent = data?.recent ?? [];
  const completion = profileCompletion(data?.candidate);
  const firstName = (user?.full_name || "there").split(" ")[0];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ink">Welcome back, {firstName}</h1>
        <p className="mt-1 text-sm text-slate-500">Here's what's happening with your job search.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Applications" value={stats.applications} icon={FileText} tone="brand" />
        <StatCard label="Saved jobs" value={stats.saved} icon={Bookmark} tone="violet" />
        <StatCard label="Interviews" value={stats.interviews} icon={CalendarClock} tone="amber" />
        <StatCard label="Profile complete" value={`${completion}%`} icon={Gauge} tone={completion >= 100 ? "green" : "slate"} />
      </div>

      {completion < 100 && (
        <div className="mt-6 flex flex-col gap-3 rounded-2xl bg-brand-50 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-brand-800">Your profile is {completion}% complete</p>
            <p className="mt-0.5 text-sm text-brand-700">A complete profile gets more attention from recruiters.</p>
          </div>
          <Link to="/dashboard/candidate/profile" className="btn-primary btn-sm shrink-0">
            Complete profile <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">Recent applications</h2>
          <Link to="/dashboard/candidate/applications" className="link text-sm">View all</Link>
        </div>

        {recent.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No applications yet"
            description="Browse jobs and apply to start tracking your applications here."
            action={{ label: "Browse jobs", href: "/jobs" }}
          />
        ) : (
          <div className="card divide-y divide-slate-100">
            {recent.map((app) => (
              <div key={app.id} className="flex items-center justify-between gap-4 p-4">
                <div className="min-w-0">
                  <Link to={`/jobs/${app.job_id}`} className="truncate text-sm font-semibold text-ink hover:text-brand-600">
                    {app.job_title || "Job"}
                  </Link>
                  <p className="truncate text-sm text-slate-500">{app.company_name || "Company"}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <Badge tone={stageTone(app.status)}>{label(APPLICATION_STAGES, app.status)}</Badge>
                  <span className="text-xs text-slate-400">{timeAgo(app.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
