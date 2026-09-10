import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, GraduationCap, Briefcase, FolderGit2, Trash2, Plus } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { PageHeader, Spinner, Field } from "@/components/ui";
import type { Candidate } from "@/lib/types";

interface ProfileData {
  profile: { full_name: string | null; phone: string | null; email: string | null };
  candidate: Candidate;
  educations: any[];
  experiences: any[];
  projects: any[];
}

interface FormState {
  full_name: string;
  phone: string;
  headline: string;
  about: string;
  location: string;
  experience_years: string;
  current_salary: string;
  expected_salary: string;
  notice_period_days: string;
  resume_url: string;
  skills: string;
  open_to_work: boolean;
}

function buildForm(data: ProfileData): FormState {
  const c = data.candidate ?? ({} as Candidate);
  const p = data.profile ?? ({} as ProfileData["profile"]);
  const numStr = (v: number | null | undefined) => (v === null || v === undefined ? "" : String(v));
  return {
    full_name: p.full_name ?? "",
    phone: p.phone ?? "",
    headline: c.headline ?? "",
    about: c.about ?? "",
    location: c.location ?? "",
    experience_years: numStr(c.experience_years),
    current_salary: numStr(c.current_salary),
    expected_salary: numStr(c.expected_salary),
    notice_period_days: numStr(c.notice_period_days),
    resume_url: c.resume_url ?? "",
    skills: Array.isArray(c.skills) ? c.skills.join(", ") : "",
    open_to_work: Boolean(c.open_to_work),
  };
}

export default function Profile() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["candidate-profile"],
    queryFn: () => api.get<ProfileData>("/candidate/profile"),
  });

  const [form, setForm] = useState<FormState | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (data && form === null) setForm(buildForm(data));
  }, [data, form]);

  const save = useMutation({
    mutationFn: (values: FormState) => {
      const num = (v: string) => (v.trim() === "" ? null : Number(v));
      return api.put("/candidate/profile", {
        full_name: values.full_name,
        phone: values.phone,
        headline: values.headline,
        about: values.about,
        location: values.location,
        experience_years: num(values.experience_years),
        current_salary: num(values.current_salary),
        expected_salary: num(values.expected_salary),
        notice_period_days: num(values.notice_period_days),
        resume_url: values.resume_url,
        skills: values.skills,
        open_to_work: values.open_to_work,
      });
    },
    onSuccess: () => {
      setError("");
      qc.invalidateQueries({ queryKey: ["candidate-profile"] });
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : "Could not save profile"),
  });

  if (isLoading || !form) return <Spinner />;

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => (f ? { ...f, [key]: value } : f));

  function submit(e: FormEvent) {
    e.preventDefault();
    if (form) save.mutate(form);
  }

  return (
    <div>
      <PageHeader title="My profile" description="Keep your profile up to date so recruiters can find you." />

      <form onSubmit={submit} className="card space-y-5 p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" htmlFor="full_name">
            <input id="full_name" className="input" value={form.full_name} onChange={(e) => set("full_name", e.target.value)} />
          </Field>
          <Field label="Phone" htmlFor="phone">
            <input id="phone" className="input" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
          </Field>
        </div>

        <Field label="Headline" htmlFor="headline" hint="A short summary shown at the top of your profile.">
          <input id="headline" className="input" placeholder="e.g. Senior Frontend Engineer" value={form.headline} onChange={(e) => set("headline", e.target.value)} />
        </Field>

        <Field label="About" htmlFor="about">
          <textarea id="about" rows={4} className="input" placeholder="Tell recruiters about yourself…" value={form.about} onChange={(e) => set("about", e.target.value)} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Location" htmlFor="location">
            <input id="location" className="input" placeholder="e.g. Bengaluru" value={form.location} onChange={(e) => set("location", e.target.value)} />
          </Field>
          <Field label="Years of experience" htmlFor="experience_years">
            <input id="experience_years" type="number" min="0" className="input" value={form.experience_years} onChange={(e) => set("experience_years", e.target.value)} />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Current salary (₹/yr)" htmlFor="current_salary">
            <input id="current_salary" type="number" min="0" className="input" value={form.current_salary} onChange={(e) => set("current_salary", e.target.value)} />
          </Field>
          <Field label="Expected salary (₹/yr)" htmlFor="expected_salary">
            <input id="expected_salary" type="number" min="0" className="input" value={form.expected_salary} onChange={(e) => set("expected_salary", e.target.value)} />
          </Field>
          <Field label="Notice period (days)" htmlFor="notice_period_days">
            <input id="notice_period_days" type="number" min="0" className="input" value={form.notice_period_days} onChange={(e) => set("notice_period_days", e.target.value)} />
          </Field>
        </div>

        <Field label="Resume URL" htmlFor="resume_url">
          <input id="resume_url" type="url" className="input" placeholder="https://…" value={form.resume_url} onChange={(e) => set("resume_url", e.target.value)} />
        </Field>

        <Field label="Skills" htmlFor="skills" hint="Comma-separated, e.g. React, TypeScript, Node.js">
          <input id="skills" className="input" value={form.skills} onChange={(e) => set("skills", e.target.value)} />
        </Field>

        <label className="flex items-center gap-2 text-sm text-ink-soft">
          <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-400" checked={form.open_to_work} onChange={(e) => set("open_to_work", e.target.checked)} />
          Open to work — show recruiters I'm available
        </label>

        {error && <p className="text-sm font-medium text-red-600">{error}</p>}

        <div className="flex items-center gap-3">
          <button type="submit" className="btn-primary" disabled={save.isPending}>
            {save.isPending ? "Saving…" : "Save changes"}
          </button>
          {save.isSuccess && !save.isPending && (
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600">
              <CheckCircle2 className="h-4 w-4" /> Profile saved
            </span>
          )}
        </div>
      </form>

      <div className="mt-6 space-y-4">
        <EducationSection rows={data?.educations ?? []} />
        <ExperienceSection rows={data?.experiences ?? []} />
        <ProjectSection rows={data?.projects ?? []} />
      </div>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  count,
  children,
}: {
  icon: typeof GraduationCap;
  title: string;
  count: number;
  children: ReactNode;
}) {
  return (
    <details className="card group overflow-hidden">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-5">
        <span className="flex items-center gap-2.5 text-base font-semibold text-ink">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <Icon className="h-4 w-4" />
          </span>
          {title}
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">{count}</span>
        </span>
        <span className="text-sm text-slate-400 group-open:hidden">Show</span>
        <span className="hidden text-sm text-slate-400 group-open:inline">Hide</span>
      </summary>
      <div className="border-t border-slate-100 p-5">{children}</div>
    </details>
  );
}

