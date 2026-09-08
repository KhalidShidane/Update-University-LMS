import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Menu, LogOut, User as UserIcon, ChevronDown } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { RoleBadge } from "./ui";
import Avatar from "./Avatar";
import NotificationBell from "./NotificationBell";

export default function DashboardLayout({ title, nav }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => setOpen(false), [location.pathname]);

  useEffect(() => {
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const profilePath = `/${user?.role}/profile`;

  const SidebarInner = (
    <>
      <div className="flex h-16 items-center gap-2.5 px-6">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white p-1 ring-1 ring-white/15">
          <img src="/hormuud-logo.png" alt="Hormuud University" className="h-full w-full object-contain" />
        </span>
        <div className="leading-tight">
          <p className="font-display text-[15px] font-bold text-white">Hormuud University LMS</p>
          <p className="text-[11px] font-medium text-white/50">{title} workspace</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-4 py-4">
        <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-white/35">Menu</p>
        {nav.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => `nav-link ${isActive ? "nav-link-active" : ""}`}
          >
            {Icon && <Icon className="h-[18px] w-[18px] shrink-0" />}
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3">
          <Avatar name={user?.fullName} src={user?.avatarUrl} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{user?.fullName}</p>
            <p className="truncate text-xs text-white/50">{user?.email}</p>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-slate-50 lg:flex">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-accent-950 lg:flex">
        {SidebarInner}
      </aside>

      {/* Mobile drawer */}
      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-ink/50 backdrop-blur-sm lg:hidden" onClick={() => setOpen(false)} />
          <aside className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-accent-950 lg:hidden">
            {SidebarInner}
          </aside>
        </>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur-md lg:px-8">
          <div className="flex items-center gap-3">
            <button
              className="rounded-lg p-2 text-ink-soft transition hover:bg-slate-100 lg:hidden"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="hidden text-sm font-medium text-ink-muted sm:block">
              {title} Dashboard
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <NotificationBell />
            <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white py-1.5 pl-1.5 pr-2.5 shadow-sm transition hover:bg-slate-50"
            >
              <Avatar name={user?.fullName} src={user?.avatarUrl} size="sm" />
              <span className="hidden text-left sm:block">
                <span className="block text-sm font-semibold leading-tight text-ink">
                  {user?.fullName?.split(" ")[0]}
                </span>
                <span className="block text-[11px] capitalize leading-tight text-ink-muted">
                  {user?.role}
                </span>
              </span>
              <ChevronDown className="h-4 w-4 text-ink-muted" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-60 animate-slide-up overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-pop">
                <div className="flex items-center gap-3 border-b border-slate-100 p-4">
                  <Avatar name={user?.fullName} src={user?.avatarUrl} size="md" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">{user?.fullName}</p>
                    <RoleBadge role={user?.role} className="mt-1" />
                  </div>
                </div>
                <div className="p-1.5">
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      navigate(profilePath);
                    }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-ink-soft transition hover:bg-slate-100"
                  >
                    <UserIcon className="h-4 w-4" /> My Profile
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                  >
                    <LogOut className="h-4 w-4" /> Sign out
                  </button>
                </div>
              </div>
            )}
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 lg:px-8 lg:py-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
