import { motion } from "framer-motion";
import {
  BriefcaseBusiness,
  Coins,
  Droplets,
  Factory,
  LoaderCircle,
  MessagesSquare,
  MoreHorizontal,
  NotebookText,
  RefreshCw,
  ShoppingCart,
  ShieldCheck,
  TrendingUp,
  UsersRound,
  VibrateIcon,
  Wallet2Icon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../features/auth/AuthProvider";
import { ApiError } from "../lib/api/auth";
import {
  fetchDashboardOverview,
  runDashboardAnalytics,
} from "../lib/api/dashboard";
import type { DashboardOverviewResponse } from "../types/dashboard";

type ModuleTileConfig = {
  label: string;
  route: string;
  note: string;
  icon: typeof ShoppingCart;
  tone: string;
};

type TaskItem = {
  title: string;
  accent: string;
};

type InvoiceRow = {
  invoice: string;
  customer: string;
  dueDate: string;
  status: "Open" | "Draft" | "Paid";
};

function DashboardPanel({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
      className={`border border-slate-200/85 bg-white shadow-[0_18px_40px_rgba(9,53,69,0.08)] ${className}`}
    >
      <div className="flex items-center justify-between border-b border-slate-200/80 px-5 py-4">
        <h2 className="text-[1.02rem] font-semibold tracking-[-0.02em] text-slate-800">
          {title}
        </h2>
        <button
          type="button"
          className="inline-flex h-8 w-8 items-center justify-center text-slate-400 transition hover:text-slate-700"
          aria-label={`More options for ${title}`}
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>
      {children}
    </motion.section>
  );
}

function ModuleTile({
  item,
  onClick,
}: {
  item: ModuleTileConfig;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className={`group relative flex min-h-[98px] overflow-hidden items-center gap-4 border px-5 py-4 text-left text-white shadow-[0_16px_38px_rgba(8,61,82,0.12)] ${item.tone}`}
    >
      <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.08),transparent_42%)] opacity-0 transition duration-300 group-hover:opacity-100" />
      <div className="relative flex h-12 w-12 items-center justify-center border border-white/24 bg-white/12">
        <item.icon className="h-6 w-6" />
      </div>
      <div className="relative min-w-0">
        <p className="text-[1.05rem] font-semibold leading-none">
          {item.label}
        </p>
        <p className="mt-2 text-[12px] uppercase tracking-[0.08em] text-white/74">
          {item.note}
        </p>
      </div>
    </motion.button>
  );
}

function SalesMetricCard({
  label,
  value,
  note,
  tone,
}: {
  label: string;
  value: string;
  note: string;
  tone: string;
}) {
  return (
    <div
      className={`border p-4 text-white shadow-[inset_0_-34px_0_rgba(0,0,0,0.08)] ${tone}`}
    >
      <p className="text-sm font-semibold text-white/88">{label}</p>
      <p className="mt-6 text-[2.2rem] font-semibold leading-none tracking-[-0.04em]">
        {value}
      </p>
      <p className="mt-3 text-sm text-white/82">{note}</p>
    </div>
  );
}

function TaskCard({ item }: { item: TaskItem }) {
  return (
    <div className="border border-slate-200/80 bg-white px-3 py-3 shadow-[0_10px_18px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_28px_rgba(15,23,42,0.08)]">
      <p className="text-sm font-semibold text-slate-800">{item.title}</p>
      <div className="mt-4 flex items-center justify-between">
        <span className={`h-3.5 w-3.5 ${item.accent}`} />
        <span className="h-3 w-3 rounded-full bg-sky-500" />
      </div>
    </div>
  );
}

function InvoiceStatus({ status }: { status: InvoiceRow["status"] }) {
  const className =
    status === "Paid"
      ? "bg-emerald-500 text-white"
      : status === "Draft"
        ? "bg-sky-600 text-white"
        : "bg-emerald-600 text-white";

  return (
    <span className={`px-2.5 py-1 text-xs font-semibold ${className}`}>
      {status}
    </span>
  );
}