function RowList({ items }: { items: { id: string; title: string; subtitle?: string; onDelete: () => void; deleting: boolean }[] }) {
  if (items.length === 0) return <p className="mb-4 text-sm text-slate-400">Nothing added yet.</p>;
  return (
    <ul className="mb-4 divide-y divide-slate-100">
      {items.map((it) => (
        <li key={it.id} className="flex items-center justify-between gap-3 py-2.5">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-ink">{it.title}</p>
            {it.subtitle && <p className="truncate text-xs text-slate-500">{it.subtitle}</p>}
          </div>
          <button onClick={it.onDelete} disabled={it.deleting} className="btn-ghost btn-sm text-slate-400 hover:text-red-600" aria-label="Delete">
            <Trash2 className="h-4 w-4" />
          </button>
        </li>
      ))}
    </ul>
  );
}

function EducationSection({ rows }: { rows: any[] }) {
  const qc = useQueryClient();
  const empty = { institution: "", degree: "", field: "", start_year: "", end_year: "", grade: "" };
  const [f, setF] = useState(empty);

  const add = useMutation({
    mutationFn: () =>
      api.post("/candidate/education", {
        institution: f.institution,
        degree: f.degree,
        field: f.field,
        start_year: f.start_year ? Number(f.start_year) : null,
        end_year: f.end_year ? Number(f.end_year) : null,
        grade: f.grade,
      }),
    onSuccess: () => {
      setF(empty);
      qc.invalidateQueries({ queryKey: ["candidate-profile"] });
    },
  });

  const del = useMutation({
    mutationFn: (id: string) => api.del(`/candidate/educations/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["candidate-profile"] }),
  });

  return (
    <Section icon={GraduationCap} title="Education" count={rows.length}>
      <RowList
        items={rows.map((r) => ({
          id: r.id,
          title: [r.degree, r.field].filter(Boolean).join(", ") || r.institution || "Education",
          subtitle: [r.institution, [r.start_year, r.end_year].filter(Boolean).join(" – ")].filter(Boolean).join(" • "),
          onDelete: () => del.mutate(r.id),
          deleting: del.isPending,
        }))}
      />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (f.institution.trim()) add.mutate();
        }}
        className="grid gap-3 sm:grid-cols-2"
      >
        <input className="input" placeholder="Institution" value={f.institution} onChange={(e) => setF({ ...f, institution: e.target.value })} />
        <input className="input" placeholder="Degree" value={f.degree} onChange={(e) => setF({ ...f, degree: e.target.value })} />
        <input className="input" placeholder="Field of study" value={f.field} onChange={(e) => setF({ ...f, field: e.target.value })} />
        <input className="input" placeholder="Grade" value={f.grade} onChange={(e) => setF({ ...f, grade: e.target.value })} />
        <input className="input" type="number" placeholder="Start year" value={f.start_year} onChange={(e) => setF({ ...f, start_year: e.target.value })} />
        <input className="input" type="number" placeholder="End year" value={f.end_year} onChange={(e) => setF({ ...f, end_year: e.target.value })} />
        <div className="sm:col-span-2">
          <button type="submit" className="btn-outline btn-sm" disabled={add.isPending}>
            <Plus className="h-4 w-4" /> {add.isPending ? "Adding…" : "Add education"}
          </button>
        </div>
      </form>
    </Section>
  );
}

function ExperienceSection({ rows }: { rows: any[] }) {
  const qc = useQueryClient();
  const empty = { company: "", title: "", location: "", start_date: "", end_date: "", is_current: false, description: "" };
  const [f, setF] = useState(empty);

  const add = useMutation({
    mutationFn: () =>
      api.post("/candidate/experience", {
        company: f.company,
        title: f.title,
        location: f.location,
        start_date: f.start_date || null,
        end_date: f.is_current ? null : f.end_date || null,
        is_current: f.is_current,
        description: f.description,
      }),
    onSuccess: () => {
      setF(empty);
      qc.invalidateQueries({ queryKey: ["candidate-profile"] });
    },
  });

  const del = useMutation({
    mutationFn: (id: string) => api.del(`/candidate/experiences/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["candidate-profile"] }),
  });

  return (
    <Section icon={Briefcase} title="Experience" count={rows.length}>
      <RowList
        items={rows.map((r) => ({
          id: r.id,
          title: [r.title, r.company].filter(Boolean).join(" at ") || "Experience",
          subtitle: [r.location, [r.start_date, r.is_current ? "Present" : r.end_date].filter(Boolean).join(" – ")].filter(Boolean).join(" • "),
          onDelete: () => del.mutate(r.id),
          deleting: del.isPending,
        }))}
      />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (f.company.trim() || f.title.trim()) add.mutate();
        }}
        className="grid gap-3 sm:grid-cols-2"
      >
        <input className="input" placeholder="Company" value={f.company} onChange={(e) => setF({ ...f, company: e.target.value })} />
        <input className="input" placeholder="Job title" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
        <input className="input" placeholder="Location" value={f.location} onChange={(e) => setF({ ...f, location: e.target.value })} />
        <div className="grid grid-cols-2 gap-3">
          <input className="input" type="date" value={f.start_date} onChange={(e) => setF({ ...f, start_date: e.target.value })} />
          <input className="input" type="date" value={f.end_date} disabled={f.is_current} onChange={(e) => setF({ ...f, end_date: e.target.value })} />
        </div>
        <textarea className="input sm:col-span-2" rows={2} placeholder="Description" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
        <label className="flex items-center gap-2 text-sm text-ink-soft">
          <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-400" checked={f.is_current} onChange={(e) => setF({ ...f, is_current: e.target.checked })} />
          I currently work here
        </label>
        <div className="sm:col-span-2">
          <button type="submit" className="btn-outline btn-sm" disabled={add.isPending}>
            <Plus className="h-4 w-4" /> {add.isPending ? "Adding…" : "Add experience"}
          </button>
        </div>
      </form>
    </Section>
  );
}

