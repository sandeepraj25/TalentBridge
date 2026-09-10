import { useState, type FormEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BellRing, Trash2, MapPin, Briefcase, IndianRupee, Plus } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { PageHeader, Spinner, Field, EmptyState } from "@/components/ui";
import { formatINR } from "@/lib/utils";
import { JOB_TYPES, label } from "@/lib/constants";

interface Alert {
  id: string;
  keyword: string;
  location: string | null;
  job_type: string | null;
  min_salary: number | null;
  frequency: string;
}

const SALARY_OPTIONS = [300000, 600000, 1000000, 1500000, 2500000, 4000000];

export default function Alerts() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["alerts"],
    queryFn: () => api.get<{ alerts: Alert[] }>("/candidate/alerts"),
  });

  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("");
  const [jobType, setJobType] = useState("");
  const [minSalary, setMinSalary] = useState("");
  const [error, setError] = useState("");

  const create = useMutation({
    mutationFn: () =>
      api.post("/candidate/alerts", {
        keyword,
        location: location || null,
        job_type: jobType || null,
        min_salary: minSalary ? Number(minSalary) : null,
        frequency: "daily",
      }),
    onSuccess: () => {
      setKeyword("");
      setLocation("");
      setJobType("");
      setMinSalary("");
      setError("");
      qc.invalidateQueries({ queryKey: ["alerts"] });
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : "Could not create alert"),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.del(`/candidate/alerts/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alerts"] }),
  });

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!keyword.trim()) {
      setError("Enter a keyword to watch for.");
      return;
    }
    create.mutate();
  }

  if (isLoading) return <Spinner />;

  const alerts = data?.alerts ?? [];

  return (
    <div>
      <PageHeader title="Job alerts" description="Get notified when new jobs match your criteria." />

      <form onSubmit={submit} className="card p-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Keyword" htmlFor="alert-keyword" className="sm:col-span-2 lg:col-span-1">
            <input
              id="alert-keyword"
              className="input"
              placeholder="e.g. React developer"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </Field>
          <Field label="Location" htmlFor="alert-location">
            <input
              id="alert-location"
              className="input"
              placeholder="Any location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </Field>
          <Field label="Job type" htmlFor="alert-jobtype">
            <select id="alert-jobtype" className="input" value={jobType} onChange={(e) => setJobType(e.target.value)}>
              <option value="">Any type</option>
              {JOB_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Minimum salary" htmlFor="alert-salary">
            <select id="alert-salary" className="input" value={minSalary} onChange={(e) => setMinSalary(e.target.value)}>
              <option value="">Any salary</option>
              {SALARY_OPTIONS.map((v) => (
                <option key={v} value={v}>{formatINR(v, { compact: true })}+</option>
              ))}
            </select>
          </Field>
        </div>
        {error && <p className="mt-3 text-sm font-medium text-red-600">{error}</p>}
        <div className="mt-4 flex justify-end">
          <button type="submit" className="btn-primary btn-sm" disabled={create.isPending}>
            <Plus className="h-4 w-4" /> {create.isPending ? "Creating…" : "Create alert"}
          </button>
        </div>
      </form>

      <div className="mt-6">
        {alerts.length === 0 ? (
          <EmptyState
            icon={BellRing}
            title="No alerts yet"
            description="Create an alert above and we'll email you matching jobs daily."
          />
        ) : (
          <div className="space-y-3">
            {alerts.map((a) => (
              <div key={a.id} className="card flex items-center justify-between gap-4 p-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">{a.keyword}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                    {a.location && (
                      <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {a.location}</span>
                    )}
                    {a.job_type && (
                      <span className="inline-flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" /> {label(JOB_TYPES, a.job_type)}</span>
                    )}
                    {a.min_salary != null && (
                      <span className="inline-flex items-center gap-1"><IndianRupee className="h-3.5 w-3.5" /> {formatINR(a.min_salary, { compact: true })}+</span>
                    )}
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 capitalize text-slate-600">{a.frequency}</span>
                  </div>
                </div>
                <button
                  onClick={() => remove.mutate(a.id)}
                  disabled={remove.isPending}
                  className="btn-ghost btn-sm text-slate-400 hover:text-red-600"
                  aria-label="Delete alert"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
