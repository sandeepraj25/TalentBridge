import { useQuery } from "@tanstack/react-query";
import { Bookmark } from "lucide-react";
import { api } from "@/lib/api";
import { PageHeader, Spinner, EmptyState } from "@/components/ui";
import { JobCard } from "@/components/JobCard";
import { pluralize } from "@/lib/utils";
import type { Job } from "@/lib/types";

export default function Saved() {
  const { data, isLoading } = useQuery({
    queryKey: ["candidate-saved"],
    queryFn: () => api.get<{ jobs: Job[] }>("/candidate/saved"),
  });

  if (isLoading) return <Spinner />;

  const jobs = data?.jobs ?? [];

  return (
    <div>
      <PageHeader
        title="Saved jobs"
        description={jobs.length > 0 ? pluralize(jobs.length, "saved job") : "Jobs you bookmark will appear here."}
      />

      {jobs.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title="No saved jobs"
          description="Save jobs you're interested in to revisit them later."
          action={{ label: "Browse jobs", href: "/jobs" }}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </div>
  );
}
