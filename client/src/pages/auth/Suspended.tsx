import { Link, useNavigate } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Logo } from "@/components/ui";

export default function Suspended() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/", { replace: true });
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <Logo />
      <div className="mt-10 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
        <ShieldAlert className="h-7 w-7" />
      </div>
      <h1 className="mt-6 text-2xl font-bold text-ink">Your account is suspended</h1>
      <p className="mt-2 max-w-md text-sm text-slate-500">
        Access to your Rojgaar account has been temporarily suspended. If you think this is a mistake,
        please contact support.
      </p>
      <div className="mt-8 flex items-center gap-3">
        <Link to="/" className="btn-outline">Back home</Link>
        <button onClick={handleLogout} className="btn-primary">Log out</button>
      </div>
    </div>
  );
}
