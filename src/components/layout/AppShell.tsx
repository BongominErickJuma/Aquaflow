import {
  ArrowRight,
  Bell,
  CalendarDays,
  Check,
  BriefcaseBusiness,
  CheckCheck,
  Coins,
  Droplets,
  Factory,
  LayoutDashboard,
  LoaderCircle,
  Menu,
  MessagesSquare,
  NotebookText,
  Search,
  ShieldCheck,
  ShoppingCart,
  Users,
  UsersRound,
  VibrateIcon,
  LogOut,
  UserCircle2,
  Mail,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../features/auth/AuthProvider";
import { useMessages } from "../../features/messages/MessagesProvider";
import { useNotifications } from "../../features/notifications/NotificationsProvider";
import { markAllMessagesRead, markMessageRead } from "../../lib/api/messages";
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "../../lib/api/notifications";
import { resolveApiAssetUrl } from "../../lib/api/auth";
import type { MessageItem } from "../../types/messages";
import type { NotificationModule } from "../../types/notifications";

type NavigationItem = {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  adminOnly: boolean;
  allowedRoles?: string[];
};

const navigation: NavigationItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard, adminOnly: false },
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
  { label: "CRM", href: "/crm", icon: MessagesSquare, adminOnly: false },
  { label: "Orders", href: "/orders", icon: VibrateIcon, adminOnly: false },
  { label: "Sales", href: "/sales", icon: ShoppingCart, adminOnly: false },
  {
    label: "Logs",
    href: "/sales-log",
    icon: NotebookText,
    adminOnly: false,
  },
  { label: "Finance", href: "/finance", icon: Coins, adminOnly: false },
  {
    label: "Members",
    href: "/members",
    icon: Users,
    adminOnly: false,
    allowedRoles: ["admin", "superuser"],
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

function formatMessageTime(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Unknown";
  }

  const now = new Date();
  const diffMs = now.getTime() - parsed.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  return `${diffDays}d ago`;
}

function getMessagePreview(message: MessageItem) {
  const normalized = message.body.replace(/\s+/g, " ").trim();
  return normalized.length > 96 ? `${normalized.slice(0, 96)}...` : normalized;
}

