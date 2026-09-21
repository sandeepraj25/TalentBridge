export default function Help() {
  return (
    <main className="bg-white">
      <section className="border-b border-slate-200 bg-slate-50/60">
        <div className="container-page py-14 sm:py-16">
          <div className="mx-auto max-w-5xl">
            <p className="text-sm font-medium text-blue-600">Support</p>
            <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
              How can we help?
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600">
              Find help with your Talent Hai account, jobs, applications,
              recruiter services, payments, and other platform-related
              questions.
            </p>
          </div>
        </div>
      </section>

      <section className="container-page py-14 sm:py-20">
        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2">
          {[
            ["Job seekers", "Need help with your profile, applications, saved jobs, recommendations, or interviews? Start by checking your candidate dashboard."],
            ["Recruiters", "Need help with job postings, candidates, packages, credits, applications, or your company profile? Use your recruiter dashboard."],
            ["Payments & refunds", "For payment issues or refund requests, contact support and include your transaction or order reference."],
            ["Account support", "For login, account, security, or other issues, contact our support team with your registered email address and relevant details."]
          ].map(([title, text]) => (
            <div key={title} className="rounded-xl border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">{text}</p>
            </div>
          ))}
        </div>

        <div className="mx-auto mt-10 max-w-5xl rounded-xl border border-slate-200 bg-slate-50 p-7">
          <p className="text-sm font-medium text-slate-500">Still need help?</p>
          <h2 className="mt-2 text-xl font-semibold text-slate-900">
            Contact Talent Hai support
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Email us at{" "}
            <a
              href="mailto:support@talenthain.com"
              className="font-semibold text-blue-600 hover:text-blue-700"
            >
              support@talenthain.com
            </a>
            .
          </p>
        </div>
      </section>
    </main>
  );
}
