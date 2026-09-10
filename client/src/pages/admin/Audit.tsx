import { useQuery } from "@tanstack/react-query";
import { ScrollText } from "lucide-react";
import { api } from "@/lib/api";
import { PageHeader, Spinner, EmptyState } from "@/components/ui";
import { formatDate } from "@/lib/utils";

interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entity_id: string;
  created_at: string;
}

export default function Audit() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-audit"],
    queryFn: () => api.get<{ logs: AuditLog[] }>("/admin/audit"),
  });

  if (isLoading) return <Spinner />;

  const logs = data?.logs ?? [];

  return (
    <div>
      <PageHeader title="Audit log" description="A record of administrative actions." />

      {logs.length === 0 ? (
        <EmptyState icon={ScrollText} title="No activity yet" description="Administrative actions will be recorded here." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Entity</th>
                <th className="px-4 py-3">Entity ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((l) => (
                <tr key={l.id} className="align-middle">
                  <td className="px-4 py-3 text-slate-500">{formatDate(l.created_at, "d MMM, h:mm a")}</td>
                  <td className="px-4 py-3 font-mono text-xs text-ink">{l.action}</td>
                  <td className="px-4 py-3 capitalize text-slate-600">{l.entity || "—"}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-400">{l.entity_id || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
