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
      <PaymentGatewaySettings />
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

/* ── Payment gateway settings ─────────────────────────────────────────────── */

interface GatewayCredentials {
  keyId?: string;
  appId?: string;
  secretKeyMasked: string;
  secretKeyConfigured: boolean;
  webhookSecretMasked: string;
  webhookSecretConfigured: boolean;
  env?: string;
}

interface GatewaySettingsResp {
  settings: {
    activeGateway: string;
    razorpay: GatewayCredentials;
    cashfree: GatewayCredentials;
  };
}

function PaymentGatewaySettings() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-payment-gateway"],
    queryFn: () => api.get<GatewaySettingsResp>("/admin/payment-gateway"),
  });

  const [activeGateway, setActiveGateway] = useState("");
  const [rzKeyId, setRzKeyId] = useState("");
  const [rzSecret, setRzSecret] = useState("");
  const [rzWebhook, setRzWebhook] = useState("");
  const [cfAppId, setCfAppId] = useState("");
  const [cfSecret, setCfSecret] = useState("");
  const [cfWebhook, setCfWebhook] = useState("");
  const [cfEnv, setCfEnv] = useState("sandbox");
  const [loaded, setLoaded] = useState(false);
  const [saved, setSaved] = useState(false);

  // Populate form from fetched data
  if (data?.settings && !loaded) {
    const s = data.settings;
    setActiveGateway(s.activeGateway || "");
    setRzKeyId(s.razorpay.keyId || "");
    setCfAppId(s.cashfree.appId || "");
    setCfEnv(s.cashfree.env || "sandbox");
    setLoaded(true);
  }

  const save = useMutation({
    mutationFn: () =>
      api.put("/admin/payment-gateway", {
        activeGateway,
        razorpay: {
          keyId: rzKeyId,
          ...(rzSecret ? { secretKey: rzSecret } : {}),
          ...(rzWebhook ? { webhookSecret: rzWebhook } : {}),
        },
        cashfree: {
          appId: cfAppId,
          ...(cfSecret ? { secretKey: cfSecret } : {}),
          ...(cfWebhook ? { webhookSecret: cfWebhook } : {}),
          env: cfEnv,
        },
      }),
    onSuccess: () => {
      setSaved(true);
      setRzSecret("");
      setRzWebhook("");
      setCfSecret("");
      setCfWebhook("");
      queryClient.invalidateQueries({ queryKey: ["admin-payment-gateway"] });
      setTimeout(() => setSaved(false), 2500);
    },
    onError: (err) => alert(err instanceof ApiError ? err.message : "Could not save gateway settings"),
  });

  if (isLoading) return null;

  const rz = data?.settings?.razorpay;
  const cf = data?.settings?.cashfree;

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); save.mutate(); }}
      className="card mt-6 max-w-2xl space-y-5 p-6"
    >
      <h3 className="text-lg font-semibold text-ink">Payment gateway</h3>

      {/* Active gateway radio */}
      <div className="space-y-2">
        <p className="label">Active gateway</p>
        <div className="flex gap-6">
          {(["razorpay", "cashfree"] as const).map((gw) => (
            <label key={gw} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="activeGateway"
                value={gw}
                checked={activeGateway === gw}
                onChange={() => setActiveGateway(gw)}
              />
              <span className="capitalize">{gw}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Razorpay credentials */}
      <div className="space-y-3 border-t border-slate-100 pt-4">
        <p className="text-sm font-medium text-ink">Razorpay</p>
        <Field label="Key ID">
          <input className="input" value={rzKeyId} onChange={(e) => setRzKeyId(e.target.value)} placeholder="rzp_live_..." />
        </Field>
        <Field label="Secret key" hint={rz?.secretKeyConfigured ? `Configured (${rz.secretKeyMasked})` : "Not configured"}>
          <input className="input" type="password" value={rzSecret} onChange={(e) => setRzSecret(e.target.value)} placeholder="Leave blank to keep current" />
        </Field>
        <Field label="Webhook secret" hint={rz?.webhookSecretConfigured ? `Configured (${rz.webhookSecretMasked})` : "Not configured"}>
          <input className="input" type="password" value={rzWebhook} onChange={(e) => setRzWebhook(e.target.value)} placeholder="Leave blank to keep current" />
        </Field>
      </div>

      {/* Cashfree credentials */}
      <div className="space-y-3 border-t border-slate-100 pt-4">
        <p className="text-sm font-medium text-ink">Cashfree</p>
        <Field label="App ID">
          <input className="input" value={cfAppId} onChange={(e) => setCfAppId(e.target.value)} placeholder="CF_APP_..." />
        </Field>
        <Field label="Secret key" hint={cf?.secretKeyConfigured ? `Configured (${cf.secretKeyMasked})` : "Not configured"}>
          <input className="input" type="password" value={cfSecret} onChange={(e) => setCfSecret(e.target.value)} placeholder="Leave blank to keep current" />
        </Field>
        <Field label="Webhook secret" hint={cf?.webhookSecretConfigured ? `Configured (${cf.webhookSecretMasked})` : "Not configured"}>
          <input className="input" type="password" value={cfWebhook} onChange={(e) => setCfWebhook(e.target.value)} placeholder="Leave blank to keep current" />
        </Field>
        <Field label="Environment">
          <select className="input sm:w-40" value={cfEnv} onChange={(e) => setCfEnv(e.target.value)}>
            <option value="sandbox">Sandbox</option>
            <option value="production">Production</option>
          </select>
        </Field>
      </div>

      <div className="flex items-center gap-3 border-t border-slate-100 pt-4">
        <button type="submit" disabled={save.isPending} className="btn-primary">
          {save.isPending ? "Saving…" : "Save gateway settings"}
        </button>
        {saved && <span className="text-sm font-medium text-emerald-600">Gateway settings saved</span>}
      </div>
    </form>
  );
}
