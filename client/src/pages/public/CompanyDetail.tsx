import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Building2, BadgeCheck, MapPin, Users, Globe, ArrowLeft, Briefcase } from "lucide-react";
import { api } from "@/lib/api";
import { Spinner, EmptyState } from "@/components/ui";
import { JobCard } from "@/components/JobCard";
import { pluralize } from "@/lib/utils";
import type { Company, Job } from "@/lib/types";

export default function CompanyDetail() {
  const { slug } = useParams();

  const { data, isLoading } = useQuery({
    queryKey: ["company", slug],
    queryFn: () => api.get<{ company: Company; jobs: Job[] }>(`/companies/${slug}`),
    enabled: !!slug,
  });

  if (isLoading) return <div className="container-page py-8"><Spinner /></div>;

  const company = data?.company;
  const jobs = data?.jobs ?? [];

  if (!company) {
    return (
      <div className="container-page py-20 text-center">
        <h1 className="text-xl font-semibold text-ink">Company not found</h1>
        <Link to="/companies" className="btn-primary mt-6">Browse companies</Link>
      </div>
    );
  }

  const meta = [
    company.location && { icon: MapPin, value: company.location },
    company.company_size && { icon: Users, value: `${company.company_size} employees` },
  ].filter(Boolean) as { icon: typeof MapPin; value: string }[];

  return (
    <div className="container-page py-8">
      <Link to="/companies" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-brand-600">
        <ArrowLeft className="h-4 w-4" /> All companies
      </Link>

      {/* Header */}
      <div className="mt-4 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-card">
        <div className="h-32 bg-gradient-to-r from-brand-600 to-brand-800 sm:h-40" />
        <div className="px-6 pb-6 sm:px-8">
          <div className="-mt-10 flex flex-col gap-4 sm:-mt-12 sm:flex-row sm:items-end">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-slate-100 text-slate-400 shadow-sm sm:h-24 sm:w-24">
              {company.logo_url ? (
                <img src={company.logo_url} alt={company.name} className="h-full w-full object-cover" />
              ) : (
                <Building2 className="h-10 w-10" />
              )}
            </div>
            <div className="min-w-0 flex-1 sm:pb-1">
              <h1 className="inline-flex items-center gap-2 text-2xl font-bold text-ink">
                {company.name}
                {company.is_verified && <BadgeCheck className="h-6 w-6 text-brand-600" />}
              </h1>
              {company.industry && <p className="mt-0.5 text-sm text-slate-500">{company.industry}</p>}
            </div>
            {company.website && (
              <a
                href={company.website}
                target="_blank"
                rel="noreferrer"
                className="btn-outline btn-sm shrink-0"
              >
                <Globe className="h-4 w-4" /> Website
              </a>
            )}
          </div>

          {(meta.length > 0 || company.description) && (
            <div className="mt-5 border-t border-slate-100 pt-5">
              {company.description && (
                <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600">{company.description}</p>
              )}
              {meta.length > 0 && (
                <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-500">
                  {meta.map((m, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5">
                      <m.icon className="h-4 w-4 text-slate-400" /> {m.value}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Open roles */}
      <div className="mt-10">
        <h2 className="text-xl font-bold text-ink">
          Open roles <span className="font-normal text-slate-400">· {pluralize(jobs.length, "role")}</span>
        </h2>
        {jobs.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="No open roles right now"
            description={`${company.name} isn't hiring at the moment. Check back later.`}
            className="mt-6"
          />
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job) => (
              <JobCard key={job.id} job={{ ...job, company: job.company ?? company }} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
