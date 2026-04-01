import { motion } from "framer-motion";
import type { ActivityItem } from "../../data/dashboard";

type ActivityFeedProps = {
  items: ActivityItem[];
  title?: string;
  subtitle?: string;
};

export function ActivityFeed({
  items,
  title = "Latest operational updates",
  subtitle = "Recent Activity",
}: ActivityFeedProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.28, duration: 0.38, ease: "easeOut" }}
      className="panel p-6"
    >
      <p className="section-label">{subtitle}</p>
      <h3 className="mt-2 text-xl font-semibold text-slate-900">{title}</h3>

      <div className="mt-5 space-y-4">
        {items.map((item) => (
          <div
            key={`${item.title}-${item.time}`}
            className="flex items-start gap-4 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4"
          >
            <div className="mt-1 h-3 w-3 rounded-full bg-sky-500 shadow-[0_0_18px_rgba(56,189,248,0.3)]" />
            <div className="flex-1 space-y-1">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate-900">
                  {item.title}
                </p>
                <span className="text-xs uppercase tracking-[0.28em] text-slate-400">
                  {item.time}
                </span>
              </div>
              <p className="text-sm leading-6 text-slate-600">{item.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </motion.section>
  );
}