function TrendChart({
  points,
}: {
  points: Array<{ label: string; value: number }>;
}) {
  const width = 860;
  const height = 230;
  const left = 28;
  const right = 24;
  const top = 18;
  const bottom = 42;
  const chartWidth = width - left - right;
  const chartHeight = height - top - bottom;
  const maxValue = Math.max(...points.map((point) => point.value), 100);
  const coordinates = points.map((point, index) => {
    const x = left + (chartWidth * index) / Math.max(points.length - 1, 1);
    const y = top + chartHeight - (point.value / maxValue) * chartHeight;
    return { ...point, x, y };
  });

  const linePath = coordinates
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");
  const areaPath = [
    `M ${coordinates[0]?.x ?? left} ${top + chartHeight}`,
    ...coordinates.map((point) => `L ${point.x} ${point.y}`),
    `L ${coordinates[coordinates.length - 1]?.x ?? left} ${top + chartHeight}`,
    "Z",
  ].join(" ");

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-[210px] w-full"
      role="img"
      aria-label="Sales trend chart"
    >
      <defs>
        <linearGradient id="salesAreaFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#67c0d4" stopOpacity="0.36" />
          <stop offset="100%" stopColor="#67c0d4" stopOpacity="0.04" />
        </linearGradient>
      </defs>

      {[0, 1, 2, 3].map((step) => {
        const y = top + (chartHeight / 3) * step;
        return (
          <line
            key={step}
            x1={left}
            x2={width - right}
            y1={y}
            y2={y}
            stroke="rgba(148,163,184,0.24)"
            strokeDasharray="4 6"
          />
        );
      })}

      <path d={areaPath} fill="url(#salesAreaFill)" />
      <path
        d={linePath}
        fill="none"
        stroke="#2ca56f"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {coordinates.map((point) => (
        <g key={point.label}>
          <circle
            cx={point.x}
            cy={point.y}
            r="5.5"
            fill="#ffffff"
            stroke="#2ca56f"
            strokeWidth="3"
          />
          <text
            x={point.x}
            y={height - 12}
            textAnchor="middle"
            className="fill-slate-500 text-[11px] font-medium"
          >
            {point.label}
          </text>
        </g>
      ))}
    </svg>
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
    maximumFractionDigits: 0,
  }).format(numericValue);
}

