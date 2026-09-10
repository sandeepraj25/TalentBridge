import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { FileText } from "lucide-react";
import { api } from "@/lib/api";
import { PageHeader, Spinner, Badge, EmptyState } from "@/components/ui";
import { salaryRange, timeAgo, pluralize } from "@/lib/utils";
import { APPLICATION_STAGES, label } from "@/lib/constants";
import type { Application } from "@/lib/types";

function stageTone(status: string) {
  return APPLICATION_STAGES.find((s) => s.value === status)?.tone ?? "slate";
}

export default function Applications() {
  const { data, isLoading } = useQuery({
    queryKey: ["candidate-applications"],
    queryFn: () => api.get<{ applications: Application[] }>("/candidate/applications"),
  });

  if (isLoading) return <Spinner />;

  const applications = data?.applications ?? [];

  return (
    <div>
      <PageHeader
        title="My applications"
        description={applications.length > 0 ? pluralize(applications.length, "application") : "Track the jobs you've applied to."}
      />

      {applications.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No applications yet"
          description="You haven't applied to any jobs. Find your next role and apply."
          action={{ label: "Browse jobs", href: "/jobs" }}
        />
      ) : (
        <div className="space-y-3">
          {applications.map((app) => (
            <div key={app.id} className="card flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <Link to={`/jobs/${app.job_id}`} className="text-base font-semibold text-ink hover:text-brand-600">
                  {app.job_title || "Job"}
                </Link>
                <p className="mt-0.5 text-sm text-slate-500">
                  {app.company_name || "Company"}
                  <span className="mx-1.5 text-slate-300">•</span>
                  <span className="text-ink-soft">{salaryRange(app.salary_min, app.salary_max)}</span>
                </p>
                <p className="mt-1 text-xs text-slate-400">Applied {timeAgo(app.created_at)}</p>
              </div>
              <Badge tone={stageTone(app.status)} className="shrink-0 self-start sm:self-center">
                {label(APPLICATION_STAGES, app.status)}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
