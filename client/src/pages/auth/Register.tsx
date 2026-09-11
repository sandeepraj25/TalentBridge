import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { Briefcase, UserRound } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api";
import { Field } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/types";

// Path Alias (@/ points to src/)
import logoImg from "@/pages/public/images/logo.png";
import registerImg from "../public/images/registerimage.png";
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
    <div className="grid h-screen w-full overflow-hidden lg:grid-cols-2 bg-white">
      {/* Left Form Container */}
      <div className="flex flex-col justify-center px-8 sm:px-14 lg:px-20 overflow-y-auto py-8">
        <div className="mx-auto w-full max-w-[360px]">
          {/* Logo with Sub-label Centered */}
          <div className="flex flex-col items-center justify-center">
            <Link to="/" className="inline-block">
              <img src={logoImg} alt="Talent Hai" className="h-14 w-auto object-contain" />
            </Link>
            <span className="mt-1 text-xs font-medium tracking-wide text-slate-500 text-center">
              Madhvi Corporate Consultancy
            </span>
          </div>

          <h1 className="mt-6 text-2xl font-bold tracking-tight text-slate-900 text-center">
            Create your account
          </h1>
          <p className="mt-1 text-xs text-slate-500 text-center">
            Join Talent Hai in less than a minute.
          </p>

          {/* Role selection */}
          <div className="mt-5 grid grid-cols-2 gap-2.5">
            {roles.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRole(r.value)}
                className={cn(
                  "flex flex-col items-start rounded-xl border p-2.5 text-left transition-all",
                  role === r.value
                    ? "border-blue-600 bg-blue-50/60 ring-1 ring-blue-600"
                    : "border-slate-200 bg-white hover:border-slate-300"
                )}
              >
                <r.icon
                  className={cn(
                    "h-4 w-4",
                    role === r.value ? "text-blue-600" : "text-slate-400"
                  )}
                />
                <span className="mt-1.5 text-xs font-semibold text-slate-900">{r.title}</span>
                <span className="text-[10px] text-slate-500">{r.sub}</span>
              </button>
            ))}
          </div>

          {/* Registration Form */}
          <form onSubmit={onSubmit} className="mt-5 space-y-3.5">
            <Field label="Full name" htmlFor="full_name">
              <input
                id="full_name"
                type="text"
                autoComplete="name"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2 pl-3 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
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
                className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2 pl-3 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
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
                className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2 pl-3 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                placeholder="••••••••"
              />
            </Field>

            {error && (
              <p className="rounded-lg bg-red-50 p-2 text-xs font-medium text-red-600">{error}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-[#0A52EF] py-2.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 active:scale-[0.99] disabled:opacity-70 flex items-center justify-center gap-1.5"
            >
              {submitting ? "Creating account…" : "Create account →"}
            </button>
          </form>

          <p className="mt-5 text-center text-xs text-slate-600">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-700">
              Log in
            </Link>
          </p>
        </div>
      </div>

      {/* Right Sidebar - Full Scale Graphic Image */}
      <div className="relative hidden h-screen w-full overflow-hidden bg-[#0A52EF] lg:block">
        <img
          src={registerImg}
          alt="Talent Hai Register Sidebar"
          className="h-full w-full object-contain object-right"
        />
      </div>
    </div>
  );
}