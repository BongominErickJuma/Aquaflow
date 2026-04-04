import { motion } from "framer-motion";
import {
  AlertTriangle,
  Factory,
  Gauge,
  LoaderCircle,
  Maximize2,
  RefreshCw,
  TrendingUp,
  Waves,
  X,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "../features/auth/AuthProvider";
import { ApiError } from "../lib/api/auth";
import {
  fetchDashboardOverview,
  runDashboardAnalytics,
} from "../lib/api/dashboard";
import type { DashboardOverviewResponse, SeverityTone } from "../types/dashboard";

function WindowCard({
  children,
  className = "",
  delay = 0,
  onExpand,
  expandLabel = "Expand card",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  onExpand?: () => void;
  expandLabel?: string;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.26, delay, ease: "easeOut" }}
      className={[
        "group relative min-h-0 overflow-hidden border border-slate-200/80 bg-white shadow-[0_14px_32px_rgba(15,23,42,0.06)]",
        onExpand ? "cursor-pointer" : "",
        className,
      ].join(" ")}
      onClick={onExpand}
    >
      {onExpand ? (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onExpand();
          }}
          aria-label={expandLabel}
          className="absolute right-3 top-3 z-10 inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white/95 text-slate-500 opacity-0 shadow-sm transition hover:border-slate-300 hover:text-slate-900 group-hover:opacity-100"
        >
          <Maximize2 className="h-4 w-4" />
        </button>
      ) : null}
      {children}
    </motion.section>
  );
}

function DashboardModal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/28 px-4 py-6 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-[28px] border border-white/70 bg-[#f8fbfe] p-6 shadow-[0_30px_100px_rgba(15,23,42,0.22)]">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Dashboard Detail
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
            aria-label="Close expanded dashboard card"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function TinyStat({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="border border-slate-200/80 bg-slate-50/70 px-3 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-[1.6rem] font-semibold text-slate-950">{value}</p>
      <p className="mt-1 text-xs leading-5 text-slate-500">{note}</p>
    </div>
  );
}

function MiniRing({
  label,
  value,
  tone,
  displayValue,
  suffix = "%",
}: {
  label: string;
  value: number;
  tone: SeverityTone;
  displayValue?: string;
  suffix?: string;
}) {
  const safeValue = Math.max(0, Math.min(value, 100));
  const color =
    tone === "high" ? "#ef4444" : tone === "medium" ? "#f59e0b" : "#0284c7";

  return (
    <div className="flex flex-col items-center border border-slate-200/80 bg-white px-3 py-4">
      <div
        className="relative flex h-20 w-20 items-center justify-center"
        style={{
          background: `conic-gradient(${color} 0deg ${safeValue * 3.6}deg, #e8edf5 0deg 360deg)`,
        }}
      >
        <div className="absolute inset-[8px] bg-white" />
        <div className="relative text-center">
          <p className="text-lg font-semibold text-slate-950">
            {displayValue ?? `${Math.round(safeValue)}${suffix}`}
          </p>
        </div>
      </div>
      <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
        {label}
      </p>
    </div>
  );
}

function ListMetric({
  title,
  value,
  detail,
  tone,
}: {
  title: string;
  value: string;
  detail: string;
  tone: SeverityTone;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-slate-200/80 py-2.5 last:border-b-0 last:pb-0">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <p className="mt-1 text-[11px] leading-4 text-slate-500">{detail}</p>
      </div>
      <div
        className={[
          "shrink-0 border px-2 py-0.5 text-xs font-semibold",
          tone === "high"
            ? "border-red-200 bg-red-50 text-red-700"
            : tone === "medium"
              ? "border-amber-200 bg-amber-50 text-amber-700"
              : "border-slate-200 bg-slate-50 text-slate-700",
        ].join(" ")}
      >
        {value}
      </div>
    </div>
  );
}

function SignalBar({
  label,
  value,
  color,
  softColor,
  compact = false,
}: {
  label: string;
  value: number;
  color: string;
  softColor: string;
  compact?: boolean;
}) {
  const safeValue = Math.max(0, Math.min(value, 100));

  return (
    <div className={compact ? "space-y-1.5" : "space-y-2"}>
      <div className="flex items-center justify-between gap-3">
        <p
          className={[
            "font-semibold text-slate-700",
            compact ? "text-xs" : "text-sm",
          ].join(" ")}
        >
          {label}
        </p>
        <p
          className={[
            "shrink-0 font-semibold text-slate-950",
            compact ? "text-xs" : "text-sm",
          ].join(" ")}
        >
          {Math.round(safeValue)}%
        </p>
      </div>
      <div
        className={[
          "overflow-hidden rounded-full border border-slate-200/80 bg-slate-100/90",
          compact ? "h-2.5" : "h-3.5",
        ].join(" ")}
      >
        <div
          className="h-full rounded-full"
          style={{
            width: `${safeValue}%`,
            minWidth: safeValue > 0 ? (compact ? "10px" : "14px") : "0px",
            background: `linear-gradient(90deg, ${softColor}, ${color})`,
          }}
        />
      </div>
    </div>
  );
}

function formatGeneratedAt(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Awaiting analytics";
  }

  return new Intl.DateTimeFormat("en-UG", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(parsed);
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
    maximumFractionDigits: 2,
  }).format(numericValue);
}

