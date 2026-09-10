import { useState, type FormEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Package as PackageIcon, Plus, Check } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { PageHeader, Spinner, Badge, EmptyState, Field } from "@/components/ui";
import { formatINR } from "@/lib/utils";
import type { Package } from "@/lib/types";

interface PackageForm {
  name: string;
  tier: string;
  price: string;
  coins: string;
  job_posts: string;
  candidate_unlocks: string;
  validity_days: string;
  sort_order: string;
  features: string;
  is_active: boolean;
}

const TIERS = [
  { value: "free", label: "Free" },
  { value: "basic", label: "Basic" },
  { value: "pro", label: "Pro" },
  { value: "enterprise", label: "Enterprise" },
];

function toForm(p?: Package): PackageForm {
  return {
    name: p?.name ?? "",
    tier: p?.tier ?? "basic",
    price: p ? String(p.price) : "",
    coins: p ? String(p.coins) : "",
    job_posts: p ? String(p.job_posts) : "",
    candidate_unlocks: p ? String(p.candidate_unlocks) : "",
    validity_days: p ? String(p.validity_days) : "",
    sort_order: p ? String(p.sort_order) : "0",
    features: (p?.features ?? []).join("\n"),
    is_active: p ? p.is_active : true,
  };
}

function toPayload(f: PackageForm) {
  return {
    name: f.name.trim(),
    tier: f.tier,
    price: Number(f.price) || 0,
    coins: Number(f.coins) || 0,
    job_posts: Number(f.job_posts) || 0,
    candidate_unlocks: Number(f.candidate_unlocks) || 0,
    validity_days: Number(f.validity_days) || 0,
    sort_order: Number(f.sort_order) || 0,
    features: f.features.split("\n").map((s) => s.trim()).filter(Boolean).join(","),
    is_active: f.is_active,
  };
}

export default function Packages() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-packages"],
    queryFn: () => api.get<{ packages: Package[] }>("/admin/packages"),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin-packages"] });
  const onError = (err: unknown) => alert(err instanceof ApiError ? err.message : "Could not save package");

  const create = useMutation({
    mutationFn: (payload: ReturnType<typeof toPayload>) => api.post("/admin/packages", payload),
    onSuccess: invalidate,
    onError,
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.del(`/admin/packages/${id}`),
    onSuccess: invalidate,
    onError,
  });

  const packages = data?.packages ?? [];

  return (
    <div>
      <PageHeader title="Packages" description="Define the plans recruiters can purchase." />

      <details className="card mb-6 p-5">
        <summary className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-ink">
          <Plus className="h-4 w-4 text-brand-600" /> New package
        </summary>
        <div className="mt-4 border-t border-slate-100 pt-4">
          <PackageFields
            initial={toForm()}
            pending={create.isPending}
            submitLabel="Create package"
            onSubmit={(f) => create.mutate(toPayload(f))}
          />
        </div>
      </details>

      {isLoading ? (
        <Spinner />
      ) : packages.length === 0 ? (
        <EmptyState icon={PackageIcon} title="No packages" description="Create your first plan to get started." />
      ) : (
        <div className="space-y-4">
          {packages.map((p) => (
            <div key={p.id} className="card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-ink">{p.name}</h3>
                    <Badge tone="violet" className="capitalize">{p.tier}</Badge>
                    <Badge tone={p.is_active ? "green" : "slate"}>{p.is_active ? "Active" : "Inactive"}</Badge>
                  </div>
                  <p className="mt-1 text-2xl font-bold text-ink">{formatINR(p.price)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => remove.mutate(p.id)}
                    disabled={remove.isPending}
                    className="btn-outline btn-sm text-red-600"
                  >
                    Deactivate
                  </button>
                </div>
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-5">
                <Meta label="Coins" value={p.coins} />
                <Meta label="Job posts" value={p.job_posts} />
                <Meta label="Unlocks" value={p.candidate_unlocks} />
                <Meta label="Validity" value={`${p.validity_days} days`} />
                <Meta label="Sort" value={p.sort_order} />
              </dl>

              {p.features?.length > 0 && (
                <ul className="mt-4 grid gap-1.5 sm:grid-cols-2">
                  {p.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-ink-soft">
                      <Check className="h-4 w-4 shrink-0 text-emerald-500" /> {f}
                    </li>
                  ))}
                </ul>
              )}

              <details className="mt-4 border-t border-slate-100 pt-4">
                <summary className="cursor-pointer text-sm font-medium text-brand-600">Edit package</summary>
                <div className="mt-4">
                  <EditPackage pkg={p} onDone={invalidate} onError={onError} />
                </div>
              </details>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="mt-0.5 font-semibold text-ink">{value}</dd>
    </div>
  );
}

function EditPackage({ pkg, onDone, onError }: { pkg: Package; onDone: () => void; onError: (e: unknown) => void }) {
  const update = useMutation({
    mutationFn: (payload: ReturnType<typeof toPayload>) => api.put(`/admin/packages/${pkg.id}`, payload),
    onSuccess: onDone,
    onError,
  });
  return (
    <PackageFields
      initial={toForm(pkg)}
      pending={update.isPending}
      submitLabel="Save changes"
      onSubmit={(f) => update.mutate(toPayload(f))}
    />
  );
}

function PackageFields({
  initial, pending, submitLabel, onSubmit,
}: {
  initial: PackageForm;
  pending: boolean;
  submitLabel: string;
  onSubmit: (f: PackageForm) => void;
}) {
  const [form, setForm] = useState<PackageForm>(initial);
  const set = (patch: Partial<PackageForm>) => setForm((f) => ({ ...f, ...patch }));

  function submit(e: FormEvent) {
    e.preventDefault();
    onSubmit(form);
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name">
          <input className="input" value={form.name} onChange={(e) => set({ name: e.target.value })} required />
        </Field>
        <Field label="Tier">
          <select className="input" value={form.tier} onChange={(e) => set({ tier: e.target.value })}>
            {TIERS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Price (₹)">
          <input type="number" min={0} className="input" value={form.price} onChange={(e) => set({ price: e.target.value })} />
        </Field>
        <Field label="Coins">
          <input type="number" min={0} className="input" value={form.coins} onChange={(e) => set({ coins: e.target.value })} />
        </Field>
        <Field label="Validity (days)">
          <input type="number" min={0} className="input" value={form.validity_days} onChange={(e) => set({ validity_days: e.target.value })} />
        </Field>
        <Field label="Job posts">
          <input type="number" min={0} className="input" value={form.job_posts} onChange={(e) => set({ job_posts: e.target.value })} />
        </Field>
        <Field label="Candidate unlocks">
          <input type="number" min={0} className="input" value={form.candidate_unlocks} onChange={(e) => set({ candidate_unlocks: e.target.value })} />
        </Field>
        <Field label="Sort order">
          <input type="number" className="input" value={form.sort_order} onChange={(e) => set({ sort_order: e.target.value })} />
        </Field>
      </div>

      <Field label="Features" hint="One feature per line.">
        <textarea
          className="input min-h-[96px]"
          value={form.features}
          onChange={(e) => set({ features: e.target.value })}
          placeholder={"Unlimited job posts\nPriority support"}
        />
      </Field>

      <label className="flex items-center gap-2 text-sm text-ink-soft">
        <input type="checkbox" checked={form.is_active} onChange={(e) => set({ is_active: e.target.checked })} />
        Active
      </label>

      <button type="submit" disabled={pending} className="btn-primary btn-sm">
        {pending ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
