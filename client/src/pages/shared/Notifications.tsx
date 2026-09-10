import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Check, CheckCheck } from "lucide-react";
import { api } from "@/lib/api";
import { Spinner, EmptyState, PageHeader } from "@/components/ui";
import { cn, timeAgo } from "@/lib/utils";

interface Notif {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export default function Notifications({ role: _role }: { role: string }) {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => api.get<{ notifications: Notif[] }>("/notifications"),
  });
  const notifications = data?.notifications ?? [];
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  function invalidate() {
    qc.invalidateQueries({ queryKey: ["notifications"] });
    qc.invalidateQueries({ queryKey: ["unread"] });
  }

  const markOne = useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`),
    onSuccess: invalidate,
  });
  const markAll = useMutation({
    mutationFn: () => api.post("/notifications/read-all"),
    onSuccess: invalidate,
  });

  return (
    <div>
      <PageHeader
        title="Notifications"
        description="Stay on top of applications, messages, and account updates."
        action={
          unreadCount > 0 ? (
            <button
              onClick={() => markAll.mutate()}
              disabled={markAll.isPending}
              className="btn-outline btn-sm"
            >
              <CheckCheck className="h-4 w-4" /> Mark all read
            </button>
          ) : undefined
        }
      />

      {isLoading ? (
        <Spinner />
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="You're all caught up"
          description="New notifications will appear here."
        />
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const inner = (
              <div
                className={cn(
                  "card flex items-start gap-3 p-4 transition",
                  !n.is_read ? "bg-brand-50 ring-1 ring-brand-100" : "hover:bg-slate-50"
                )}
              >
                <span className="mt-1.5 flex h-2 w-2 shrink-0 items-center justify-center">
                  {!n.is_read && <span className="h-2 w-2 rounded-full bg-brand-600" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className={cn("text-sm", n.is_read ? "font-medium text-ink" : "font-semibold text-ink")}>
                    {n.title}
                  </p>
                  {n.body && <p className="mt-0.5 text-sm text-slate-500">{n.body}</p>}
                  <p className="mt-1 text-xs text-slate-400">{timeAgo(n.created_at)}</p>
                </div>
                {!n.is_read && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      markOne.mutate(n.id);
                    }}
                    disabled={markOne.isPending}
                    className="btn-ghost btn-sm shrink-0 text-slate-500"
                    title="Mark as read"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                )}
              </div>
            );

            return n.link ? (
              <Link key={n.id} to={n.link} className="block">{inner}</Link>
            ) : (
              <div key={n.id}>{inner}</div>
            );
          })}
        </div>
      )}
    </div>
  );
}