function toNumber(value: string | number | null | undefined) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  const parsed = Number.parseFloat(value ?? "0");
  return Number.isFinite(parsed) ? parsed : 0;
}

function getTodayIsoDate() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

export function DashboardPage() {
  const { user } = useAuth();
  const [overview, setOverview] = useState<DashboardOverviewResponse | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [refreshDate, setRefreshDate] = useState(getTodayIsoDate());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const isAdmin =
    user?.role.code === "admin" || user?.role.code === "superuser";

  async function loadOverview() {
    setIsLoading(true);
    setPageError("");

    try {
      const nextOverview = await fetchDashboardOverview();
      setOverview(nextOverview);
    } catch (error) {
      if (error instanceof ApiError) {
        setPageError(error.message);
      } else {
        setPageError("Unable to load analytics right now.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      setIsLoading(true);
      setPageError("");

      try {
        const nextOverview = await fetchDashboardOverview();
        if (isMounted) {
          setOverview(nextOverview);
        }
      } catch (error) {
        if (!isMounted) {
          return;
        }

        if (error instanceof ApiError) {
          setPageError(error.message);
        } else {
          setPageError("Unable to load analytics right now.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void bootstrap();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleRefreshAnalytics() {
    try {
      setIsRefreshing(true);
      await runDashboardAnalytics(refreshDate);
      await loadOverview();
    } catch {
      // Tooltip feedback will replace inline messages for refresh state.
    } finally {
      setIsRefreshing(false);
    }
  }

  const combined = overview?.combined;
  const production = overview?.production;
  const sales = overview?.sales;
  const finance = overview?.finance;
  const inventory = overview?.inventory;
  const business = overview?.business;

  const companyName =
    business?.context.company_names?.[0] || "IBMS Ice Ltd";
  const generatedAt =
    combined?.updated_at ||
    production?.updated_at ||
    sales?.updated_at ||
    finance?.updated_at ||
    inventory?.updated_at ||
    business?.updated_at ||
    "";
  const adminRefreshControl = isAdmin ? (
    <div
      className="border border-slate-200/80 bg-white/80 px-3 py-3"
      onClick={(event) => event.stopPropagation()}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
        Analytics Refresh
      </p>
      <div className="mt-2 flex items-center gap-2">
        <input
          type="date"
          value={refreshDate}
          onChange={(event) => setRefreshDate(event.target.value)}
          className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-700 outline-none focus:border-sky-300"
        />
        <button
          type="button"
          onClick={() => void handleRefreshAnalytics()}
          disabled={isRefreshing}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-transparent text-slate-600 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-70"
          aria-label="Refresh analytics for selected date"
          title="Refresh analytics"
        >
          {isRefreshing ? (
            <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
          ) : null}
          {!isRefreshing ? <RefreshCw className="h-3.5 w-3.5" /> : null}
        </button>
      </div>
    </div>
  ) : null;

  if (isLoading) {
    return (
      <section className="panel flex h-full min-h-[320px] items-center justify-center p-8">
        <p className="text-sm text-slate-600">Loading analytics dashboard...</p>
      </section>
    );
  }

  if (pageError) {
    return (
      <section className="panel flex h-full min-h-[420px] items-center overflow-hidden bg-[linear-gradient(135deg,#ffffff_0%,#f6f9fc_58%,#eef5fb_100%)] p-8">
        <div className="grid w-full gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="section-label">Analytics Dashboard</p>
            <h1 className="mt-3 text-3xl font-semibold text-slate-950">
              We could not load the saved dashboard snapshot
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
              The analytics page is ready, but the latest snapshot could not be
              loaded right now.
            </p>
          </div>

          <div className="border border-red-200 bg-red-50 px-5 py-4 text-sm leading-6 text-red-700">
            {pageError}
          </div>
        </div>
      </section>
    );
  }

  if (!combined) {
    return (
      <section className="panel flex h-full min-h-[420px] items-center overflow-hidden bg-[linear-gradient(135deg,#ffffff_0%,#f6fafe_52%,#edf6fd_100%)] p-8">
        <div className="grid w-full gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="section-label">Analytics Dashboard</p>
            <h1 className="mt-3 text-3xl font-semibold text-slate-950">
              No saved analytics snapshot yet
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
              This dashboard reads from saved analytics summaries. Once the
              aggregation command runs, the production, sales, finance, and
              inventory signals will appear here in one place.
            </p>
          </div>

          <div className="grid gap-3">
            {adminRefreshControl ?? (
              <div className="border border-slate-200/80 bg-white/80 px-4 py-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Next Step
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-950">
                  Ask an admin to refresh analytics
                </p>
              </div>
            )}
            <div className="border border-sky-200 bg-sky-50 px-4 py-4 text-sm leading-6 text-sky-800">
              No saved analytics snapshot is available yet. Once an admin
              refreshes analytics for a date, this page will fill automatically.
            </div>
          </div>
        </div>
      </section>
    );
  }

  const dueMaintenance =
    combined.dashboard_context.production?.due_maintenance_schedules ?? 0;
  const openDowntime =
    combined.dashboard_context.production?.open_downtime_alerts ??
    production?.context.open_downtime_alerts ??
    0;
  const complianceWatch =
    (combined.dashboard_context.compliance?.failed_hygiene_checks ?? 0) +
    (combined.dashboard_context.compliance?.failed_water_tests ?? 0) +
    (combined.dashboard_context.compliance?.open_safety_records ?? 0) +
    (combined.dashboard_context.compliance?.documents_expiring_soon ?? 0);
  const lowStockItems = inventory?.low_stock_items ?? [];
  const topClient =
    combined.dashboard_context.sales?.top_clients?.[0] ?? sales?.top_clients?.[0] ?? null;

  const efficiency = toNumber(combined.production_efficiency_pct);
  const availability = toNumber(
    combined.dashboard_context.production?.availability_pct ??
      production?.operational_availability_pct,
  );
  const collectionRate = toNumber(finance?.collection_rate_pct);
  const maintenanceRate = toNumber(
    combined.dashboard_context.production?.maintenance_completion_rate_pct ??
      production?.maintenance_completion_rate_pct,
  );
  const deliveryRate =
    (combined.dashboard_context.sales?.total_orders ?? sales?.total_orders ?? 0) > 0
      ? (
          ((combined.dashboard_context.sales?.delivered_orders ?? sales?.delivered_orders ?? 0) /
            (combined.dashboard_context.sales?.total_orders ?? sales?.total_orders ?? 1)) *
          100
        )
      : 0;
  const stockHealth = toNumber(combined.dashboard_context.inventory?.stock_health_pct);
  const totalSales = toNumber(combined.total_sales_amount);
  const revenue = toNumber(combined.revenue_amount);
  const profit = toNumber(combined.profit_estimate);
  const overdueInvoices = combined.overdue_invoice_count;
  const activeMachines = production?.active_machines ?? 0;
  const expiringLicenses =
    combined.dashboard_context.business?.expiring_license_count ?? 0;
  const activeLicenses =
    combined.dashboard_context.business?.active_license_count ??
    business?.active_license_count ??
    0;
  const expiredLicenses =
    combined.dashboard_context.business?.expired_license_count ?? 0;
  const activeKpis = combined.active_kpi_count;
  const utilityCost = toNumber(
    combined.dashboard_context.production?.utility_total_cost ?? production?.utility_total_cost,
  );
  const finishedGoodsLines = inventory?.finished_goods_item_count ?? 0;
  const paidInvoices =
    combined.dashboard_context.finance?.paid_invoices ?? finance?.paid_invoices ?? 0;
  const totalInvoices = finance?.total_invoices ?? 0;
  const totalCosts = toNumber(
    combined.dashboard_context.finance?.total_cost_amount ?? finance?.total_cost_amount,
  );
  const activeInsurance = finance?.context.active_insurance_records ?? 0;
  const openSafetyRecords =
    combined.dashboard_context.compliance?.open_safety_records ?? 0;
  const totalTrackedLicenses = activeLicenses + expiringLicenses + expiredLicenses;
  const expiredLicenseRate =
    totalTrackedLicenses > 0 ? (expiredLicenses / totalTrackedLicenses) * 100 : 0;
  const openSafetyRate =
    complianceWatch > 0 ? (openSafetyRecords / complianceWatch) * 100 : 0;

  const chartBars = [
    {
      label: "Efficiency",
      value: efficiency,
      color: "#0369a1",
      softColor: "#bae6fd",
      formula: "Usage hours / (usage hours + downtime hours)",
    },
    {
      label: "Available",
      value: availability,
      color: "#0284c7",
      softColor: "#dbeafe",
      formula: "Operational machines / active machines",
    },
    {
      label: "Collection",
      value: collectionRate,
      color: "#0891b2",
      softColor: "#cffafe",
      formula: "Receipts collected / recognized invoiced amount",
    },
    {
      label: "Delivery",
      value: deliveryRate,
      color: "#2563eb",
      softColor: "#c7d2fe",
      formula: "Completed non-cancelled orders / all non-cancelled orders",
    },
    {
      label: "Stock",
      value: stockHealth,
      color: "#0ea5e9",
      softColor: "#e0f2fe",
      formula: "Stock items above reorder level / total tracked stock items",
    },
    {
      label: "Maintenance",
      value: maintenanceRate,
      color: "#475569",
      softColor: "#e2e8f0",
      formula: "Completed maintenance logs / all maintenance logs",
    },
  ];
  const renderExpandedCard = () => {
    switch (expandedCard) {
      case "header":
        return (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
            <div className="border border-slate-200/80 bg-white p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Analytics Dashboard
              </p>
              <h3 className="mt-3 text-2xl font-semibold text-slate-950">
                {companyName}
              </h3>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                Saved cross-module analytics for operations, finance, sales, and inventory decisions.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <TinyStat
                label="Snapshot"
                value={formatGeneratedAt(generatedAt)}
                note="latest saved run"
              />
              <TinyStat
                label="Profit Estimate"
                value={formatAmount(profit)}
                note="current analytics view"
              />
              {isAdmin ? (
                <div className="border border-slate-200/80 bg-white p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Analytics Refresh
                  </p>
                  <div
                    className="mt-3 flex items-center gap-2"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <input
                      type="date"
                      value={refreshDate}
                      onChange={(event) => setRefreshDate(event.target.value)}
                      className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-sky-300"
                    />
                    <button
                      type="button"
                      onClick={() => void handleRefreshAnalytics()}
                      disabled={isRefreshing}
                      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-transparent text-slate-600 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-70"
                      aria-label="Refresh analytics for selected date"
                    >
                      {isRefreshing ? (
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <TinyStat
                  label="Active Attention"
                  value={`${combined.low_stock_alert_count + dueMaintenance + overdueInvoices}`}
                  note="queue items to watch"
                />
              )}
            </div>
          </div>
        );
      case "revenue":
        return (
          <div className="grid gap-4 lg:grid-cols-[0.9fr_1fr_0.9fr]">
            <div className="border border-slate-200/80 bg-white p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Revenue Snapshot
              </p>
              <p className="mt-3 text-4xl font-semibold text-slate-950">
                {formatAmount(revenue)}
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                Recognized revenue in the latest saved snapshot.
              </p>
            </div>
            <div className="border border-slate-200/80 bg-slate-50/70 p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Billing detail
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Invoice settlement and cost markers from the saved analytics snapshot.
                  </p>
                </div>
                <TrendingUp className="h-5 w-5 text-emerald-500" />
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <TinyStat
                  label="Paid"
                  value={`${paidInvoices}/${totalInvoices}`}
                  note="invoices settled"
                />
                <TinyStat
                  label="Costs"
                  value={formatAmount(totalCosts)}
                  note="saved total costs"
                />
                <TinyStat
                  label="Cover"
                  value={`${activeInsurance}`}
                  note="active insurance record(s)"
                />
              </div>
            </div>
            <div className="border border-slate-200/80 bg-[linear-gradient(180deg,#f7fbff,#edf4fb)] p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Efficiency pulse
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Production efficiency from the latest saved summary.
                  </p>
                </div>
                <Gauge className="h-5 w-5 text-sky-600" />
              </div>
              <div className="mt-6 flex items-center justify-center">
                <div className="relative flex h-32 w-32 items-center justify-center border border-sky-100 bg-white">
                  <div className="absolute inset-4 border border-sky-50" />
                  <div className="text-center">
                    <p className="text-3xl font-semibold text-slate-950">
                      {Math.round(efficiency)}%
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">
                      efficiency
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-5 flex items-center justify-between gap-3 border border-slate-200/80 bg-white px-3 py-3">
                <p className="text-sm font-medium text-slate-500">
                  Operational availability
                </p>
                <p className="text-base font-semibold text-slate-950">
                  {Math.round(availability)}%
                </p>
              </div>
            </div>
          </div>
        );
      case "growth":
        return (
          <div className="grid gap-4">
            <div className="flex items-start justify-between gap-4 border border-slate-200/80 bg-white p-5">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Performance Signals
                </p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">
                  6 live signals
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  A simple read of the strongest and weakest operational signals across operations.
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Utilized metrics
                </p>
              </div>
            </div>
              <div className="border border-slate-200/80 bg-white p-5">
                <div className="grid gap-4 md:grid-cols-2">
                  {chartBars.map((bar) => (
                    <div
                      key={bar.label}
                      className="border border-slate-200/80 bg-slate-50/70 px-4 py-3"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <p className="text-sm font-semibold text-slate-900">
                          {bar.label} ({bar.formula})
                        </p>
                        <p className="shrink-0 text-sm font-semibold text-slate-950">
                          {Math.round(bar.value)}%
                        </p>
                      </div>
                      <div className="mt-3 overflow-hidden rounded-full border border-slate-200/80 bg-slate-100/90">
                        <div
                          className="h-3.5 rounded-full"
                          style={{
                            width: `${Math.max(0, Math.min(bar.value, 100))}%`,
                            minWidth:
                              Math.max(0, Math.min(bar.value, 100)) > 0
                                ? "14px"
                                : "0px",
                            background: `linear-gradient(90deg, ${bar.softColor}, ${bar.color})`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
          </div>
        );
      case "status":
        return (
          <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="border border-slate-200/80 bg-white p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Quick Status
                  </p>
                  <p className="mt-1 text-lg font-semibold text-slate-950">
                    Internal signals
                  </p>
                </div>
                <Waves className="h-5 w-5 text-slate-300" />
              </div>
              <div className="mt-5 grid grid-cols-2 gap-4">
                <MiniRing
                  label="Expired Licenses"
                  value={expiredLicenseRate}
                  displayValue={`${expiredLicenses}`}
                  suffix=""
                  tone={expiredLicenses > 0 ? "medium" : "low"}
                />
                <MiniRing
                  label="Open Safety"
                  value={openSafetyRate}
                  displayValue={`${openSafetyRecords}`}
                  suffix=""
                  tone={openSafetyRecords > 0 ? "medium" : "low"}
                />
              </div>
            </div>
            <div className="border border-slate-200/80 bg-white p-5">
              <div className="grid gap-2">
                <ListMetric
                  title="Overdue invoices"
                  value={`${overdueInvoices}`}
                  detail="Invoices still pending collection follow-up."
                  tone={overdueInvoices > 0 ? "medium" : "low"}
                />
                <ListMetric
                  title="Maintenance due"
                  value={`${dueMaintenance}`}
                  detail="Schedules waiting for action from production."
                  tone={dueMaintenance > 0 ? "medium" : "low"}
                />
                <ListMetric
                  title="Low-stock alerts"
                  value={`${combined.low_stock_alert_count}`}
                  detail="Inventory items under reorder level."
                  tone={lowStockItems.length > 0 ? "high" : "low"}
                />
              </div>
            </div>
          </div>
        );
      case "overview":
        return (
          <div className="border border-slate-200/80 bg-white p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Operations Overview
                </p>
                <p className="mt-1 text-lg font-semibold text-slate-950">
                  Module pulse
                </p>
              </div>
              <Factory className="h-5 w-5 text-slate-300" />
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <TinyStat
                label="Business"
                value={`${activeKpis}`}
                note={`${expiringLicenses} expiring licenses`}
              />
              <TinyStat
                label="Production"
                value={`${activeMachines}`}
                note={`${dueMaintenance} maintenance due`}
              />
              <TinyStat
                label="Finance"
                value={`${totalInvoices}`}
                note={`${overdueInvoices} overdue invoices`}
              />
              <TinyStat
                label="Compliance"
                value={`${openSafetyRecords}`}
                note="open safety records"
              />
            </div>
          </div>
        );
      case "queue":
        return (
          <div className="border border-slate-200/80 bg-white p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Current Queue
                </p>
                <p className="mt-1 text-lg font-semibold text-slate-950">
                  Active follow-ups
                </p>
              </div>
              <AlertTriangle className="h-5 w-5 text-slate-300" />
            </div>
            <div className="mt-5 grid gap-2">
              <ListMetric
                title="Open downtime"
                value={`${openDowntime}`}
                detail="Production interruptions still unresolved."
                tone={openDowntime > 0 ? "medium" : "low"}
              />
                <ListMetric
                  title="Compliance follow-up"
                  value={`${complianceWatch}`}
                  detail="Compliance-related items that still need attention."
                  tone={complianceWatch > 0 ? "medium" : "low"}
                />
                <ListMetric
                  title="Utility cost"
                  value={formatAmount(utilityCost)}
                  detail="Water and electricity cost accumulated up to this analytics date."
                  tone={utilityCost > 0 ? "low" : "medium"}
                />
                <ListMetric
                  title="Finished product lines"
                  value={`${finishedGoodsLines}`}
                  detail="Tracked finished-product stock lines in inventory."
                  tone={finishedGoodsLines > 0 ? "low" : "medium"}
                />
            </div>
          </div>
        );
      case "highlights":
        return (
          <div className="border border-slate-200/80 bg-white p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Highlights
                </p>
                <p className="mt-1 text-lg font-semibold text-slate-950">
                  Snapshot notes
                </p>
              </div>
              <TrendingUp className="h-5 w-5 text-slate-300" />
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <div className="border border-slate-200/80 bg-slate-50/70 p-4">
                <p className="text-sm font-semibold text-slate-900">
                  {topClient?.client_name || "No top client yet"}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {topClient
                    ? `${topClient.order_count} order(s) contributing ${formatAmount(topClient.total_amount)}.`
                    : "Sales analytics has not produced a top-client signal yet."}
                </p>
              </div>
              <div className="border border-slate-200/80 bg-slate-50/70 p-4">
                <p className="text-sm font-semibold text-slate-900">
                  Profit estimate
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {formatAmount(profit)} based on {formatAmount(totalSales)} sales and {formatAmount(revenue)} recognized revenue.
                </p>
              </div>
              <div className="border border-slate-200/80 bg-slate-50/70 p-4">
                <p className="text-sm font-semibold text-slate-900">
                  Inventory watch
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {lowStockItems.length > 0
                    ? `${lowStockItems[0]?.item_name} is currently leading the low-stock list.`
                    : "No low-stock item is leading the queue right now."}
                </p>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-3 overflow-hidden">
        <WindowCard
          delay={0}
          className="bg-[linear-gradient(180deg,#ffffff,#f5f9fd)] px-4 py-4"
        >
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-700/70">
                Analytics Dashboard
              </p>
              <h1 className="mt-1 text-xl font-semibold text-slate-950">
                {companyName}
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Saved cross-module analytics for operations, finance, sales, and inventory decisions.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="border border-slate-200/80 bg-white/80 px-3 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Snapshot Time
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-950">
                  {formatGeneratedAt(generatedAt)}
                </p>
                <p className="mt-1 text-xs text-slate-500">latest saved run</p>
              </div>
              <div className="border border-slate-200/80 bg-white/80 px-3 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Profit Estimate
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-950">
                  {formatAmount(profit)}
                </p>
                <p className="mt-1 text-xs text-slate-500">current analytics view</p>
              </div>
              {adminRefreshControl ? (
                adminRefreshControl
              ) : (
                <div className="border border-slate-200/80 bg-white/80 px-3 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Active Attention
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-950">
                    {combined.low_stock_alert_count + dueMaintenance + overdueInvoices}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">queue items to watch</p>
                </div>
              )}
            </div>
          </div>
        </WindowCard>

        <div className="grid min-h-0 grid-cols-[0.88fr_1.45fr_0.92fr] grid-rows-[minmax(0,1fr)_minmax(0,1fr)] gap-3 overflow-hidden">
            <WindowCard
              delay={0.05}
              className="p-3"
              onExpand={() => setExpandedCard("revenue")}
              expandLabel="Expand revenue snapshot"
            >
              <div className="grid h-full min-h-0 grid-rows-[auto_auto_auto] gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Revenue Snapshot
                  </p>
                    <p className="mt-2 text-[1.75rem] font-semibold text-slate-950">
                     {formatAmount(revenue)}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                     Recognized revenue in the latest saved snapshot.
                    </p>
                  </div>

                  <div className="border border-slate-200/80 bg-slate-50/70 p-2.5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold text-slate-900">
                          Billing detail
                        </p>
                        <p className="mt-1 text-[11px] leading-4 text-slate-500">
                          Invoice settlement and cost markers from the saved analytics snapshot.
                        </p>
                      </div>
                      <TrendingUp className="h-4 w-4 text-emerald-500" />
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <div className="border border-slate-200/80 bg-white px-2 py-2">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                          Paid
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-950">
                          {paidInvoices}/{totalInvoices}
                        </p>
                        <p className="mt-1 text-[10px] leading-4 text-slate-500">
                          settled
                        </p>
                      </div>
                      <div className="border border-slate-200/80 bg-white px-2 py-2">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                          Costs
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-950">
                          {formatAmount(totalCosts)}
                        </p>
                        <p className="mt-1 text-[10px] leading-4 text-slate-500">
                          saved total
                        </p>
                      </div>
                      <div className="border border-slate-200/80 bg-white px-2 py-2">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                          Cover
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-950">
                          {activeInsurance}
                        </p>
                        <p className="mt-1 text-[10px] leading-4 text-slate-500">
                          active policies
                        </p>
                      </div>
                    </div>
                  </div>

                <div className="grid min-h-0 content-between border border-slate-200/80 bg-[linear-gradient(180deg,#f7fbff,#edf4fb)] p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Efficiency pulse
                      </p>
                      <p className="mt-1 text-[11px] leading-4 text-slate-500">
                        Production efficiency from the latest saved summary.
                      </p>
                    </div>
                    <Gauge className="h-4 w-4 text-sky-600" />
                  </div>
                  <div className="mt-4 flex items-center justify-center">
                    <div className="relative flex h-24 w-24 items-center justify-center border border-sky-100 bg-white">
                      <div className="absolute inset-3 border border-sky-50" />
                      <div className="text-center">
                        <p className="text-[1.65rem] font-semibold text-slate-950">
                          {Math.round(efficiency)}%
                        </p>
                        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">
                          efficiency
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-3 border border-slate-200/80 bg-white px-2.5 py-2">
                    <p className="text-[11px] font-medium text-slate-500">
                      Operational availability
                    </p>
                    <p className="text-sm font-semibold text-slate-950">
                      {Math.round(availability)}%
                    </p>
                  </div>
                </div>
              </div>
            </WindowCard>

            <WindowCard
              delay={0.1}
              className="p-4"
              onExpand={() => setExpandedCard("growth")}
              expandLabel="Expand growth metrics"
            >
              <div className="grid h-full min-h-0 grid-rows-[auto_auto_minmax(0,1fr)] gap-4">
                <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Performance Signals
                      </p>
                      <p className="mt-2 text-[1.55rem] font-semibold text-slate-950">
                        6 live signals
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        A simple read of the strongest and weakest operational signals across operations.
                      </p>
                    </div>
                  <div className="text-right">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Utilized metrics
                    </p>
                  </div>
                </div>

                  <div className="grid min-h-0 content-start gap-3">
                    {chartBars.map((bar) => (
                      <SignalBar
                        key={bar.label}
                        label={bar.label}
                        value={bar.value}
                        color={bar.color}
                        softColor={bar.softColor}
                        compact
                      />
                    ))}
                  </div>
                </div>
              </WindowCard>

            <WindowCard
              delay={0.15}
              className="p-4"
              onExpand={() => setExpandedCard("status")}
              expandLabel="Expand quick status"
            >
              <div className="grid h-full min-h-0 grid-rows-[auto_auto_minmax(0,1fr)] gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Quick Status
                    </p>
                    <p className="mt-1 text-base font-semibold text-slate-950">
                      Internal signals
                    </p>
                  </div>
                  <Waves className="h-4 w-4 text-slate-300" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <MiniRing
                    label="Expired Licenses"
                    value={expiredLicenseRate}
                    displayValue={`${expiredLicenses}`}
                    suffix=""
                    tone={expiredLicenses > 0 ? "medium" : "low"}
                  />
                  <MiniRing
                    label="Open Safety"
                    value={openSafetyRate}
                    displayValue={`${openSafetyRecords}`}
                    suffix=""
                    tone={openSafetyRecords > 0 ? "medium" : "low"}
                  />
                </div>

                <div className="grid min-h-0 content-start gap-1">
                  <ListMetric
                    title="Overdue invoices"
                    value={`${overdueInvoices}`}
                    detail="Invoices still pending collection follow-up."
                    tone={overdueInvoices > 0 ? "medium" : "low"}
                  />
                  <ListMetric
                    title="Maintenance due"
                    value={`${dueMaintenance}`}
                    detail="Schedules waiting for action from production."
                    tone={dueMaintenance > 0 ? "medium" : "low"}
                  />
                  <ListMetric
                    title="Low-stock alerts"
                    value={`${combined.low_stock_alert_count}`}
                    detail="Inventory items under reorder level."
                    tone={lowStockItems.length > 0 ? "high" : "low"}
                  />
                </div>
              </div>
            </WindowCard>

            <WindowCard
              delay={0.2}
              className="p-4"
              onExpand={() => setExpandedCard("overview")}
              expandLabel="Expand operations overview"
            >
              <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Operations Overview
                    </p>
                    <p className="mt-1 text-base font-semibold text-slate-950">
                      Module pulse
                    </p>
                  </div>
                  <Factory className="h-4 w-4 text-slate-300" />
                </div>

                <div className="grid min-h-0 grid-cols-2 gap-3">
                  <TinyStat
                    label="Business"
                    value={`${activeKpis}`}
                    note={`${expiringLicenses} expiring licenses`}
                  />
                  <TinyStat
                    label="Production"
                    value={`${activeMachines}`}
                    note={`${dueMaintenance} maintenance due`}
                  />
                  <TinyStat
                    label="Finance"
                    value={`${totalInvoices}`}
                    note={`${overdueInvoices} overdue invoices`}
                  />
                  <TinyStat
                    label="Compliance"
                    value={`${openSafetyRecords}`}
                    note="open safety records"
                  />
                </div>
              </div>
            </WindowCard>

            <WindowCard
              delay={0.24}
              className="p-3"
              onExpand={() => setExpandedCard("queue")}
              expandLabel="Expand current queue"
            >
              <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-2.5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Current Queue
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-950">
                      Active follow-ups
                    </p>
                  </div>
                  <AlertTriangle className="h-4 w-4 text-slate-300" />
                </div>

                <div className="grid min-h-0 content-start gap-0.5">
                  <ListMetric
                    title="Open downtime"
                    value={`${openDowntime}`}
                    detail="Production interruptions still unresolved."
                    tone={openDowntime > 0 ? "medium" : "low"}
                  />
                    <ListMetric
                      title="Compliance follow-up"
                      value={`${complianceWatch}`}
                      detail="Compliance-related items that still need attention."
                      tone={complianceWatch > 0 ? "medium" : "low"}
                    />
                    <ListMetric
                      title="Utility cost"
                      value={formatAmount(utilityCost)}
                      detail="Water and electricity cost accumulated up to this analytics date."
                      tone={utilityCost > 0 ? "low" : "medium"}
                    />
                    <ListMetric
                      title="Finished product lines"
                      value={`${finishedGoodsLines}`}
                      detail="Tracked finished-product stock lines in inventory."
                      tone={finishedGoodsLines > 0 ? "low" : "medium"}
                    />
                </div>
              </div>
            </WindowCard>

            <WindowCard
              delay={0.28}
              className="p-4"
              onExpand={() => setExpandedCard("highlights")}
              expandLabel="Expand highlights"
            >
              <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Highlights
                    </p>
                    <p className="mt-1 text-base font-semibold text-slate-950">
                      Snapshot notes
                    </p>
                  </div>
                  <TrendingUp className="h-4 w-4 text-slate-300" />
                </div>

                <div className="grid min-h-0 content-start gap-3">
                  <div className="border border-slate-200/80 bg-slate-50/70 p-3">
                    <p className="text-xs font-semibold text-slate-900">
                      {topClient?.client_name || "No top client yet"}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      {topClient
                        ? `${topClient.order_count} order(s) contributing ${formatAmount(topClient.total_amount)}.`
                        : "Sales analytics has not produced a top-client signal yet."}
                    </p>
                  </div>
                  <div className="border border-slate-200/80 bg-slate-50/70 p-3">
                    <p className="text-xs font-semibold text-slate-900">
                      Profit estimate
                    </p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                       {formatAmount(profit)} based on {formatAmount(totalSales)} sales and {formatAmount(revenue)} recognized revenue.
                      </p>
                    </div>
                  <div className="border border-slate-200/80 bg-slate-50/70 p-3">
                    <p className="text-xs font-semibold text-slate-900">
                      Inventory watch
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      {lowStockItems.length > 0
                        ? `${lowStockItems[0]?.item_name} is currently leading the low-stock list.`
                        : "No low-stock item is leading the queue right now."}
                    </p>
                  </div>
                </div>
              </div>
            </WindowCard>
          </div>
        </div>
        {expandedCard ? (
          <DashboardModal
            title={
              expandedCard === "header"
                ? "Dashboard Summary"
                : expandedCard === "revenue"
                  ? "Revenue Snapshot"
                  : expandedCard === "growth"
                    ? "Annual/Metric Growth"
                    : expandedCard === "status"
                      ? "Quick Status"
                      : expandedCard === "overview"
                        ? "Operations Overview"
                        : expandedCard === "queue"
                          ? "Current Queue"
                          : "Highlights"
            }
            onClose={() => setExpandedCard(null)}
          >
            {renderExpandedCard()}
          </DashboardModal>
        ) : null}
    </div>
  );
}
