export default function Terms() {
  return (
    <main className="bg-white">
      <section className="border-b border-slate-200 bg-slate-50/60">
        <div className="container-page py-14 sm:py-16">
          <div className="mx-auto max-w-5xl">
            <p className="text-sm font-medium text-blue-600">Legal</p>
            <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
              Terms of Service
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600">
              These terms describe the rules and conditions that apply when
              you access or use Talent Hai.
            </p>
            <p className="mt-4 text-sm text-slate-500">
              Last updated: September 21, 2026
            </p>
          </div>
        </div>
      </section>

      <div className="container-page">
        <div className="mx-auto max-w-5xl">
          {[
            ["01", "Acceptance of Terms", "By accessing or using Talent Hai, you agree to comply with these Terms of Service and applicable laws. If you do not agree with these terms, please do not use the platform."],
            ["02", "Use of the Platform", "Talent Hai provides online services for job discovery, recruitment, job applications, company profiles, job postings, and related activities. You are responsible for the information you submit and the activity associated with your account."],
            ["03", "User Accounts", "You must provide accurate information when creating an account and keep your login credentials confidential. You are responsible for activity performed through your account."],
            ["04", "Job Seekers", "Candidates are responsible for ensuring that resumes, profiles, applications, and other information submitted through Talent Hai are accurate and do not contain misleading or unlawful information."],
            ["05", "Recruiters and Employers", "Recruiters are responsible for the accuracy of job listings, company information, hiring requirements, and communications provided through the platform."],
            ["06", "Payments and Services", "Paid services, packages, credits, subscriptions, and other purchases are subject to the applicable pricing and payment terms. Refunds are governed by the Talent Hai Refund Policy."],
            ["07", "Prohibited Activities", "Users must not use Talent Hai for unlawful activities, fraud, harassment, unauthorized access, spam, misleading job postings, or activities that interfere with the security or operation of the platform."],
            ["08", "Intellectual Property", "The Talent Hai platform, branding, software, design, and original content are protected by applicable intellectual-property laws. Users may not copy or commercially exploit these materials without authorization."],
            ["09", "Suspension or Termination", "Talent Hai may restrict, suspend, or terminate access where reasonably necessary to protect the platform, users, or comply with applicable law or these terms."],
            ["10", "Changes to These Terms", "We may update these terms from time to time. Updated terms will be published on this page with a revised date."],
            ["11", "Contact", "For questions regarding these terms, contact support@talenthain.com."]
          ].map(([number, title, text]) => (
            <section key={number} className="border-b border-slate-200 py-10">
              <div className="grid gap-5 sm:grid-cols-[150px_1fr]">
                <div>
                  <span className="text-xs font-semibold tracking-widest text-slate-400">
                    {number}
                  </span>
                  <h2 className="mt-1 text-lg font-semibold text-slate-900">
                    {title}
                  </h2>
                </div>
                <p className="max-w-3xl text-[15px] leading-7 text-slate-600">
                  {text}
                </p>
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
