import { createBrowserRouter } from "react-router-dom";
import { ProtectedRoute } from "../components/auth/ProtectedRoute";
import { PublicOnlyRoute } from "../components/auth/PublicOnlyRoute";
import { AppShell } from "../components/layout/AppShell";
import { BusinessPage } from "../pages/BusinessPage";
import { CRMPage } from "../pages/CRMPage";
import { DashboardPage } from "../pages/DashboardPage";
import { FinancePage } from "../pages/FinancePage";
import { InventoryPage } from "../pages/InventoryPage";
import { LoginPage } from "../pages/LoginPage";
import { MessagesPage } from "../pages/MessagesPage";
import { MembersPage } from "../pages/MembersPage";
import { NotificationsPage } from "../pages/NotificationsPage";
import { OrdersPage } from "../pages/OrdersPage";
import { ProductionPage } from "../pages/ProductionPage";
import { ProfileSettingsPage } from "../pages/ProfileSettingsPage";
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
            path: "orders",
            element: <OrdersPage />,
          },
          {
            path: "crm",
            element: <CRMPage />,
          },
          {
            path: "messages",
            element: <MessagesPage />,
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
