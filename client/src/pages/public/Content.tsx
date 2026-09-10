import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Spinner } from "@/components/ui";

type ContentDoc = { key: string; title: string; body: string } | null;

function capitalize(key: string) {
  return key
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default function Content({ pageKey }: { pageKey: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["content", pageKey],
    queryFn: () => api.get<{ content: ContentDoc }>(`/content/${pageKey}`),
  });

  const content = data?.content ?? null;
  const title = content?.title || capitalize(pageKey);

  return (
    <div className="container-page py-14">
      <div className="mx-auto max-w-3xl">
        <h1 className="font-display text-4xl font-semibold text-ink">{title}</h1>
        {isLoading ? (
          <Spinner />
        ) : content?.body ? (
          <div className="mt-6 whitespace-pre-line text-base leading-relaxed text-slate-600">
            {content.body}
          </div>
        ) : (
          <p className="mt-6 text-slate-500">This page hasn&rsquo;t been published yet. Please check back soon.</p>
        )}
      </div>
    </div>
  );
}
