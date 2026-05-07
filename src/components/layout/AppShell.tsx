import {
  Mail,
  Sun,
  Moon,
  Menu,
  Settings,
  X,
  ArrowRight,
  Bell,
  Check,
  BriefcaseBusiness,
  CheckCheck,
  Coins,
  Droplets,
  Factory,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  NotebookText,
  ShieldCheck,
  ShoppingCart,
  UserCircle2,
  Users,
  UsersRound,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { startTransition, useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../features/auth/AuthProvider";
import { useNotifications } from "../../features/notifications/NotificationsProvider";
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "../../lib/api/notifications";
import { resolveApiAssetUrl } from "../../lib/api/auth";
import type { NotificationModule } from "../../types/notifications";

type NavigationItem = {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  adminOnly: boolean;
  allowedRoles?: string[];
};

const navigation: NavigationItem[] = [
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
    allowedRoles: ["admin", "superuser", "hr"],
  },
  {
    label: "Compliance",
    href: "/compliance",
    icon: ShieldCheck,
    adminOnly: false,
    allowedRoles: ["admin", "superuser", "hr"],
  },
  { label: "Sales", href: "/sales", icon: ShoppingCart, adminOnly: false },
  {
      label: "Logs",
    href: "/sales-log",
    icon: NotebookText,
    adminOnly: false,
  },
  { label: "Finance", href: "/finance", icon: Coins, adminOnly: false },
];

/* Placeholder Messages */
const placeholderMessages = [
  {
    id: 1,
    from: "Sarah Nakamura",
    subject: "Q3 Inventory Report",
    preview: "Please review the attached inventory summary for Q3...",
    time: "9:41 AM",
    read: false,
  },
  {
    id: 2,
    from: "James Okello",
    subject: "Production schedule update",
    preview: "The schedule for next week has been adjusted due to...",
    time: "Yesterday",
    read: false,
  },
  {
    id: 3,
    from: "Finance Team",
    subject: "Monthly reconciliation",
    preview: "Kindly confirm the figures shared in the spreadsheet...",
    time: "Mon",
    read: true,
  },
];

function formatNotificationTime(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat("en-UG", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(parsed);
}

function formatModuleLabel(module: NotificationModule) {
  return module.charAt(0).toUpperCase() + module.slice(1);
}

function getModuleRoute(module: NotificationModule) {
  return `/${module}`;
}

function getNotificationRoute(
  module: NotificationModule,
  targetPath: string | null | undefined,
) {
  return targetPath || getModuleRoute(module);
}


// ── Sidebar content extracted so it can be reused in both desktop and drawer ──
function SidebarContent({
  navigation,
  isAdmin,
  currentRoleCode,
  onNavigate,
  logout,
}: {
  navigation: NavigationItem[];
  isAdmin: boolean;
  currentRoleCode: string;
  onNavigate?: () => void;
  logout: () => void;
}) {
  return (
    <div className="flex h-full flex-col px-5 py-6 lg:px-6">
      <nav className="space-y-2">
        {navigation
          .filter(
            (item) =>
              (!item.adminOnly || isAdmin) &&
              (!item.allowedRoles ||
                item.allowedRoles.includes(currentRoleCode)),
          )
          .map(({ label, href, icon: Icon }) => (
            <NavLink
              key={label}
              to={href}
              end={href === "/"}
              onClick={onNavigate}
              className={({ isActive }) =>
                [
                  "flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm transition duration-200",
                  isActive
                    ? "border-sky-200 bg-sky-100/90 text-slate-900 shadow-[0_14px_40px_rgba(97,153,191,0.15)]"
                    : "border-transparent text-slate-600 hover:border-slate-200 hover:bg-white/80 hover:text-slate-900",
                ].join(" ")
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{label}</span>
            </NavLink>
          ))}
      </nav>

      <div className="mt-auto space-y-3 pt-6">
        {isAdmin ? (
          <NavLink
            to="/members"
            onClick={onNavigate}
            className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-3 text-sm text-slate-600 transition hover:border-slate-300 hover:bg-white hover:text-slate-900"
          >
            <Users className="h-4 w-4 shrink-0" />
            <span>Members</span>
          </NavLink>
        ) : null}
        <NavLink
          to="/settings/profile"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-3 text-sm text-slate-600 transition hover:border-slate-300 hover:bg-white hover:text-slate-900"
        >
          <UserCircle2 className="h-4 w-4 shrink-0" />
          <span>Profile Settings</span>
        </NavLink>
        <button
          type="button"
          onClick={() => {
            onNavigate?.();
            startTransition(() => {
              void logout();
            });
          }}
          className="flex w-full items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-3 text-left text-sm text-slate-600 transition hover:border-slate-300 hover:bg-white hover:text-slate-900"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}

export function AppShell() {
  const { logout, user } = useAuth();
  const { latest, unread, isLoading, refreshSummary } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();

  //REFS
  const messagesRef = useRef<HTMLDivElement | null>(null);
  const profileRef = useRef<HTMLDivElement | null>(null);

  //UI ST
  const [isMessagesOpen, setIsMessagesOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  
  const unreadMessages = placeholderMessages.filter((m) => !m.read).length;
  
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [actionId, setActionId] = useState<number | string | "all" | null>(
    null,
  );

  const [showToast, setShowToast] = useState(false); // added code
  const prevUnreadRef = useRef<number>(unread); //added code

  const fullName =
    [user?.first_name, user?.last_name].filter(Boolean).join(" ") ||
    user?.email ||
    "IBMS User";
  const profilePhotoUrl = resolveApiAssetUrl(user?.profile_photo ?? null);
  const isAdmin = user?.role.code === "admin";
  const currentRoleCode = user?.role.code ?? "";
  const initials = fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  useEffect(() => {
    if (!isNotificationOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!dropdownRef.current?.contains(event.target as Node)) {
        setIsNotificationOpen(false);
      }
    };

    window.addEventListener("mousedown", handlePointerDown);
    return () => window.removeEventListener("mousedown", handlePointerDown);
  }, [isNotificationOpen]);

  /*useEffect(() => {
    setIsNotificationOpen(false);
  }, [location.pathname]); */
  useEffect(() => {
    setIsNotificationOpen(false);
    setIsMessagesOpen(false);
    setIsProfileOpen(false);
    setIsSidebarOpen(false);
  }, [location.pathname]);

    //added code
    useEffect(() => {
    if (unread > prevUnreadRef.current) {
      setShowToast(true);
    }
    prevUnreadRef.current = unread;
  }, [unread]);

  useEffect(() => {
    if (!showToast) return;
    const timer = setTimeout(() => setShowToast(false), 5000);
    return () => clearTimeout(timer);
  }, [showToast]);

  useEffect(() => {
    document.body.style.overflow = isSidebarOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isSidebarOpen]);

  // added code ends here

  const openNotificationModule = async (
    notificationId: number,
    module: NotificationModule,
    targetPath: string,
    isRead: boolean,
  ) => {
    setActionId(notificationId);

    try {
      if (!isRead) {
        await markNotificationRead(notificationId);
        await refreshSummary();
      }
    } catch {
      // If the quick read call fails, still let the user open the module.
    } finally {
      setActionId(null);
      setIsNotificationOpen(false);
      navigate(getNotificationRoute(module, targetPath));
    }
  };

  const handleQuickMarkRead = async (notificationId: number) => {
    setActionId(`read-${notificationId}`);

    try {
      await markNotificationRead(notificationId);
      await refreshSummary();
    } catch {
      // Keep the dropdown usable even if a background action fails.
    } finally {
      setActionId(null);
    }
  };

  const handleMarkAllRead = async () => {
    setActionId("all");

    try {
      await markAllNotificationsRead();
      await refreshSummary();
    } catch {
      // Keep the dropdown usable even if a background action fails.
    } finally {
      setActionId(null);
    }
  };
  

  return (
    <div className="h-screen bg-[var(--bg)] text-slate-900">
      <div className="mx-auto flex h-screen max-w-[1600px] flex-col overflow-hidden">
        <motion.header
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="z-20 shrink-0 border-b border-slate-200/80 bg-[rgba(248,252,255,0.82)] py-4 px-4 backdrop-blur-xl sm:px-6 lg:px-8"
        >
          <div className="flex items-center justify-between gap-4">
            {/* Left: hamburger + logo */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsSidebarOpen(true)}
                className="flex items-center justify-center rounded-xl border border-slate-200/80 bg-white/80 p-2.5 text-slate-600 transition hover:bg-white hover:text-slate-900 lg:hidden"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-sky-200 bg-sky-100 shadow-[0_12px_30px_rgba(60,139,186,0.16)]">
                  <Droplets className="h-6 w-6 text-sky-700" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-sky-800/65">
                    AquaFlow
                  </p>
                  <h1 className="text-xl font-semibold tracking-[0.04em] text-slate-900">
                    AquaFlow Dashboard
                  </h1>
                </div>
              </div>
            </div>

            {/* Right: actions */}
            <div className="flex items-center gap-2">

              {/* Messages */}
              <div ref={messagesRef} className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setIsMessagesOpen((o) => !o);
                    setIsNotificationOpen(false);
                    setIsProfileOpen(false);
                  }}
                  className="relative flex items-center justify-center rounded-2xl border border-slate-200/80 bg-white/85 p-3 text-slate-600 shadow-[0_8px_24px_rgba(15,23,42,0.05)] transition hover:border-slate-300 hover:bg-white hover:text-slate-900"
                  aria-label="Open messages"
                >
                  <Mail className="h-4 w-4" />
                  {unreadMessages > 0 && (
                    <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-emerald-500 px-1.5 py-0.5 text-[10px] font-semibold text-white shadow-[0_8px_18px_rgba(16,185,129,0.35)]">
                      {unreadMessages}
                    </span>
                  )}
                </button>
                <AnimatePresence>
                  {isMessagesOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.97 }}
                      transition={{ duration: 0.18 }}
                      className="absolute right-0 top-[calc(100%+12px)] z-30 w-[min(92vw,22rem)] rounded-[28px] border border-slate-200/90 bg-white/96 p-4 shadow-[0_25px_70px_rgba(15,23,42,0.14)] backdrop-blur-xl"
                    >
                      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-emerald-600">
                        Messages
                      </p>
                      <div className="space-y-2">
                        {placeholderMessages.map((msg) => (
                          <div
                            key={msg.id}
                            className={[
                              "rounded-[18px] border p-3 cursor-pointer transition",
                              msg.read
                                ? "border-slate-200/80 bg-slate-50/60"
                                : "border-emerald-200 bg-emerald-50/60",
                            ].join(" ")}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs font-semibold text-slate-800">{msg.from}</p>
                              <p className="text-[10px] text-slate-400">{msg.time}</p>
                            </div>
                            <p className="mt-0.5 text-xs font-medium text-slate-700">{msg.subject}</p>
                            <p className="mt-1 truncate text-[11px] text-slate-400">{msg.preview}</p>
                          </div>
                        ))}
                      </div>
                      <button
                        type="button"
                        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                      >
                        View all messages
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Notifications — your existing bell button unchanged */}
              <div ref={dropdownRef} className="relative">
                <button
                  type="button"
                  onClick={() => {
                    const nextOpenState = !isNotificationOpen;
                    setIsNotificationOpen(nextOpenState);
                    setIsMessagesOpen(false);
                    setIsProfileOpen(false);
                    if (nextOpenState) void refreshSummary();
                  }}
                  className="relative flex items-center justify-center rounded-2xl border border-slate-200/80 bg-white/85 p-3 text-slate-600 shadow-[0_8px_24px_rgba(15,23,42,0.05)] transition hover:border-slate-300 hover:bg-white hover:text-slate-900"
                  aria-label="Open notifications"
                  aria-expanded={isNotificationOpen}
                >
                  <Bell className="h-4 w-4" />
                  {unread > 0 ? (
                    <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-semibold text-white shadow-[0_8px_18px_rgba(239,68,68,0.35)]">
                      {unread > 99 ? "99+" : unread}
                    </span>
                  ) : null}
                </button>

                {isNotificationOpen ? (
                  <div className="absolute right-0 top-[calc(100%+12px)] z-30 w-[min(92vw,24rem)] rounded-[28px] border border-slate-200/90 bg-white/96 p-4 shadow-[0_25px_70px_rgba(15,23,42,0.14)] backdrop-blur-xl">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-700">
                          Notifications
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => void handleMarkAllRead()}
                        disabled={actionId === "all" || unread === 0}
                        aria-label="Mark all notifications as read"
                        title="Mark all read"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-70"
                      >
                        {actionId === "all" ? (
                          <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <CheckCheck className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                    <div className="mt-4 space-y-3">
                      {isLoading ? (
                        <div className="flex min-h-28 items-center justify-center rounded-[24px] border border-dashed border-slate-200 bg-slate-50/70 text-sm text-slate-500">
                          <div className="flex items-center gap-2">
                            <LoaderCircle className="h-4 w-4 animate-spin" />
                            Loading...
                          </div>
                        </div>
                      ) : latest.length === 0 ? (
                        <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50/70 px-4 py-6 text-center">
                          <p className="text-sm font-medium text-slate-700">
                            No notifications yet
                          </p>
                          <p className="mt-2 text-xs leading-6 text-slate-500">
                            New alerts from inventory, production, sales, and finance will appear here.
                          </p>
                        </div>
                      ) : (
                        latest.slice(0, 3).map((notification) => (
                          <button
                            key={notification.id}
                            type="button"
                            onClick={() =>
                              void openNotificationModule(
                                notification.id,
                                notification.module,
                                notification.target_path,
                                notification.is_read,
                              )
                            }
                            className={[
                              "w-full rounded-[24px] border p-4 text-left transition",
                              notification.is_read
                                ? "border-slate-200/80 bg-slate-50/55 hover:bg-white"
                                : "border-sky-200 bg-sky-50/70 hover:bg-sky-50",
                            ].join(" ")}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="rounded-full border border-slate-200 bg-white/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                                    {formatModuleLabel(notification.module)}
                                  </span>
                                  {!notification.is_read ? (
                                    <button
                                      type="button"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        void handleQuickMarkRead(notification.id);
                                      }}
                                      disabled={actionId === `read-${notification.id}`}
                                      aria-label={`Mark ${notification.title} as read`}
                                      title="Mark read"
                                      className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-sky-200 bg-sky-100 text-sky-700 transition hover:bg-sky-200/70 disabled:opacity-70"
                                    >
                                      {actionId === `read-${notification.id}` ? (
                                        <LoaderCircle className="h-3 w-3 animate-spin" />
                                      ) : (
                                        <Check className="h-3 w-3" />
                                      )}
                                    </button>
                                  ) : null}
                                </div>
                                <p className="mt-3 text-sm font-semibold text-slate-900">
                                  {notification.title}
                                </p>
                                <p className="mt-1 text-xs leading-5 text-slate-500">
                                  {notification.message}
                                </p>
                              </div>
                              {actionId === notification.id ? (
                                <LoaderCircle className="mt-1 h-4 w-4 shrink-0 animate-spin text-slate-400" />
                              ) : (
                                <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-slate-400" />
                              )}
                            </div>
                            <p className="mt-3 text-[11px] uppercase tracking-[0.22em] text-slate-400">
                              {formatNotificationTime(notification.created_at)}
                            </p>
                          </button>
                        ))
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsNotificationOpen(false);
                        navigate("/notifications");
                      }}
                      className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                    >
                      View more
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                ) : null}
              </div>

              {/* Profile avatar + dropdown */}
              <div ref={profileRef} className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileOpen((o) => !o);
                    setIsNotificationOpen(false);
                    setIsMessagesOpen(false);
                  }}
                  className="flex items-center gap-2.5 rounded-xl p-1 transition hover:bg-slate-100"
                  aria-label="Open profile menu"
                >
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
                    <p className="text-sm font-semibold text-slate-900">{fullName}</p>
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                      {user?.role.name ?? "Staff"}
                    </p>
                  </div>
                </button>

                <AnimatePresence>
                  {isProfileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.97 }}
                      transition={{ duration: 0.18 }}
                      className="absolute right-0 top-[calc(100%+10px)] z-30 w-52 rounded-[20px] border border-slate-200/90 bg-white/96 p-2 shadow-[0_20px_60px_rgba(15,23,42,0.12)] backdrop-blur-xl"
                    >
                      <div className="mb-1 px-3 py-2.5">
                        <p className="text-sm font-semibold text-slate-900">{fullName}</p>
                        <p className="text-xs text-slate-400">{user?.email}</p>
                      </div>
                      <div className="my-1 h-px bg-slate-100" />
                      <button
                        type="button"
                        onClick={() => { setIsProfileOpen(false); navigate("/profile"); }}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
                      >
                        <UserCircle2 className="h-4 w-4 text-slate-400" />
                        My Profile
                      </button>
                      <button
                        type="button"
                        onClick={() => { setIsProfileOpen(false); navigate("/settings/profile"); }}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
                      >
                        <Settings className="h-4 w-4 text-slate-400" />
                        Settings
                      </button>
                      <div className="my-1 h-px bg-slate-100" />
                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileOpen(false);
                          startTransition(() => { void logout(); });
                        }}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-red-600 transition hover:bg-red-50"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </div>
          </div>
        </motion.header>

        <div className="relative grid min-h-0 flex-1 overflow-hidden lg:grid-cols-[280px_minmax(0,1fr)]">

          {/* Mobile drawer backdrop */}
          <AnimatePresence>
            {isSidebarOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
                onClick={() => setIsSidebarOpen(false)}
              />
            )}
          </AnimatePresence>

          {/* Sidebar — desktop: static, mobile: drawer */}
          {/* Desktop */}
          <aside className="hidden h-full min-h-0 flex-col border-r border-slate-200/80 bg-[linear-gradient(180deg,rgba(245,250,255,0.96),rgba(232,242,248,0.96))] overflow-y-auto shrink-0 dark:border-slate-800 dark:bg-slate-900/80 lg:flex">
            <SidebarContent
              navigation={navigation}
              isAdmin={isAdmin}
              currentRoleCode={currentRoleCode}
              logout={logout}
            />
          </aside>

          {/* Mobile drawer */}
          <AnimatePresence>
            {isSidebarOpen && (
              <motion.aside
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", damping: 28, stiffness: 280 }}
                className="fixed left-0 top-0 z-50 flex h-full w-72 flex-col border-r border-slate-200/80 bg-[linear-gradient(180deg,rgba(245,250,255,0.98),rgba(232,242,248,0.98))] overflow-y-auto shadow-[4px_0_40px_rgba(15,23,42,0.12)] dark:border-slate-800 dark:bg-slate-900 lg:hidden"
              >
                {/* Drawer header */}
                <div className="flex items-center justify-between border-b border-slate-200/80 px-5 py-4 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-sky-200 bg-sky-100 dark:border-sky-800 dark:bg-sky-900/50">
                      <Droplets className="h-4 w-4 text-sky-700 dark:text-sky-400" />
                    </div>
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">
                      AquaFlow
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsSidebarOpen(false)}
                    className="flex items-center justify-center rounded-xl border border-slate-200/80 bg-white/80 p-2 text-slate-600 transition hover:bg-white dark:border-slate-700 dark:bg-white/5 dark:text-slate-400"
                    aria-label="Close menu"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <SidebarContent
                  navigation={navigation}
                  isAdmin={isAdmin}
                  currentRoleCode={currentRoleCode}
                  onNavigate={() => setIsSidebarOpen(false)}
                  logout={logout}
                />
              </motion.aside>
            )}
          </AnimatePresence>

          {/* Main content */}
          <main className="min-h-0 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
            <Outlet />
          </main>
        </div>


        
            {showToast && (
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/95 px-5 py-3.5 shadow-[0_25px_70px_rgba(15,23,42,0.14)] backdrop-blur-xl">
        <div className="relative flex items-center justify-center">
          <Bell className="h-5 w-5 text-sky-600" />
          <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-white">
            1
          </span>
        </div>
        <p className="text-sm font-semibold text-slate-700">New alert received</p>
        <div className="mx-1 h-5 w-px bg-slate-200" />
        <button
          type="button"
          onClick={() => setShowToast(false)}
          className="text-slate-400 transition hover:text-slate-600"
          aria-label="Dismiss notification"
        >
          ✕
        </button>
      </div>
    )}
      </div>
      
    </div>
  );
}

/* 


*/