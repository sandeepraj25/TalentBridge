import { useState, type ComponentType } from "react";
import { Link, NavLink, Navigate, Outlet, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Menu, X, Bell, LogOut,
  LayoutDashboard, User, FileText, Bookmark, BellRing, Sparkles, MessagesSquare, CalendarClock,
  PlusCircle, Briefcase, KanbanSquare, Search, Building2, Coins, Package, LineChart,
  Users, ShieldCheck, CreditCard, Ticket, Flag, FileEdit, Settings, ScrollText,
} from "lucide-react";
import { Logo } from "./ui";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { cn, initials } from "@/lib/utils";
import type { Role } from "@/lib/types";

type NavItem = { to: string; label: string; icon: ComponentType<{ className?: string }>; end?: boolean };

const NAVS: Record<Role, NavItem[]> = {
  candidate: [
    { to: "/dashboard/candidate", label: "Overview", icon: LayoutDashboard, end: true },
    { to: "/dashboard/candidate/profile", label: "My profile", icon: User },
    { to: "/dashboard/candidate/applications", label: "Applications", icon: FileText },
    { to: "/dashboard/candidate/saved", label: "Saved jobs", icon: Bookmark },
    { to: "/dashboard/candidate/recommended", label: "Recommended", icon: Sparkles },
    { to: "/dashboard/candidate/alerts", label: "Job alerts", icon: BellRing },
    { to: "/dashboard/candidate/messages", label: "Messages", icon: MessagesSquare },
    { to: "/dashboard/candidate/interviews", label: "Interviews", icon: CalendarClock },
  ],
  recruiter: [
    { to: "/dashboard/recruiter", label: "Overview", icon: LayoutDashboard, end: true },
    { to: "/dashboard/recruiter/jobs/new", label: "Post a job", icon: PlusCircle },
    { to: "/dashboard/recruiter/jobs", label: "My jobs", icon: Briefcase, end: true },
    { to: "/dashboard/recruiter/applications", label: "Applications", icon: FileText },
    { to: "/dashboard/recruiter/pipeline", label: "Pipeline", icon: KanbanSquare },
    { to: "/dashboard/recruiter/candidates", label: "Search candidates", icon: Search },
    { to: "/dashboard/recruiter/messages", label: "Messages", icon: MessagesSquare },
    { to: "/dashboard/recruiter/interviews", label: "Interviews", icon: CalendarClock },
    { to: "/dashboard/recruiter/company", label: "Company", icon: Building2 },
    { to: "/dashboard/recruiter/coins", label: "Coins", icon: Coins },
    { to: "/dashboard/recruiter/packages", label: "Packages", icon: Package },
    { to: "/dashboard/recruiter/analytics", label: "Analytics", icon: LineChart },
  ],
  admin: [
    { to: "/dashboard/admin", label: "Overview", icon: LayoutDashboard, end: true },
    { to: "/dashboard/admin/users", label: "Users", icon: Users },
    { to: "/dashboard/admin/companies", label: "Companies", icon: Building2 },
    { to: "/dashboard/admin/jobs", label: "Jobs", icon: Briefcase },
    { to: "/dashboard/admin/approvals", label: "Approvals", icon: ShieldCheck },
    { to: "/dashboard/admin/packages", label: "Packages", icon: Package },
    { to: "/dashboard/admin/coins", label: "Coin rules", icon: Coins },
    { to: "/dashboard/admin/payments", label: "Payments", icon: CreditCard },
    { to: "/dashboard/admin/coupons", label: "Coupons", icon: Ticket },
    { to: "/dashboard/admin/reports", label: "Reports", icon: Flag },
    { to: "/dashboard/admin/cms", label: "Content", icon: FileEdit },
    { to: "/dashboard/admin/analytics", label: "Analytics", icon: LineChart },
    { to: "/dashboard/admin/settings", label: "Settings", icon: Settings },
    { to: "/dashboard/admin/audit", label: "Audit logs", icon: ScrollText },
  ],
};

export function DashboardLayout({ role }: { role: Role }) {
  const { user, loading, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();

  if (loading) return null;
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />;
  if (user.role !== role) return <Navigate to={`/dashboard/${user.role}`} replace />;
  if (!user.is_active) return <Navigate to="/suspended" replace />;

  const nav = NAVS[role];
  const roleLabel = role[0].toUpperCase() + role.slice(1);

  return (
    <div className="min-h-screen bg-slate-50">
      <button onClick={() => setOpen(true)} className="fixed left-4 top-3.5 z-50 rounded-lg border border-slate-200 bg-white p-2 shadow-sm lg:hidden" aria-label="Open menu">
        <Menu className="h-5 w-5" />
      </button>
      {open && <div className="fixed inset-0 z-40 bg-black/30 lg:hidden" onClick={() => setOpen(false)} />}

      <aside className={cn("fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform lg:translate-x-0", open ? "translate-x-0" : "-translate-x-full")}>
        <Link to={`/dashboard/${role}`} className="flex flex-col items-start justify-center pl-1.5">
          <img src="/src/pages/public/images/logo.png" alt="Talent Hai" className="h-8 w-auto object-contain" />
          <span className="mt-0.5 text-[10px] font-medium tracking-wide text-slate-500">
            Madhvi Corporate Consultancy
          </span>
        </Link>
        <div className="px-5 py-3"><span className="badge bg-slate-100 text-slate-500">{roleLabel} workspace</span></div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-6">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setOpen(false)}
              className={({ isActive }) => cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
                isActive ? "bg-brand-50 text-brand-700" : "text-ink-soft hover:bg-slate-100"
              )}
            >
              {({ isActive }) => (
                <>
                  <item.icon className={cn("h-4 w-4", isActive ? "text-brand-600" : "text-slate-400")} />
                  {item.label}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="lg:pl-64">
        <Topbar role={role} />
        <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function Topbar({ role }: { role: Role }) {
  const { user, logout } = useAuth();
  const { data } = useQuery({
    queryKey: ["unread"],
    queryFn: () => api.get<{ count: number }>("/notifications/unread-count"),
    refetchInterval: 30000,
  });
  const unread = data?.count ?? 0;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-end gap-3 border-b border-slate-200 bg-white/80 px-6 backdrop-blur">
      <Link to={`/dashboard/${role}/notifications`} className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Notifications">
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </Link>
      <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
          {initials(user?.full_name)}
        </span>
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium leading-tight text-ink">{user?.full_name}</p>
          <p className="text-xs leading-tight text-slate-400">{user?.email}</p>
        </div>
        <button onClick={logout} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-red-600" title="Log out">
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
