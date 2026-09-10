import { useQuery } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import { PageHeader, Spinner, EmptyState } from "@/components/ui";
import { JobCard } from "@/components/JobCard";
import type { Job } from "@/lib/types";

export default function Recommended() {
  const { data, isLoading } = useQuery({
    queryKey: ["candidate-recommended"],
    queryFn: () => api.get<{ jobs: Job[] }>("/candidate/recommended"),
  });

  if (isLoading) return <Spinner />;

  const jobs = data?.jobs ?? [];

  return (
    <div>
      <PageHeader
        title="Recommended for you"
        description="Jobs matched to your skills and profile."
      />

      {jobs.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="No recommendations yet"
          description="Add skills to your profile so we can match you with the right jobs."
          action={{ label: "Update profile", href: "/dashboard/candidate/profile" }}
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
