import { useQuery } from "@tanstack/react-query";
import { Video, Phone, MapPin, CalendarClock, ExternalLink, type LucideIcon } from "lucide-react";
import { api } from "@/lib/api";
import { PageHeader, Spinner, Badge, EmptyState } from "@/components/ui";
import { formatDate } from "@/lib/utils";
import { label, INTERVIEW_MODES } from "@/lib/constants";

interface Interview {
  id: string;
  scheduled_at: string;
  mode: string;
  meeting_link: string | null;
  status: string;
  job_title?: string;
  company_name?: string;
}

const MODE_ICON: Record<string, LucideIcon> = {
  video: Video,
  phone: Phone,
  onsite: MapPin,
};

export default function Interviews() {
  const { data, isLoading } = useQuery({
    queryKey: ["candidate-interviews"],
    queryFn: () => api.get<{ interviews: Interview[] }>("/candidate/interviews"),
  });

  if (isLoading) return <Spinner />;

  const interviews = data?.interviews ?? [];

  return (
    <div>
      <PageHeader title="Interviews" description="Your scheduled interviews with recruiters." />

      {interviews.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title="No interviews scheduled"
          description="When a recruiter schedules an interview, it will show up here."
        />
      ) : (
        <div className="space-y-3">
          {interviews.map((iv) => {
            const Icon = MODE_ICON[iv.mode] ?? CalendarClock;
            const upcoming = new Date(iv.scheduled_at).getTime() >= Date.now();
            return (
              <div key={iv.id} className="card flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-semibold text-ink">{iv.job_title || "Interview"}</h3>
                    <p className="truncate text-sm text-slate-500">{iv.company_name || "Company"}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {label(INTERVIEW_MODES, iv.mode)}
                      <span className="mx-1.5 text-slate-300">•</span>
                      {formatDate(iv.scheduled_at, "EEE d MMM, h:mm a")}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2 self-start sm:self-center">
                  <Badge tone={upcoming ? "green" : "slate"}>{upcoming ? "Upcoming" : "Past"}</Badge>
                  {iv.meeting_link && (
                    <a href={iv.meeting_link} target="_blank" rel="noreferrer" className="btn-outline btn-sm">
                      Join <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
