import jobWoman from "./images/job-woman.png";
import tcsLogo from "./images/tcs.webp";
import infosysLogo from "./images/Infosys.webp";
import accentureLogo from "./images/Accenture.png";
import wiproLogo from "./images/Wipro.webp";
import hcltechLogo from "./images/HCLTech.webp";
import cognizantLogo from "./images/Cognizant.webp";
import techMahindraLogo from "./images/tech-mahindra.webp";
import deloitteLogo from "./images/Deloitte.png";
import capgeminiLogo from "./images/capgemini.png";
import ibmLogo from "./images/IBM.webp";
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import hiringBanner from "./images/hiring-banner.png";

import {
  Search,
  MapPin,
  Zap,
  Coins,
  GitBranch,
  ArrowRight,
  Check,
  Briefcase,
  Building2,
  Users,
  Monitor,
  Megaphone,
  Palette,
  HeartPulse,
  ShieldCheck,
  MoreHorizontal,
} from "lucide-react";
import { api } from "@/lib/api";
import { JobCard } from "@/components/JobCard";
import { Spinner } from "@/components/ui";
import { INDUSTRIES, JOB_CATEGORIES } from "@/lib/constants";
import type { Job } from "@/lib/types";

const CATEGORY_ICONS = {
  "IT & Software": Monitor,
  "Sales & Marketing": Megaphone,
  "Finance & Accounting": Coins,
  "HR & Administration": Users,
  "Design & Creative": Palette,
  Healthcare: HeartPulse,
  Other: MoreHorizontal,
} as const;

