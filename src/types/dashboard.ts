export type SeverityTone = "high" | "medium" | "low";

export type AnalyticsTopClient = {
  client_name: string;
  order_count: number;
  total_amount: string;
};

export type AnalyticsKpiItem = {
  name: string;
  value: string;
  unit: string;
  record_date: string;
};

export type AnalyticsRoleBreakdown = {
  role_code: string;
  role_name: string;
  user_count: number;
};

export type AnalyticsDepartmentBreakdown = {
  department_name: string;
  employee_count: number;
};

export type AnalyticsNotificationModuleBreakdown = {
  module: string;
  active_count: number;
};

export type AnalyticsTrendPoint = {
  label: string;
  value: string;
};

export type AnalyticsTaskItem = {
  title: string;
  priority: "low" | "medium" | "high";
  status: string;
};

export type AnalyticsTaskColumn = {
  label: string;
  items: AnalyticsTaskItem[];
};

export type AnalyticsInvoiceRow = {
  invoice: string;
  customer: string;
  due_date: string;
  status: "Open" | "Draft" | "Paid";
};

export type InventoryLowStockItem = {
  item_name: string;
  item_type: string;
  location: string;
  quantity: string;
  reorder_level: string;
};

export type DailyProductionAnalytics = {
  analytics_date: string;
  updated_at: string;
  total_machines: number;
  active_machines: number;
  usage_log_count: number;
  total_usage_hours: string;
  maintenance_log_count: number;
  completed_maintenance_count: number;
  total_maintenance_cost: string;
  downtime_alert_count: number;
  resolved_downtime_count: number;
  total_downtime_hours: string;
  water_consumption_quantity: string;
  water_consumption_cost: string;
  electricity_consumption_quantity: string;
  electricity_consumption_cost: string;
  utility_total_cost: string;
  operational_availability_pct: string;
  maintenance_completion_rate_pct: string;
  context: {
    water_units?: string[];
    electricity_units?: string[];
    open_downtime_alerts?: number;
    due_maintenance_schedules?: number;
    assumptions?: string[];
  };
};

export type DailySalesAnalytics = {
  analytics_date: string;
  updated_at: string;
  total_orders: number;
  delivered_orders: number;
  cancelled_orders: number;
  total_sales_amount: string;
  average_order_value: string;
  delivered_sales_amount: string;
  top_clients: AnalyticsTopClient[];
  status_breakdown: Record<string, number>;
  context: {
    delivered_record_count?: number;
    trend_point?: {
      date: string;
      sales_amount: string;
    };
    assumptions?: string[];
  };
};

export type DailyFinanceAnalytics = {
  analytics_date: string;
  updated_at: string;
  total_invoices: number;
  paid_invoices: number;
  overdue_invoices: number;
  total_invoiced_amount: string;
  revenue_amount: string;
  operating_cost_amount: string;
  expense_amount: string;
  insurance_cost_amount: string;
  total_cost_amount: string;
  profit_estimate: string;
  collection_rate_pct: string;
  context: {
    capital_inflow_amount?: string;
    active_insurance_records?: number;
    assumptions?: string[];
  };
};

export type DailyInventoryAnalytics = {
  analytics_date: string;
  updated_at: string;
  raw_material_item_count: number;
  finished_goods_item_count: number;
  raw_material_quantity_total: string;
  finished_goods_quantity_total: string;
  stock_in_total: string;
  stock_out_total: string;
  adjustment_positive_total: string;
  adjustment_negative_total: string;
  low_stock_alert_count: number;
  low_stock_items: InventoryLowStockItem[];
  context: {
    movement_count?: number;
  };
};

export type DailyBusinessKPIAnalytics = {
  analytics_date: string;
  updated_at: string;
  company_count: number;
  kpi_record_count: number;
  active_license_count: number;
  expiring_license_count: number;
  active_strategic_plan_count: number;
  latest_kpis: AnalyticsKpiItem[];
  context: {
    company_names?: string[];
  };
};

