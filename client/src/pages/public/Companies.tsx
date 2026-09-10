import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Building2, BadgeCheck, MapPin, Briefcase } from "lucide-react";
import { api } from "@/lib/api";
import { Spinner, EmptyState } from "@/components/ui";
import { pluralize } from "@/lib/utils";
import type { Company } from "@/lib/types";

type CompanyRow = Company & { open_jobs?: number };

export default function Companies() {
  const { data, isLoading } = useQuery({
    queryKey: ["companies"],
    queryFn: () => api.get<{ companies: CompanyRow[] }>("/companies"),
  });
  const companies = data?.companies ?? [];

  return (
    <div className="container-page py-10">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold text-ink">Companies hiring on Rojgaar</h1>
        <p className="mt-2 text-slate-500">Discover teams across India and the roles they&rsquo;re looking to fill.</p>
      </div>

      {isLoading ? (
        <Spinner />
      ) : companies.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No companies yet"
          description="Companies will appear here once they join and post roles."
          className="mt-8"
        />
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {companies.map((c) => (
            <Link
              key={c.id}
              to={`/companies/${c.slug}`}
              className="card group flex flex-col p-5 transition hover:-translate-y-0.5 hover:shadow-lift"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100 text-slate-400">
                  {c.logo_url ? (
                    <img src={c.logo_url} alt={c.name} className="h-full w-full object-cover" />
                  ) : (
                    <Building2 className="h-6 w-6" />
                  )}
                </div>
                <div className="min-w-0">
                  <h2 className="inline-flex items-center gap-1 truncate text-base font-semibold text-ink group-hover:text-brand-600">
                    {c.name}
                    {c.is_verified && <BadgeCheck className="h-4 w-4 shrink-0 text-brand-600" />}
                  </h2>
                  {c.industry && <p className="truncate text-sm text-slate-500">{c.industry}</p>}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                {c.location && (
                  <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {c.location}</span>
                )}
              </div>

              <div className="mt-4 flex items-center gap-1.5 text-sm font-medium text-brand-600">
                <Briefcase className="h-4 w-4" />
                {pluralize(c.open_jobs ?? 0, "open role")}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
