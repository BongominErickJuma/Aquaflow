export type MessagePriority = "low" | "normal" | "high" | "urgent";

export type MessageReadSummary = {
  total: number;
  read: number;
  unread: number;
};

export type MessageItem = {
  id: number;
  subject: string;
  body: string;
  priority: MessagePriority;
  created_by_name: string;
  created_by_email: string | null;
  created_at: string;
  updated_at: string;
  is_read: boolean;
  read_at: string | null;
  read_summary: MessageReadSummary;
  can_manage: boolean;
};

export type MessageReceiptStatus = {
  user: number;
  full_name: string;
  email: string;
  is_read: boolean;
  read_at: string | null;
};

export type MessageDetail = MessageItem & {
  receipts: MessageReceiptStatus[];
};

export type MessageSummaryResponse = {
  total: number;
  unread: number;
  latest: MessageItem[];
};

export type MessagePayload = {
  subject: string;
  body: string;
  priority: MessagePriority;
};

export type MessageDeleteWarning = {
  detail: string;
  warning: boolean;
  unread_count: number;
  unread_members: string[];
  selected_count?: number;
  blocked_ids?: number[];
};

export type MessageBulkDeleteResponse = {
  detail: string;
  deleted: number;
};
