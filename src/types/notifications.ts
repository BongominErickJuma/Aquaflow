export type NotificationModule =
  | "inventory"
  | "production"
  | "sales"
  | "finance";

export type NotificationSeverity = "low" | "medium" | "high" | "critical";
export type NotificationStatus = "active" | "resolved";

export type NotificationReadSummary = {
  total: number;
  read: number;
  unread: number;
};

export type NotificationItem = {
  id: number;
  type: string;
  module: NotificationModule;
  title: string;
  message: string;
  severity: NotificationSeverity;
  target_path: string;
  status: NotificationStatus;
  created_at: string;
  resolved_at: string | null;
  is_read: boolean;
  read_at: string | null;
  read_summary: NotificationReadSummary;
  can_delete: boolean;
};

export type NotificationReceiptStatus = {
  user: number;
  full_name: string;
  email: string;
  is_read: boolean;
  read_at: string | null;
};

export type NotificationDetail = NotificationItem & {
  receipts: NotificationReceiptStatus[];
};

export type NotificationSummaryResponse = {
  total: number;
  unread: number;
  latest: NotificationItem[];
};

export type NotificationDeleteWarning = {
  detail: string;
  warning: boolean;
  unread_count: number;
  unread_members: string[];
  selected_count?: number;
  blocked_ids?: number[];
};

export type NotificationBulkDeleteResponse = {
  detail: string;
  deleted: number;
};
