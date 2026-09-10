import { Link, Outlet } from "react-router-dom";
import { Logo } from "./ui";
import { useAuth } from "@/lib/auth";

export function PublicLayout() {
  const { user } = useAuth();
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="container-page flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-8">
            <Logo />
            <nav className="hidden items-center gap-6 text-sm font-medium text-ink-soft md:flex">
              <Link to="/jobs" className="hover:text-brand-600">Find jobs</Link>
              <Link to="/companies" className="hover:text-brand-600">Companies</Link>
              <Link to="/pricing" className="hover:text-brand-600">Pricing</Link>
              <Link to="/register?role=recruiter" className="hover:text-brand-600">For recruiters</Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
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

      <footer className="mt-20 border-t border-slate-200 bg-white">
        <div className="container-page grid gap-8 py-12 md:grid-cols-4">
          <div>
            <Logo />
            <p className="mt-3 max-w-xs text-sm text-slate-500">
              India&rsquo;s modern job portal. Search roles, apply in one click, hire faster.
            </p>
          </div>
          <FooterCol title="Candidates" links={[["Browse jobs", "/jobs"], ["Companies", "/companies"], ["Create profile", "/register"]]} />
          <FooterCol title="Recruiters" links={[["Post a job", "/register?role=recruiter"], ["Pricing", "/pricing"]]} />
          <FooterCol title="Company" links={[["About", "/about"], ["Terms", "/terms"], ["Privacy", "/privacy"]]} />
        </div>
        <div className="border-t border-slate-200 py-5">
          <div className="container-page flex flex-col items-center justify-between gap-2 text-xs text-slate-400 sm:flex-row">
            <p>© {new Date().getFullYear()} Rojgaar. All rights reserved.</p>
            <p>Node.js + Express + MySQL · React.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-ink">{title}</h4>
      <ul className="mt-3 space-y-2 text-sm text-slate-500">
        {links.map(([label, href]) => (
          <li key={href + label}>
            <Link to={href} className="hover:text-brand-600">{label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
