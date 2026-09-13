import { useState, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MapPin, Mail, Phone, FileText, Lock, MessageSquare, ArrowLeft, Download } from "lucide-react";
import { api, ApiError, tokenStore } from "@/lib/api";
import { Badge, Spinner, Field } from "@/components/ui";
import { COIN_ACTIONS } from "@/lib/constants";
import { initials, formatINR, formatDate } from "@/lib/utils";

interface Detail {
  candidate: {
    id: string;
    full_name?: string;
    avatar_url?: string | null;
    headline: string | null;
    about: string | null;
    location: string | null;
    experience_years: number | null;
    expected_salary: number | null;
    skills: string[];
    resume_url: string | null;
    resume_file_path?: string | null;
  };
  educations: any[];
  experiences: any[];
  projects: any[];
  unlocked: boolean;
  contact: { email: string; phone: string } | null;
  note: { note: string; tags: string[] } | null;
}

export default function CandidateDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [unlockErr, setUnlockErr] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["recruiter-candidate", id],
    queryFn: () => api.get<Detail>(`/recruiter/candidates/${id}`),
    enabled: !!id,
  });

  const unlock = useMutation({
    mutationFn: () => api.post(`/recruiter/candidates/${id}/unlock`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["recruiter-candidate", id] }),
    onError: (err) => {
      if (err instanceof ApiError && (err.status === 402 || err.code === "INSUFFICIENT_COINS")) {
        setUnlockErr(true);
      } else {
        alert(err instanceof ApiError ? err.message : "Could not unlock contact.");
      }
    },
  });

  const message = useMutation({
    mutationFn: () => api.post<{ id: string }>("/messages/conversations", { candidate_id: id }),
    onSuccess: ({ id: cid }) => navigate(`/dashboard/recruiter/messages?c=${cid}`),
    onError: (err) => alert(err instanceof ApiError ? err.message : "Could not start conversation."),
  });

  if (isLoading) return <Spinner />;
  if (!data?.candidate) return <div className="card p-8 text-center text-sm text-slate-500">Candidate not found.</div>;

  const c = data.candidate;

  return (
    <div>
      <Link to="/dashboard/recruiter/candidates" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-brand-600">
        <ArrowLeft className="h-4 w-4" /> Back to search
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="card p-6">
            <div className="flex items-start gap-4">
              <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-brand-100 text-lg font-semibold text-brand-700">
                {c.avatar_url ? <img src={c.avatar_url} alt={c.full_name ?? ""} className="h-full w-full object-cover" /> : initials(c.full_name)}
              </span>
              <div className="min-w-0">
                <h1 className="text-xl font-bold text-ink">{c.full_name || "Candidate"}</h1>
                {c.headline && <p className="text-sm text-slate-500">{c.headline}</p>}
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                  {c.location && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {c.location}</span>}
                  {c.experience_years != null && <span>{c.experience_years} yrs experience</span>}
                  {c.expected_salary != null && <span className="font-medium text-ink-soft">Expects {formatINR(c.expected_salary, { compact: true })}</span>}
                </div>
              </div>
            </div>
            {c.about && <p className="mt-4 whitespace-pre-line text-sm text-slate-600">{c.about}</p>}
            {c.skills?.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {c.skills.map((s) => <span key={s} className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{s}</span>)}
              </div>
            )}
          </div>

          <Section title="Experience" items={data.experiences} render={(e) => (
            <>
              <p className="text-sm font-semibold text-ink">{e.title || e.role || "Role"}{e.company ? ` · ${e.company}` : ""}</p>
              <p className="text-xs text-slate-400">
                {[e.start_date && formatDate(e.start_date), e.end_date ? formatDate(e.end_date) : (e.is_current ? "Present" : "")].filter(Boolean).join(" – ")}
              </p>
              {e.description && <p className="mt-1 whitespace-pre-line text-sm text-slate-600">{e.description}</p>}
            </>
          )} />

          <Section title="Education" items={data.educations} render={(ed) => (
            <>
              <p className="text-sm font-semibold text-ink">{ed.degree || ed.qualification || "Qualification"}{ed.institution ? ` · ${ed.institution}` : ""}</p>
              <p className="text-xs text-slate-400">{[ed.start_year, ed.end_year].filter(Boolean).join(" – ")}</p>
            </>
          )} />

          <Section title="Projects" items={data.projects} render={(p) => (
            <>
              <p className="text-sm font-semibold text-ink">{p.title || p.name || "Project"}</p>
              {p.description && <p className="mt-1 whitespace-pre-line text-sm text-slate-600">{p.description}</p>}
              {p.url && <a href={p.url} target="_blank" rel="noreferrer" className="link text-xs">View project</a>}
            </>
          )} />
        </div>

        <div className="space-y-6">
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-ink">Contact</h3>
            {data.unlocked && data.contact ? (
              <div className="mt-3 space-y-2 text-sm">
                <a href={`mailto:${data.contact.email}`} className="flex items-center gap-2 text-slate-600 hover:text-brand-600">
                  <Mail className="h-4 w-4 text-slate-400" /> {data.contact.email}
                </a>
                {data.contact.phone && (
                  <a href={`tel:${data.contact.phone}`} className="flex items-center gap-2 text-slate-600 hover:text-brand-600">
                    <Phone className="h-4 w-4 text-slate-400" /> {data.contact.phone}
                  </a>
                )}
                {c.resume_file_path && (
                  <button
                    type="button"
                    className="flex items-center gap-2 text-slate-600 hover:text-brand-600"
                    onClick={async () => {
                      try {
                        const API_BASE = import.meta.env.VITE_API_URL || "/api";
                        const res = await fetch(`${API_BASE}/recruiter/candidates/${c.id}/resume`, {
                          headers: { Authorization: `Bearer ${tokenStore.get()}` },
                        });
                        if (!res.ok) throw new Error("Download failed");
                        const blob = await res.blob();
                        const cd = res.headers.get("content-disposition") || "";
                        const match = cd.match(/filename="?(.+?)"?$/);
                        const filename = match?.[1] || "resume.pdf";
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url; a.download = filename; a.click();
                        URL.revokeObjectURL(url);
                      } catch { alert("Could not download resume."); }
                    }}
                  >
                    <Download className="h-4 w-4 text-slate-400" /> Download résumé
                  </button>
                )}
                {c.resume_url && (
                  <a href={c.resume_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-slate-600 hover:text-brand-600">
                    <FileText className="h-4 w-4 text-slate-400" /> View résumé link
                  </a>
                )}
                <Badge tone="green" className="mt-1">Unlocked</Badge>
              </div>
            ) : (
              <div className="mt-3">
                <p className="flex items-center gap-2 text-sm text-slate-500"><Lock className="h-4 w-4" /> Contact details are locked.</p>
                <button
                  className="btn-primary btn-sm mt-3 w-full"
                  disabled={unlock.isPending}
                  onClick={() => { setUnlockErr(false); unlock.mutate(); }}
                >
                  Unlock ({COIN_ACTIONS.unlock_candidate.cost} coins)
                </button>
                {unlockErr && (
                  <p className="mt-2 text-xs text-red-600">Not enough coins. <Link to="/dashboard/recruiter/coins?need=1" className="link">Buy coins</Link>.</p>
                )}
              </div>
            )}
            <button className="btn-outline btn-sm mt-3 w-full" disabled={message.isPending} onClick={() => message.mutate()}>
              <MessageSquare className="h-3.5 w-3.5" /> Message
            </button>
          </div>

          <NotesCard candidateId={id!} note={data.note} />
        </div>
      </div>
    </div>
  );
}

