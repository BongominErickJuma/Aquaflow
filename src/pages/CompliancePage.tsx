import {
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
import { ApiError, resolveApiAssetUrl } from "../lib/api/auth";
import {
  createComplianceDocument,
  createHygieneCheck,
  createSafetyRecord,
  createTrainingRecord,
  createWaterQualityTest,
  deleteComplianceDocument,
  deleteHygieneCheck,
  deleteSafetyRecord,
  deleteTrainingRecord,
  deleteWaterQualityTest,
  fetchComplianceDocument,
  fetchComplianceDocuments,
  fetchHygieneCheck,
  fetchHygieneChecks,
  fetchSafetyRecord,
  fetchSafetyRecords,
  fetchTrainingRecord,
  fetchTrainingRecords,
  fetchWaterQualityTest,
  fetchWaterQualityTests,
  updateComplianceDocument,
  updateHygieneCheck,
  updateSafetyRecord,
  updateTrainingRecord,
  updateWaterQualityTest,
} from "../lib/api/compliance";
import { fetchEmployees } from "../lib/api/workforce";
import type {
  CheckStatus,
  ComplianceDocumentPayload,
  ComplianceDocumentRecord,
  DocumentStatus,
  HygieneCheckPayload,
  HygieneCheckRecord,
  SafetyPayload,
  SafetyRecord,
  SafetySeverity,
  SafetyStatus,
  TrainingPayload,
  TrainingRecord,
  WaterQualityTestPayload,
  WaterQualityTestRecord,
} from "../types/compliance";
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
  "group relative flex h-[266px] min-w-[280px] max-w-[280px] flex-shrink-0 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4";
const recordEditButtonClassName = `${iconButtonClassName} absolute right-4 top-4 opacity-0 pointer-events-none group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100`;

const complianceMilestoneFlow = [
  {
    id: "hygiene",
    label: "Hygiene Checks",
    detail:
      "Capture hygiene checks here. Before this, there is nothing to prepare. Next, add water tests.",
  },
  {
    id: "water",
    label: "Water Tests",
    detail:
      "Record water quality tests here. Before this, hygiene checks should already be in place. Next, add safety records.",
  },
  {
    id: "safety",
    label: "Safety Records",
    detail:
      "Store safety records here. Before this, water tests should be ready. Next, capture training records.",
  },
  {
    id: "training",
    label: "Training Records",
    detail:
      "Add training records here. Before this, safety records should already exist. Next, upload compliance documents.",
  },
  {
    id: "documents",
    label: "Documents",
    detail:
      "Upload and manage compliance documents here. Before this, training records should be in place. This is the last compliance step.",
  },
] as const;

type ActiveModal =
  | "hygiene"
  | "water"
  | "safety"
  | "training"
  | "document"
  | null;

type DocumentFormState = {
  title: string;
  document_type: string;
  issue_date: string;
  status: DocumentStatus;
  notes: string;
  file: File | null;
  remove_file: boolean;
};

const checkStatuses: CheckStatus[] = ["pass", "fail", "pending"];
const safetySeverities: SafetySeverity[] = [
  "low",
  "medium",
  "high",
  "critical",
];
const safetyStatuses: SafetyStatus[] = ["open", "closed"];
const documentStatuses: DocumentStatus[] = [
  "draft",
  "active",
  "expired",
  "archived",
];

function createEmptyHygieneForm(): HygieneCheckPayload {
  return {
    check_date: "",
    area: "",
    inspector_name: "",
    status: "pending",
    corrective_action: "",
    notes: "",
  };
}

function createEmptyWaterForm(): WaterQualityTestPayload {
  return {
    test_date: "",
    location: "",
    parameter_name: "",
    result_value: "",
    unit_name: "",
    standard_limit: "",
    status: "pending",
    tested_by: "",
    notes: "",
  };
}

function createEmptySafetyForm(): SafetyPayload {
  return {
    record_date: "",
    incident_type: "",
    severity: "medium",
    status: "open",
    reported_by: "",
    description: "",
    action_taken: "",
    notes: "",
  };
}

function createEmptyTrainingForm(): TrainingPayload {
  return {
    employee: 0,
    training_title: "",
    training_date: "",
    trainer_name: "",
    certificate_number: "",
    notes: "",
  };
}

function createEmptyDocumentForm(): DocumentFormState {
  return {
    title: "",
    document_type: "",
    issue_date: "",
    status: "draft",
    notes: "",
    file: null,
    remove_file: false,
  };
}

const supportedDocumentTypes = [
  "License",
  "Permit",
  "Certificate",
  "SOP",
  "Report",
  "Policy",
] as const;

const maxDocumentFileSizeLabel = "10 MB";

function FieldMessage({ message }: { message: string | null }) {
  if (!message) {
    return null;
  }

  return (
    <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {message}
    </p>
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
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-4 rounded-[28px] border border-slate-200/80 bg-white/90 p-6 shadow-[0_22px_60px_rgba(148,163,184,0.14)]">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
      {children}
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
        {label}
      </p>
      <div className="text-sm text-slate-700">{value}</div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className={`${recordCardClassName} justify-center`}>
      <p className="text-sm leading-6 text-slate-500">{message}</p>
    </div>
  );
}

function ModalShell({
  title,
  description,
  children,
  onClose,
}: {
  title: string;
  description: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/25 px-4 py-8 backdrop-blur-sm">
      <div className="scrollbar-hidden max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-[32px] border border-white/60 bg-[#f8fcff] p-6 shadow-[0_30px_90px_rgba(15,23,42,0.18)]">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
            <p className="text-sm text-slate-500">{description}</p>
          </div>
          <button
            type="button"
            className={secondaryButtonClassName}
            onClick={onClose}
          >
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function SectionCard({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="panel p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <p className="text-sm text-slate-500">{description}</p>
        </div>
        {action}
      </div>
      <div className="module-card-lane mt-5">{children}</div>
    </section>
  );
}

function formatDate(value: string | null) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en-UG", {
    dateStyle: "medium",
  }).format(new Date(value));
}

