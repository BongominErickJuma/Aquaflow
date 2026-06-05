import {
  AlertTriangle,
  Check,
  CheckCheck,
  Edit3,
  LoaderCircle,
  Mail,
  Plus,
  RefreshCw,
  Trash,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../features/auth/AuthProvider";
import { useMessages } from "../features/messages/MessagesProvider";
import { ApiError } from "../lib/api/auth";
import {
  bulkDeleteMessages,
  createMessage,
  deleteMessage,
  fetchMessages,
  markAllMessagesRead,
  markMessageRead,
  updateMessage,
} from "../lib/api/messages";
import type {
  MessageDeleteWarning,
  MessageItem,
  MessagePayload,
  MessagePriority,
} from "../types/messages";

type MessageFilter = "all" | "unread";
type EditorState =
  | { mode: "create"; message?: undefined }
  | { mode: "edit"; message: MessageItem };

const emptyForm: MessagePayload = {
  subject: "",
  body: "",
  priority: "normal",
};

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

function getPriorityClasses(priority: MessagePriority) {
  switch (priority) {
    case "urgent":
      return "border-red-200 bg-red-50 text-red-700";
    case "high":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "low":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    default:
      return "border-sky-200 bg-sky-50 text-sky-700";
  }
}

export function MessagesPage() {
  const { user } = useAuth();
  const { refreshSummary } = useMessages();
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [filter, setFilter] = useState<MessageFilter>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [formError, setFormError] = useState("");
  const [actionId, setActionId] = useState<number | "bulk" | "save" | null>(
    null,
  );
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [form, setForm] = useState<MessagePayload>(emptyForm);
  const [deleteWarning, setDeleteWarning] = useState<{
    messageIds: number[];
    messageSubject?: string;
    warning: MessageDeleteWarning;
  } | null>(null);

  const isManager = user?.role.code === "admin" || user?.role.code === "hr";

  const loadMessages = async (showRefreshState = false) => {
    if (showRefreshState) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError("");

    try {
      const response = await fetchMessages();
      setMessages(response);
    } catch (nextError) {
      if (nextError instanceof ApiError) {
        setError(nextError.message);
      } else {
        setError("Unable to load messages right now.");
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
    void loadMessages();
  }, []);

  useEffect(() => {
    setSelectedIds((current) =>
      current.filter((id) => messages.some((message) => message.id === id)),
    );
  }, [messages]);

  const filteredMessages = useMemo(() => {
    if (filter === "unread") {
      return messages.filter((message) => !message.is_read);
    }
    return messages;
  }, [filter, messages]);

  const summary = useMemo(() => {
    const unread = messages.filter((message) => !message.is_read).length;
    const urgent = messages.filter(
      (message) => message.priority === "urgent",
    ).length;
    return {
      total: messages.length,
      unread,
      urgent,
    };
  }, [messages]);

  const allVisibleSelected =
    filteredMessages.length > 0 &&
    filteredMessages.every((message) => selectedIds.includes(message.id));

  const openCreateEditor = () => {
    setEditor({ mode: "create" });
    setForm(emptyForm);
    setFormError("");
  };

  const openEditEditor = (message: MessageItem) => {
    setEditor({ mode: "edit", message });
    setForm({
      subject: message.subject,
      body: message.body,
      priority: message.priority,
    });
    setFormError("");
  };

  const closeEditor = () => {
    setEditor(null);
    setForm(emptyForm);
    setFormError("");
  };

  const toggleSelection = (messageId: number) => {
    setSelectedIds((current) =>
      current.includes(messageId)
        ? current.filter((id) => id !== messageId)
        : [...current, messageId],
    );
  };

  const toggleSelectAllVisible = () => {
    if (allVisibleSelected) {
      setSelectedIds((current) =>
        current.filter(
          (id) => !filteredMessages.some((message) => message.id === id),
        ),
      );
      return;
    }

    setSelectedIds((current) => [
      ...new Set([...current, ...filteredMessages.map((message) => message.id)]),
    ]);
  };

  const handleSave = async () => {
    const payload = {
      ...form,
      subject: form.subject.trim(),
      body: form.body.trim(),
    };

    if (!payload.subject || !payload.body) {
      setFormError("Subject and body are required.");
      return;
    }

    setActionId("save");
    setNotice("");
    setError("");
    setFormError("");

    try {
      if (editor?.mode === "edit") {
        const updated = await updateMessage(editor.message.id, payload);
        setMessages((current) =>
          current.map((message) =>
            message.id === updated.id ? updated : message,
          ),
        );
        setNotice("Message updated successfully.");
      } else {
        const created = await createMessage(payload);
        setMessages((current) => [created, ...current]);
        setNotice("Message created successfully.");
      }
      closeEditor();
      await refreshSummary();
    } catch (nextError) {
      if (nextError instanceof ApiError) {
        setFormError(nextError.message);
      } else {
        setFormError("Unable to save this message right now.");
      }
    } finally {
      setActionId(null);
    }
  };

  const handleMarkRead = async (messageId: number) => {
    setActionId(messageId);
    setNotice("");
    setError("");

    try {
      const updated = await markMessageRead(messageId);
      setMessages((current) =>
        current.map((message) =>
          message.id === updated.id ? updated : message,
        ),
      );
      await refreshSummary();
    } catch (nextError) {
      if (nextError instanceof ApiError) {
        setError(nextError.message);
      } else {
        setError("Unable to update this message right now.");
      }
    } finally {
      setActionId(null);
    }
  };

  const handleMarkAllRead = async () => {
    setIsMarkingAll(true);
    setNotice("");
    setError("");

    try {
      const response = await markAllMessagesRead();
      setNotice(response.detail);
      await loadMessages(true);
      await refreshSummary();
    } catch (nextError) {
      if (nextError instanceof ApiError) {
        setError(nextError.message);
      } else {
        setError("Unable to mark messages as read right now.");
      }
    } finally {
      setIsMarkingAll(false);
    }
  };

  const beginDelete = async (message: MessageItem) => {
    setActionId(message.id);
    setNotice("");
    setError("");

    try {
      await deleteMessage(message.id);
      setMessages((current) => current.filter((item) => item.id !== message.id));
      setNotice("Message deleted successfully.");
      await refreshSummary();
    } catch (nextError) {
      if (
        nextError instanceof ApiError &&
        nextError.status === 409 &&
        nextError.data &&
        typeof nextError.data === "object"
      ) {
        setDeleteWarning({
          messageIds: [message.id],
          messageSubject: message.subject,
          warning: nextError.data as MessageDeleteWarning,
        });
      } else if (nextError instanceof ApiError) {
        setError(nextError.message);
      } else {
        setError("Unable to delete this message right now.");
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
    setNotice("");
    setError("");

    try {
      const response = await bulkDeleteMessages(selectedIds);
      if (response && "deleted" in response) {
        setMessages((current) =>
          current.filter((item) => !selectedIds.includes(item.id)),
        );
        setSelectedIds([]);
        setNotice("Selected messages deleted successfully.");
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
          messageIds: [...selectedIds],
          warning: nextError.data as MessageDeleteWarning,
        });
      } else if (nextError instanceof ApiError) {
        setError(nextError.message);
      } else {
        setError("Unable to delete the selected messages right now.");
      }
    } finally {
      setActionId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteWarning) {
      return;
    }

    const targetIds = deleteWarning.messageIds;
    setActionId(targetIds.length > 1 ? "bulk" : targetIds[0]);

    try {
      if (targetIds.length > 1) {
        await bulkDeleteMessages(targetIds, true);
      } else {
        await deleteMessage(targetIds[0], true);
      }
      setMessages((current) =>
        current.filter((item) => !targetIds.includes(item.id)),
      );
      setSelectedIds((current) =>
        current.filter((id) => !targetIds.includes(id)),
      );
      setDeleteWarning(null);
      setNotice(
        targetIds.length > 1
          ? "Selected messages deleted successfully."
          : "Message deleted successfully.",
      );
      await refreshSummary();
    } catch (nextError) {
      if (nextError instanceof ApiError) {
        setError(nextError.message);
      } else {
        setError("Unable to delete this message right now.");
      }
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="module-page">
      <section className="rounded-[32px] border border-white/70 bg-[radial-gradient(circle_at_top_left,#ffffff,rgba(255,251,235,0.92)_52%,rgba(240,249,255,0.95))] py-6 pl-6 pr-0 shadow-[0_25px_80px_rgba(148,163,184,0.14)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white/75 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-amber-700">
              Messages
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
                Message Center
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-slate-600">
                Manage internal messages and track read status for each active
                member.
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
              <p className="hero-metric-label">Urgent</p>
              <p className="hero-metric-value">{summary.urgent}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="module-page-stage justify-start">
        <section className="panel p-6">
          <div className="flex flex-col gap-4">
            <div className="scrollbar-hidden overflow-x-auto rounded-[28px] border border-slate-200/80 bg-slate-50/70 p-2">
              <div className="flex min-w-max items-center gap-2">
                {isManager ? (
                  <>
                    <button
                      type="button"
                      onClick={openCreateEditor}
                      className="inline-flex h-10 shrink-0 items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-3 text-sm font-semibold text-amber-800 transition hover:bg-amber-100"
                    >
                      <Plus className="h-4 w-4" />
                      New message
                    </button>
                    <button
                      type="button"
                      onClick={toggleSelectAllVisible}
                      disabled={filteredMessages.length === 0}
                      aria-label={
                        allVisibleSelected ? "Clear shown messages" : "Select shown messages"
                      }
                      title={
                        allVisibleSelected ? "Clear shown messages" : "Select shown messages"
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
                  </>
                ) : null}

                <div className="inline-flex h-10 shrink-0 items-center rounded-2xl border border-slate-200 bg-white p-1">
                  <button
                    type="button"
                    onClick={() => setFilter("all")}
                    className={[
                      "h-8 rounded-[0.9rem] px-3 text-sm font-semibold transition",
                      filter === "all"
                        ? "bg-amber-50 text-amber-700 shadow-[0_10px_24px_rgba(15,23,42,0.08)]"
                        : "text-slate-500 hover:text-slate-900",
                    ].join(" ")}
                  >
                    All messages
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilter("unread")}
                    className={[
                      "h-8 rounded-[0.9rem] px-3 text-sm font-semibold transition",
                      filter === "unread"
                        ? "bg-amber-50 text-amber-700 shadow-[0_10px_24px_rgba(15,23,42,0.08)]"
                        : "text-slate-500 hover:text-slate-900",
                    ].join(" ")}
                  >
                    Unread only
                  </button>
                </div>

                {isManager && selectedIds.length > 0 ? (
                  <span className="inline-flex h-10 shrink-0 items-center rounded-2xl border border-amber-200 bg-amber-50 px-3 text-sm font-semibold text-amber-700">
                    {selectedIds.length} selected
                  </span>
                ) : null}

                <div className="ml-auto flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void handleMarkAllRead()}
                    disabled={isMarkingAll || summary.unread === 0}
                    aria-label="Mark all messages as read"
                    title="Mark all read"
                    className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-amber-200 bg-[linear-gradient(135deg,#d97706,#b45309)] text-white shadow-[0_12px_30px_rgba(217,119,6,0.22)] transition hover:brightness-110 disabled:opacity-70"
                  >
                    {isMarkingAll ? (
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCheck className="h-4 w-4" />
                    )}
                  </button>
                  {isManager && selectedIds.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => void beginBulkDelete()}
                      disabled={actionId === "bulk" || selectedIds.length === 0}
                      aria-label="Delete selected messages"
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
                    onClick={() => void loadMessages(true)}
                    disabled={isRefreshing}
                    aria-label="Refresh messages"
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

            {notice ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {notice}
              </div>
            ) : null}

            {isLoading ? (
              <div className="flex min-h-[260px] items-center justify-center rounded-[28px] border border-dashed border-slate-200 bg-slate-50/70 text-slate-500">
                <div className="flex items-center gap-3 text-sm font-medium">
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Loading messages...
                </div>
              </div>
            ) : filteredMessages.length === 0 ? (
              <div className="flex min-h-[260px] flex-col items-center justify-center rounded-[28px] border border-dashed border-slate-200 bg-slate-50/70 px-6 text-center">
                <Mail className="h-10 w-10 text-slate-300" />
                <h2 className="mt-4 text-xl font-semibold text-slate-900">
                  No messages here
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                  {filter === "unread"
                    ? "Everything in your message center has been read."
                    : "Messages created by admins and HR will appear here."}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredMessages.map((message) => (
                  <article
                    key={message.id}
                    className={[
                      "rounded-[28px] border bg-white/90 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)] transition",
                      message.is_read
                        ? "border-slate-200/80"
                        : "border-amber-200/80 ring-1 ring-amber-100",
                    ].join(" ")}
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-3">
                        {isManager && message.can_manage ? (
                          <label
                            className="inline-flex items-center"
                            aria-label={`Select ${message.subject}`}
                            title="Select"
                          >
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(message.id)}
                              onChange={() => toggleSelection(message.id)}
                              className="h-4 w-4 rounded border-slate-300 text-amber-700"
                            />
                          </label>
                        ) : null}
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                            {message.created_by_name}
                          </span>
                          <span
                            className={[
                              "rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em]",
                              getPriorityClasses(message.priority),
                            ].join(" ")}
                          >
                            {message.priority}
                          </span>
                          {!message.is_read ? (
                            <span className="rounded-full border border-amber-200 bg-amber-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-700">
                              Unread
                            </span>
                          ) : null}
                        </div>

                        <div>
                          <h2 className="text-xl font-semibold text-slate-950">
                            {message.subject}
                          </h2>
                          <p className="mt-2 max-w-3xl whitespace-pre-line text-sm leading-7 text-slate-600">
                            {message.body}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-6 text-sm text-slate-500">
                          <span>Created {formatTimestamp(message.created_at)}</span>
                          <span>
                            Read by {message.read_summary.read} of{" "}
                            {message.read_summary.total}
                          </span>
                          {message.read_at ? (
                            <span>
                              You read this on {formatTimestamp(message.read_at)}
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                        {!message.is_read ? (
                          <button
                            type="button"
                            onClick={() => void handleMarkRead(message.id)}
                            disabled={actionId === message.id}
                            aria-label={`Mark ${message.subject} as read`}
                            title="Mark read"
                            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-amber-200 bg-amber-100 text-amber-800 transition hover:bg-amber-200/70 disabled:opacity-70"
                          >
                            {actionId === message.id ? (
                              <LoaderCircle className="h-4 w-4 animate-spin" />
                            ) : (
                              <Check className="h-4 w-4" />
                            )}
                          </button>
                        ) : null}

                        {isManager && message.can_manage ? (
                          <>
                            <button
                              type="button"
                              onClick={() => openEditEditor(message)}
                              aria-label={`Edit ${message.subject}`}
                              title="Edit"
                              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => void beginDelete(message)}
                              disabled={actionId === message.id}
                              aria-label={`Delete ${message.subject}`}
                              title="Delete"
                              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-red-200 bg-red-50 text-red-700 transition hover:bg-red-100 disabled:opacity-70"
                            >
                              {actionId === message.id ? (
                                <LoaderCircle className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </button>
                          </>
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

      {editor ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/32 px-4 py-6 backdrop-blur-sm">
          <div className="panel w-full max-w-2xl p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">
                  {editor.mode === "edit" ? "Edit message" : "New message"}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeEditor}
                className="modal-close-button"
                aria-label="Close"
                title="Close"
              >
                <X className="h-4 w-4 sm:hidden" />
                <span className="hidden sm:inline">Close</span>
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">
                  Subject
                </span>
                <input
                  value={form.subject}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      subject: event.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-300 focus:ring-4 focus:ring-amber-100"
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">
                  Priority
                </span>
                <select
                  value={form.priority}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      priority: event.target.value as MessagePriority,
                    }))
                  }
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-300 focus:ring-4 focus:ring-amber-100"
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">
                  Body
                </span>
                <textarea
                  value={form.body}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      body: event.target.value,
                    }))
                  }
                  rows={6}
                  className="mt-2 w-full resize-y rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition focus:border-amber-300 focus:ring-4 focus:ring-amber-100"
                />
              </label>

              {formError ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {formError}
                </div>
              ) : null}
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={closeEditor}
                className="modal-icon-button modal-icon-button-secondary"
                aria-label="Cancel"
                title="Cancel"
              >
                <X className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={actionId === "save"}
                className="modal-icon-button modal-icon-button-primary"
                aria-label="Save message"
                title="Save message"
              >
                {actionId === "save" ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}

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
                    Delete message?
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
                  {deleteWarning.warning.selected_count} message(s) are in this
                  delete action.
                </p>
              ) : deleteWarning.messageSubject ? (
                <p className="mt-2 text-sm leading-6 text-amber-700">
                  {deleteWarning.messageSubject}
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
                  deleteWarning.messageIds.some((id) => actionId === id)
                }
                className="modal-icon-button modal-icon-button-danger"
                aria-label="Delete anyway"
                title="Delete anyway"
              >
                {actionId === "bulk" ||
                deleteWarning.messageIds.some((id) => actionId === id) ? (
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
