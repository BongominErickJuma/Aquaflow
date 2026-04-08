import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  LoaderCircle,
  Pencil,
  Plus,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { ModuleTabs } from "../components/layout/ModuleTabs";
import { useAuth } from "../features/auth/AuthProvider";
import { ApiError, fetchAllUsers } from "../lib/api/auth";
import {
  createAttendanceRecord,
  createDepartment,
  createEmployee,
  createPayrollRecord,
  createPerformanceRecord,
  createShift,
  createTask,
  deleteAttendanceRecord,
  deleteDepartment,
  deleteEmployee,
  deletePayrollRecord,
  deletePerformanceRecord,
  deleteShift,
  deleteTask,
  fetchAttendancePage,
  fetchAttendanceRecord,
  fetchDepartment,
  fetchDepartmentPage,
  fetchDepartments,
  fetchEmployee,
  fetchEmployees,
  fetchEmployeePage,
  fetchPayrollPage,
  fetchPayrollRecord,
  fetchPerformanceRecord,
  fetchPerformanceRecordPage,
  fetchShift,
  fetchShifts,
  fetchShiftPage,
  fetchTask,
  fetchTaskPage,
  fetchTasks,
  updateAttendanceRecord,
  updateDepartment,
  updateEmployee,
  updatePayrollRecord,
  updatePerformanceRecord,
  updateShift,
  updateTask,
} from "../lib/api/workforce";
import type { AdminUser } from "../types/auth";
import type {
  AttendancePayload,
  AttendanceRecord,
  AttendanceStatus,
  DepartmentPayload,
  DepartmentRecord,
  EmployeePayload,
  EmployeeRecord,
  EmployeeStatus,
  EmployeeWorkRole,
  PayrollPayload,
  PayrollRecord,
  PayrollStatus,
  PerformancePayload,
  PerformanceRecord,
  ShiftPayload,
  ShiftRecord,
  TaskPayload,
  TaskPriority,
  TaskRecord,
  TaskStatus,
} from "../types/workforce";

const fieldClassName =
  "w-full rounded-2xl border border-slate-200/80 bg-slate-50/70 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-300";
const textAreaClassName = `${fieldClassName} min-h-[108px] resize-y`;
const primaryButtonClassName =
  "inline-flex items-center justify-center gap-2 rounded-2xl border border-sky-200 bg-[linear-gradient(135deg,#1f87ad,#0f6d8d)] px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(32,141,183,0.22)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70";
const secondaryButtonClassName =
  "inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70";
const dangerButtonClassName =
  "inline-flex items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-70";
const iconButtonClassName =
  "inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70";
const tableActionButtonClassName =
  "inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50";

type ActiveModal =
  | "department"
  | "employee"
  | "shift"
  | "attendance"
  | "payroll"
  | "task"
  | "performance"
  | null;

type PageSizeOption = 5 | 6 | 10;

const pageSizeOptions: PageSizeOption[] = [10, 6, 5];

const employeeStatuses: EmployeeStatus[] = ["active", "inactive", "terminated"];
const employeeWorkRoles: Exclude<EmployeeWorkRole, "">[] = [
  "operator",
  "logistics",
  "sales",
  "maintenance",
];
const attendanceStatuses: AttendanceStatus[] = [
  "present",
  "absent",
  "late",
  "off",
  "leave",
];
const payrollStatuses: PayrollStatus[] = ["pending", "paid", "partial"];
const taskPriorities: TaskPriority[] = ["low", "medium", "high"];
const taskStatuses: TaskStatus[] = [
  "pending",
  "in_progress",
  "completed",
  "cancelled",
];