function buildDocumentPayload(
  form: DocumentFormState,
): ComplianceDocumentPayload {
  return {
    title: form.title.trim(),
    document_type: form.document_type.trim(),
    issue_date: form.issue_date || null,
    status: form.status,
    notes: form.notes.trim(),
    file: form.file ?? undefined,
    remove_file: form.remove_file || undefined,
  };
}

export function CompliancePage() {
  const { user } = useAuth();
  const canManageCompliance =
    user?.role.code === "admin" ||
    user?.role.code === "superuser" ||
    user?.role.code === "hr";

  const [hygieneChecks, setHygieneChecks] = useState<HygieneCheckRecord[]>([]);
  const [waterTests, setWaterTests] = useState<WaterQualityTestRecord[]>([]);
  const [safetyRecords, setSafetyRecords] = useState<SafetyRecord[]>([]);
  const [trainingRecords, setTrainingRecords] = useState<TrainingRecord[]>([]);
  const [documents, setDocuments] = useState<ComplianceDocumentRecord[]>([]);
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);

  const [selectedHygieneId, setSelectedHygieneId] = useState<number | null>(
    null,
  );
  const [selectedWaterId, setSelectedWaterId] = useState<number | null>(null);
  const [selectedSafetyId, setSelectedSafetyId] = useState<number | null>(null);
  const [selectedTrainingId, setSelectedTrainingId] = useState<number | null>(
    null,
  );
  const [selectedDocumentId, setSelectedDocumentId] = useState<number | null>(
    null,
  );

  const [hygieneForm, setHygieneForm] = useState<HygieneCheckPayload>(
    createEmptyHygieneForm,
  );
  const [waterForm, setWaterForm] =
    useState<WaterQualityTestPayload>(createEmptyWaterForm);
  const [safetyForm, setSafetyForm] = useState<SafetyPayload>(
    createEmptySafetyForm,
  );
  const [trainingForm, setTrainingForm] = useState<TrainingPayload>(
    createEmptyTrainingForm,
  );
  const [documentForm, setDocumentForm] = useState<DocumentFormState>(
    createEmptyDocumentForm,
  );

  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [hygieneError, setHygieneError] = useState<string | null>(null);
  const [waterError, setWaterError] = useState<string | null>(null);
  const [safetyError, setSafetyError] = useState<string | null>(null);
  const [trainingError, setTrainingError] = useState<string | null>(null);
  const [documentError, setDocumentError] = useState<string | null>(null);
  const [hygienePending, setHygienePending] = useState(false);
  const [waterPending, setWaterPending] = useState(false);
  const [safetyPending, setSafetyPending] = useState(false);
  const [trainingPending, setTrainingPending] = useState(false);
  const [documentPending, setDocumentPending] = useState(false);
  const [activeTab, setActiveTab] = useState("hygiene");

  const tabs = complianceMilestoneFlow.map(({ id, label }) => ({ id, label }));
  const activeFlowItem =
    complianceMilestoneFlow.find((item) => item.id === activeTab) ??
    complianceMilestoneFlow[0];
  const buildEmployeePickerOptions = (selectedEmployeeId?: number | null) =>
    employees
      .filter(
        (employee) =>
          employee.status === "active" || employee.id === selectedEmployeeId,
      )
      .map((employee) => ({
        label: employee.full_name,
        value: String(employee.id),
        searchText: [
          employee.full_name,
          employee.employee_code,
          employee.email,
          employee.job_title,
          employee.work_role,
        ]
          .filter(Boolean)
          .join(" "),
      }));

  async function reloadComplianceData() {
    const [hygiene, water, safety, training, docs, staff] = await Promise.all([
      fetchHygieneChecks(),
      fetchWaterQualityTests(),
      fetchSafetyRecords(),
      fetchTrainingRecords(),
      fetchComplianceDocuments(),
      fetchEmployees(),
    ]);

    setHygieneChecks(hygiene);
    setWaterTests(water);
    setSafetyRecords(safety);
    setTrainingRecords(training);
    setDocuments(docs);
    setEmployees(staff);
  }

  useEffect(() => {
    if (!canManageCompliance) {
      setLoading(false);
      setPageError(null);
      return;
    }

    let isMounted = true;

    async function loadPage() {
      try {
        setLoading(true);
        setPageError(null);
        await reloadComplianceData();
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setPageError(
          error instanceof ApiError
            ? error.message
            : "Unable to load compliance records right now.",
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadPage();

    return () => {
      isMounted = false;
    };
  }, [canManageCompliance]);

  useEffect(() => {
    if (!selectedHygieneId) {
      setHygieneForm(createEmptyHygieneForm());
      return;
    }

    void fetchHygieneCheck(selectedHygieneId)
      .then((record) =>
        setHygieneForm({
          check_date: record.check_date,
          area: record.area,
          inspector_name: record.inspector_name,
          status: record.status,
          corrective_action: record.corrective_action,
          notes: record.notes,
        }),
      )
      .catch((error) =>
        setHygieneError(
          error instanceof ApiError
            ? error.message
            : "Unable to load hygiene check.",
        ),
      );
  }, [selectedHygieneId]);

  useEffect(() => {
    if (!selectedWaterId) {
      setWaterForm(createEmptyWaterForm());
      return;
    }

    void fetchWaterQualityTest(selectedWaterId)
      .then((record) =>
        setWaterForm({
          test_date: record.test_date,
          location: record.location,
          parameter_name: record.parameter_name,
          result_value: record.result_value,
          unit_name: record.unit_name,
          standard_limit: record.standard_limit,
          status: record.status,
          tested_by: record.tested_by,
          notes: record.notes,
        }),
      )
      .catch((error) =>
        setWaterError(
          error instanceof ApiError
            ? error.message
            : "Unable to load water quality test.",
        ),
      );
  }, [selectedWaterId]);

  useEffect(() => {
    if (!selectedSafetyId) {
      setSafetyForm(createEmptySafetyForm());
      return;
    }

    void fetchSafetyRecord(selectedSafetyId)
      .then((record) =>
        setSafetyForm({
          record_date: record.record_date,
          incident_type: record.incident_type,
          severity: record.severity,
          status: record.status,
          reported_by: record.reported_by,
          description: record.description,
          action_taken: record.action_taken,
          notes: record.notes,
        }),
      )
      .catch((error) =>
        setSafetyError(
          error instanceof ApiError
            ? error.message
            : "Unable to load safety record.",
        ),
      );
  }, [selectedSafetyId]);

  useEffect(() => {
    if (!selectedTrainingId) {
      setTrainingForm(createEmptyTrainingForm());
      return;
    }

    void fetchTrainingRecord(selectedTrainingId)
      .then((record) =>
        setTrainingForm({
          employee: record.employee,
          training_title: record.training_title,
          training_date: record.training_date,
          trainer_name: record.trainer_name,
          certificate_number: record.certificate_number,
          notes: record.notes,
        }),
      )
      .catch((error) =>
        setTrainingError(
          error instanceof ApiError
            ? error.message
            : "Unable to load training record.",
        ),
      );
  }, [selectedTrainingId]);

  useEffect(() => {
    if (!selectedDocumentId) {
      setDocumentForm(createEmptyDocumentForm());
      return;
    }

    void fetchComplianceDocument(selectedDocumentId)
      .then((record) =>
        setDocumentForm({
          title: record.title,
          document_type: record.document_type,
          issue_date: record.issue_date ?? "",
          status: record.status,
          notes: record.notes,
          file: null,
          remove_file: false,
        }),
      )
      .catch((error) =>
        setDocumentError(
          error instanceof ApiError
            ? error.message
            : "Unable to load document.",
        ),
      );
  }, [selectedDocumentId]);

  function closeModal() {
    setActiveModal(null);
    setHygieneError(null);
    setWaterError(null);
    setSafetyError(null);
    setTrainingError(null);
    setDocumentError(null);
  }

  function resetHygieneForm() {
    setSelectedHygieneId(null);
    setHygieneForm(createEmptyHygieneForm());
    setHygieneError(null);
  }

  function resetWaterForm() {
    setSelectedWaterId(null);
    setWaterForm(createEmptyWaterForm());
    setWaterError(null);
  }

  function resetSafetyForm() {
    setSelectedSafetyId(null);
    setSafetyForm(createEmptySafetyForm());
    setSafetyError(null);
  }

  function resetTrainingForm() {
    setSelectedTrainingId(null);
    setTrainingForm(createEmptyTrainingForm());
    setTrainingError(null);
  }

  function resetDocumentForm() {
    setSelectedDocumentId(null);
    setDocumentForm(createEmptyDocumentForm());
    setDocumentError(null);
  }

  async function runDelete(
    deleter: () => Promise<void>,
    resetter: () => void,
    setError: (value: string | null) => void,
    setPending: (value: boolean) => void,
    fallbackMessage: string,
  ) {
    setPending(true);
    setError(null);

    try {
      await deleter();
      await reloadComplianceData();
      resetter();
      closeModal();
    } catch (error) {
      setError(error instanceof ApiError ? error.message : fallbackMessage);
    } finally {
      setPending(false);
    }
  }

  async function handleHygieneSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setHygienePending(true);
    setHygieneError(null);

    try {
      if (selectedHygieneId) {
        await updateHygieneCheck(selectedHygieneId, hygieneForm);
      } else {
        await createHygieneCheck(hygieneForm);
      }

      await reloadComplianceData();
      resetHygieneForm();
      closeModal();
    } catch (error) {
      setHygieneError(
        error instanceof ApiError
          ? error.message
          : "Unable to save hygiene check.",
      );
    } finally {
      setHygienePending(false);
    }
  }

  async function handleWaterSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setWaterPending(true);
    setWaterError(null);

    try {
      const payload: WaterQualityTestPayload = {
        ...waterForm,
        location: waterForm.location.trim(),
        parameter_name: waterForm.parameter_name.trim(),
        result_value: waterForm.result_value.trim(),
        unit_name: waterForm.unit_name.trim(),
        standard_limit: waterForm.standard_limit.trim(),
        tested_by: waterForm.tested_by.trim(),
        notes: waterForm.notes.trim(),
      };

      if (selectedWaterId) {
        await updateWaterQualityTest(selectedWaterId, payload);
      } else {
        await createWaterQualityTest(payload);
      }

      await reloadComplianceData();
      resetWaterForm();
      closeModal();
    } catch (error) {
      setWaterError(
        error instanceof ApiError
          ? error.message
          : "Unable to save water quality test.",
      );
    } finally {
      setWaterPending(false);
    }
  }

  async function handleSafetySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSafetyPending(true);
    setSafetyError(null);

    try {
      if (selectedSafetyId) {
        await updateSafetyRecord(selectedSafetyId, safetyForm);
      } else {
        await createSafetyRecord(safetyForm);
      }

      await reloadComplianceData();
      resetSafetyForm();
      closeModal();
    } catch (error) {
      setSafetyError(
        error instanceof ApiError
          ? error.message
          : "Unable to save safety record.",
      );
    } finally {
      setSafetyPending(false);
    }
  }

  async function handleTrainingSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTrainingPending(true);
    setTrainingError(null);

    try {
      const payload: TrainingPayload = {
        employee: Number(trainingForm.employee),
        training_title: trainingForm.training_title.trim(),
        training_date: trainingForm.training_date,
        trainer_name: trainingForm.trainer_name.trim(),
        certificate_number: trainingForm.certificate_number.trim(),
        notes: trainingForm.notes.trim(),
      };

      if (selectedTrainingId) {
        await updateTrainingRecord(selectedTrainingId, payload);
      } else {
        await createTrainingRecord(payload);
      }

      await reloadComplianceData();
      resetTrainingForm();
      closeModal();
    } catch (error) {
      setTrainingError(
        error instanceof ApiError ? error.message : "Unable to save training.",
      );
    } finally {
      setTrainingPending(false);
    }
  }

  async function handleDocumentSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setDocumentPending(true);
    setDocumentError(null);

    try {
      const payload = buildDocumentPayload(documentForm);

      if (selectedDocumentId) {
        await updateComplianceDocument(selectedDocumentId, payload);
      } else {
        await createComplianceDocument(payload);
      }

      await reloadComplianceData();
      resetDocumentForm();
      closeModal();
    } catch (error) {
      setDocumentError(
        error instanceof ApiError ? error.message : "Unable to save document.",
      );
    } finally {
      setDocumentPending(false);
    }
  }

  if (!canManageCompliance) {
    return (
      <section className="panel max-w-3xl p-8">
        <p className="section-label">Compliance</p>
        <div className="mt-4 flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 text-amber-700">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              Compliance access is restricted
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
              Viewing and managing compliance records is limited to HR and admin
              accounts.
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-600 shadow-sm">
          <LoaderCircle className="h-4 w-4 animate-spin" />
          Loading compliance records...
        </div>
      </div>
    );
  }

  if (pageError) {
    return (
      <div className="rounded-[28px] border border-red-200 bg-red-50 p-6 text-red-700 shadow-sm">
        {pageError}
      </div>
    );
  }

  return (
    <div className="module-page">
      <section className="rounded-[32px] border border-white/70 bg-[radial-gradient(circle_at_top_left,#ffffff,rgba(224,242,254,0.92)_52%,rgba(240,249,255,0.95))] py-6 pl-6 pr-0 shadow-[0_25px_80px_rgba(148,163,184,0.14)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/75 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-sky-700">
              Compliance
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
                Compliance records
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-slate-600">
                Keep hygiene checks, water quality, safety incidents, training
                history, and official compliance documents visible in one place.
              </p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="hero-metric-card">
              <p className="hero-metric-label">Hygiene</p>
              <p className="hero-metric-value">{hygieneChecks.length}</p>
            </div>
            <div className="hero-metric-card">
              <p className="hero-metric-label">Water tests</p>
              <p className="hero-metric-value">{waterTests.length}</p>
            </div>
            <div className="hero-metric-card">
              <p className="hero-metric-label">Safety</p>
              <p className="hero-metric-value">{safetyRecords.length}</p>
            </div>
            <div className="hero-metric-card">
              <p className="hero-metric-label">Documents</p>
              <p className="hero-metric-value">{documents.length}</p>
            </div>
          </div>
        </div>
      </section>
      <ModuleTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      <div className="module-page-stage !justify-start overflow-hidden">
        <div className="flex min-h-0 flex-1 flex-col gap-6">
          <div className="min-h-0 flex-1">
            {activeTab === "hygiene" ? (
              <SectionCard
                title="Hygiene checks"
                description="Cleaning and sanitation checks for plant and storage areas."
                action={
                  canManageCompliance ? (
                    <button
                      type="button"
                      className={iconButtonClassName}
                      onClick={() => {
                        resetHygieneForm();
                        setActiveModal("hygiene");
                      }}
                      aria-label="Add hygiene check"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  ) : null
                }
              >
                {hygieneChecks.length ? (
                  hygieneChecks.map((record) => (
                    <article key={record.id} className={recordCardClassName}>
                      {canManageCompliance ? (
                        <button
                          type="button"
                          className={recordEditButtonClassName}
                          onClick={() => {
                            setSelectedHygieneId(record.id);
                            setActiveModal("hygiene");
                          }}
                          aria-label={`Edit hygiene check for ${record.area}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      ) : null}
                      <div className="flex flex-1 flex-col gap-4">
                        <div className="space-y-1 pr-10">
                          <h3 className="line-clamp-2 text-sm font-semibold text-slate-900">
                            {record.area}
                          </h3>
                          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                            {record.status}
                          </p>
                        </div>
                        <div className="flex-1 space-y-3">
                          <DetailItem
                            label="Date"
                            value={formatDate(record.check_date)}
                          />
                          <DetailItem
                            label="Inspector"
                            value={record.inspector_name}
                          />
                          <DetailItem
                            label="Action"
                            value={
                              record.corrective_action ||
                              "No corrective action logged"
                            }
                          />
                        </div>
                      </div>
                    </article>
                  ))
                ) : (
                  <EmptyState message="No hygiene checks logged yet." />
                )}
              </SectionCard>
            ) : null}

            {activeTab === "water" ? (
              <SectionCard
                title="Water quality tests"
                description="Lab results, locations, and accepted limits."
                action={
                  canManageCompliance ? (
                    <button
                      type="button"
                      className={iconButtonClassName}
                      onClick={() => {
                        resetWaterForm();
                        setActiveModal("water");
                      }}
                      aria-label="Add water quality test"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  ) : null
                }
              >
                {waterTests.length ? (
                  waterTests.map((record) => (
                    <article key={record.id} className={recordCardClassName}>
                      {canManageCompliance ? (
                        <button
                          type="button"
                          className={recordEditButtonClassName}
                          onClick={() => {
                            setSelectedWaterId(record.id);
                            setActiveModal("water");
                          }}
                          aria-label={`Edit water test ${record.parameter_name}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      ) : null}
                      <div className="flex flex-1 flex-col gap-4">
                        <div className="space-y-1 pr-10">
                          <h3 className="line-clamp-2 text-sm font-semibold text-slate-900">
                            {record.parameter_name}
                          </h3>
                          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                            {record.status}
                          </p>
                        </div>
                        <div className="flex-1 space-y-3">
                          <DetailItem
                            label="Location"
                            value={record.location}
                          />
                          <DetailItem
                            label="Result"
                            value={`${record.result_value} ${record.unit_name}`.trim()}
                          />
                          <DetailItem
                            label="Standard"
                            value={record.standard_limit}
                          />
                        </div>
                      </div>
                    </article>
                  ))
                ) : (
                  <EmptyState message="No water quality tests recorded yet." />
                )}
              </SectionCard>
            ) : null}

            {activeTab === "safety" ? (
              <SectionCard
                title="Safety records"
                description="Incident tracking, severity, and corrective actions."
                action={
                  canManageCompliance ? (
                    <button
                      type="button"
                      className={iconButtonClassName}
                      onClick={() => {
                        resetSafetyForm();
                        setActiveModal("safety");
                      }}
                      aria-label="Add safety record"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  ) : null
                }
              >
                {safetyRecords.length ? (
                  safetyRecords.map((record) => (
                    <article key={record.id} className={recordCardClassName}>
                      {canManageCompliance ? (
                        <button
                          type="button"
                          className={recordEditButtonClassName}
                          onClick={() => {
                            setSelectedSafetyId(record.id);
                            setActiveModal("safety");
                          }}
                          aria-label={`Edit safety record ${record.incident_type}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      ) : null}
                      <div className="flex flex-1 flex-col gap-4">
                        <div className="space-y-1 pr-10">
                          <h3 className="line-clamp-2 text-sm font-semibold text-slate-900">
                            {record.incident_type}
                          </h3>
                          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                            {record.status}
                          </p>
                        </div>
                        <div className="flex-1 space-y-3">
                          <DetailItem
                            label="Severity"
                            value={record.severity}
                          />
                          <DetailItem
                            label="Reported by"
                            value={record.reported_by}
                          />
                          <DetailItem
                            label="Action"
                            value={record.action_taken || "No action logged"}
                          />
                        </div>
                      </div>
                    </article>
                  ))
                ) : (
                  <EmptyState message="No safety records available yet." />
                )}
              </SectionCard>
            ) : null}

            {activeTab === "training" ? (
              <SectionCard
                title="Training records"
                description="Employee-linked compliance training and certificate details."
                action={
                  canManageCompliance ? (
                    <button
                      type="button"
                      className={iconButtonClassName}
                      onClick={() => {
                        resetTrainingForm();
                        setActiveModal("training");
                      }}
                      aria-label="Add training record"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  ) : null
                }
              >
                {trainingRecords.length ? (
                  trainingRecords.map((record) => (
                    <article key={record.id} className={recordCardClassName}>
                      {canManageCompliance ? (
                        <button
                          type="button"
                          className={recordEditButtonClassName}
                          onClick={() => {
                            setSelectedTrainingId(record.id);
                            setActiveModal("training");
                          }}
                          aria-label={`Edit training record for ${record.employee_name}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      ) : null}
                      <div className="flex flex-1 flex-col gap-4">
                        <div className="space-y-1 pr-10">
                          <h3 className="line-clamp-2 text-sm font-semibold text-slate-900">
                            {record.training_title}
                          </h3>
                          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                            {record.employee_name}
                          </p>
                        </div>
                        <div className="flex-1 space-y-3">
                          <DetailItem
                            label="Trainer"
                            value={record.trainer_name}
                          />
                          <DetailItem
                            label="Date"
                            value={formatDate(record.training_date)}
                          />
                        </div>
                      </div>
                    </article>
                  ))
                ) : (
                  <EmptyState message="No training records available yet." />
                )}
              </SectionCard>
            ) : null}

            {activeTab === "documents" ? (
              <SectionCard
                title="Compliance documents"
                description="Official files with issue dates and attachments."
                action={
                  canManageCompliance ? (
                    <button
                      type="button"
                      className={iconButtonClassName}
                      onClick={() => {
                        resetDocumentForm();
                        setActiveModal("document");
                      }}
                      aria-label="Add compliance document"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  ) : null
                }
              >
                {documents.length ? (
                  documents.map((record) => (
                    <article key={record.id} className={recordCardClassName}>
                      {canManageCompliance ? (
                        <button
                          type="button"
                          className={recordEditButtonClassName}
                          onClick={() => {
                            setSelectedDocumentId(record.id);
                            setActiveModal("document");
                          }}
                          aria-label={`Edit document ${record.title}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      ) : null}
                      <div className="flex flex-1 flex-col gap-4">
                        <div className="space-y-1 pr-10">
                          <h3 className="line-clamp-2 text-sm font-semibold text-slate-900">
                            {record.title}
                          </h3>
                          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                            {record.status}
                          </p>
                        </div>
                        <div className="flex-1 space-y-3">
                          <DetailItem
                            label="Type"
                            value={record.document_type}
                          />
                          <DetailItem
                            label="Issued"
                            value={formatDate(record.issue_date)}
                          />
                          <DetailItem
                            label="File"
                            value={
                              record.file ? (
                                <a
                                  href={resolveApiAssetUrl(record.file) ?? "#"}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-sky-700 underline underline-offset-4"
                                >
                                  View file
                                </a>
                              ) : (
                                "No file attached"
                              )
                            }
                          />
                        </div>
                      </div>
                    </article>
                  ))
                ) : (
                  <EmptyState message="No compliance documents uploaded yet." />
                )}
              </SectionCard>
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
      {activeModal === "hygiene" ? (
        <ModalShell
          title={selectedHygieneId ? "Edit hygiene check" : "Add hygiene check"}
          description="Capture inspection date, area, status, and corrective actions."
          onClose={closeModal}
        >
          <form className="space-y-6" onSubmit={handleHygieneSubmit}>
            <FormPanel
              title="Inspection details"
              description="Use the hygiene checks endpoint fields here."
            >
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  Check date
                  <input
                    type="date"
                    className={fieldClassName}
                    value={hygieneForm.check_date}
                    onChange={(event) =>
                      setHygieneForm((current) => ({
                        ...current,
                        check_date: event.target.value,
                      }))
                    }
                    required
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  Status
                  <PickerField
                    value={hygieneForm.status}
                    options={checkStatuses.map((status) => ({
                      label: status,
                      value: status,
                    }))}
                    onChange={(value) =>
                      setHygieneForm((current) => ({
                        ...current,
                        status: value as CheckStatus,
                      }))
                    }
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
                  Area
                  <input
                    className={fieldClassName}
                    value={hygieneForm.area}
                    onChange={(event) =>
                      setHygieneForm((current) => ({
                        ...current,
                        area: event.target.value,
                      }))
                    }
                    required
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
                  Inspector name
                  <input
                    className={fieldClassName}
                    value={hygieneForm.inspector_name}
                    onChange={(event) =>
                      setHygieneForm((current) => ({
                        ...current,
                        inspector_name: event.target.value,
                      }))
                    }
                    required
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
                  Corrective action
                  <textarea
                    className={textAreaClassName}
                    value={hygieneForm.corrective_action}
                    onChange={(event) =>
                      setHygieneForm((current) => ({
                        ...current,
                        corrective_action: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
                  Notes
                  <textarea
                    className={textAreaClassName}
                    value={hygieneForm.notes}
                    onChange={(event) =>
                      setHygieneForm((current) => ({
                        ...current,
                        notes: event.target.value,
                      }))
                    }
                  />
                </label>
              </div>
            </FormPanel>
            <FieldMessage message={hygieneError} />
            <div className="flex flex-wrap items-center justify-between gap-3">
              {selectedHygieneId ? (
                <button
                  type="button"
                  className={dangerButtonClassName}
                  disabled={hygienePending}
                  onClick={() =>
                    void runDelete(
                      () => deleteHygieneCheck(selectedHygieneId),
                      resetHygieneForm,
                      setHygieneError,
                      setHygienePending,
                      "Unable to delete hygiene check.",
                    )
                  }
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              ) : (
                <span />
              )}
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  className={secondaryButtonClassName}
                  disabled={hygienePending}
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={primaryButtonClassName}
                  disabled={hygienePending}
                >
                  {hygienePending ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : null}
                  {selectedHygieneId ? "Save changes" : "Create hygiene check"}
                </button>
              </div>
            </div>
          </form>
        </ModalShell>
      ) : null}

      {activeModal === "water" ? (
        <ModalShell
          title={
            selectedWaterId
              ? "Edit water quality test"
              : "Add water quality test"
          }
          description="Capture lab values, location, and the accepted limit."
          onClose={closeModal}
        >
          <form className="space-y-6" onSubmit={handleWaterSubmit}>
            <FormPanel
              title="Water test details"
              description="Use the water quality test endpoint fields here."
            >
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>Test date</span>
                  <input
                    type="date"
                    className={fieldClassName}
                    value={waterForm.test_date}
                    onChange={(event) =>
                      setWaterForm((current) => ({
                        ...current,
                        test_date: event.target.value,
                      }))
                    }
                    required
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>Status</span>
                  <PickerField
                    value={waterForm.status}
                    options={checkStatuses.map((status) => ({
                      label: status,
                      value: status,
                    }))}
                    onChange={(value) =>
                      setWaterForm((current) => ({
                        ...current,
                        status: value as CheckStatus,
                      }))
                    }
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>Location</span>
                  <input
                    className={fieldClassName}
                    value={waterForm.location}
                    onChange={(event) =>
                      setWaterForm((current) => ({
                        ...current,
                        location: event.target.value,
                      }))
                    }
                    required
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>Parameter</span>
                  <input
                    className={fieldClassName}
                    value={waterForm.parameter_name}
                    onChange={(event) =>
                      setWaterForm((current) => ({
                        ...current,
                        parameter_name: event.target.value,
                      }))
                    }
                    required
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>Result value</span>
                  <input
                    className={fieldClassName}
                    value={waterForm.result_value}
                    onChange={(event) =>
                      setWaterForm((current) => ({
                        ...current,
                        result_value: event.target.value,
                      }))
                    }
                    required
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>Unit</span>
                  <input
                    className={fieldClassName}
                    value={waterForm.unit_name}
                    onChange={(event) =>
                      setWaterForm((current) => ({
                        ...current,
                        unit_name: event.target.value,
                      }))
                    }
                    required
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
                  <span>Standard limit</span>
                  <input
                    className={fieldClassName}
                    value={waterForm.standard_limit}
                    onChange={(event) =>
                      setWaterForm((current) => ({
                        ...current,
                        standard_limit: event.target.value,
                      }))
                    }
                    required
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
                  <span>Tested by</span>
                  <input
                    className={fieldClassName}
                    value={waterForm.tested_by}
                    onChange={(event) =>
                      setWaterForm((current) => ({
                        ...current,
                        tested_by: event.target.value,
                      }))
                    }
                    required
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
                  <span>Notes</span>
                  <textarea
                    className={textAreaClassName}
                    value={waterForm.notes}
                    onChange={(event) =>
                      setWaterForm((current) => ({
                        ...current,
                        notes: event.target.value,
                      }))
                    }
                  />
                </label>
              </div>
            </FormPanel>
            <FieldMessage message={waterError} />
            <div className="flex flex-wrap items-center justify-between gap-3">
              {selectedWaterId ? (
                <button
                  type="button"
                  className={dangerButtonClassName}
                  disabled={waterPending}
                  onClick={() =>
                    void runDelete(
                      () => deleteWaterQualityTest(selectedWaterId),
                      resetWaterForm,
                      setWaterError,
                      setWaterPending,
                      "Unable to delete water quality test.",
                    )
                  }
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              ) : (
                <span />
              )}
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  className={secondaryButtonClassName}
                  disabled={waterPending}
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={primaryButtonClassName}
                  disabled={waterPending}
                >
                  {waterPending ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : null}
                  {selectedWaterId ? "Save changes" : "Create water test"}
                </button>
              </div>
            </div>
          </form>
        </ModalShell>
      ) : null}
      {activeModal === "safety" ? (
        <ModalShell
          title={selectedSafetyId ? "Edit safety record" : "Add safety record"}
          description="Capture incidents, severity, response, and closure status."
          onClose={closeModal}
        >
          <form className="space-y-6" onSubmit={handleSafetySubmit}>
            <FormPanel
              title="Incident details"
              description="Use the safety records endpoint fields here."
            >
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>Record date</span>
                  <input
                    type="date"
                    className={fieldClassName}
                    value={safetyForm.record_date}
                    onChange={(event) =>
                      setSafetyForm((current) => ({
                        ...current,
                        record_date: event.target.value,
                      }))
                    }
                    required
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>Severity</span>
                  <PickerField
                    value={safetyForm.severity}
                    options={safetySeverities.map((severity) => ({
                      label: severity,
                      value: severity,
                    }))}
                    onChange={(value) =>
                      setSafetyForm((current) => ({
                        ...current,
                        severity: value as SafetySeverity,
                      }))
                    }
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>Status</span>
                  <PickerField
                    value={safetyForm.status}
                    options={safetyStatuses.map((status) => ({
                      label: status,
                      value: status,
                    }))}
                    onChange={(value) =>
                      setSafetyForm((current) => ({
                        ...current,
                        status: value as SafetyStatus,
                      }))
                    }
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>Reported by</span>
                  <input
                    className={fieldClassName}
                    value={safetyForm.reported_by}
                    onChange={(event) =>
                      setSafetyForm((current) => ({
                        ...current,
                        reported_by: event.target.value,
                      }))
                    }
                    required
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
                  <span>Incident type</span>
                  <input
                    className={fieldClassName}
                    value={safetyForm.incident_type}
                    onChange={(event) =>
                      setSafetyForm((current) => ({
                        ...current,
                        incident_type: event.target.value,
                      }))
                    }
                    required
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
                  <span>Description</span>
                  <textarea
                    className={textAreaClassName}
                    value={safetyForm.description}
                    onChange={(event) =>
                      setSafetyForm((current) => ({
                        ...current,
                        description: event.target.value,
                      }))
                    }
                    required
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
                  <span>Action taken</span>
                  <textarea
                    className={textAreaClassName}
                    value={safetyForm.action_taken}
                    onChange={(event) =>
                      setSafetyForm((current) => ({
                        ...current,
                        action_taken: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
                  <span>Notes</span>
                  <textarea
                    className={textAreaClassName}
                    value={safetyForm.notes}
                    onChange={(event) =>
                      setSafetyForm((current) => ({
                        ...current,
                        notes: event.target.value,
                      }))
                    }
                  />
                </label>
              </div>
            </FormPanel>
            <FieldMessage message={safetyError} />
            <div className="flex flex-wrap items-center justify-between gap-3">
              {selectedSafetyId ? (
                <button
                  type="button"
                  className={dangerButtonClassName}
                  disabled={safetyPending}
                  onClick={() =>
                    void runDelete(
                      () => deleteSafetyRecord(selectedSafetyId),
                      resetSafetyForm,
                      setSafetyError,
                      setSafetyPending,
                      "Unable to delete safety record.",
                    )
                  }
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              ) : (
                <span />
              )}
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  className={secondaryButtonClassName}
                  disabled={safetyPending}
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={primaryButtonClassName}
                  disabled={safetyPending}
                >
                  {safetyPending ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : null}
                  {selectedSafetyId ? "Save changes" : "Create safety record"}
                </button>
              </div>
            </div>
          </form>
        </ModalShell>
      ) : null}

      {activeModal === "training" ? (
        <ModalShell
          title={
            selectedTrainingId ? "Edit training record" : "Add training record"
          }
          description="Link a compliance training record to an employee."
          onClose={closeModal}
        >
          <form className="space-y-6" onSubmit={handleTrainingSubmit}>
            <FormPanel
              title="Training details"
              description="Use the training records endpoint fields here."
            >
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
                  <span>Employee</span>
                  <PickerField
                    value={
                      trainingForm.employee ? String(trainingForm.employee) : ""
                    }
                    options={[
                      { label: "Select employee", value: "" },
                      ...buildEmployeePickerOptions(trainingForm.employee),
                    ]}
                    searchable
                    searchPlaceholder="Search employees"
                    onChange={(value) =>
                      setTrainingForm((current) => ({
                        ...current,
                        employee: Number(value),
                      }))
                    }
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
                  <span>Training title</span>
                  <input
                    className={fieldClassName}
                    value={trainingForm.training_title}
                    onChange={(event) =>
                      setTrainingForm((current) => ({
                        ...current,
                        training_title: event.target.value,
                      }))
                    }
                    required
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>Training date</span>
                  <input
                    type="date"
                    className={fieldClassName}
                    value={trainingForm.training_date}
                    onChange={(event) =>
                      setTrainingForm((current) => ({
                        ...current,
                        training_date: event.target.value,
                      }))
                    }
                    required
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>Trainer name</span>
                  <input
                    className={fieldClassName}
                    value={trainingForm.trainer_name}
                    onChange={(event) =>
                      setTrainingForm((current) => ({
                        ...current,
                        trainer_name: event.target.value,
                      }))
                    }
                    required
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>Certificate number</span>
                  <input
                    className={fieldClassName}
                    value={trainingForm.certificate_number}
                    onChange={(event) =>
                      setTrainingForm((current) => ({
                        ...current,
                        certificate_number: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
                  <span>Notes</span>
                  <textarea
                    className={textAreaClassName}
                    value={trainingForm.notes}
                    onChange={(event) =>
                      setTrainingForm((current) => ({
                        ...current,
                        notes: event.target.value,
                      }))
                    }
                  />
                </label>
              </div>
            </FormPanel>
            <FieldMessage message={trainingError} />
            <div className="flex flex-wrap items-center justify-between gap-3">
              {selectedTrainingId ? (
                <button
                  type="button"
                  className={dangerButtonClassName}
                  disabled={trainingPending}
                  onClick={() =>
                    void runDelete(
                      () => deleteTrainingRecord(selectedTrainingId),
                      resetTrainingForm,
                      setTrainingError,
                      setTrainingPending,
                      "Unable to delete training record.",
                    )
                  }
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              ) : (
                <span />
              )}
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  className={secondaryButtonClassName}
                  disabled={trainingPending}
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={primaryButtonClassName}
                  disabled={trainingPending}
                >
                  {trainingPending ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : null}
                  {selectedTrainingId
                    ? "Save changes"
                    : "Create training record"}
                </button>
              </div>
            </div>
          </form>
        </ModalShell>
      ) : null}

      {activeModal === "document" ? (
        <ModalShell
          title={
            selectedDocumentId
              ? "Edit compliance document"
              : "Add compliance document"
          }
          description="Upload or update licenses, certificates, and other official files."
          onClose={closeModal}
        >
          <form className="space-y-6" onSubmit={handleDocumentSubmit}>
            <FormPanel
              title="Document details"
              description="This form uses multipart upload for compliance documents."
            >
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
                  <span>Title</span>
                  <input
                    className={fieldClassName}
                    value={documentForm.title}
                    onChange={(event) =>
                      setDocumentForm((current) => ({
                        ...current,
                        title: event.target.value,
                      }))
                    }
                    required
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>Document type</span>
                  <input
                    className={fieldClassName}
                    value={documentForm.document_type}
                    onChange={(event) =>
                      setDocumentForm((current) => ({
                        ...current,
                        document_type: event.target.value,
                      }))
                    }
                    required
                  />
                </label>
                <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900 md:col-span-2">
                  Supported document types: {supportedDocumentTypes.join(", ")}.
                  Maximum file size: {maxDocumentFileSizeLabel}.
                </div>
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>Status</span>
                  <PickerField
                    value={documentForm.status}
                    options={documentStatuses.map((status) => ({
                      label: status,
                      value: status,
                    }))}
                    onChange={(value) =>
                      setDocumentForm((current) => ({
                        ...current,
                        status: value as DocumentStatus,
                      }))
                    }
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>Issue date</span>
                  <input
                    type="date"
                    className={fieldClassName}
                    value={documentForm.issue_date}
                    onChange={(event) =>
                      setDocumentForm((current) => ({
                        ...current,
                        issue_date: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
                  <span>File</span>
                  <input
                    type="file"
                    className={fieldClassName}
                    onChange={(event) =>
                      setDocumentForm((current) => ({
                        ...current,
                        file: event.target.files?.[0] ?? null,
                        remove_file: false,
                      }))
                    }
                  />
                </label>
                {selectedDocumentId ? (
                  <label className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 md:col-span-2">
                    <input
                      type="checkbox"
                      checked={documentForm.remove_file}
                      onChange={(event) =>
                        setDocumentForm((current) => ({
                          ...current,
                          remove_file: event.target.checked,
                          file: event.target.checked ? null : current.file,
                        }))
                      }
                    />
                    Remove existing file from this document
                  </label>
                ) : null}
                <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
                  <span>Notes</span>
                  <textarea
                    className={textAreaClassName}
                    value={documentForm.notes}
                    onChange={(event) =>
                      setDocumentForm((current) => ({
                        ...current,
                        notes: event.target.value,
                      }))
                    }
                  />
                </label>
              </div>
            </FormPanel>
            <FieldMessage message={documentError} />
            <div className="flex flex-wrap items-center justify-between gap-3">
              {selectedDocumentId ? (
                <button
                  type="button"
                  className={dangerButtonClassName}
                  disabled={documentPending}
                  onClick={() =>
                    void runDelete(
                      () => deleteComplianceDocument(selectedDocumentId),
                      resetDocumentForm,
                      setDocumentError,
                      setDocumentPending,
                      "Unable to delete compliance document.",
                    )
                  }
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              ) : (
                <span />
              )}
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  className={secondaryButtonClassName}
                  disabled={documentPending}
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={primaryButtonClassName}
                  disabled={documentPending}
                >
                  {documentPending ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : null}
                  {selectedDocumentId ? "Save changes" : "Create document"}
                </button>
              </div>
            </div>
          </form>
        </ModalShell>
      ) : null}
    </div>
  );
}
