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
    <div className="hide-scrollbar shrink-0 overflow-x-auto">
      <div className="inline-flex min-w-full gap-3 rounded-[28px] border border-slate-200/80 bg-white/90 p-3 shadow-[0_18px_50px_rgba(148,163,184,0.12)]">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={[
                "whitespace-nowrap rounded-2xl px-4 py-3 text-sm font-semibold transition",
                isActive
                  ? "bg-[linear-gradient(135deg,#1f87ad,#0f6d8d)] text-white shadow-[0_12px_30px_rgba(32,141,183,0.22)]"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900",
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
