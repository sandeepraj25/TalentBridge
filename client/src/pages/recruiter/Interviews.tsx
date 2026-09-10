import { useQuery } from "@tanstack/react-query";
import { CalendarClock, Video, ExternalLink } from "lucide-react";
import { api } from "@/lib/api";
import { Badge, EmptyState, Spinner, PageHeader } from "@/components/ui";
import { INTERVIEW_MODES, label } from "@/lib/constants";
import { initials, formatDate } from "@/lib/utils";

interface Interview {
  id: string;
  scheduled_at: string;
  mode: string;
  meeting_link: string | null;
  job_title?: string;
  candidate_name?: string;
}

export default function Interviews() {
  const { data, isLoading } = useQuery({
    queryKey: ["recruiter-interviews"],
    queryFn: () => api.get<{ interviews: Interview[] }>("/recruiter/interviews"),
  });
  const interviews = data?.interviews ?? [];
  const now = Date.now();

  return (
    <div>
      <PageHeader title="Interviews" description="Your scheduled interviews with candidates." />

      {isLoading ? (
        <Spinner />
      ) : interviews.length === 0 ? (
        <EmptyState icon={CalendarClock} title="No interviews scheduled" description="Schedule interviews from the applications page." />
      ) : (
        <div className="space-y-3">
          {interviews.map((iv) => {
            const upcoming = new Date(iv.scheduled_at).getTime() >= now;
            return (
              <div key={iv.id} className="card flex flex-wrap items-center gap-4 p-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
                  {initials(iv.candidate_name)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink">{iv.candidate_name || "Candidate"}</p>
                  <p className="text-xs text-slate-500">{iv.job_title || "—"} · {formatDate(iv.scheduled_at, "d MMM yyyy, h:mm a")}</p>
                </div>
                <Badge tone="blue"><Video className="h-3 w-3" /> {label(INTERVIEW_MODES, iv.mode)}</Badge>
                <Badge tone={upcoming ? "green" : "slate"}>{upcoming ? "Upcoming" : "Past"}</Badge>
                {iv.meeting_link && (
                  <a href={iv.meeting_link} target="_blank" rel="noreferrer" className="btn-outline btn-sm">
                    Join <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
