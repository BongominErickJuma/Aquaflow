import { createBrowserRouter } from "react-router-dom";
import { ProtectedRoute } from "../components/auth/ProtectedRoute";
import { PublicOnlyRoute } from "../components/auth/PublicOnlyRoute";
import { AppShell } from "../components/layout/AppShell";
import { BusinessPage } from "../pages/BusinessPage";
import { CompliancePage } from "../pages/CompliancePage";
import { DashboardPage } from "../pages/DashboardPage";
import { FinancePage } from "../pages/FinancePage";
import { InventoryPage } from "../pages/InventoryPage";
import { LoginPage } from "../pages/LoginPage";
import { MembersPage } from "../pages/MembersPage";
import { NotificationsPage } from "../pages/NotificationsPage";
import { ProductionPage } from "../pages/ProductionPage";
import { ProfileSettingsPage } from "../pages/ProfileSettingsPage";
import { SalesPage } from "../pages/SalesPage";
import { WorkforcePage } from "../pages/WorkforcePage";

export const router = createBrowserRouter([
  {
    element: <PublicOnlyRoute />,
    children: [
      {
        path: "/login",
        element: <LoginPage />,
      },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/",
        element: <AppShell />,
        children: [
          {
            index: true,
            element: <DashboardPage />,
          },
          {
            path: "members",
            element: <MembersPage />,
          },
          {
            path: "business",
            element: <BusinessPage />,
          },
          {
            path: "inventory",
            element: <InventoryPage />,
          },
          {
            path: "production",
            element: <ProductionPage />,
          },
          {
            path: "workforce",
            element: <WorkforcePage />,
          },
          {
            path: "compliance",
            element: <CompliancePage />,
          },
          {
            path: "sales",
            element: <SalesPage />,
          },
          {
            path: "finance",
            element: <FinancePage />,
          },
          {
            path: "notifications",
            element: <NotificationsPage />,
          },
          {
            path: "settings/profile",
            element: <ProfileSettingsPage />,
          },
        ],
      },
    ],
  },
]);