function Section({ title, items, render }: { title: string; items: any[]; render: (item: any) => ReactNode }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="card p-6">
      <h2 className="mb-3 text-base font-semibold text-ink">{title}</h2>
      <div className="space-y-4">
        {items.map((item, i) => <div key={item?.id ?? i} className="border-l-2 border-slate-100 pl-3">{render(item)}</div>)}
      </div>
    </div>
  );
}

function NotesCard({ candidateId, note }: { candidateId: string; note: { note: string; tags: string[] } | null }) {
  const qc = useQueryClient();
  const [text, setText] = useState(note?.note ?? "");
  const [tags, setTags] = useState((note?.tags ?? []).join(", "));
  const [saved, setSaved] = useState(false);

  const save = useMutation({
    mutationFn: () => api.post(`/recruiter/candidates/${candidateId}/note`, { note: text, tags }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["recruiter-candidate", candidateId] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    },
    onError: (err) => alert(err instanceof ApiError ? err.message : "Could not save note."),
  });

  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold text-ink">Private notes</h3>
      <p className="mt-0.5 text-xs text-slate-400">Only visible to you.</p>
      <Field className="mt-3" label="Note">
        <textarea className="input min-h-[90px]" value={text} onChange={(e) => setText(e.target.value)} placeholder="Add a note about this candidate…" />
      </Field>
      <Field label="Tags" hint="Comma-separated">
        <input className="input" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="e.g. strong, follow-up" />
      </Field>
      <button className="btn-primary btn-sm mt-3 w-full" disabled={save.isPending} onClick={() => save.mutate()}>Save note</button>
      {saved && <p className="mt-2 text-xs text-emerald-600">Saved.</p>}
    </div>
  );
}
