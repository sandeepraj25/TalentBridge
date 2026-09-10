import { useState, type FormEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import { PageHeader, Spinner, Field } from "@/components/ui";

interface Settings {
  site_name: string;
  support_email: string;
  require_job_approval: boolean;
  require_company_verification: boolean;
  free_job_posts: number;
}

const EMPTY: Settings = {
  site_name: "",
  support_email: "",
  require_job_approval: false,
  require_company_verification: false,
  free_job_posts: 0,
};

export default function Settings() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: () => api.get<{ settings: Settings }>("/admin/settings"),
  });

  if (isLoading) return <Spinner />;

  return (
    <div>
      <PageHeader title="Settings" description="Configure platform-wide behaviour." />
      <SettingsForm initial={{ ...EMPTY, ...(data?.settings ?? {}) }} />
    </div>
  );
}

function SettingsForm({ initial }: { initial: Settings }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<Settings>(initial);
  const [saved, setSaved] = useState(false);
  const set = (patch: Partial<Settings>) => setForm((f) => ({ ...f, ...patch }));

  const save = useMutation({
    mutationFn: () =>
      api.put("/admin/settings", {
        site_name: form.site_name,
        support_email: form.support_email,
        require_job_approval: form.require_job_approval,
        require_company_verification: form.require_company_verification,
        free_job_posts: Number(form.free_job_posts) || 0,
      }),
    onSuccess: () => {
      setSaved(true);
      queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
      setTimeout(() => setSaved(false), 2500);
    },
    onError: (err) => alert(err instanceof ApiError ? err.message : "Could not save settings"),
  });

  function submit(e: FormEvent) {
    e.preventDefault();
    save.mutate();
  }

  return (
    <form onSubmit={submit} className="card max-w-2xl space-y-5 p-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Site name">
          <input className="input" value={form.site_name} onChange={(e) => set({ site_name: e.target.value })} />
        </Field>
        <Field label="Support email">
          <input type="email" className="input" value={form.support_email} onChange={(e) => set({ support_email: e.target.value })} />
        </Field>
      </div>

      <Field label="Free job posts" hint="How many jobs a recruiter can post before paying.">
        <input
          type="number"
          min={0}
          className="input sm:w-40"
          value={form.free_job_posts}
          onChange={(e) => set({ free_job_posts: Number(e.target.value) })}
        />
      </Field>

      <div className="space-y-3 border-t border-slate-100 pt-4">
        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={form.require_job_approval}
            onChange={(e) => set({ require_job_approval: e.target.checked })}
          />
          <span>
            <span className="font-medium text-ink">Require job approval</span>
            <span className="block text-slate-500">New jobs stay hidden until an admin approves them.</span>
          </span>
        </label>
        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={form.require_company_verification}
            onChange={(e) => set({ require_company_verification: e.target.checked })}
          />
          <span>
            <span className="font-medium text-ink">Require company verification</span>
            <span className="block text-slate-500">Companies must be verified before they can post.</span>
          </span>
        </label>
      </div>

      <div className="flex items-center gap-3 border-t border-slate-100 pt-4">
        <button type="submit" disabled={save.isPending} className="btn-primary">
          {save.isPending ? "Saving…" : "Save settings"}
        </button>
        {saved && <span className="text-sm font-medium text-emerald-600">Settings saved</span>}
      </div>
    </form>
  );
}
