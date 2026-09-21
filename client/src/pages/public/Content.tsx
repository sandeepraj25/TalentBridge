import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  Eye,
  Target,
  Users,
} from "lucide-react";

import { api } from "@/lib/api";
import { Spinner } from "@/components/ui";

type ContentDoc = {
  key: string;
  title: string;
  body: string;
} | null;

function capitalize(key: string) {
  return key
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

type ContentBlock = {
  heading?: string;
  text: string;
};

function parseContent(body: string): ContentBlock[] {
  return body
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);

      if (lines.length === 1 && lines[0].length <= 60) {
        return {
          heading: lines[0],
          text: "",
        };
      }

      return {
        text: block,
      };
    });
}

function getIcon(heading?: string) {
  const value = heading?.toLowerCase() ?? "";

  if (value.includes("job seeker")) return BriefcaseBusiness;
  if (value.includes("recruiter")) return Building2;
  if (value.includes("vision")) return Eye;
  if (value.includes("mission")) return Target;

  return CheckCircle2;
}

export default function Content({ pageKey }: { pageKey: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["content", pageKey],
    queryFn: () => api.get<{ content: ContentDoc }>(`/content/${pageKey}`),
  });

  const content = data?.content ?? null;
  const title = content?.title || capitalize(pageKey);

  if (isLoading) {
    return (
      <div className="container-page flex min-h-[60vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!content?.body) {
    return (
      <div className="container-page py-16">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
            <Building2 className="h-6 w-6 text-slate-500" />
          </div>

          <h1 className="mt-6 font-display text-4xl font-semibold text-ink">
            {title}
          </h1>

          <p className="mt-4 text-slate-500">
            This page hasn&rsquo;t been published yet. Please check back soon.
          </p>
        </div>
      </div>
    );
  }

  if (pageKey === "about") {
    return <AboutPage title={title} body={content.body} />;
  }

  return <DocumentPage title={title} body={content.body} />;
}

/* -------------------------------------------------------------------------- */
/* ABOUT PAGE                                                                 */
/* -------------------------------------------------------------------------- */

