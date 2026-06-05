import {
  AlertTriangle,
  ArrowUpRight,
  Bell,
  Check,
  CheckCheck,
  LoaderCircle,
  RefreshCw,
  Trash,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../features/auth/AuthProvider";
import { useNotifications } from "../features/notifications/NotificationsProvider";
import { ApiError } from "../lib/api/auth";
import {
  bulkDeleteNotifications,
  deleteNotification,
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../lib/api/notifications";
import type {
  NotificationDeleteWarning,
  NotificationItem,
  NotificationModule,
} from "../types/notifications";

type NotificationFilter = "all" | "unread";

function formatTimestamp(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat("en-UG", {
    day: "numeric",
    month: "short",
    year: "numeric",
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

function getNotificationRoute(notification: NotificationItem) {
  return notification.target_path || getModuleRoute(notification.module);
}

function getSeverityClasses(severity: NotificationItem["severity"]) {
  switch (severity) {
    case "critical":
      return "border-red-200 bg-red-50 text-red-700";
    case "high":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "medium":
      return "border-sky-200 bg-sky-50 text-sky-700";
    default:
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
}

function getStatusClasses(status: NotificationItem["status"]) {
  return status === "resolved"
    ? "border-slate-200 bg-slate-100 text-slate-600"
    : "border-sky-200 bg-sky-50 text-sky-700";
}

export function NotificationsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { refreshSummary } = useNotifications();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [filter, setFilter] = useState<NotificationFilter>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [actionId, setActionId] = useState<number | "bulk" | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [deleteWarning, setDeleteWarning] = useState<{
    notificationIds: number[];
    notificationTitle?: string;
    warning: NotificationDeleteWarning;
  } | null>(null);

  const isAdmin = user?.role.code === "admin";

  const loadNotifications = async (showRefreshState = false) => {
    if (showRefreshState) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError("");

    try {
      const response = await fetchNotifications();
      setNotifications(response);
    } catch (nextError) {
      if (nextError instanceof ApiError) {
        setError(nextError.message);
      } else {
        setError("Unable to load notifications right now.");
      }
    } finally {
      if (showRefreshState) {
        setIsRefreshing(false);
      } else {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    void loadNotifications();
  }, []);

  useEffect(() => {
    setSelectedIds((current) =>
      current.filter((id) =>
        notifications.some((notification) => notification.id === id),
      ),
    );
  }, [notifications]);

  const filteredNotifications = useMemo(() => {
    if (filter === "unread") {
      return notifications.filter((notification) => !notification.is_read);
    }

    return notifications;
  }, [filter, notifications]);

  const summary = useMemo(() => {
    const unread = notifications.filter(
      (notification) => !notification.is_read,
    ).length;
    const resolved = notifications.filter(
      (notification) => notification.status === "resolved",
    ).length;

    return {
      total: notifications.length,
      unread,
      resolved,
    };
  }, [notifications]);

  const allVisibleSelected =
    filteredNotifications.length > 0 &&
    filteredNotifications.every((notification) =>
      selectedIds.includes(notification.id),
    );

  const toggleSelection = (notificationId: number) => {
    setSelectedIds((current) =>
      current.includes(notificationId)
        ? current.filter((id) => id !== notificationId)
        : [...current, notificationId],
    );
  };

  const toggleSelectAllVisible = () => {
    if (allVisibleSelected) {
      setSelectedIds((current) =>
        current.filter(
          (id) =>
            !filteredNotifications.some(
              (notification) => notification.id === id,
            ),
        ),
      );
      return;
    }

    setSelectedIds((current) => [
      ...new Set([
        ...current,
        ...filteredNotifications.map((notification) => notification.id),
      ]),
    ]);
  };

  const handleMarkRead = async (notificationId: number) => {
    setActionId(notificationId);
    setMessage("");
    setError("");

    try {
      const updated = await markNotificationRead(notificationId);
      setNotifications((current) =>
        current.map((notification) =>
          notification.id === updated.id ? updated : notification,
        ),
      );
      await refreshSummary();
    } catch (nextError) {
      if (nextError instanceof ApiError) {
        setError(nextError.message);
      } else {
        setError("Unable to update this notification right now.");
      }
    } finally {
      setActionId(null);
    }
  };

  const handleMarkAllRead = async () => {
    setIsMarkingAll(true);
    setMessage("");
    setError("");

    try {
      const response = await markAllNotificationsRead();
      setMessage(response.detail);
      await loadNotifications(true);
      await refreshSummary();
    } catch (nextError) {
      if (nextError instanceof ApiError) {
        setError(nextError.message);
      } else {
        setError("Unable to mark notifications as read right now.");
      }
    } finally {
      setIsMarkingAll(false);
    }
  };

  const beginDelete = async (notification: NotificationItem) => {
    setActionId(notification.id);
    setMessage("");
    setError("");

    try {
      await deleteNotification(notification.id);
      setNotifications((current) =>
        current.filter((item) => item.id !== notification.id),
      );
      setMessage("Notification deleted successfully.");
      await refreshSummary();
    } catch (nextError) {
      if (
        nextError instanceof ApiError &&
        nextError.status === 409 &&
        nextError.data &&
        typeof nextError.data === "object"
      ) {
        setDeleteWarning({
          notificationIds: [notification.id],
          notificationTitle: notification.title,
          warning: nextError.data as NotificationDeleteWarning,
        });
      } else if (nextError instanceof ApiError) {
        setError(nextError.message);
      } else {
        setError("Unable to delete this notification right now.");
      }
    } finally {
      setActionId(null);
    }
  };

  const beginBulkDelete = async () => {
    if (selectedIds.length === 0) {
      return;
    }

    setActionId("bulk");
    setMessage("");
    setError("");

    try {
      const response = await bulkDeleteNotifications(selectedIds);
      if (response && "deleted" in response) {
        setNotifications((current) =>
          current.filter((item) => !selectedIds.includes(item.id)),
        );
        setSelectedIds([]);
        setMessage("Selected notifications deleted successfully.");
        await refreshSummary();
      }
    } catch (nextError) {
      if (
        nextError instanceof ApiError &&
        nextError.status === 409 &&
        nextError.data &&
        typeof nextError.data === "object"
      ) {
        setDeleteWarning({
          notificationIds: [...selectedIds],
          warning: nextError.data as NotificationDeleteWarning,
        });
      } else if (nextError instanceof ApiError) {
        setError(nextError.message);
      } else {
        setError("Unable to delete the selected notifications right now.");
      }
    } finally {
      setActionId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteWarning) {
      return;
    }

    const targetIds = deleteWarning.notificationIds;
    setActionId(targetIds.length > 1 ? "bulk" : targetIds[0]);

    try {
      if (targetIds.length > 1) {
        await bulkDeleteNotifications(targetIds, true);
      } else {
        await deleteNotification(targetIds[0], true);
      }
      setNotifications((current) =>
        current.filter((item) => !targetIds.includes(item.id)),
      );
      setSelectedIds((current) =>
        current.filter((id) => !targetIds.includes(id)),
      );
      setDeleteWarning(null);
      setMessage(
        targetIds.length > 1
          ? "Selected notifications deleted successfully."
          : "Notification deleted successfully.",
      );
      await refreshSummary();
    } catch (nextError) {
      if (nextError instanceof ApiError) {
        setError(nextError.message);
      } else {
        setError("Unable to delete this notification right now.");
      }
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="module-page">
      <section className="rounded-[32px] border border-white/70 bg-[radial-gradient(circle_at_top_left,#ffffff,rgba(224,242,254,0.92)_52%,rgba(240,249,255,0.95))] py-6 pl-6 pr-0 shadow-[0_25px_80px_rgba(148,163,184,0.14)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/75 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-sky-700">
              Notifications
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
                Notification Center
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-slate-600">
                Track important alerts across inventory, production, sales, and
                finance. Read status is tracked per internal member.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
            <div className="hero-metric-card">
              <p className="hero-metric-label">Total</p>
              <p className="hero-metric-value">{summary.total}</p>
            </div>
            <div className="hero-metric-card">
              <p className="hero-metric-label">Unread</p>
              <p className="hero-metric-value">{summary.unread}</p>
            </div>
            <div className="hero-metric-card">
              <p className="hero-metric-label">Resolved</p>
              <p className="hero-metric-value">{summary.resolved}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="module-page-stage justify-start">
        <section className="panel p-6">
          <div className="flex flex-col gap-4">
            <div className="scrollbar-hidden overflow-x-auto rounded-[28px] border border-slate-200/80 bg-slate-50/70 p-2">
              <div className="flex min-w-max items-center gap-2">
                  {isAdmin ? (
                    <button
                      type="button"
                      onClick={toggleSelectAllVisible}
                      disabled={filteredNotifications.length === 0}
                      aria-label={
                        allVisibleSelected
                          ? "Clear shown notifications"
                          : "Select shown notifications"
                      }
                      title={
                        allVisibleSelected
                          ? "Clear shown notifications"
                          : "Select shown notifications"
                      }
                      className="inline-flex h-10 shrink-0 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-70"
                    >
                      {allVisibleSelected ? (
                        <X className="h-4 w-4" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                      <span className="hidden sm:inline">
                        {allVisibleSelected ? "Clear shown" : "Select shown"}
                      </span>
                    </button>
                  ) : null}

                  <div className="inline-flex h-10 shrink-0 items-center rounded-2xl border border-slate-200 bg-white p-1">
                    <button
                      type="button"
                      onClick={() => setFilter("all")}
                      className={[
                        "h-8 rounded-[0.9rem] px-3 text-sm font-semibold transition",
                        filter === "all"
                          ? "bg-sky-50 text-sky-700 shadow-[0_10px_24px_rgba(15,23,42,0.08)]"
                          : "text-slate-500 hover:text-slate-900",
                      ].join(" ")}
                    >
                      <span className="sm:hidden">All</span>
                      <span className="hidden sm:inline">
                        All notifications
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilter("unread")}
                      className={[
                        "h-8 rounded-[0.9rem] px-3 text-sm font-semibold transition",
                        filter === "unread"
                          ? "bg-sky-50 text-sky-700 shadow-[0_10px_24px_rgba(15,23,42,0.08)]"
                          : "text-slate-500 hover:text-slate-900",
                      ].join(" ")}
                    >
                      <span className="sm:hidden">Unread</span>
                      <span className="hidden sm:inline">Unread only</span>
                    </button>
                  </div>

                  {isAdmin && selectedIds.length > 0 ? (
                    <span className="inline-flex h-10 shrink-0 items-center rounded-2xl border border-sky-200 bg-sky-50 px-3 text-sm font-semibold text-sky-700">
                      {selectedIds.length} selected
                    </span>
                  ) : null}
                <div className="ml-auto flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void handleMarkAllRead()}
                    disabled={isMarkingAll || summary.unread === 0}
                    aria-label="Mark all notifications as read"
                    title="Mark all read"
                    className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-sky-200 bg-[linear-gradient(135deg,#1f87ad,#0f6d8d)] text-white shadow-[0_12px_30px_rgba(32,141,183,0.22)] transition hover:brightness-110 disabled:opacity-70"
                  >
                    {isMarkingAll ? (
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCheck className="h-4 w-4" />
                    )}
                  </button>
                  {isAdmin && selectedIds.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => void beginBulkDelete()}
                      disabled={actionId === "bulk" || selectedIds.length === 0}
                      aria-label="Delete selected notifications"
                      title="Delete selected"
                      className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-red-200 bg-red-50 text-red-700 transition hover:bg-red-100 disabled:opacity-70"
                    >
                      {actionId === "bulk" ? (
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash className="h-4 w-4" />
                      )}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => void loadNotifications(true)}
                    disabled={isRefreshing}
                    aria-label="Refresh notifications"
                    title="Refresh"
                    className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-70"
                  >
                    {isRefreshing ? (
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            {message ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {message}
              </div>
            ) : null}

            {isLoading ? (
              <div className="flex min-h-[260px] items-center justify-center rounded-[28px] border border-dashed border-slate-200 bg-slate-50/70 text-slate-500">
                <div className="flex items-center gap-3 text-sm font-medium">
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Loading notifications...
                </div>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="flex min-h-[260px] flex-col items-center justify-center rounded-[28px] border border-dashed border-slate-200 bg-slate-50/70 px-6 text-center">
                <Bell className="h-10 w-10 text-slate-300" />
                <h2 className="mt-4 text-xl font-semibold text-slate-900">
                  No notifications here
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                  {filter === "unread"
                    ? "Everything in your inbox has been read."
                    : "New module alerts will appear here as the system detects them."}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredNotifications.map((notification) => (
                  <article
                    key={notification.id}
                    className={[
                      "rounded-[28px] border bg-white/90 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)] transition",
                      notification.is_read
                        ? "border-slate-200/80"
                        : "border-sky-200/80 ring-1 ring-sky-100",
                    ].join(" ")}
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-3">
                        {isAdmin ? (
                          <label
                            className="inline-flex items-center"
                            aria-label={`Select ${notification.title}`}
                            title="Select"
                          >
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(notification.id)}
                              onChange={() => toggleSelection(notification.id)}
                              className="h-4 w-4 rounded border-slate-300 text-sky-700"
                            />
                          </label>
                        ) : null}
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                            {formatModuleLabel(notification.module)}
                          </span>
                          <span
                            className={[
                              "rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em]",
                              getSeverityClasses(notification.severity),
                            ].join(" ")}
                          >
                            {notification.severity}
                          </span>
                          <span
                            className={[
                              "rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em]",
                              getStatusClasses(notification.status),
                            ].join(" ")}
                          >
                            {notification.status}
                          </span>
                          {!notification.is_read ? (
                            <span className="rounded-full border border-sky-200 bg-sky-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-700">
                              Unread
                            </span>
                          ) : null}
                        </div>

                        <div>
                          <h2 className="text-xl font-semibold text-slate-950">
                            {notification.title}
                          </h2>
                          <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">
                            {notification.message}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-6 text-sm text-slate-500">
                          <span>
                            Created {formatTimestamp(notification.created_at)}
                          </span>
                          <span>
                            Read by {notification.read_summary.read} of{" "}
                            {notification.read_summary.total}
                          </span>
                          {notification.read_at ? (
                            <span>
                              You read this on{" "}
                              {formatTimestamp(notification.read_at)}
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                        {!notification.is_read ? (
                          <button
                            type="button"
                            onClick={() => void handleMarkRead(notification.id)}
                            disabled={actionId === notification.id}
                            aria-label={`Mark ${notification.title} as read`}
                            title="Mark read"
                            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-sky-200 bg-sky-100 text-sky-800 transition hover:bg-sky-200/70 disabled:opacity-70"
                          >
                            {actionId === notification.id ? (
                              <LoaderCircle className="h-4 w-4 animate-spin" />
                            ) : (
                              <Check className="h-4 w-4" />
                            )}
                          </button>
                        ) : null}

                        <button
                          type="button"
                          onClick={() =>
                            navigate(getNotificationRoute(notification))
                          }
                          aria-label={`Open ${formatModuleLabel(notification.module)} module`}
                          title="Open module"
                          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                        >
                          <ArrowUpRight className="h-4 w-4" />
                        </button>

                        {isAdmin && notification.can_delete ? (
                          <button
                            type="button"
                            onClick={() => void beginDelete(notification)}
                            disabled={actionId === notification.id}
                            aria-label={`Delete ${notification.title}`}
                            title="Delete"
                            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-red-200 bg-red-50 text-red-700 transition hover:bg-red-100 disabled:opacity-70"
                          >
                            {actionId === notification.id ? (
                              <LoaderCircle className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      {deleteWarning ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/32 px-4 py-6 backdrop-blur-sm">
          <div className="panel w-full max-w-2xl p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 text-amber-700">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-slate-900">
                    Delete notification?
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {deleteWarning.warning.detail}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDeleteWarning(null)}
                className="modal-close-button"
                aria-label="Close"
                title="Close"
              >
                <X className="h-4 w-4 sm:hidden" />
                <span className="hidden sm:inline">Close</span>
              </button>
            </div>

            <div className="mt-5 rounded-[24px] border border-amber-200 bg-amber-50/80 p-4">
              <p className="text-sm font-semibold text-amber-800">
                {deleteWarning.warning.unread_count} member(s) have not read
                this yet.
              </p>
              {deleteWarning.warning.selected_count ? (
                <p className="mt-2 text-sm leading-6 text-amber-700">
                  {deleteWarning.warning.selected_count} notification(s) are in
                  this delete action.
                </p>
              ) : deleteWarning.notificationTitle ? (
                <p className="mt-2 text-sm leading-6 text-amber-700">
                  {deleteWarning.notificationTitle}
                </p>
              ) : null}
              {deleteWarning.warning.unread_members.length ? (
                <p className="mt-2 text-sm leading-6 text-amber-700">
                  {deleteWarning.warning.unread_members.join(", ")}
                </p>
              ) : null}
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteWarning(null)}
                className="modal-icon-button modal-icon-button-secondary"
                aria-label="Cancel"
                title="Cancel"
              >
                <X className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => void confirmDelete()}
                disabled={
                  actionId === "bulk" ||
                  deleteWarning.notificationIds.some((id) => actionId === id)
                }
                className="modal-icon-button modal-icon-button-danger"
                aria-label="Delete anyway"
                title="Delete anyway"
              >
                {actionId === "bulk" ||
                deleteWarning.notificationIds.some((id) => actionId === id) ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
