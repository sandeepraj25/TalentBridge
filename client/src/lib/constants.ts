export const JOB_TYPES = [
  { value: "full_time", label: "Full-time" },
  { value: "part_time", label: "Part-time" },
  { value: "contract", label: "Contract" },
  { value: "internship", label: "Internship" },
  { value: "freelance", label: "Freelance" },
] as const;

export const WORK_MODES = [
  { value: "onsite", label: "On-site" },
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
] as const;

export const EXPERIENCE_BANDS = [
  { value: "0", label: "Fresher" },
  { value: "1", label: "1+ years" },
  { value: "3", label: "3+ years" },
  { value: "5", label: "5+ years" },
  { value: "8", label: "8+ years" },
] as const;

export const JOB_STATUS = ["draft", "active", "paused", "closed"] as const;

export const APPLICATION_STAGES = [
  { value: "applied", label: "Applied", tone: "slate" },
  { value: "shortlisted", label: "Shortlisted", tone: "blue" },
  { value: "interview", label: "Interview", tone: "amber" },
  { value: "offered", label: "Offered", tone: "violet" },
  { value: "hired", label: "Hired", tone: "green" },
  { value: "rejected", label: "Rejected", tone: "red" },
] as const;

export const COIN_ACTIONS = {
  unlock_candidate: { label: "Unlock candidate contact", cost: 5 },
  unlock_resume: { label: "Download resume", cost: 3 },
  boost_job: { label: "Boost a job for 7 days", cost: 25 },
  feature_job: { label: "Feature a job on homepage", cost: 50 },
  direct_message: { label: "Message a candidate", cost: 2 },
} as const;

export const INTERVIEW_MODES = [
  { value: "video", label: "Video call" },
  { value: "phone", label: "Phone" },
  { value: "onsite", label: "In-person" },
] as const;

export const REPORT_STATUS = ["open", "reviewing", "resolved", "dismissed"] as const;

export const COMPANY_SIZES = ["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"] as const;

export const INDUSTRIES = [
  "Information Technology", "Healthcare", "Finance & Banking", "Education", "Manufacturing",
  "Retail & E-commerce", "Real Estate", "Hospitality", "Logistics", "Media & Marketing",
  "Consulting", "Government", "Other",
] as const;

export const JOB_CATEGORIES = [
  { value: "IT & Software", label: "IT & Software" },
  { value: "Sales & Marketing", label: "Sales & Marketing" },
  { value: "Finance & Accounting", label: "Finance & Accounting" },
  { value: "HR & Administration", label: "HR & Administration" },
  { value: "Design & Creative", label: "Design & Creative" },
  { value: "Healthcare", label: "Healthcare" },
  { value: "Other", label: "Other" },
] as const;

export function label(list: readonly { value: string; label: string }[], value: string | null | undefined) {
  return list.find((i) => i.value === value)?.label ?? value ?? "—";
}
