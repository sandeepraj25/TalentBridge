import { Link, Outlet } from "react-router-dom";
import { useAuth } from "@/lib/auth";

// Image Imports
import logoImg from "../pages/public/images/logo.png";
import googlePlayImg from "../pages/public/images/gogoleplaystore.webp";

export function PublicLayout() {
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="container-page flex h-16 items-center justify-between gap-6">
          
          {/* Left Side: Logo & Navigation */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex shrink-0 items-center">
              <img
                src={logoImg}
                alt="Logo"
                className="h-9 w-auto object-contain block"
              />
            </Link>

            <nav className="hidden items-center gap-6 text-sm font-medium leading-none text-slate-700 md:flex">
              <Link to="/jobs" className="transition hover:text-brand-600">Find jobs</Link>
              <Link to="/companies" className="transition hover:text-brand-600">Companies</Link>
              <Link to="/pricing" className="transition hover:text-brand-600">Pricing</Link>
              <Link to="/register?role=recruiter" className="transition hover:text-brand-600">For recruiters</Link>
            </nav>
          </div>

          {/* Right Side: Auth Buttons */}
          <div className="flex items-center gap-3 shrink-0">
            {user ? (
              <Link to={`/dashboard/${user.role}`} className="btn-primary btn-sm">
                {user.full_name?.split(" ")[0] ?? "Dashboard"}
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn-ghost btn-sm">Log in</Link>
                <Link to="/register" className="btn-primary btn-sm">Get started</Link>
              </>
            )}
          </div>

        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="mt-20 border-t border-slate-100 bg-white">
        <div className="container-page py-12">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr_2.2fr]">

            {/* Brand & Social */}
            <div className="flex flex-col justify-between">
              <div>
                {/* Footer Logo */}
                <Link to="/" className="inline-block">
                  <img
                    src={logoImg}
                    alt="Logo"
                    className="h-10 w-auto object-contain"
                  />
                </Link>

                <p className="mt-3 text-xs leading-relaxed text-slate-500">
                  Find jobs, discover companies, and build your career with Talent hai.
                </p>
              </div>

              <div className="mt-6">
                <p className="text-sm font-semibold text-slate-800">
                  Connect with us
                </p>

                <div className="mt-3 flex items-center gap-2">
                  {/* Facebook */}
                  <a
                    href="#"
                    aria-label="Facebook"
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-blue-600"
                  >
                    <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </a>

                  {/* Instagram */}
                  <a
                    href="#"
                    aria-label="Instagram"
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-pink-600"
                  >
                    <svg className="h-4 w-4 fill-none stroke-current stroke-[2]" viewBox="0 0 24 24">
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                    </svg>
                  </a>

                  {/* X / Twitter */}
                  <a
                    href="#"
                    aria-label="X"
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
                  >
                    <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  </a>

                  {/* LinkedIn */}
                  <a
                    href="#"
                    aria-label="LinkedIn"
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-blue-700"
                  >
                    <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.25V10.9H6.46M7.86 6.6a1.4 1.4 0 1 0 1.4 1.4 1.4 1.4 0 0 0-1.4-1.4z"/>
                    </svg>
                  </a>
                </div>
              </div>
            </div>

            {/* Section 1: Job Seekers */}
            <div>
              <h4 className="text-sm font-bold text-slate-900">Job Seekers</h4>
              <ul className="mt-4 flex flex-col gap-2.5 text-sm text-slate-600">
                <li><Link to="/jobs" className="hover:text-brand-600">Find Jobs</Link></li>
                <li><Link to="/companies" className="hover:text-brand-600">Companies</Link></li>
                <li><Link to="/register" className="hover:text-brand-600">Create Profile</Link></li>
              </ul>
            </div>

            {/* Section 2: Employers */}
            <div>
              <h4 className="text-sm font-bold text-slate-900">Employers</h4>
              <ul className="mt-4 flex flex-col gap-2.5 text-sm text-slate-600">
                <li><Link to="/register?role=recruiter" className="hover:text-brand-600">Post a Job</Link></li>
                <li><Link to="/pricing" className="hover:text-brand-600">Pricing</Link></li>
                <li><Link to="/login" className="hover:text-brand-600">Employer Login</Link></li>
              </ul>
            </div>

            {/* Section 3: Company */}
            <div>
              <h4 className="text-sm font-bold text-slate-900">Company</h4>
              <ul className="mt-4 flex flex-col gap-2.5 text-sm text-slate-600">
                <li><Link to="/about" className="hover:text-brand-600">About Us</Link></li>
                <li><Link to="/contact" className="hover:text-brand-600">Contact Us</Link></li>
                <li><Link to="/refund-policy" className="hover:text-brand-600">Refund Policy</Link></li>
                <li><Link to="/privacy" className="hover:text-brand-600">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-brand-600">Terms &amp; Conditions</Link></li>
              </ul>
            </div>

            {/* App Download Box */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <h4 className="text-base font-bold text-slate-900">
                Apply on the go
              </h4>

              <p className="mt-1 text-xs text-slate-500">
                Get real-time job updates on our App
              </p>

              <div className="mt-5 flex items-center gap-3">
                {/* Google Play Badge */}
                <a href="#" className="inline-block transition-transform hover:scale-105">
                  <img
                    src={googlePlayImg}
                    alt="Get it on Google Play"
                    className="h-10 w-auto object-contain"
                  />
                </a>

                {/* App Store Badge */}
                <a href="#" className="inline-block transition-transform hover:scale-105">
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg"
                    alt="Download on the App Store"
                    className="h-10 w-auto object-contain"
                  />
                </a>
              </div>
            </div>

          </div>
        </div>
      </footer>
    </div>
  );
}