import { useEffect, useState, type FormEvent, type ChangeEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, Clock } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { Badge, Field, Spinner, PageHeader } from "@/components/ui";
import { INDUSTRIES, COMPANY_SIZES } from "@/lib/constants";

interface CompanyResp {
  company: {
    id: string;
    name: string;
    logo_url: string | null;
    website: string | null;
    description: string | null;
    industry: string | null;
    company_size: string | null;
    location: string | null;
    is_verified: boolean;
    verification_status: string;
  } | null;
  designation: string | null;
}

export default function Company() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["recruiter-company"],
    queryFn: () => api.get<CompanyResp>("/recruiter/company"),
  });

  const [form, setForm] = useState({
    name: "",
    designation: "",
    industry: "",
    company_size: "",
    location: "",
    website: "",
    logo_url: "",
    description: "",
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!data) return;
    setForm({
      name: data.company?.name ?? "",
      designation: data.designation ?? "",
      industry: data.company?.industry ?? "",
      company_size: data.company?.company_size ?? "",
      location: data.company?.location ?? "",
      website: data.company?.website ?? "",
      logo_url: data.company?.logo_url ?? "",
      description: data.company?.description ?? "",
    });
  }, [data]);

  const set = (k: keyof typeof form) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = useMutation({
    mutationFn: () => api.put("/recruiter/company", form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["recruiter-company"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
    onError: (err) => alert(err instanceof ApiError ? err.message : "Could not save company."),
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaved(false);
    save.mutate();
  }

  if (isLoading) return <Spinner />;

  const status = data?.company?.verification_status;
  const verified = data?.company?.is_verified;

  return (
    <div>
      <PageHeader
        title="Company profile"
        description="This information is shown to candidates on your job posts."
        action={data?.company ? (
          verified
            ? <Badge tone="green"><BadgeCheck className="h-3.5 w-3.5" /> Verified</Badge>
            : <Badge tone="amber"><Clock className="h-3.5 w-3.5" /> {status === "rejected" ? "Rejected" : "Pending verification"}</Badge>
        ) : undefined}
      />

      <form onSubmit={onSubmit} className="card space-y-4 p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Company name" required>
            <input className="input" value={form.name} onChange={set("name")} required placeholder="e.g. Acme Technologies" />
          </Field>
          <Field label="Your designation">
            <input className="input" value={form.designation} onChange={set("designation")} placeholder="e.g. HR Manager" />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Industry">
            <select className="input" value={form.industry} onChange={set("industry")}>
              <option value="">Select industry</option>
              {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
            </select>
          </Field>
          <Field label="Company size">
            <select className="input" value={form.company_size} onChange={set("company_size")}>
              <option value="">Select size</option>
              {COMPANY_SIZES.map((s) => <option key={s} value={s}>{s} employees</option>)}
            </select>
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Location">
            <input className="input" value={form.location} onChange={set("location")} placeholder="e.g. Mumbai, India" />
          </Field>
          <Field label="Website">
            <input className="input" value={form.website} onChange={set("website")} placeholder="https://…" />
          </Field>
        </div>
        <Field label="Logo URL">
          <input className="input" value={form.logo_url} onChange={set("logo_url")} placeholder="https://…/logo.png" />
        </Field>
        <Field label="About the company">
          <textarea className="input min-h-[120px]" value={form.description} onChange={set("description")} placeholder="Tell candidates about your company…" />
        </Field>

        <div className="flex items-center gap-3">
          <button type="submit" className="btn-primary" disabled={save.isPending}>{save.isPending ? "Saving…" : "Save company"}</button>
          {saved && <span className="text-sm text-emerald-600">Company profile saved.</span>}
        </div>
      </form>
    </div>
  );
}
