import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Building2, MapPin } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { PageHeader, Spinner, Badge, EmptyState } from "@/components/ui";
import { formatDate } from "@/lib/utils";

interface AdminCompany {
  id: string;
  name: string;
  slug: string;
  industry: string | null;
  location: string | null;
  verification_status: string;
  is_verified: boolean;
  created_at: string;
}

const statusTone: Record<string, string> = {
  approved: "green",
  rejected: "red",
  pending: "amber",
};

export default function Companies() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-companies"],
    queryFn: () => api.get<{ companies: AdminCompany[] }>("/admin/companies"),
  });

  const verify = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/admin/companies/${id}/verification`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-companies"] }),
    onError: (err) => alert(err instanceof ApiError ? err.message : "Could not update company"),
  });

  const companies = data?.companies ?? [];

  return (
    <div>
      <PageHeader title="Companies" description="Verify and manage employer profiles." />

      {isLoading ? (
        <Spinner />
      ) : companies.length === 0 ? (
        <EmptyState icon={Building2} title="No companies yet" description="Companies will appear here as recruiters register." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3">Industry</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Verification</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {companies.map((c) => (
                <tr key={c.id} className="align-middle">
                  <td className="px-4 py-3">
                    <Link to={`/companies/${c.slug}`} className="font-medium text-ink hover:text-brand-600">
                      {c.name}
                    </Link>
                    {c.location && (
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                        <MapPin className="h-3 w-3" /> {c.location}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{c.industry || "—"}</td>
                  <td className="px-4 py-3 text-slate-500">{formatDate(c.created_at)}</td>
                  <td className="px-4 py-3">
                    <Badge tone={statusTone[c.verification_status] ?? "slate"} className="capitalize">
                      {c.verification_status || "pending"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => verify.mutate({ id: c.id, status: "approved" })}
                        disabled={verify.isPending}
                        className="btn-primary btn-sm"
                      >
                        Verify
                      </button>
                      <button
                        type="button"
                        onClick={() => verify.mutate({ id: c.id, status: "rejected" })}
                        disabled={verify.isPending}
                        className="btn-outline btn-sm text-red-600"
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        onClick={() => verify.mutate({ id: c.id, status: "pending" })}
                        disabled={verify.isPending}
                        className="btn-ghost btn-sm"
                      >
                        Reset
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
