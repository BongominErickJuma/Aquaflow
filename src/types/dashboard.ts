export type DashboardAlert = {
  title: string;
  detail: string;
  severity: "high" | "medium" | "low";
};

export type DashboardActivity = {
  title: string;
  detail: string;
  occurred_at: string;
};

export type DashboardModuleCoverage = {
  label: string;
  value: number;
};

export type DashboardOverviewResponse = {
  generated_at: string;
  company: {
    name: string | null;
    trading_name: string | null;
  };
  stats: {
    stock_items: {
      total: number;
      low_stock: number;
    };
    machines: {
      operational: number;
      total: number;
      due_maintenance: number;
    };
    workforce: {
      present_today: number;
      active_employees: number;
    };
    sales: {
      open_orders: number;
      due_deliveries: number;
    };
  };
  alerts: DashboardAlert[];
  activity: DashboardActivity[];
  module_coverage: DashboardModuleCoverage[];
};
