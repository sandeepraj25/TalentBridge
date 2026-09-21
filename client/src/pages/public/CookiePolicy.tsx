export default function CookiePolicy() {
  return (
    <main className="bg-white">
      <section className="border-b border-slate-200 bg-slate-50/60">
        <div className="container-page py-14 sm:py-16">
          <div className="mx-auto max-w-5xl">
            <p className="text-sm font-medium text-blue-600">Legal</p>
            <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
              Cookie Policy
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600">
              This policy explains how Talent Hai may use cookies and similar
              technologies on its website.
            </p>
            <p className="mt-4 text-sm text-slate-500">
              Last updated: September 21, 2026
            </p>
          </div>
        </div>
      </section>

      <section className="container-page py-14">
        <div className="mx-auto max-w-5xl space-y-10">
          {[
            ["What are cookies?", "Cookies are small files stored by your browser that can help websites remember information and understand how users interact with a website."],
            ["How we use cookies", "Talent Hai may use cookies to maintain login sessions, remember preferences, support website functionality, improve performance, and understand general website usage."],
            ["Essential cookies", "Some cookies may be necessary for authentication, security, account sessions, and core functionality. Disabling these cookies may affect parts of the website."],
            ["Analytics and performance", "Where enabled, analytics technologies may help us understand website usage and improve the user experience."],
            ["Managing cookies", "You can manage or disable cookies through your browser settings. Some website functionality may not work correctly if certain cookies are disabled."],
            ["Changes to this policy", "We may update this Cookie Policy when our technology, services, or legal requirements change."]
          ].map(([title, text]) => (
            <section key={title} className="border-b border-slate-200 pb-8">
              <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
              <p className="mt-3 max-w-3xl text-[15px] leading-7 text-slate-600">
                {text}
              </p>
            </section>
          ))}
        </div>
      </section>
    </main>
  );
}
