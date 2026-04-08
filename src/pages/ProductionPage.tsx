import {
  LoaderCircle,
  Check,
  ChevronDown,
  Pencil,
  Plus,
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
import { fetchEmployees } from "../lib/api/workforce";
import {
  createDowntimeAlert,
  createMachine,
  createMachineUsageLog,
  createMaintenanceLog,
  createMaintenanceSchedule,
  createUtilityConsumptionLog,
  deleteDowntimeAlert,
  deleteMachine,
  deleteMachineUsageLog,
  deleteMaintenanceLog,
  deleteMaintenanceSchedule,
  deleteUtilityConsumptionLog,
  fetchDowntimeAlert,
  fetchDowntimeAlerts,
  fetchMachine,
  fetchMachineUsageLog,
  fetchMachineUsageLogs,
  fetchMachines,
  fetchMaintenanceLog,
  fetchMaintenanceLogs,
  fetchMaintenanceSchedule,
  fetchMaintenanceSchedules,
  fetchUtilityConsumptionLog,
  fetchUtilityConsumptionLogs,
  updateDowntimeAlert,
  updateMachine,
  updateMachineUsageLog,
  updateMaintenanceLog,
  updateMaintenanceSchedule,
  updateUtilityConsumptionLog,
} from "../lib/api/production";
import type {
  DowntimeAlertPayload,
  DowntimeAlertRecord,
  DowntimeSeverity,
  DowntimeStatus,
  MachinePayload,
  MachineRecord,
  MachineStatus,
  MachineUsageLogPayload,
  MachineUsageLogRecord,
  MaintenanceFrequency,
  MaintenanceType,
  MaintenanceLogPayload,
  MaintenanceLogRecord,
  MaintenanceLogStatus,
  MaintenanceSchedulePayload,
  MaintenanceScheduleRecord,
  UtilityConsumptionLogPayload,
  UtilityConsumptionLogRecord,
  UtilityType,
} from "../types/production";
import type { AdminUser } from "../types/auth";
import type { EmployeeRecord } from "../types/workforce";

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
const recordCardClassName =
  "group relative flex h-[220px] min-w-[280px] max-w-[280px] flex-shrink-0 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4";
const recordEditButtonClassName = `${iconButtonClassName} absolute right-4 top-4 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:pointer-events-auto`;

const productionMilestoneFlow = [
  {
    id: "machines",
    label: "Machines",
    detail:
      "Add and update machines here. Before this, there is nothing to prepare. Next, capture usage logs.",
  },
  {
    id: "usage",
    label: "Usage Logs",
    detail:
      "Record machine usage here. Before this, the machines should already exist. Next, create maintenance schedules.",
  },
  {
    id: "schedules",
    label: "Schedules",
    detail:
      "Create maintenance schedules here. Before this, make sure usage logs can point to active machines. Next, add maintenance logs.",
  },
  {
    id: "maintenance",
    label: "Maintenance Logs",
    detail:
      "Capture completed maintenance work here. Before this, schedules should be ready. Next, track downtime alerts.",
  },
  {
    id: "downtime",
    label: "Downtime Alerts",
    detail:
      "Open and manage downtime alerts here. Before this, maintenance logging should already be in motion. Next, review resolved history.",
  },
  {
    id: "resolvedDowntime",
    label: "Resolved History",
    detail:
      "Review resolved downtime here. Before this, downtime alerts should have been opened and closed. Next, log utilities.",
  },
  {
    id: "utility",
    label: "Utility Logs",
    detail:
      "Record utility consumption here. Before this, you should have worked through the machine and downtime flow. This is the last production step.",
  },
] as const;

type ActiveModal =
  | "machine"
  | "usage"
  | "schedule"
  | "maintenanceLog"
  | "downtime"
  | "utility"
  | null;

const machineStatuses: MachineStatus[] = [
  "operational",
  "maintenance",
  "downtime",
  "inactive",
];
const maintenanceFrequencies: MaintenanceFrequency[] = [
  "daily",
  "weekly",
  "monthly",
  "quarterly",
  "yearly",
  "custom",
];
const maintenanceTypes: MaintenanceType[] = [
  "preventive",
  "corrective",
  "inspection",
  "calibration",
  "emergency",
];
const maintenanceLogStatuses: MaintenanceLogStatus[] = [
  "completed",
  "partial",
  "cancelled",
];
const downtimeSeverities: DowntimeSeverity[] = [
  "low",
  "medium",
  "high",
  "critical",
];
const downtimeStatuses: DowntimeStatus[] = ["open", "resolved"];
const utilityTypes: UtilityType[] = [
  "electricity",
  "water",
  "diesel",
  "fuel",
  "other",
];

function createEmptyMachineForm(): MachinePayload {
  return {
    name: "",
    machine_type: "",
    manufacturer: "",
    model_number: "",
    serial_number: "",
    installation_date: null,
    location_name: "",
    status: "operational",
    notes: "",
  };
}

function buildMachineForm(record: MachineRecord | null): MachinePayload {
  if (!record) {
    return createEmptyMachineForm();
  }

  return {
    name: record.name,
    machine_type: record.machine_type,
    manufacturer: record.manufacturer,
    model_number: record.model_number,
    serial_number: record.serial_number,
    installation_date: record.installation_date,
    location_name: record.location_name,
    status: record.status,
    notes: record.notes,
  };
}

function createEmptyUsageForm(): MachineUsageLogPayload {
  return {
    machine: 0,
    usage_date: "",
    hours_used: "",
    operator_name: "",
    purpose: "",
    notes: "",
  };
}

function buildUsageForm(
  record: MachineUsageLogRecord | null,
): MachineUsageLogPayload {
  if (!record) {
    return createEmptyUsageForm();
  }

  return {
    machine: record.machine,
    usage_date: record.usage_date,
    hours_used: record.hours_used,
    operator_name: record.operator_name,
    purpose: record.purpose,
    notes: record.notes,
  };
}

function createEmptyScheduleForm(): MaintenanceSchedulePayload {
  return {
    machine: 0,
    title: "",
    maintenance_type: "preventive",
    frequency: "monthly",
    interval_days: null,
    next_due_date: "",
    last_completed_date: null,
    is_active: true,
    notes: "",
  };
}

function buildScheduleForm(
  record: MaintenanceScheduleRecord | null,
): MaintenanceSchedulePayload {
  if (!record) {
    return createEmptyScheduleForm();
  }

  return {
    machine: record.machine,
    title: record.title,
    maintenance_type: record.maintenance_type,
    frequency: record.frequency,
    interval_days: record.interval_days,
    next_due_date: record.next_due_date,
    last_completed_date: record.last_completed_date,
    is_active: record.is_active,
    notes: record.notes,
  };
}

function createEmptyMaintenanceLogForm(): MaintenanceLogPayload {
  return {
    machine: 0,
    schedule: null,
    maintenance_date: "",
    maintenance_type: "preventive",
    status: "completed",
    performed_by_name: "",
    cost: "0.00",
    downtime_hours: "0.00",
    notes: "",
  };
}

function buildMaintenanceLogForm(
  record: MaintenanceLogRecord | null,
): MaintenanceLogPayload {
  if (!record) {
    return createEmptyMaintenanceLogForm();
  }

  return {
    machine: record.machine,
    schedule: record.schedule,
    maintenance_date: record.maintenance_date,
    maintenance_type: record.maintenance_type,
    status: record.status,
    performed_by_name: record.performed_by_name,
    cost: record.cost,
    downtime_hours: record.downtime_hours,
    notes: record.notes,
  };
}

function createEmptyDowntimeForm(): DowntimeAlertPayload {
  return {
    machine: 0,
    title: "",
    severity: "medium",
    status: "open",
    start_time: "",
    end_time: null,
    cause: "",
    resolution_notes: "",
  };
}

function buildDowntimeForm(
  record: DowntimeAlertRecord | null,
): DowntimeAlertPayload {
  if (!record) {
    return createEmptyDowntimeForm();
  }

  return {
    machine: record.machine,
    title: record.title,
    severity: record.severity,
    status: record.status,
    start_time: formatDateTimeInput(record.start_time),
    end_time: formatDateTimeInput(record.end_time),
    cause: record.cause,
    resolution_notes: record.resolution_notes,
  };
}

function createEmptyUtilityForm(): UtilityConsumptionLogPayload {
  return {
    machine: null,
    utility_type: "electricity",
    log_date: "",
    quantity: "",
    unit_name: "",
    cost: "0.00",
    notes: "",
  };
}

function PickerField({
  value,
  options,
  onChange,
  searchable = false,
  searchPlaceholder = "Search options",
  menuClassName = "max-h-[280px]",
}: {
  value: string;
  options: Array<{ label: string; value: string; searchText?: string }>;
  onChange: (value: string) => void;
  searchable?: boolean;
  searchPlaceholder?: string;
  menuClassName?: string;
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
          <div
            className={`scrollbar-hidden mt-2 space-y-1 overflow-y-auto pr-1 ${menuClassName}`.trim()}
          >
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

function buildUtilityForm(
  record: UtilityConsumptionLogRecord | null,
): UtilityConsumptionLogPayload {
  if (!record) {
    return createEmptyUtilityForm();
  }

  return {
    machine: record.machine,
    utility_type: record.utility_type,
    log_date: record.log_date,
    quantity: record.quantity,
    unit_name: record.unit_name,
    cost: record.cost,
    notes: record.notes,
  };
}

function FieldMessage({ message }: { message: string }) {
  if (!message) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {message}
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

function EmptyState({
  title,
  description,
  className = "",
}: {
  title: string;
  description: string;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[1.75rem] border border-dashed border-slate-200 bg-slate-50/70 px-5 py-6 ${className}`.trim()}
    >
      <p className="text-lg font-semibold text-slate-900">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
    </div>
  );
}

function ModalShell({
  title,
  onClose,
  children,
  panelClassName = "",
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  panelClassName?: string;
}) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/32 px-4 py-6 backdrop-blur-sm">
      <div
        className={`panel scrollbar-hidden flex max-h-[90vh] w-full max-w-3xl flex-col overflow-y-auto p-6 ${panelClassName}`.trim()}
      >
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
          <div className="mt-8 flex-1">{children}</div>
        </div>
      </div>
    );
  }

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "Not set";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("en-UG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(parsed);
}

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "Not set";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("en-UG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(parsed);
}

function formatDateTimeInput(value: string | null | undefined) {
  if (!value) {
    return "";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }
  const offset = parsed.getTimezoneOffset();
  const localDate = new Date(parsed.getTime() - offset * 60_000);
  return localDate.toISOString().slice(0, 16);
}

function getCurrentDateString() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

function getCurrentDateTimeInputValue() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60_000).toISOString().slice(0, 16);
}

function titleCase(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function ProductionPage() {
  const { user } = useAuth();
  const isAdmin =
    user?.role.code === "admin" || user?.role.code === "superuser";

  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [activeTab, setActiveTab] = useState("machines");

  const tabs = productionMilestoneFlow.map(({ id, label }) => ({ id, label }));
  const activeFlowItem =
    productionMilestoneFlow.find((item) => item.id === activeTab) ??
    productionMilestoneFlow[0];
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const [machines, setMachines] = useState<MachineRecord[]>([]);
  const [internalMembers, setInternalMembers] = useState<AdminUser[]>([]);
  const [operatorEmployees, setOperatorEmployees] = useState<EmployeeRecord[]>(
    [],
  );
  const [usageLogs, setUsageLogs] = useState<MachineUsageLogRecord[]>([]);
  const [maintenanceSchedules, setMaintenanceSchedules] = useState<
    MaintenanceScheduleRecord[]
  >([]);
  const [maintenanceLogs, setMaintenanceLogs] = useState<
    MaintenanceLogRecord[]
  >([]);
  const [downtimeAlerts, setDowntimeAlerts] = useState<DowntimeAlertRecord[]>(
    [],
  );
  const [utilityLogs, setUtilityLogs] = useState<UtilityConsumptionLogRecord[]>(
    [],
  );

  const [machineForm, setMachineForm] = useState<MachinePayload>(
    createEmptyMachineForm(),
  );
  const [usageForm, setUsageForm] = useState<MachineUsageLogPayload>(
    createEmptyUsageForm(),
  );
  const [scheduleForm, setScheduleForm] = useState<MaintenanceSchedulePayload>(
    createEmptyScheduleForm(),
  );
  const [maintenanceLogForm, setMaintenanceLogForm] =
    useState<MaintenanceLogPayload>(createEmptyMaintenanceLogForm());
  const [downtimeForm, setDowntimeForm] = useState<DowntimeAlertPayload>(
    createEmptyDowntimeForm(),
  );
  const [utilityForm, setUtilityForm] = useState<UtilityConsumptionLogPayload>(
    createEmptyUtilityForm(),
  );

  const [selectedMachineId, setSelectedMachineId] = useState<number | null>(
    null,
  );
  const [selectedUsageId, setSelectedUsageId] = useState<number | null>(null);
  const [selectedScheduleId, setSelectedScheduleId] = useState<number | null>(
    null,
  );
  const [selectedMaintenanceLogId, setSelectedMaintenanceLogId] = useState<
    number | null
  >(null);
  const [selectedDowntimeId, setSelectedDowntimeId] = useState<number | null>(
    null,
  );
  const [selectedUtilityId, setSelectedUtilityId] = useState<number | null>(
    null,
  );

  const [machineError, setMachineError] = useState("");
  const [usageError, setUsageError] = useState("");
  const [scheduleError, setScheduleError] = useState("");
  const [maintenanceLogError, setMaintenanceLogError] = useState("");
  const [downtimeError, setDowntimeError] = useState("");
  const [utilityError, setUtilityError] = useState("");

  const [isMachinePending, setIsMachinePending] = useState(false);
  const [isUsagePending, setIsUsagePending] = useState(false);
  const [isSchedulePending, setIsSchedulePending] = useState(false);
  const [isMaintenanceLogPending, setIsMaintenanceLogPending] = useState(false);
  const [isDowntimePending, setIsDowntimePending] = useState(false);
  const [isUtilityPending, setIsUtilityPending] = useState(false);

  const todayDateString = getCurrentDateString();
  const activeScheduleIds = new Set(
    maintenanceSchedules
      .filter((item) => item.is_active)
      .map((item) => item.id),
  );
  const visibleMaintenanceLogs = maintenanceLogs.filter(
    (item) => !item.schedule || activeScheduleIds.has(item.schedule),
  );
  const hiddenMaintenanceLogCount =
    maintenanceLogs.length - visibleMaintenanceLogs.length;
  const dueMaintenanceSchedules = maintenanceSchedules.filter(
    (item) => item.is_active && item.next_due_date <= todayDateString,
  );
  const openDowntimeAlerts = downtimeAlerts.filter(
    (item) => item.status === "open",
  );
  const resolvedDowntimeAlerts = downtimeAlerts.filter(
    (item) => item.status === "resolved",
  );
  const buildMachineOptions = () =>
    machines.map((machine) => ({
      label: machine.name,
      value: String(machine.id),
      searchText: [
        machine.name,
        machine.machine_type,
        machine.manufacturer,
        machine.model_number,
        machine.serial_number,
        machine.location_name,
        machine.status,
      ]
        .filter(Boolean)
        .join(" "),
    }));
  const buildOperatorOptions = (selectedOperatorName?: string) => {
    const options = operatorEmployees
      .filter(
        (employee) =>
          employee.status === "active" && employee.work_role === "operator",
      )
      .map((employee) => ({
        label: employee.full_name,
        value: employee.full_name,
        searchText: [
          employee.full_name,
          employee.employee_code,
          employee.email,
          employee.job_title,
        ]
          .filter(Boolean)
          .join(" "),
      }));

    if (
      selectedOperatorName &&
      !options.some((option) => option.value === selectedOperatorName)
    ) {
      options.push({
        label: `${selectedOperatorName} (Unavailable)`,
        value: selectedOperatorName,
        searchText: selectedOperatorName,
      });
    }

    return options;
  };

  const buildInternalMemberOptions = (selectedMemberName?: string) => {
    const options = internalMembers
      .filter((member) => member.is_active)
      .map((member) => {
        const label =
          `${member.first_name} ${member.last_name}`.trim() || member.email;
        return {
          label,
          value: label,
          searchText: `${label} ${member.email}`.trim(),
        };
      });

    if (
      selectedMemberName &&
      !options.some((option) => option.value === selectedMemberName)
    ) {
      options.push({
        label: `${selectedMemberName} (Unavailable)`,
        value: selectedMemberName,
        searchText: selectedMemberName,
      });
    }

    return options;
  };
  const buildMaintenanceScheduleOptions = (
    machineId: number,
    selectedScheduleId?: number | null,
  ) =>
    maintenanceSchedules
      .filter(
        (item) =>
          item.machine === machineId &&
          (item.is_active || item.id === selectedScheduleId),
      )
      .map((record) => ({
        label: record.title,
        value: String(record.id),
        searchText: [
          record.title,
          record.machine_name,
          record.maintenance_type,
          record.frequency,
          record.next_due_date,
        ]
          .filter(Boolean)
          .join(" "),
      }));

  async function reloadProductionData() {
    const [
      nextMachines,
      nextUsageLogs,
      nextSchedules,
      nextLogs,
      nextDowntime,
      nextUtilities,
      nextMembers,
      nextOperators,
    ] = await Promise.all([
      fetchMachines(),
      fetchMachineUsageLogs(),
      fetchMaintenanceSchedules(),
      fetchMaintenanceLogs(),
      fetchDowntimeAlerts(),
      fetchUtilityConsumptionLogs(),
      isAdmin ? fetchAllUsers().catch(() => []) : Promise.resolve([]),
      isAdmin ? fetchEmployees().catch(() => []) : Promise.resolve([]),
    ]);

    setMachines(nextMachines);
    setUsageLogs(nextUsageLogs);
    setMaintenanceSchedules(nextSchedules);
    setMaintenanceLogs(nextLogs);
    setDowntimeAlerts(nextDowntime);
    setUtilityLogs(nextUtilities);
    setInternalMembers(nextMembers);
    setOperatorEmployees(nextOperators);
  }

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      setIsLoading(true);
      setPageError("");

      try {
        await reloadProductionData();
      } catch (error) {
        if (isMounted) {
          setPageError(
            error instanceof ApiError
              ? error.message
              : "Unable to load production data right now.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedMachineId) return;
    let isMounted = true;
    const load = async () => {
      try {
        const record = await fetchMachine(selectedMachineId);
        if (isMounted) setMachineForm(buildMachineForm(record));
      } catch {
        if (isMounted) {
          setMachineForm(
            buildMachineForm(
              machines.find((item) => item.id === selectedMachineId) ?? null,
            ),
          );
        }
      }
    };
    void load();
    return () => {
      isMounted = false;
    };
  }, [selectedMachineId, machines]);

  useEffect(() => {
    if (!selectedUsageId) return;
    let isMounted = true;
    const load = async () => {
      try {
        const record = await fetchMachineUsageLog(selectedUsageId);
        if (isMounted) setUsageForm(buildUsageForm(record));
      } catch {
        if (isMounted) {
          setUsageForm(
            buildUsageForm(
              usageLogs.find((item) => item.id === selectedUsageId) ?? null,
            ),
          );
        }
      }
    };
    void load();
    return () => {
      isMounted = false;
    };
  }, [selectedUsageId, usageLogs]);

  useEffect(() => {
    if (!selectedScheduleId) return;
    let isMounted = true;
    const load = async () => {
      try {
        const record = await fetchMaintenanceSchedule(selectedScheduleId);
        if (isMounted) setScheduleForm(buildScheduleForm(record));
      } catch {
        if (isMounted) {
          setScheduleForm(
            buildScheduleForm(
              maintenanceSchedules.find(
                (item) => item.id === selectedScheduleId,
              ) ?? null,
            ),
          );
        }
      }
    };
    void load();
    return () => {
      isMounted = false;
    };
  }, [selectedScheduleId, maintenanceSchedules]);

  useEffect(() => {
    if (!selectedMaintenanceLogId) return;
    let isMounted = true;
    const load = async () => {
      try {
        const record = await fetchMaintenanceLog(selectedMaintenanceLogId);
        if (isMounted) setMaintenanceLogForm(buildMaintenanceLogForm(record));
      } catch {
        if (isMounted) {
          setMaintenanceLogForm(
            buildMaintenanceLogForm(
              maintenanceLogs.find(
                (item) => item.id === selectedMaintenanceLogId,
              ) ?? null,
            ),
          );
        }
      }
    };
    void load();
    return () => {
      isMounted = false;
    };
  }, [selectedMaintenanceLogId, maintenanceLogs]);

  useEffect(() => {
    if (!selectedDowntimeId) return;
    let isMounted = true;
    const load = async () => {
      try {
        const record = await fetchDowntimeAlert(selectedDowntimeId);
        if (isMounted) setDowntimeForm(buildDowntimeForm(record));
      } catch {
        if (isMounted) {
          setDowntimeForm(
            buildDowntimeForm(
              downtimeAlerts.find((item) => item.id === selectedDowntimeId) ??
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
  }, [selectedDowntimeId, downtimeAlerts]);

  useEffect(() => {
    if (!selectedUtilityId) return;
    let isMounted = true;
    const load = async () => {
      try {
        const record = await fetchUtilityConsumptionLog(selectedUtilityId);
        if (isMounted) setUtilityForm(buildUtilityForm(record));
      } catch {
        if (isMounted) {
          setUtilityForm(
            buildUtilityForm(
              utilityLogs.find((item) => item.id === selectedUtilityId) ?? null,
            ),
          );
        }
      }
    };
    void load();
    return () => {
      isMounted = false;
    };
  }, [selectedUtilityId, utilityLogs]);

  const resetMachineState = () => {
    setSelectedMachineId(null);
    setMachineForm(createEmptyMachineForm());
    setMachineError("");
  };
  const resetUsageState = () => {
    setSelectedUsageId(null);
    setUsageForm(createEmptyUsageForm());
    setUsageError("");
  };
  const resetScheduleState = () => {
    setSelectedScheduleId(null);
    setScheduleForm(createEmptyScheduleForm());
    setScheduleError("");
  };
  const resetMaintenanceLogState = () => {
    setSelectedMaintenanceLogId(null);
    setMaintenanceLogForm(createEmptyMaintenanceLogForm());
    setMaintenanceLogError("");
  };
  const resetDowntimeState = () => {
    setSelectedDowntimeId(null);
    setDowntimeForm(createEmptyDowntimeForm());
    setDowntimeError("");
  };
  const resetUtilityState = () => {
    setSelectedUtilityId(null);
    setUtilityForm(createEmptyUtilityForm());
    setUtilityError("");
  };

  const closeModal = () => {
    resetMachineState();
    resetUsageState();
    resetScheduleState();
    resetMaintenanceLogState();
    resetDowntimeState();
    resetUtilityState();
    setActiveModal(null);
  };

  const handleMachineSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMachineError("");
    setIsMachinePending(true);
      try {
        const payload = {
          ...machineForm,
          name: machineForm.name.trim(),
          machine_type: machineForm.machine_type.trim(),
          manufacturer: machineForm.manufacturer.trim(),
          model_number: machineForm.model_number.trim(),
        serial_number: machineForm.serial_number?.trim() || null,
        location_name: machineForm.location_name.trim(),
        notes: machineForm.notes.trim(),
      };
      if (selectedMachineId) {
        await updateMachine(selectedMachineId, payload);
      } else {
        await createMachine(payload);
      }
      await reloadProductionData();
      closeModal();
    } catch (error) {
      setMachineError(
        error instanceof ApiError
          ? error.message
          : "Unable to save the machine right now.",
      );
    } finally {
      setIsMachinePending(false);
    }
  };

  const handleMachineDelete = async () => {
    if (!selectedMachineId) return;
    setMachineError("");
    setIsMachinePending(true);
    try {
      await deleteMachine(selectedMachineId);
      await reloadProductionData();
      closeModal();
    } catch (error) {
      setMachineError(
        error instanceof ApiError
          ? error.message
          : "Unable to delete the machine right now.",
      );
    } finally {
      setIsMachinePending(false);
    }
  };

  const handleUsageSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setUsageError("");
    setIsUsagePending(true);
    try {
      const payload = {
        ...usageForm,
        operator_name: usageForm.operator_name.trim(),
        purpose: usageForm.purpose.trim(),
        notes: usageForm.notes.trim(),
      };
      if (selectedUsageId) {
        await updateMachineUsageLog(selectedUsageId, payload);
      } else {
        await createMachineUsageLog(payload);
      }
      await reloadProductionData();
      closeModal();
    } catch (error) {
      setUsageError(
        error instanceof ApiError
          ? error.message
          : "Unable to save the usage log right now.",
      );
    } finally {
      setIsUsagePending(false);
    }
  };

  const handleUsageDelete = async () => {
    if (!selectedUsageId) return;
    setUsageError("");
    setIsUsagePending(true);
    try {
      await deleteMachineUsageLog(selectedUsageId);
      await reloadProductionData();
      closeModal();
    } catch (error) {
      setUsageError(
        error instanceof ApiError
          ? error.message
          : "Unable to delete the usage log right now.",
      );
    } finally {
      setIsUsagePending(false);
    }
  };

  const handleScheduleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setScheduleError("");
    setIsSchedulePending(true);
    try {
        const payload = {
          ...scheduleForm,
          title: scheduleForm.title.trim(),
          interval_days:
            scheduleForm.frequency === "custom"
              ? scheduleForm.interval_days
            : null,
        notes: scheduleForm.notes.trim(),
      };
      if (selectedScheduleId) {
        await updateMaintenanceSchedule(selectedScheduleId, payload);
      } else {
        await createMaintenanceSchedule(payload);
      }
      await reloadProductionData();
      closeModal();
    } catch (error) {
      setScheduleError(
        error instanceof ApiError
          ? error.message
          : "Unable to save the maintenance schedule right now.",
      );
    } finally {
      setIsSchedulePending(false);
    }
  };

  const handleScheduleDelete = async () => {
    if (!selectedScheduleId) return;
    setScheduleError("");
    setIsSchedulePending(true);
    try {
      await deleteMaintenanceSchedule(selectedScheduleId);
      await reloadProductionData();
      closeModal();
    } catch (error) {
      setScheduleError(
        error instanceof ApiError
          ? error.message
          : "Unable to delete the maintenance schedule right now.",
      );
    } finally {
      setIsSchedulePending(false);
    }
  };

  const handleMaintenanceLogSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setMaintenanceLogError("");
    setIsMaintenanceLogPending(true);
    try {
        const payload = {
          ...maintenanceLogForm,
          schedule: maintenanceLogForm.schedule || null,
          performed_by_name: maintenanceLogForm.performed_by_name.trim(),
          notes: maintenanceLogForm.notes.trim(),
        };
      if (selectedMaintenanceLogId) {
        await updateMaintenanceLog(selectedMaintenanceLogId, payload);
      } else {
        await createMaintenanceLog(payload);
      }
      await reloadProductionData();
      closeModal();
    } catch (error) {
      setMaintenanceLogError(
        error instanceof ApiError
          ? error.message
          : "Unable to save the maintenance log right now.",
      );
    } finally {
      setIsMaintenanceLogPending(false);
    }
  };

  const handleMaintenanceLogDelete = async () => {
    if (!selectedMaintenanceLogId) return;
    setMaintenanceLogError("");
    setIsMaintenanceLogPending(true);
    try {
      await deleteMaintenanceLog(selectedMaintenanceLogId);
      await reloadProductionData();
      closeModal();
    } catch (error) {
      setMaintenanceLogError(
        error instanceof ApiError
          ? error.message
          : "Unable to delete the maintenance log right now.",
      );
    } finally {
      setIsMaintenanceLogPending(false);
    }
  };

  const handleDowntimeSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setDowntimeError("");
    if (
      downtimeForm.status === "resolved" &&
      !downtimeForm.resolution_notes.trim()
    ) {
      setDowntimeError(
        "Add resolution notes before resolving the downtime alert.",
      );
      return;
    }
    setIsDowntimePending(true);
    try {
      const payload = {
        ...downtimeForm,
        title: downtimeForm.title.trim(),
        end_time:
          downtimeForm.status === "resolved"
            ? downtimeForm.end_time || getCurrentDateTimeInputValue()
            : null,
        cause: downtimeForm.cause.trim(),
        resolution_notes: downtimeForm.resolution_notes.trim(),
      };
      if (selectedDowntimeId) {
        await updateDowntimeAlert(selectedDowntimeId, payload);
      } else {
        await createDowntimeAlert(payload);
      }
      await reloadProductionData();
      closeModal();
    } catch (error) {
      setDowntimeError(
        error instanceof ApiError
          ? error.message
          : "Unable to save the downtime record right now.",
      );
    } finally {
      setIsDowntimePending(false);
    }
  };

  const handleDowntimeDelete = async () => {
    if (!selectedDowntimeId) return;
    setDowntimeError("");
    setIsDowntimePending(true);
    try {
      await deleteDowntimeAlert(selectedDowntimeId);
      await reloadProductionData();
      closeModal();
    } catch (error) {
      setDowntimeError(
        error instanceof ApiError
          ? error.message
          : "Unable to delete the downtime record right now.",
      );
    } finally {
      setIsDowntimePending(false);
    }
  };

  const handleUtilitySubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setUtilityError("");
    setIsUtilityPending(true);
    try {
      const payload = {
        ...utilityForm,
        machine: utilityForm.machine || null,
        unit_name: utilityForm.unit_name.trim(),
        notes: utilityForm.notes.trim(),
      };
      if (selectedUtilityId) {
        await updateUtilityConsumptionLog(selectedUtilityId, payload);
      } else {
        await createUtilityConsumptionLog(payload);
      }
      await reloadProductionData();
      closeModal();
    } catch (error) {
      setUtilityError(
        error instanceof ApiError
          ? error.message
          : "Unable to save the utility log right now.",
      );
    } finally {
      setIsUtilityPending(false);
    }
  };

  const handleUtilityDelete = async () => {
    if (!selectedUtilityId) return;
    setUtilityError("");
    setIsUtilityPending(true);
    try {
      await deleteUtilityConsumptionLog(selectedUtilityId);
      await reloadProductionData();
      closeModal();
    } catch (error) {
      setUtilityError(
        error instanceof ApiError
          ? error.message
          : "Unable to delete the utility log right now.",
      );
    } finally {
      setIsUtilityPending(false);
    }
  };

  if (isLoading) {
    return (
      <section className="panel flex min-h-[320px] items-center justify-center p-8">
        <div className="flex items-center gap-3 text-slate-600">
          <LoaderCircle className="h-5 w-5 animate-spin text-sky-700" />
          <span>Loading production workspace...</span>
        </div>
      </section>
    );
  }

  if (pageError) {
    return (
      <section className="panel max-w-3xl p-8">
        <p className="section-label">Production</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-900">
          Production workspace
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
              Production
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
                Equipment and operations support
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-slate-600">
                This module focuses on machines, usage, maintenance, downtime,
                and utilities only. It stays operational and manual, without
                drifting into batch planning or analytics.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="hero-metric-card">
              <p className="hero-metric-label">Machines</p>
              <p className="hero-metric-value">{machines.length}</p>
            </div>
            <div className="hero-metric-card">
              <p className="hero-metric-label">Downtime</p>
              <p className="hero-metric-value">
                {downtimeAlerts.filter((item) => item.status === "open").length}
              </p>
            </div>
            <div className="hero-metric-card">
              <p className="hero-metric-label">Schedules</p>
              <p className="hero-metric-value">
                {maintenanceSchedules.filter((item) => item.is_active).length}
              </p>
            </div>
            <div className="hero-metric-card">
              <p className="hero-metric-label">Utilities</p>
              <p className="hero-metric-value">{utilityLogs.length}</p>
            </div>
          </div>
        </div>
      </section>
      <ModuleTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      <div className="module-page-stage !justify-start overflow-hidden">
        <div className="flex min-h-0 flex-1 flex-col gap-6">
          <div className="min-h-0 flex-1 space-y-6">
            {activeTab === "downtime" ? (
              <section className="panel p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="section-label">Downtime Alerts</p>
                    <h2 className="mt-1 text-2xl font-semibold text-slate-900">
                      Live equipment interruptions
                    </h2>
                  </div>
                  {isAdmin ? (
                    <button
                      type="button"
                      onClick={() => {
                        resetDowntimeState();
                        setActiveModal("downtime");
                      }}
                      className={iconButtonClassName}
                      aria-label="Add downtime alert"
                      title="Add downtime alert"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>

                <div className="mt-5 space-y-3">
                  <div className="scrollbar-hidden flex gap-3 overflow-x-auto pb-2">
                    {dueMaintenanceSchedules.length === 0 &&
                    openDowntimeAlerts.length === 0 ? (
                      <EmptyState
                        title="No live downtime or due maintenance"
                        description="Resolved incidents stay in the history tab, and new downtime alerts can be added here."
                        className={`${recordCardClassName} justify-center`}
                      />
                    ) : (
                      <>
                        {dueMaintenanceSchedules.map((record) => (
                          <div
                            key={`maintenance-${record.id}`}
                            className={`${recordCardClassName} bg-sky-50/55`}
                          >
                            <div className="scrollbar-hidden min-h-0 flex-1 overflow-y-auto pr-14">
                              <p className="font-semibold text-slate-900">
                                {record.title}
                                <span className="ml-1 inline-block h-2.5 w-2.5 rounded-full bg-sky-500 align-middle" />
                              </p>
                              <p className="mt-1 text-sm text-slate-500">
                                {record.machine_name}
                              </p>
                              <p className="mt-3 text-sm text-slate-600">
                                {record.maintenance_type}
                              </p>
                              <p className="mt-2 text-sm text-slate-600">
                                {record.next_due_date < todayDateString
                                  ? "Overdue maintenance"
                                  : "Due today"}
                              </p>
                              <p className="mt-2 text-sm text-slate-600">
                                Scheduled for {formatDate(record.next_due_date)}
                              </p>
                            </div>
                            {isAdmin ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedScheduleId(record.id);
                                  setScheduleForm(buildScheduleForm(record));
                                  setActiveModal("schedule");
                                }}
                                className={recordEditButtonClassName}
                                aria-label={`Edit ${record.title}`}
                                title={`Edit ${record.title}`}
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                            ) : null}
                          </div>
                        ))}

                        {openDowntimeAlerts.map((record) => (
                          <div
                            key={`downtime-${record.id}`}
                            className={recordCardClassName}
                          >
                            <div className="scrollbar-hidden min-h-0 flex-1 overflow-y-auto pr-14">
                              <p className="font-semibold text-slate-900">
                                {record.title}
                              </p>
                              <p className="mt-1 text-sm text-slate-500">
                                {record.machine_name}
                              </p>
                              <p className="mt-3 text-sm text-slate-600">
                                {titleCase(record.severity)} / Open
                              </p>
                              <p className="mt-2 text-sm text-slate-600">
                                Started {formatDateTime(record.start_time)}
                              </p>
                              <p className="mt-2 text-sm text-slate-600">
                                Downtime: Open
                              </p>
                            </div>
                            {isAdmin ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedDowntimeId(record.id);
                                  setDowntimeForm(buildDowntimeForm(record));
                                  setActiveModal("downtime");
                                }}
                                className={recordEditButtonClassName}
                                aria-label={`Edit ${record.title}`}
                                title={`Edit ${record.title}`}
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                            ) : null}
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              </section>
            ) : null}

            {activeTab === "resolvedDowntime" ? (
              <section className="panel p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="section-label">Resolved History</p>
                    <h2 className="mt-1 text-2xl font-semibold text-slate-900">
                      Closed downtime records
                    </h2>
                    <p className="mt-2 text-sm text-slate-500">
                      Completed downtime records stay here as reference without
                      competing with the live operations lane.
                    </p>
                  </div>
                </div>

                <div className="scrollbar-hidden mt-5 flex gap-3 overflow-x-auto pb-2">
                  {resolvedDowntimeAlerts.length === 0 ? (
                    <EmptyState
                      title="No resolved downtime history yet"
                      description="Once downtime alerts are resolved, they will move into this tab."
                      className={`${recordCardClassName} justify-center`}
                    />
                  ) : (
                    resolvedDowntimeAlerts.map((record) => (
                      <div key={record.id} className={recordCardClassName}>
                        <div className="scrollbar-hidden min-h-0 flex-1 overflow-y-auto pr-14">
                          <p className="font-semibold text-slate-900">
                            {record.title}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            {record.machine_name}
                          </p>
                          <p className="mt-2 text-sm text-slate-600">
                            {titleCase(record.severity)} / Resolved
                          </p>
                          <p className="mt-2 text-sm text-slate-600">
                            Ended {formatDateTime(record.end_time)}
                          </p>
                          <p className="mt-2 text-sm text-slate-600">
                            Downtime:{" "}
                            {record.downtime_hours == null
                              ? "Not calculated"
                              : `${record.downtime_hours} hrs`}
                          </p>
                        </div>
                        {isAdmin ? (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedDowntimeId(record.id);
                              setDowntimeForm(buildDowntimeForm(record));
                              setActiveModal("downtime");
                            }}
                            className={recordEditButtonClassName}
                            aria-label={`Edit ${record.title}`}
                            title={`Edit ${record.title}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                        ) : null}
                      </div>
                    ))
                  )}
                </div>
              </section>
            ) : null}

            {activeTab === "machines" ? (
              <section className="panel p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="section-label">Machines</p>
                    <h2 className="mt-1 text-2xl font-semibold text-slate-900">
                      Equipment registry
                    </h2>
                  </div>
                  {isAdmin ? (
                    <button
                      type="button"
                      onClick={() => {
                        resetMachineState();
                        setActiveModal("machine");
                      }}
                      className={iconButtonClassName}
                      aria-label="Add machine"
                      title="Add machine"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>

                <div className="scrollbar-hidden mt-5 flex gap-3 overflow-x-auto pb-2">
                  {machines.length === 0 ? (
                    <EmptyState
                      title="No machines yet"
                      description="Register equipment before logging usage or maintenance."
                      className={`${recordCardClassName} justify-center`}
                    />
                  ) : (
                    machines.map((record) => (
                      <div key={record.id} className={recordCardClassName}>
                        <div className="scrollbar-hidden min-h-0 flex-1 overflow-y-auto pr-14">
                          <p className="font-semibold text-slate-900">
                            {record.name}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            {record.model_number
                              ? `${record.machine_type} / ${record.model_number}`
                              : record.machine_type}
                          </p>
                          <p className="mt-2 text-sm text-slate-600">
                            {record.location_name || "No location recorded"}
                          </p>
                          <p className="mt-2 text-sm text-slate-600">
                            {titleCase(record.status)}
                          </p>
                          <p className="mt-2 text-sm text-slate-600">
                            {record.manufacturer || "No manufacturer"}
                          </p>
                        </div>
                        {isAdmin ? (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedMachineId(record.id);
                              setMachineForm(buildMachineForm(record));
                              setActiveModal("machine");
                            }}
                            className={recordEditButtonClassName}
                            aria-label={`Edit ${record.name}`}
                            title={`Edit ${record.name}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                        ) : null}
                      </div>
                    ))
                  )}
                </div>
              </section>
            ) : null}

            {activeTab === "schedules" ? (
              <section className="panel p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="section-label">Schedules</p>
                    <h2 className="mt-1 text-2xl font-semibold text-slate-900">
                      Maintenance schedules
                    </h2>
                  </div>
                  {isAdmin ? (
                    <button
                      type="button"
                      onClick={() => {
                        resetScheduleState();
                        setActiveModal("schedule");
                      }}
                      className={iconButtonClassName}
                      aria-label="Add maintenance schedule"
                      title="Add maintenance schedule"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>

                <div className="scrollbar-hidden mt-5 flex gap-3 overflow-x-auto pb-2">
                  {maintenanceSchedules.length === 0 ? (
                    <EmptyState
                      title="No maintenance schedules yet"
                      description="Set up recurring maintenance plans for each machine here."
                      className={`${recordCardClassName} justify-center`}
                    />
                  ) : (
                    maintenanceSchedules.map((record) => (
                      <div key={record.id} className={recordCardClassName}>
                        <div className="scrollbar-hidden min-h-0 flex-1 overflow-y-auto pr-14">
                          <p className="font-semibold text-slate-900">
                            {record.title}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            {record.machine_name}
                          </p>
                          <p className="mt-2 text-sm text-slate-600">
                            {record.maintenance_type}
                          </p>
                          <p className="mt-2 text-sm text-slate-600">
                            {titleCase(record.frequency)}
                          </p>
                          <p className="mt-2 text-sm text-slate-600">
                            Next due {formatDate(record.next_due_date)}
                          </p>
                          <p className="mt-2 text-sm text-slate-600">
                            {record.is_active
                              ? "Active schedule"
                              : "Inactive schedule"}
                          </p>
                        </div>
                        {isAdmin ? (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedScheduleId(record.id);
                              setScheduleForm(buildScheduleForm(record));
                              setActiveModal("schedule");
                            }}
                            className={recordEditButtonClassName}
                            aria-label={`Edit ${record.title}`}
                            title={`Edit ${record.title}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                        ) : null}
                      </div>
                    ))
                  )}
                </div>
              </section>
            ) : null}
          </div>

          <div className="space-y-6">
            {activeTab === "usage" ? (
              <section className="panel p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="section-label">Usage Logs</p>
                    <h2 className="mt-1 text-2xl font-semibold text-slate-900">
                      Machine usage
                    </h2>
                  </div>
                  {isAdmin ? (
                    <button
                      type="button"
                      onClick={() => {
                        resetUsageState();
                        setActiveModal("usage");
                      }}
                      className={iconButtonClassName}
                      aria-label="Add usage log"
                      title="Add usage log"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>

                <div className="scrollbar-hidden mt-5 flex gap-3 overflow-x-auto pb-2">
                  {usageLogs.length === 0 ? (
                    <EmptyState
                      title="No usage logs yet"
                      description="Capture daily or shift usage for each machine here."
                      className={`${recordCardClassName} justify-center`}
                    />
                  ) : (
                    usageLogs.map((record) => (
                      <div key={record.id} className={recordCardClassName}>
                        <div className="scrollbar-hidden min-h-0 flex-1 overflow-y-auto pr-14">
                          <p className="font-semibold text-slate-900">
                            {record.machine_name}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            {formatDate(record.usage_date)}
                          </p>
                          <p className="mt-2 text-sm text-slate-600">
                            {record.hours_used} hrs used
                          </p>
                          <p className="mt-2 text-sm text-slate-600">
                            {record.operator_name || "No operator name"}
                          </p>
                          <p className="mt-2 text-sm text-slate-600">
                            {record.purpose || "No purpose recorded"}
                          </p>
                        </div>
                        {isAdmin ? (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedUsageId(record.id);
                              setUsageForm(buildUsageForm(record));
                              setActiveModal("usage");
                            }}
                            className={recordEditButtonClassName}
                            aria-label={`Edit usage for ${record.machine_name}`}
                            title={`Edit usage for ${record.machine_name}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                        ) : null}
                      </div>
                    ))
                  )}
                </div>
              </section>
            ) : null}

            {activeTab === "maintenance" ? (
              <section className="panel p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="section-label">Maintenance Logs</p>
                    <h2 className="mt-1 text-2xl font-semibold text-slate-900">
                      Completed maintenance work
                    </h2>
                    <p className="mt-2 text-sm text-slate-500">
                      Logs tied to inactive schedules are kept in history and
                      hidden from this working lane.
                    </p>
                  </div>
                  {isAdmin ? (
                    <button
                      type="button"
                      onClick={() => {
                        resetMaintenanceLogState();
                        setActiveModal("maintenanceLog");
                      }}
                      className={iconButtonClassName}
                      aria-label="Add maintenance log"
                      title="Add maintenance log"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>

                <div className="scrollbar-hidden mt-5 flex gap-3 overflow-x-auto pb-2">
                  {visibleMaintenanceLogs.length === 0 ? (
                    <EmptyState
                      title={
                        hiddenMaintenanceLogCount > 0
                          ? "No active maintenance logs"
                          : "No maintenance logs yet"
                      }
                      description={
                        hiddenMaintenanceLogCount > 0
                          ? `${hiddenMaintenanceLogCount} log${hiddenMaintenanceLogCount === 1 ? "" : "s"} remain in hidden history because their schedules are inactive.`
                          : "Capture completed service work, costs, and downtime here."
                      }
                      className={`${recordCardClassName} justify-center`}
                    />
                  ) : (
                    visibleMaintenanceLogs.map((record) => (
                      <div key={record.id} className={recordCardClassName}>
                        <div className="scrollbar-hidden min-h-0 flex-1 overflow-y-auto pr-14">
                          <p className="font-semibold text-slate-900">
                            {record.machine_name}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            {record.schedule_title || "No linked schedule"}
                          </p>
                          <p className="mt-2 text-sm text-slate-600">
                            {record.maintenance_type}
                          </p>
                          <p className="mt-2 text-sm text-slate-600">
                            {formatDate(record.maintenance_date)}
                          </p>
                          <p className="mt-2 text-sm text-slate-600">
                            {titleCase(record.status)}
                          </p>
                          <p className="mt-2 text-sm text-slate-600">
                            Cost {record.cost}
                          </p>
                        </div>
                        {isAdmin ? (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedMaintenanceLogId(record.id);
                              setMaintenanceLogForm(
                                buildMaintenanceLogForm(record),
                              );
                              setActiveModal("maintenanceLog");
                            }}
                            className={recordEditButtonClassName}
                            aria-label={`Edit maintenance log for ${record.machine_name}`}
                            title={`Edit maintenance log for ${record.machine_name}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                        ) : null}
                      </div>
                    ))
                  )}
                </div>
              </section>
            ) : null}

            {activeTab === "utility" ? (
              <section className="panel p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="section-label">Utility Logs</p>
                    <h2 className="mt-1 text-2xl font-semibold text-slate-900">
                      Consumption tracking
                    </h2>
                  </div>
                  {isAdmin ? (
                    <button
                      type="button"
                      onClick={() => {
                        resetUtilityState();
                        setActiveModal("utility");
                      }}
                      className={iconButtonClassName}
                      aria-label="Add utility log"
                      title="Add utility log"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>

                <div className="scrollbar-hidden mt-5 flex gap-3 overflow-x-auto pb-2">
                  {utilityLogs.length === 0 ? (
                    <EmptyState
                      title="No utility logs yet"
                      description="Track machine or facility utility consumption here."
                      className={`${recordCardClassName} justify-center`}
                    />
                  ) : (
                    utilityLogs.map((record) => (
                      <div key={record.id} className={recordCardClassName}>
                        <div className="scrollbar-hidden min-h-0 flex-1 overflow-y-auto pr-14">
                          <p className="font-semibold text-slate-900">
                            {titleCase(record.utility_type)}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            {record.machine_name || "Facility level"}
                          </p>
                          <p className="mt-2 text-sm text-slate-600">
                            {formatDate(record.log_date)}
                          </p>
                          <p className="mt-2 text-sm text-slate-600">
                            {record.quantity} {record.unit_name}
                          </p>
                          <p className="mt-2 text-sm text-slate-600">
                            Cost {record.cost}
                          </p>
                        </div>
                        {isAdmin ? (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedUtilityId(record.id);
                              setUtilityForm(buildUtilityForm(record));
                              setActiveModal("utility");
                            }}
                            className={recordEditButtonClassName}
                            aria-label={`Edit ${record.utility_type} log`}
                            title={`Edit ${record.utility_type} log`}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                        ) : null}
                      </div>
                    ))
                  )}
                </div>
              </section>
            ) : null}
          </div>

          <footer className="panel mt-auto px-4 py-3">
            <p className="text-sm leading-6 text-slate-600">
              <span className="font-semibold text-sky-700">
                {activeFlowItem.label}
              </span>{" "}
              {activeFlowItem.detail}
            </p>
          </footer>
        </div>
      </div>

      {activeModal === "machine" ? (
        <ModalShell
          title={selectedMachineId ? "Edit machine" : "Add machine"}
          onClose={closeModal}
        >
          <FormPanel label="Machines" title="Machine form">
            <form className="space-y-4" onSubmit={handleMachineSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Name
                  </span>
                  <input
                    className={fieldClassName}
                    value={machineForm.name}
                    onChange={(event) =>
                      setMachineForm((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    required
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Machine type
                  </span>
                  <input
                    className={fieldClassName}
                    value={machineForm.machine_type}
                    onChange={(event) =>
                      setMachineForm((current) => ({
                        ...current,
                        machine_type: event.target.value,
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
                    value={machineForm.status}
                    options={machineStatuses.map((value) => ({
                      label: titleCase(value),
                      value,
                    }))}
                    onChange={(value) =>
                      setMachineForm((current) => ({
                        ...current,
                        status: value as MachineStatus,
                      }))
                    }
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Manufacturer
                  </span>
                  <input
                    className={fieldClassName}
                    value={machineForm.manufacturer}
                    onChange={(event) =>
                      setMachineForm((current) => ({
                        ...current,
                        manufacturer: event.target.value,
                      }))
                    }
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Model number
                  </span>
                  <input
                    className={fieldClassName}
                    value={machineForm.model_number}
                    onChange={(event) =>
                      setMachineForm((current) => ({
                        ...current,
                        model_number: event.target.value,
                      }))
                    }
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Serial number
                  </span>
                  <input
                    className={fieldClassName}
                    value={machineForm.serial_number ?? ""}
                    onChange={(event) =>
                      setMachineForm((current) => ({
                        ...current,
                        serial_number: event.target.value,
                      }))
                    }
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Installation date
                  </span>
                  <input
                    type="date"
                    className={fieldClassName}
                    value={machineForm.installation_date ?? ""}
                    onChange={(event) =>
                      setMachineForm((current) => ({
                        ...current,
                        installation_date: event.target.value || null,
                      }))
                    }
                  />
                </label>
              </div>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">
                  Location name
                </span>
                <input
                  className={fieldClassName}
                  value={machineForm.location_name}
                  onChange={(event) =>
                    setMachineForm((current) => ({
                      ...current,
                      location_name: event.target.value,
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
                  value={machineForm.notes}
                  onChange={(event) =>
                    setMachineForm((current) => ({
                      ...current,
                      notes: event.target.value,
                    }))
                  }
                />
              </label>

              <FieldMessage message={machineError} />

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
                  onClick={() => void handleMachineDelete()}
                  disabled={!selectedMachineId || isMachinePending}
                  className={dangerButtonClassName}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>

                <button
                  type="submit"
                  disabled={isMachinePending}
                  className={primaryButtonClassName}
                >
                  {isMachinePending ? (
                    <>
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                      Saving
                    </>
                  ) : (
                    "Save machine"
                  )}
                </button>
              </div>
            </form>
          </FormPanel>
        </ModalShell>
      ) : null}

      {activeModal === "usage" ? (
        <ModalShell
          title={selectedUsageId ? "Edit usage log" : "Add usage log"}
          onClose={closeModal}
        >
          <FormPanel label="Usage Logs" title="Machine usage form">
            <form className="space-y-4" onSubmit={handleUsageSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Machine
                  </span>
                  <PickerField
                    value={usageForm.machine ? String(usageForm.machine) : ""}
                    options={[
                      { label: "Select machine", value: "" },
                      ...buildMachineOptions(),
                    ]}
                    searchable
                    searchPlaceholder="Search machines"
                    onChange={(value) =>
                      setUsageForm((current) => ({
                        ...current,
                        machine: value ? Number(value) : 0,
                      }))
                    }
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Usage date
                  </span>
                  <input
                    type="date"
                    className={fieldClassName}
                    value={usageForm.usage_date}
                    onChange={(event) =>
                      setUsageForm((current) => ({
                        ...current,
                        usage_date: event.target.value,
                      }))
                    }
                    required
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Hours used
                  </span>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    className={fieldClassName}
                    value={usageForm.hours_used}
                    onChange={(event) =>
                      setUsageForm((current) => ({
                        ...current,
                        hours_used: event.target.value,
                      }))
                    }
                    required
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Operator name
                  </span>
                  <PickerField
                    value={usageForm.operator_name}
                    options={[
                      { label: "Select operator", value: "" },
                      ...buildOperatorOptions(usageForm.operator_name),
                    ]}
                    searchable
                    searchPlaceholder="Search operators"
                    onChange={(value) =>
                      setUsageForm((current) => ({
                        ...current,
                        operator_name: value,
                      }))
                    }
                  />
                </label>
              </div>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">
                  Purpose
                </span>
                <input
                  className={fieldClassName}
                  value={usageForm.purpose}
                  onChange={(event) =>
                    setUsageForm((current) => ({
                      ...current,
                      purpose: event.target.value,
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
                  value={usageForm.notes}
                  onChange={(event) =>
                    setUsageForm((current) => ({
                      ...current,
                      notes: event.target.value,
                    }))
                  }
                />
              </label>

              <FieldMessage message={usageError} />

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
                  onClick={() => void handleUsageDelete()}
                  disabled={!selectedUsageId || isUsagePending}
                  className={dangerButtonClassName}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>

                <button
                  type="submit"
                  disabled={isUsagePending}
                  className={primaryButtonClassName}
                >
                  {isUsagePending ? (
                    <>
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                      Saving
                    </>
                  ) : (
                    "Save usage log"
                  )}
                </button>
              </div>
            </form>
          </FormPanel>
        </ModalShell>
      ) : null}

      {activeModal === "schedule" ? (
        <ModalShell
          title={
            selectedScheduleId
              ? "Edit maintenance schedule"
              : "Add maintenance schedule"
          }
          onClose={closeModal}
        >
          <FormPanel
            label="Maintenance Schedules"
            title="Maintenance schedule form"
          >
            <form className="space-y-4" onSubmit={handleScheduleSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Machine
                  </span>
                  <PickerField
                    value={
                      scheduleForm.machine ? String(scheduleForm.machine) : ""
                    }
                    options={[
                      { label: "Select machine", value: "" },
                      ...buildMachineOptions(),
                    ]}
                    searchable
                    searchPlaceholder="Search machines"
                    onChange={(value) =>
                      setScheduleForm((current) => ({
                        ...current,
                        machine: value ? Number(value) : 0,
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
                    value={scheduleForm.title}
                    onChange={(event) =>
                      setScheduleForm((current) => ({
                        ...current,
                        title: event.target.value,
                      }))
                    }
                    required
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Maintenance type
                  </span>
                  <PickerField
                    value={scheduleForm.maintenance_type}
                    options={maintenanceTypes.map((value) => ({
                      label: titleCase(value),
                      value,
                    }))}
                    onChange={(value) =>
                      setScheduleForm((current) => ({
                        ...current,
                        maintenance_type: value as MaintenanceType,
                      }))
                    }
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Frequency
                  </span>
                  <PickerField
                    value={scheduleForm.frequency}
                    options={maintenanceFrequencies.map((value) => ({
                      label: titleCase(value),
                      value,
                    }))}
                    onChange={(value) =>
                      setScheduleForm((current) => ({
                        ...current,
                        frequency: value as MaintenanceFrequency,
                      }))
                    }
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Next due date
                  </span>
                  <input
                    type="date"
                    className={fieldClassName}
                    value={scheduleForm.next_due_date}
                    onChange={(event) =>
                      setScheduleForm((current) => ({
                        ...current,
                        next_due_date: event.target.value,
                      }))
                    }
                    required
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Last completed date
                  </span>
                  <input
                    type="date"
                    className={fieldClassName}
                    value={scheduleForm.last_completed_date ?? ""}
                    onChange={(event) =>
                      setScheduleForm((current) => ({
                        ...current,
                        last_completed_date: event.target.value || null,
                      }))
                    }
                  />
                </label>

                {scheduleForm.frequency === "custom" ? (
                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-slate-700">
                      Interval days
                    </span>
                    <input
                      type="number"
                      min="1"
                      className={fieldClassName}
                      value={scheduleForm.interval_days ?? ""}
                      onChange={(event) =>
                        setScheduleForm((current) => ({
                          ...current,
                          interval_days: event.target.value
                            ? Number(event.target.value)
                            : null,
                        }))
                      }
                      required
                    />
                  </label>
                ) : null}

                <label className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/70 px-4 py-3 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={scheduleForm.is_active}
                    onChange={(event) =>
                      setScheduleForm((current) => ({
                        ...current,
                        is_active: event.target.checked,
                      }))
                    }
                  />
                  Active schedule
                </label>
              </div>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">
                  Notes
                </span>
                <textarea
                  className={textAreaClassName}
                  value={scheduleForm.notes}
                  onChange={(event) =>
                    setScheduleForm((current) => ({
                      ...current,
                      notes: event.target.value,
                    }))
                  }
                />
              </label>

              <FieldMessage message={scheduleError} />

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
                  onClick={() => void handleScheduleDelete()}
                  disabled={!selectedScheduleId || isSchedulePending}
                  className={dangerButtonClassName}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
                <button
                  type="submit"
                  disabled={isSchedulePending}
                  className={primaryButtonClassName}
                >
                  {isSchedulePending ? (
                    <>
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                      Saving
                    </>
                  ) : (
                    "Save schedule"
                  )}
                </button>
              </div>
            </form>
          </FormPanel>
        </ModalShell>
      ) : null}

      {activeModal === "maintenanceLog" ? (
        <ModalShell
          title={
            selectedMaintenanceLogId
              ? "Edit maintenance log"
              : "Add maintenance log"
          }
          onClose={closeModal}
          panelClassName="min-h-[760px]"
        >
          <div className="pt-14">
            <FormPanel label="Maintenance Logs" title="Maintenance log form">
              <form
                className="space-y-4 py-4"
                onSubmit={handleMaintenanceLogSubmit}
              >
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Machine
                  </span>
                  <PickerField
                    value={
                      maintenanceLogForm.machine
                        ? String(maintenanceLogForm.machine)
                        : ""
                    }
                    options={[
                      { label: "Select machine", value: "" },
                      ...buildMachineOptions(),
                    ]}
                    searchable
                    searchPlaceholder="Search machines"
                    onChange={(value) =>
                      setMaintenanceLogForm((current) => ({
                        ...current,
                        machine: value ? Number(value) : 0,
                        schedule: null,
                        maintenance_type: "preventive",
                      }))
                    }
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Schedule
                  </span>
                  <PickerField
                    value={
                      maintenanceLogForm.schedule
                        ? String(maintenanceLogForm.schedule)
                        : ""
                    }
                    options={[
                      { label: "No linked schedule", value: "" },
                      ...buildMaintenanceScheduleOptions(
                        maintenanceLogForm.machine,
                        maintenanceLogForm.schedule,
                      ),
                    ]}
                    searchable
                    searchPlaceholder="Search schedules"
                    onChange={(value) =>
                      setMaintenanceLogForm((current) => {
                        const selectedSchedule = maintenanceSchedules.find(
                          (record) => record.id === Number(value),
                        );
                        return {
                          ...current,
                          schedule: value ? Number(value) : null,
                          maintenance_type:
                            selectedSchedule?.maintenance_type ??
                            current.maintenance_type,
                        };
                      })
                    }
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Maintenance date
                  </span>
                  <input
                    type="date"
                    className={fieldClassName}
                    value={maintenanceLogForm.maintenance_date}
                    onChange={(event) =>
                      setMaintenanceLogForm((current) => ({
                        ...current,
                        maintenance_date: event.target.value,
                      }))
                    }
                    required
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Maintenance type
                  </span>
                  {maintenanceLogForm.schedule ? (
                    <div className="space-y-2">
                      <div className={fieldClassName}>
                        {titleCase(maintenanceLogForm.maintenance_type)}
                      </div>
                      <p className="text-xs text-slate-500">
                        This follows the linked maintenance schedule.
                      </p>
                    </div>
                  ) : (
                    <PickerField
                      value={maintenanceLogForm.maintenance_type}
                      options={maintenanceTypes.map((value) => ({
                        label: titleCase(value),
                        value,
                      }))}
                      onChange={(value) =>
                        setMaintenanceLogForm((current) => ({
                          ...current,
                          maintenance_type: value as MaintenanceType,
                        }))
                      }
                    />
                  )}
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Status
                  </span>
                  <PickerField
                    value={maintenanceLogForm.status}
                    options={maintenanceLogStatuses.map((value) => ({
                      label: titleCase(value),
                      value,
                    }))}
                    onChange={(value) =>
                      setMaintenanceLogForm((current) => ({
                        ...current,
                        status: value as MaintenanceLogStatus,
                      }))
                    }
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Performed by
                  </span>
                  <PickerField
                    value={maintenanceLogForm.performed_by_name}
                    options={[
                      { label: "Select member", value: "" },
                      ...buildInternalMemberOptions(
                        maintenanceLogForm.performed_by_name,
                      ),
                    ]}
                    searchable
                    searchPlaceholder="Search members"
                    menuClassName="max-h-[180px]"
                    onChange={(value) =>
                      setMaintenanceLogForm((current) => ({
                        ...current,
                        performed_by_name: value,
                      }))
                    }
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Cost
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className={fieldClassName}
                    value={maintenanceLogForm.cost}
                    onChange={(event) =>
                      setMaintenanceLogForm((current) => ({
                        ...current,
                        cost: event.target.value,
                      }))
                    }
                    required
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Downtime hours
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className={fieldClassName}
                    value={maintenanceLogForm.downtime_hours}
                    onChange={(event) =>
                      setMaintenanceLogForm((current) => ({
                        ...current,
                        downtime_hours: event.target.value,
                      }))
                    }
                    required
                  />
                </label>
              </div>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">
                  Notes
                </span>
                <textarea
                  className={textAreaClassName}
                  value={maintenanceLogForm.notes}
                  onChange={(event) =>
                    setMaintenanceLogForm((current) => ({
                      ...current,
                      notes: event.target.value,
                    }))
                  }
                />
              </label>

              <FieldMessage message={maintenanceLogError} />

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
                  onClick={() => void handleMaintenanceLogDelete()}
                  disabled={
                    !selectedMaintenanceLogId || isMaintenanceLogPending
                  }
                  className={dangerButtonClassName}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
                <button
                  type="submit"
                  disabled={isMaintenanceLogPending}
                  className={primaryButtonClassName}
                >
                  {isMaintenanceLogPending ? (
                    <>
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                      Saving
                    </>
                  ) : (
                    "Save maintenance log"
                  )}
                </button>
              </div>
              </form>
            </FormPanel>
          </div>
        </ModalShell>
      ) : null}

      {activeModal === "downtime" ? (
        <ModalShell
          title={
            selectedDowntimeId ? "Edit downtime alert" : "Add downtime alert"
          }
          onClose={closeModal}
        >
          <FormPanel label="Downtime Alerts" title="Downtime record form">
            <form className="space-y-4" onSubmit={handleDowntimeSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Machine
                  </span>
                  <PickerField
                    value={
                      downtimeForm.machine ? String(downtimeForm.machine) : ""
                    }
                    options={[
                      { label: "Select machine", value: "" },
                      ...buildMachineOptions(),
                    ]}
                    searchable
                    searchPlaceholder="Search machines"
                    onChange={(value) =>
                      setDowntimeForm((current) => ({
                        ...current,
                        machine: value ? Number(value) : 0,
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
                    value={downtimeForm.title}
                    onChange={(event) =>
                      setDowntimeForm((current) => ({
                        ...current,
                        title: event.target.value,
                      }))
                    }
                    required
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Severity
                  </span>
                  <PickerField
                    value={downtimeForm.severity}
                    options={downtimeSeverities.map((value) => ({
                      label: titleCase(value),
                      value,
                    }))}
                    onChange={(value) =>
                      setDowntimeForm((current) => ({
                        ...current,
                        severity: value as DowntimeSeverity,
                      }))
                    }
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Status
                  </span>
                  <PickerField
                    value={downtimeForm.status}
                    options={downtimeStatuses.map((value) => ({
                      label: titleCase(value),
                      value,
                    }))}
                    onChange={(value) =>
                      setDowntimeForm((current) => ({
                        ...current,
                        status: value as DowntimeStatus,
                        end_time:
                          value === "resolved"
                            ? current.end_time || getCurrentDateTimeInputValue()
                            : null,
                      }))
                    }
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Start time
                  </span>
                  <input
                    type="datetime-local"
                    className={fieldClassName}
                    value={downtimeForm.start_time}
                    onChange={(event) =>
                      setDowntimeForm((current) => ({
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
                    type="datetime-local"
                    className={fieldClassName}
                    value={downtimeForm.end_time ?? ""}
                    onChange={(event) =>
                      setDowntimeForm((current) => ({
                        ...current,
                        end_time: event.target.value || null,
                      }))
                    }
                  />
                </label>
              </div>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">
                  Cause
                </span>
                <textarea
                  className={textAreaClassName}
                  value={downtimeForm.cause}
                  onChange={(event) =>
                    setDowntimeForm((current) => ({
                      ...current,
                      cause: event.target.value,
                    }))
                  }
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">
                  Resolution notes
                </span>
                <textarea
                  className={textAreaClassName}
                  value={downtimeForm.resolution_notes}
                  onChange={(event) =>
                    setDowntimeForm((current) => ({
                      ...current,
                      resolution_notes: event.target.value,
                    }))
                  }
                />
              </label>

              <FieldMessage message={downtimeError} />

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
                  onClick={() => void handleDowntimeDelete()}
                  disabled={!selectedDowntimeId || isDowntimePending}
                  className={dangerButtonClassName}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>

                <button
                  type="submit"
                  disabled={isDowntimePending}
                  className={primaryButtonClassName}
                >
                  {isDowntimePending ? (
                    <>
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                      Saving
                    </>
                  ) : (
                    "Save downtime record"
                  )}
                </button>
              </div>
            </form>
          </FormPanel>
        </ModalShell>
      ) : null}

      {activeModal === "utility" ? (
        <ModalShell
          title={selectedUtilityId ? "Edit utility log" : "Add utility log"}
          onClose={closeModal}
        >
          <FormPanel label="Utility Logs" title="Utility consumption form">
            <form className="space-y-4" onSubmit={handleUtilitySubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Machine
                  </span>
                  <PickerField
                    value={
                      utilityForm.machine ? String(utilityForm.machine) : ""
                    }
                    options={[
                      { label: "Facility level", value: "" },
                      ...buildMachineOptions(),
                    ]}
                    searchable
                    searchPlaceholder="Search machines"
                    onChange={(value) =>
                      setUtilityForm((current) => ({
                        ...current,
                        machine: value ? Number(value) : null,
                      }))
                    }
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Utility type
                  </span>
                  <PickerField
                    value={utilityForm.utility_type}
                    options={utilityTypes.map((value) => ({
                      label: titleCase(value),
                      value,
                    }))}
                    onChange={(value) =>
                      setUtilityForm((current) => ({
                        ...current,
                        utility_type: value as UtilityType,
                      }))
                    }
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Log date
                  </span>
                  <input
                    type="date"
                    className={fieldClassName}
                    value={utilityForm.log_date}
                    onChange={(event) =>
                      setUtilityForm((current) => ({
                        ...current,
                        log_date: event.target.value,
                      }))
                    }
                    required
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Quantity
                  </span>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    className={fieldClassName}
                    value={utilityForm.quantity}
                    onChange={(event) =>
                      setUtilityForm((current) => ({
                        ...current,
                        quantity: event.target.value,
                      }))
                    }
                    required
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Unit name
                  </span>
                  <input
                    className={fieldClassName}
                    value={utilityForm.unit_name}
                    onChange={(event) =>
                      setUtilityForm((current) => ({
                        ...current,
                        unit_name: event.target.value,
                      }))
                    }
                    required
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Cost
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className={fieldClassName}
                    value={utilityForm.cost}
                    onChange={(event) =>
                      setUtilityForm((current) => ({
                        ...current,
                        cost: event.target.value,
                      }))
                    }
                    required
                  />
                </label>
              </div>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">
                  Notes
                </span>
                <textarea
                  className={textAreaClassName}
                  value={utilityForm.notes}
                  onChange={(event) =>
                    setUtilityForm((current) => ({
                      ...current,
                      notes: event.target.value,
                    }))
                  }
                />
              </label>

              <FieldMessage message={utilityError} />

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
                  onClick={() => void handleUtilityDelete()}
                  disabled={!selectedUtilityId || isUtilityPending}
                  className={dangerButtonClassName}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>

                <button
                  type="submit"
                  disabled={isUtilityPending}
                  className={primaryButtonClassName}
                >
                  {isUtilityPending ? (
                    <>
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                      Saving
                    </>
                  ) : (
                    "Save utility log"
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
