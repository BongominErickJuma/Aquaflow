import { motion } from "framer-motion";
import { ArrowRight, Clock3, ShieldAlert, Sparkles, Waves } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { fetchDashboardOverview } from "../lib/api/dashboard";
import { ApiError } from "../lib/api/auth";
import type { DashboardOverviewResponse } from "../types/dashboard";

function CompactMetricCard({
  title,
  value,
  delta,
  index,
}: {
  title: string;
  value: string;
  delta: string;
  index: number;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.28, ease: "easeOut" }}
      className="panel flex min-h-[96px] flex-col justify-between p-3"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
          {title}
        </p>
        <span className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-700">
          {delta}
        </span>
      </div>
      <p className="text-[1.75rem] font-semibold tracking-[0.02em] text-slate-950">
        {value}
      </p>
    </motion.article>
  );
}

function CompactPanel({
  label,
  title,
  children,
  delay = 0,
}: {
  label: string;
  title: string;
  children: ReactNode;
  delay?: number;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.32, ease: "easeOut" }}
      className="panel flex min-h-0 flex-col p-4"
    >
      <p className="section-label">{label}</p>
      <h2 className="mt-1.5 text-base font-semibold text-slate-900">{title}</h2>
      <div className="mt-3 min-h-0 flex-1">{children}</div>
    </motion.section>
  );
}

function formatActivityTime(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "--";
  }

  return new Intl.DateTimeFormat("en-UG", {
    hour: "numeric",
    minute: "2-digit",
  }).format(parsed);
}

function formatGeneratedAt(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Just now";
  }

  return new Intl.DateTimeFormat("en-UG", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(parsed);
}

