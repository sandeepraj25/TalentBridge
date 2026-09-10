import { useState, type FormEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FileText } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { PageHeader, Spinner, EmptyState, Field } from "@/components/ui";
import { timeAgo } from "@/lib/utils";

interface Content {
  key: string;
  title: string | null;
  body: string | null;
  updated_at: string | null;
}

export default function Cms() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-cms"],
    queryFn: () => api.get<{ content: Content[] }>("/admin/cms"),
  });

  if (isLoading) return <Spinner />;

  const content = data?.content ?? [];

  return (
    <div>
      <PageHeader title="Content" description="Edit the copy that appears across the site." />

      {content.length === 0 ? (
        <EmptyState icon={FileText} title="No content blocks" description="Managed content pages will appear here." />
      ) : (
        <div className="space-y-3">
          {content.map((c) => (
            <details key={c.key} className="card p-5">
              <summary className="flex cursor-pointer items-center justify-between gap-3">
                <span className="font-semibold text-ink">{c.title || c.key}</span>
                <span className="text-xs text-slate-400">
                  {c.updated_at ? `updated ${timeAgo(c.updated_at)}` : "not yet published"}
                </span>
              </summary>
              <div className="mt-4 border-t border-slate-100 pt-4">
                <CmsForm block={c} />
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}

function CmsForm({ block }: { block: Content }) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState(block.title ?? "");
  const [body, setBody] = useState(block.body ?? "");
  const [saved, setSaved] = useState(false);

  const save = useMutation({
    mutationFn: () => api.put(`/admin/cms/${block.key}`, { title, body }),
    onSuccess: () => {
      setSaved(true);
      queryClient.invalidateQueries({ queryKey: ["admin-cms"] });
      setTimeout(() => setSaved(false), 2500);
    },
    onError: (err) => alert(err instanceof ApiError ? err.message : "Could not save content"),
  });

  function submit(e: FormEvent) {
    e.preventDefault();
    save.mutate();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Title">
        <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
      </Field>
      <Field label="Body">
        <textarea className="input min-h-[160px]" value={body} onChange={(e) => setBody(e.target.value)} />
      </Field>
      <div className="flex items-center gap-3">
        <button type="submit" disabled={save.isPending} className="btn-primary btn-sm">
          {save.isPending ? "Saving…" : "Save"}
        </button>
        {saved && <span className="text-sm font-medium text-emerald-600">Saved</span>}
      </div>
    </form>
  );
}
