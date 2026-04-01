import { apiRequest } from "./auth";
import type { DashboardOverviewResponse } from "../../types/dashboard";

const DASHBOARD_OVERVIEW_PATH = "/api/dashboard/overview/";

export async function fetchDashboardOverview() {
  return apiRequest<DashboardOverviewResponse>(DASHBOARD_OVERVIEW_PATH);
}