export type DailyAnalyticsDashboard = {
  analytics_date: string;
  updated_at: string;
  production_efficiency_pct: string;
  total_sales_amount: string;
  revenue_amount: string;
  profit_estimate: string;
  low_stock_alert_count: number;
  overdue_invoice_count: number;
  active_kpi_count: number;
  dashboard_context: {
    production?: {
      usage_hours?: string;
      downtime_hours?: string;
      active_machines?: number;
      operational_machines?: number;
      availability_pct?: string;
      maintenance_completion_rate_pct?: string;
      open_downtime_alerts?: number;
      utility_total_cost?: string;
      due_maintenance_schedules?: number;
      assumptions?: string[];
    };
    sales?: {
      total_orders?: number;
      delivered_orders?: number;
      workflow_orders?: number;
      received_workflow_orders?: number;
      quotations_count?: number;
      to_invoice_count?: number;
      to_bill_count?: number;
      logs_recent_count?: number;
      monthly_sales_amount?: string;
      monthly_trend?: AnalyticsTrendPoint[];
      top_clients?: AnalyticsTopClient[];
      assumptions?: string[];
      daily?: {
        total_orders?: number;
        delivered_orders?: number;
        cancelled_orders?: number;
        total_sales_amount?: string;
        delivered_sales_amount?: string;
        top_clients?: AnalyticsTopClient[];
      };
    };
    finance?: {
      paid_invoices?: number;
      total_invoices?: number;
      collection_rate_pct?: string;
      total_cost_amount?: string;
      draft_invoice_amount?: string;
      unpaid_invoice_amount?: string;
      paid_invoice_amount?: string;
      recent_invoices?: AnalyticsInvoiceRow[];
    };
    accounts?: {
      active_users?: number;
      users_with_employee_profiles?: number;
      role_breakdown?: AnalyticsRoleBreakdown[];
    };
    workforce?: {
      active_employees?: number;
      present_or_late_today?: number;
      attendance_rate_pct?: string;
      open_task_count?: number;
      high_priority_open_task_count?: number;
      pending_payroll_count?: number;
      task_columns?: AnalyticsTaskColumn[];
      department_breakdown?: AnalyticsDepartmentBreakdown[];
      daily?: {
        attendance_records?: number;
      };
    };
    orders?: {
      open_orders?: number;
      workflow_orders?: number;
      received_workflow_orders?: number;
      due_deliveries?: number;
    };
    inventory?: {
      raw_material_quantity_total?: string;
      finished_goods_quantity_total?: string;
      total_stock_items?: number;
      healthy_stock_items?: number;
      stock_health_pct?: string;
      low_stock_items?: InventoryLowStockItem[];
      assumptions?: string[];
    };
    crm?: {
      active_lead_count?: number;
      converted_lead_count?: number;
      open_opportunity_count?: number;
      open_opportunity_value?: string;
      open_case_count?: number;
      urgent_case_count?: number;
      due_activity_count?: number;
    };
    business?: {
      active_license_count?: number;
      expiring_license_count?: number;
      expired_license_count?: number;
      latest_kpis?: AnalyticsKpiItem[];
    };
    notifications?: {
      active_count?: number;
      critical_active_count?: number;
      unread_receipt_count?: number;
      module_breakdown?: AnalyticsNotificationModuleBreakdown[];
    };
    messages?: {
      active_count?: number;
      urgent_count?: number;
      unread_receipt_count?: number;
    };
  };
};

export type DashboardOverviewResponse = {
  combined: DailyAnalyticsDashboard | null;
  production: DailyProductionAnalytics | null;
  sales: DailySalesAnalytics | null;
  finance: DailyFinanceAnalytics | null;
  inventory: DailyInventoryAnalytics | null;
  business: DailyBusinessKPIAnalytics | null;
};

export type AnalyticsRefreshResponse = {
  message: string;
  analytics_date: string;
  dashboard: DailyAnalyticsDashboard;
};
