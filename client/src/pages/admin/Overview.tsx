import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Users, UserCog, Building2, Briefcase, FileText, IndianRupee,
  ClipboardCheck, Flag, BarChart3, ArrowRight,
} from "lucide-react";
import { api } from "@/lib/api";
import { StatCard, Spinner, PageHeader } from "@/components/ui";
import { formatINR } from "@/lib/utils";

interface Overview {
  candidates: number;
  recruiters: number;
  companies: number;
  jobs: number;
  applications: number;
  pending_approvals: number;
  open_reports: number;
  revenue: number;
}

const EMPTY: Overview = {
  candidates: 0, recruiters: 0, companies: 0, jobs: 0,
  applications: 0, pending_approvals: 0, open_reports: 0, revenue: 0,
};

const QUICK_LINKS = [
  {
    to: "/dashboard/admin/approvals",
    icon: ClipboardCheck,
    title: "Approvals",
    desc: "Review pending jobs and company verifications.",
  },
  {
    to: "/dashboard/admin/reports",
    icon: Flag,
    title: "Reports",
    desc: "Moderate flagged jobs, companies and users.",
  },
  {
    to: "/dashboard/admin/analytics",
    icon: BarChart3,
    title: "Analytics",
    desc: "Platform growth, hiring activity and revenue.",
  },
];

export default function Overview() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: () => api.get<Overview>("/admin/overview"),
  });

  if (isLoading) return <Spinner />;

  const o = data ?? EMPTY;

  return (
    <div>
      <PageHeader title="Admin overview" description="A snapshot of everything happening across Rojgaar." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Candidates" value={o.candidates} icon={Users} tone="brand" />
        <StatCard label="Recruiters" value={o.recruiters} icon={UserCog} tone="violet" />
        <StatCard label="Companies" value={o.companies} icon={Building2} tone="slate" />
        <StatCard label="Jobs" value={o.jobs} icon={Briefcase} tone="brand" />
        <StatCard label="Applications" value={o.applications} icon={FileText} tone="slate" />
        <StatCard label="Revenue" value={formatINR(o.revenue, { compact: true })} icon={IndianRupee} tone="green" />
        <StatCard label="Pending approvals" value={o.pending_approvals} icon={ClipboardCheck} tone="amber" />
        <StatCard label="Open reports" value={o.open_reports} icon={Flag} tone={o.open_reports > 0 ? "amber" : "slate"} />
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {QUICK_LINKS.map((q) => (
          <Link key={q.to} to={q.to} className="card group flex flex-col gap-3 p-5 transition hover:border-brand-300">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <q.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="flex items-center gap-1 text-base font-semibold text-ink">
                {q.title}
                <ArrowRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-brand-600" />
              </p>
              <p className="mt-1 text-sm text-slate-500">{q.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