export function DashboardPage() {
  const [overview, setOverview] = useState<DashboardOverviewResponse | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadOverview = async () => {
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
          setPageError("Unable to load the overview right now.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadOverview();

    return () => {
      isMounted = false;
    };
  }, []);

  const stats = overview?.stats;
  const metricCards = [
    {
      title: "Total Stock Items",
      value: `${stats?.stock_items.total ?? 0}`,
      delta:
        (stats?.stock_items.low_stock ?? 0) > 0
          ? `${stats?.stock_items.low_stock ?? 0} low`
          : "healthy",
    },
    {
      title: "Active Machines",
      value: `${stats?.machines.operational ?? 0} / ${stats?.machines.total ?? 0}`,
      delta:
        (stats?.machines.due_maintenance ?? 0) > 0
          ? `${stats?.machines.due_maintenance ?? 0} due`
          : "on track",
    },
    {
      title: "Staff Present Today",
      value: `${stats?.workforce.present_today ?? 0}`,
      delta: `of ${stats?.workforce.active_employees ?? 0}`,
    },
    {
      title: "Open Orders",
      value: `${stats?.sales.open_orders ?? 0}`,
      delta:
        (stats?.sales.due_deliveries ?? 0) > 0
          ? `${stats?.sales.due_deliveries ?? 0} due`
          : "clear",
    },
  ];
  const attendanceGap = Math.max(
    (stats?.workforce.active_employees ?? 0) -
      (stats?.workforce.present_today ?? 0),
    0,
  );
  const actionQueueItems = [
    {
      title: "Stock watch",
      value: stats?.stock_items.low_stock ?? 0,
      detail: "items below reorder",
      tone: (stats?.stock_items.low_stock ?? 0) > 0 ? "high" : "low",
    },
    {
      title: "Maintenance due",
      value: stats?.machines.due_maintenance ?? 0,
      detail: "machine schedules",
      tone: (stats?.machines.due_maintenance ?? 0) > 0 ? "medium" : "low",
    },
    {
      title: "Delivery due",
      value: stats?.sales.due_deliveries ?? 0,
      detail: "dispatch commitments",
      tone: (stats?.sales.due_deliveries ?? 0) > 0 ? "medium" : "low",
    },
    {
      title: "Attendance gap",
      value: attendanceGap,
      detail: "active staff not present",
      tone: attendanceGap > 0 ? "medium" : "low",
    },
  ];
  const focusItems = [
    {
      title: "Inventory pressure",
      detail:
        (stats?.stock_items.low_stock ?? 0) > 0
          ? `${stats?.stock_items.low_stock ?? 0} stock item(s) are below reorder level.`
          : "No stock items are currently below reorder level.",
      tone: (stats?.stock_items.low_stock ?? 0) > 0 ? "high" : "low",
    },
    {
      title: "Production pressure",
      detail:
        (stats?.machines.due_maintenance ?? 0) > 0
          ? `${stats?.machines.due_maintenance ?? 0} maintenance schedule(s) are due soon.`
          : "No near-term maintenance load is waiting.",
      tone: (stats?.machines.due_maintenance ?? 0) > 0 ? "medium" : "low",
    },
    {
      title: "Sales pressure",
      detail:
        (stats?.sales.due_deliveries ?? 0) > 0
          ? `${stats?.sales.due_deliveries ?? 0} delivery schedule(s) need attention next.`
          : "Delivery queue is clear for the moment.",
      tone: (stats?.sales.due_deliveries ?? 0) > 0 ? "medium" : "low",
    },
  ];

  if (isLoading) {
    return (
      <section className="panel flex h-full min-h-[320px] items-center justify-center p-8">
        <p className="text-sm text-slate-600">Loading overview...</p>
      </section>
    );
  }

  if (pageError) {
    return (
      <section className="panel max-w-3xl p-8">
        <p className="section-label">Overview</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-900">
          Overview Dashboard
        </h1>
        <div className="mt-6 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {pageError}
        </div>
      </section>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 overflow-hidden">
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, ease: "easeOut" }}
        className="relative overflow-hidden border border-slate-200/80 bg-[linear-gradient(135deg,#fdfefe_0%,#edf7fd_40%,#dceff8_100%)] py-4 pl-5 pr-0 shadow-[0_24px_70px_rgba(41,73,104,0.08)]"
      >
        <div className="pointer-events-none absolute inset-y-0 right-[-10%] w-[42%] bg-[radial-gradient(circle,rgba(115,206,240,0.22),transparent_60%)] blur-3xl" />
        <div className="pointer-events-none absolute left-[-5%] top-[-25%] h-48 w-48 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.75),transparent_72%)]" />
        <div className="pointer-events-none absolute bottom-[-30px] left-[28%] h-[1px] w-[48%] bg-sky-200/70" />
        <div className="relative grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-2 border border-sky-200 bg-white/80 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.28em] text-sky-700">
                <Sparkles className="h-3.5 w-3.5" />
                Overview
              </div>
              <div className="inline-flex items-center gap-2 border border-slate-200/80 bg-white/70 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                <Clock3 className="h-3.5 w-3.5 text-slate-400" />
                Refreshed {formatGeneratedAt(overview?.generated_at ?? "")}
              </div>
            </div>

            <div className="space-y-2">
              <h1 className="max-w-3xl text-[2rem] font-semibold tracking-[0.02em] text-slate-950">
                {overview?.company.trading_name ||
                  overview?.company.name ||
                  "Operations command view"}
              </h1>
              <p className="max-w-2xl text-sm leading-5 text-slate-600">
                A single control-room view for live pressure points, readiness,
                and the latest movement across the business.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="border border-white/75 bg-white/72 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Business
                </p>
                <p className="mt-1.5 text-sm font-semibold text-slate-900">
                  {overview?.company.name || "Company profile pending"}
                </p>
                <p className="mt-0.5 text-sm text-slate-500">
                  {overview?.company.trading_name || "Primary operating record"}
                </p>
              </div>

              <div className="border border-white/75 bg-white/72 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Workforce
                </p>
                <p className="mt-1.5 text-sm font-semibold text-slate-900">
                  {stats?.workforce.present_today ?? 0} present today
                </p>
                <p className="mt-0.5 text-sm text-slate-500">
                  {stats?.workforce.active_employees ?? 0} active employee
                  records
                </p>
              </div>

              <div className="border border-white/75 bg-white/72 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Sales
                </p>
                <p className="mt-1.5 text-sm font-semibold text-slate-900">
                  {stats?.sales.open_orders ?? 0} orders in motion
                </p>
                <p className="mt-0.5 text-sm text-slate-500">
                  {stats?.sales.due_deliveries ?? 0} delivery schedules due next
                </p>
              </div>
            </div>
          </div>

          <div className="border border-slate-200/80 bg-white/74 p-4 shadow-[0_18px_40px_rgba(28,62,95,0.08)]">
            <div className="mb-3 flex items-start justify-between gap-4">
              <div>
                <p className="section-label">Today Focus</p>
                <h2 className="mt-1.5 text-lg font-semibold text-slate-900">
                  What needs the next decision
                </h2>
              </div>
              <div className="flex h-9 w-9 items-center justify-center border border-sky-200 bg-sky-100 text-sky-700">
                <Waves className="h-4.5 w-4.5" />
              </div>
            </div>

            <div className="space-y-2.5">
              {focusItems.map((item) => (
                <div
                  key={item.title}
                  className="flex items-start gap-3 border border-slate-200/80 bg-slate-50/75 px-3.5 py-3"
                >
                  <div
                    className={[
                      "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center border text-xs font-semibold",
                      item.tone === "high"
                        ? "border-red-200 bg-red-50 text-red-700"
                        : item.tone === "medium"
                          ? "border-amber-200 bg-amber-50 text-amber-700"
                          : "border-sky-200 bg-sky-50 text-sky-700",
                    ].join(" ")}
                  >
                    <ShieldAlert className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-900">
                        {item.title}
                      </p>
                      <ArrowRight className="h-4 w-4 text-slate-300" />
                    </div>
                    <p className="mt-1.5 text-sm leading-5 text-slate-600">
                      {item.detail}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.section>

      <section className="grid shrink-0 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((stat, index) => (
          <CompactMetricCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            delta={stat.delta}
            index={index}
          />
        ))}
      </section>

      <section className="grid min-h-0 flex-1 gap-3 xl:grid-cols-3">
        <CompactPanel label="Alerts" title="Current watch list" delay={0.12}>
          <div className="grid h-full gap-2.5">
            {(overview?.alerts ?? []).slice(0, 3).map((alert) => (
              <div
                key={alert.title}
                className="flex min-h-0 flex-col justify-between border border-slate-200/80 bg-slate-50/70 p-3.5"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-900">
                    {alert.title}
                  </p>
                  <span
                    className={[
                      "inline-flex border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.22em]",
                      alert.severity === "high"
                        ? "border-red-200 bg-red-50 text-red-700"
                        : alert.severity === "medium"
                          ? "border-amber-200 bg-amber-50 text-amber-700"
                          : "border-sky-200 bg-sky-50 text-sky-700",
                    ].join(" ")}
                  >
                    {alert.severity}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-5 text-slate-600">
                  {alert.detail}
                </p>
              </div>
            ))}
          </div>
        </CompactPanel>

        <CompactPanel
          label="Control Points"
          title="Operational load"
          delay={0.18}
        >
          <div className="grid h-full gap-2.5 sm:grid-cols-2">
            {actionQueueItems.map((item) => (
              <div
                key={item.title}
                className="flex min-h-[120px] flex-col justify-between border border-slate-200/80 bg-slate-50/70 p-3.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-900">
                    {item.title}
                  </p>
                  <span
                    className={[
                      "inline-flex border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.22em]",
                      item.tone === "high"
                        ? "border-red-200 bg-red-50 text-red-700"
                        : item.tone === "medium"
                          ? "border-amber-200 bg-amber-50 text-amber-700"
                          : "border-sky-200 bg-sky-50 text-sky-700",
                    ].join(" ")}
                  >
                    {item.tone}
                  </span>
                </div>
                <div>
                  <p className="text-[1.7rem] font-semibold tracking-[0.02em] text-slate-950">
                    {item.value}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </CompactPanel>

        <CompactPanel label="Activity" title="Latest updates" delay={0.24}>
          <div className="grid h-full gap-2.5">
            {(overview?.activity ?? []).slice(0, 3).map((item) => (
              <div
                key={`${item.title}-${item.occurred_at}`}
                className="flex min-h-0 gap-3 border border-slate-200/80 bg-slate-50/70 p-3.5"
              >
                <div className="mt-1 h-3 w-3 shrink-0 bg-sky-500 shadow-[0_0_18px_rgba(56,189,248,0.25)]" />
                <div className="min-w-0">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {item.title}
                    </p>
                    <span className="text-[11px] uppercase tracking-[0.24em] text-slate-400">
                      {formatActivityTime(item.occurred_at)}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm leading-5 text-slate-600">
                    {item.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CompactPanel>
      </section>
    </div>
  );
}
