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
import { PlaceholderPage } from "../pages/PlaceholderPage";
import { SalesPage } from "../pages/SalesPage";
import { SalesLogPage } from "../pages/SalesLogPage";
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
            path: "inventory/products/:productId",
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
            path: "orders",
            element: (
              <PlaceholderPage
                title="Orders"
                description="We have just added another module called Orders to ease on the sales module"
              />
            ),
          },
          {
            path: "crm",
            element: (
              <PlaceholderPage
                title="CRM"
                description="Customer relationship management workspace for leads, opportunities, and follow-up activity."
              />
            ),
          },
          {
            path: "messages",
            element: (
              <PlaceholderPage
                title="Messages"
                description="Messages workspace for communications, notifications, and discussions."
              />
            ),
          },
          {
            path: "pos",
            element: (
              <PlaceholderPage
                title="Point of Sale"
                description="We have just added another module called Point of sale (POS). Barcode/QR scanning via hardware scanners and device cameras"
              />
            ),
          },
          {
            path: "sales",
            element: <SalesPage />,
          },
          {
            path: "sales-log",
            element: <SalesLogPage />,
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
