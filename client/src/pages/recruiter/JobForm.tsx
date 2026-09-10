import { useEffect, useState, type FormEvent, type ChangeEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import { Field, Spinner, PageHeader } from "@/components/ui";
import { JOB_TYPES, WORK_MODES, JOB_STATUS, JOB_CATEGORIES } from "@/lib/constants";

interface FormState {
  title: string;
  description: string;
  responsibilities: string;
  requirements: string;
  location: string;
  job_type: string;
  work_mode: string;
  category: string;
  salary_min: string;
  salary_max: string;
  experience_min: string;
  experience_max: string;
  openings: string;
  skills: string;
  status: string;
}

const empty: FormState = {
  title: "",
  description: "",
  responsibilities: "",
  requirements: "",
  location: "",
  job_type: "full_time",
  work_mode: "onsite",
  category: "",
  salary_min: "",
  salary_max: "",
  experience_min: "",
  experience_max: "",
  openings: "1",
  skills: "",
  status: "active",
};

export default function JobForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [form, setForm] = useState<FormState>(empty);
  const [error, setError] = useState<{ message: string; needsCompany: boolean } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["recruiter-job", id],
    queryFn: () => api.get<{ job: any }>(`/recruiter/jobs/${id}`),
    enabled: !!id,
  });

  useEffect(() => {
    const j = data?.job;
    if (!j) return;
    setForm({
      title: j.title ?? "",
      description: j.description ?? "",
      responsibilities: j.responsibilities ?? "",
      requirements: j.requirements ?? "",
      location: j.location ?? "",
      job_type: j.job_type ?? "full_time",
      work_mode: j.work_mode ?? "onsite",
      category: j.category ?? "",
      salary_min: j.salary_min != null ? String(j.salary_min) : "",
      salary_max: j.salary_max != null ? String(j.salary_max) : "",
      experience_min: j.experience_min != null ? String(j.experience_min) : "",
      experience_max: j.experience_max != null ? String(j.experience_max) : "",
      openings: j.openings != null ? String(j.openings) : "1",
      skills: Array.isArray(j.skills) ? j.skills.join(", ") : (j.skills ?? ""),
      status: j.status ?? "active",
    });
  }, [data]);

  const set = (k: keyof FormState) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      id ? api.put(`/recruiter/jobs/${id}`, payload) : api.post<{ id: string }>("/recruiter/jobs", payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["recruiter-jobs"] });
      navigate("/dashboard/recruiter/jobs");
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        setError({ message: err.message, needsCompany: err.status === 400 && /compan/i.test(err.message) });
      } else {
        setError({ message: "Could not save job.", needsCompany: false });
      }
    },
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const num = (v: string) => (v.trim() === "" ? null : Number(v));
    save.mutate({
      title: form.title,
      description: form.description,
      responsibilities: form.responsibilities,
      requirements: form.requirements,
      location: form.location,
      job_type: form.job_type,
      work_mode: form.work_mode,
      category: form.category || null,
      salary_min: num(form.salary_min),
      salary_max: num(form.salary_max),
      experience_min: num(form.experience_min),
      experience_max: num(form.experience_max),
      openings: num(form.openings) ?? 1,
      skills: form.skills,
      status: form.status,
    });
  }

  if (id && isLoading) return <Spinner />;

  return (
    <div>
      <PageHeader title={id ? "Edit job" : "Post a new job"} description="Describe the role and it'll be visible to candidates." />

      {error && (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error.message}
          {error.needsCompany && (
            <> <Link to="/dashboard/recruiter/company" className="link">Create your company profile first</Link>.</>
          )}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-6">
        <div className="card space-y-4 p-6">
          <Field label="Job title" htmlFor="title" required>
            <input id="title" className="input" value={form.title} onChange={set("title")} required placeholder="e.g. Senior Frontend Engineer" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Job type">
              <select className="input" value={form.job_type} onChange={set("job_type")}>
                {JOB_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </Field>
            <Field label="Work mode">
              <select className="input" value={form.work_mode} onChange={set("work_mode")}>
                {WORK_MODES.map((w) => <option key={w.value} value={w.value}>{w.label}</option>)}
              </select>
            </Field>
            <Field label="Openings">
              <input type="number" min="1" className="input" value={form.openings} onChange={set("openings")} />
            </Field>
          </div>
          <Field label="Category">
            <select className="input" value={form.category} onChange={set("category")}>
              <option value="">Select Category</option>
              {JOB_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </Field>
          <Field label="Location">
            <input className="input" value={form.location} onChange={set("location")} placeholder="e.g. Bengaluru, India" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Minimum salary (₹ / year)">
              <input type="number" min="0" className="input" value={form.salary_min} onChange={set("salary_min")} placeholder="e.g. 800000" />
            </Field>
            <Field label="Maximum salary (₹ / year)">
              <input type="number" min="0" className="input" value={form.salary_max} onChange={set("salary_max")} placeholder="e.g. 1500000" />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Minimum experience (years)">
              <input type="number" min="0" className="input" value={form.experience_min} onChange={set("experience_min")} />
            </Field>
            <Field label="Maximum experience (years)">
              <input type="number" min="0" className="input" value={form.experience_max} onChange={set("experience_max")} />
            </Field>
          </div>
          <Field label="Skills" hint="Comma-separated, e.g. React, TypeScript, Node.js">
            <input className="input" value={form.skills} onChange={set("skills")} placeholder="React, TypeScript, Node.js" />
          </Field>
        </div>

        <div className="card space-y-4 p-6">
          <Field label="Description" required>
            <textarea className="input min-h-[120px]" value={form.description} onChange={set("description")} required placeholder="What is this role about?" />
          </Field>
          <Field label="Responsibilities">
            <textarea className="input min-h-[100px]" value={form.responsibilities} onChange={set("responsibilities")} placeholder="Day-to-day responsibilities" />
          </Field>
          <Field label="Requirements">
            <textarea className="input min-h-[100px]" value={form.requirements} onChange={set("requirements")} placeholder="What you're looking for in a candidate" />
          </Field>
          <Field label="Status">
            <select className="input" value={form.status} onChange={set("status")}>
              {JOB_STATUS.map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
            </select>
          </Field>
        </div>

        <div className="flex items-center gap-3">
          <button type="submit" className="btn-primary" disabled={save.isPending}>
            {save.isPending ? "Saving…" : id ? "Save changes" : "Publish job"}
          </button>
          <Link to="/dashboard/recruiter/jobs" className="btn-outline">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
