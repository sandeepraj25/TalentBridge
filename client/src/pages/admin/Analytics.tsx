import { useQuery } from "@tanstack/react-query";
import { Users, Briefcase, FileText, IndianRupee } from "lucide-react";
import { api } from "@/lib/api";
import { PageHeader, Spinner, StatCard } from "@/components/ui";
import { formatINR } from "@/lib/utils";
import { JOB_TYPES, WORK_MODES } from "@/lib/constants";

interface AnalyticsJob {
  job_type: string;
  work_mode: string;
  status: string;
}

interface AnalyticsData {
  jobs: AnalyticsJob[];
  users: number;
  applications: number;
  revenue: number;
}

function countBy(jobs: AnalyticsJob[], key: "job_type" | "work_mode") {
  const map = new Map<string, number>();
  for (const j of jobs) {
    const v = j[key];
    if (!v) continue;
    map.set(v, (map.get(v) ?? 0) + 1);
  }
  return map;
}

export default function Analytics() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-analytics"],
    queryFn: () => api.get<AnalyticsData>("/admin/analytics"),
  });

  if (isLoading) return <Spinner />;

  const jobs = data?.jobs ?? [];
  const byType = countBy(jobs, "job_type");
  const byMode = countBy(jobs, "work_mode");

  return (
    <div>
      <PageHeader title="Analytics" description="Platform-wide activity at a glance." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Users" value={(data?.users ?? 0).toLocaleString("en-IN")} icon={Users} tone="brand" />
        <StatCard label="Jobs" value={jobs.length.toLocaleString("en-IN")} icon={Briefcase} tone="violet" />
        <StatCard label="Applications" value={(data?.applications ?? 0).toLocaleString("en-IN")} icon={FileText} tone="amber" />
        <StatCard label="Revenue" value={formatINR(data?.revenue ?? 0, { compact: true })} icon={IndianRupee} tone="green" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <BarChart title="Jobs by type" counts={byType} options={JOB_TYPES} />
        <BarChart title="Jobs by work mode" counts={byMode} options={WORK_MODES} />
      </div>
    </div>
  );
}

function BarChart({
  title, counts, options,
}: {
  title: string;
  counts: Map<string, number>;
  options: readonly { value: string; label: string }[];
}) {
  const rows = options.map((o) => ({ label: o.label, value: counts.get(o.value) ?? 0 }));
  const max = Math.max(1, ...rows.map((r) => r.value));

  return (
    <div className="card p-5">
      <h2 className="mb-4 text-base font-semibold text-ink">{title}</h2>
      <div className="space-y-3">
        {rows.map((r) => (
          <div key={r.label}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="text-ink-soft">{r.label}</span>
              <span className="font-semibold text-ink">{r.value}</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-brand-500 transition-all"
                style={{ width: `${(r.value / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
