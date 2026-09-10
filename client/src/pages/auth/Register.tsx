import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, Briefcase, UserRound } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api";
import { Field, Logo } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/types";

export default function Register() {
  const { user, loading, register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const initialRole: Role = searchParams.get("role") === "recruiter" ? "recruiter" : "candidate";
  const [role, setRole] = useState<Role>(initialRole);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) {
    return <Navigate to={`/dashboard/${user.role}`} replace />;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setSubmitting(true);
    try {
      const u = await register({ full_name: fullName, email, password, role });
      navigate(`/dashboard/${u.role}`, { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const roles: { value: Role; title: string; sub: string; icon: typeof UserRound }[] = [
    { value: "candidate", title: "I want a job", sub: "Find and apply to roles", icon: UserRound },
    { value: "recruiter", title: "I'm hiring", sub: "Post jobs & find talent", icon: Briefcase },
  ];

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Form */}
      <div className="flex flex-col justify-center px-6 py-12 sm:px-12">
        <div className="mx-auto w-full max-w-sm">
          <Logo />
          <h1 className="mt-8 text-2xl font-bold text-ink">Create your account</h1>
          <p className="mt-1 text-sm text-slate-500">Join Rojgaar in less than a minute.</p>

          {/* Role toggle */}
          <div className="mt-6 grid grid-cols-2 gap-3">
            {roles.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRole(r.value)}
                className={cn(
                  "flex flex-col items-start rounded-xl border p-3 text-left transition",
                  role === r.value ? "border-brand-500 bg-brand-50 ring-1 ring-brand-500" : "border-slate-200 bg-white hover:border-slate-300"
                )}
              >
                <r.icon className={cn("h-5 w-5", role === r.value ? "text-brand-600" : "text-slate-400")} />
                <span className="mt-2 text-sm font-semibold text-ink">{r.title}</span>
                <span className="text-xs text-slate-500">{r.sub}</span>
              </button>
            ))}
          </div>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <Field label="Full name" htmlFor="full_name">
              <input
                id="full_name"
                type="text"
                autoComplete="name"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="input"
                placeholder="Priya Sharma"
              />
            </Field>
            <Field label="Email" htmlFor="email">
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="you@example.com"
              />
            </Field>
            <Field label="Password" htmlFor="password" hint="At least 8 characters">
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="••••••••"
              />
            </Field>

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600">{error}</p>
            )}

            <button type="submit" disabled={submitting} className="btn-primary w-full">
              {submitting ? "Creating account…" : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-sm text-slate-500">
            Already have an account?{" "}
            <Link to="/login" className="link">Log in</Link>
          </p>
        </div>
      </div>

      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-brand-700 lg:block">
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-brand-500/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-brand-800/60 blur-3xl" />
        <div className="relative flex h-full flex-col justify-center px-14 text-white">
          <h2 className="font-display text-4xl font-semibold leading-tight">
            Your next move starts here.
          </h2>
          <p className="mt-4 max-w-md text-brand-100">
            Whether you&rsquo;re looking for work or looking to hire, Rojgaar gives you the tools to move fast.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-brand-50">
            {["Free to create a profile", "Verified companies and candidates", "Built for the Indian job market"].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-brand-200" /> {t}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
