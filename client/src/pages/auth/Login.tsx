import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api";
import { Field, Logo } from "@/components/ui";

export default function Login() {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const next = searchParams.get("next");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) {
    return <Navigate to={next || `/dashboard/${user.role}`} replace />;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const u = await login(email, password);
      navigate(next || `/dashboard/${u.role}`, { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Form */}
      <div className="flex flex-col justify-center px-6 py-12 sm:px-12">
        <div className="mx-auto w-full max-w-sm">
          <Logo />
          <h1 className="mt-8 text-2xl font-bold text-ink">Welcome back</h1>
          <p className="mt-1 text-sm text-slate-500">Log in to your Rojgaar account.</p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
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
            <Field label="Password" htmlFor="password">
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
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
              {submitting ? "Logging in…" : "Log in"}
            </button>
          </form>

          <p className="mt-6 text-sm text-slate-500">
            New to Rojgaar?{" "}
            <Link to="/register" className="link">Create an account</Link>
          </p>

          <p className="mt-6 rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-500">
            Demo: admin@rojgaar.example / recruiter@rojgaar.example / priya@example.com · Password123!
          </p>
        </div>
      </div>

      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-brand-700 lg:block">
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-brand-500/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-brand-800/60 blur-3xl" />
        <div className="relative flex h-full flex-col justify-center px-14 text-white">
          <h2 className="font-display text-4xl font-semibold leading-tight">
            Find work you love.<br />Hire talent that lasts.
          </h2>
          <p className="mt-4 max-w-md text-brand-100">
            India&rsquo;s modern job portal — one-click applications, coin-powered hiring, and a pipeline that actually works.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-brand-50">
            {["Apply to any role in one click", "Track every application end to end", "Transparent, usage-based pricing"].map((t) => (
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
