import { useState, useEffect, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search, MapPin, SlidersHorizontal, Briefcase } from "lucide-react";
import { api } from "@/lib/api";
import { JobCard } from "@/components/JobCard";
import { Spinner, EmptyState } from "@/components/ui";
import { JOB_TYPES, WORK_MODES, EXPERIENCE_BANDS, JOB_CATEGORIES } from "@/lib/constants";
import { cn, pluralize } from "@/lib/utils";
import type { Job } from "@/lib/types";

const SALARY_OPTIONS = [
  { value: "", label: "Any salary" },
  { value: "300000", label: "₹3 L+" },
  { value: "600000", label: "₹6 L+" },
  { value: "1000000", label: "₹10 L+" },
  { value: "1500000", label: "₹15 L+" },
  { value: "2500000", label: "₹25 L+" },
];

export default function Jobs() {
  const [searchParams, setSearchParams] = useSearchParams();

  const q = searchParams.get("q") ?? "";
  const location = searchParams.get("location") ?? "";
  const job_type = searchParams.get("job_type") ?? "";
  const work_mode = searchParams.get("work_mode") ?? "";
  const category = searchParams.get("category") ?? "";
  const experience = searchParams.get("experience") ?? "";
  const min_salary = searchParams.get("min_salary") ?? "";
  const sort = searchParams.get("sort") ?? "recent";

  // Local state for the top search bar (committed on submit).
  const [qInput, setQInput] = useState(q);
  const [locInput, setLocInput] = useState(location);
  useEffect(() => setQInput(q), [q]);
  useEffect(() => setLocInput(location), [location]);

  const qs = (() => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (location) p.set("location", location);
    if (job_type) p.set("job_type", job_type);
    if (work_mode) p.set("work_mode", work_mode);
    if (category) p.set("category", category);
    if (experience) p.set("min_experience", experience);
    if (min_salary) p.set("min_salary", min_salary);
    if (sort) p.set("sort", sort);
    return p.toString();
  })();

  const { data, isLoading } = useQuery({
    queryKey: ["jobs", qs],
    queryFn: () => api.get<{ jobs: Job[] }>("/jobs?" + qs),
  });
  const jobs = data?.jobs ?? [];

  // Merge a set of changes into the URL search params (preserving others).
  function update(patch: Record<string, string>) {
    const next = new URLSearchParams(searchParams);
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    setSearchParams(next, { replace: true });
  }

  function onSearchSubmit(e: FormEvent) {
    e.preventDefault();
    update({ q: qInput.trim(), location: locInput.trim() });
  }

  return (
    <div className="container-page py-8">
      {/* Top search bar */}
      <form onSubmit={onSearchSubmit} className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-card sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
            placeholder="Job title, skill or company"
            className="input border-0 pl-9 shadow-none focus:ring-0"
            aria-label="Search jobs"
          />
        </div>
        <div className="relative flex-1 sm:border-l sm:border-slate-200">
          <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={locInput}
            onChange={(e) => setLocInput(e.target.value)}
            placeholder="Location"
            className="input border-0 pl-9 shadow-none focus:ring-0"
            aria-label="Location"
          />
        </div>
        <button type="submit" className="btn-primary shrink-0">
          <Search className="h-4 w-4" /> Search
        </button>
      </form>

      <div className="mt-6 grid gap-6 lg:grid-cols-[16rem_1fr]">
        {/* Filter sidebar */}
        <aside className="space-y-6">
          <div className="card p-5">
            <div className="flex items-center justify-between">
              <h2 className="inline-flex items-center gap-2 text-sm font-semibold text-ink">
                <SlidersHorizontal className="h-4 w-4 text-slate-400" /> Filters
              </h2>
              <button
                type="button"
                onClick={() => setSearchParams(q || location ? new URLSearchParams({ ...(q ? { q } : {}), ...(location ? { location } : {}) }) : new URLSearchParams())}
                className="text-xs font-medium text-brand-600 hover:underline"
              >
                Clear
              </button>
            </div>

            <FilterGroup
              title="Job category"
              options={JOB_CATEGORIES}
              value={category}
              onChange={(v) => update({ category: v })}
            />
            <FilterGroup
              title="Job type"
              options={JOB_TYPES}
              value={job_type}
              onChange={(v) => update({ job_type: v })}
            />
            <FilterGroup
              title="Work mode"
              options={WORK_MODES}
              value={work_mode}
              onChange={(v) => update({ work_mode: v })}
            />
            <FilterGroup
              title="Experience"
              options={EXPERIENCE_BANDS}
              value={experience}
              onChange={(v) => update({ experience: v })}
            />

            <div className="mt-5">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Minimum salary</h3>
              <select
                value={min_salary}
                onChange={(e) => update({ min_salary: e.target.value })}
                className="input"
              >
                {SALARY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>
        </aside>

        {/* Results */}
        <div>
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-sm text-slate-500">
              {isLoading ? "Searching…" : pluralize(jobs.length, "job") + " found"}
            </p>
            <label className="flex items-center gap-2 text-sm text-slate-500">
              <span className="hidden sm:inline">Sort by</span>
              <select
                value={sort}
                onChange={(e) => update({ sort: e.target.value })}
                className="input w-auto py-2"
              >
                <option value="recent">Most recent</option>
                <option value="salary">Highest salary</option>
              </select>
            </label>
          </div>

          {isLoading ? (
            <Spinner />
          ) : jobs.length === 0 ? (
            <EmptyState
              icon={Briefcase}
              title="No jobs match your filters"
              description="Try broadening your search or clearing some filters."
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {jobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterGroup({
  title, options, value, onChange,
}: {
  title: string;
  options: readonly { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="mt-5">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</h3>
      <div className="space-y-1.5">
        <RadioRow label="Any" checked={value === ""} onSelect={() => onChange("")} />
        {options.map((o) => (
          <RadioRow
            key={o.value}
            label={o.label}
            checked={value === o.value}
            onSelect={() => onChange(o.value)}
          />
        ))}
      </div>
    </div>
  );
}

function RadioRow({ label, checked, onSelect }: { label: string; checked: boolean; onSelect: () => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-sm text-ink-soft">
      <span
        onClick={onSelect}
        className={cn(
          "flex h-4 w-4 items-center justify-center rounded-full border transition",
          checked ? "border-brand-600 bg-brand-600" : "border-slate-300 bg-white"
        )}
      >
        {checked && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
      </span>
      <input type="radio" className="sr-only" checked={checked} onChange={onSelect} />
      <span onClick={onSelect} className={cn(checked && "font-medium text-ink")}>{label}</span>
    </label>
  );
}