function AboutPage({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  const blocks = parseContent(body);

  const intro =
    blocks.find((block) => !block.heading)?.text ||
    "Talent Hai connects job seekers with meaningful career opportunities and helps businesses find the right talent.";

  const sections = blocks.filter((block) => block.heading);

  const jobSeekers = sections.find((section) =>
    section.heading?.toLowerCase().includes("job seeker")
  );

  const recruiters = sections.find((section) =>
    section.heading?.toLowerCase().includes("recruiter")
  );

  const vision = sections.find((section) =>
    section.heading?.toLowerCase().includes("vision")
  );

  const mission = sections.find((section) =>
    section.heading?.toLowerCase().includes("mission")
  );

  return (
    <main className="bg-slate-50">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-slate-200 bg-white">
        <div className="container-page relative py-16 sm:py-20 lg:py-24">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
              <Users className="h-4 w-4" />
              About Talent Hai
            </div>

            <h1 className="font-display text-4xl font-bold tracking-tight text-ink sm:text-5xl lg:text-6xl">
              {title}
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl">
              {intro}
            </p>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                to="/jobs"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                Find Jobs
                <ArrowRight className="h-4 w-4" />
              </Link>

              <Link
                to="/pricing"
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-3 font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                Hire Talent
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Intro / Why Talent Hai */}
      <section className="container-page py-16 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">
                Why Talent Hai
              </p>

              <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
                Making hiring simpler for everyone
              </h2>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm sm:p-8">
              <p className="text-base leading-8 text-slate-600">
                At Talent Hai, we connect job seekers with meaningful career
                opportunities and help recruiters and companies discover the
                right talent for their growing teams.
              </p>

              <p className="mt-5 text-base leading-8 text-slate-600">
                Our goal is to create a hiring experience that is simple,
                transparent, accessible, and focused on real opportunities.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* For Job Seekers / Recruiters */}
      <section className="border-y border-slate-200 bg-white">
        <div className="container-page py-16 sm:py-20">
          <div className="mx-auto max-w-5xl">
            <div className="max-w-2xl">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">
                Built for both sides
              </p>

              <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
                One platform. Two powerful experiences.
              </h2>

              <p className="mt-4 text-base leading-7 text-slate-600">
                Whether you are searching for your next opportunity or
                building your next team, Talent Hai is designed to make the
                process easier.
              </p>
            </div>

            <div className="mt-10 grid gap-6 md:grid-cols-2">
              {/* Job Seekers */}
              <div className="group rounded-2xl border border-slate-200 bg-slate-50 p-7 transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg sm:p-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                  <BriefcaseBusiness className="h-6 w-6" />
                </div>

                <h3 className="mt-6 text-xl font-bold text-ink">
                  {jobSeekers?.heading || "For Job Seekers"}
                </h3>

                <p className="mt-4 text-base leading-7 text-slate-600">
                  {jobSeekers?.text ||
                    "Discover relevant opportunities, explore companies, build your profile, save jobs, and apply for positions from one convenient platform."}
                </p>

                <Link
                  to="/jobs"
                  className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 transition group-hover:gap-3"
                >
                  Explore Jobs
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              {/* Recruiters */}
              <div className="group rounded-2xl border border-slate-200 bg-slate-50 p-7 transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg sm:p-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                  <Building2 className="h-6 w-6" />
                </div>

                <h3 className="mt-6 text-xl font-bold text-ink">
                  {recruiters?.heading || "For Recruiters"}
                </h3>

                <p className="mt-4 text-base leading-7 text-slate-600">
                  {recruiters?.text ||
                    "Publish job openings, manage applications, discover candidates, and simplify your recruitment process."}
                </p>

                <Link
                  to="/pricing"
                  className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 transition group-hover:gap-3"
                >
                  Start Hiring
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Vision & Mission */}
      <section className="container-page py-16 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Vision */}
            <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm sm:p-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                <Eye className="h-6 w-6" />
              </div>

              <h3 className="mt-6 text-2xl font-bold text-ink">
                {vision?.heading || "Our Vision"}
              </h3>

              <p className="mt-4 text-base leading-7 text-slate-600">
                {vision?.text ||
                  "We envision a hiring ecosystem where talent meets opportunity without unnecessary barriers."}
              </p>
            </div>

            {/* Mission */}
            <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm sm:p-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                <Target className="h-6 w-6" />
              </div>

              <h3 className="mt-6 text-2xl font-bold text-ink">
                {mission?.heading || "Our Mission"}
              </h3>

              <p className="mt-4 text-base leading-7 text-slate-600">
                {mission?.text ||
                  "Our mission is simple: connect the right people with the right opportunities."}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container-page pb-16 sm:pb-20">
        <div className="mx-auto max-w-5xl overflow-hidden rounded-3xl bg-slate-900 px-6 py-12 text-center sm:px-10 sm:py-14">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-300">
            Talent Hai
          </p>

          <h2 className="mt-3 font-display text-3xl font-bold text-white sm:text-4xl">
            Where Talent Meets Opportunity
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-300">
            Take the next step in your career or find the people who can help
            your business grow.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              to="/jobs"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 font-semibold text-slate-900 transition hover:bg-slate-100"
            >
              Find Your Next Job
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              to="/pricing"
              className="inline-flex items-center justify-center rounded-xl border border-slate-700 px-6 py-3 font-semibold text-white transition hover:bg-slate-800"
            >
              Start Hiring
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

/* -------------------------------------------------------------------------- */
/* DOCUMENT PAGES                                                             */
/* -------------------------------------------------------------------------- */

function DocumentPage({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  const blocks = parseContent(body);

  return (
    <main className="bg-slate-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="container-page py-14 sm:py-16">
          <div className="mx-auto max-w-4xl">
            <div className="mb-4 inline-flex items-center rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-blue-700">
              Talent Hai
            </div>

            <h1 className="font-display text-4xl font-bold tracking-tight text-ink sm:text-5xl">
              {title}
            </h1>
          </div>
        </div>
      </section>

      <section className="container-page py-12 sm:py-16">
        <article className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10 lg:p-12">
          <div className="space-y-8">
            {blocks.map((block, index) => {
              const Icon = block.heading ? getIcon(block.heading) : null;

              return (
                <section key={`${block.heading || "text"}-${index}`}>
                  {block.heading && (
                    <div className="mb-3 flex items-center gap-3">
                      {Icon && (
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                          <Icon className="h-4 w-4" />
                        </div>
                      )}

                      <h2 className="text-xl font-bold text-ink">
                        {block.heading}
                      </h2>
                    </div>
                  )}

                  {block.text && (
                    <p className="whitespace-pre-line text-[15px] leading-8 text-slate-600">
                      {block.text}
                    </p>
                  )}
                </section>
              );
            })}
          </div>
        </article>
      </section>
    </main>
  );
}