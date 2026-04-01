import { motion } from "framer-motion";
import type { ChartPoint } from "../../data/dashboard";

type TrendPanelProps = {
  data: ChartPoint[];
  title?: string;
  subtitle?: string;
  caption?: string;
};

export function TrendPanel({
  data,
  title = "Weekly throughput snapshot",
  subtitle = "Production Trend",
  caption = "Updated for the current week",
}: TrendPanelProps) {
  const maxValue = Math.max(...data.map((entry) => entry.value));

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.22, duration: 0.4, ease: "easeOut" }}
      className="panel p-6"
    >
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="section-label">{subtitle}</p>
          <h3 className="mt-2 text-xl font-semibold text-slate-900">{title}</h3>
        </div>
        <p className="text-sm text-slate-500">{caption}</p>
      </div>

      <div
        className="grid items-end gap-3"
        style={{
          gridTemplateColumns: `repeat(${Math.max(data.length, 1)}, minmax(0, 1fr))`,
        }}
      >
        {data.map((entry, index) => (
          <div key={entry.label} className="flex flex-col items-center gap-3">
            <div className="flex h-56 w-full items-end rounded-[1.5rem] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(248,252,255,0.9),rgba(226,236,245,0.9))] p-2">
              <motion.div
                initial={{ height: 0, opacity: 0.4 }}
                animate={{
                  height: `${(entry.value / maxValue) * 100}%`,
                  opacity: 1,
                }}
                transition={{
                  delay: 0.36 + index * 0.06,
                  duration: 0.4,
                  ease: "easeOut",
                }}
                className="w-full rounded-[1rem] bg-[linear-gradient(180deg,#60d4f1,#1f87ad)] shadow-[0_10px_30px_rgba(31,135,173,0.18)]"
              />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-900">
                {entry.label}
              </p>
              <p className="text-xs tracking-[0.18em] text-slate-400">
                {entry.value}
              </p>
            </div>
          </div>
        ))}
      </div>
    </motion.section>
  );
}
