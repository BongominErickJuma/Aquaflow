import { apiRequest } from "./auth";
import type {
  AnalyticsRefreshResponse,
  DailyAnalyticsDashboard,
  DailyBusinessKPIAnalytics,
  DailyFinanceAnalytics,
  DailyInventoryAnalytics,
  DailyProductionAnalytics,
  DailySalesAnalytics,
  DashboardOverviewResponse,
} from "../../types/dashboard";

const ANALYTICS_BASE_PATH = "/api/analytics";

function isPopulatedRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(
    value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      Object.keys(value).length > 0,
  );
}

async function fetchLatestListItem<T>(path: string) {
  const records = await apiRequest<T[]>(path);
  return records[0] ?? null;
}

export async function fetchDashboardOverview(): Promise<DashboardOverviewResponse> {
  const [
    combinedResponse,
    production,
    sales,
    finance,
    inventory,
    business,
  ] = await Promise.all([
    apiRequest<DailyAnalyticsDashboard | Record<string, never>>(
      `${ANALYTICS_BASE_PATH}/combined-dashboard/latest/`,
    ),
    fetchLatestListItem<DailyProductionAnalytics>(
      `${ANALYTICS_BASE_PATH}/production-efficiency-reports/`,
    ),
    fetchLatestListItem<DailySalesAnalytics>(
      `${ANALYTICS_BASE_PATH}/sales-performance-dashboards/`,
    ),
    fetchLatestListItem<DailyFinanceAnalytics>(
      `${ANALYTICS_BASE_PATH}/financial-metrics-reports/`,
    ),
    fetchLatestListItem<DailyInventoryAnalytics>(
      `${ANALYTICS_BASE_PATH}/inventory-stock-reports/`,
    ),
    fetchLatestListItem<DailyBusinessKPIAnalytics>(
      `${ANALYTICS_BASE_PATH}/business-kpi-analytics/`,
    ),
  ]);

  return {
    combined: isPopulatedRecord(combinedResponse)
      ? (combinedResponse as DailyAnalyticsDashboard)
      : null,
    production,
    sales,
    finance,
    inventory,
    business,
  };
}

export async function runDashboardAnalytics(
  date?: string,
): Promise<AnalyticsRefreshResponse> {
  return apiRequest<AnalyticsRefreshResponse>(
    `${ANALYTICS_BASE_PATH}/combined-dashboard/run/`,
    {
      method: "POST",
      body: JSON.stringify(date ? { date } : {}),
    },
    { csrf: true },
  );
}
