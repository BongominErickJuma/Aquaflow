import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import type { ModuleLink } from "../../data/dashboard";

type ModuleGridProps = {
  modules: ModuleLink[];
};

export function ModuleGrid({ modules }: ModuleGridProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.24, duration: 0.38, ease: "easeOut" }}
      className="space-y-4"
    >
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="section-label">Module Access</p>
          <h3 className="mt-2 text-xl font-semibold text-slate-900">
            Jump into the systems that run the business
          </h3>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {modules.map(({ title, description, href, icon: Icon }, index) => (
          <motion.div
            key={title}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.3 + index * 0.05,
              duration: 0.35,
              ease: "easeOut",
            }}
          >
            <Link
              to={href}
              className="panel group flex h-full flex-col gap-5 p-5 transition duration-200 hover:-translate-y-1 hover:border-sky-200 hover:bg-white/92"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-sky-200 bg-sky-100 text-sky-700">
                <Icon className="h-5 w-5" />
              </div>
              <div className="space-y-2">
                <h4 className="text-lg font-semibold text-slate-900">
                  {title}
                </h4>
                <p className="text-sm leading-6 text-slate-600">
                  {description}
                </p>
              </div>
              <div className="mt-auto flex items-center gap-2 text-sm text-sky-700 transition group-hover:text-slate-900">
                Open module
                <ArrowRight className="h-4 w-4" />
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}
