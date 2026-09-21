export default function About() {
  return (
    <main className="bg-white">
      <section className="border-b border-slate-200 bg-slate-50/60">
        <div className="container-page py-14 sm:py-16">
          <div className="mx-auto max-w-5xl">
            <p className="text-sm font-medium text-blue-600">About Talent Hai</p>
            <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
              Connecting people with the right opportunities.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600">
              Talent Hai is a job and recruitment platform designed to help
              candidates discover opportunities and help recruiters connect
              with relevant talent.
            </p>
          </div>
        </div>
      </section>

      <section className="container-page py-14 sm:py-20">
        <div className="mx-auto max-w-5xl space-y-12">
          <div className="max-w-3xl">
            <h2 className="text-2xl font-semibold text-slate-900">What we do</h2>
            <p className="mt-4 text-[15px] leading-7 text-slate-600">
              Talent Hai brings job seekers and employers together through a
              single platform. Candidates can explore jobs, manage their
              profiles, apply for opportunities, and track their applications.
              Recruiters can create company profiles, publish jobs, and manage
              candidates.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-900">For candidates</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Discover relevant jobs, build your professional profile,
                apply to openings, save opportunities, and manage your
                recruitment activity.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-900">For recruiters</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Publish job openings, manage applications, review candidates,
                and organize your hiring workflow from one place.
              </p>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-10">
            <h2 className="text-2xl font-semibold text-slate-900">
              Our approach
            </h2>
            <p className="mt-4 max-w-3xl text-[15px] leading-7 text-slate-600">
              We focus on keeping the hiring experience simple, accessible,
              and useful for both candidates and employers.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
