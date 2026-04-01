import { AlertTriangle, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import type { AlertItem } from "../../data/dashboard";

type AlertPanelProps = {
  alerts: AlertItem[];
  title?: string;
  subtitle?: string;
  footerLabel?: string;
};

const severityStyles = {
  high: "border-red-200 bg-red-50 text-red-700",
  medium: "border-amber-200 bg-amber-50 text-amber-700",
  low: "border-sky-200 bg-sky-50 text-sky-700",
};

export function AlertPanel({
  alerts,
  title = "Priority watch list for the current shift",
  subtitle = "Operational Alerts",
  footerLabel = "Review all operational alerts",
}: AlertPanelProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.18, duration: 0.38, ease: "easeOut" }}
      className="panel p-6"
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="section-label">{subtitle}</p>
          <h3 className="mt-2 text-xl font-semibold text-slate-900">{title}</h3>
        </div>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-red-700 shadow-[0_0_24px_rgba(248,113,113,0.14)]">
          <AlertTriangle className="h-5 w-5" />
        </div>
      </div>

      <div className="space-y-3">
        {alerts.map((alert) => (
          <div
            key={alert.title}
            className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4"
          >
            <div className="mb-3 flex items-center justify-between gap-4">
              <p className="text-sm font-semibold text-slate-900">
                {alert.title}
              </p>
              <span
                className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] ${severityStyles[alert.severity]}`}
              >
                {alert.severity}
              </span>
            </div>
            <p className="text-sm leading-6 text-slate-600">{alert.detail}</p>
          </div>
        ))}
      </div>

      <button
        type="button"
        className="mt-5 flex items-center gap-2 text-sm font-medium text-sky-700 transition hover:text-slate-900"
      >
        {footerLabel}
        <ArrowRight className="h-4 w-4" />
      </button>
    </motion.section>
  );
}