export default function Home() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [location, setLocation] = useState("");

  const { data: statsData } = useQuery({
    queryKey: ["stats"],
    queryFn: () =>
      api.get<{ jobs: number; companies: number; candidates: number }>(
        "/stats"
      ),
  });
  const stats = statsData ?? { jobs: 0, companies: 0, candidates: 0 };

  const { data: jobsData, isLoading } = useQuery({
    queryKey: ["jobs", { limit: 6, home: true }],
    queryFn: () => api.get<{ jobs: Job[] }>("/jobs?limit=6"),
  });
  const jobs = jobsData?.jobs ?? [];

  const { data: categoriesData } = useQuery({
    queryKey: ["job-categories"],
    queryFn: () => api.get<{ categories: { name: string; count: number }[] }>("/jobs/categories"),
  });
  const categoryCounts = Object.fromEntries(
    (categoriesData?.categories ?? []).map((c) => [c.name, c.count])
  );

  function onSearch(e: FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (location.trim()) params.set("location", location.trim());
    navigate("/jobs" + (params.toString() ? `?${params}` : ""));
  }

  const features = [
    {
      icon: Zap,
      title: "One-click apply",
      body: "Build your profile once and apply to any role instantly — no repeated forms.",
    },
    {
      icon: Coins,
      title: "Coin-powered hiring",
      body: "Recruiters spend coins to unlock candidates and boost jobs. Pay only for what you use.",
    },
    {
      icon: GitBranch,
      title: "A real pipeline",
      body: "Track every application from applied to hired with a clean, visual hiring pipeline.",
    },
  ];

  const statItems = [
    { label: "Open jobs", value: stats.jobs, icon: Briefcase },
    { label: "Companies hiring", value: stats.companies, icon: Building2 },
    { label: "Candidates", value: stats.candidates, icon: Users },
  ];
  const topHiringCompanies = [
    {
      name: "TCS",
      jobs: 124,
      logo: tcsLogo,
    },
    {
      name: "Infosys",
      jobs: 98,
      logo: infosysLogo,
    },
    {
      name: "Accenture",
      jobs: 76,
      logo: accentureLogo,
    },
    {
      name: "Wipro",
      jobs: 64,
      logo: wiproLogo,
    },
    {
      name: "HCLTech",
      jobs: 52,
      logo: hcltechLogo,
    },
    {
      name: "Deloitte",
      jobs: 48,
      logo: deloitteLogo,
    },
    {
      name: "Cognizant",
      jobs: 38,
      logo: cognizantLogo,
    },
    {
      name: "Tech Mahindra",
      jobs: 41,
      logo: techMahindraLogo,
    },
    {
      name: "Capgemini",
      jobs: 35,
      logo: capgeminiLogo,
    },
    {
      name: "IBM",
      jobs: 32,
      logo: ibmLogo,
    },
  ];
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-50 via-white to-blue-50">
        {/* Background decoration */}
        <div className="pointer-events-none absolute -right-40 -top-32 h-[500px] w-[500px] rounded-full bg-brand-100/60 blur-3xl" />
        <div className="pointer-events-none absolute -left-40 top-40 h-[350px] w-[350px] rounded-full bg-blue-100/50 blur-3xl" />

        <div className="container-page relative">
          <div className="grid min-h-[620px] items-center gap-8 py-12 sm:py-16 lg:grid-cols-[1.05fr_0.95fr] lg:py-14">
            {/* Left Content */}
            <div className="relative z-10 max-w-2xl">
              <span className="inline-flex items-center rounded-full border border-brand-100 bg-white px-4 py-1.5 text-xs font-medium text-brand-700 shadow-sm">
                <span className="mr-2 h-1.5 w-1.5 rounded-full bg-brand-500" />
                YOUR NEXT OPPORTUNITY AWAITS
              </span>

              <h1 className="hero-title mt-5 text-5xl text-ink sm:text-6xl lg:text-[62px]">
                Find a Job That
                <br />
                Fits <span className="text-brand-600">Your Future</span>
              </h1>

              <p className="mt-6 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
                Discover thousands of job opportunities from top companies
                across India. Start your journey towards a brighter career
                today.
              </p>

              {/* Search */}
              <form
                onSubmit={onSearch}
                className="mt-8 flex max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-lg shadow-slate-200/60 sm:flex-row"
              >
                {/* Job Search */}
                <div className="relative flex-[1.3]">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Job title, skills or company"
                    className="h-12 w-full border-0 bg-transparent pl-11 pr-4 text-sm text-ink outline-none ring-0 placeholder:text-slate-400 focus:border-0 focus:outline-none focus:ring-0"
                    aria-label="Search jobs"
                  />
                </div>

                {/* Location */}
                <div className="relative flex-1 border-t border-slate-100 sm:border-l sm:border-t-0">
                  <MapPin className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                  <input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Location"
                    className="h-12 w-full border-0 bg-transparent pl-11 pr-4 text-sm text-ink outline-none ring-0 placeholder:text-slate-400 focus:border-0 focus:outline-none focus:ring-0"
                    aria-label="Location"
                  />
                </div>

                {/* Search Button */}
                <button
                  type="submit"
                  className="btn-primary mt-2 h-12 shrink-0 justify-center rounded-xl px-7 sm:mt-0"
                >
                  <Search className="h-4 w-4" />
                  Search Jobs
                </button>
              </form>

              {/* Popular Searches */}
              <div className="mt-5 flex flex-wrap items-center gap-2">
                <span className="mr-1 text-xs font-medium text-slate-500">
                  Popular Searches:
                </span>

                {[
                  "Software Engineer",
                  "Data Analyst",
                  "Full Stack Developer",
                  "Remote",
                  "Internship",
                ].map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setQ(item)}
                    className="rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            {/* Right Image */}
            <div className="relative hidden min-h-[520px] items-end justify-center lg:flex">
              {/* Soft background shape */}
              <div className="absolute bottom-5 right-0 h-[420px] w-[500px] rounded-[45%] bg-brand-100/70" />

              {/* Circular decorations */}
              <div className="absolute right-4 top-16 h-72 w-72 rounded-full border border-brand-200/60" />
              <div className="absolute right-16 top-28 h-56 w-56 rounded-full border border-dashed border-brand-300/50" />

              {/* Professional Woman */}
              <img
                src={jobWoman}
                alt="Professional woman looking for a job"
                className="relative z-10 h-[500px] w-auto object-contain object-bottom drop-shadow-xl"
              />

              {/* Trusted Card */}
              <div className="absolute -left-12 top-52 z-20 flex items-center gap-3 rounded-2xl border border-white bg-white/95 px-4 py-3 shadow-lg backdrop-blur">                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <Users className="h-5 w-5" />
              </div>

                <div>
                  <p className="text-xs font-semibold text-ink">
                    Trusted by
                  </p>
                  <p className="text-sm font-bold text-ink">
                    10,000+ job seekers
                  </p>
                  <p className="text-[11px] text-slate-500">
                    every month
                  </p>
                </div>
              </div>

              {/* Career Message */}
              <div className="absolute right-[4%] top-[10%] z-20 rotate-[-12deg] text-left">
                <p
                  className="text-[22px] md:text-[26px] font-semibold leading-[1.1] text-slate-700 tracking-wide"
                  style={{ fontFamily: "'Caveat', cursive" }}
                >
                  Better
                  <br />
                  <span className="pl-2">Careers</span>
                  <br />
                  <span className="pl-1">Brighter</span>
                  <br />
                  <span className="pl-3">Tomorrows</span>
                </p>

                {/* Underline Decorative Lines */}
                <div className="mt-1 flex flex-col items-end pr-2 gap-[2px]">
                  <div className="h-[2px] w-8 rotate-[-5deg] rounded-full bg-slate-400 opacity-70" />
                  <div className="h-[2px] w-6 rotate-[-8deg] rounded-full bg-slate-400 opacity-50 mr-1" />
                </div>
              </div>
            </div>

            {/* Mobile Image */}
            <div className="relative flex justify-center lg:hidden">
              <div className="absolute bottom-0 h-72 w-72 rounded-full bg-brand-100/70" />

              <img
                src={jobWoman}
                alt="Professional woman looking for a job"
                className="relative z-10 h-[360px] w-auto object-contain"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Platform Stats */}
      <section className="bg-white py-6 sm:py-8">
        <div className="container-page">
          <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm md:grid-cols-4">

            <div className="flex items-center gap-3 border-b border-r border-slate-200 p-4 md:border-b-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                <Briefcase className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xl font-bold text-ink">500+</p>
                <p className="text-xs text-slate-500 sm:text-sm">
                  Active Job Listings
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 border-b border-slate-200 p-4 md:border-b-0 md:border-r">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xl font-bold text-ink">1,000+</p>
                <p className="text-xs text-slate-500 sm:text-sm">
                  Top Companies
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 border-r border-slate-200 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xl font-bold text-ink">100K +</p>
                <p className="text-xs text-slate-500 sm:text-sm">
                  Job Seekers
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xl font-bold text-ink">100%</p>
                <p className="text-xs text-slate-500 sm:text-sm">
                  Safe & Secure
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>
      {/* Our Top Hiring Companies */}
      <section className="bg-slate-50 py-12">
        <div className="container-page">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Our Top Hiring Companies</h2>
            </div>

            <Link
              to="/companies"
              className="hidden items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700 sm:flex"
            >
              View All Companies
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="company-marquee-wrapper">
            <div className="company-marquee">
              {[...topHiringCompanies, ...topHiringCompanies].map(
                (company, index) => (
                  <div
                    key={`${company.name}-${index}`}
                    className="company-marquee-item"
                  >
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white p-1.5">                      <img
                      src={company.logo}
                      alt={`${company.name} logo`}
                      className="h-full w-full object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate font-semibold text-ink">
                        {company.name}
                      </p>

                      <p className="text-xs text-slate-500">
                        {company.jobs} active jobs
                      </p>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>

          <div className="mt-5 text-center sm:hidden">
            <Link
              to="/companies"
              className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600"
            >
              View All Companies
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
      {/* Explore jobs by category */}
      <section className="container-page py-16">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-ink">Explore Jobs by Category</h2>
            <p className="mt-1 text-sm text-slate-500">
              Browse openings by the kind of role you want.
            </p>
          </div>

          <Link
            to="/jobs"
            className="link inline-flex items-center gap-1 text-sm"
          >
            View All Categories →
          </Link>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {JOB_CATEGORIES.map((cat) => {
            const Icon = CATEGORY_ICONS[cat.value];
            const count = categoryCounts[cat.value];
            return (
              <Link
                key={cat.value}
                to={`/jobs?category=${encodeURIComponent(cat.value)}`}
                className="card group block p-5 transition hover:-translate-y-0.5 hover:shadow-lift"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-ink group-hover:text-brand-600">
                  {cat.label}
                </h3>
                {count != null && (
                  <p className="mt-1 text-sm text-slate-500">
                    {count} {count === 1 ? "job" : "jobs"}
                  </p>
                )}
              </Link>
            );
          })}
        </div>
      </section>

      {/* Latest openings */}
      <section className="container-page py-16">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-ink">Latest openings</h2>
            <p className="mt-1 text-sm text-slate-500">
              Fresh roles from companies hiring right now.
            </p>
          </div>

          <Link
            to="/jobs"
            className="link inline-flex items-center gap-1 text-sm"
          >
            View all jobs <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {isLoading ? (
          <Spinner />
        ) : jobs.length === 0 ? (
          <p className="mt-8 text-sm text-slate-500">
            No openings just yet — check back soon.
          </p>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </section>

      {/* Why Talent Hai */}
      <section className="border-t border-slate-200 bg-white py-16 sm:py-20">
        <div className="container-page">
          <div className="grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]">

            {/* Left Content */}
            <div>
              <span className="text-sm font-semibold uppercase tracking-wider text-brand-600">
                Why Talent Hai?
              </span>

              <h2 className="mt-3 max-w-lg text-3xl font-bold leading-tight sm:text-4xl">
                Finding a job shouldn't feel like a full-time job.
              </h2>

              <p className="mt-5 max-w-xl text-base leading-7 text-slate-600">
                Job search simple hona chahiye — search karo, compare karo,
                apply karo, aur apni applications ka status ek hi jagah se track karo.
              </p>

              <div className="mt-7">
                <a
                  href="/jobs"
                  className="btn-primary"
                >
                  Explore Jobs
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            </div>

            {/* Right Content */}
            <div className="divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-slate-50">

              <div className="flex gap-4 p-6">
                <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600">
                  <Check className="h-4 w-4" />
                </div>

                <div>
                  <h3 className="font-semibold text-slate-900">
                    Search smarter
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Find relevant jobs based on your skills, location and preferred role.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-6">
                <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600">
                  <Check className="h-4 w-4" />
                </div>

                <div>
                  <h3 className="font-semibold text-slate-900">
                    Apply easily
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Keep your profile ready and apply to opportunities without unnecessary steps.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-6">
                <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600">
                  <Check className="h-4 w-4" />
                </div>

                <div>
                  <h3 className="font-semibold text-slate-900">
                    Track your journey
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    See your application progress and keep everything organized in one place.
                  </p>
                </div>
              </div>

            </div>
          </div>



        </div>
      </section>
      {/* Browse by industry */}
      <section className="container-page py-16">
        <h2 className="text-2xl font-bold text-ink">Browse by industry</h2>

        <p className="mt-1 text-sm text-slate-500">
          Explore roles across every sector.
        </p>

        <div className="mt-6 flex flex-wrap gap-2.5">
          {INDUSTRIES.map((industry) => (
            <Link
              key={industry}
              to={`/jobs?q=${encodeURIComponent(industry)}`}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-ink-soft transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
            >
              {industry}
            </Link>
          ))}
        </div>
      </section>

      {/* Recruiter CTA */}
      <section className="container-page pb-20">
        <div className="relative overflow-hidden rounded-3xl bg-brand-700 h-[330px] sm:h-[360px]">

          <img
            src={hiringBanner}
            alt=""
            className="absolute inset-0 h-full w-full scale-[1.25] object-cover object-center"          />

          <div className="absolute inset-0 z-10 flex items-center justify-center px-6 text-center sm:px-16">
            <div className="max-w-xl">
              <h2 className="font-display text-3xl font-semibold text-white sm:text-4xl">
                Hiring? Reach candidates faster.
              </h2>

              <p className="mx-auto mt-3 max-w-lg text-brand-100">
                Post jobs, unlock candidate profiles, and manage your pipeline —
                with pricing that scales with you.
              </p>

              <Link
                to="/register?role=recruiter"
                className="btn mt-7 bg-white text-brand-700 hover:bg-brand-50"
              >
                Start hiring
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

        </div>
      </section>
    </div>
  );
}