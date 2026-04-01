import { motion } from "framer-motion";
import type { Stat } from "../../data/dashboard";

type StatCardProps = {
  stat: Stat;
  index: number;
};

export function StatCard({ stat, index }: StatCardProps) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.35, ease: "easeOut" }}
      className="panel overflow-hidden p-5"
    >
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm font-medium text-slate-600">{stat.title}</p>
        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold tracking-[0.2em] text-emerald-700">
          {stat.delta}
        </span>
      </div>

      <div className="space-y-2">
        <h3 className="text-3xl font-semibold tracking-[0.02em] text-slate-900">
          {stat.value}
        </h3>
        <p className="text-sm leading-6 text-slate-500">{stat.note}</p>
      </div>
    </motion.article>
  );
}