function formatWorkspaceDate() {
  return new Intl.DateTimeFormat("en-UG", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date());
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

export function AppShell() {
  const { logout, user } = useAuth();
  const {
    latest: latestMessages,
    unread: unreadMessages,
    isLoading: isMessagesLoading,
    refreshSummary: refreshMessageSummary,
  } = useMessages();
  const { latest, unread, isLoading, refreshSummary } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const notificationDropdownRef = useRef<HTMLDivElement | null>(null);
  const messagesDropdownRef = useRef<HTMLDivElement | null>(null);
  const profileDropdownRef = useRef<HTMLDivElement | null>(null);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isMessagesOpen, setIsMessagesOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileNavigationOpen, setIsMobileNavigationOpen] = useState(false);
  const [actionId, setActionId] = useState<number | string | "all" | null>(
    null,
  );
  const [messageActionId, setMessageActionId] = useState<
    number | string | "all" | null
  >(null);

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

  const visibleNavigation = navigation.filter(
    (item) =>
      (!item.adminOnly || isAdmin) &&
      (!item.allowedRoles || item.allowedRoles.includes(currentRoleCode)),
  );
  const currentSection =
    [...visibleNavigation]
      .sort((first, second) => second.href.length - first.href.length)
      .find((item) =>
        item.href === "/"
          ? location.pathname === "/"
          : location.pathname.startsWith(item.href),
      )?.label ?? "Workspace";

  // Close dropdowns when clicking outside
  useEffect(() => {
    if (!isNotificationOpen) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (!notificationDropdownRef.current?.contains(event.target as Node)) {
        setIsNotificationOpen(false);
      }
    };
    window.addEventListener("mousedown", handlePointerDown);
    return () => window.removeEventListener("mousedown", handlePointerDown);
  }, [isNotificationOpen]);

  useEffect(() => {
    if (!isMessagesOpen) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (!messagesDropdownRef.current?.contains(event.target as Node)) {
        setIsMessagesOpen(false);
      }
    };
    window.addEventListener("mousedown", handlePointerDown);
    return () => window.removeEventListener("mousedown", handlePointerDown);
  }, [isMessagesOpen]);

  useEffect(() => {
    if (!isProfileOpen) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (!profileDropdownRef.current?.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    window.addEventListener("mousedown", handlePointerDown);
    return () => window.removeEventListener("mousedown", handlePointerDown);
  }, [isProfileOpen]);

  useEffect(() => {
    setIsNotificationOpen(false);
    setIsMessagesOpen(false);
    setIsProfileOpen(false);
    setIsMobileNavigationOpen(false);
  }, [location.pathname]);

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

  const handleMarkMessageRead = async (messageId: number) => {
    setMessageActionId(`read-${messageId}`);
    try {
      await markMessageRead(messageId);
      await refreshMessageSummary();
    } catch {
      // Keep the dropdown usable even if a background action fails.
    } finally {
      setMessageActionId(null);
    }
  };

  const handleMarkAllMessagesRead = async () => {
    setMessageActionId("all");
    try {
      await markAllMessagesRead();
      await refreshMessageSummary();
    } catch {
      // Keep the dropdown usable even if a background action fails.
    } finally {
      setMessageActionId(null);
    }
  };

  const openMessage = async (message: MessageItem) => {
    if (!message.is_read) {
      await handleMarkMessageRead(message.id);
    }
    setIsMessagesOpen(false);
    navigate("/messages");
  };

  const handleLogout = () => {
    void logout();
  };

  return (
    <div className="h-screen bg-[var(--bg)] text-slate-900">
      <div className="flex h-screen w-full overflow-hidden shadow-[0_24px_80px_rgba(8,61,82,0.10)]">
        <aside className="hidden w-[252px] shrink-0 flex-col border-r border-white/10 bg-[linear-gradient(180deg,#0c4d62_0%,#0f6984_52%,#1389a8_100%)] text-white lg:flex">
          <div className="border-b border-white/10 px-5 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center border border-white/20 bg-white/10 shadow-[0_12px_24px_rgba(3,26,34,0.12)]">
                <Droplets className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.34em] text-white/60">
                  AquaFlow
                </p>
                <h1 className="mt-1 text-[2rem] font-semibold leading-none tracking-[-0.03em] text-white">
                  IBMS
                </h1>
              </div>
            </div>
          </div>

          <div className="scrollbar-hidden flex min-h-0 flex-1 flex-col overflow-y-auto px-3 py-5">
            <nav className="mt-4 space-y-1.5">
              {visibleNavigation.map(({ label, href, icon: Icon }) => (
                <NavLink
                  key={label}
                  to={href}
                  end={href === "/"}
                  className={({ isActive }) =>
                    [
                      "flex items-center gap-3 border px-4 py-3.5 text-[0.96rem] transition duration-200",
                      isActive
                        ? "border-white/18 bg-white/14 text-white shadow-[0_16px_30px_rgba(3,26,34,0.18)]"
                        : "border-transparent text-white/74 hover:border-white/10 hover:bg-white/8 hover:text-white",
                    ].join(" ")
                  }
                >
                  <Icon className="h-[15px] w-[15px]" />
                  <span>{label}</span>
                </NavLink>
              ))}
            </nav>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <motion.header
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="z-20 shrink-0 border-b border-[rgba(12,88,113,0.12)] bg-[linear-gradient(90deg,rgba(12,78,98,0.98),rgba(19,112,141,0.94)_48%,rgba(33,153,183,0.90))] px-4 py-4 shadow-[0_12px_34px_rgba(9,53,69,0.16)] sm:px-6 lg:px-7"
          >
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex items-center justify-between gap-3 xl:contents">
                <div className="flex min-w-0 items-center gap-3 sm:gap-4 xl:order-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileNavigationOpen((isOpen) => !isOpen);
                      setIsNotificationOpen(false);
                      setIsMessagesOpen(false);
                      setIsProfileOpen(false);
                    }}
                    className="flex h-11 w-11 shrink-0 items-center justify-center border border-white/16 bg-white/12 text-white transition hover:bg-white/16 lg:hidden"
                    aria-label={
                      isMobileNavigationOpen
                        ? "Close navigation"
                        : "Open navigation"
                    }
                    aria-controls="mobile-navigation"
                    aria-expanded={isMobileNavigationOpen}
                  >
                    {isMobileNavigationOpen ? (
                      <X className="h-5 w-5" />
                    ) : (
                      <Menu className="h-5 w-5" />
                    )}
                  </button>
                  <div className="min-w-0">
                    <p className="hidden text-[10px] font-semibold uppercase tracking-[0.32em] text-white/58 sm:block">
                      Active Module
                    </p>
                    <div className="flex min-w-0 flex-wrap items-center gap-2 sm:mt-1 sm:gap-3">
                      <h2 className="max-w-[42vw] truncate text-base font-semibold text-white sm:max-w-none sm:text-2xl sm:tracking-[-0.03em] lg:text-[2rem]">
                        {currentSection}
                      </h2>
                      <span className="hidden items-center gap-2 border border-white/14 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-white/74 sm:inline-flex">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {formatWorkspaceDate()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2 sm:gap-3 xl:order-3 xl:self-auto">
                  {/* Messages Dropdown */}
                  <div ref={messagesDropdownRef} className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        const nextOpenState = !isMessagesOpen;
                        setIsMessagesOpen(nextOpenState);
                        if (nextOpenState) {
                          setIsNotificationOpen(false);
                          setIsProfileOpen(false);
                          setIsMobileNavigationOpen(false);
                          void refreshMessageSummary();
                        }
                      }}
                      className="relative flex h-11 w-11 items-center justify-center border border-white/14 bg-white/12 text-white transition hover:bg-white/16 sm:h-12 sm:w-12"
                      aria-label="Messages"
                      aria-expanded={isMessagesOpen}
                    >
                      <Mail className="h-4 w-4" />
                      {unreadMessages > 0 ? (
                        <span className="absolute -right-1 -top-1 min-w-5 bg-amber-500 px-1.5 py-0.5 text-[10px] font-semibold text-white shadow-[0_8px_18px_rgba(245,158,11,0.35)]">
                          {unreadMessages > 99 ? "99+" : unreadMessages}
                        </span>
                      ) : null}
                    </button>

                    <AnimatePresence>
                      {isMessagesOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -10, scale: 0.95 }}
                          transition={{ duration: 0.2, ease: "easeOut" }}
                          className="mobile-header-menu absolute right-0 top-[calc(100%+12px)] z-30 w-[min(92vw,25rem)] border border-slate-200/90 bg-white/97 p-4 shadow-[0_28px_70px_rgba(15,23,42,0.16)] backdrop-blur-xl"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-700">
                                Messages
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => void handleMarkAllMessagesRead()}
                              disabled={
                                messageActionId === "all" ||
                                unreadMessages === 0
                              }
                              aria-label="Mark all messages as read"
                              title="Mark all read"
                              className="inline-flex h-9 w-9 items-center justify-center border border-slate-200 bg-white text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-70"
                            >
                              {messageActionId === "all" ? (
                                <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <CheckCheck className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </div>

                          <div className="mt-4 space-y-2">
                            {isMessagesLoading ? (
                              <div className="flex min-h-28 items-center justify-center border border-dashed border-slate-200 bg-slate-50/70 text-sm text-slate-500">
                                <div className="flex items-center gap-2">
                                  <LoaderCircle className="h-4 w-4 animate-spin" />
                                  Loading...
                                </div>
                              </div>
                            ) : latestMessages.length === 0 ? (
                              <div className="border border-dashed border-slate-200 bg-slate-50/70 px-4 py-6 text-center">
                                <p className="text-sm font-medium text-slate-700">
                                  No messages
                                </p>
                                <p className="mt-2 text-xs leading-6 text-slate-500">
                                  Your messages will appear here.
                                </p>
                              </div>
                            ) : (
                              latestMessages.map((message) => (
                                <motion.button
                                  key={message.id}
                                  whileHover={{ scale: 1.01 }}
                                  whileTap={{ scale: 0.99 }}
                                  type="button"
                                  onClick={() => void openMessage(message)}
                                  className={[
                                    "w-full border p-3 text-left transition-all duration-200",
                                    message.is_read
                                      ? "border-slate-200/80 bg-white hover:bg-slate-50"
                                      : "border-amber-200 bg-amber-50/70 hover:bg-amber-50",
                                  ].join(" ")}
                                >
                                  <div className="flex items-start gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-gradient-to-br from-amber-100 to-amber-200 text-amber-700">
                                      <span className="text-sm font-semibold">
                                        {message.created_by_name.charAt(0)}
                                      </span>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center justify-between gap-2">
                                        <p className="text-sm font-semibold text-slate-900">
                                          {message.created_by_name}
                                        </p>
                                        <div className="flex items-center gap-1">
                                          {!message.is_read && (
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                void handleMarkMessageRead(
                                                  message.id,
                                                );
                                              }}
                                              disabled={
                                                messageActionId ===
                                                `read-${message.id}`
                                              }
                                              className="inline-flex h-5 w-5 items-center justify-center border border-amber-200 bg-amber-100 text-amber-700 transition hover:bg-amber-200/70 disabled:opacity-70"
                                            >
                                              {messageActionId ===
                                              `read-${message.id}` ? (
                                                <LoaderCircle className="h-2.5 w-2.5 animate-spin" />
                                              ) : (
                                                <Check className="h-2.5 w-2.5" />
                                              )}
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                      <p className="mt-1 text-xs font-medium text-slate-800">
                                        {message.subject}
                                      </p>
                                      <p className="mt-0.5 text-xs text-slate-500 line-clamp-1">
                                        {getMessagePreview(message)}
                                      </p>
                                      <p className="mt-1.5 text-[10px] uppercase tracking-[0.18em] text-slate-400">
                                        {formatMessageTime(message.created_at)}
                                      </p>
                                    </div>
                                  </div>
                                </motion.button>
                              ))
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setIsMessagesOpen(false);
                              navigate("/messages");
                            }}
                            className="mt-4 inline-flex w-full items-center justify-center gap-2 border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                          >
                            View all messages
                            <ArrowRight className="h-4 w-4" />
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Notifications Dropdown */}
                  <div ref={notificationDropdownRef} className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        const nextOpenState = !isNotificationOpen;
                        setIsNotificationOpen(nextOpenState);
                        if (nextOpenState) {
                          setIsMessagesOpen(false);
                          setIsProfileOpen(false);
                          setIsMobileNavigationOpen(false);
                          void refreshSummary();
                        }
                      }}
                      className="relative flex h-11 w-11 items-center justify-center border border-white/14 bg-white/12 text-white transition hover:bg-white/16 sm:h-12 sm:w-12"
                      aria-label="Open notifications"
                      aria-expanded={isNotificationOpen}
                    >
                      <Bell className="h-4 w-4" />
                      {unread > 0 ? (
                        <span className="absolute -right-1 -top-1 min-w-5 bg-rose-500 px-1.5 py-0.5 text-[10px] font-semibold text-white shadow-[0_8px_18px_rgba(239,68,68,0.35)]">
                          {unread > 99 ? "99+" : unread}
                        </span>
                      ) : null}
                    </button>

                    <AnimatePresence>
                      {isNotificationOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -10, scale: 0.95 }}
                          transition={{ duration: 0.2, ease: "easeOut" }}
                          className="mobile-header-menu absolute right-0 top-[calc(100%+12px)] z-30 w-[min(92vw,25rem)] border border-slate-200/90 bg-white/97 p-4 shadow-[0_28px_70px_rgba(15,23,42,0.16)] backdrop-blur-xl"
                        >
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
                              className="inline-flex h-9 w-9 items-center justify-center border border-slate-200 bg-white text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-70"
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
                              <div className="flex min-h-28 items-center justify-center border border-dashed border-slate-200 bg-slate-50/70 text-sm text-slate-500">
                                <div className="flex items-center gap-2">
                                  <LoaderCircle className="h-4 w-4 animate-spin" />
                                  Loading...
                                </div>
                              </div>
                            ) : latest.length === 0 ? (
                              <div className="border border-dashed border-slate-200 bg-slate-50/70 px-4 py-6 text-center">
                                <p className="text-sm font-medium text-slate-700">
                                  No notifications yet
                                </p>
                                <p className="mt-2 text-xs leading-6 text-slate-500">
                                  New alerts from inventory, production, sales,
                                  and finance will appear here.
                                </p>
                              </div>
                            ) : (
                              latest.slice(0, 3).map((notification) => (
                                <motion.button
                                  key={notification.id}
                                  whileHover={{ scale: 1.01 }}
                                  whileTap={{ scale: 0.99 }}
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
                                    "w-full border p-4 text-left transition-all duration-200",
                                    notification.is_read
                                      ? "border-slate-200/80 bg-slate-50/55 hover:bg-white"
                                      : "border-sky-200 bg-sky-50/70 hover:bg-sky-50",
                                  ].join(" ")}
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <span className="border border-slate-200 bg-white/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                                          {formatModuleLabel(
                                            notification.module,
                                          )}
                                        </span>
                                        {!notification.is_read ? (
                                          <button
                                            type="button"
                                            onClick={(event) => {
                                              event.stopPropagation();
                                              void handleQuickMarkRead(
                                                notification.id,
                                              );
                                            }}
                                            disabled={
                                              actionId ===
                                              `read-${notification.id}`
                                            }
                                            aria-label={`Mark ${notification.title} as read`}
                                            title="Mark read"
                                            className="inline-flex h-6 w-6 items-center justify-center border border-sky-200 bg-sky-100 text-sky-700 transition hover:bg-sky-200/70 disabled:opacity-70"
                                          >
                                            {actionId ===
                                            `read-${notification.id}` ? (
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
                                    {formatNotificationTime(
                                      notification.created_at,
                                    )}
                                  </p>
                                </motion.button>
                              ))
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setIsNotificationOpen(false);
                              navigate("/notifications");
                            }}
                            className="mt-4 inline-flex w-full items-center justify-center gap-2 border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                          >
                            View more
                            <ArrowRight className="h-4 w-4" />
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Profile Dropdown */}
                  <div ref={profileDropdownRef} className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileOpen(!isProfileOpen);
                        setIsMessagesOpen(false);
                        setIsNotificationOpen(false);
                        setIsMobileNavigationOpen(false);
                      }}
                      className="flex h-11 items-center gap-2 border border-white/14 bg-white/12 px-2 text-white backdrop-blur-md transition hover:bg-white/16 sm:h-auto sm:gap-3 sm:px-3 sm:py-2"
                      aria-label="Profile menu"
                      aria-expanded={isProfileOpen}
                    >
                      {profilePhotoUrl ? (
                        <img
                          src={profilePhotoUrl}
                          alt={fullName}
                          className="h-9 w-9 object-cover sm:h-11 sm:w-11"
                        />
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center bg-white/18 text-sm font-semibold text-white sm:h-11 sm:w-11">
                          {initials || "IB"}
                        </div>
                      )}
                      <div className="hidden text-left sm:block">
                        <p className="text-sm font-semibold text-white">
                          {fullName}
                        </p>
                        <p className="text-xs uppercase tracking-[0.24em] text-white/58">
                          {user?.role.name ?? "Staff"}
                        </p>
                      </div>
                    </button>

                    <AnimatePresence>
                      {isProfileOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -10, scale: 0.95 }}
                          transition={{ duration: 0.2, ease: "easeOut" }}
                          className="mobile-header-menu absolute right-0 top-[calc(100%+12px)] z-30 w-56 border border-slate-200/90 bg-white/97 py-2 shadow-[0_28px_70px_rgba(15,23,42,0.16)] backdrop-blur-xl"
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setIsProfileOpen(false);
                              navigate("/settings/profile");
                            }}
                            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
                          >
                            <UserCircle2 className="h-4 w-4" />
                            <span>Profile</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setIsProfileOpen(false);
                              handleLogout();
                            }}
                            className="flex w-full items-center gap-3 border-t border-slate-200 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
                          >
                            <LogOut className="h-4 w-4" />
                            <span>Sign Out</span>
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              <label className="flex min-w-0 flex-1 items-center gap-3 border border-white/14 bg-white/12 px-4 py-3 text-white/78 backdrop-blur-md xl:order-2 xl:max-w-[640px]">
                <Search className="h-4 w-4 shrink-0" />
                <input
                  type="search"
                  placeholder="Search modules, alerts, and records..."
                  className="w-full bg-transparent text-[0.98rem] outline-none placeholder:text-white/56"
                />
              </label>
            </div>
          </motion.header>

          <AnimatePresence initial={false}>
            {isMobileNavigationOpen && (
              <motion.div
                id="mobile-navigation"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.24, ease: "easeOut" }}
                className="z-10 overflow-hidden border-b border-slate-200/70 bg-white/92 px-4 py-4 shadow-[0_18px_42px_rgba(15,23,42,0.12)] backdrop-blur-xl lg:hidden"
              >
                <nav className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {visibleNavigation.map(({ label, href, icon: Icon }) => (
                    <NavLink
                      key={label}
                      to={href}
                      end={href === "/"}
                      onClick={() => setIsMobileNavigationOpen(false)}
                      className={({ isActive }) =>
                        [
                          "flex min-h-12 items-center gap-2 border px-3 py-2.5 text-sm font-semibold transition",
                          isActive
                            ? "border-sky-200 bg-sky-100 text-slate-950"
                            : "border-slate-200 bg-white/86 text-slate-600 hover:border-slate-300 hover:text-slate-900",
                        ].join(" ")
                      }
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="min-w-0 truncate">{label}</span>
                    </NavLink>
                  ))}
                </nav>
              </motion.div>
            )}
          </AnimatePresence>

          <main className="scrollbar-hidden min-h-0 flex-1 overflow-y-auto bg-[linear-gradient(180deg,rgba(246,251,254,0.96),rgba(236,245,250,0.94))] px-4 py-5 sm:px-6 lg:overflow-hidden lg:px-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
