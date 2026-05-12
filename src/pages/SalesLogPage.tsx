import {
  ArrowLeft,
  ArrowRight,
  Check,
  CalendarDays,
  ChevronDown,
  Download,
  Eye,
  LoaderCircle,
  Search,
  X,
} from "lucide-react";
import {
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";
import { ApiError } from "../lib/api/auth";
import {
  fetchSalesLog,
  fetchSalesLogDetail,
  fetchSalesLogSummary,
} from "../lib/api/sales";
import type {
  DeliveryRecord,
  OrderItemRecord,
  SalesLogDetail,
  SalesLogRecord,
  SalesLogSummary,
  SalesLogTone,
} from "../types/sales";
type DatePreset = "today" | "7days" | "month";
type PageSizeOption = 5 | 6 | 10;
type FloatingPickerPosition = CSSProperties & {
  left: number;
  top: number;
  width: number;
};

const tableToolbarClassName =
  "relative z-30 flex flex-nowrap items-center gap-2 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-2";
const tableToolbarActionsClassName =
  "ml-auto flex shrink-0 items-center gap-2";

function parseDateOnly(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatDate(value: string | null) {
  if (!value) return "Not set";

  const date = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? parseDateOnly(value)
    : new Date(value);

  return new Intl.DateTimeFormat("en-UG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatTime(value: string | null) {
  if (!value) return "Time not recorded";

  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return "Time not recorded";

  return new Intl.DateTimeFormat("en-UG", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
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

  return new Intl.NumberFormat("en-UG", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(numericValue);
}

function formatCurrency(value: number) {
  return `UGX ${new Intl.NumberFormat("en-UG", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)}`;
}

function formatCurrencyMetric(value: number) {
  return `UGX ${formatAmount(value)}`;
}

function formatQuantity(value: number) {
  return new Intl.NumberFormat("en-UG", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

function renderTopSellers(names: string[]) {
  if (!names.length) {
    return <span>No sales</span>;
  }

  const visibleNames = names.slice(0, 2);
  const remainingCount = Math.max(names.length - visibleNames.length, 0);

  return (
    <span className="flex flex-col gap-1">
      {visibleNames.map((name) => (
        <span key={name}>{name}</span>
      ))}
      {remainingCount ? <span>{`+${remainingCount} others`}</span> : null}
    </span>
  );
}

function titleCase(value: string) {
  return value
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function StatusBadge({ label, tone }: { label: string; tone: SalesLogTone }) {
  const badgeClassName =
    tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : tone === "warning"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : tone === "danger"
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-slate-200 bg-slate-100 text-slate-600";

  return (
    <span
      className={`inline-flex rounded-full border px-2 py-1 text-[11px] uppercase tracking-[0.24em] ${badgeClassName}`}
    >
      {label}
    </span>
  );
}

function PaymentBadge({ label }: { label: string }) {
  const normalizedLabel = label.toLowerCase();
  const badgeClassName =
    normalizedLabel === "cash"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : normalizedLabel === "mobile money"
        ? "border-sky-200 bg-sky-50 text-sky-700"
        : normalizedLabel === "bank transfer"
          ? "border-violet-200 bg-violet-50 text-violet-700"
          : normalizedLabel === "credit"
            ? "border-amber-200 bg-amber-50 text-amber-700"
            : "border-slate-200 bg-slate-100 text-slate-600";

  return (
    <span
      className={`inline-flex rounded-full border px-2 py-1 text-[11px] font-medium ${badgeClassName}`}
    >
      {label}
    </span>
  );
}

export function SalesLogPage() {
  const [entries, setEntries] = useState<SalesLogRecord[]>([]);
  const [summary, setSummary] = useState<SalesLogSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState("");
  const [datePreset, setDatePreset] = useState<DatePreset>("today");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSizeOption>(10);
  const [totalEntries, setTotalEntries] = useState(0);
  const [selectedSaleId, setSelectedSaleId] = useState<number | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<SalesLogDetail | null>(
    null,
  );
  const [detailLoading, setDetailLoading] = useState(false);
  const [activePicker, setActivePicker] = useState<"date" | null>(null);
  const [pickerPosition, setPickerPosition] =
    useState<FloatingPickerPosition | null>(null);
  const deferredSearch = useDeferredValue(searchValue);
  const pickerContainerRef = useRef<HTMLDivElement | null>(null);
  const pickerDropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadPage() {
      try {
        setLoading(true);
        setPageError(null);

        const response = await fetchSalesLog({
          page: currentPage,
          pageSize,
          search: deferredSearch,
          range: datePreset,
        });

        if (!isMounted || Array.isArray(response)) return;

        setEntries(response.results);
        setTotalEntries(response.count);
      } catch (error) {
        if (!isMounted) return;
        setPageError(
          error instanceof ApiError
            ? error.message
            : "Unable to load the sales log right now.",
        );
        setEntries([]);
        setTotalEntries(0);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    void loadPage();

    return () => {
      isMounted = false;
    };
  }, [currentPage, datePreset, deferredSearch, pageSize]);

  useEffect(() => {
    let isMounted = true;

    async function loadSummary() {
      try {
        const response = await fetchSalesLogSummary();
        if (isMounted) {
          setSummary(response);
        }
      } catch {
        if (isMounted) {
          setSummary(null);
        }
      }
    }

    void loadSummary();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [datePreset, deferredSearch, pageSize]);

  useEffect(() => {
    if (!activePicker) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        pickerContainerRef.current?.contains(target) ||
        pickerDropdownRef.current?.contains(target)
      ) {
        return;
      }

      setActivePicker(null);
      setPickerPosition(null);
    };

    const handleViewportChange = () => {
      setActivePicker(null);
      setPickerPosition(null);
    };

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);
    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
    };
  }, [activePicker]);

  const toggleDatePicker = (element: HTMLButtonElement) => {
    if (activePicker === "date") {
      setActivePicker(null);
      setPickerPosition(null);
      return;
    }

    const rect = element.getBoundingClientRect();
    const width = Math.max(rect.width, 180);
    const left = Math.min(Math.max(rect.left, 16), window.innerWidth - width - 16);
    setPickerPosition({
      left,
      top: rect.bottom + 8,
      width,
    });
    setActivePicker("date");
  };

  useEffect(() => {
    if (!selectedSaleId) {
      setSelectedDetail(null);
      setDetailLoading(false);
      return;
    }

    let isMounted = true;
    const saleId = selectedSaleId;

    async function loadDetail() {
      try {
        setDetailLoading(true);
        const response = await fetchSalesLogDetail(saleId);
        if (isMounted) {
          setSelectedDetail(response);
        }
      } catch {
        if (isMounted) {
          setSelectedDetail(null);
        }
      } finally {
        if (isMounted) {
          setDetailLoading(false);
        }
      }
    }

    void loadDetail();

    return () => {
      isMounted = false;
    };
  }, [selectedSaleId]);

  const datePresetLabel =
    datePreset === "today"
      ? "Today"
      : datePreset === "7days"
        ? "7 days"
        : "This month";

  const summaryCards = useMemo(
    () => ({
      totalSalesToday: summary?.total_sales_today ?? 0,
      totalSalesAmount: summary?.total_sales_amount ?? 0,
      averageSaleValue: summary?.average_sale_value ?? 0,
      topClientName: summary?.top_client_name ?? null,
      topClientAmount: summary?.top_client_amount ?? 0,
      topSellerNames: summary?.top_seller_names ?? [],
      topSellerSalesCount: summary?.top_seller_sales_count ?? 0,
    }),
    [summary],
  );

  const totalPages = Math.max(1, Math.ceil(totalEntries / pageSize));
  const fillerRowCount = Math.max(pageSize - entries.length, 0);

  async function exportCsv() {
    const response = await fetchSalesLog({
      search: deferredSearch,
      range: datePreset,
      paginate: false,
    });

    if (!Array.isArray(response) || !response.length) return;

    const lines = [
      [
        "Sale ID",
        "Date",
        "Time",
        "Seller",
        "Seller code",
        "Customer",
        "Product",
        "Quantity",
        "Amount",
        "Payment",
        "Status",
      ],
      ...response.map((entry) => [
        entry.sale_id,
        entry.business_date,
        formatTime(entry.logged_at),
        entry.seller_name,
        entry.seller_code,
        entry.customer_name,
        entry.product_summary,
        String(entry.quantity_total),
        String(entry.amount),
        entry.payment_method_label,
        entry.status_label,
      ]),
    ]
      .map((row) =>
        row
          .map((value) => `"${String(value).split('"').join('""')}"`)
          .join(","),
      )
      .join("\n");

    const blob = new Blob([lines], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `sales-log-${datePreset}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  return (
    <div className="module-page">
      <section className="rounded-[32px] border border-white/70 bg-[radial-gradient(circle_at_top_left,#ffffff,rgba(224,242,254,0.92)_52%,rgba(240,249,255,0.95))] py-6 pl-6 pr-0 shadow-[0_25px_80px_rgba(148,163,184,0.14)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/75 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-sky-700">
              Sales Log
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
                Sales log
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-slate-600">
                Every sale, who made it, when, and how.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-4">
            <div className="hero-metric-card">
              <p className="hero-metric-label">Total sales today</p>
              <p className="hero-metric-value">
                {summaryCards.totalSalesToday}
              </p>
              <p className="mt-2 text-sm text-slate-500">
                {formatCurrencyMetric(summaryCards.totalSalesAmount)} collected
              </p>
            </div>
            <div className="hero-metric-card">
              <p className="hero-metric-label">Top seller today</p>
              <p className="mt-2 text-base font-medium leading-6 text-slate-900">
                {renderTopSellers(summaryCards.topSellerNames)}
              </p>
              <p className="mt-2 text-sm text-slate-500">
                {summaryCards.topSellerSalesCount
                  ? `${summaryCards.topSellerSalesCount} transaction${summaryCards.topSellerSalesCount === 1 ? "" : "s"}${summaryCards.topSellerNames.length > 1 ? " each" : ""}`
                  : "No completed sales today"}
              </p>
            </div>
            <div className="hero-metric-card">
              <p className="hero-metric-label">Avg. sale value</p>
              <p className="hero-metric-value">
                {formatCurrencyMetric(summaryCards.averageSaleValue)}
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Across today's active sales
              </p>
            </div>
            <div className="hero-metric-card">
              <p className="hero-metric-label">Top client today</p>
              <p className="mt-2 text-base font-medium leading-6 text-slate-900">
                {summaryCards.topClientName ?? "No completed sales"}
              </p>
              <p className="mt-2 text-sm text-slate-500">
                {summaryCards.topClientName
                  ? `${formatCurrencyMetric(summaryCards.topClientAmount)} heaviest order`
                  : "No completed sales today"}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="module-page-stage justify-start">
        <section className="panel p-6">
          <div className="flex flex-col gap-4">
            <div
              className={[
                tableToolbarClassName,
                "scrollbar-hidden overflow-x-auto",
              ].join(" ")}
            >
              <div
                ref={pickerContainerRef}
                className="flex min-w-max items-center gap-2"
              >
                <label className="flex h-11 min-w-[240px] items-center gap-2 rounded-2xl border border-slate-200/80 bg-white px-3 text-sm text-slate-600 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
                  <Search className="h-4 w-4 text-slate-400" />
                  <input
                    className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                    placeholder="Search sale, customer, seller..."
                    value={searchValue}
                    onChange={(event) => setSearchValue(event.target.value)}
                  />
                </label>

                <div className="relative min-w-[180px]">
                  <button
                    type="button"
                    onClick={(event) => toggleDatePicker(event.currentTarget)}
                    className="inline-flex h-11 w-full items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white px-3 text-sm font-medium text-slate-700 shadow-[0_10px_24px_rgba(15,23,42,0.04)] transition hover:border-slate-300"
                    aria-haspopup="listbox"
                    aria-expanded={activePicker === "date"}
                  >
                    <span className="inline-flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-slate-400" />
                      {datePresetLabel}
                    </span>
                    <ChevronDown
                      className={[
                        "h-4 w-4 text-slate-400 transition",
                        activePicker === "date" ? "rotate-180" : "",
                      ].join(" ")}
                    />
                  </button>

                  {activePicker === "date" && pickerPosition
                    ? createPortal(
                        <div
                          ref={pickerDropdownRef}
                          className="fixed z-50 rounded-3xl border border-slate-200 bg-white p-2 shadow-[0_24px_60px_rgba(15,23,42,0.14)]"
                          style={pickerPosition}
                        >
                          <div className="px-3 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                            Date range
                          </div>
                          {[
                            { label: "Today", value: "today" as const },
                            { label: "7 days", value: "7days" as const },
                            { label: "This month", value: "month" as const },
                          ].map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => {
                                setDatePreset(option.value);
                                setActivePicker(null);
                                setPickerPosition(null);
                              }}
                              className={[
                                "flex w-full items-center justify-between rounded-2xl px-3 py-2 text-left text-sm transition",
                                datePreset === option.value
                                  ? "bg-sky-50 text-sky-700"
                                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                              ].join(" ")}
                            >
                              <span>{option.label}</span>
                              {datePreset === option.value ? (
                                <Check className="h-4 w-4" />
                              ) : null}
                            </button>
                          ))}
                        </div>,
                        document.body,
                      )
                    : null}
                </div>

                <div className="inline-flex h-11 items-center gap-1 rounded-2xl border border-slate-200/80 bg-white p-1 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
                  <span className="hidden px-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400 sm:inline">
                    Rows
                  </span>
                  {([10, 6, 5] as const).map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setPageSize(option)}
                      className={[
                        "rounded-[1rem] px-3 py-1.5 text-sm font-medium transition",
                        pageSize === option
                          ? "bg-sky-50 text-sky-700 shadow-[0_10px_24px_rgba(15,23,42,0.08)]"
                          : "text-slate-500 hover:text-slate-800",
                      ].join(" ")}
                      aria-pressed={pageSize === option}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              <div className={tableToolbarActionsClassName}>
                <div className="inline-flex h-11 items-center gap-1 rounded-2xl border border-slate-200/80 bg-white p-1 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
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
                  onClick={exportCsv}
                  disabled={!totalEntries}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
                  aria-label="Export sales log"
                  title="Export sales log"
                >
                  <Download className="h-4 w-4" />
                </button>
              </div>
            </div>

            {pageError ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {pageError}
              </div>
            ) : null}
          </div>

          <div className="mt-5 min-h-0 overflow-x-auto overflow-y-hidden">
            {loading ? (
              <div className="flex min-h-[420px] items-center gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/70 px-4 py-4 text-sm text-slate-600">
                <LoaderCircle className="h-4 w-4 animate-spin text-sky-700" />
                Loading sales log...
              </div>
            ) : entries.length === 0 ? (
              <div className="flex min-h-[420px] items-start rounded-2xl border border-slate-200/80 bg-slate-50/70 px-4 py-6 text-sm text-slate-600">
                No sales match the current date range or search.
              </div>
            ) : (
              <table className="min-w-full border-separate border-spacing-0">
                <thead>
                  <tr>
                    <th className="rounded-tl-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                      Sale
                    </th>
                    <th className="border-y border-slate-200/80 bg-slate-50/80 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                      Seller
                    </th>
                    <th className="border-y border-slate-200/80 bg-slate-50/80 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                      Customer
                    </th>
                    <th className="border-y border-slate-200/80 bg-slate-50/80 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                      Product
                    </th>
                    <th className="border-y border-slate-200/80 bg-slate-50/80 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                      Qty
                    </th>
                    <th className="border-y border-slate-200/80 bg-slate-50/80 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                      Amount
                    </th>
                    <th className="border-y border-slate-200/80 bg-slate-50/80 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                      Status
                    </th>
                    <th className="rounded-tr-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry, index) => {
                    const isLast =
                      index === entries.length - 1 && fillerRowCount === 0;
                    const rowClass = isLast
                      ? "border-b border-slate-200/80"
                      : "border-b border-slate-200/60";

                    return (
                      <tr key={entry.id}>
                        <td
                          className={`${rowClass} border-l border-r border-slate-200/80 bg-white px-4 py-4`}
                        >
                          <div className="min-w-[140px] space-y-1">
                            <p className="font-semibold text-sky-700">
                              {entry.sale_id}
                            </p>
                            <p className="font-medium text-slate-900">
                              {formatDate(entry.business_date)}
                            </p>
                            <p className="text-sm text-slate-500">
                              {formatTime(entry.logged_at)}
                            </p>
                          </div>
                        </td>
                        <td
                          className={`${rowClass} border-r border-slate-200/80 bg-white px-4 py-4 text-sm text-slate-600`}
                        >
                          <div className="min-w-[140px] space-y-1">
                            <p className="font-medium text-slate-900">
                              {entry.seller_name}
                            </p>
                            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                              {entry.seller_code || "No code"}
                            </p>
                          </div>
                        </td>
                        <td
                          className={`${rowClass} border-r border-slate-200/80 bg-white px-4 py-4 text-sm text-slate-600`}
                        >
                          {entry.customer_name}
                        </td>
                        <td
                          className={`${rowClass} border-r border-slate-200/80 bg-white px-4 py-4`}
                        >
                          <div className="min-w-[170px]">
                            <p className="text-sm font-semibold text-slate-900">
                              {entry.product_summary}
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                              {entry.item_count} item
                              {entry.item_count === 1 ? "" : "s"}
                            </p>
                          </div>
                        </td>
                        <td
                          className={`${rowClass} border-r border-slate-200/80 bg-white px-4 py-4 text-sm text-slate-600 whitespace-nowrap`}
                        >
                          {formatQuantity(entry.quantity_total)}
                        </td>
                        <td
                          className={`${rowClass} border-r border-slate-200/80 bg-white px-4 py-4 text-sm font-semibold text-slate-900 whitespace-nowrap`}
                        >
                          {formatCurrency(entry.amount)}
                        </td>
                        <td
                          className={`${rowClass} border-r border-slate-200/80 bg-white px-4 py-4`}
                        >
                          <StatusBadge
                            label={entry.status_label}
                            tone={entry.status_tone}
                          />
                        </td>
                        <td
                          className={`${rowClass} rounded-br-2xl border-r border-slate-200/80 bg-white px-4 py-4 text-center`}
                        >
                          <button
                            type="button"
                            onClick={() => setSelectedSaleId(entry.id)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800"
                            aria-label={`View ${entry.sale_id}`}
                            title={`View ${entry.sale_id}`}
                          >
                            <Eye className="h-4 w-4" />
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
      </div>

      {selectedSaleId ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/32 px-4 py-6 backdrop-blur-sm">
          <div className="panel scrollbar-hidden flex h-[90vh] w-full max-w-4xl flex-col overflow-hidden p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">
                  Sale details
                </p>
                <h2 className="text-2xl font-semibold text-slate-950">
                  {selectedDetail?.entry.sale_id ?? "Loading sale"}
                </h2>
                <p className="text-sm text-slate-500">
                  {selectedDetail?.entry.customer_name ?? "Loading customer"}{" "}
                  purchased{" "}
                  <span className="font-semibold text-slate-900">
                    {formatCurrency(selectedDetail?.entry.amount ?? 0)}
                  </span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSaleId(null)}
                className="rounded-2xl border border-slate-200 bg-white p-2 text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                aria-label="Close sale details"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {detailLoading || !selectedDetail ? (
              <div className="mt-6 flex min-h-0 flex-1 items-center justify-center px-2 py-6">
                <div className="inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-600 shadow-sm">
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Loading sale details...
                </div>
              </div>
            ) : (
              <div className="mt-6 min-h-0 flex-1 space-y-6 overflow-y-auto pr-1">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                      Seller
                    </p>
                    <p className="mt-2 font-semibold text-slate-900">
                      {selectedDetail.entry.seller_name}
                    </p>
                    <p className="text-sm text-slate-500">
                      {selectedDetail.entry.seller_code || "No seller code"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                      Payment
                    </p>
                    <div className="mt-2">
                      <PaymentBadge
                        label={selectedDetail.entry.payment_method_label}
                      />
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                      Date & time
                    </p>
                    <p className="mt-2 font-semibold text-slate-900">
                      {formatDate(selectedDetail.entry.business_date)}
                    </p>
                    <p className="text-sm text-slate-500">
                      {formatTime(selectedDetail.entry.logged_at)}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                      Status
                    </p>
                    <div className="mt-2">
                      <StatusBadge
                        label={selectedDetail.entry.status_label}
                        tone={selectedDetail.entry.status_tone}
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-slate-950">
                        Client purchase
                      </p>
                      <p className="text-sm text-slate-500">
                        What the client purchased in this sale.
                      </p>
                    </div>
                    <p className="text-lg font-semibold text-slate-950">
                      {formatCurrency(selectedDetail.entry.amount)}
                    </p>
                  </div>
                  <div className="mt-4 space-y-3">
                    {selectedDetail.items.map((item: OrderItemRecord) => (
                      <div
                        key={item.id}
                        className="flex items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3"
                      >
                        <div>
                          <p className="font-medium text-slate-900">
                            {item.product_name || item.finished_product_name}
                          </p>
                          <p className="text-sm text-slate-500">
                            Qty {formatQuantity(Number(item.quantity || 0))} ×{" "}
                            {formatCurrency(Number(item.unit_price || 0))}
                          </p>
                        </div>
                        <p className="font-semibold text-slate-900">
                          {formatCurrency(Number(item.line_total || 0))}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 p-5">
                  <p className="text-lg font-semibold text-slate-950">
                    Delivery notes
                  </p>
                  <div className="mt-4 space-y-3">
                    {selectedDetail.deliveries.length ? (
                      selectedDetail.deliveries.map(
                        (delivery: DeliveryRecord) => (
                          <div
                            key={delivery.id}
                            className="rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <p className="font-medium text-slate-900">
                                {delivery.recipient_name ||
                                  "Recipient not recorded"}
                              </p>
                              <p className="text-sm text-slate-500">
                                {formatDate(delivery.delivery_date)}
                              </p>
                            </div>
                            <p className="mt-1 text-sm text-slate-500">
                              {titleCase(delivery.delivery_status)}
                            </p>
                            <p className="mt-2 text-sm text-slate-600">
                              {delivery.delivery_note ||
                                "No delivery note added."}
                            </p>
                          </div>
                        ),
                      )
                    ) : (
                      <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-5 text-sm text-slate-500">
                        No delivery record has been linked to this sale yet.
                      </div>
                    )}
                  </div>
                </div>

                {selectedDetail.order.notes ? (
                  <div className="rounded-3xl border border-slate-200 p-5">
                    <p className="text-lg font-semibold text-slate-950">
                      Notes
                    </p>
                    <p className="mt-3 text-sm leading-7 text-slate-600">
                      {selectedDetail.order.notes}
                    </p>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
