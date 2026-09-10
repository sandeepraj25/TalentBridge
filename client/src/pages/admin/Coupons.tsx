import { useState, type FormEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ticket } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { PageHeader, Spinner, Badge, EmptyState, Field } from "@/components/ui";
import { formatINR, formatDate } from "@/lib/utils";

interface Coupon {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  max_uses: number | null;
  used_count: number;
  valid_until: string | null;
  is_active: boolean;
}

export default function Coupons() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-coupons"],
    queryFn: () => api.get<{ coupons: Coupon[] }>("/admin/coupons"),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
  const onError = (err: unknown) => alert(err instanceof ApiError ? err.message : "Could not save coupon");

  const create = useMutation({
    mutationFn: (payload: {
      code: string; discount_type: string; discount_value: number; max_uses: number | null; valid_until: string | null;
    }) => api.post("/admin/coupons", payload),
    onSuccess: invalidate,
    onError,
  });

  const toggle = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      api.patch(`/admin/coupons/${id}/toggle`, { active }),
    onSuccess: invalidate,
    onError,
  });

  const [code, setCode] = useState("");
  const [type, setType] = useState("percent");
  const [value, setValue] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [validUntil, setValidUntil] = useState("");

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    create.mutate(
      {
        code: code.trim().toUpperCase(),
        discount_type: type,
        discount_value: Number(value) || 0,
        max_uses: maxUses ? Number(maxUses) : null,
        valid_until: validUntil || null,
      },
      {
        onSuccess: () => {
          setCode(""); setValue(""); setMaxUses(""); setValidUntil(""); setType("percent");
        },
      }
    );
  }

  const coupons = data?.coupons ?? [];

  return (
    <div>
      <PageHeader title="Coupons" description="Create and manage discount codes." />

      <form onSubmit={submit} className="card mb-6 grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-5 lg:items-end">
        <Field label="Code">
          <input className="input font-mono uppercase" value={code} onChange={(e) => setCode(e.target.value)} placeholder="WELCOME10" required />
        </Field>
        <Field label="Type">
          <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="percent">Percent</option>
            <option value="flat">Flat</option>
          </select>
        </Field>
        <Field label={type === "percent" ? "Value (%)" : "Value (₹)"}>
          <input type="number" min={0} className="input" value={value} onChange={(e) => setValue(e.target.value)} required />
        </Field>
        <Field label="Max uses" hint="Blank = unlimited">
          <input type="number" min={0} className="input" value={maxUses} onChange={(e) => setMaxUses(e.target.value)} />
        </Field>
        <div className="flex items-end gap-2">
          <Field label="Valid until" className="flex-1">
            <input type="date" className="input" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
          </Field>
          <button type="submit" disabled={create.isPending} className="btn-primary shrink-0">
            Add
          </button>
        </div>
      </form>

      {isLoading ? (
        <Spinner />
      ) : coupons.length === 0 ? (
        <EmptyState icon={Ticket} title="No coupons" description="Create a discount code to reward your users." />
      ) : (
        <div className="space-y-3">
          {coupons.map((c) => (
            <div key={c.id} className="card flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <span className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-1.5 font-mono text-sm font-semibold text-ink">
                  {c.code}
                </span>
                <div>
                  <p className="font-medium text-ink">
                    {c.discount_type === "percent" ? `${c.discount_value}% off` : `${formatINR(c.discount_value)} off`}
                  </p>
                  <p className="text-xs text-slate-500">
                    Used {c.used_count}{c.max_uses != null ? ` / ${c.max_uses}` : ""}
                    {c.valid_until && <> · expires {formatDate(c.valid_until)}</>}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <Badge tone={c.is_active ? "green" : "slate"}>{c.is_active ? "Active" : "Disabled"}</Badge>
                <button
                  type="button"
                  onClick={() => toggle.mutate({ id: c.id, active: !c.is_active })}
                  disabled={toggle.isPending}
                  className={c.is_active ? "btn-outline btn-sm text-red-600" : "btn-primary btn-sm"}
                >
                  {c.is_active ? "Disable" : "Enable"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
