import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  LoaderCircle,
  Pencil,
  Search,
  ShieldAlert,
  UserPlus,
  X,
} from "lucide-react";
import {
  startTransition,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { useAuth } from "../features/auth/AuthProvider";
import {
  ApiError,
  createUser,
  fetchRoles,
  fetchUsers,
  resolveApiAssetUrl,
  updateUser,
} from "../lib/api/auth";
import type {
  AdminUser,
  AdminUserCreatePayload,
  AdminUserUpdatePayload,
  MemberSummary,
  UserRole,
} from "../types/auth";

type CreateMemberState = {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  role: string;
  is_active: boolean;
};

type EditMemberState = {
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  role: string;
  is_active: boolean;
};

type ActiveModal = "create" | "edit" | null;
type ActivePicker = "role" | "status" | null;
type PageSizeOption = 5 | 6 | 10;

const fieldClassName =
  "w-full rounded-2xl border border-slate-200/80 bg-slate-50/70 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-300";
const primaryButtonClassName =
  "inline-flex items-center justify-center gap-2 rounded-2xl border border-sky-200 bg-[linear-gradient(135deg,#1f87ad,#0f6d8d)] px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(32,141,183,0.22)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70";
const secondaryButtonClassName =
  "inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70";

function formatDate(value: string | null) {
  if (!value) return "Never";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Unknown";
  return new Intl.DateTimeFormat("en-UG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(parsed);
}

function buildCreateInitialState(defaultRole: string): CreateMemberState {
  return {
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    phone_number: "",
    role: defaultRole,
    is_active: true,
  };
}

function buildEditState(user: AdminUser): EditMemberState {
  return {
    email: user.email ?? "",
    first_name: user.first_name ?? "",
    last_name: user.last_name ?? "",
    phone_number: user.phone_number ?? "",
    role: user.role.code,
    is_active: user.is_active,
  };
}

function getMemberLabel(member: AdminUser) {
  return (
    [member.first_name, member.last_name].filter(Boolean).join(" ") ||
    member.email
  );
}

function getMemberInitials(member: AdminUser) {
  return getMemberLabel(member)
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function FieldMessage({ message }: { message: string }) {
  if (!message) return null;

  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {message}
    </div>
  );
}

function PickerField({
  value,
  options,
  onChange,
  placement = "bottom",
}: {
  value: string;
  options: Array<{ label: string; value: string }>;
  onChange: (value: string) => void;
  placement?: "top" | "bottom";
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const selectedLabel =
    options.find((option) => option.value === value)?.label ??
    options[0]?.label ??
    "Select";

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    window.addEventListener("mousedown", handlePointerDown);
    return () => window.removeEventListener("mousedown", handlePointerDown);
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="inline-flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/70 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-white"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="truncate">{selectedLabel}</span>
        <ChevronDown
          className={[
            "h-4 w-4 shrink-0 text-slate-400 transition",
            isOpen ? "rotate-180" : "",
          ].join(" ")}
        />
      </button>

      {isOpen ? (
        <div
          className={[
            "absolute left-0 z-20 w-full rounded-3xl border border-slate-200 bg-white p-2 shadow-[0_24px_60px_rgba(15,23,42,0.14)]",
            placement === "top" ? "bottom-full mb-2" : "top-full mt-2",
          ].join(" ")}
        >
          <div className="space-y-1">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={[
                  "flex w-full items-center justify-between rounded-2xl px-3 py-2 text-left text-sm transition",
                  value === option.value
                    ? "bg-sky-50 text-sky-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                ].join(" ")}
              >
                <span>{option.label}</span>
                {value === option.value ? <Check className="h-4 w-4" /> : null}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ModalShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/32 px-4 py-6 backdrop-blur-sm">
      <div className="panel scrollbar-hidden max-h-[90vh] w-full max-w-3xl overflow-y-auto p-6">
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-2xl font-semibold text-slate-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-slate-200 bg-white p-2 text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}

export function MembersPage() {
  const { user } = useAuth();
  const isAdmin =
    user?.role.code === "admin" || user?.role.code === "superuser";
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [activePicker, setActivePicker] = useState<ActivePicker>(null);
  const [members, setMembers] = useState<AdminUser[]>([]);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [totalMembers, setTotalMembers] = useState(0);
  const [memberSummary, setMemberSummary] = useState<MemberSummary>({
    total: 0,
    active: 0,
    admins: 0,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSizeOption>(5);
  const [reloadKey, setReloadKey] = useState(0);
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  const [searchValue, setSearchValue] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [pageError, setPageError] = useState("");
  const [pageMessage, setPageMessage] = useState("");
  const [createError, setCreateError] = useState("");
  const [editError, setEditError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatePending, setIsCreatePending] = useState(false);
  const [isEditPending, setIsEditPending] = useState(false);
  const deferredSearch = useDeferredValue(searchValue);
  const pickerContainerRef = useRef<HTMLDivElement | null>(null);

  const defaultRoleCode =
    roles.find((role) => role.code === "staff")?.code ?? "staff";
  const [createForm, setCreateForm] = useState<CreateMemberState>(
    buildCreateInitialState(defaultRoleCode),
  );
  const [editForm, setEditForm] = useState<EditMemberState | null>(null);

  useEffect(() => {
    setCreateForm((current) =>
      current.role ? current : buildCreateInitialState(defaultRoleCode),
    );
  }, [defaultRoleCode]);

  useEffect(() => {
    if (!isAdmin) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    const loadMembersData = async () => {
      setIsLoading(true);
      setPageError("");

      try {
        const [roleList, userPage] = await Promise.all([
          fetchRoles(),
          fetchUsers({
            page: currentPage,
            pageSize,
            search: deferredSearch,
            role: roleFilter,
            status: statusFilter,
          }),
        ]);
        if (!isMounted) return;
        setRoles(roleList);
        setMembers(userPage.results);
        setTotalMembers(userPage.count);
        setMemberSummary(userPage.summary);
        setSelectedMemberId((current) => {
          if (
            current &&
            userPage.results.some((member) => member.id === current)
          ) {
            return current;
          }

          return userPage.results[0]?.id ?? null;
        });
      } catch (error) {
        if (!isMounted) return;
        if (error instanceof ApiError) {
          setPageError(error.message);
        } else {
          setPageError("Unable to load members right now.");
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void loadMembersData();

    return () => {
      isMounted = false;
    };
  }, [
    currentPage,
    deferredSearch,
    isAdmin,
    pageSize,
    reloadKey,
    roleFilter,
    statusFilter,
  ]);

  const selectedMember = useMemo(
    () => members.find((member) => member.id === selectedMemberId) ?? null,
    [members, selectedMemberId],
  );

  useEffect(() => {
    if (!selectedMember) {
      setEditForm(null);
      return;
    }

    setEditForm(buildEditState(selectedMember));
  }, [selectedMember]);

  useEffect(() => {
    if (!activePicker) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!pickerContainerRef.current?.contains(event.target as Node)) {
        setActivePicker(null);
      }
    };

    window.addEventListener("mousedown", handlePointerDown);
    return () => window.removeEventListener("mousedown", handlePointerDown);
  }, [activePicker]);

  const totalPages = Math.max(1, Math.ceil(totalMembers / pageSize));
  const fillerRowCount = Math.max(pageSize - members.length, 0);

  const selectedRoleLabel =
    roleFilter === "all"
      ? "All roles"
      : (roles.find((role) => role.code === roleFilter)?.name ?? "All roles");

  const selectedStatusLabel =
    statusFilter === "all"
      ? "All statuses"
      : statusFilter === "active"
        ? "Active"
        : "Inactive";

  const openCreateModal = () => {
    setCreateError("");
    setPageMessage("");
    setCreateForm(buildCreateInitialState(defaultRoleCode));
    setActiveModal("create");
  };

  const openEditModal = (member: AdminUser) => {
    setSelectedMemberId(member.id);
    setEditError("");
    setPageMessage("");
    setEditForm(buildEditState(member));
    setActiveModal("edit");
  };

  const closeModal = () => {
    setActiveModal(null);
    setCreateError("");
    setEditError("");
  };

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    setCurrentPage(1);
  };

  const handleRoleFilterChange = (value: string) => {
    setRoleFilter(value);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const handlePageSizeChange = (value: PageSizeOption) => {
    setPageSize(value);
    setCurrentPage(1);
  };

  const handleCreateSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreateError("");
    setPageMessage("");
    setIsCreatePending(true);

    const payload: AdminUserCreatePayload = {
      email: createForm.email.trim(),
      password: createForm.password,
      first_name: createForm.first_name.trim(),
      last_name: createForm.last_name.trim(),
      phone_number: createForm.phone_number.trim(),
      role: createForm.role,
      is_active: createForm.is_active,
    };

    startTransition(() => {
      void (async () => {
        try {
          const createdUser = await createUser(payload);
          setCurrentPage(1);
          setSelectedMemberId(createdUser.id);
          setPageMessage("Member created successfully.");
          setReloadKey((current) => current + 1);
          closeModal();
        } catch (error) {
          if (error instanceof ApiError) {
            setCreateError(error.message);
          } else {
            setCreateError("Unable to create the member right now.");
          }
        } finally {
          setIsCreatePending(false);
        }
      })();
    });
  };

  const handleEditSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedMember || !editForm) return;

    setEditError("");
    setPageMessage("");
    setIsEditPending(true);

    const payload: AdminUserUpdatePayload = {
      email: editForm.email.trim(),
      first_name: editForm.first_name.trim(),
      last_name: editForm.last_name.trim(),
      phone_number: editForm.phone_number.trim(),
      role: editForm.role,
      is_active: editForm.is_active,
    };

    startTransition(() => {
      void (async () => {
        try {
          const updatedUser = await updateUser(selectedMember.id, payload);
          setMembers((current) =>
            current.map((member) =>
              member.id === updatedUser.id ? updatedUser : member,
            ),
          );
          setPageMessage("Member updated successfully.");
          setReloadKey((current) => current + 1);
          closeModal();
        } catch (error) {
          if (error instanceof ApiError) {
            setEditError(error.message);
          } else {
            setEditError("Unable to update the member right now.");
          }
        } finally {
          setIsEditPending(false);
        }
      })();
    });
  };

  if (!isAdmin) {
    return (
      <section className="panel max-w-3xl p-8">
        <p className="section-label">Members</p>
        <div className="mt-4 flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 text-amber-700">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              Admin access required
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
              The backend protects member management behind the admin role. You
              can still use your own profile settings, but listing and creating
              staff members is restricted to admin accounts.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-6 overflow-hidden">
      <section className="rounded-[32px] border border-white/70 bg-[radial-gradient(circle_at_top_left,#ffffff,rgba(224,242,254,0.92)_52%,rgba(240,249,255,0.95))] py-6 pl-6 pr-0 shadow-[0_25px_80px_rgba(148,163,184,0.14)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/75 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-sky-700">
              Members
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
                Members
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-slate-600">
                Manage internal user accounts, create staff members, and keep
                role access organized from one admin workspace.
              </p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="hero-metric-card">
              <p className="hero-metric-label">Members</p>
              <p className="hero-metric-value">{memberSummary.total}</p>
            </div>
            <div className="hero-metric-card">
              <p className="hero-metric-label">Active</p>
              <p className="hero-metric-value">{memberSummary.active}</p>
            </div>
            <div className="hero-metric-card">
              <p className="hero-metric-label">Admins</p>
              <p className="hero-metric-value">{memberSummary.admins}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="panel flex min-h-0 flex-1 flex-col p-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div
              ref={pickerContainerRef}
              className="flex flex-col gap-3 lg:flex-row lg:items-center"
            >
              <label className="flex min-w-[260px] items-center gap-2 rounded-2xl border border-slate-200/80 bg-slate-50/70 px-3 py-2.5 text-sm text-slate-600">
                <Search className="h-4 w-4 text-slate-400" />
                <input
                  className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                  placeholder="Search members"
                  value={searchValue}
                  onChange={(event) => handleSearchChange(event.target.value)}
                />
              </label>

              <div className="relative min-w-[200px]">
                <button
                  type="button"
                  onClick={() =>
                    setActivePicker((current) =>
                      current === "role" ? null : "role",
                    )
                  }
                  className="inline-flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/70 px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-white"
                  aria-haspopup="listbox"
                  aria-expanded={activePicker === "role"}
                >
                  <span>{selectedRoleLabel}</span>
                  <ChevronDown
                    className={[
                      "h-4 w-4 text-slate-400 transition",
                      activePicker === "role" ? "rotate-180" : "",
                    ].join(" ")}
                  />
                </button>

                {activePicker === "role" ? (
                  <div className="absolute left-0 top-full z-20 mt-2 w-full rounded-3xl border border-slate-200 bg-white p-2 shadow-[0_24px_60px_rgba(15,23,42,0.14)]">
                    <div className="px-3 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                      Filter by role
                    </div>
                    <div className="space-y-1">
                      <button
                        type="button"
                        onClick={() => {
                          handleRoleFilterChange("all");
                          setActivePicker(null);
                        }}
                        className={[
                          "flex w-full items-center justify-between rounded-2xl px-3 py-2 text-left text-sm transition",
                          roleFilter === "all"
                            ? "bg-sky-50 text-sky-700"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                        ].join(" ")}
                      >
                        <span>All roles</span>
                        {roleFilter === "all" ? (
                          <Check className="h-4 w-4" />
                        ) : null}
                      </button>
                      {roles.map((role) => (
                        <button
                          key={role.id}
                          type="button"
                          onClick={() => {
                            handleRoleFilterChange(role.code);
                            setActivePicker(null);
                          }}
                          className={[
                            "flex w-full items-center justify-between rounded-2xl px-3 py-2 text-left text-sm transition",
                            roleFilter === role.code
                              ? "bg-sky-50 text-sky-700"
                              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                          ].join(" ")}
                        >
                          <span>{role.name}</span>
                          {roleFilter === role.code ? (
                            <Check className="h-4 w-4" />
                          ) : null}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="relative min-w-[200px]">
                <button
                  type="button"
                  onClick={() =>
                    setActivePicker((current) =>
                      current === "status" ? null : "status",
                    )
                  }
                  className="inline-flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/70 px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-white"
                  aria-haspopup="listbox"
                  aria-expanded={activePicker === "status"}
                >
                  <span>{selectedStatusLabel}</span>
                  <ChevronDown
                    className={[
                      "h-4 w-4 text-slate-400 transition",
                      activePicker === "status" ? "rotate-180" : "",
                    ].join(" ")}
                  />
                </button>

                {activePicker === "status" ? (
                  <div className="absolute left-0 top-full z-20 mt-2 w-full rounded-3xl border border-slate-200 bg-white p-2 shadow-[0_24px_60px_rgba(15,23,42,0.14)]">
                    <div className="px-3 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                      Filter by status
                    </div>
                    {[
                      { label: "All statuses", value: "all" },
                      { label: "Active", value: "active" },
                      { label: "Inactive", value: "inactive" },
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          handleStatusFilterChange(option.value);
                          setActivePicker(null);
                        }}
                        className={[
                          "flex w-full items-center justify-between rounded-2xl px-3 py-2 text-left text-sm transition",
                          statusFilter === option.value
                            ? "bg-sky-50 text-sky-700"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                        ].join(" ")}
                      >
                        <span>{option.label}</span>
                        {statusFilter === option.value ? (
                          <Check className="h-4 w-4" />
                        ) : null}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="inline-flex items-center gap-1 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-1">
                {([5, 6, 10] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => handlePageSizeChange(option)}
                    className={[
                      "rounded-[1rem] px-3 py-1.5 text-sm font-medium transition",
                      pageSize === option
                        ? "bg-white text-sky-700 shadow-[0_10px_24px_rgba(15,23,42,0.08)]"
                        : "text-slate-500 hover:text-slate-800",
                    ].join(" ")}
                    aria-pressed={pageSize === option}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 xl:justify-end">
              <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-1">
                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((page) => Math.max(1, page - 1))
                  }
                  disabled={currentPage === 1}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-[1rem] text-slate-600 transition hover:bg-white hover:text-slate-900 disabled:opacity-45"
                  aria-label="Previous page"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <div className="min-w-[88px] px-2 text-center text-sm font-medium text-slate-600">
                  {currentPage}/{totalPages}
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((page) => Math.min(totalPages, page + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-[1rem] text-slate-600 transition hover:bg-white hover:text-slate-900 disabled:opacity-45"
                  aria-label="Next page"
                >
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={openCreateModal}
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-sky-200 bg-sky-100 text-sky-700 transition hover:border-sky-300 hover:bg-sky-200/70 hover:text-sky-800"
                aria-label="Create member"
                title="Create member"
              >
                <UserPlus className="h-5 w-5" />
              </button>
            </div>
          </div>

          {pageError ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {pageError}
            </div>
          ) : null}

          {pageMessage ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {pageMessage}
            </div>
          ) : null}
        </div>

        <div className="mt-5 min-h-0 flex-1 overflow-x-auto overflow-y-hidden">
          {isLoading ? (
            <div className="flex h-full min-h-[420px] items-center gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/70 px-4 py-4 text-sm text-slate-600">
              <LoaderCircle className="h-4 w-4 animate-spin text-sky-700" />
              Loading members and roles...
            </div>
          ) : members.length === 0 ? (
            <div className="flex h-full min-h-[420px] items-start rounded-2xl border border-slate-200/80 bg-slate-50/70 px-4 py-6 text-sm text-slate-600">
              No members match the current filters.
            </div>
          ) : (
            <table className="min-w-full border-separate border-spacing-0">
              <thead>
                <tr>
                  <th className="rounded-tl-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                    User
                  </th>
                  <th className="border-y border-slate-200/80 bg-slate-50/80 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                    Role
                  </th>
                  <th className="border-y border-slate-200/80 bg-slate-50/80 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                    Phone
                  </th>
                  <th className="border-y border-slate-200/80 bg-slate-50/80 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                    Status
                  </th>
                  <th className="border-y border-slate-200/80 bg-slate-50/80 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                    Joined
                  </th>
                  <th className="border-y border-slate-200/80 bg-slate-50/80 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                    Last login
                  </th>
                  <th className="rounded-tr-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {members.map((member, index) => {
                  const photoUrl = resolveApiAssetUrl(member.profile_photo);
                  const isLast =
                    index === members.length - 1 && fillerRowCount === 0;
                  const rowClass = isLast
                    ? "border-b border-slate-200/80"
                    : "border-b border-slate-200/60";

                  return (
                    <tr key={member.id} className="group">
                      <td
                        className={`${rowClass} border-l border-r border-slate-200/80 bg-white px-4 py-4`}
                      >
                        <div className="flex min-w-[260px] items-center gap-3">
                          {photoUrl ? (
                            <img
                              src={photoUrl}
                              alt={getMemberLabel(member)}
                              className="h-11 w-11 rounded-2xl object-cover"
                            />
                          ) : (
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-100 text-sm font-semibold text-sky-700">
                              {getMemberInitials(member) || "IB"}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-900">
                              {getMemberLabel(member)}
                            </p>
                            <p className="mt-1 truncate text-sm text-slate-500">
                              {member.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td
                        className={`${rowClass} border-r border-slate-200/80 bg-white px-4 py-4 text-sm text-slate-600`}
                      >
                        {member.role.name}
                      </td>
                      <td
                        className={`${rowClass} border-r border-slate-200/80 bg-white px-4 py-4 text-sm text-slate-600`}
                      >
                        {member.phone_number || "No phone"}
                      </td>
                      <td
                        className={`${rowClass} border-r border-slate-200/80 bg-white px-4 py-4`}
                      >
                        <span
                          className={[
                            "inline-flex rounded-full border px-2 py-1 text-[11px] uppercase tracking-[0.24em]",
                            member.is_active
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-slate-200 bg-slate-100 text-slate-500",
                          ].join(" ")}
                        >
                          {member.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td
                        className={`${rowClass} border-r border-slate-200/80 bg-white px-4 py-4 text-sm text-slate-600`}
                      >
                        {formatDate(member.date_joined)}
                      </td>
                      <td
                        className={`${rowClass} border-r border-slate-200/80 bg-white px-4 py-4 text-sm text-slate-600`}
                      >
                        {formatDate(member.last_login)}
                      </td>
                      <td
                        className={`${rowClass} rounded-br-2xl border-r border-slate-200/80 bg-white px-4 py-4`}
                      >
                        <button
                          type="button"
                          onClick={() => openEditModal(member)}
                          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                        >
                          <Pencil className="h-4 w-4" />
                          Edit
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {Array.from({ length: fillerRowCount }).map((_, index) => {
                  const isLastFiller = index === fillerRowCount - 1;
                  const rowClass = isLastFiller
                    ? "border-b border-slate-200/80"
                    : "border-b border-slate-200/60";

                  return (
                    <tr key={`filler-${index}`} aria-hidden="true">
                      <td
                        className={`${rowClass} border-l border-r border-slate-200/80 bg-white px-4 py-4`}
                      >
                        <div className="h-11" />
                      </td>
                      <td
                        className={`${rowClass} border-r border-slate-200/80 bg-white px-4 py-4`}
                      >
                        <div className="h-6" />
                      </td>
                      <td
                        className={`${rowClass} border-r border-slate-200/80 bg-white px-4 py-4`}
                      >
                        <div className="h-6" />
                      </td>
                      <td
                        className={`${rowClass} border-r border-slate-200/80 bg-white px-4 py-4`}
                      >
                        <div className="h-6" />
                      </td>
                      <td
                        className={`${rowClass} border-r border-slate-200/80 bg-white px-4 py-4`}
                      >
                        <div className="h-6" />
                      </td>
                      <td
                        className={`${rowClass} border-r border-slate-200/80 bg-white px-4 py-4`}
                      >
                        <div className="h-6" />
                      </td>
                      <td
                        className={`${rowClass} rounded-br-2xl border-r border-slate-200/80 bg-white px-4 py-4`}
                      >
                        <div className="h-6" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {activeModal === "create" ? (
        <ModalShell title="Create member" onClose={closeModal}>
          <form className="space-y-4" onSubmit={handleCreateSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">
                  First name
                </span>
                <input
                  className={fieldClassName}
                  value={createForm.first_name}
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      first_name: event.target.value,
                    }))
                  }
                  placeholder="First name"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">
                  Last name
                </span>
                <input
                  className={fieldClassName}
                  value={createForm.last_name}
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      last_name: event.target.value,
                    }))
                  }
                  placeholder="Last name"
                />
              </label>

              <label className="block space-y-2 md:col-span-2">
                <span className="text-sm font-medium text-slate-700">
                  Email
                </span>
                <input
                  type="email"
                  className={fieldClassName}
                  value={createForm.email}
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      email: event.target.value,
                    }))
                  }
                  placeholder="staff@ibms.com"
                  required
                />
              </label>

              <label className="block space-y-2 md:col-span-2">
                <span className="text-sm font-medium text-slate-700">
                  Password
                </span>
                <input
                  type="password"
                  className={fieldClassName}
                  value={createForm.password}
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      password: event.target.value,
                    }))
                  }
                  placeholder="StrongPass123!"
                  required
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">
                  Phone number
                </span>
                <input
                  className={fieldClassName}
                  value={createForm.phone_number}
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      phone_number: event.target.value,
                    }))
                  }
                  placeholder="+256700000100"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">Role</span>
                <PickerField
                  value={createForm.role}
                  options={roles.map((role) => ({
                    label: role.name,
                    value: role.code,
                  }))}
                  placement="top"
                  onChange={(value) =>
                    setCreateForm((current) => ({ ...current, role: value }))
                  }
                />
              </label>
            </div>

            <label className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/70 px-4 py-3 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={createForm.is_active}
                onChange={(event) =>
                  setCreateForm((current) => ({
                    ...current,
                    is_active: event.target.checked,
                  }))
                }
              />
              Create this member as active
            </label>

            <FieldMessage message={createError} />

            <div className="flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={closeModal}
                className={secondaryButtonClassName}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isCreatePending}
                className={primaryButtonClassName}
              >
                {isCreatePending ? (
                  <>
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    Creating member
                  </>
                ) : (
                  "Create member"
                )}
              </button>
            </div>
          </form>
        </ModalShell>
      ) : null}

      {activeModal === "edit" ? (
        <ModalShell
          title={
            selectedMember
              ? `Edit ${getMemberLabel(selectedMember)}`
              : "Edit member"
          }
          onClose={closeModal}
        >
          {!selectedMember || !editForm ? (
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 px-4 py-6 text-sm text-slate-600">
              Select a member from the table to edit their details.
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleEditSubmit}>
              <div className="flex items-center gap-4 rounded-[28px] border border-slate-200/80 bg-slate-50/70 px-5 py-4">
                {resolveApiAssetUrl(selectedMember.profile_photo) ? (
                  <img
                    src={resolveApiAssetUrl(selectedMember.profile_photo) ?? ""}
                    alt={selectedMember.email}
                    className="h-16 w-16 rounded-[1.5rem] object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-sky-100 text-lg font-semibold text-sky-700">
                    {getMemberInitials(selectedMember) || "IB"}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-base font-semibold text-slate-900">
                    {getMemberLabel(selectedMember)}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {selectedMember.role.name}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-4 text-sm text-slate-500">
                    <span>Joined {formatDate(selectedMember.date_joined)}</span>
                    <span>
                      Last login {formatDate(selectedMember.last_login)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    First name
                  </span>
                  <input
                    className={fieldClassName}
                    value={editForm.first_name}
                    onChange={(event) =>
                      setEditForm((current) =>
                        current
                          ? { ...current, first_name: event.target.value }
                          : current,
                      )
                    }
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Last name
                  </span>
                  <input
                    className={fieldClassName}
                    value={editForm.last_name}
                    onChange={(event) =>
                      setEditForm((current) =>
                        current
                          ? { ...current, last_name: event.target.value }
                          : current,
                      )
                    }
                  />
                </label>

                <label className="block space-y-2 md:col-span-2">
                  <span className="text-sm font-medium text-slate-700">
                    Email
                  </span>
                  <input
                    type="email"
                    className={fieldClassName}
                    value={editForm.email}
                    onChange={(event) =>
                      setEditForm((current) =>
                        current
                          ? { ...current, email: event.target.value }
                          : current,
                      )
                    }
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Phone number
                  </span>
                  <input
                    className={fieldClassName}
                    value={editForm.phone_number}
                    onChange={(event) =>
                      setEditForm((current) =>
                        current
                          ? { ...current, phone_number: event.target.value }
                          : current,
                      )
                    }
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Role
                  </span>
                  <PickerField
                    value={editForm.role}
                    options={roles.map((role) => ({
                      label: role.name,
                      value: role.code,
                    }))}
                    placement="top"
                    onChange={(value) =>
                      setEditForm((current) =>
                        current ? { ...current, role: value } : current,
                      )
                    }
                  />
                </label>
              </div>

              <label className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/70 px-4 py-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={editForm.is_active}
                  onChange={(event) =>
                    setEditForm((current) =>
                      current
                        ? { ...current, is_active: event.target.checked }
                        : current,
                    )
                  }
                />
                Member is active
              </label>

              <FieldMessage message={editError} />

              <div className="flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className={secondaryButtonClassName}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isEditPending}
                  className={primaryButtonClassName}
                >
                  {isEditPending ? (
                    <>
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                      Saving member
                    </>
                  ) : (
                    "Save member changes"
                  )}
                </button>
              </div>
            </form>
          )}
        </ModalShell>
      ) : null}
    </div>
  );
}
