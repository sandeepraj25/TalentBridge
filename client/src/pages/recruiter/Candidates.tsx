import { useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search, MapPin, Lock, CheckCircle2, Users } from "lucide-react";
import { api } from "@/lib/api";
import { Spinner, PageHeader, EmptyState } from "@/components/ui";
import { initials, formatINR } from "@/lib/utils";

interface Cand {
  id: string;
  full_name?: string;
  avatar_url?: string | null;
  headline: string | null;
  about: string | null;
  location: string | null;
  experience_years: number | null;
  expected_salary: number | null;
  skills: string[];
  resume_url: string | null;
  unlocked: boolean;
}

export default function Candidates() {
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [location, setLocation] = useState(params.get("location") ?? "");
  const [skill, setSkill] = useState(params.get("skill") ?? "");
  const [experience, setExperience] = useState(params.get("experience") ?? "");

  const query = params.toString();
  const { data, isLoading } = useQuery({
    queryKey: ["recruiter-candidates", query],
    queryFn: () => api.get<{ candidates: Cand[] }>(`/recruiter/candidates${query ? `?${query}` : ""}`),
  });
  const candidates = data?.candidates ?? [];

  function onSearch(e: FormEvent) {
    e.preventDefault();
    const next = new URLSearchParams();
    if (q.trim()) next.set("q", q.trim());
    if (location.trim()) next.set("location", location.trim());
    if (skill.trim()) next.set("skill", skill.trim());
    if (experience.trim()) next.set("experience", experience.trim());
    setParams(next);
  }

  return (
    <div>
      <PageHeader title="Search candidates" description="Find talent and unlock their contact details with coins." />

      <form onSubmit={onSearch} className="card mb-6 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="relative lg:col-span-2">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input className="input pl-9" placeholder="Name, skill or headline" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <input className="input" placeholder="Location" value={location} onChange={(e) => setLocation(e.target.value)} />
        <input className="input" placeholder="Skill" value={skill} onChange={(e) => setSkill(e.target.value)} />
        <div className="flex gap-2">
          <input className="input" type="number" min="0" placeholder="Min exp" value={experience} onChange={(e) => setExperience(e.target.value)} />
          <button type="submit" className="btn-primary shrink-0" aria-label="Search"><Search className="h-4 w-4" /></button>
        </div>
      </form>

      {isLoading ? (
        <Spinner />
      ) : candidates.length === 0 ? (
        <EmptyState icon={Users} title="No candidates found" description="Try adjusting your search filters." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {candidates.map((c) => (
            <Link
              key={c.id}
              to={`/dashboard/recruiter/candidates/${c.id}`}
              className="card group flex flex-col p-5 transition hover:-translate-y-0.5 hover:shadow-lift"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
                  {c.avatar_url ? <img src={c.avatar_url} alt={c.full_name ?? ""} className="h-full w-full object-cover" /> : initials(c.full_name)}
                </span>
                <div className="min-w-0">
                  <h3 className="truncate text-base font-semibold text-ink group-hover:text-brand-600">{c.full_name || "Candidate"}</h3>
                  {c.headline && <p className="truncate text-sm text-slate-500">{c.headline}</p>}
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                {c.location && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {c.location}</span>}
                {c.experience_years != null && <span>{c.experience_years} yrs exp</span>}
                {c.expected_salary != null && <span className="font-medium text-ink-soft">{formatINR(c.expected_salary, { compact: true })}</span>}
              </div>
              {c.skills?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {c.skills.slice(0, 5).map((s) => <span key={s} className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{s}</span>)}
                </div>
              )}
              <div className="mt-4 border-t border-slate-100 pt-3 text-xs font-medium">
                {c.unlocked ? (
                  <span className="inline-flex items-center gap-1 text-emerald-600"><CheckCircle2 className="h-3.5 w-3.5" /> Contact unlocked</span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-slate-400"><Lock className="h-3.5 w-3.5" /> Contact locked</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
