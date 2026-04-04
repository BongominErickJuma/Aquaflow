import {
  Check,
  ChevronDown,
  LoaderCircle,
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
import { ApiError } from "../lib/api/auth";
import {
  createCapitalRecord,
  createExpense,
  createInsuranceRecord,
  createInvoice,
  createOperatingCost,
  createProfitabilitySnapshot,
  createReceipt,
  deleteCapitalRecord,
  deleteExpense,
  deleteInsuranceRecord,
  deleteInvoice,
  deleteOperatingCost,
  deleteProfitabilitySnapshot,
  deleteReceipt,
  fetchCapitalRecord,
  fetchCapitalRecords,
  fetchExpense,
  fetchExpenses,
  fetchInsuranceRecord,
  fetchInsuranceRecords,
  fetchInvoice,
  fetchInvoices,
  fetchOperatingCost,
  fetchOperatingCosts,
  fetchProfitabilitySnapshot,
  fetchProfitabilitySnapshots,
  fetchReceipt,
  fetchReceipts,
  updateCapitalRecord,
  updateExpense,
  updateInsuranceRecord,
  updateInvoice,
  updateOperatingCost,
  updateProfitabilitySnapshot,
  updateReceipt,
} from "../lib/api/finance";
import { fetchSalesOrders } from "../lib/api/sales";
import type {
  CapitalPayload,
  CapitalRecord,
  ExpensePayload,
  ExpenseRecord,
  InsurancePayload,
  InsuranceRecord,
  InsuranceStatus,
  InvoicePayload,
  InvoiceRecord,
  InvoiceStatus,
  OperatingCostPayload,
  OperatingCostRecord,
  ProfitabilitySnapshotPayload,
  ProfitabilitySnapshotRecord,
  ReceiptPayload,
  ReceiptRecord,
} from "../types/finance";
import type { SalesOrderRecord } from "../types/sales";

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
  "group relative flex h-[242px] min-w-[280px] max-w-[280px] flex-shrink-0 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4";
const recordEditButtonClassName = `${iconButtonClassName} absolute right-4 top-4 opacity-0 pointer-events-none group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100`;

type ActiveModal =
  | "capital"
  | "operating"
  | "expense"
  | "invoice"
  | "receipt"
  | "insurance"
  | "snapshot"
  | null;

const invoiceStatuses: InvoiceStatus[] = [
  "draft",
  "sent",
  "paid",
  "overdue",
  "cancelled",
];
const insuranceStatuses: InsuranceStatus[] = ["active", "expired", "cancelled"];
const financeMilestoneFlow = [
  {
    id: "capital",
    label: "Capital Records",
    footerLabel: "Capital",
    detail:
      "Create and review capital records here. Before this, there is nothing to prepare. Next, add operating costs.",
  },
  {
    id: "operating",
    label: "Operating Costs",
    footerLabel: "Operating",
    detail:
      "Capture operating costs here. Before this, capital records should already be in place. Next, add expenses.",
  },
  {
    id: "expenses",
    label: "Expenses",
    footerLabel: "Expenses",
    detail:
      "Record one-off expenses here. Before this, operating costs should already be ready. Next, create invoices.",
  },
  {
    id: "invoices",
    label: "Invoices",
    footerLabel: "Invoices",
    detail:
      "Create sales-linked invoices here. Before this, expenses should already be captured. Next, record receipts.",
  },
  {
    id: "receipts",
    label: "Receipts",
    footerLabel: "Receipts",
    detail:
      "Record receipts against invoices here. Before this, invoices should already exist. Next, add insurance records.",
  },
  {
    id: "insurance",
    label: "Insurance Records",
    footerLabel: "Insurance",
    detail:
      "Track insurance coverage here. Before this, receipts should already be in place. Next, create profitability snapshots.",
  },
  {
    id: "snapshots",
    label: "Profitability Snapshots",
    footerLabel: "Snapshots",
    detail:
      "Capture profitability snapshots here. Before this, insurance records should be ready. This is the last finance step.",
  },
] as const;

function createEmptyCapitalForm(): CapitalPayload {
  return {
    record_date: "",
    source_name: "",
    amount: "",
    description: "",
    notes: "",
  };
}
function createEmptyOperatingForm(): OperatingCostPayload {
  return {
    cost_date: "",
    category: "",
    amount: "",
    description: "",
    notes: "",
  };
}
function createEmptyExpenseForm(): ExpensePayload {
  return {
    expense_date: "",
    expense_type: "",
    amount: "",
    vendor_name: "",
    reference_number: "",
    notes: "",
  };
}
function createEmptyInvoiceForm(): InvoicePayload {
  return {
    order: 0,
    invoice_number: "",
    invoice_date: "",
    due_date: "",
    status: "draft",
    notes: "",
  };
}
function createEmptyReceiptForm(): ReceiptPayload {
  return {
    invoice: 0,
    receipt_number: "",
    receipt_date: "",
    amount_received: "",
    payment_method: "",
    reference_number: "",
    notes: "",
  };
}
function createEmptyInsuranceForm(): InsurancePayload {
  return {
    policy_name: "",
    provider_name: "",
    policy_number: "",
    coverage_type: "",
    start_date: "",
    end_date: "",
    premium_amount: "",
    status: "active",
    notes: "",
  };
}
function createEmptySnapshotForm(): ProfitabilitySnapshotPayload {
  return { snapshot_date: "", revenue: "", total_costs: "", notes: "" };
}

function FieldMessage({ message }: { message: string | null }) {
  if (!message) return null;
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
}: {
  value: string;
  options: Array<{ label: string; value: string }>;
  onChange: (value: string) => void;
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
        <div className="absolute left-0 top-full z-20 mt-2 w-full rounded-3xl border border-slate-200 bg-white p-2 shadow-[0_24px_60px_rgba(15,23,42,0.14)]">
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

function formatDate(value: string | null) {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat("en-UG", { dateStyle: "medium" }).format(
    new Date(value),
  );
}

function parseAmount(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseIsoDate(value: string) {
  return new Date(`${value}T00:00:00Z`);
}

function getInclusiveDayCount(startDate: string, endDate: string) {
  const start = parseIsoDate(startDate);
  const end = parseIsoDate(endDate);
  const difference = Math.round(
    (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
  );
  return Math.max(1, difference + 1);
}

function getEarnedInsuranceCost(
  records: InsuranceRecord[],
  asOfDate: string,
) {
  const asOf = parseIsoDate(asOfDate);

  return records.reduce((sum, record) => {
    if (record.status === "cancelled") {
      return sum;
    }

    const start = parseIsoDate(record.start_date);
    const end = parseIsoDate(record.end_date);
    if (asOf < start) {
      return sum;
    }

    const recognizedEnd = asOf < end ? asOf : end;
    const coverageDays = getInclusiveDayCount(record.start_date, record.end_date);
    const earnedDays = Math.max(
      1,
      Math.round((recognizedEnd.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) +
        1,
    );

    return (
      sum +
      (parseAmount(record.premium_amount) * earnedDays) / coverageDays
    );
  }, 0);
}

function formatAmount(value: string | number | null | undefined) {
  const numericValue =
    typeof value === "number" ? value : Number.parseFloat(value ?? "0");
  if (!Number.isFinite(numericValue)) {
    return "0";
  }

  const absoluteValue = Math.abs(numericValue);
  const formatScaled = (scaledValue: number, suffix: string) => {
    const decimals = Math.abs(scaledValue) >= 10 ? 0 : 1;
    return `${scaledValue.toFixed(decimals).replace(/\.0$/, "")}${suffix}`;
  };

  if (absoluteValue >= 1_000_000_000) {
    return formatScaled(numericValue / 1_000_000_000, "b");
  }
  if (absoluteValue >= 1_000_000) {
    return formatScaled(numericValue / 1_000_000, "m");
  }
  if (absoluteValue >= 1_000) {
    return formatScaled(numericValue / 1_000, "k");
  }

  return new Intl.NumberFormat("en-UG", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(numericValue);
}

function formatPercent(value: number) {
  return `${new Intl.NumberFormat("en-UG", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(value)}%`;
}

function getTodayIsoDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function FinancePage() {
  const { user } = useAuth();
  const isAdmin =
    user?.role.code === "admin" || user?.role.code === "superuser";

  const [capitalRecords, setCapitalRecords] = useState<CapitalRecord[]>([]);
  const [operatingCosts, setOperatingCosts] = useState<OperatingCostRecord[]>(
    [],
  );
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [receipts, setReceipts] = useState<ReceiptRecord[]>([]);
  const [insuranceRecords, setInsuranceRecords] = useState<InsuranceRecord[]>(
    [],
  );
  const [snapshots, setSnapshots] = useState<ProfitabilitySnapshotRecord[]>([]);
  const [orders, setOrders] = useState<SalesOrderRecord[]>([]);

  const [selectedCapitalId, setSelectedCapitalId] = useState<number | null>(
    null,
  );
  const [selectedOperatingId, setSelectedOperatingId] = useState<number | null>(
    null,
  );
  const [selectedExpenseId, setSelectedExpenseId] = useState<number | null>(
    null,
  );
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(
    null,
  );
  const [selectedReceiptId, setSelectedReceiptId] = useState<number | null>(
    null,
  );
  const [selectedInsuranceId, setSelectedInsuranceId] = useState<number | null>(
    null,
  );
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<number | null>(
    null,
  );

  const [capitalForm, setCapitalForm] = useState<CapitalPayload>(
    createEmptyCapitalForm,
  );
  const [operatingForm, setOperatingForm] = useState<OperatingCostPayload>(
    createEmptyOperatingForm,
  );
  const [expenseForm, setExpenseForm] = useState<ExpensePayload>(
    createEmptyExpenseForm,
  );
  const [invoiceForm, setInvoiceForm] = useState<InvoicePayload>(
    createEmptyInvoiceForm,
  );
  const [receiptForm, setReceiptForm] = useState<ReceiptPayload>(
    createEmptyReceiptForm,
  );
  const [insuranceForm, setInsuranceForm] = useState<InsurancePayload>(
    createEmptyInsuranceForm,
  );
  const [snapshotForm, setSnapshotForm] =
    useState<ProfitabilitySnapshotPayload>(createEmptySnapshotForm);

  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  const [capitalError, setCapitalError] = useState<string | null>(null);
  const [operatingError, setOperatingError] = useState<string | null>(null);
  const [expenseError, setExpenseError] = useState<string | null>(null);
  const [invoiceError, setInvoiceError] = useState<string | null>(null);
  const [receiptError, setReceiptError] = useState<string | null>(null);
  const [insuranceError, setInsuranceError] = useState<string | null>(null);
  const [snapshotError, setSnapshotError] = useState<string | null>(null);

  const [capitalPending, setCapitalPending] = useState(false);
  const [operatingPending, setOperatingPending] = useState(false);
  const [expensePending, setExpensePending] = useState(false);
  const [invoicePending, setInvoicePending] = useState(false);
  const [receiptPending, setReceiptPending] = useState(false);
  const [insurancePending, setInsurancePending] = useState(false);
  const [snapshotPending, setSnapshotPending] = useState(false);
  const [activeTab, setActiveTab] = useState("capital");

  const tabs = financeMilestoneFlow.map(({ id, label }) => ({ id, label }));
  const activeFinanceStep =
    financeMilestoneFlow.find((item) => item.id === activeTab) ??
    financeMilestoneFlow[0];
  const todayIsoDate = getTodayIsoDate();
  const receivableInvoices = invoices.filter(
    (invoice) =>
      invoice.status === "sent" && invoice.due_date >= todayIsoDate,
  );
  const buildAssignableInvoiceOptions = (selectedInvoiceId?: number | null) =>
    invoices.filter(
      (invoice) =>
        (invoice.status === "sent" && invoice.due_date >= todayIsoDate) ||
        invoice.id === selectedInvoiceId,
    );
  const buildAssignableOrderOptions = (selectedOrderId?: number | null) =>
    orders.filter(
      (order) => order.status !== "cancelled" || order.id === selectedOrderId,
    );
  const liveCollectedRevenue = receipts.reduce(
    (sum, record) => sum + parseAmount(record.amount_received),
    0,
  );
  const liveRecognizedRevenue = invoices
    .filter(
      (invoice) => invoice.status !== "draft" && invoice.status !== "cancelled",
    )
    .reduce((sum, record) => sum + parseAmount(record.amount), 0);
  const liveInsuranceCost = getEarnedInsuranceCost(insuranceRecords, todayIsoDate);
  const liveTotalCosts =
    operatingCosts.reduce((sum, record) => sum + parseAmount(record.amount), 0) +
    expenses.reduce((sum, record) => sum + parseAmount(record.amount), 0) +
    liveInsuranceCost;
  const liveProfitEstimate = liveRecognizedRevenue - liveTotalCosts;
  const liveCollectionRate =
    liveRecognizedRevenue > 0
      ? (liveCollectedRevenue / liveRecognizedRevenue) * 100
      : 0;
  const createLiveSnapshotForm = (): ProfitabilitySnapshotPayload => ({
    snapshot_date: "",
    revenue: liveRecognizedRevenue.toFixed(2),
    total_costs: liveTotalCosts.toFixed(2),
    notes: "",
  });

  async function reloadFinanceData() {
    const [
      capital,
      operating,
      expenseList,
      invoiceList,
      receiptList,
      insuranceList,
      snapshotList,
      orderList,
    ] = await Promise.all([
      fetchCapitalRecords(),
      fetchOperatingCosts(),
      fetchExpenses(),
      fetchInvoices(),
      fetchReceipts(),
      fetchInsuranceRecords(),
      fetchProfitabilitySnapshots(),
      fetchSalesOrders(),
    ]);

    setCapitalRecords(capital);
    setOperatingCosts(operating);
    setExpenses(expenseList);
    setInvoices(invoiceList);
    setReceipts(receiptList);
    setInsuranceRecords(insuranceList);
    setSnapshots(snapshotList);
    setOrders(orderList);
  }

  useEffect(() => {
    let isMounted = true;
    async function loadPage() {
      try {
        setLoading(true);
        setPageError(null);
        await reloadFinanceData();
      } catch (error) {
        if (!isMounted) return;
        setPageError(
          error instanceof ApiError
            ? error.message
            : "Unable to load finance records right now.",
        );
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    void loadPage();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedCapitalId) {
      setCapitalForm(createEmptyCapitalForm());
      return;
    }
    void fetchCapitalRecord(selectedCapitalId)
      .then((record) =>
        setCapitalForm({
          record_date: record.record_date,
          source_name: record.source_name,
          amount: record.amount,
          description: record.description,
          notes: record.notes,
        }),
      )
      .catch((error) =>
        setCapitalError(
          error instanceof ApiError
            ? error.message
            : "Unable to load capital record.",
        ),
      );
  }, [selectedCapitalId]);

  useEffect(() => {
    if (!selectedOperatingId) {
      setOperatingForm(createEmptyOperatingForm());
      return;
    }
    void fetchOperatingCost(selectedOperatingId)
      .then((record) =>
        setOperatingForm({
          cost_date: record.cost_date,
          category: record.category,
          amount: record.amount,
          description: record.description,
          notes: record.notes,
        }),
      )
      .catch((error) =>
        setOperatingError(
          error instanceof ApiError
            ? error.message
            : "Unable to load operating cost.",
        ),
      );
  }, [selectedOperatingId]);

  useEffect(() => {
    if (!selectedExpenseId) {
      setExpenseForm(createEmptyExpenseForm());
      return;
    }
    void fetchExpense(selectedExpenseId)
      .then((record) =>
        setExpenseForm({
          expense_date: record.expense_date,
          expense_type: record.expense_type,
          amount: record.amount,
          vendor_name: record.vendor_name,
          reference_number: record.reference_number,
          notes: record.notes,
        }),
      )
      .catch((error) =>
        setExpenseError(
          error instanceof ApiError ? error.message : "Unable to load expense.",
        ),
      );
  }, [selectedExpenseId]);

  useEffect(() => {
    if (!selectedInvoiceId) {
      setInvoiceForm(createEmptyInvoiceForm());
      return;
    }
    void fetchInvoice(selectedInvoiceId)
      .then((record) =>
        setInvoiceForm({
          order: record.order,
          invoice_number: record.invoice_number,
          invoice_date: record.invoice_date,
          due_date: record.due_date,
          status: record.status,
          notes: record.notes,
        }),
      )
      .catch((error) =>
        setInvoiceError(
          error instanceof ApiError ? error.message : "Unable to load invoice.",
        ),
      );
  }, [selectedInvoiceId]);

  useEffect(() => {
    if (!selectedReceiptId) {
      setReceiptForm(createEmptyReceiptForm());
      return;
    }
    void fetchReceipt(selectedReceiptId)
      .then((record) =>
        setReceiptForm({
          invoice: record.invoice,
          receipt_number: record.receipt_number,
          receipt_date: record.receipt_date,
          amount_received: record.amount_received,
          payment_method: record.payment_method,
          reference_number: record.reference_number,
          notes: record.notes,
        }),
      )
      .catch((error) =>
        setReceiptError(
          error instanceof ApiError ? error.message : "Unable to load receipt.",
        ),
      );
  }, [selectedReceiptId]);

  useEffect(() => {
    if (!selectedInsuranceId) {
      setInsuranceForm(createEmptyInsuranceForm());
      return;
    }
    void fetchInsuranceRecord(selectedInsuranceId)
      .then((record) =>
        setInsuranceForm({
          policy_name: record.policy_name,
          provider_name: record.provider_name,
          policy_number: record.policy_number,
          coverage_type: record.coverage_type,
          start_date: record.start_date,
          end_date: record.end_date,
          premium_amount: record.premium_amount,
          status: record.status,
          notes: record.notes,
        }),
      )
      .catch((error) =>
        setInsuranceError(
          error instanceof ApiError
            ? error.message
            : "Unable to load insurance record.",
        ),
      );
  }, [selectedInsuranceId]);

  useEffect(() => {
    if (!selectedSnapshotId) {
      setSnapshotForm(createLiveSnapshotForm());
      return;
    }
    void fetchProfitabilitySnapshot(selectedSnapshotId)
      .then((record) =>
        setSnapshotForm({
          snapshot_date: record.snapshot_date,
          revenue: record.revenue,
          total_costs: record.total_costs,
          notes: record.notes,
        }),
      )
      .catch((error) =>
        setSnapshotError(
          error instanceof ApiError
            ? error.message
            : "Unable to load snapshot.",
        ),
      );
  }, [selectedSnapshotId]);

  function closeModal() {
    setActiveModal(null);
    setCapitalError(null);
    setOperatingError(null);
    setExpenseError(null);
    setInvoiceError(null);
    setReceiptError(null);
    setInsuranceError(null);
    setSnapshotError(null);
  }

  function resetCapitalForm() {
    setSelectedCapitalId(null);
    setCapitalForm(createEmptyCapitalForm());
    setCapitalError(null);
  }
  function resetOperatingForm() {
    setSelectedOperatingId(null);
    setOperatingForm(createEmptyOperatingForm());
    setOperatingError(null);
  }
  function resetExpenseForm() {
    setSelectedExpenseId(null);
    setExpenseForm(createEmptyExpenseForm());
    setExpenseError(null);
  }
  function resetInvoiceForm() {
    setSelectedInvoiceId(null);
    setInvoiceForm(createEmptyInvoiceForm());
    setInvoiceError(null);
  }
  function resetReceiptForm() {
    setSelectedReceiptId(null);
    setReceiptForm(createEmptyReceiptForm());
    setReceiptError(null);
  }
  function resetInsuranceForm() {
    setSelectedInsuranceId(null);
    setInsuranceForm(createEmptyInsuranceForm());
    setInsuranceError(null);
  }
  function resetSnapshotForm() {
    setSelectedSnapshotId(null);
    setSnapshotForm(createLiveSnapshotForm());
    setSnapshotError(null);
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
      await reloadFinanceData();
      resetter();
      closeModal();
    } catch (error) {
      setError(error instanceof ApiError ? error.message : fallbackMessage);
    } finally {
      setPending(false);
    }
  }

  async function handleSubmit<TPayload>(
    event: FormEvent<HTMLFormElement>,
    config: {
      selectedId: number | null;
      pending: (value: boolean) => void;
      setError: (value: string | null) => void;
      createAction: (payload: TPayload) => Promise<unknown>;
      updateAction: (id: number, payload: TPayload) => Promise<unknown>;
      payload: TPayload;
      reset: () => void;
      fallbackMessage: string;
    },
  ) {
    event.preventDefault();
    config.pending(true);
    config.setError(null);
    try {
      if (config.selectedId) {
        await config.updateAction(config.selectedId, config.payload);
      } else {
        await config.createAction(config.payload);
      }
      await reloadFinanceData();
      config.reset();
      closeModal();
    } catch (error) {
      config.setError(
        error instanceof ApiError ? error.message : config.fallbackMessage,
      );
    } finally {
      config.pending(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-600 shadow-sm">
          <LoaderCircle className="h-4 w-4 animate-spin" />
          Loading finance records...
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
              Finance
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
                Finance records
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-slate-600">
                Track capital, costs, invoices, receipts, insurance, and
                profitability snapshots in one operational workspace.
              </p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="hero-metric-card">
              <p className="hero-metric-label">Invoices</p>
              <p className="hero-metric-value">{invoices.length}</p>
            </div>
            <div className="hero-metric-card">
              <p className="hero-metric-label">Collectible</p>
              <p className="hero-metric-value">{receivableInvoices.length}</p>
            </div>
            <div className="hero-metric-card">
              <p className="hero-metric-label">Recognized Sales</p>
              <p className="hero-metric-value">
                {formatAmount(liveRecognizedRevenue)}
              </p>
            </div>
            <div className="hero-metric-card">
              <p className="hero-metric-label">Profit Estimate</p>
              <p className="hero-metric-value">
                {formatAmount(liveProfitEstimate)}
              </p>
            </div>
          </div>
        </div>
      </section>
      <ModuleTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      <div className="module-page-stage !justify-start overflow-hidden">
        <div className="flex min-h-0 flex-1 flex-col gap-6">
          <div className="min-h-0 flex-1">
        {activeTab === "capital" ? (
          <SectionCard
            title="Capital records"
            description="Owner injections, funding, and expansion capital."
            action={
              isAdmin ? (
                <button
                  type="button"
                  className={iconButtonClassName}
                  onClick={() => {
                    resetCapitalForm();
                    setActiveModal("capital");
                  }}
                  aria-label="Add capital record"
                >
                  <Plus className="h-4 w-4" />
                </button>
              ) : null
            }
          >
            {capitalRecords.length ? (
              capitalRecords.map((record) => (
                <article key={record.id} className={recordCardClassName}>
                  {isAdmin ? (
                    <button
                      type="button"
                      className={recordEditButtonClassName}
                      onClick={() => {
                        setSelectedCapitalId(record.id);
                        setActiveModal("capital");
                      }}
                      aria-label={`Edit capital ${record.source_name}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  ) : null}
                  <div className="flex flex-1 flex-col gap-4">
                    <div className="space-y-1 pr-10">
                      <h3 className="line-clamp-2 text-sm font-semibold text-slate-900">
                        {record.source_name}
                      </h3>
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                        {formatAmount(record.amount)}
                      </p>
                    </div>
                    <div className="flex-1 space-y-3">
                      <DetailItem
                        label="Date"
                        value={formatDate(record.record_date)}
                      />
                      <DetailItem
                        label="Description"
                        value={record.description || "No description"}
                      />
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <EmptyState message="No capital records created yet." />
            )}
          </SectionCard>
        ) : null}

        {activeTab === "operating" ? (
          <SectionCard
            title="Operating costs"
            description="Recurring operating cost entries like electricity and utilities."
            action={
              isAdmin ? (
                <button
                  type="button"
                  className={iconButtonClassName}
                  onClick={() => {
                    resetOperatingForm();
                    setActiveModal("operating");
                  }}
                  aria-label="Add operating cost"
                >
                  <Plus className="h-4 w-4" />
                </button>
              ) : null
            }
          >
            {operatingCosts.length ? (
              operatingCosts.map((record) => (
                <article key={record.id} className={recordCardClassName}>
                  {isAdmin ? (
                    <button
                      type="button"
                      className={recordEditButtonClassName}
                      onClick={() => {
                        setSelectedOperatingId(record.id);
                        setActiveModal("operating");
                      }}
                      aria-label={`Edit operating cost ${record.category}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  ) : null}
                  <div className="flex flex-1 flex-col gap-4">
                    <div className="space-y-1 pr-10">
                      <h3 className="line-clamp-2 text-sm font-semibold text-slate-900">
                        {record.category}
                      </h3>
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                        {formatAmount(record.amount)}
                      </p>
                    </div>
                    <div className="flex-1 space-y-3">
                      <DetailItem
                        label="Date"
                        value={formatDate(record.cost_date)}
                      />
                      <DetailItem
                        label="Description"
                        value={record.description || "No description"}
                      />
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <EmptyState message="No operating costs created yet." />
            )}
          </SectionCard>
        ) : null}

        {activeTab === "expenses" ? (
          <SectionCard
            title="Expenses"
            description="One-off spending like fuel, repairs, and external purchases."
            action={
              isAdmin ? (
                <button
                  type="button"
                  className={iconButtonClassName}
                  onClick={() => {
                    resetExpenseForm();
                    setActiveModal("expense");
                  }}
                  aria-label="Add expense"
                >
                  <Plus className="h-4 w-4" />
                </button>
              ) : null
            }
          >
            {expenses.length ? (
              expenses.map((record) => (
                <article key={record.id} className={recordCardClassName}>
                  {isAdmin ? (
                    <button
                      type="button"
                      className={recordEditButtonClassName}
                      onClick={() => {
                        setSelectedExpenseId(record.id);
                        setActiveModal("expense");
                      }}
                      aria-label={`Edit expense ${record.expense_type}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  ) : null}
                  <div className="flex flex-1 flex-col gap-4">
                    <div className="space-y-1 pr-10">
                      <h3 className="line-clamp-2 text-sm font-semibold text-slate-900">
                        {record.expense_type}
                      </h3>
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                        {formatAmount(record.amount)}
                      </p>
                    </div>
                    <div className="flex-1 space-y-3">
                      <DetailItem
                        label="Vendor"
                        value={record.vendor_name || "No vendor"}
                      />
                      <DetailItem
                        label="Reference"
                        value={record.reference_number || "No reference"}
                      />
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <EmptyState message="No expense records created yet." />
            )}
          </SectionCard>
        ) : null}

        {activeTab === "invoices" ? (
          <SectionCard
            title="Invoices"
            description="Order-linked invoices with amount derived from the sales order total."
            action={
              isAdmin ? (
                <button
                  type="button"
                  className={iconButtonClassName}
                  onClick={() => {
                    resetInvoiceForm();
                    setActiveModal("invoice");
                  }}
                  aria-label="Add invoice"
                >
                  <Plus className="h-4 w-4" />
                </button>
              ) : null
            }
          >
            {invoices.length ? (
              invoices.map((record) => (
                <article key={record.id} className={recordCardClassName}>
                  {isAdmin ? (
                    <button
                      type="button"
                      className={recordEditButtonClassName}
                      onClick={() => {
                        setSelectedInvoiceId(record.id);
                        setActiveModal("invoice");
                      }}
                      aria-label={`Edit invoice ${record.invoice_number}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  ) : null}
                  <div className="flex flex-1 flex-col gap-4">
                    <div className="space-y-1 pr-10">
                      <h3 className="line-clamp-2 text-sm font-semibold text-slate-900">
                        {record.invoice_number}
                      </h3>
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                        {record.status}
                      </p>
                    </div>
                    <div className="flex-1 space-y-3">
                      <DetailItem label="Order" value={record.order_number} />
                      <DetailItem
                        label="Amount"
                        value={formatAmount(record.amount)}
                      />
                      <DetailItem
                        label="Due"
                        value={formatDate(record.due_date)}
                      />
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <EmptyState message="No invoices created yet." />
            )}
          </SectionCard>
        ) : null}

        {activeTab === "receipts" ? (
          <SectionCard
            title="Receipts"
            description="Payments received against invoices."
            action={
              isAdmin ? (
                <button
                  type="button"
                  className={iconButtonClassName}
                  onClick={() => {
                    resetReceiptForm();
                    setActiveModal("receipt");
                  }}
                  aria-label="Add receipt"
                >
                  <Plus className="h-4 w-4" />
                </button>
              ) : null
            }
          >
            {receipts.length ? (
              receipts.map((record) => (
                <article key={record.id} className={recordCardClassName}>
                  {isAdmin ? (
                    <button
                      type="button"
                      className={recordEditButtonClassName}
                      onClick={() => {
                        setSelectedReceiptId(record.id);
                        setActiveModal("receipt");
                      }}
                      aria-label={`Edit receipt ${record.receipt_number}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  ) : null}
                  <div className="flex flex-1 flex-col gap-4">
                    <div className="space-y-1 pr-10">
                      <h3 className="line-clamp-2 text-sm font-semibold text-slate-900">
                        {record.receipt_number}
                      </h3>
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                        {formatAmount(record.amount_received)}
                      </p>
                    </div>
                    <div className="flex-1 space-y-3">
                      <DetailItem
                        label="Invoice"
                        value={record.invoice_number}
                      />
                      <DetailItem
                        label="Method"
                        value={record.payment_method || "No payment method"}
                      />
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <EmptyState message="No receipts created yet." />
            )}
          </SectionCard>
        ) : null}

        {activeTab === "insurance" ? (
          <SectionCard
            title="Insurance records"
            description="Policies, providers, dates, and coverage status."
            action={
              isAdmin ? (
                <button
                  type="button"
                  className={iconButtonClassName}
                  onClick={() => {
                    resetInsuranceForm();
                    setActiveModal("insurance");
                  }}
                  aria-label="Add insurance record"
                >
                  <Plus className="h-4 w-4" />
                </button>
              ) : null
            }
          >
            {insuranceRecords.length ? (
              insuranceRecords.map((record) => (
                <article key={record.id} className={recordCardClassName}>
                  {isAdmin ? (
                    <button
                      type="button"
                      className={recordEditButtonClassName}
                      onClick={() => {
                        setSelectedInsuranceId(record.id);
                        setActiveModal("insurance");
                      }}
                      aria-label={`Edit insurance ${record.policy_name}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  ) : null}
                  <div className="flex flex-1 flex-col gap-4">
                    <div className="space-y-1 pr-10">
                      <h3 className="line-clamp-2 text-sm font-semibold text-slate-900">
                        {record.policy_name}
                      </h3>
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                        {record.status}
                      </p>
                    </div>
                    <div className="flex-1 space-y-3">
                      <DetailItem
                        label="Provider"
                        value={record.provider_name}
                      />
                      <DetailItem
                        label="Premium"
                        value={formatAmount(record.premium_amount)}
                      />
                      <DetailItem
                        label="Ends"
                        value={formatDate(record.end_date)}
                      />
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <EmptyState message="No insurance records created yet." />
            )}
          </SectionCard>
        ) : null}

        {activeTab === "snapshots" ? (
          <SectionCard
            title="Profitability snapshots"
            description="Live profit estimate plus saved snapshots for reference."
            action={
              isAdmin ? (
                <button
                  type="button"
                  className={iconButtonClassName}
                  onClick={() => {
                    resetSnapshotForm();
                    setActiveModal("snapshot");
                  }}
                  aria-label="Add profitability snapshot"
                >
                  <Plus className="h-4 w-4" />
                </button>
              ) : null
            }
          >
            <article className={recordCardClassName}>
              <div className="flex flex-1 flex-col gap-4">
                <div className="space-y-1 pr-10">
                  <h3 className="line-clamp-2 text-sm font-semibold text-slate-900">
                    Current finance position
                  </h3>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                    {liveProfitEstimate >= 0 ? "Profit" : "Loss"}{" "}
                    {formatAmount(Math.abs(liveProfitEstimate))}
                  </p>
                </div>
                <div className="flex-1 space-y-3">
                  <DetailItem
                    label="Recognized sales"
                    value={formatAmount(liveRecognizedRevenue)}
                  />
                  <DetailItem
                    label="Collected cash"
                    value={formatAmount(liveCollectedRevenue)}
                  />
                  <DetailItem
                    label="Total costs"
                    value={formatAmount(liveTotalCosts)}
                  />
                  <DetailItem
                    label="Collection rate"
                    value={formatPercent(liveCollectionRate)}
                  />
                </div>
              </div>
            </article>
            {snapshots.length ? (
              snapshots.map((record) => (
                <article key={record.id} className={recordCardClassName}>
                  {isAdmin ? (
                    <button
                      type="button"
                      className={recordEditButtonClassName}
                      onClick={() => {
                        setSelectedSnapshotId(record.id);
                        setActiveModal("snapshot");
                      }}
                      aria-label={`Edit snapshot ${record.snapshot_date}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  ) : null}
                  <div className="flex flex-1 flex-col gap-4">
                    <div className="space-y-1 pr-10">
                      <h3 className="line-clamp-2 text-sm font-semibold text-slate-900">
                        {formatDate(record.snapshot_date)}
                      </h3>
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                        Profit {formatAmount(record.profit)}
                      </p>
                    </div>
                    <div className="flex-1 space-y-3">
                      <DetailItem
                        label="Revenue"
                        value={formatAmount(record.revenue)}
                      />
                      <DetailItem
                        label="Total costs"
                        value={formatAmount(record.total_costs)}
                      />
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <EmptyState message="No profitability snapshots created yet." />
            )}
          </SectionCard>
        ) : null}
          </div>
          <footer className="panel mt-auto px-4 py-3">
            <p className="text-sm leading-6 text-slate-600">
              <span className="font-semibold text-sky-700">
                {activeFinanceStep.footerLabel}
              </span>{" "}
              {activeFinanceStep.detail}
            </p>
          </footer>
        </div>
      </div>
      {activeModal === "capital" ? (
        <ModalShell
          title={
            selectedCapitalId ? "Edit capital record" : "Add capital record"
          }
          description="Capture a capital injection or investment source."
          onClose={closeModal}
        >
          <form
            className="space-y-6"
            onSubmit={(event) =>
              void handleSubmit(event, {
                selectedId: selectedCapitalId,
                pending: setCapitalPending,
                setError: setCapitalError,
                createAction: createCapitalRecord,
                updateAction: updateCapitalRecord,
                payload: capitalForm,
                reset: resetCapitalForm,
                fallbackMessage: "Unable to save capital record.",
              })
            }
          >
            <FormPanel
              title="Capital details"
              description="Use the capital records endpoint fields here."
            >
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>Record date</span>
                  <input
                    type="date"
                    className={fieldClassName}
                    value={capitalForm.record_date}
                    onChange={(event) =>
                      setCapitalForm((current) => ({
                        ...current,
                        record_date: event.target.value,
                      }))
                    }
                    required
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>Amount</span>
                  <input
                    className={fieldClassName}
                    value={capitalForm.amount}
                    onChange={(event) =>
                      setCapitalForm((current) => ({
                        ...current,
                        amount: event.target.value,
                      }))
                    }
                    required
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
                  <span>Source name</span>
                  <input
                    className={fieldClassName}
                    value={capitalForm.source_name}
                    onChange={(event) =>
                      setCapitalForm((current) => ({
                        ...current,
                        source_name: event.target.value,
                      }))
                    }
                    required
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
                  <span>Description</span>
                  <textarea
                    className={textAreaClassName}
                    value={capitalForm.description}
                    onChange={(event) =>
                      setCapitalForm((current) => ({
                        ...current,
                        description: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
                  <span>Notes</span>
                  <textarea
                    className={textAreaClassName}
                    value={capitalForm.notes}
                    onChange={(event) =>
                      setCapitalForm((current) => ({
                        ...current,
                        notes: event.target.value,
                      }))
                    }
                  />
                </label>
              </div>
            </FormPanel>
            <FieldMessage message={capitalError} />
            <div className="flex flex-wrap items-center justify-between gap-3">
              {selectedCapitalId ? (
                <button
                  type="button"
                  className={dangerButtonClassName}
                  disabled={capitalPending}
                  onClick={() =>
                    void runDelete(
                      () => deleteCapitalRecord(selectedCapitalId),
                      resetCapitalForm,
                      setCapitalError,
                      setCapitalPending,
                      "Unable to delete capital record.",
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
                  disabled={capitalPending}
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={primaryButtonClassName}
                  disabled={capitalPending}
                >
                  {capitalPending ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : null}
                  {selectedCapitalId ? "Save changes" : "Create capital record"}
                </button>
              </div>
            </div>
          </form>
        </ModalShell>
      ) : null}

      {activeModal === "operating" ? (
        <ModalShell
          title={
            selectedOperatingId ? "Edit operating cost" : "Add operating cost"
          }
          description="Capture recurring cost items like utilities and rent."
          onClose={closeModal}
        >
          <form
            className="space-y-6"
            onSubmit={(event) =>
              void handleSubmit(event, {
                selectedId: selectedOperatingId,
                pending: setOperatingPending,
                setError: setOperatingError,
                createAction: createOperatingCost,
                updateAction: updateOperatingCost,
                payload: operatingForm,
                reset: resetOperatingForm,
                fallbackMessage: "Unable to save operating cost.",
              })
            }
          >
            <FormPanel
              title="Operating cost details"
              description="Use the operating costs endpoint fields here."
            >
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>Cost date</span>
                  <input
                    type="date"
                    className={fieldClassName}
                    value={operatingForm.cost_date}
                    onChange={(event) =>
                      setOperatingForm((current) => ({
                        ...current,
                        cost_date: event.target.value,
                      }))
                    }
                    required
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>Amount</span>
                  <input
                    className={fieldClassName}
                    value={operatingForm.amount}
                    onChange={(event) =>
                      setOperatingForm((current) => ({
                        ...current,
                        amount: event.target.value,
                      }))
                    }
                    required
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
                  <span>Category</span>
                  <input
                    className={fieldClassName}
                    value={operatingForm.category}
                    onChange={(event) =>
                      setOperatingForm((current) => ({
                        ...current,
                        category: event.target.value,
                      }))
                    }
                    required
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
                  <span>Description</span>
                  <textarea
                    className={textAreaClassName}
                    value={operatingForm.description}
                    onChange={(event) =>
                      setOperatingForm((current) => ({
                        ...current,
                        description: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
                  <span>Notes</span>
                  <textarea
                    className={textAreaClassName}
                    value={operatingForm.notes}
                    onChange={(event) =>
                      setOperatingForm((current) => ({
                        ...current,
                        notes: event.target.value,
                      }))
                    }
                  />
                </label>
              </div>
            </FormPanel>
            <FieldMessage message={operatingError} />
            <div className="flex flex-wrap items-center justify-between gap-3">
              {selectedOperatingId ? (
                <button
                  type="button"
                  className={dangerButtonClassName}
                  disabled={operatingPending}
                  onClick={() =>
                    void runDelete(
                      () => deleteOperatingCost(selectedOperatingId),
                      resetOperatingForm,
                      setOperatingError,
                      setOperatingPending,
                      "Unable to delete operating cost.",
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
                  disabled={operatingPending}
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={primaryButtonClassName}
                  disabled={operatingPending}
                >
                  {operatingPending ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : null}
                  {selectedOperatingId
                    ? "Save changes"
                    : "Create operating cost"}
                </button>
              </div>
            </div>
          </form>
        </ModalShell>
      ) : null}

      {activeModal === "expense" ? (
        <ModalShell
          title={selectedExpenseId ? "Edit expense" : "Add expense"}
          description="Capture one-off spending and its reference details."
          onClose={closeModal}
        >
          <form
            className="space-y-6"
            onSubmit={(event) =>
              void handleSubmit(event, {
                selectedId: selectedExpenseId,
                pending: setExpensePending,
                setError: setExpenseError,
                createAction: createExpense,
                updateAction: updateExpense,
                payload: expenseForm,
                reset: resetExpenseForm,
                fallbackMessage: "Unable to save expense.",
              })
            }
          >
            <FormPanel
              title="Expense details"
              description="Use the expenses endpoint fields here."
            >
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>Expense date</span>
                  <input
                    type="date"
                    className={fieldClassName}
                    value={expenseForm.expense_date}
                    onChange={(event) =>
                      setExpenseForm((current) => ({
                        ...current,
                        expense_date: event.target.value,
                      }))
                    }
                    required
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>Amount</span>
                  <input
                    className={fieldClassName}
                    value={expenseForm.amount}
                    onChange={(event) =>
                      setExpenseForm((current) => ({
                        ...current,
                        amount: event.target.value,
                      }))
                    }
                    required
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>Expense type</span>
                  <input
                    className={fieldClassName}
                    value={expenseForm.expense_type}
                    onChange={(event) =>
                      setExpenseForm((current) => ({
                        ...current,
                        expense_type: event.target.value,
                      }))
                    }
                    required
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>Vendor name</span>
                  <input
                    className={fieldClassName}
                    value={expenseForm.vendor_name}
                    onChange={(event) =>
                      setExpenseForm((current) => ({
                        ...current,
                        vendor_name: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
                  <span>Reference number</span>
                  <input
                    className={fieldClassName}
                    value={expenseForm.reference_number}
                    onChange={(event) =>
                      setExpenseForm((current) => ({
                        ...current,
                        reference_number: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
                  <span>Notes</span>
                  <textarea
                    className={textAreaClassName}
                    value={expenseForm.notes}
                    onChange={(event) =>
                      setExpenseForm((current) => ({
                        ...current,
                        notes: event.target.value,
                      }))
                    }
                  />
                </label>
              </div>
            </FormPanel>
            <FieldMessage message={expenseError} />
            <div className="flex flex-wrap items-center justify-between gap-3">
              {selectedExpenseId ? (
                <button
                  type="button"
                  className={dangerButtonClassName}
                  disabled={expensePending}
                  onClick={() =>
                    void runDelete(
                      () => deleteExpense(selectedExpenseId),
                      resetExpenseForm,
                      setExpenseError,
                      setExpensePending,
                      "Unable to delete expense.",
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
                  disabled={expensePending}
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={primaryButtonClassName}
                  disabled={expensePending}
                >
                  {expensePending ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : null}
                  {selectedExpenseId ? "Save changes" : "Create expense"}
                </button>
              </div>
            </div>
          </form>
        </ModalShell>
      ) : null}

      {activeModal === "invoice" ? (
        <ModalShell
          title={selectedInvoiceId ? "Edit invoice" : "Add invoice"}
          description="Link invoices to sales orders; the amount comes from the order total."
          onClose={closeModal}
        >
          <form
            className="space-y-6"
            onSubmit={(event) =>
              void handleSubmit(event, {
                selectedId: selectedInvoiceId,
                pending: setInvoicePending,
                setError: setInvoiceError,
                createAction: createInvoice,
                updateAction: updateInvoice,
                payload: {
                  ...invoiceForm,
                  order: Number(invoiceForm.order),
                  invoice_number: invoiceForm.invoice_number.trim(),
                  notes: invoiceForm.notes.trim(),
                },
                reset: resetInvoiceForm,
                fallbackMessage: "Unable to save invoice.",
              })
            }
          >
            <FormPanel
              title="Invoice details"
              description="Use the invoices endpoint fields here."
            >
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>Order</span>
                  <PickerField
                    value={invoiceForm.order ? String(invoiceForm.order) : ""}
                    options={[
                      { label: "Select order", value: "" },
                      ...buildAssignableOrderOptions(invoiceForm.order).map(
                        (order) => ({
                          label:
                            order.status === "cancelled"
                              ? `${order.order_number} (Cancelled)`
                              : order.order_number,
                          value: String(order.id),
                        }),
                      ),
                    ]}
                    onChange={(value) =>
                      setInvoiceForm((current) => ({
                        ...current,
                        order: Number(value),
                      }))
                    }
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>Status</span>
                  <PickerField
                    value={invoiceForm.status}
                    options={invoiceStatuses.map((status) => ({
                      label: status,
                      value: status,
                    }))}
                    onChange={(value) =>
                      setInvoiceForm((current) => ({
                        ...current,
                        status: value as InvoiceStatus,
                      }))
                    }
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>Invoice number</span>
                  <input
                    className={fieldClassName}
                    value={invoiceForm.invoice_number}
                    onChange={(event) =>
                      setInvoiceForm((current) => ({
                        ...current,
                        invoice_number: event.target.value,
                      }))
                    }
                    required
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>Invoice date</span>
                  <input
                    type="date"
                    className={fieldClassName}
                    value={invoiceForm.invoice_date}
                    onChange={(event) =>
                      setInvoiceForm((current) => ({
                        ...current,
                        invoice_date: event.target.value,
                      }))
                    }
                    required
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
                  <span>Due date</span>
                  <input
                    type="date"
                    className={fieldClassName}
                    value={invoiceForm.due_date}
                    onChange={(event) =>
                      setInvoiceForm((current) => ({
                        ...current,
                        due_date: event.target.value,
                      }))
                    }
                    required
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
                  <span>Notes</span>
                  <textarea
                    className={textAreaClassName}
                    value={invoiceForm.notes}
                    onChange={(event) =>
                      setInvoiceForm((current) => ({
                        ...current,
                        notes: event.target.value,
                      }))
                    }
                  />
                </label>
              </div>
            </FormPanel>
            <FieldMessage message={invoiceError} />
            <div className="flex flex-wrap items-center justify-between gap-3">
              {selectedInvoiceId ? (
                <button
                  type="button"
                  className={dangerButtonClassName}
                  disabled={invoicePending}
                  onClick={() =>
                    void runDelete(
                      () => deleteInvoice(selectedInvoiceId),
                      resetInvoiceForm,
                      setInvoiceError,
                      setInvoicePending,
                      "Unable to delete invoice.",
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
                  disabled={invoicePending}
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={primaryButtonClassName}
                  disabled={invoicePending}
                >
                  {invoicePending ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : null}
                  {selectedInvoiceId ? "Save changes" : "Create invoice"}
                </button>
              </div>
            </div>
          </form>
        </ModalShell>
      ) : null}

      {activeModal === "receipt" ? (
        <ModalShell
          title={selectedReceiptId ? "Edit receipt" : "Add receipt"}
          description="Capture payments received against invoices."
          onClose={closeModal}
        >
          <form
            className="space-y-6"
            onSubmit={(event) =>
              void handleSubmit(event, {
                selectedId: selectedReceiptId,
                pending: setReceiptPending,
                setError: setReceiptError,
                createAction: createReceipt,
                updateAction: updateReceipt,
                payload: {
                  ...receiptForm,
                  invoice: Number(receiptForm.invoice),
                  receipt_number: receiptForm.receipt_number.trim(),
                  payment_method: receiptForm.payment_method.trim(),
                  reference_number: receiptForm.reference_number.trim(),
                  notes: receiptForm.notes.trim(),
                },
                reset: resetReceiptForm,
                fallbackMessage: "Unable to save receipt.",
              })
            }
          >
            <FormPanel
              title="Receipt details"
              description="Use the receipts endpoint fields here."
            >
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>Invoice</span>
                  <PickerField
                    value={
                      receiptForm.invoice ? String(receiptForm.invoice) : ""
                    }
                    options={[
                      { label: "Select invoice", value: "" },
                      ...buildAssignableInvoiceOptions(receiptForm.invoice).map(
                        (invoice) => ({
                          label:
                            invoice.status === "sent" &&
                            invoice.due_date >= todayIsoDate
                              ? invoice.invoice_number
                              : `${invoice.invoice_number} (${invoice.status})`,
                          value: String(invoice.id),
                        }),
                      ),
                    ]}
                    onChange={(value) =>
                      setReceiptForm((current) => ({
                        ...current,
                        invoice: Number(value),
                      }))
                    }
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>Amount received</span>
                  <input
                    className={fieldClassName}
                    value={receiptForm.amount_received}
                    onChange={(event) =>
                      setReceiptForm((current) => ({
                        ...current,
                        amount_received: event.target.value,
                      }))
                    }
                    required
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>Receipt number</span>
                  <input
                    className={fieldClassName}
                    value={receiptForm.receipt_number}
                    onChange={(event) =>
                      setReceiptForm((current) => ({
                        ...current,
                        receipt_number: event.target.value,
                      }))
                    }
                    required
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>Receipt date</span>
                  <input
                    type="date"
                    className={fieldClassName}
                    value={receiptForm.receipt_date}
                    onChange={(event) =>
                      setReceiptForm((current) => ({
                        ...current,
                        receipt_date: event.target.value,
                      }))
                    }
                    required
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>Payment method</span>
                  <input
                    className={fieldClassName}
                    value={receiptForm.payment_method}
                    onChange={(event) =>
                      setReceiptForm((current) => ({
                        ...current,
                        payment_method: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>Reference number</span>
                  <input
                    className={fieldClassName}
                    value={receiptForm.reference_number}
                    onChange={(event) =>
                      setReceiptForm((current) => ({
                        ...current,
                        reference_number: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
                  <span>Notes</span>
                  <textarea
                    className={textAreaClassName}
                    value={receiptForm.notes}
                    onChange={(event) =>
                      setReceiptForm((current) => ({
                        ...current,
                        notes: event.target.value,
                      }))
                    }
                  />
                </label>
              </div>
            </FormPanel>
            <FieldMessage message={receiptError} />
            <div className="flex flex-wrap items-center justify-between gap-3">
              {selectedReceiptId ? (
                <button
                  type="button"
                  className={dangerButtonClassName}
                  disabled={receiptPending}
                  onClick={() =>
                    void runDelete(
                      () => deleteReceipt(selectedReceiptId),
                      resetReceiptForm,
                      setReceiptError,
                      setReceiptPending,
                      "Unable to delete receipt.",
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
                  disabled={receiptPending}
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={primaryButtonClassName}
                  disabled={receiptPending}
                >
                  {receiptPending ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : null}
                  {selectedReceiptId ? "Save changes" : "Create receipt"}
                </button>
              </div>
            </div>
          </form>
        </ModalShell>
      ) : null}

      {activeModal === "insurance" ? (
        <ModalShell
          title={
            selectedInsuranceId
              ? "Edit insurance record"
              : "Add insurance record"
          }
          description="Track active and expired insurance coverage."
          onClose={closeModal}
        >
          <form
            className="space-y-6"
            onSubmit={(event) =>
              void handleSubmit(event, {
                selectedId: selectedInsuranceId,
                pending: setInsurancePending,
                setError: setInsuranceError,
                createAction: createInsuranceRecord,
                updateAction: updateInsuranceRecord,
                payload: insuranceForm,
                reset: resetInsuranceForm,
                fallbackMessage: "Unable to save insurance record.",
              })
            }
          >
            <FormPanel
              title="Insurance details"
              description="Use the insurance records endpoint fields here."
            >
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>Status</span>
                  <PickerField
                    value={insuranceForm.status}
                    options={insuranceStatuses.map((status) => ({
                      label: status,
                      value: status,
                    }))}
                    onChange={(value) =>
                      setInsuranceForm((current) => ({
                        ...current,
                        status: value as InsuranceStatus,
                      }))
                    }
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>Premium amount</span>
                  <input
                    className={fieldClassName}
                    value={insuranceForm.premium_amount}
                    onChange={(event) =>
                      setInsuranceForm((current) => ({
                        ...current,
                        premium_amount: event.target.value,
                      }))
                    }
                    required
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>Policy name</span>
                  <input
                    className={fieldClassName}
                    value={insuranceForm.policy_name}
                    onChange={(event) =>
                      setInsuranceForm((current) => ({
                        ...current,
                        policy_name: event.target.value,
                      }))
                    }
                    required
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>Provider name</span>
                  <input
                    className={fieldClassName}
                    value={insuranceForm.provider_name}
                    onChange={(event) =>
                      setInsuranceForm((current) => ({
                        ...current,
                        provider_name: event.target.value,
                      }))
                    }
                    required
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>Policy number</span>
                  <input
                    className={fieldClassName}
                    value={insuranceForm.policy_number}
                    onChange={(event) =>
                      setInsuranceForm((current) => ({
                        ...current,
                        policy_number: event.target.value,
                      }))
                    }
                    required
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>Coverage type</span>
                  <input
                    className={fieldClassName}
                    value={insuranceForm.coverage_type}
                    onChange={(event) =>
                      setInsuranceForm((current) => ({
                        ...current,
                        coverage_type: event.target.value,
                      }))
                    }
                    required
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>Start date</span>
                  <input
                    type="date"
                    className={fieldClassName}
                    value={insuranceForm.start_date}
                    onChange={(event) =>
                      setInsuranceForm((current) => ({
                        ...current,
                        start_date: event.target.value,
                      }))
                    }
                    required
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>End date</span>
                  <input
                    type="date"
                    className={fieldClassName}
                    value={insuranceForm.end_date}
                    onChange={(event) =>
                      setInsuranceForm((current) => ({
                        ...current,
                        end_date: event.target.value,
                      }))
                    }
                    required
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
                  <span>Notes</span>
                  <textarea
                    className={textAreaClassName}
                    value={insuranceForm.notes}
                    onChange={(event) =>
                      setInsuranceForm((current) => ({
                        ...current,
                        notes: event.target.value,
                      }))
                    }
                  />
                </label>
              </div>
            </FormPanel>
            <FieldMessage message={insuranceError} />
            <div className="flex flex-wrap items-center justify-between gap-3">
              {selectedInsuranceId ? (
                <button
                  type="button"
                  className={dangerButtonClassName}
                  disabled={insurancePending}
                  onClick={() =>
                    void runDelete(
                      () => deleteInsuranceRecord(selectedInsuranceId),
                      resetInsuranceForm,
                      setInsuranceError,
                      setInsurancePending,
                      "Unable to delete insurance record.",
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
                  disabled={insurancePending}
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={primaryButtonClassName}
                  disabled={insurancePending}
                >
                  {insurancePending ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : null}
                  {selectedInsuranceId
                    ? "Save changes"
                    : "Create insurance record"}
                </button>
              </div>
            </div>
          </form>
        </ModalShell>
      ) : null}

      {activeModal === "snapshot" ? (
        <ModalShell
          title={
            selectedSnapshotId
              ? "Edit profitability snapshot"
              : "Add profitability snapshot"
          }
          description="Snapshot the current live revenue and costs for later reference."
          onClose={closeModal}
        >
          <form
            className="space-y-6"
            onSubmit={(event) =>
              void handleSubmit(event, {
                selectedId: selectedSnapshotId,
                pending: setSnapshotPending,
                setError: setSnapshotError,
                createAction: createProfitabilitySnapshot,
                updateAction: updateProfitabilitySnapshot,
                payload: snapshotForm,
                reset: resetSnapshotForm,
                fallbackMessage: "Unable to save profitability snapshot.",
              })
            }
          >
            <FormPanel
              title="Snapshot details"
              description="Revenue and costs are pulled from the current finance records."
            >
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>Snapshot date</span>
                  <input
                    type="date"
                    className={fieldClassName}
                    value={snapshotForm.snapshot_date}
                    onChange={(event) =>
                      setSnapshotForm((current) => ({
                        ...current,
                        snapshot_date: event.target.value,
                      }))
                    }
                    required
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>Revenue</span>
                  <input
                    className={fieldClassName}
                    value={snapshotForm.revenue}
                    readOnly
                    required
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>Total costs</span>
                  <input
                    className={fieldClassName}
                    value={snapshotForm.total_costs}
                    readOnly
                    required
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
                  <span>Notes</span>
                  <textarea
                    className={textAreaClassName}
                    value={snapshotForm.notes}
                    onChange={(event) =>
                      setSnapshotForm((current) => ({
                        ...current,
                        notes: event.target.value,
                      }))
                    }
                  />
                </label>
              </div>
            </FormPanel>
            <FieldMessage message={snapshotError} />
            <div className="flex flex-wrap items-center justify-between gap-3">
              {selectedSnapshotId ? (
                <button
                  type="button"
                  className={dangerButtonClassName}
                  disabled={snapshotPending}
                  onClick={() =>
                    void runDelete(
                      () => deleteProfitabilitySnapshot(selectedSnapshotId),
                      resetSnapshotForm,
                      setSnapshotError,
                      setSnapshotPending,
                      "Unable to delete profitability snapshot.",
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
                  disabled={snapshotPending}
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={primaryButtonClassName}
                  disabled={snapshotPending}
                >
                  {snapshotPending ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : null}
                  {selectedSnapshotId ? "Save changes" : "Create snapshot"}
                </button>
              </div>
            </div>
          </form>
        </ModalShell>
      ) : null}
    </div>
  );
}
