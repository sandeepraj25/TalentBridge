import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Briefcase, Users, Coins, Package, Search, KanbanSquare, ArrowRight, PlusCircle } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Badge, StatCard, Spinner, PageHeader, EmptyState } from "@/components/ui";
import { APPLICATION_STAGES, label } from "@/lib/constants";
import { initials, timeAgo } from "@/lib/utils";

interface OverviewData {
  stats: { active_jobs: number; applicants: number; coins: number };
  active_package: { name: string; remaining_unlocks: number; remaining_job_posts: number; expires_at: string } | null;
  recent: { id: string; job_title: string; candidate_name: string; status: string; created_at: string }[];
}

function stageTone(value: string) {
  return APPLICATION_STAGES.find((s) => s.value === value)?.tone ?? "slate";
}

export default function Overview() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["recruiter-overview"],
    queryFn: () => api.get<OverviewData>("/recruiter/overview"),
  });

  if (isLoading) return <Spinner />;

  const stats = data?.stats ?? { active_jobs: 0, applicants: 0, coins: 0 };
  const pkg = data?.active_package ?? null;
  const recent = data?.recent ?? [];
  const firstName = (user?.full_name || "there").split(" ")[0];

  const quickActions = [
    { to: "/dashboard/recruiter/candidates", icon: Search, title: "Search candidates", body: "Find and unlock talent that fits your roles." },
    { to: "/dashboard/recruiter/pipeline", icon: KanbanSquare, title: "Hiring pipeline", body: "Move applicants through your stages." },
    { to: "/dashboard/recruiter/coins", icon: Coins, title: "Top up coins", body: "Buy coins to unlock and promote jobs." },
  ];

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${firstName}`}
        description="Here's what's happening with your hiring today."
        action={<Link to="/dashboard/recruiter/jobs/new" className="btn-primary"><PlusCircle className="h-4 w-4" /> Post a job</Link>}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active jobs" value={stats.active_jobs} icon={Briefcase} tone="brand" />
        <StatCard label="Total applicants" value={stats.applicants} icon={Users} tone="violet" />
        <StatCard label="Coin balance" value={stats.coins} icon={Coins} tone="amber" />
        <StatCard
          label="Active package"
          value={pkg?.name ?? "None"}
          icon={Package}
          tone="green"
          hint={pkg ? `${pkg.remaining_unlocks} unlocks left` : "No active plan"}
        />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {quickActions.map((a) => (
          <Link key={a.to} to={a.to} className="card group flex flex-col p-5 transition hover:-translate-y-0.5 hover:shadow-lift">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <a.icon className="h-5 w-5" />
            </div>
            <h3 className="mt-3 text-base font-semibold text-ink group-hover:text-brand-600">{a.title}</h3>
            <p className="mt-1 text-sm text-slate-500">{a.body}</p>
            <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-brand-600">Open <ArrowRight className="h-4 w-4" /></span>
          </Link>
        ))}
      </div>

      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">Recent applicants</h2>
          <Link to="/dashboard/recruiter/applications" className="link text-sm">View all</Link>
        </div>
        {recent.length === 0 ? (
          <EmptyState icon={Users} title="No applicants yet" description="Applications to your jobs will show up here." />
        ) : (
          <div className="card divide-y divide-slate-100">
            {recent.map((r) => (
              <div key={r.id} className="flex items-center gap-3 p-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
                  {initials(r.candidate_name)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">{r.candidate_name || "Candidate"}</p>
                  <p className="truncate text-xs text-slate-500">applied to {r.job_title || "a role"}</p>
                </div>
                <Badge tone={stageTone(r.status)}>{label(APPLICATION_STAGES, r.status)}</Badge>
                <span className="hidden shrink-0 text-xs text-slate-400 sm:block">{timeAgo(r.created_at)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
