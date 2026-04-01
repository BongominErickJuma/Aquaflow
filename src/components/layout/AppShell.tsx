import {
  Bell,
  BriefcaseBusiness,
  Coins,
  Droplets,
  Factory,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  ShoppingCart,
  UserCircle2,
  Users,
  UsersRound,
} from "lucide-react";
import { motion } from "framer-motion";
import { startTransition } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../../features/auth/AuthProvider";
import { resolveApiAssetUrl } from "../../lib/api/auth";

const navigation = [
  { label: "Overview", href: "/", icon: LayoutDashboard, adminOnly: false },
  {
    label: "Business",
    href: "/business",
    icon: BriefcaseBusiness,
    adminOnly: false,
  },
  { label: "Inventory", href: "/inventory", icon: Droplets, adminOnly: false },
  { label: "Production", href: "/production", icon: Factory, adminOnly: false },
  {
    label: "Workforce",
    href: "/workforce",
    icon: UsersRound,
    adminOnly: false,
  },
  {
    label: "Compliance",
    href: "/compliance",
    icon: ShieldCheck,
    adminOnly: false,
  },
  { label: "Sales", href: "/sales", icon: ShoppingCart, adminOnly: false },
  { label: "Finance", href: "/finance", icon: Coins, adminOnly: false },
];

export function AppShell() {
  const { logout, user } = useAuth();
  const fullName =
    [user?.first_name, user?.last_name].filter(Boolean).join(" ") ||
    user?.email ||
    "IBMS User";
  const profilePhotoUrl = resolveApiAssetUrl(user?.profile_photo ?? null);
  const isAdmin = user?.role.code === "admin";
  const initials = fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div className="h-screen bg-[var(--bg)] text-slate-900">
      <div className="mx-auto flex h-screen max-w-[1600px] flex-col overflow-hidden">
        <motion.header
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="z-20 shrink-0 border-b border-slate-200/80 bg-[rgba(248,252,255,0.82)] py-4 pl-4 pr-0 backdrop-blur-xl sm:pl-6 sm:pr-0 lg:pl-8 lg:pr-0"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-sky-200 bg-sky-100 shadow-[0_12px_30px_rgba(60,139,186,0.16)]">
                <Droplets className="h-6 w-6 text-sky-700" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-sky-800/65">
                  AquaFlow
                </p>
                <h1 className="text-xl font-semibold tracking-[0.04em] text-slate-900">
                  IBMS Dashboard
                </h1>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                className="flex items-center justify-center rounded-2xl border border-slate-200/80 bg-white/85 p-3 text-slate-600 shadow-[0_8px_24px_rgba(15,23,42,0.05)] transition hover:border-slate-300 hover:bg-white hover:text-slate-900"
              >
                <Bell className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/88 px-3 py-2 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
                {profilePhotoUrl ? (
                  <img
                    src={profilePhotoUrl}
                    alt={fullName}
                    className="h-11 w-11 rounded-2xl object-cover"
                  />
                ) : (
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-100 text-sm font-semibold text-sky-700">
                    {initials || "IB"}
                  </div>
                )}
                <div className="hidden text-left sm:block">
                  <p className="text-sm font-semibold text-slate-900">
                    {fullName}
                  </p>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                    {user?.role.name ?? "Staff"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.header>

        <div className="grid min-h-0 flex-1 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="flex h-full min-h-0 flex-col border-r border-slate-200/80 bg-[linear-gradient(180deg,rgba(245,250,255,0.96),rgba(232,242,248,0.96))] px-5 py-6 lg:px-6">
            <nav className="space-y-2">
              {navigation
                .filter((item) => !item.adminOnly || isAdmin)
                .map(({ label, href, icon: Icon }) => (
                  <NavLink
                    key={label}
                    to={href}
                    end={href === "/"}
                    className={({ isActive }) =>
                      [
                        "flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm transition duration-200",
                        isActive
                          ? "border-sky-200 bg-sky-100/90 text-slate-900 shadow-[0_14px_40px_rgba(97,153,191,0.15)]"
                          : "border-transparent text-slate-600 hover:border-slate-200 hover:bg-white/80 hover:text-slate-900",
                      ].join(" ")
                    }
                  >
                    <Icon className="h-4 w-4" />
                    <span>{label}</span>
                  </NavLink>
                ))}
            </nav>

            <div className="mt-auto space-y-3 pt-6">
              {isAdmin ? (
                <NavLink
                  to="/members"
                  className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-3 text-sm text-slate-600 transition hover:border-slate-300 hover:bg-white hover:text-slate-900"
                >
                  <Users className="h-4 w-4" />
                  <span>Members</span>
                </NavLink>
              ) : null}
              <NavLink
                to="/settings/profile"
                className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-3 text-sm text-slate-600 transition hover:border-slate-300 hover:bg-white hover:text-slate-900"
              >
                <UserCircle2 className="h-4 w-4" />
                <span>Profile Settings</span>
              </NavLink>
              <button
                type="button"
                onClick={() => {
                  startTransition(() => {
                    void logout();
                  });
                }}
                className="flex w-full items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-3 text-left text-sm text-slate-600 transition hover:border-slate-300 hover:bg-white hover:text-slate-900"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </aside>

          <main className="min-h-0 overflow-y-auto py-6 pl-4 pr-0 sm:pl-6 sm:pr-0 lg:pl-8 lg:pr-0">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
