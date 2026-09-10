import { useState, useRef, useEffect, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Send, MessagesSquare } from "lucide-react";
import { api } from "@/lib/api";
import { Spinner, EmptyState, PageHeader } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { cn, initials, timeAgo, formatDate } from "@/lib/utils";

interface Conversation {
  id: string;
  other_name: string | null;
  other_avatar: string | null;
  last_message_at: string;
  recruiter_id: string;
  candidate_id: string;
}
interface Msg {
  id: string;
  sender_id: string;
  body: string;
  created_at: string;
}

export default function Messages({ role: _role }: { role: "candidate" | "recruiter" }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const { data: convData, isLoading: convLoading } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => api.get<{ conversations: Conversation[] }>("/messages/conversations"),
  });
  const conversations = convData?.conversations ?? [];

  const selectedId = searchParams.get("c") || conversations[0]?.id || "";

  function selectConversation(id: string) {
    const next = new URLSearchParams(searchParams);
    next.set("c", id);
    setSearchParams(next, { replace: true });
  }

  const { data: msgData, isLoading: msgLoading } = useQuery({
    queryKey: ["messages", selectedId],
    queryFn: () => api.get<{ messages: Msg[] }>(`/messages/conversations/${selectedId}/messages`),
    enabled: !!selectedId,
  });
  const messages = msgData?.messages ?? [];

  const [body, setBody] = useState("");
  const sendMutation = useMutation({
    mutationFn: (text: string) =>
      api.post(`/messages/conversations/${selectedId}/messages`, { body: text }),
    onSuccess: () => {
      setBody("");
      qc.invalidateQueries({ queryKey: ["messages", selectedId] });
      qc.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  function onSend(e: FormEvent) {
    e.preventDefault();
    const text = body.trim();
    if (!text || !selectedId) return;
    sendMutation.mutate(text);
  }

  // Auto-scroll to latest message.
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages.length, selectedId]);

  const activeConv = conversations.find((c) => c.id === selectedId);

  return (
    <div>
      <PageHeader title="Messages" description="Chat with candidates and recruiters." />

      {convLoading ? (
        <Spinner />
      ) : conversations.length === 0 ? (
        <EmptyState
          icon={MessagesSquare}
          title="No conversations yet"
          description="When you connect with someone, your chats will show up here."
        />
      ) : (
        <div className="grid h-[calc(100vh-16rem)] min-h-[28rem] grid-cols-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card sm:grid-cols-[18rem_1fr]">
          {/* Conversation list */}
          <div className="hidden flex-col border-r border-slate-200 sm:flex">
            <div className="border-b border-slate-100 px-4 py-3 text-sm font-semibold text-ink">
              Conversations
            </div>
            <div className="flex-1 overflow-y-auto">
              {conversations.map((c) => (
                <button
                  key={c.id}
                  onClick={() => selectConversation(c.id)}
                  className={cn(
                    "flex w-full items-center gap-3 border-b border-slate-50 px-4 py-3 text-left transition hover:bg-slate-50",
                    c.id === selectedId && "bg-brand-50 hover:bg-brand-50"
                  )}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
                    {c.other_avatar ? (
                      <img src={c.other_avatar} alt={c.other_name ?? ""} className="h-full w-full object-cover" />
                    ) : (
                      initials(c.other_name)
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-ink">{c.other_name ?? "Unknown"}</span>
                    <span className="block truncate text-xs text-slate-400">{timeAgo(c.last_message_at)}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Mobile conversation selector */}
          <div className="border-b border-slate-200 p-3 sm:hidden">
            <select
              value={selectedId}
              onChange={(e) => selectConversation(e.target.value)}
              className="input"
            >
              {conversations.map((c) => (
                <option key={c.id} value={c.id}>{c.other_name ?? "Unknown"}</option>
              ))}
            </select>
          </div>

          {/* Message pane */}
          <div className="flex min-w-0 flex-col">
            {activeConv && (
              <div className="hidden items-center gap-3 border-b border-slate-100 px-5 py-3 sm:flex">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
                  {activeConv.other_avatar ? (
                    <img src={activeConv.other_avatar} alt={activeConv.other_name ?? ""} className="h-full w-full object-cover" />
                  ) : (
                    initials(activeConv.other_name)
                  )}
                </span>
                <p className="text-sm font-semibold text-ink">{activeConv.other_name ?? "Unknown"}</p>
              </div>
            )}

            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-slate-50/50 px-5 py-4">
              {msgLoading ? (
                <Spinner />
              ) : messages.length === 0 ? (
                <p className="py-10 text-center text-sm text-slate-400">No messages yet. Say hello!</p>
              ) : (
                messages.map((m) => {
                  const mine = m.sender_id === user?.id;
                  return (
                    <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                      <div
                        className={cn(
                          "max-w-[75%] rounded-2xl px-4 py-2 text-sm shadow-sm",
                          mine
                            ? "rounded-br-sm bg-brand-600 text-white"
                            : "rounded-bl-sm bg-white text-ink ring-1 ring-slate-200"
                        )}
                      >
                        <p className="whitespace-pre-line break-words">{m.body}</p>
                        <p className={cn("mt-1 text-[10px]", mine ? "text-brand-100" : "text-slate-400")}>
                          {formatDate(m.created_at, "d MMM, h:mm a")}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <form onSubmit={onSend} className="flex items-center gap-2 border-t border-slate-100 p-3">
              <input
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Type a message…"
                className="input"
                disabled={!selectedId}
              />
              <button
                type="submit"
                disabled={sendMutation.isPending || !body.trim() || !selectedId}
                className="btn-primary shrink-0"
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