function titleCase(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function StatusBadge({
  label,
  tone,
}: {
  label: string;
  tone: "success" | "warning" | "danger" | "info" | "neutral";
}) {
  const toneClassName =
    tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : tone === "warning"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : tone === "danger"
          ? "border-red-200 bg-red-50 text-red-700"
          : tone === "info"
            ? "border-sky-200 bg-sky-50 text-sky-700"
            : "border-slate-200 bg-slate-50 text-slate-700";

  return (
    <span
      className={[
        "inline-flex rounded-full border px-2 py-1 text-[11px] uppercase tracking-[0.24em]",
        toneClassName,
      ].join(" ")}
    >
      {label}
    </span>
  );
}

function TablePaginationControls({
  pageSize,
  currentPage,
  totalPages,
  onPageSizeChange,
  onPrevious,
  onNext,
}: {
  pageSize: PageSizeOption;
  currentPage: number;
  totalPages: number;
  onPageSizeChange: (value: PageSizeOption) => void;
  onPrevious: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="inline-flex items-center gap-1 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-1">
        {pageSizeOptions.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onPageSizeChange(option)}
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

      <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-1">
        <button
          type="button"
          onClick={onPrevious}
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
          onClick={onNext}
          disabled={currentPage === totalPages}
          className="inline-flex h-10 w-10 items-center justify-center rounded-[1rem] text-slate-600 transition hover:bg-white hover:text-slate-900 disabled:opacity-45"
          aria-label="Next page"
        >
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function createEmptyEmployeeForm(): EmployeePayload {
  return {
    user: null,
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    job_title: "",
    department: null,
    work_role: "",
    hire_date: "",
    status: "active",
    termination_date: null,
    notes: "",
  };
}
function buildEmployeeForm(record: EmployeeRecord | null): EmployeePayload {
  if (!record) return createEmptyEmployeeForm();
  return {
    user: record.user,
    first_name: record.first_name,
    last_name: record.last_name,
    email: record.email,
    phone_number: record.phone_number,
    job_title: record.job_title,
    department: record.department,
    work_role: record.work_role,
    hire_date: record.hire_date,
    status: record.status,
    termination_date: record.termination_date,
    notes: record.notes,
  };
}

function createEmptyDepartmentForm(): DepartmentPayload {
  return {
    name: "",
    notes: "",
    is_active: true,
  };
}
function buildDepartmentForm(record: DepartmentRecord | null): DepartmentPayload {
  if (!record) return createEmptyDepartmentForm();
  return {
    name: record.name,
    notes: record.notes,
    is_active: record.is_active,
  };
}

function createEmptyShiftForm(): ShiftPayload {
  return {
    name: "",
    start_time: "",
    end_time: "",
    is_overnight: false,
    notes: "",
    is_active: true,
  };
}
function buildShiftForm(record: ShiftRecord | null): ShiftPayload {
  if (!record) return createEmptyShiftForm();
  return {
    name: record.name,
    start_time: record.start_time,
    end_time: record.end_time,
    is_overnight: record.is_overnight,
    notes: record.notes,
    is_active: record.is_active,
  };
}

function createEmptyAttendanceForm(): AttendancePayload {
  return {
    employee: 0,
    shift: null,
    attendance_date: "",
    status: "present",
    clock_in: null,
    clock_out: null,
    notes: "",
  };
}
function buildAttendanceForm(
  record: AttendanceRecord | null,
): AttendancePayload {
  if (!record) return createEmptyAttendanceForm();
  return {
    employee: record.employee,
    shift: record.shift,
    attendance_date: record.attendance_date,
    status: record.status,
    clock_in: record.clock_in,
    clock_out: record.clock_out,
    notes: record.notes,
  };
}

function createEmptyPayrollForm(): PayrollPayload {
  return {
    employee: 0,
    pay_period_start: "",
    pay_period_end: "",
    basic_pay: "0.00",
    bonuses: "0.00",
    deductions: "0.00",
    payment_status: "pending",
    payment_date: null,
    notes: "",
  };
}
function buildPayrollForm(record: PayrollRecord | null): PayrollPayload {
  if (!record) return createEmptyPayrollForm();
  return {
    employee: record.employee,
    pay_period_start: record.pay_period_start,
    pay_period_end: record.pay_period_end,
    basic_pay: record.basic_pay,
    bonuses: record.bonuses,
    deductions: record.deductions,
    payment_status: record.payment_status,
    payment_date: record.payment_date,
    notes: record.notes,
  };
}

function createEmptyTaskForm(): TaskPayload {
  return {
    employee: 0,
    title: "",
    description: "",
    assigned_by: null,
    assigned_date: "",
    due_date: null,
    priority: "medium",
    status: "pending",
    notes: "",
  };
}
function buildTaskForm(record: TaskRecord | null): TaskPayload {
  if (!record) return createEmptyTaskForm();
  return {
    employee: record.employee,
    title: record.title,
    description: record.description,
    assigned_by: record.assigned_by,
    assigned_date: record.assigned_date,
    due_date: record.due_date,
    priority: record.priority,
    status: record.status,
    notes: record.notes,
  };
}

function createEmptyPerformanceForm(): PerformancePayload {
  return {
    employee: 0,
    review_date: "",
    reviewer_name: "",
    score: "",
    strengths: "",
    improvement_areas: "",
    notes: "",
  };
}
function buildPerformanceForm(
  record: PerformanceRecord | null,
): PerformancePayload {
  if (!record) return createEmptyPerformanceForm();
  return {
    employee: record.employee,
    review_date: record.review_date,
    reviewer_name: record.reviewer_name,
    score: record.score,
    strengths: record.strengths,
    improvement_areas: record.improvement_areas,
    notes: record.notes,
  };
}

function FieldMessage({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {message}
    </div>
  );
}

function TableSearchField({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <input
      type="search"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className={`${fieldClassName} max-w-sm`}
    />
  );
}

function PickerField({
  value,
  options,
  onChange,
  searchable = false,
  searchPlaceholder = "Search options",
}: {
  value: string;
  options: Array<{ label: string; value: string; searchText?: string }>;
  onChange: (value: string) => void;
  searchable?: boolean;
  searchPlaceholder?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const containerRef = useRef<HTMLDivElement | null>(null);
  const selectedLabel =
    options.find((option) => option.value === value)?.label ??
    options[0]?.label ??
    "Select";
  const normalizedSearchValue = searchValue.trim().toLowerCase();
  const filteredOptions = searchable
    ? options.filter((option) =>
        (option.searchText ?? option.label)
          .toLowerCase()
          .includes(normalizedSearchValue),
      )
    : options;

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

  useEffect(() => {
    if (isOpen) {
      setSearchValue("");
    }
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
        <div className="absolute left-0 top-full z-20 mt-2 w-full rounded-3xl border border-slate-200 bg-white p-2 shadow-[0_24px_60px_rgba(15,23,42,0.14)]">
          {searchable ? (
            <div className="border-b border-slate-200 px-1 pb-2">
              <input
                type="text"
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder={searchPlaceholder}
                className="w-full rounded-2xl border border-slate-200/80 bg-slate-50/70 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-300"
              />
            </div>
          ) : null}
          <div className="scrollbar-hidden mt-2 max-h-[280px] space-y-1 overflow-y-auto pr-1">
            {filteredOptions.length ? filteredOptions.map((option) => (
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
            )) : (
              <div className="rounded-2xl px-3 py-4 text-sm text-slate-500">
                No matches found.
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function FormPanel({
  label,
  title,
  children,
}: {
  label: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="panel p-6">
      <p className="section-label">{label}</p>
      <h2 className="mt-2 text-2xl font-semibold text-slate-900">{title}</h2>
      <div className="mt-6">{children}</div>
    </section>
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
            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
          >
            Close
          </button>
        </div>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Not set";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("en-UG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(parsed);
}

export function WorkforcePage() {
  const { user } = useAuth();
  const canManageWorkforce =
    user?.role.code === "admin" ||
    user?.role.code === "superuser" ||
    user?.role.code === "hr";
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [activeTab, setActiveTab] = useState("departments");

  const tabs = [
    { id: "departments", label: "Departments" },
    { id: "employees", label: "Employees" },
    { id: "shifts", label: "Shifts" },
    { id: "attendance", label: "Attendance" },
    { id: "payroll", label: "Payroll" },
    { id: "tasks", label: "Tasks" },
    { id: "performance", label: "Performance" },
  ];
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const [departments, setDepartments] = useState<DepartmentRecord[]>([]);
  const [departmentOptions, setDepartmentOptions] = useState<
    DepartmentRecord[]
  >([]);
  const [totalDepartments, setTotalDepartments] = useState(0);
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [employeeOptions, setEmployeeOptions] = useState<EmployeeRecord[]>([]);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [shifts, setShifts] = useState<ShiftRecord[]>([]);
  const [shiftOptions, setShiftOptions] = useState<ShiftRecord[]>([]);
  const [totalShifts, setTotalShifts] = useState(0);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [totalAttendance, setTotalAttendance] = useState(0);
  const [payroll, setPayroll] = useState<PayrollRecord[]>([]);
  const [totalPayroll, setTotalPayroll] = useState(0);
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [taskRows, setTaskRows] = useState<TaskRecord[]>([]);
  const [totalTasks, setTotalTasks] = useState(0);
  const [performanceRecords, setPerformanceRecords] = useState<
    PerformanceRecord[]
  >([]);
  const [totalPerformanceRecords, setTotalPerformanceRecords] = useState(0);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [pageSize, setPageSize] = useState<PageSizeOption>(10);
  const [departmentPage, setDepartmentPage] = useState(1);
  const [employeePage, setEmployeePage] = useState(1);
  const [shiftPage, setShiftPage] = useState(1);
  const [attendancePage, setAttendancePage] = useState(1);
  const [payrollPage, setPayrollPage] = useState(1);
  const [taskPage, setTaskPage] = useState(1);
  const [performancePage, setPerformancePage] = useState(1);
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [attendanceSearch, setAttendanceSearch] = useState("");
  const [payrollSearch, setPayrollSearch] = useState("");
  const [taskSearch, setTaskSearch] = useState("");
  const [performanceSearch, setPerformanceSearch] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const [departmentForm, setDepartmentForm] = useState<DepartmentPayload>(
    createEmptyDepartmentForm(),
  );
  const [employeeForm, setEmployeeForm] = useState<EmployeePayload>(
    createEmptyEmployeeForm(),
  );
  const [shiftForm, setShiftForm] = useState<ShiftPayload>(
    createEmptyShiftForm(),
  );
  const [attendanceForm, setAttendanceForm] = useState<AttendancePayload>(
    createEmptyAttendanceForm(),
  );
  const [payrollForm, setPayrollForm] = useState<PayrollPayload>(
    createEmptyPayrollForm(),
  );
  const [taskForm, setTaskForm] = useState<TaskPayload>(createEmptyTaskForm());
  const [performanceForm, setPerformanceForm] = useState<PerformancePayload>(
    createEmptyPerformanceForm(),
  );

  const [selectedDepartmentId, setSelectedDepartmentId] = useState<
    number | null
  >(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(
    null,
  );
  const [selectedShiftId, setSelectedShiftId] = useState<number | null>(null);
  const [selectedAttendanceId, setSelectedAttendanceId] = useState<
    number | null
  >(null);
  const [selectedPayrollId, setSelectedPayrollId] = useState<number | null>(
    null,
  );
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [selectedPerformanceId, setSelectedPerformanceId] = useState<
    number | null
  >(null);

  const [departmentError, setDepartmentError] = useState("");
  const [employeeError, setEmployeeError] = useState("");
  const [shiftError, setShiftError] = useState("");
  const [attendanceError, setAttendanceError] = useState("");
  const [payrollError, setPayrollError] = useState("");
  const [taskError, setTaskError] = useState("");
  const [performanceError, setPerformanceError] = useState("");

  const [isDepartmentPending, setIsDepartmentPending] = useState(false);
  const [isEmployeePending, setIsEmployeePending] = useState(false);
  const [isShiftPending, setIsShiftPending] = useState(false);
  const [isAttendancePending, setIsAttendancePending] = useState(false);
  const [isPayrollPending, setIsPayrollPending] = useState(false);
  const [isTaskPending, setIsTaskPending] = useState(false);
  const [isPerformancePending, setIsPerformancePending] = useState(false);

  const buildAssignableDepartmentOptions = (
    selectedDepartmentId?: number | null,
  ) =>
    departmentOptions.filter(
      (item) => item.is_active || item.id === selectedDepartmentId,
    );

  const buildActiveReviewerOptions = (selectedReviewer?: string) =>
    users
      .filter((item) => item.is_active)
      .map((item) => ({
        label: `${item.first_name} ${item.last_name}`.trim() || item.email,
        value: `${item.first_name} ${item.last_name}`.trim() || item.email,
      }))
      .filter(
        (item, index, collection) =>
          collection.findIndex((entry) => entry.value === item.value) === index,
      )
      .concat(
        selectedReviewer &&
          !users.some((item) => {
            const displayName =
              `${item.first_name} ${item.last_name}`.trim() || item.email;
            return displayName === selectedReviewer;
          })
          ? [{ label: selectedReviewer, value: selectedReviewer }]
          : [],
      );

  const buildAssignableEmployeeOptions = (selectedEmployeeId?: number | null) =>
    employeeOptions.filter(
      (item) => item.status === "active" || item.id === selectedEmployeeId,
    );
  const buildEmployeePickerOptions = (selectedEmployeeId?: number | null) =>
    buildAssignableEmployeeOptions(selectedEmployeeId).map((record) => ({
      label:
        record.status === "active"
          ? record.full_name
          : `${record.full_name} (${titleCase(record.status)})`,
      value: String(record.id),
      searchText: [
        record.full_name,
        record.employee_code,
        record.email,
        record.job_title,
        record.work_role,
        record.status,
      ]
        .filter(Boolean)
        .join(" "),
    }));

  const buildAssignableShiftOptions = (selectedShiftId?: number | null) =>
    shiftOptions.filter(
      (item) => item.is_active || item.id === selectedShiftId,
    );
  const buildSupervisorOptions = (selectedUserId?: number | null) =>
    users
      .filter((item) => item.is_active || item.id === selectedUserId)
      .map((item) => {
        const fullName = `${item.first_name} ${item.last_name}`.trim();
        return {
          label: fullName || item.email,
          value: String(item.id),
          searchText: `${fullName} ${item.email}`.trim(),
        };
      });
  const userEmailById = new Map(
    users.map((record) => [record.id, record.email]),
  );
  const totalDepartmentPages = Math.max(
    1,
    Math.ceil(totalDepartments / pageSize),
  );
  const totalEmployeePages = Math.max(1, Math.ceil(totalEmployees / pageSize));
  const totalShiftPages = Math.max(1, Math.ceil(totalShifts / pageSize));
  const totalAttendancePages = Math.max(
    1,
    Math.ceil(totalAttendance / pageSize),
  );
  const totalPayrollPages = Math.max(1, Math.ceil(totalPayroll / pageSize));
  const totalTaskPages = Math.max(1, Math.ceil(totalTasks / pageSize));
  const totalPerformancePages = Math.max(
    1,
    Math.ceil(totalPerformanceRecords / pageSize),
  );
  const departmentFillerRowCount = Math.max(pageSize - departments.length, 0);
  const employeeFillerRowCount = Math.max(pageSize - employees.length, 0);
  const shiftFillerRowCount = Math.max(pageSize - shifts.length, 0);
  const attendanceFillerRowCount = Math.max(pageSize - attendance.length, 0);
  const payrollFillerRowCount = Math.max(pageSize - payroll.length, 0);
  const taskFillerRowCount = Math.max(pageSize - taskRows.length, 0);
  const performanceFillerRowCount = Math.max(
    pageSize - performanceRecords.length,
    0,
  );

  async function reloadWorkforceData() {
    const [
      nextDepartmentPage,
      nextEmployeePage,
      nextShiftPage,
      nextAttendancePage,
      nextPayrollPage,
      nextTaskPage,
      nextTasks,
      nextPerformancePage,
      nextDepartments,
      nextEmployeeOptions,
      nextShiftOptions,
      nextUsers,
    ] = await Promise.all([
      fetchDepartmentPage({ page: departmentPage, pageSize }),
      fetchEmployeePage({
        page: employeePage,
        pageSize,
        search: employeeSearch,
      }),
      fetchShiftPage({ page: shiftPage, pageSize }),
      fetchAttendancePage({
        page: attendancePage,
        pageSize,
        search: attendanceSearch,
      }),
      fetchPayrollPage({
        page: payrollPage,
        pageSize,
        search: payrollSearch,
      }),
      fetchTaskPage({ page: taskPage, pageSize, search: taskSearch }),
      fetchTasks(),
      fetchPerformanceRecordPage({
        page: performancePage,
        pageSize,
        search: performanceSearch,
      }),
      fetchDepartments(),
      fetchEmployees(),
      fetchShifts(),
      fetchAllUsers(),
    ]);

    setDepartments(nextDepartmentPage.results);
    setTotalDepartments(nextDepartmentPage.count);
    setEmployees(nextEmployeePage.results);
    setTotalEmployees(nextEmployeePage.count);
    setShifts(nextShiftPage.results);
    setTotalShifts(nextShiftPage.count);
    setAttendance(nextAttendancePage.results);
    setTotalAttendance(nextAttendancePage.count);
    setPayroll(nextPayrollPage.results);
    setTotalPayroll(nextPayrollPage.count);
    setTaskRows(nextTaskPage.results);
    setTotalTasks(nextTaskPage.count);
    setTasks(nextTasks);
    setPerformanceRecords(nextPerformancePage.results);
    setTotalPerformanceRecords(nextPerformancePage.count);
    setDepartmentOptions(nextDepartments);
    setEmployeeOptions(nextEmployeeOptions);
    setShiftOptions(nextShiftOptions);
    setUsers(nextUsers);
  }

  useEffect(() => {
    if (!canManageWorkforce) {
      setIsLoading(false);
      setPageError("");
      return;
    }

    let isMounted = true;
    const load = async () => {
      setIsLoading(true);
      setPageError("");
      try {
        await reloadWorkforceData();
        if (isMounted) {
          setHasLoadedOnce(true);
        }
      } catch (error) {
        if (isMounted) {
          setPageError(
            error instanceof ApiError
              ? error.message
              : "Unable to load workforce data right now.",
          );
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    void load();
    return () => {
      isMounted = false;
    };
  }, [
    attendancePage,
    attendanceSearch,
    departmentPage,
    employeePage,
    employeeSearch,
    pageSize,
    payrollPage,
    payrollSearch,
    performancePage,
    performanceSearch,
    reloadKey,
    shiftPage,
    taskPage,
    taskSearch,
    canManageWorkforce,
  ]);

  useEffect(() => {
    setEmployeePage(1);
  }, [employeeSearch]);

  useEffect(() => {
    setAttendancePage(1);
  }, [attendanceSearch]);

  useEffect(() => {
    setPayrollPage(1);
  }, [payrollSearch]);

  useEffect(() => {
    setTaskPage(1);
  }, [taskSearch]);

  useEffect(() => {
    setPerformancePage(1);
  }, [performanceSearch]);

  useEffect(() => {
    if (!selectedDepartmentId) return;
    let isMounted = true;
    const load = async () => {
      try {
        const record = await fetchDepartment(selectedDepartmentId);
        if (isMounted) setDepartmentForm(buildDepartmentForm(record));
      } catch {
        if (isMounted) {
          setDepartmentForm(
            buildDepartmentForm(
              departmentOptions.find((item) => item.id === selectedDepartmentId) ??
                null,
            ),
          );
        }
      }
    };
    void load();
    return () => {
      isMounted = false;
    };
  }, [departmentOptions, selectedDepartmentId]);

  useEffect(() => {
    if (!selectedEmployeeId) return;
    let isMounted = true;
    const load = async () => {
      try {
        const record = await fetchEmployee(selectedEmployeeId);
        if (isMounted) setEmployeeForm(buildEmployeeForm(record));
      } catch {
        if (isMounted) {
          setEmployeeForm(
            buildEmployeeForm(
              employeeOptions.find((item) => item.id === selectedEmployeeId) ??
                null,
            ),
          );
        }
      }
    };
    void load();
    return () => {
      isMounted = false;
    };
  }, [employeeOptions, selectedEmployeeId]);

  useEffect(() => {
    if (!selectedShiftId) return;
    let isMounted = true;
    const load = async () => {
      try {
        const record = await fetchShift(selectedShiftId);
        if (isMounted) setShiftForm(buildShiftForm(record));
      } catch {
        if (isMounted) {
          setShiftForm(
            buildShiftForm(
              shiftOptions.find((item) => item.id === selectedShiftId) ?? null,
            ),
          );
        }
      }
    };
    void load();
    return () => {
      isMounted = false;
    };
  }, [selectedShiftId, shiftOptions]);

  useEffect(() => {
    if (!selectedAttendanceId) return;
    let isMounted = true;
    const load = async () => {
      try {
        const record = await fetchAttendanceRecord(selectedAttendanceId);
        if (isMounted) setAttendanceForm(buildAttendanceForm(record));
      } catch {
        if (isMounted)
          setAttendanceForm(
            buildAttendanceForm(
              attendance.find((item) => item.id === selectedAttendanceId) ??
                null,
            ),
          );
      }
    };
    void load();
    return () => {
      isMounted = false;
    };
  }, [selectedAttendanceId, attendance]);

  useEffect(() => {
    if (!selectedPayrollId) return;
    let isMounted = true;
    const load = async () => {
      try {
        const record = await fetchPayrollRecord(selectedPayrollId);
        if (isMounted) setPayrollForm(buildPayrollForm(record));
      } catch {
        if (isMounted)
          setPayrollForm(
            buildPayrollForm(
              payroll.find((item) => item.id === selectedPayrollId) ?? null,
            ),
          );
      }
    };
    void load();
    return () => {
      isMounted = false;
    };
  }, [selectedPayrollId, payroll]);

  useEffect(() => {
    if (!selectedTaskId) return;
    let isMounted = true;
    const load = async () => {
      try {
        const record = await fetchTask(selectedTaskId);
        if (isMounted) setTaskForm(buildTaskForm(record));
      } catch {
        if (isMounted)
          setTaskForm(
            buildTaskForm(
              tasks.find((item) => item.id === selectedTaskId) ?? null,
            ),
          );
      }
    };
    void load();
    return () => {
      isMounted = false;
    };
  }, [selectedTaskId, tasks]);

  useEffect(() => {
    if (taskRows.length === 0 && totalTasks > 0 && taskPage > totalTaskPages) {
      setTaskPage(totalTaskPages);
    }
  }, [taskPage, taskRows.length, totalTaskPages, totalTasks]);

  useEffect(() => {
    if (!selectedPerformanceId) return;
    let isMounted = true;
    const load = async () => {
      try {
        const record = await fetchPerformanceRecord(selectedPerformanceId);
        if (isMounted) setPerformanceForm(buildPerformanceForm(record));
      } catch {
        if (isMounted)
          setPerformanceForm(
            buildPerformanceForm(
              performanceRecords.find(
                (item) => item.id === selectedPerformanceId,
              ) ?? null,
            ),
          );
      }
    };
    void load();
    return () => {
      isMounted = false;
    };
  }, [selectedPerformanceId, performanceRecords]);

  useEffect(() => {
    if (
      employees.length === 0 &&
      totalEmployees > 0 &&
      employeePage > totalEmployeePages
    ) {
      setEmployeePage(totalEmployeePages);
    }
  }, [employeePage, employees.length, totalEmployeePages, totalEmployees]);

  useEffect(() => {
    if (shifts.length === 0 && totalShifts > 0 && shiftPage > totalShiftPages) {
      setShiftPage(totalShiftPages);
    }
  }, [shiftPage, shifts.length, totalShiftPages, totalShifts]);

  useEffect(() => {
    if (
      attendance.length === 0 &&
      totalAttendance > 0 &&
      attendancePage > totalAttendancePages
    ) {
      setAttendancePage(totalAttendancePages);
    }
  }, [
    attendance.length,
    attendancePage,
    totalAttendance,
    totalAttendancePages,
  ]);

  useEffect(() => {
    if (
      payroll.length === 0 &&
      totalPayroll > 0 &&
      payrollPage > totalPayrollPages
    ) {
      setPayrollPage(totalPayrollPages);
    }
  }, [payroll.length, payrollPage, totalPayroll, totalPayrollPages]);

  useEffect(() => {
    if (
      performanceRecords.length === 0 &&
      totalPerformanceRecords > 0 &&
      performancePage > totalPerformancePages
    ) {
      setPerformancePage(totalPerformancePages);
    }
  }, [
    performancePage,
    performanceRecords.length,
    totalPerformancePages,
    totalPerformanceRecords,
  ]);

  const handlePageSizeChange = (value: PageSizeOption) => {
    setPageSize(value);
    setDepartmentPage(1);
    setEmployeePage(1);
    setShiftPage(1);
    setAttendancePage(1);
    setPayrollPage(1);
    setTaskPage(1);
    setPerformancePage(1);
  };

  const resetDepartmentState = () => {
    setSelectedDepartmentId(null);
    setDepartmentForm(createEmptyDepartmentForm());
    setDepartmentError("");
  };
  const resetEmployeeState = () => {
    setSelectedEmployeeId(null);
    setEmployeeForm(createEmptyEmployeeForm());
    setEmployeeError("");
  };
  const resetShiftState = () => {
    setSelectedShiftId(null);
    setShiftForm(createEmptyShiftForm());
    setShiftError("");
  };
  const resetAttendanceState = () => {
    setSelectedAttendanceId(null);
    setAttendanceForm(createEmptyAttendanceForm());
    setAttendanceError("");
  };
  const resetPayrollState = () => {
    setSelectedPayrollId(null);
    setPayrollForm(createEmptyPayrollForm());
    setPayrollError("");
  };
  const resetTaskState = () => {
    setSelectedTaskId(null);
    setTaskForm(createEmptyTaskForm());
    setTaskError("");
  };
  const resetPerformanceState = () => {
    setSelectedPerformanceId(null);
    setPerformanceForm(createEmptyPerformanceForm());
    setPerformanceError("");
  };

  const closeModal = () => {
    resetDepartmentState();
    resetEmployeeState();
    resetShiftState();
    resetAttendanceState();
    resetPayrollState();
    resetTaskState();
    resetPerformanceState();
    setActiveModal(null);
  };

  const refreshWorkforceData = () => {
    setReloadKey((current) => current + 1);
  };

  const handleDepartmentSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setDepartmentError("");
    setIsDepartmentPending(true);
    try {
      const payload = {
        ...departmentForm,
        name: departmentForm.name.trim(),
        notes: departmentForm.notes.trim(),
      };
      if (selectedDepartmentId) await updateDepartment(selectedDepartmentId, payload);
      else await createDepartment(payload);
      refreshWorkforceData();
      closeModal();
    } catch (error) {
      setDepartmentError(
        error instanceof ApiError
          ? error.message
          : "Unable to save the department right now.",
      );
    } finally {
      setIsDepartmentPending(false);
    }
  };

  const handleEmployeeSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setEmployeeError("");
    if (!employeeForm.work_role) {
      setEmployeeError("Choose a work role before saving the employee.");
      return;
    }
    if (
      employeeForm.status === "terminated" &&
      !employeeForm.termination_date
    ) {
      setEmployeeError("Add a termination date for terminated employees.");
      return;
    }
    setIsEmployeePending(true);
    try {
      const payload = {
        ...employeeForm,
        first_name: employeeForm.first_name.trim(),
        last_name: employeeForm.last_name.trim(),
        email: employeeForm.email.trim(),
        phone_number: employeeForm.phone_number.trim(),
        job_title: employeeForm.job_title.trim(),
        department: employeeForm.department,
        termination_date:
          employeeForm.status === "terminated"
            ? employeeForm.termination_date
            : null,
        notes: employeeForm.notes.trim(),
      };
      if (selectedEmployeeId) await updateEmployee(selectedEmployeeId, payload);
      else await createEmployee(payload);
      refreshWorkforceData();
      closeModal();
    } catch (error) {
      setEmployeeError(
        error instanceof ApiError
          ? error.message
          : "Unable to save the employee right now.",
      );
    } finally {
      setIsEmployeePending(false);
    }
  };

  const handleShiftSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setShiftError("");
    setIsShiftPending(true);
    try {
      const payload = {
        ...shiftForm,
        name: shiftForm.name.trim(),
        notes: shiftForm.notes.trim(),
      };
      if (selectedShiftId) await updateShift(selectedShiftId, payload);
      else await createShift(payload);
      refreshWorkforceData();
      closeModal();
    } catch (error) {
      setShiftError(
        error instanceof ApiError
          ? error.message
          : "Unable to save the shift right now.",
      );
    } finally {
      setIsShiftPending(false);
    }
  };

  const handleAttendanceSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAttendanceError("");
    setIsAttendancePending(true);
    try {
      const payload = { ...attendanceForm, notes: attendanceForm.notes.trim() };
      if (selectedAttendanceId)
        await updateAttendanceRecord(selectedAttendanceId, payload);
      else await createAttendanceRecord(payload);
      refreshWorkforceData();
      closeModal();
    } catch (error) {
      setAttendanceError(
        error instanceof ApiError
          ? error.message
          : "Unable to save attendance right now.",
      );
    } finally {
      setIsAttendancePending(false);
    }
  };

  const handlePayrollSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPayrollError("");
    setIsPayrollPending(true);
    try {
      const payload = { ...payrollForm, notes: payrollForm.notes.trim() };
      if (selectedPayrollId)
        await updatePayrollRecord(selectedPayrollId, payload);
      else await createPayrollRecord(payload);
      refreshWorkforceData();
      closeModal();
    } catch (error) {
      setPayrollError(
        error instanceof ApiError
          ? error.message
          : "Unable to save payroll right now.",
      );
    } finally {
      setIsPayrollPending(false);
    }
  };

  const handleTaskSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTaskError("");
    setIsTaskPending(true);
    try {
      const payload = {
        ...taskForm,
        title: taskForm.title.trim(),
        description: taskForm.description.trim(),
        notes: taskForm.notes.trim(),
      };
      if (selectedTaskId) await updateTask(selectedTaskId, payload);
      else await createTask(payload);
      refreshWorkforceData();
      closeModal();
    } catch (error) {
      setTaskError(
        error instanceof ApiError
          ? error.message
          : "Unable to save the task right now.",
      );
    } finally {
      setIsTaskPending(false);
    }
  };

  const handlePerformanceSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPerformanceError("");
    setIsPerformancePending(true);
    try {
      const payload = {
        ...performanceForm,
        reviewer_name: performanceForm.reviewer_name,
        strengths: performanceForm.strengths.trim(),
        improvement_areas: performanceForm.improvement_areas.trim(),
        notes: performanceForm.notes.trim(),
      };
      if (selectedPerformanceId)
        await updatePerformanceRecord(selectedPerformanceId, payload);
      else await createPerformanceRecord(payload);
      refreshWorkforceData();
      closeModal();
    } catch (error) {
      setPerformanceError(
        error instanceof ApiError
          ? error.message
          : "Unable to save the performance record right now.",
      );
    } finally {
      setIsPerformancePending(false);
    }
  };

  const handleDelete = async (
    kind: ActiveModal,
    id: number | null,
    setError: (message: string) => void,
    setPending: (value: boolean) => void,
    deleter: (targetId: number) => Promise<void>,
  ) => {
    if (!id || !kind) return;
    setError("");
    setPending(true);
    try {
      await deleter(id);
      refreshWorkforceData();
      closeModal();
    } catch (error) {
      setError(
        error instanceof ApiError
          ? error.message
          : "Unable to delete this record right now.",
      );
    } finally {
      setPending(false);
    }
  };

  if (!canManageWorkforce) {
    return (
      <section className="panel max-w-3xl p-8">
        <p className="section-label">Workforce</p>
        <div className="mt-4 flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 text-amber-700">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              Workforce access is restricted
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
              Managing employees, shifts, attendance, payroll, tasks, and
              performance is limited to HR and admin accounts.
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (isLoading && !hasLoadedOnce) {
    return (
      <section className="panel flex min-h-[320px] items-center justify-center p-8">
        <div className="flex items-center gap-3 text-slate-600">
          <LoaderCircle className="h-5 w-5 animate-spin text-sky-700" />
          <span>Loading workforce workspace...</span>
        </div>
      </section>
    );
  }

  if (pageError && !hasLoadedOnce) {
    return (
      <section className="panel max-w-3xl p-8">
        <p className="section-label">Workforce</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-900">
          Workforce workspace
        </h1>
        <div className="mt-6 rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {pageError}
        </div>
      </section>
    );
  }

  return (
    <div className="module-page">
      <section className="rounded-[32px] border border-white/70 bg-[radial-gradient(circle_at_top_left,#ffffff,rgba(224,242,254,0.92)_52%,rgba(240,249,255,0.95))] py-6 pl-6 pr-0 shadow-[0_25px_80px_rgba(148,163,184,0.14)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/75 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-sky-700">
              Workforce
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
                Staff and HR operations
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-slate-600">
                This module handles employee records, shifts, attendance,
                payroll, tasks, and performance without drifting into deep
                automation.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="hero-metric-card">
              <p className="hero-metric-label">Employees</p>
              <p className="hero-metric-value">{totalEmployees}</p>
            </div>
            <div className="hero-metric-card">
              <p className="hero-metric-label">Shifts</p>
              <p className="hero-metric-value">
                {shiftOptions.filter((item) => item.is_active).length}
              </p>
            </div>
            <div className="hero-metric-card">
              <p className="hero-metric-label">Open tasks</p>
              <p className="hero-metric-value">
                {
                  tasks.filter(
                    (item) =>
                      item.status !== "completed" &&
                      item.status !== "cancelled",
                  ).length
                }
              </p>
            </div>
            <div className="hero-metric-card">
              <p className="hero-metric-label">Payroll</p>
              <p className="hero-metric-value">{totalPayroll}</p>
            </div>
          </div>
        </div>
      </section>
      <ModuleTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      <div className="module-page-stage justify-start">
        <div className="space-y-6">
          {activeTab === "departments" ? (
            <section className="panel p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="section-label">Departments</p>
                  <h2 className="mt-1 text-2xl font-semibold text-slate-900">
                    Department setup
                  </h2>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <TablePaginationControls
                    pageSize={pageSize}
                    currentPage={departmentPage}
                    totalPages={totalDepartmentPages}
                    onPageSizeChange={handlePageSizeChange}
                    onPrevious={() =>
                      setDepartmentPage((page) => Math.max(1, page - 1))
                    }
                    onNext={() =>
                      setDepartmentPage((page) =>
                        Math.min(totalDepartmentPages, page + 1),
                      )
                    }
                  />
                  <button
                    type="button"
                    onClick={() => {
                      resetDepartmentState();
                      setActiveModal("department");
                    }}
                    className={iconButtonClassName}
                    aria-label="Add department"
                    title="Add department"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mt-5 min-h-0 overflow-x-auto overflow-y-hidden">
                {departments.length === 0 ? (
                  <div className="flex min-h-[320px] items-start rounded-2xl border border-slate-200/80 bg-slate-50/70 px-4 py-6 text-sm text-slate-600">
                    No departments defined yet.
                  </div>
                ) : (
                  <table className="min-w-full border-separate border-spacing-0">
                    <thead>
                      <tr>
                        <th className="rounded-tl-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                          Department
                        </th>
                        <th className="border-y border-slate-200/80 bg-slate-50/80 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                          Status
                        </th>
                        <th className="rounded-tr-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {departments.map((record, index) => {
                        const rowClass =
                          index === departments.length - 1 &&
                          departmentFillerRowCount === 0
                            ? "border-b border-slate-200/80"
                            : "border-b border-slate-200/60";
                        return (
                          <tr key={record.id}>
                            <td
                              className={`${rowClass} border-l border-r border-slate-200/80 bg-white px-4 py-4`}
                            >
                              <p className="text-sm font-semibold text-slate-900">
                                {record.name}
                              </p>
                              <p className="mt-1 text-sm text-slate-500">
                                {record.notes || "No notes"}
                              </p>
                            </td>
                            <td
                              className={`${rowClass} border-r border-slate-200/80 bg-white px-4 py-4`}
                            >
                              <StatusBadge
                                label={record.is_active ? "Active" : "Inactive"}
                                tone={record.is_active ? "success" : "warning"}
                              />
                            </td>
                            <td
                              className={`${rowClass} rounded-br-2xl border-r border-slate-200/80 bg-white px-4 py-4`}
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedDepartmentId(record.id);
                                  setDepartmentForm(buildDepartmentForm(record));
                                  setActiveModal("department");
                                }}
                                className={tableActionButtonClassName}
                              >
                                <Pencil className="h-4 w-4" />
                                View
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {Array.from({ length: departmentFillerRowCount }).map(
                        (_, index) => {
                          const isLastFiller =
                            index === departmentFillerRowCount - 1;
                          const rowClass = isLastFiller
                            ? "border-b border-slate-200/80"
                            : "border-b border-slate-200/60";
                          return (
                            <tr key={`department-filler-${index}`} aria-hidden="true">
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
                                className={`${rowClass} rounded-br-2xl border-r border-slate-200/80 bg-white px-4 py-4`}
                              >
                                <div className="h-6" />
                              </td>
                            </tr>
                          );
                        },
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </section>
          ) : null}

          {activeTab === "employees" ? (
            <section className="panel p-6">
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex-1 min-w-[240px]">
                    <TableSearchField
                      value={employeeSearch}
                      onChange={setEmployeeSearch}
                      placeholder="Search employees"
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <TablePaginationControls
                      pageSize={pageSize}
                      currentPage={employeePage}
                      totalPages={totalEmployeePages}
                      onPageSizeChange={handlePageSizeChange}
                      onPrevious={() =>
                        setEmployeePage((page) => Math.max(1, page - 1))
                      }
                      onNext={() =>
                        setEmployeePage((page) =>
                          Math.min(totalEmployeePages, page + 1),
                        )
                      }
                    />
                    <button
                      type="button"
                      onClick={() => {
                        resetEmployeeState();
                        setActiveModal("employee");
                      }}
                      className={iconButtonClassName}
                      aria-label="Add employee"
                      title="Add employee"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="min-h-0 overflow-x-auto overflow-y-hidden">
                  {employees.length === 0 ? (
                    <div className="flex min-h-[420px] items-start rounded-2xl border border-slate-200/80 bg-slate-50/70 px-4 py-6 text-sm text-slate-600">
                      No employees recorded yet.
                    </div>
                  ) : (
                    <table className="min-w-full border-separate border-spacing-0">
                      <thead>
                        <tr>
                          <th className="rounded-tl-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                            Employee
                          </th>
                          <th className="border-y border-slate-200/80 bg-slate-50/80 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                            Code
                          </th>
                          <th className="border-y border-slate-200/80 bg-slate-50/80 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                            Job title
                          </th>
                          <th className="border-y border-slate-200/80 bg-slate-50/80 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                            Work role
                          </th>
                          <th className="border-y border-slate-200/80 bg-slate-50/80 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                            Status
                          </th>
                          <th className="border-y border-slate-200/80 bg-slate-50/80 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                            Hire date
                          </th>
                          <th className="rounded-tr-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {employees.map((record, index) => {
                          const isLast =
                            index === employees.length - 1 &&
                            employeeFillerRowCount === 0;
                          const rowClass = isLast
                            ? "border-b border-slate-200/80"
                            : "border-b border-slate-200/60";
                          return (
                            <tr key={record.id}>
                              <td
                                className={`${rowClass} border-l border-r border-slate-200/80 bg-white px-4 py-4`}
                              >
                                <div className="min-w-[240px]">
                                  <p className="text-sm font-semibold text-slate-900">
                                    {record.full_name}
                                  </p>
                                  <p className="mt-1 text-sm text-slate-500">
                                    {record.email ||
                                      (record.user
                                        ? (userEmailById.get(record.user) ??
                                          `User #${record.user}`)
                                        : "No email")}
                                  </p>
                                </div>
                              </td>
                              <td
                                className={`${rowClass} border-r border-slate-200/80 bg-white px-4 py-4 text-sm text-slate-600`}
                              >
                                {record.employee_code}
                              </td>
                              <td
                                className={`${rowClass} border-r border-slate-200/80 bg-white px-4 py-4 text-sm text-slate-600`}
                              >
                                {record.job_title || "Not set"}
                              </td>
                              <td
                                className={`${rowClass} border-r border-slate-200/80 bg-white px-4 py-4 text-sm text-slate-600`}
                              >
                                {record.work_role
                                  ? titleCase(record.work_role)
                                  : "Not set"}
                              </td>
                              <td
                                className={`${rowClass} border-r border-slate-200/80 bg-white px-4 py-4`}
                              >
                                <StatusBadge
                                  label={titleCase(record.status)}
                                  tone={
                                    record.status === "active"
                                      ? "success"
                                      : record.status === "inactive"
                                        ? "warning"
                                        : "danger"
                                  }
                                />
                                {record.status === "terminated" &&
                                record.termination_date ? (
                                  <p className="mt-2 text-xs text-slate-500">
                                    Terminated{" "}
                                    {formatDate(record.termination_date)}
                                  </p>
                                ) : null}
                              </td>
                              <td
                                className={`${rowClass} border-r border-slate-200/80 bg-white px-4 py-4 text-sm text-slate-600`}
                              >
                                {formatDate(record.hire_date)}
                              </td>
                              <td
                                className={`${rowClass} rounded-br-2xl border-r border-slate-200/80 bg-white px-4 py-4`}
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedEmployeeId(record.id);
                                    setEmployeeForm(buildEmployeeForm(record));
                                    setActiveModal("employee");
                                  }}
                                  className={tableActionButtonClassName}
                                >
                                  <Pencil className="h-4 w-4" />
                                  View
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                        {Array.from({ length: employeeFillerRowCount }).map(
                          (_, index) => {
                            const isLastFiller =
                              index === employeeFillerRowCount - 1;
                            const rowClass = isLastFiller
                              ? "border-b border-slate-200/80"
                              : "border-b border-slate-200/60";

                            return (
                              <tr
                                key={`employee-filler-${index}`}
                                aria-hidden="true"
                              >
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
                          },
                        )}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </section>
          ) : null}

          {activeTab === "shifts" ? (
            <section className="panel p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="section-label">Shifts</p>
                  <h2 className="mt-1 text-2xl font-semibold text-slate-900">
                    Shift setup
                  </h2>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <TablePaginationControls
                    pageSize={pageSize}
                    currentPage={shiftPage}
                    totalPages={totalShiftPages}
                    onPageSizeChange={handlePageSizeChange}
                    onPrevious={() =>
                      setShiftPage((page) => Math.max(1, page - 1))
                    }
                    onNext={() =>
                      setShiftPage((page) =>
                        Math.min(totalShiftPages, page + 1),
                      )
                    }
                  />
                  <button
                    type="button"
                    onClick={() => {
                      resetShiftState();
                      setActiveModal("shift");
                    }}
                    className={iconButtonClassName}
                    aria-label="Add shift"
                    title="Add shift"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="mt-5 min-h-0 overflow-x-auto overflow-y-hidden">
                {shifts.length === 0 ? (
                  <div className="flex min-h-[320px] items-start rounded-2xl border border-slate-200/80 bg-slate-50/70 px-4 py-6 text-sm text-slate-600">
                    No shifts defined yet.
                  </div>
                ) : (
                  <table className="min-w-full border-separate border-spacing-0">
                    <thead>
                      <tr>
                        <th className="rounded-tl-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                          Shift
                        </th>
                        <th className="border-y border-slate-200/80 bg-slate-50/80 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                          Hours
                        </th>
                        <th className="border-y border-slate-200/80 bg-slate-50/80 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                          Type
                        </th>
                        <th className="border-y border-slate-200/80 bg-slate-50/80 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                          Status
                        </th>
                        <th className="rounded-tr-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {shifts.map((record, index) => {
                        const rowClass =
                          index === shifts.length - 1 &&
                          shiftFillerRowCount === 0
                            ? "border-b border-slate-200/80"
                            : "border-b border-slate-200/60";
                        return (
                          <tr key={record.id}>
                            <td
                              className={`${rowClass} border-l border-r border-slate-200/80 bg-white px-4 py-4`}
                            >
                              <p className="text-sm font-semibold text-slate-900">
                                {record.name}
                              </p>
                            </td>
                            <td
                              className={`${rowClass} border-r border-slate-200/80 bg-white px-4 py-4 text-sm text-slate-600`}
                            >
                              {record.start_time} - {record.end_time}
                            </td>
                            <td
                              className={`${rowClass} border-r border-slate-200/80 bg-white px-4 py-4 text-sm text-slate-600`}
                            >
                              {record.is_overnight ? "Overnight" : "Same day"}
                            </td>
                            <td
                              className={`${rowClass} border-r border-slate-200/80 bg-white px-4 py-4`}
                            >
                              <StatusBadge
                                label={record.is_active ? "Active" : "Inactive"}
                                tone={record.is_active ? "success" : "warning"}
                              />
                            </td>
                            <td
                              className={`${rowClass} rounded-br-2xl border-r border-slate-200/80 bg-white px-4 py-4`}
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedShiftId(record.id);
                                  setShiftForm(buildShiftForm(record));
                                  setActiveModal("shift");
                                }}
                                className={tableActionButtonClassName}
                                aria-label={`View ${record.name}`}
                                title={`View ${record.name}`}
                              >
                                <Pencil className="h-4 w-4" />
                                View
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {Array.from({ length: shiftFillerRowCount }).map(
                        (_, index) => {
                          const isLastFiller =
                            index === shiftFillerRowCount - 1;
                          const rowClass = isLastFiller
                            ? "border-b border-slate-200/80"
                            : "border-b border-slate-200/60";

                          return (
                            <tr
                              key={`shift-filler-${index}`}
                              aria-hidden="true"
                            >
                              <td
                                className={`${rowClass} border-l border-r border-slate-200/80 bg-white px-4 py-4`}
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
                        },
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </section>
          ) : null}
        </div>

        <div className="space-y-6">
          {activeTab === "attendance" ? (
            <section className="panel p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex-1 min-w-[240px]">
                  <TableSearchField
                    value={attendanceSearch}
                    onChange={setAttendanceSearch}
                    placeholder="Search attendance"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <TablePaginationControls
                    pageSize={pageSize}
                    currentPage={attendancePage}
                    totalPages={totalAttendancePages}
                    onPageSizeChange={handlePageSizeChange}
                    onPrevious={() =>
                      setAttendancePage((page) => Math.max(1, page - 1))
                    }
                    onNext={() =>
                      setAttendancePage((page) =>
                        Math.min(totalAttendancePages, page + 1),
                      )
                    }
                  />
                  <button
                    type="button"
                    onClick={() => {
                      resetAttendanceState();
                      setActiveModal("attendance");
                    }}
                    className={iconButtonClassName}
                    aria-label="Add attendance"
                    title="Add attendance"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="mt-5 min-h-0 overflow-x-auto overflow-y-hidden">
                {attendance.length === 0 ? (
                  <div className="flex min-h-[320px] items-start rounded-2xl border border-slate-200/80 bg-slate-50/70 px-4 py-6 text-sm text-slate-600">
                    No attendance records yet.
                  </div>
                ) : (
                  <table className="min-w-full border-separate border-spacing-0">
                    <thead>
                      <tr>
                        <th className="rounded-tl-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                          Employee
                        </th>
                        <th className="border-y border-slate-200/80 bg-slate-50/80 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                          Date
                        </th>
                        <th className="border-y border-slate-200/80 bg-slate-50/80 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                          Shift
                        </th>
                        <th className="border-y border-slate-200/80 bg-slate-50/80 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                          Status
                        </th>
                        <th className="border-y border-slate-200/80 bg-slate-50/80 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                          Time
                        </th>
                        <th className="rounded-tr-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendance.map((record, index) => {
                        const rowClass =
                          index === attendance.length - 1 &&
                          attendanceFillerRowCount === 0
                            ? "border-b border-slate-200/80"
                            : "border-b border-slate-200/60";
                        const statusTone =
                          record.status === "present"
                            ? "success"
                            : record.status === "late"
                              ? "warning"
                              : record.status === "absent"
                                ? "danger"
                                : "neutral";
                        return (
                          <tr key={record.id}>
                            <td
                              className={`${rowClass} border-l border-r border-slate-200/80 bg-white px-4 py-4`}
                            >
                              <p className="text-sm font-semibold text-slate-900">
                                {record.employee_name}
                              </p>
                            </td>
                            <td
                              className={`${rowClass} border-r border-slate-200/80 bg-white px-4 py-4 text-sm text-slate-600`}
                            >
                              {formatDate(record.attendance_date)}
                            </td>
                            <td
                              className={`${rowClass} border-r border-slate-200/80 bg-white px-4 py-4 text-sm text-slate-600`}
                            >
                              {record.shift_name || "No shift"}
                            </td>
                            <td
                              className={`${rowClass} border-r border-slate-200/80 bg-white px-4 py-4`}
                            >
                              <StatusBadge
                                label={titleCase(record.status)}
                                tone={statusTone}
                              />
                            </td>
                            <td
                              className={`${rowClass} border-r border-slate-200/80 bg-white px-4 py-4 text-sm text-slate-600`}
                            >
                              {record.clock_in || "--"} /{" "}
                              {record.clock_out || "--"}
                            </td>
                            <td
                              className={`${rowClass} rounded-br-2xl border-r border-slate-200/80 bg-white px-4 py-4`}
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedAttendanceId(record.id);
                                  setAttendanceForm(
                                    buildAttendanceForm(record),
                                  );
                                  setActiveModal("attendance");
                                }}
                                className={tableActionButtonClassName}
                                aria-label={`View attendance for ${record.employee_name}`}
                                title={`View attendance for ${record.employee_name}`}
                              >
                                <Pencil className="h-4 w-4" />
                                View
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {Array.from({ length: attendanceFillerRowCount }).map(
                        (_, index) => {
                          const isLastFiller =
                            index === attendanceFillerRowCount - 1;
                          const rowClass = isLastFiller
                            ? "border-b border-slate-200/80"
                            : "border-b border-slate-200/60";

                          return (
                            <tr
                              key={`attendance-filler-${index}`}
                              aria-hidden="true"
                            >
                              <td
                                className={`${rowClass} border-l border-r border-slate-200/80 bg-white px-4 py-4`}
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
                        },
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </section>
          ) : null}

          {activeTab === "payroll" ? (
            <section className="panel p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex-1 min-w-[240px]">
                  <TableSearchField
                    value={payrollSearch}
                    onChange={setPayrollSearch}
                    placeholder="Search payroll"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <TablePaginationControls
                    pageSize={pageSize}
                    currentPage={payrollPage}
                    totalPages={totalPayrollPages}
                    onPageSizeChange={handlePageSizeChange}
                    onPrevious={() =>
                      setPayrollPage((page) => Math.max(1, page - 1))
                    }
                    onNext={() =>
                      setPayrollPage((page) =>
                        Math.min(totalPayrollPages, page + 1),
                      )
                    }
                  />
                  <button
                    type="button"
                    onClick={() => {
                      resetPayrollState();
                      setActiveModal("payroll");
                    }}
                    className={iconButtonClassName}
                    aria-label="Add payroll"
                    title="Add payroll"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="mt-5 min-h-0 overflow-x-auto overflow-y-hidden">
                {payroll.length === 0 ? (
                  <div className="flex min-h-[320px] items-start rounded-2xl border border-slate-200/80 bg-slate-50/70 px-4 py-6 text-sm text-slate-600">
                    No payroll records yet.
                  </div>
                ) : (
                  <table className="min-w-full border-separate border-spacing-0">
                    <thead>
                      <tr>
                        <th className="rounded-tl-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                          Employee
                        </th>
                        <th className="border-y border-slate-200/80 bg-slate-50/80 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                          Period
                        </th>
                        <th className="border-y border-slate-200/80 bg-slate-50/80 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                          Net pay
                        </th>
                        <th className="border-y border-slate-200/80 bg-slate-50/80 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                          Status
                        </th>
                        <th className="border-y border-slate-200/80 bg-slate-50/80 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                          Paid on
                        </th>
                        <th className="rounded-tr-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {payroll.map((record, index) => {
                        const rowClass =
                          index === payroll.length - 1 &&
                          payrollFillerRowCount === 0
                            ? "border-b border-slate-200/80"
                            : "border-b border-slate-200/60";
                        const tone =
                          record.payment_status === "paid"
                            ? "success"
                            : record.payment_status === "partial"
                              ? "warning"
                              : "neutral";
                        return (
                          <tr key={record.id}>
                            <td
                              className={`${rowClass} border-l border-r border-slate-200/80 bg-white px-4 py-4`}
                            >
                              <p className="text-sm font-semibold text-slate-900">
                                {record.employee_name}
                              </p>
                            </td>
                            <td
                              className={`${rowClass} border-r border-slate-200/80 bg-white px-4 py-4 text-sm text-slate-600`}
                            >
                              {formatDate(record.pay_period_start)} -{" "}
                              {formatDate(record.pay_period_end)}
                            </td>
                            <td
                              className={`${rowClass} border-r border-slate-200/80 bg-white px-4 py-4 text-sm font-semibold text-slate-700`}
                            >
                              {record.net_pay}
                            </td>
                            <td
                              className={`${rowClass} border-r border-slate-200/80 bg-white px-4 py-4`}
                            >
                              <StatusBadge
                                label={titleCase(record.payment_status)}
                                tone={tone}
                              />
                            </td>
                            <td
                              className={`${rowClass} border-r border-slate-200/80 bg-white px-4 py-4 text-sm text-slate-600`}
                            >
                              {formatDate(record.payment_date)}
                            </td>
                            <td
                              className={`${rowClass} rounded-br-2xl border-r border-slate-200/80 bg-white px-4 py-4`}
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedPayrollId(record.id);
                                  setPayrollForm(buildPayrollForm(record));
                                  setActiveModal("payroll");
                                }}
                                className={tableActionButtonClassName}
                                aria-label={`View payroll for ${record.employee_name}`}
                                title={`View payroll for ${record.employee_name}`}
                              >
                                <Pencil className="h-4 w-4" />
                                View
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {Array.from({ length: payrollFillerRowCount }).map(
                        (_, index) => {
                          const isLastFiller =
                            index === payrollFillerRowCount - 1;
                          const rowClass = isLastFiller
                            ? "border-b border-slate-200/80"
                            : "border-b border-slate-200/60";

                          return (
                            <tr
                              key={`payroll-filler-${index}`}
                              aria-hidden="true"
                            >
                              <td
                                className={`${rowClass} border-l border-r border-slate-200/80 bg-white px-4 py-4`}
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
                        },
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </section>
          ) : null}
        </div>

        <div className="space-y-6">
          {activeTab === "tasks" ? (
            <section className="panel p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex-1 min-w-[240px]">
                  <TableSearchField
                    value={taskSearch}
                    onChange={setTaskSearch}
                    placeholder="Search tasks"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <TablePaginationControls
                    pageSize={pageSize}
                    currentPage={taskPage}
                    totalPages={totalTaskPages}
                    onPageSizeChange={handlePageSizeChange}
                    onPrevious={() =>
                      setTaskPage((page) => Math.max(1, page - 1))
                    }
                    onNext={() =>
                      setTaskPage((page) => Math.min(totalTaskPages, page + 1))
                    }
                  />
                  <button
                    type="button"
                    onClick={() => {
                      resetTaskState();
                      setActiveModal("task");
                    }}
                    className={iconButtonClassName}
                    aria-label="Add task"
                    title="Add task"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="mt-5 min-h-0 overflow-x-auto overflow-y-hidden">
                {taskRows.length === 0 ? (
                  <div className="flex min-h-[320px] items-start rounded-2xl border border-slate-200/80 bg-slate-50/70 px-4 py-6 text-sm text-slate-600">
                    No tasks yet.
                  </div>
                ) : (
                  <table className="min-w-full border-separate border-spacing-0">
                    <thead>
                      <tr>
                        <th className="rounded-tl-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                          Task
                        </th>
                        <th className="border-y border-slate-200/80 bg-slate-50/80 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                          Employee
                        </th>
                        <th className="border-y border-slate-200/80 bg-slate-50/80 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                          Priority
                        </th>
                        <th className="border-y border-slate-200/80 bg-slate-50/80 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                          Status
                        </th>
                        <th className="border-y border-slate-200/80 bg-slate-50/80 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                          Due date
                        </th>
                        <th className="rounded-tr-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {taskRows.map((record, index) => {
                        const rowClass =
                          index === taskRows.length - 1 &&
                          taskFillerRowCount === 0
                            ? "border-b border-slate-200/80"
                            : "border-b border-slate-200/60";
                        const priorityTone =
                          record.priority === "high"
                            ? "danger"
                            : record.priority === "medium"
                              ? "warning"
                              : "info";
                        const statusTone =
                          record.status === "completed"
                            ? "success"
                            : record.status === "in_progress"
                              ? "info"
                              : record.status === "cancelled"
                                ? "danger"
                                : "neutral";

                        return (
                          <tr key={record.id}>
                            <td
                              className={`${rowClass} border-l border-r border-slate-200/80 bg-white px-4 py-4`}
                            >
                              <div className="min-w-[220px]">
                                <p className="text-sm font-semibold text-slate-900">
                                  {record.title}
                                </p>
                                <p className="mt-1 text-sm text-slate-500">
                                  {record.assigned_by_email || "No assigner"}
                                </p>
                              </div>
                            </td>
                            <td
                              className={`${rowClass} border-r border-slate-200/80 bg-white px-4 py-4 text-sm text-slate-600`}
                            >
                              {record.employee_name}
                            </td>
                            <td
                              className={`${rowClass} border-r border-slate-200/80 bg-white px-4 py-4`}
                            >
                              <StatusBadge
                                label={titleCase(record.priority)}
                                tone={priorityTone}
                              />
                            </td>
                            <td
                              className={`${rowClass} border-r border-slate-200/80 bg-white px-4 py-4`}
                            >
                              <StatusBadge
                                label={titleCase(record.status)}
                                tone={statusTone}
                              />
                            </td>
                            <td
                              className={`${rowClass} border-r border-slate-200/80 bg-white px-4 py-4 text-sm text-slate-600`}
                            >
                              {formatDate(record.due_date)}
                            </td>
                            <td
                              className={`${rowClass} rounded-br-2xl border-r border-slate-200/80 bg-white px-4 py-4`}
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedTaskId(record.id);
                                  setTaskForm(buildTaskForm(record));
                                  setActiveModal("task");
                                }}
                                className={tableActionButtonClassName}
                                aria-label={`View ${record.title}`}
                                title={`View ${record.title}`}
                              >
                                <Pencil className="h-4 w-4" />
                                View
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {Array.from({ length: taskFillerRowCount }).map(
                        (_, index) => {
                          const isLastFiller = index === taskFillerRowCount - 1;
                          const rowClass = isLastFiller
                            ? "border-b border-slate-200/80"
                            : "border-b border-slate-200/60";

                          return (
                            <tr key={`task-filler-${index}`} aria-hidden="true">
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
                                className={`${rowClass} rounded-br-2xl border-r border-slate-200/80 bg-white px-4 py-4`}
                              >
                                <div className="h-6" />
                              </td>
                            </tr>
                          );
                        },
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </section>
          ) : null}

          {activeTab === "performance" ? (
            <section className="panel p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex-1 min-w-[240px]">
                  <TableSearchField
                    value={performanceSearch}
                    onChange={setPerformanceSearch}
                    placeholder="Search reviews"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <TablePaginationControls
                    pageSize={pageSize}
                    currentPage={performancePage}
                    totalPages={totalPerformancePages}
                    onPageSizeChange={handlePageSizeChange}
                    onPrevious={() =>
                      setPerformancePage((page) => Math.max(1, page - 1))
                    }
                    onNext={() =>
                      setPerformancePage((page) =>
                        Math.min(totalPerformancePages, page + 1),
                      )
                    }
                  />
                  <button
                    type="button"
                    onClick={() => {
                      resetPerformanceState();
                      setActiveModal("performance");
                    }}
                    className={iconButtonClassName}
                    aria-label="Add performance record"
                    title="Add performance record"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="mt-5 min-h-0 overflow-x-auto overflow-y-hidden">
                {performanceRecords.length === 0 ? (
                  <div className="flex min-h-[320px] items-start rounded-2xl border border-slate-200/80 bg-slate-50/70 px-4 py-6 text-sm text-slate-600">
                    No performance records yet.
                  </div>
                ) : (
                  <table className="min-w-full border-separate border-spacing-0">
                    <thead>
                      <tr>
                        <th className="rounded-tl-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                          Employee
                        </th>
                        <th className="border-y border-slate-200/80 bg-slate-50/80 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                          Review date
                        </th>
                        <th className="border-y border-slate-200/80 bg-slate-50/80 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                          Reviewer
                        </th>
                        <th className="border-y border-slate-200/80 bg-slate-50/80 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                          Score
                        </th>
                        <th className="rounded-tr-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {performanceRecords.map((record, index) => {
                        const rowClass =
                          index === performanceRecords.length - 1 &&
                          performanceFillerRowCount === 0
                            ? "border-b border-slate-200/80"
                            : "border-b border-slate-200/60";
                        const numericScore = Number(record.score);
                        const tone =
                          Number.isFinite(numericScore) && numericScore >= 80
                            ? "success"
                            : Number.isFinite(numericScore) &&
                                numericScore >= 60
                              ? "warning"
                              : Number.isFinite(numericScore)
                                ? "danger"
                                : "neutral";

                        return (
                          <tr key={record.id}>
                            <td
                              className={`${rowClass} border-l border-r border-slate-200/80 bg-white px-4 py-4`}
                            >
                              <p className="text-sm font-semibold text-slate-900">
                                {record.employee_name}
                              </p>
                            </td>
                            <td
                              className={`${rowClass} border-r border-slate-200/80 bg-white px-4 py-4 text-sm text-slate-600`}
                            >
                              {formatDate(record.review_date)}
                            </td>
                            <td
                              className={`${rowClass} border-r border-slate-200/80 bg-white px-4 py-4 text-sm text-slate-600`}
                            >
                              {record.reviewer_name || "No reviewer"}
                            </td>
                            <td
                              className={`${rowClass} border-r border-slate-200/80 bg-white px-4 py-4`}
                            >
                              <StatusBadge
                                label={`Score ${record.score}`}
                                tone={tone}
                              />
                            </td>
                            <td
                              className={`${rowClass} rounded-br-2xl border-r border-slate-200/80 bg-white px-4 py-4`}
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedPerformanceId(record.id);
                                  setPerformanceForm(
                                    buildPerformanceForm(record),
                                  );
                                  setActiveModal("performance");
                                }}
                                className={tableActionButtonClassName}
                                aria-label={`View performance for ${record.employee_name}`}
                                title={`View performance for ${record.employee_name}`}
                              >
                                <Pencil className="h-4 w-4" />
                                View
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {Array.from({ length: performanceFillerRowCount }).map(
                        (_, index) => {
                          const isLastFiller =
                            index === performanceFillerRowCount - 1;
                          const rowClass = isLastFiller
                            ? "border-b border-slate-200/80"
                            : "border-b border-slate-200/60";

                          return (
                            <tr
                              key={`performance-filler-${index}`}
                              aria-hidden="true"
                            >
                              <td
                                className={`${rowClass} border-l border-r border-slate-200/80 bg-white px-4 py-4`}
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
                        },
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </section>
          ) : null}
        </div>
      </div>

      {activeModal === "department" ? (
        <ModalShell
          title={selectedDepartmentId ? "Edit department" : "Add department"}
          onClose={closeModal}
        >
          <FormPanel label="Departments" title="Department details">
            <form className="space-y-4" onSubmit={handleDepartmentSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Name
                  </span>
                  <input
                    className={fieldClassName}
                    value={departmentForm.name}
                    onChange={(event) =>
                      setDepartmentForm((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    required
                  />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Status
                  </span>
                  <div
                    className={`${fieldClassName} flex min-h-[50px] items-center gap-3`}
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-300"
                      checked={departmentForm.is_active}
                      onChange={(event) =>
                        setDepartmentForm((current) => ({
                          ...current,
                          is_active: event.target.checked,
                        }))
                      }
                    />
                    <span className="text-sm font-medium text-slate-700">
                      Active department
                    </span>
                  </div>
                </label>
              </div>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">
                  Notes
                </span>
                <textarea
                  className={textAreaClassName}
                  value={departmentForm.notes}
                  onChange={(event) =>
                    setDepartmentForm((current) => ({
                      ...current,
                      notes: event.target.value,
                    }))
                  }
                />
              </label>
              <FieldMessage message={departmentError} />
              <div className="flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className={secondaryButtonClassName}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() =>
                    void handleDelete(
                      "department",
                      selectedDepartmentId,
                      setDepartmentError,
                      setIsDepartmentPending,
                      deleteDepartment,
                    )
                  }
                  disabled={!selectedDepartmentId || isDepartmentPending}
                  className={dangerButtonClassName}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
                <button
                  type="submit"
                  disabled={isDepartmentPending}
                  className={primaryButtonClassName}
                >
                  {isDepartmentPending ? (
                    <>
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                      Saving
                    </>
                  ) : (
                    "Save department"
                  )}
                </button>
              </div>
            </form>
          </FormPanel>
        </ModalShell>
      ) : null}

      {activeModal === "employee" ? (
        <ModalShell
          title={selectedEmployeeId ? "Edit employee" : "Add employee"}
          onClose={closeModal}
        >
          <FormPanel label="Employees" title="Employee profile">
            <form className="space-y-4" onSubmit={handleEmployeeSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Supervisor
                  </span>
                  <PickerField
                    value={employeeForm.user ? String(employeeForm.user) : ""}
                    options={[
                      { label: "No supervisor", value: "" },
                      ...buildSupervisorOptions(employeeForm.user),
                    ]}
                    searchable
                    searchPlaceholder="Search supervisors"
                    onChange={(value) =>
                      setEmployeeForm((current) => ({
                        ...current,
                        user: value ? Number(value) : null,
                      }))
                    }
                  />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    First name
                  </span>
                  <input
                    className={fieldClassName}
                    value={employeeForm.first_name}
                    onChange={(event) =>
                      setEmployeeForm((current) => ({
                        ...current,
                        first_name: event.target.value,
                      }))
                    }
                    required
                  />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Last name
                  </span>
                  <input
                    className={fieldClassName}
                    value={employeeForm.last_name}
                    onChange={(event) =>
                      setEmployeeForm((current) => ({
                        ...current,
                        last_name: event.target.value,
                      }))
                    }
                    required
                  />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Email
                  </span>
                  <input
                    type="email"
                    className={fieldClassName}
                    value={employeeForm.email}
                    onChange={(event) =>
                      setEmployeeForm((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Phone number
                  </span>
                  <input
                    className={fieldClassName}
                    value={employeeForm.phone_number}
                    onChange={(event) =>
                      setEmployeeForm((current) => ({
                        ...current,
                        phone_number: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Job title
                  </span>
                  <input
                    className={fieldClassName}
                    value={employeeForm.job_title}
                    onChange={(event) =>
                      setEmployeeForm((current) => ({
                        ...current,
                        job_title: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Work role
                  </span>
                  <PickerField
                    value={employeeForm.work_role}
                    options={[
                      { label: "Select work role", value: "" },
                      ...employeeWorkRoles.map((value) => ({
                        label: titleCase(value),
                        value,
                      })),
                    ]}
                    onChange={(value) =>
                      setEmployeeForm((current) => ({
                        ...current,
                        work_role: value as EmployeeWorkRole,
                      }))
                    }
                  />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Department
                  </span>
                  <PickerField
                    value={employeeForm.department ? String(employeeForm.department) : ""}
                    options={[
                      { label: "No department", value: "" },
                      ...buildAssignableDepartmentOptions(employeeForm.department).map(
                        (record) => ({
                          label: record.is_active
                            ? record.name
                            : `${record.name} (Inactive)`,
                          value: String(record.id),
                        }),
                      ),
                    ]}
                    onChange={(value) =>
                      setEmployeeForm((current) => ({
                        ...current,
                        department: value ? Number(value) : null,
                      }))
                    }
                  />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Hire date
                  </span>
                  <input
                    type="date"
                    className={fieldClassName}
                    value={employeeForm.hire_date}
                    onChange={(event) =>
                      setEmployeeForm((current) => ({
                        ...current,
                        hire_date: event.target.value,
                      }))
                    }
                    required
                  />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Status
                  </span>
                  <PickerField
                    value={employeeForm.status}
                    options={employeeStatuses.map((value) => ({
                      label: titleCase(value),
                      value,
                    }))}
                    onChange={(value) =>
                      setEmployeeForm((current) => ({
                        ...current,
                        status: value as EmployeeStatus,
                        termination_date:
                          value === "terminated"
                            ? current.termination_date
                            : null,
                      }))
                    }
                  />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Termination date
                  </span>
                  <input
                    type="date"
                    className={fieldClassName}
                    value={employeeForm.termination_date ?? ""}
                    onChange={(event) =>
                      setEmployeeForm((current) => ({
                        ...current,
                        termination_date: event.target.value || null,
                      }))
                    }
                    disabled={employeeForm.status !== "terminated"}
                  />
                </label>
              </div>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">
                  Notes
                </span>
                <textarea
                  className={textAreaClassName}
                  value={employeeForm.notes}
                  onChange={(event) =>
                    setEmployeeForm((current) => ({
                      ...current,
                      notes: event.target.value,
                    }))
                  }
                />
              </label>
              <FieldMessage message={employeeError} />
              <div className="flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className={secondaryButtonClassName}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() =>
                    void handleDelete(
                      "employee",
                      selectedEmployeeId,
                      setEmployeeError,
                      setIsEmployeePending,
                      deleteEmployee,
                    )
                  }
                  disabled={!selectedEmployeeId || isEmployeePending}
                  className={dangerButtonClassName}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
                <button
                  type="submit"
                  disabled={isEmployeePending}
                  className={primaryButtonClassName}
                >
                  {isEmployeePending ? (
                    <>
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                      Saving
                    </>
                  ) : (
                    "Save employee"
                  )}
                </button>
              </div>
            </form>
          </FormPanel>
        </ModalShell>
      ) : null}

      {activeModal === "shift" ? (
        <ModalShell
          title={selectedShiftId ? "Edit shift" : "Add shift"}
          onClose={closeModal}
        >
          <FormPanel label="Shifts" title="Shift details">
            <form className="space-y-4" onSubmit={handleShiftSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Name
                  </span>
                  <input
                    className={fieldClassName}
                    value={shiftForm.name}
                    onChange={(event) =>
                      setShiftForm((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    required
                  />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Start time
                  </span>
                  <input
                    type="time"
                    className={fieldClassName}
                    value={shiftForm.start_time}
                    onChange={(event) =>
                      setShiftForm((current) => ({
                        ...current,
                        start_time: event.target.value,
                      }))
                    }
                    required
                  />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    End time
                  </span>
                  <input
                    type="time"
                    className={fieldClassName}
                    value={shiftForm.end_time}
                    onChange={(event) =>
                      setShiftForm((current) => ({
                        ...current,
                        end_time: event.target.value,
                      }))
                    }
                    required
                  />
                </label>
                <label className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/70 px-4 py-3 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={shiftForm.is_overnight}
                    onChange={(event) =>
                      setShiftForm((current) => ({
                        ...current,
                        is_overnight: event.target.checked,
                      }))
                    }
                  />
                  Overnight shift
                </label>
                <label className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/70 px-4 py-3 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={shiftForm.is_active}
                    onChange={(event) =>
                      setShiftForm((current) => ({
                        ...current,
                        is_active: event.target.checked,
                      }))
                    }
                  />
                  Active shift
                </label>
              </div>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">
                  Notes
                </span>
                <textarea
                  className={textAreaClassName}
                  value={shiftForm.notes}
                  onChange={(event) =>
                    setShiftForm((current) => ({
                      ...current,
                      notes: event.target.value,
                    }))
                  }
                />
              </label>
              <FieldMessage message={shiftError} />
              <div className="flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className={secondaryButtonClassName}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() =>
                    void handleDelete(
                      "shift",
                      selectedShiftId,
                      setShiftError,
                      setIsShiftPending,
                      deleteShift,
                    )
                  }
                  disabled={!selectedShiftId || isShiftPending}
                  className={dangerButtonClassName}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
                <button
                  type="submit"
                  disabled={isShiftPending}
                  className={primaryButtonClassName}
                >
                  {isShiftPending ? (
                    <>
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                      Saving
                    </>
                  ) : (
                    "Save shift"
                  )}
                </button>
              </div>
            </form>
          </FormPanel>
        </ModalShell>
      ) : null}

      {activeModal === "attendance" ? (
        <ModalShell
          title={selectedAttendanceId ? "Edit attendance" : "Add attendance"}
          onClose={closeModal}
        >
          <FormPanel label="Attendance" title="Attendance record">
            <form className="space-y-4" onSubmit={handleAttendanceSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Employee
                  </span>
                  <PickerField
                    value={
                      attendanceForm.employee
                        ? String(attendanceForm.employee)
                        : ""
                    }
                    options={[
                      { label: "Select employee", value: "" },
                      ...buildEmployeePickerOptions(attendanceForm.employee),
                    ]}
                    searchable
                    searchPlaceholder="Search employees"
                    onChange={(value) =>
                      setAttendanceForm((current) => ({
                        ...current,
                        employee: Number(value),
                      }))
                    }
                  />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Shift
                  </span>
                  <PickerField
                    value={
                      attendanceForm.shift ? String(attendanceForm.shift) : ""
                    }
                    options={[
                      { label: "No shift", value: "" },
                      ...buildAssignableShiftOptions(attendanceForm.shift).map(
                        (record) => ({
                          label: record.is_active
                            ? record.name
                            : `${record.name} (Inactive)`,
                          value: String(record.id),
                        }),
                      ),
                    ]}
                    onChange={(value) =>
                      setAttendanceForm((current) => ({
                        ...current,
                        shift: value ? Number(value) : null,
                      }))
                    }
                  />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Attendance date
                  </span>
                  <input
                    type="date"
                    className={fieldClassName}
                    value={attendanceForm.attendance_date}
                    onChange={(event) =>
                      setAttendanceForm((current) => ({
                        ...current,
                        attendance_date: event.target.value,
                      }))
                    }
                    required
                  />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Status
                  </span>
                  <PickerField
                    value={attendanceForm.status}
                    options={attendanceStatuses.map((value) => ({
                      label: titleCase(value),
                      value,
                    }))}
                    onChange={(value) =>
                      setAttendanceForm((current) => ({
                        ...current,
                        status: value as AttendanceStatus,
                      }))
                    }
                  />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Clock in
                  </span>
                  <input
                    type="time"
                    className={fieldClassName}
                    value={attendanceForm.clock_in ?? ""}
                    onChange={(event) =>
                      setAttendanceForm((current) => ({
                        ...current,
                        clock_in: event.target.value || null,
                      }))
                    }
                  />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Clock out
                  </span>
                  <input
                    type="time"
                    className={fieldClassName}
                    value={attendanceForm.clock_out ?? ""}
                    onChange={(event) =>
                      setAttendanceForm((current) => ({
                        ...current,
                        clock_out: event.target.value || null,
                      }))
                    }
                  />
                </label>
              </div>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">
                  Notes
                </span>
                <textarea
                  className={textAreaClassName}
                  value={attendanceForm.notes}
                  onChange={(event) =>
                    setAttendanceForm((current) => ({
                      ...current,
                      notes: event.target.value,
                    }))
                  }
                />
              </label>
              <FieldMessage message={attendanceError} />
              <div className="flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className={secondaryButtonClassName}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() =>
                    void handleDelete(
                      "attendance",
                      selectedAttendanceId,
                      setAttendanceError,
                      setIsAttendancePending,
                      deleteAttendanceRecord,
                    )
                  }
                  disabled={!selectedAttendanceId || isAttendancePending}
                  className={dangerButtonClassName}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
                <button
                  type="submit"
                  disabled={isAttendancePending}
                  className={primaryButtonClassName}
                >
                  {isAttendancePending ? (
                    <>
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                      Saving
                    </>
                  ) : (
                    "Save attendance"
                  )}
                </button>
              </div>
            </form>
          </FormPanel>
        </ModalShell>
      ) : null}

      {activeModal === "payroll" ? (
        <ModalShell
          title={selectedPayrollId ? "Edit payroll" : "Add payroll"}
          onClose={closeModal}
        >
          <FormPanel label="Payroll" title="Payroll record">
            <form className="space-y-4" onSubmit={handlePayrollSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Employee
                  </span>
                  <PickerField
                    value={
                      payrollForm.employee ? String(payrollForm.employee) : ""
                    }
                    options={[
                      { label: "Select employee", value: "" },
                      ...buildEmployeePickerOptions(payrollForm.employee),
                    ]}
                    searchable
                    searchPlaceholder="Search employees"
                    onChange={(value) =>
                      setPayrollForm((current) => ({
                        ...current,
                        employee: Number(value),
                      }))
                    }
                  />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Pay period start
                  </span>
                  <input
                    type="date"
                    className={fieldClassName}
                    value={payrollForm.pay_period_start}
                    onChange={(event) =>
                      setPayrollForm((current) => ({
                        ...current,
                        pay_period_start: event.target.value,
                      }))
                    }
                    required
                  />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Pay period end
                  </span>
                  <input
                    type="date"
                    className={fieldClassName}
                    value={payrollForm.pay_period_end}
                    onChange={(event) =>
                      setPayrollForm((current) => ({
                        ...current,
                        pay_period_end: event.target.value,
                      }))
                    }
                    required
                  />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Basic pay
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className={fieldClassName}
                    value={payrollForm.basic_pay}
                    onChange={(event) =>
                      setPayrollForm((current) => ({
                        ...current,
                        basic_pay: event.target.value,
                      }))
                    }
                    required
                  />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Bonuses
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className={fieldClassName}
                    value={payrollForm.bonuses}
                    onChange={(event) =>
                      setPayrollForm((current) => ({
                        ...current,
                        bonuses: event.target.value,
                      }))
                    }
                    required
                  />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Deductions
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className={fieldClassName}
                    value={payrollForm.deductions}
                    onChange={(event) =>
                      setPayrollForm((current) => ({
                        ...current,
                        deductions: event.target.value,
                      }))
                    }
                    required
                  />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Payment status
                  </span>
                  <PickerField
                    value={payrollForm.payment_status}
                    options={payrollStatuses.map((value) => ({
                      label: titleCase(value),
                      value,
                    }))}
                    onChange={(value) =>
                      setPayrollForm((current) => ({
                        ...current,
                        payment_status: value as PayrollStatus,
                      }))
                    }
                  />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Payment date
                  </span>
                  <input
                    type="date"
                    className={fieldClassName}
                    value={payrollForm.payment_date ?? ""}
                    onChange={(event) =>
                      setPayrollForm((current) => ({
                        ...current,
                        payment_date: event.target.value || null,
                      }))
                    }
                  />
                </label>
              </div>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">
                  Notes
                </span>
                <textarea
                  className={textAreaClassName}
                  value={payrollForm.notes}
                  onChange={(event) =>
                    setPayrollForm((current) => ({
                      ...current,
                      notes: event.target.value,
                    }))
                  }
                />
              </label>
              <FieldMessage message={payrollError} />
              <div className="flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className={secondaryButtonClassName}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() =>
                    void handleDelete(
                      "payroll",
                      selectedPayrollId,
                      setPayrollError,
                      setIsPayrollPending,
                      deletePayrollRecord,
                    )
                  }
                  disabled={!selectedPayrollId || isPayrollPending}
                  className={dangerButtonClassName}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
                <button
                  type="submit"
                  disabled={isPayrollPending}
                  className={primaryButtonClassName}
                >
                  {isPayrollPending ? (
                    <>
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                      Saving
                    </>
                  ) : (
                    "Save payroll"
                  )}
                </button>
              </div>
            </form>
          </FormPanel>
        </ModalShell>
      ) : null}

      {activeModal === "task" ? (
        <ModalShell
          title={selectedTaskId ? "Edit task" : "Add task"}
          onClose={closeModal}
        >
          <FormPanel label="Tasks" title="Task assignment">
            <form className="space-y-4" onSubmit={handleTaskSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Employee
                  </span>
                  <PickerField
                    value={taskForm.employee ? String(taskForm.employee) : ""}
                    options={[
                      { label: "Select employee", value: "" },
                      ...buildEmployeePickerOptions(taskForm.employee),
                    ]}
                    searchable
                    searchPlaceholder="Search employees"
                    onChange={(value) =>
                      setTaskForm((current) => ({
                        ...current,
                        employee: Number(value),
                      }))
                    }
                  />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Title
                  </span>
                  <input
                    className={fieldClassName}
                    value={taskForm.title}
                    onChange={(event) =>
                      setTaskForm((current) => ({
                        ...current,
                        title: event.target.value,
                      }))
                    }
                    required
                  />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Assigned date
                  </span>
                  <input
                    type="date"
                    className={fieldClassName}
                    value={taskForm.assigned_date}
                    onChange={(event) =>
                      setTaskForm((current) => ({
                        ...current,
                        assigned_date: event.target.value,
                      }))
                    }
                    required
                  />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Due date
                  </span>
                  <input
                    type="date"
                    className={fieldClassName}
                    value={taskForm.due_date ?? ""}
                    onChange={(event) =>
                      setTaskForm((current) => ({
                        ...current,
                        due_date: event.target.value || null,
                      }))
                    }
                  />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Priority
                  </span>
                  <PickerField
                    value={taskForm.priority}
                    options={taskPriorities.map((value) => ({
                      label: titleCase(value),
                      value,
                    }))}
                    onChange={(value) =>
                      setTaskForm((current) => ({
                        ...current,
                        priority: value as TaskPriority,
                      }))
                    }
                  />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Status
                  </span>
                  <PickerField
                    value={taskForm.status}
                    options={taskStatuses.map((value) => ({
                      label: titleCase(value),
                      value,
                    }))}
                    onChange={(value) =>
                      setTaskForm((current) => ({
                        ...current,
                        status: value as TaskStatus,
                      }))
                    }
                  />
                </label>
              </div>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">
                  Description
                </span>
                <textarea
                  className={textAreaClassName}
                  value={taskForm.description}
                  onChange={(event) =>
                    setTaskForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">
                  Notes
                </span>
                <textarea
                  className={textAreaClassName}
                  value={taskForm.notes}
                  onChange={(event) =>
                    setTaskForm((current) => ({
                      ...current,
                      notes: event.target.value,
                    }))
                  }
                />
              </label>
              <FieldMessage message={taskError} />
              <div className="flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className={secondaryButtonClassName}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() =>
                    void handleDelete(
                      "task",
                      selectedTaskId,
                      setTaskError,
                      setIsTaskPending,
                      deleteTask,
                    )
                  }
                  disabled={!selectedTaskId || isTaskPending}
                  className={dangerButtonClassName}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
                <button
                  type="submit"
                  disabled={isTaskPending}
                  className={primaryButtonClassName}
                >
                  {isTaskPending ? (
                    <>
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                      Saving
                    </>
                  ) : (
                    "Save task"
                  )}
                </button>
              </div>
            </form>
          </FormPanel>
        </ModalShell>
      ) : null}

      {activeModal === "performance" ? (
        <ModalShell
          title={
            selectedPerformanceId
              ? "Edit performance record"
              : "Add performance record"
          }
          onClose={closeModal}
        >
          <FormPanel label="Performance" title="Performance review">
            <form className="space-y-4" onSubmit={handlePerformanceSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Employee
                  </span>
                  <PickerField
                    value={
                      performanceForm.employee
                        ? String(performanceForm.employee)
                        : ""
                    }
                    options={[
                      { label: "Select employee", value: "" },
                      ...buildEmployeePickerOptions(performanceForm.employee),
                    ]}
                    searchable
                    searchPlaceholder="Search employees"
                    onChange={(value) =>
                      setPerformanceForm((current) => ({
                        ...current,
                        employee: Number(value),
                      }))
                    }
                  />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Review date
                  </span>
                  <input
                    type="date"
                    className={fieldClassName}
                    value={performanceForm.review_date}
                    onChange={(event) =>
                      setPerformanceForm((current) => ({
                        ...current,
                        review_date: event.target.value,
                      }))
                    }
                    required
                  />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Reviewer
                  </span>
                  <PickerField
                    value={performanceForm.reviewer_name}
                    options={[
                      { label: "Select reviewer", value: "" },
                      ...buildActiveReviewerOptions(performanceForm.reviewer_name),
                    ]}
                    searchable
                    searchPlaceholder="Search reviewers"
                    onChange={(value) =>
                      setPerformanceForm((current) => ({
                        ...current,
                        reviewer_name: value,
                      }))
                    }
                  />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Score
                  </span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    className={fieldClassName}
                    value={performanceForm.score}
                    onChange={(event) =>
                      setPerformanceForm((current) => ({
                        ...current,
                        score: event.target.value,
                      }))
                    }
                    required
                  />
                </label>
              </div>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">
                  Strengths
                </span>
                <textarea
                  className={textAreaClassName}
                  value={performanceForm.strengths}
                  onChange={(event) =>
                    setPerformanceForm((current) => ({
                      ...current,
                      strengths: event.target.value,
                    }))
                  }
                />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">
                  Improvement areas
                </span>
                <textarea
                  className={textAreaClassName}
                  value={performanceForm.improvement_areas}
                  onChange={(event) =>
                    setPerformanceForm((current) => ({
                      ...current,
                      improvement_areas: event.target.value,
                    }))
                  }
                />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">
                  Notes
                </span>
                <textarea
                  className={textAreaClassName}
                  value={performanceForm.notes}
                  onChange={(event) =>
                    setPerformanceForm((current) => ({
                      ...current,
                      notes: event.target.value,
                    }))
                  }
                />
              </label>
              <FieldMessage message={performanceError} />
              <div className="flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className={secondaryButtonClassName}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() =>
                    void handleDelete(
                      "performance",
                      selectedPerformanceId,
                      setPerformanceError,
                      setIsPerformancePending,
                      deletePerformanceRecord,
                    )
                  }
                  disabled={!selectedPerformanceId || isPerformancePending}
                  className={dangerButtonClassName}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
                <button
                  type="submit"
                  disabled={isPerformancePending}
                  className={primaryButtonClassName}
                >
                  {isPerformancePending ? (
                    <>
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                      Saving
                    </>
                  ) : (
                    "Save performance"
                  )}
                </button>
              </div>
            </form>
          </FormPanel>
        </ModalShell>
      ) : null}
    </div>
  );
}
