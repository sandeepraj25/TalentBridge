const faqs = [
  ["What is Talent Hai?", "Talent Hai is a job and recruitment platform where candidates can discover opportunities and recruiters can publish and manage job openings."],
  ["How can I apply for a job?", "Create or log in to your candidate account, open a job listing, review the requirements, and use the available application option."],
  ["Can recruiters post jobs?", "Yes. Recruiters can create an account, set up their company information, and use the recruiter dashboard to manage job postings."],
  ["Are there paid recruiter services?", "Talent Hai may offer paid packages, credits, subscriptions, or other recruiter services. Current pricing is shown on the Pricing page."],
  ["What is your refund period?", "Eligible paid services are covered by a 7-calendar-day refund period, subject to the conditions described in the Refund Policy."],
  ["How can I contact Talent Hai?", "For support or general enquiries, email support@talenthain.com."],
];

export default function FAQ() {
  return (
    <main className="bg-white">
      <section className="border-b border-slate-200 bg-slate-50/60">
        <div className="container-page py-14 sm:py-16">
          <div className="mx-auto max-w-5xl">
            <p className="text-sm font-medium text-blue-600">Help Centre</p>
            <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
              Frequently Asked Questions
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600">
              Answers to common questions about using Talent Hai.
            </p>
          </div>
        </div>
      </section>

      <section className="container-page py-14 sm:py-20">
        <div className="mx-auto max-w-3xl divide-y divide-slate-200">
          {faqs.map(([question, answer]) => (
            <details key={question} className="group py-6">
              <summary className="cursor-pointer list-none pr-8 text-base font-semibold text-slate-900">
                {question}
              </summary>
              <p className="mt-3 text-[15px] leading-7 text-slate-600">
                {answer}
              </p>
            </details>
          ))}
        </div>
      </section>
    </main>
  );
}
