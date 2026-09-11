import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api";

// Path Alias (@/ points to src/)
import logoImg from "@/pages/public/images/logo.png";
import sidebarImg from "@/pages/public/images/loginsidebar.png"; // Ensure this contains full graphics

export default function Login() {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const next = searchParams.get("next");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
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
    <div className="grid h-screen w-full overflow-hidden lg:grid-cols-2 bg-white">
      {/* Left Form Container */}
      <div className="flex flex-col justify-center px-8 sm:px-14 lg:px-20 xl:px-24">

        <div className="mx-auto w-full max-w-[354px]">
          <div className="flex flex-col items-center justify-center">
            <Link to="/" className="inline-block">
              <img src={logoImg} alt="Talent Hai" className="h-14 w-auto object-contain" />
            </Link>
            <span className="mt-1 text-xs font-medium tracking-wide text-slate-500 text-center">
              Madhvi Corporate Consultancy
            </span>
          </div>

          <h1 className="mt-6 text-2xl font-bold tracking-tight text-slate-900 text-center">Welcome back</h1>
          <p className="mt-1 text-xs text-slate-500 text-center">Log in to your Talent Hai account.</p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            {/* Compact Inputs */}
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-slate-700 mb-1">
                Email
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2.5 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                  placeholder="admin@talenthai.com"
                />
              </div>
            </div>

            {/* Compact Password */}
            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2.5 pl-9 pr-9 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Compact Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-[#0A52EF] py-2.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-blue-700 active:scale-[0.99]"
            >
              {submitting ? "Logging in…" : "Log in →"}
            </button>
          </form>
        </div>
      </div>

      {/* Right Sidebar - Full Scale Graphic */}
      <div className="relative hidden h-screen w-full overflow-hidden bg-[#0A52EF] lg:block">
        <img
          src={sidebarImg}
          alt="Talent Hai Sidebar"
          className="h-full w-full object-contain object-right"
        />
      </div>
    </div>
  );
}