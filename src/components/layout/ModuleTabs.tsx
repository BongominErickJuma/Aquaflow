type ModuleTab = {
  id: string;
  label: string;
};

type ModuleTabsProps = {
  tabs: ModuleTab[];
  activeTab: string;
  onChange: (tabId: string) => void;
};

export function ModuleTabs({ tabs, activeTab, onChange }: ModuleTabsProps) {
  return (
    <div className="scrollbar-hidden shrink-0 overflow-x-auto">
      <div className="inline-flex min-w-full gap-2 border border-slate-200/80 bg-white/92 p-2 shadow-[0_14px_36px_rgba(148,163,184,0.12)]">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={[
                "whitespace-nowrap px-4 py-3 text-sm font-semibold transition",
                isActive
                  ? "border border-sky-200 bg-[linear-gradient(135deg,#1f87ad,#0f6d8d)] text-white shadow-[0_10px_22px_rgba(32,141,183,0.18)]"
                  : "border border-transparent bg-slate-50 text-slate-600 hover:border-slate-200 hover:bg-slate-100 hover:text-slate-900",
              ].join(" ")}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