function ProjectSection({ rows }: { rows: any[] }) {
  const qc = useQueryClient();
  const empty = { title: "", url: "", description: "", tech: "" };
  const [f, setF] = useState(empty);

  const add = useMutation({
    mutationFn: () =>
      api.post("/candidate/project", {
        title: f.title,
        url: f.url,
        description: f.description,
        tech: f.tech,
      }),
    onSuccess: () => {
      setF(empty);
      qc.invalidateQueries({ queryKey: ["candidate-profile"] });
    },
  });

  const del = useMutation({
    mutationFn: (id: string) => api.del(`/candidate/projects/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["candidate-profile"] }),
  });

  return (
    <Section icon={FolderGit2} title="Projects" count={rows.length}>
      <RowList
        items={rows.map((r) => ({
          id: r.id,
          title: r.title || "Project",
          subtitle: [Array.isArray(r.tech) ? r.tech.join(", ") : r.tech, r.url].filter(Boolean).join(" • "),
          onDelete: () => del.mutate(r.id),
          deleting: del.isPending,
        }))}
      />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (f.title.trim()) add.mutate();
        }}
        className="grid gap-3 sm:grid-cols-2"
      >
        <input className="input" placeholder="Project title" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
        <input className="input" type="url" placeholder="URL (https://…)" value={f.url} onChange={(e) => setF({ ...f, url: e.target.value })} />
        <input className="input sm:col-span-2" placeholder="Tech (comma-separated)" value={f.tech} onChange={(e) => setF({ ...f, tech: e.target.value })} />
        <textarea className="input sm:col-span-2" rows={2} placeholder="Description" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
        <div className="sm:col-span-2">
          <button type="submit" className="btn-outline btn-sm" disabled={add.isPending}>
            <Plus className="h-4 w-4" /> {add.isPending ? "Adding…" : "Add project"}
          </button>
        </div>
      </form>
    </Section>
  );
}
