import type { LucideIcon } from "lucide-react";
import {
  BriefcaseBusiness,
  Coins,
  Factory,
  PackageSearch,
  ShoppingCart,
  Users,
  UsersRound,
} from "lucide-react";

export type Stat = {
  title: string;
  value: string;
  note: string;
  delta: string;
};

export type AlertItem = {
  title: string;
  detail: string;
  severity: "high" | "medium" | "low";
};

export type ModuleLink = {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
};

export type ActivityItem = {
  title: string;
  detail: string;
  time: string;
};

export type ChartPoint = {
  label: string;
  value: number;
};

export const dashboardStats: Stat[] = [
  {
    title: "Total Stock Items",
    value: "1,284",
    note: "Raw materials and finished products tracked across the inventory space.",
    delta: "12 low",
  },
  {
    title: "Active Machines",
    value: "12 / 14",
    note: "Production equipment currently available for normal operation.",
    delta: "2 due",
  },
  {
    title: "Staff Present Today",
    value: "46",
    note: "Attendance captured across the current workforce shift schedule.",
    delta: "+6",
  },
  {
    title: "Open Orders",
    value: "18",
    note: "Sales and delivery work currently active in the distribution pipeline.",
    delta: "4 urgent",
  },
];

export const alertItems: AlertItem[] = [
  {
    title: "Low stock watch",
    detail:
      "Packaging rolls and purifier filters are close to the reorder threshold.",
    severity: "high",
  },
  {
    title: "Maintenance window due",
    detail:
      "Two production machines are scheduled for service in the next 24 hours.",
    severity: "medium",
  },
];

export const moduleLinks: ModuleLink[] = [
  {
    title: "Business",
    description:
      "Company profile, registration, licensing, locations, KPIs, and plans.",
    href: "/business",
    icon: BriefcaseBusiness,
  },
  {
    title: "Inventory",
    description:
      "Suppliers, products, stock items, movements, and reorder visibility.",
    href: "/inventory",
    icon: PackageSearch,
  },
  {
    title: "Production",
    description: "Machines, maintenance, downtime, and utility tracking.",
    href: "/production",
    icon: Factory,
  },
  {
    title: "Workforce",
    description:
      "Employees, attendance, shifts, tasks, payroll, and performance.",
    href: "/workforce",
    icon: UsersRound,
  },
  {
    title: "Sales",
    description: "Clients, orders, deliveries, and order progression.",
    href: "/sales",
    icon: ShoppingCart,
  },
  {
    title: "Finance",
    description:
      "Costs, invoices, receipts, insurance, and profitability snapshots.",
    href: "/finance",
    icon: Coins,
  },
  {
    title: "Members",
    description:
      "Authentication, profile settings, roles, and internal staff accounts.",
    href: "/members",
    icon: Users,
  },
];

export const activityItems: ActivityItem[] = [
  {
    title: "Stock movement captured",
    detail:
      "A new finished-product stock movement was recorded for dispatch-ready ice bags.",
    time: "08:15",
  },
  {
    title: "Attendance updated",
    detail:
      "Current workforce attendance has been marked for the active shift.",
    time: "09:05",
  },
  {
    title: "Delivery item progressed",
    detail:
      "A hospitality order moved forward in the sales and delivery workflow.",
    time: "10:20",
  },
];

export const operationsTrend: ChartPoint[] = [
  { label: "Inventory", value: 84 },
  { label: "Production", value: 76 },
  { label: "Workforce", value: 88 },
  { label: "Sales", value: 79 },
  { label: "Finance", value: 68 },
];
