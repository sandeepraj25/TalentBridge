import {
    ArrowRight,
    Building2,
    Clock3,
    Mail,
    MapPin,
    MessageCircle,
  } from "lucide-react";
  import { Link } from "react-router-dom";
  
  const CONTACT_EMAIL = "support@talenthain.com";
  
  const ADDRESS = `Legal Name: madhvi corporate consultancy
  
  📞 Phone: +91 78020 34865
  
  📧 Email: support@talenthain.com
  
  🏠 Address: Payal Flats, Vasna, Ahmedabad, Gujarat`;
  
  export default function Contact() {
    return (
      <main className="bg-slate-50">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-slate-200 bg-white">
          <div className="container-page py-16 sm:py-20 lg:py-24">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
                <MessageCircle className="h-4 w-4" />
                Get in Touch
              </div>
  
              <h1 className="font-display text-4xl font-bold tracking-tight text-ink sm:text-5xl lg:text-6xl">
                Contact Us
              </h1>
  
              <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-600">
                Have a question, need help, or want to learn more about Talent
                Hai? Our team is here to help.
              </p>
            </div>
          </div>
        </section>
  
        {/* Main Contact Section */}
        <section className="container-page py-14 sm:py-20">
          <div className="mx-auto max-w-5xl">
            <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
              {/* Left Information */}
              <div className="rounded-3xl bg-slate-900 p-7 text-white shadow-sm sm:p-9">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10">
                  <Building2 className="h-6 w-6" />
                </div>
  
                <h2 className="mt-6 font-display text-3xl font-bold">
                  We'd love to hear from you
                </h2>
  
                <p className="mt-4 text-base leading-7 text-slate-300">
                  Whether you are a job seeker looking for your next opportunity
                  or a recruiter looking for the right talent, feel free to
                  reach out to us.
                </p>
  
                <div className="mt-9 space-y-6">
                  {/* Email */}
                  <a
                    href={`mailto:${CONTACT_EMAIL}`}
                    className="group flex items-start gap-4"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 transition group-hover:bg-white/20">
                      <Mail className="h-5 w-5" />
                    </div>
  
                    <div>
                      <p className="text-sm font-medium text-slate-400">
                        Email Us
                      </p>
  
                      <p className="mt-1 font-semibold text-white">
                        {CONTACT_EMAIL}
                      </p>
                    </div>
                  </a>
  
                  {/* Address */}
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10">
                      <MapPin className="h-5 w-5" />
                    </div>
  
                    <div>
                      <p className="text-sm font-medium text-slate-400">
                        Our Location
                      </p>
  
                      <p className="mt-1 leading-6 text-white whitespace-pre-line">
                        {ADDRESS}
                      </p>
                    </div>
                  </div>
  
                  {/* Support */}
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10">
                      <Clock3 className="h-5 w-5" />
                    </div>
  
                    <div>
                      <p className="text-sm font-medium text-slate-400">
                        Support
                      </p>
  
                      <p className="mt-1 leading-6 text-white">
                        For general queries and support, email us anytime.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
  
              {/* Right Side */}
              <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">
                  How can we help?
                </p>
  
                <h2 className="mt-3 font-display text-3xl font-bold text-ink">
                  Choose the right way to reach us
                </h2>
  
                <p className="mt-4 leading-7 text-slate-600">
                  We are happy to assist with questions related to jobs,
                  recruitment, accounts, payments, or the Talent Hai platform.
                </p>
  
                <div className="mt-8 space-y-4">
                  {/* Job Seekers */}
                  <div className="rounded-2xl border border-slate-200 p-5 transition hover:border-blue-200 hover:bg-blue-50/40">
                    <h3 className="font-bold text-ink">
                      Looking for a Job?
                    </h3>
  
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Explore available opportunities and find your next career
                      move on Talent Hai.
                    </p>
  
                    <Link
                      to="/jobs"
                      className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-600"
                    >
                      Explore Jobs
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
  
                  {/* Recruiters */}
                  <div className="rounded-2xl border border-slate-200 p-5 transition hover:border-blue-200 hover:bg-blue-50/40">
                    <h3 className="font-bold text-ink">
                      Looking to Hire?
                    </h3>
  
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Find skilled candidates and discover tools designed to
                      simplify your hiring process.
                    </p>
  
                    <Link
                      to="/pricing"
                      className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-600"
                    >
                      Start Hiring
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
  
                  {/* Support */}
                  <div className="rounded-2xl border border-slate-200 p-5 transition hover:border-blue-200 hover:bg-blue-50/40">
                    <h3 className="font-bold text-ink">
                      Need Support?
                    </h3>
  
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      For account issues, payment questions, technical problems,
                      or general assistance, contact our support team.
                    </p>
  
                    <a
                      href={`mailto:${CONTACT_EMAIL}`}
                      className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-600"
                    >
                      Email Support
                      <ArrowRight className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
  
        {/* Address Section */}
        <section className="border-y border-slate-200 bg-white">
          <div className="container-page py-14 sm:py-16">
            <div className="mx-auto max-w-5xl">
              <div className="grid items-center gap-8 md:grid-cols-[1fr_auto]">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">
                    Visit Us
                  </p>
  
                  <h2 className="mt-3 font-display text-3xl font-bold text-ink">
                    Our Office
                  </h2>
  
                  <div className="mt-5 flex items-start gap-3">
                    <MapPin className="mt-1 h-5 w-5 shrink-0 text-blue-600" />
  
                    <p className="max-w-xl leading-7 text-slate-600 whitespace-pre-line">
                      {ADDRESS}
                    </p>
                  </div>
                </div>
  
                <a
                  href="https://maps.google.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  View on Google Maps
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        </section>
  
        {/* Bottom CTA */}
        <section className="container-page py-14 sm:py-20">
          <div className="mx-auto max-w-5xl rounded-3xl bg-blue-600 px-6 py-12 text-center sm:px-10 sm:py-14">
            <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">
              Still have a question?
            </h2>
  
            <p className="mx-auto mt-4 max-w-2xl leading-7 text-blue-100">
              Send us an email and our team will get back to you as soon as
              possible.
            </p>
  
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-semibold text-blue-700 shadow-sm transition hover:bg-blue-50"
            >
              <Mail className="h-4 w-4" />
              {CONTACT_EMAIL}
            </a>
          </div>
        </section>
      </main>
    );
  }