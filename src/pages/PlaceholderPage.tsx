import { motion } from "framer-motion";

type PlaceholderPageProps = {
  title: string;
  description: string;
};

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: "easeOut" }}
      className="panel max-w-4xl p-8"
    >
      <p className="section-label">Module Shell</p>
      <h1 className="mt-3 text-3xl font-semibold text-slate-900">{title}</h1>
      <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
        {description}
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-[1.5rem] border border-slate-200/80 bg-slate-50/70 p-5">
          <h2 className="text-sm font-semibold text-slate-900">Tables</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Listing views will follow the same spacing, filter, and header
            rhythm as the dashboard.
          </p>
        </div>
        <div className="rounded-[1.5rem] border border-slate-200/80 bg-slate-50/70 p-5">
          <h2 className="text-sm font-semibold text-slate-900">Forms</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Create and edit screens will reuse a shared form surface and
            validation tone.
          </p>
        </div>
        <div className="rounded-[1.5rem] border border-slate-200/80 bg-slate-50/70 p-5">
          <h2 className="text-sm font-semibold text-slate-900">Status</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            This route is ready for the next implementation pass once data hooks
            are added.
          </p>
        </div>
      </div>
    </motion.section>
  );
}