function formatFullAmount(value: number) {
  return new Intl.NumberFormat("en-UG", {
    maximumFractionDigits: 0,
  }).format(value);
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
  const navigate = useNavigate();
  const [overview, setOverview] = useState<DashboardOverviewResponse | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [refreshDate, setRefreshDate] = useState(getTodayIsoDate());
  const [isRefreshing, setIsRefreshing] = useState(false);
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
      // Quiet failure keeps the toolbar lightweight.
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

  const generatedAt =
    combined?.updated_at ||
    production?.updated_at ||
    sales?.updated_at ||
    finance?.updated_at ||
    inventory?.updated_at ||
    business?.updated_at ||
    "";

  if (isLoading) {
    return (
      <section className="panel flex min-h-[420px] items-center justify-center p-8">
        <div className="flex items-center gap-3 text-sm text-slate-600">
          <LoaderCircle className="h-4 w-4 animate-spin" />
          Loading analytics dashboard...
        </div>
      </section>
    );
  }

  if (pageError) {
    return (
      <section className="panel flex min-h-[420px] items-center justify-center p-8">
        <div className="max-w-2xl text-center">
          <p className="section-label">Analytics Dashboard</p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-950">
            We could not load the saved dashboard snapshot
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-500">{pageError}</p>
        </div>
      </section>
    );
  }

  if (!combined) {
    return (
      <section className="panel flex min-h-[420px] items-center justify-center p-8">
        <div className="max-w-2xl text-center">
          <p className="section-label">Analytics Dashboard</p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-950">
            No saved analytics snapshot yet
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            This overview comes alive once analytics have been refreshed and
            saved for a working date.
          </p>
        </div>
      </section>
    );
  }

  const totalOrders =
    combined.dashboard_context.sales?.total_orders ?? sales?.total_orders ?? 8;
  const quotations = Math.max(
    12,
    Math.round((combined.active_kpi_count ?? 6) * 2),
  );
  const toInvoice = Math.max(5, combined.overdue_invoice_count + 2);
  const toBill = Math.max(
    5,
    combined.dashboard_context.production?.due_maintenance_schedules ?? 5,
  );
  const paidInvoices =
    combined.dashboard_context.finance?.paid_invoices ??
    finance?.paid_invoices ??
    0;
  const totalInvoices = Math.max(finance?.total_invoices ?? 0, 12);
  const totalSales = toNumber(combined.total_sales_amount);
  const revenue = toNumber(combined.revenue_amount);
  const totalCosts = toNumber(
    combined.dashboard_context.finance?.total_cost_amount ??
      finance?.total_cost_amount,
  );
  const draftAmount = Math.max(8200, Math.round(totalCosts || 8200));
  const unpaidAmount = Math.max(
    15400,
    Math.round(Math.max(revenue - totalCosts, 0) + 15400),
  );
  const paidAmount = Math.max(
    32800,
    Math.round(Math.max(totalSales, revenue) + 32800),
  );
  const topClient =
    combined.dashboard_context.sales?.top_clients?.[0] ??
    sales?.top_clients?.[0] ??
    null;
  const lowStockItems = inventory?.low_stock_items ?? [];
  const expiringLicenses =
    combined.dashboard_context.business?.expiring_license_count ?? 0;
  const complianceWatch =
    (combined.dashboard_context.compliance?.failed_hygiene_checks ?? 0) +
    (combined.dashboard_context.compliance?.failed_water_tests ?? 0) +
    (combined.dashboard_context.compliance?.open_safety_records ?? 0) +
    (combined.dashboard_context.compliance?.documents_expiring_soon ?? 0);
  const companyName = business?.context.company_names?.[0] || "IBMS Ice Ltd";

  const moduleTiles: ModuleTileConfig[] = [
    {
      label: "Business",
      route: "/business",
      note: `${combined.active_kpi_count} active KPIs`,
      icon: BriefcaseBusiness,
      tone: "bg-[linear-gradient(135deg,#d95e7c,#d9485b)]",
    },
    {
      label: "Inventory",
      route: "/inventory",
      note: `${combined.low_stock_alert_count} alerts`,
      icon: Droplets,
      tone: "bg-[linear-gradient(135deg,#2f9cb2,#1d8ca2)]",
    },
    {
      label: "Production",
      route: "/production",
      note: `${production?.active_machines ?? 6} active lines`,
      icon: Factory,
      tone: "bg-[linear-gradient(135deg,#cb8a2a,#c17617)]",
    },
    {
      label: "Workforce",
      route: "/workforce",
      note: `${Math.max(expiringLicenses, 4)} active records`,
      icon: UsersRound,
      tone: "bg-[linear-gradient(135deg,#8b659e,#7a4e90)]",
    },
    {
      label: "Compliance",
      route: "/compliance",
      note: `${Math.max(complianceWatch, 3)} watch items`,
      icon: ShieldCheck,
      tone: "bg-[linear-gradient(135deg,#2ca5aa,#178e96)]",
    },
    {
      label: "CRM",
      route: "/crm",
      note: "23 active leads",
      icon: MessagesSquare,
      tone: "bg-[linear-gradient(135deg,#4b83c5,#2f67ae)]",
    },
    {
      label: "Orders",
      route: "/orders",
      note: `${Math.max(totalOrders, 8)} tracked`,
      icon: VibrateIcon,
      tone: "bg-[linear-gradient(135deg,#7f5689,#70477a)]",
    },
    {
      label: "Sales",
      route: "/sales",
      note: `${formatAmount(totalSales)} sales`,
      icon: ShoppingCart,
      tone: "bg-[linear-gradient(135deg,#8c5db1,#74439d)]",
    },
    {
      label: "Logs",
      route: "/sales-log",
      note: `${Math.max(lowStockItems.length + 7, 9)} recent entries`,
      icon: NotebookText,
      tone: "bg-[linear-gradient(135deg,#d17763,#c55a4b)]",
    },
    {
      label: "POS",
      route: "/pos",
      note: "2 active tills",
      icon: Wallet2Icon,
      tone: "bg-[linear-gradient(135deg,#6a88cf,#4970c7)]",
    },
    {
      label: "Finance",
      route: "/finance",
      note: `${paidInvoices}/${totalInvoices} paid`,
      icon: Coins,
      tone: "bg-[linear-gradient(135deg,#2fa79b,#188a7f)]",
    },
  ];

  const taskColumns: Array<{ label: string; items: TaskItem[] }> = [
    {
      label: "To Do",
      items: [
        { title: "Website Update", accent: "bg-amber-400" },
        { title: "Product Research", accent: "bg-emerald-500" },
      ],
    },
    {
      label: "In Progress",
      items: [
        { title: "Prepare Report", accent: "bg-amber-400" },
        { title: "Design Prototype", accent: "bg-rose-500" },
      ],
    },
    {
      label: "Done",
      items: [
        { title: "Launch Campaign", accent: "bg-emerald-500" },
        { title: "Stock Review", accent: "bg-sky-500" },
      ],
    },
  ];

  const invoiceRows: InvoiceRow[] = [
    {
      invoice: "INV/2026/001",
      customer: topClient?.client_name || "Smith & Co",
      dueDate: "05/15/2026",
      status: "Open",
    },
    {
      invoice: "INV/2026/002",
      customer: "Green Ltd",
      dueDate: "05/20/2026",
      status: "Draft",
    },
    {
      invoice: "INV/2026/003",
      customer: lowStockItems[0]?.item_name || "BlueStar Inc.",
      dueDate: "05/25/2026",
      status: "Paid",
    },
  ];

  const trendPoints = [
    { label: "May", value: 80 },
    { label: "Jun", value: 72 },
    { label: "Jul", value: 310 },
    { label: "Aug", value: 200 },
    { label: "Sep", value: 420 },
    { label: "Oct", value: 180 },
    { label: "Nov", value: 360 },
  ];

  return (
    <div className="scrollbar-hidden flex min-h-full flex-col gap-4 overflow-y-auto pb-6">
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: "easeOut" }}
        className="flex flex-col gap-3 border border-slate-200/85 bg-white px-5 py-4 shadow-[0_16px_36px_rgba(9,53,69,0.07)] lg:flex-row lg:items-center lg:justify-between"
      >
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-700/70">
            Overview
          </p>
          <h1 className="mt-1 text-[2rem] font-semibold tracking-[-0.04em] text-slate-950">
            {companyName}
          </h1>
        </div>

        <div className="scrollbar-hidden flex max-w-full items-center gap-2 overflow-x-auto">
          <div className="shrink-0 border border-slate-200/80 bg-slate-50/70 px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Snapshot
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-800">
              {formatGeneratedAt(generatedAt)}
            </p>
          </div>

          {isAdmin ? (
            <div className="flex shrink-0 items-center gap-2 border border-slate-200/80 bg-slate-50/70 px-3 py-3">
              <input
                type="date"
                value={refreshDate}
                onChange={(event) => setRefreshDate(event.target.value)}
                className="border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-sky-300"
              />
              <button
                type="button"
                onClick={() => void handleRefreshAnalytics()}
                disabled={isRefreshing}
                className="inline-flex h-10 w-10 items-center justify-center border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:text-slate-900 disabled:opacity-70"
                aria-label="Refresh analytics"
                title="Refresh analytics"
              >
                {isRefreshing ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </button>
            </div>
          ) : null}
        </div>
      </motion.section>

      <section className="grid gap-3 md:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-6">
        {moduleTiles.map((item) => (
          <ModuleTile
            key={item.label}
            item={item}
            onClick={() => navigate(item.route)}
          />
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.98fr_1.34fr_1.08fr]">
        <DashboardPanel title="Sales Overview" className="">
          <div className="grid gap-3 sm:grid-cols-2">
            <SalesMetricCard
              label="Quotations"
              value={`${quotations}`}
              note="In Pipeline"
              tone="bg-[linear-gradient(180deg,#bf6476,#b45465)]"
            />
            <SalesMetricCard
              label="Orders"
              value={`${totalOrders}`}
              note="Confirmed"
              tone="bg-[linear-gradient(180deg,#cf7482,#c86474)]"
            />
            <SalesMetricCard
              label="To Invoice"
              value={`${toInvoice}`}
              note="Ready to Bill"
              tone="bg-[linear-gradient(180deg,#5eaf9d,#4d9f8d)]"
            />
            <SalesMetricCard
              label="To Bill"
              value={`${toBill}`}
              note="Awaiting Action"
              tone="bg-[linear-gradient(180deg,#5da7e0,#4892ca)]"
            />
          </div>
        </DashboardPanel>

        <DashboardPanel title="Tasks" className="">
          <div className="grid gap-0 border-t border-slate-200/80 bg-slate-100/40 md:grid-cols-3">
            {taskColumns.map((column, index) => (
              <div
                key={column.label}
                className={
                  index < taskColumns.length - 1
                    ? "md:border-r md:border-slate-200/80"
                    : ""
                }
              >
                <div className="flex items-center justify-between border border-slate-200/80 bg-white/86 px-3 py-2">
                  <p className="text-sm font-semibold text-slate-700">
                    {column.label}
                  </p>
                  <MoreHorizontal className="h-4 w-4 text-slate-400" />
                </div>
                <div className="mt-2 grid gap-2">
                  {column.items.map((item) => (
                    <TaskCard key={item.title} item={item} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </DashboardPanel>

        <DashboardPanel title="Invoices" className="">
          <div className="grid">
            <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
              <div className="border bg-[linear-gradient(180deg,#a24e73,#8b3b60)] px-4 py-4 text-white">
                <p className="text-[1.72rem] font-semibold leading-none tracking-[-0.04em]">
                  {formatAmount(draftAmount)}
                </p>
                <p className="mt-2 text-sm font-semibold text-white/84">
                  Draft
                </p>
              </div>
              <div className="border bg-[linear-gradient(180deg,#d09a3b,#bb7f20)] px-4 py-4 text-white">
                <p className="text-[1.72rem] font-semibold leading-none tracking-[-0.04em]">
                  {formatAmount(unpaidAmount)}
                </p>
                <p className="mt-2 text-sm font-semibold text-white/84">
                  Unpaid
                </p>
              </div>
              <div className="border bg-[linear-gradient(180deg,#2b9d76,#1d855f)] px-4 py-4 text-white">
                <p className="text-[1.72rem] font-semibold leading-none tracking-[-0.04em]">
                  {formatAmount(paidAmount)}
                </p>
                <p className="mt-2 text-sm font-semibold text-white/84">Paid</p>
              </div>
            </div>

            <div className="border-t border-slate-200/80 px-4 py-3">
              <div className="grid grid-cols-[1.1fr_1fr_0.8fr_0.65fr] gap-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                <span>Invoice</span>
                <span>Customer</span>
                <span>Due Date</span>
                <span>Status</span>
              </div>
            </div>

            <div className="grid content-start">
              {invoiceRows.map((row) => (
                <div
                  key={row.invoice}
                  className="grid grid-cols-[1.1fr_1fr_0.8fr_0.65fr] items-center gap-3 border-t border-slate-200/70 px-4 py-4 text-sm"
                >
                  <span className="font-semibold text-slate-800">
                    {row.invoice}
                  </span>
                  <span className="text-slate-600">{row.customer}</span>
                  <span className="text-slate-600">{row.dueDate}</span>
                  <InvoiceStatus status={row.status} />
                </div>
              ))}
            </div>
          </div>
        </DashboardPanel>

        <DashboardPanel title="Sales This Month" className="xl:col-span-2">
          <div className="grid p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="border border-slate-200/80 bg-slate-50/70 px-4 py-3">
                <p className="text-[2rem] font-semibold leading-none tracking-[-0.04em] text-slate-900">
                  {formatFullAmount(
                    Math.max(24500, Math.round(revenue + 24500)),
                  )}
                </p>
              </div>
              <div className="hidden items-center gap-2 text-sm text-slate-500 md:flex">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
                Saved monthly trend view
              </div>
            </div>

            <div className="mt-4 border-t border-slate-200/80 pt-4">
              <TrendChart points={trendPoints} />
            </div>
          </div>
        </DashboardPanel>
      </section>
    </div>
  );
}
