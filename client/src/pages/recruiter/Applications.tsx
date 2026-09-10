import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FileText, MessageSquare, CalendarPlus, User } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { Badge, EmptyState, Spinner, PageHeader, Field } from "@/components/ui";
import { APPLICATION_STAGES, INTERVIEW_MODES, label } from "@/lib/constants";
import { initials, timeAgo } from "@/lib/utils";

interface Appn {
  id: string;
  job_id: string;
  candidate_id: string;
  status: string;
  cover_letter: string | null;
  created_at: string;
  job_title?: string;
  candidate_name?: string;
  candidate_avatar?: string | null;
  candidate_headline?: string | null;
}

function stageTone(value: string) {
  return APPLICATION_STAGES.find((s) => s.value === value)?.tone ?? "slate";
}

export default function Applications() {
  const [params] = useSearchParams();
  const jobFilter = params.get("job");
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["recruiter-applications", jobFilter],
    queryFn: () => api.get<{ applications: Appn[] }>(`/recruiter/applications${jobFilter ? `?job=${jobFilter}` : ""}`),
  });
  const applications = data?.applications ?? [];

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => api.patch(`/recruiter/applications/${id}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["recruiter-applications"] }),
    onError: (err) => alert(err instanceof ApiError ? err.message : "Could not update status."),
  });

  const message = useMutation({
    mutationFn: (a: Appn) => api.post<{ id: string }>("/messages/conversations", { candidate_id: a.candidate_id, job_id: a.job_id }),
    onSuccess: ({ id }) => navigate(`/dashboard/recruiter/messages?c=${id}`),
    onError: (err) => alert(err instanceof ApiError ? err.message : "Could not start conversation."),
  });

  return (
    <div>
      <PageHeader
        title="Applications"
        description="Review candidates who applied to your jobs."
        action={jobFilter ? <Link to="/dashboard/recruiter/applications" className="btn-outline btn-sm">All jobs</Link> : undefined}
      />

      {isLoading ? (
        <Spinner />
      ) : applications.length === 0 ? (
        <EmptyState icon={FileText} title="No applications yet" description="When candidates apply to your jobs, they'll appear here." />
      ) : (
        <div className="space-y-4">
          {applications.map((a) => (
            <ApplicationCard
              key={a.id}
              app={a}
              onStatus={(status) => updateStatus.mutate({ id: a.id, status })}
              onMessage={() => message.mutate(a)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ApplicationCard({ app, onStatus, onMessage }: { app: Appn; onStatus: (status: string) => void; onMessage: () => void }) {
  const qc = useQueryClient();
  const [stage, setStage] = useState(app.status);
  const blank = { scheduled_at: "", mode: "video", meeting_link: "", location: "", notes: "" };
  const [iv, setIv] = useState(blank);

  const schedule = useMutation({
    mutationFn: () => api.post("/recruiter/interviews", { application_id: app.id, ...iv }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["recruiter-interviews"] });
      setIv(blank);
      alert("Interview scheduled.");
    },
    onError: (err) => alert(err instanceof ApiError ? err.message : "Could not schedule interview."),
  });

  return (
    <div className="card p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
          {initials(app.candidate_name)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link to={`/dashboard/recruiter/candidates/${app.candidate_id}`} className="text-base font-semibold text-ink hover:text-brand-600">
              {app.candidate_name || "Candidate"}
            </Link>
            <Badge tone={stageTone(app.status)}>{label(APPLICATION_STAGES, app.status)}</Badge>
          </div>
          {app.candidate_headline && <p className="text-sm text-slate-500">{app.candidate_headline}</p>}
          <p className="mt-0.5 text-xs text-slate-400">Applied to {app.job_title || "a role"} · {timeAgo(app.created_at)}</p>
        </div>
      </div>

      {app.cover_letter && (
        <div className="mt-3 whitespace-pre-line rounded-lg bg-slate-50 p-3 text-sm text-slate-600">{app.cover_letter}</div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
        <select className="input w-auto py-1.5 text-xs" value={stage} onChange={(e) => setStage(e.target.value)} aria-label="Application stage">
          {APPLICATION_STAGES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <button className="btn-outline btn-sm" onClick={() => onStatus(stage)}>Update</button>
        <Link to={`/dashboard/recruiter/candidates/${app.candidate_id}`} className="btn-ghost btn-sm"><User className="h-3.5 w-3.5" /> Profile</Link>
        <button className="btn-ghost btn-sm" onClick={onMessage}><MessageSquare className="h-3.5 w-3.5" /> Message</button>
        <details className="relative ml-auto">
          <summary className="btn-ghost btn-sm cursor-pointer list-none"><CalendarPlus className="h-3.5 w-3.5" /> Interview</summary>
          <div className="absolute right-0 z-20 mt-2 w-72 rounded-xl border border-slate-200 bg-white p-4 shadow-lift">
            <div className="space-y-3">
              <Field label="Date & time">
                <input type="datetime-local" className="input" value={iv.scheduled_at} onChange={(e) => setIv({ ...iv, scheduled_at: e.target.value })} />
              </Field>
              <Field label="Mode">
                <select className="input" value={iv.mode} onChange={(e) => setIv({ ...iv, mode: e.target.value })}>
                  {INTERVIEW_MODES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </Field>
              <Field label="Meeting link">
                <input className="input" value={iv.meeting_link} onChange={(e) => setIv({ ...iv, meeting_link: e.target.value })} placeholder="https://…" />
              </Field>
              <Field label="Location">
                <input className="input" value={iv.location} onChange={(e) => setIv({ ...iv, location: e.target.value })} placeholder="Office / address" />
              </Field>
              <button className="btn-primary btn-sm w-full" disabled={!iv.scheduled_at || schedule.isPending} onClick={() => schedule.mutate()}>
                Schedule interview
              </button>
            </div>
          </div>
        </details>
      </div>
    </div>
  );
}
