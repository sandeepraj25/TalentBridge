import { useQuery } from "@tanstack/react-query";
import { Briefcase, Eye, Users, Award } from "lucide-react";
import { api } from "@/lib/api";
import { StatCard, Spinner, PageHeader } from "@/components/ui";
import { APPLICATION_STAGES } from "@/lib/constants";

interface AnalyticsResp {
  jobs: { id: string; title: string; views: number; status: string }[];
  applications: { job_id: string; status: string }[];
  total_views: number;
}

const barTone: Record<string, string> = {
  slate: "bg-slate-400",
  blue: "bg-brand-500",
  amber: "bg-amber-400",
  violet: "bg-violet-400",
  green: "bg-emerald-500",
  red: "bg-red-400",
};

export default function Analytics() {
  const { data, isLoading } = useQuery({
    queryKey: ["recruiter-analytics"],
    queryFn: () => api.get<AnalyticsResp>("/recruiter/analytics"),
  });

  if (isLoading) return <Spinner />;

  const jobs = data?.jobs ?? [];
  const applications = data?.applications ?? [];
  const totalViews = data?.total_views ?? 0;
  const hires = applications.filter((a) => a.status === "hired").length;

  const byStage = APPLICATION_STAGES.map((s) => ({
    label: s.label,
    tone: s.tone as string,
    count: applications.filter((a) => a.status === s.value).length,
  }));
  const maxStage = Math.max(1, ...byStage.map((s) => s.count));

  const counts = new Map<string, number>();
  applications.forEach((a) => counts.set(a.job_id, (counts.get(a.job_id) ?? 0) + 1));
  const topJobs = [...counts.entries()]
    .map(([id, count]) => ({ id, count, title: jobs.find((j) => j.id === id)?.title ?? "Unknown job" }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  const maxJob = Math.max(1, ...topJobs.map((j) => j.count));

  return (
    <div>
      <PageHeader title="Analytics" description="How your jobs and pipeline are performing." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total jobs" value={jobs.length} icon={Briefcase} tone="brand" />
        <StatCard label="Total views" value={totalViews} icon={Eye} tone="violet" />
        <StatCard label="Applicants" value={applications.length} icon={Users} tone="amber" />
        <StatCard label="Hires" value={hires} icon={Award} tone="green" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <h2 className="mb-4 text-base font-semibold text-ink">Applications by stage</h2>
          <div className="space-y-3">
            {byStage.map((s) => (
              <div key={s.label}>
                <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
                  <span>{s.label}</span>
                  <span className="font-medium text-ink">{s.count}</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-slate-100">
                  <div className={`h-full rounded-full ${barTone[s.tone] ?? "bg-slate-400"}`} style={{ width: `${(s.count / maxStage) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <h2 className="mb-4 text-base font-semibold text-ink">Top jobs by applicants</h2>
          {topJobs.length === 0 ? (
            <p className="text-sm text-slate-500">No applications yet.</p>
          ) : (
            <div className="space-y-3">
              {topJobs.map((j) => (
                <div key={j.id}>
                  <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
                    <span className="truncate pr-2">{j.title}</span>
                    <span className="font-medium text-ink">{j.count}</span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-brand-500" style={{ width: `${(j.count / maxJob) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
