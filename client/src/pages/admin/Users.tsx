import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Users as UsersIcon, Coins, Ban, CheckCircle2 } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { PageHeader, Spinner, Badge, EmptyState } from "@/components/ui";
import { cn, formatDate, initials } from "@/lib/utils";

interface AdminUser {
  id: string;
  email: string;
  role: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
}

const ROLE_FILTERS = [
  { value: "", label: "All" },
  { value: "candidate", label: "Candidates" },
  { value: "recruiter", label: "Recruiters" },
  { value: "admin", label: "Admins" },
];

const roleTone: Record<string, string> = {
  candidate: "blue",
  recruiter: "violet",
  admin: "amber",
};

export default function Users() {
  const [searchParams, setSearchParams] = useSearchParams();
  const role = searchParams.get("role") ?? "";

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", role],
    queryFn: () => api.get<{ users: AdminUser[] }>("/admin/users" + (role ? `?role=${role}` : "")),
  });

  const users = data?.users ?? [];

  function setRole(value: string) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set("role", value);
    else next.delete("role");
    setSearchParams(next, { replace: true });
  }

  return (
    <div>
      <PageHeader title="Users" description="Manage every account on the platform." />

      <div className="mb-5 flex flex-wrap gap-2">
        {ROLE_FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setRole(f.value)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm font-medium transition",
              role === f.value
                ? "border-brand-600 bg-brand-600 text-white"
                : "border-slate-300 bg-white text-ink-soft hover:border-slate-400"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <Spinner />
      ) : users.length === 0 ? (
        <EmptyState icon={UsersIcon} title="No users found" description="No accounts match this filter." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <UserRow key={u.id} user={u} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function UserRow({ user }: { user: AdminUser }) {
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState("");

  const grant = useMutation({
    mutationFn: (value: number) => api.post(`/admin/users/${user.id}/grant-coins`, { amount: value }),
    onSuccess: () => {
      setAmount("");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (err) => alert(err instanceof ApiError ? err.message : "Could not grant coins"),
  });

  const toggle = useMutation({
    mutationFn: () => api.patch(`/admin/users/${user.id}/active`, { active: !user.is_active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
    onError: (err) => alert(err instanceof ApiError ? err.message : "Could not update user"),
  });

  const name = user.full_name || user.email;

  return (
    <tr className="align-middle">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          {user.avatar_url ? (
            <img src={user.avatar_url} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />
          ) : (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-700">
              {initials(name)}
            </span>
          )}
          <div className="min-w-0">
            <p className="truncate font-medium text-ink">{name}</p>
            <p className="truncate text-xs text-slate-500">{user.email}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <Badge tone={roleTone[user.role] ?? "slate"} className="capitalize">{user.role}</Badge>
      </td>
      <td className="px-4 py-3 text-slate-500">{formatDate(user.created_at)}</td>
      <td className="px-4 py-3">
        <Badge tone={user.is_active ? "green" : "red"}>{user.is_active ? "Active" : "Suspended"}</Badge>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-2">
          {user.role === "recruiter" && (
            <form
              className="flex items-center gap-1.5"
              onSubmit={(e) => {
                e.preventDefault();
                const v = Number(amount);
                if (v > 0) grant.mutate(v);
              }}
            >
              <input
                type="number"
                min={1}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Coins"
                className="input w-20 py-1.5 text-xs"
                aria-label="Coins to grant"
              />
              <button type="submit" disabled={grant.isPending || !amount} className="btn-outline btn-sm">
                <Coins className="h-3.5 w-3.5" /> Grant
              </button>
            </form>
          )}
          <button
            type="button"
            onClick={() => toggle.mutate()}
            disabled={toggle.isPending}
            className={cn("btn-sm", user.is_active ? "btn-outline text-red-600" : "btn-primary")}
          >
            {user.is_active ? <><Ban className="h-3.5 w-3.5" /> Suspend</> : <><CheckCircle2 className="h-3.5 w-3.5" /> Activate</>}
          </button>
        </div>
      </td>
    </tr>
  );
}
