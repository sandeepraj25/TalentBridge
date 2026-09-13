export type Role = "candidate" | "recruiter" | "admin";

export interface User {
  id: string;
  email: string;
  role: Role;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
}

export interface Company {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  website: string | null;
  description: string | null;
  industry: string | null;
  company_size: string | null;
  location: string | null;
  is_verified: boolean;
  verification_status?: string;
  open_jobs?: number;
  created_at?: string;
}

export interface Job {
  id: string;
  recruiter_id: string;
  company_id: string;
  title: string;
  slug: string;
  description: string;
  responsibilities: string | null;
  requirements: string | null;
  location: string | null;
  job_type: string;
  work_mode: string;
  category?: string | null;
  salary_min: number | null;
  salary_max: number | null;
  experience_min: number | null;
  experience_max: number | null;
  skills: string[];
  openings: number;
  status: string;
  approval_status: string;
  is_featured: boolean;
  is_boosted: boolean;
  views: number;
  created_at: string;
  company?: Company | null;
  application_count?: number;
}

export interface Candidate {
  id: string;
  full_name?: string;
  avatar_url?: string | null;
  headline: string | null;
  about: string | null;
  location: string | null;
  experience_years: number | null;
  current_salary?: number | null;
  expected_salary: number | null;
  notice_period_days?: number | null;
  resume_url: string | null;
  resume_file_path?: string | null;
  skills: string[];
  open_to_work: boolean;
  unlocked?: boolean;
}

export interface Application {
  id: string;
  job_id: string;
  candidate_id: string;
  status: string;
  cover_letter: string | null;
  created_at: string;
  job_title?: string;
  company_name?: string;
  candidate_name?: string;
  candidate_avatar?: string | null;
  candidate_headline?: string | null;
  salary_min?: number | null;
  salary_max?: number | null;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export interface Conversation {
  id: string;
  recruiter_id: string;
  candidate_id: string;
  job_id: string | null;
  last_message_at: string;
  other_name: string | null;
  other_avatar: string | null;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
}

export interface CoinTransaction {
  id: string;
  type: string;
  amount: number;
  balance_after: number;
  reason: string | null;
  created_at: string;
}

export interface Package {
  id: string;
  name: string;
  tier: string;
  price: number;
  coins: number;
  job_posts: number;
  candidate_unlocks: number;
  validity_days: number;
  features: string[];
  is_active: boolean;
  sort_order: number;
}
