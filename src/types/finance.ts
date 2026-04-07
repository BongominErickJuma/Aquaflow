export type FinanceTimestampFields = {
  id: number;
  created_at: string;
  updated_at: string;
};

export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "cancelled";
export type InsuranceStatus = "active" | "expired" | "cancelled";

export type CapitalRecord = FinanceTimestampFields & {
  record_date: string;
  source_name: string;
  amount: string;
  description: string;
  notes: string;
};

export type CapitalPayload = Omit<
  CapitalRecord,
  "id" | "created_at" | "updated_at"
>;

export type OperatingCostRecord = FinanceTimestampFields & {
  cost_date: string;
  category: string;
  amount: string;
  description: string;
  notes: string;
};

export type OperatingCostPayload = Omit<
  OperatingCostRecord,
  "id" | "created_at" | "updated_at"
>;

export type ExpenseRecord = FinanceTimestampFields & {
  expense_date: string;
  expense_type: string;
  amount: string;
  vendor_name: string;
  reference_number: string;
  notes: string;
};

export type ExpensePayload = Omit<
  ExpenseRecord,
  "id" | "created_at" | "updated_at" | "reference_number"
>;

export type InvoiceRecord = FinanceTimestampFields & {
  order: number;
  order_number: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  amount: string;
  status: InvoiceStatus;
  notes: string;
};

export type InvoicePayload = Omit<
  InvoiceRecord,
  "id" | "created_at" | "updated_at" | "order_number" | "invoice_number" | "amount"
>;

export type ReceiptRecord = FinanceTimestampFields & {
  invoice: number;
  invoice_number: string;
  receipt_number: string;
  receipt_date: string;
  amount_received: string;
  payment_method: string;
  reference_number: string;
  notes: string;
};

export type ReceiptPayload = Omit<
  ReceiptRecord,
  "id" | "created_at" | "updated_at" | "invoice_number" | "receipt_number" | "reference_number"
>;

export type InsuranceRecord = FinanceTimestampFields & {
  policy_name: string;
  provider_name: string;
  policy_number: string;
  coverage_type: string;
  start_date: string;
  end_date: string;
  premium_amount: string;
  status: InsuranceStatus;
  notes: string;
};

export type InsurancePayload = Omit<
  InsuranceRecord,
  "id" | "created_at" | "updated_at"
>;

export type ProfitabilitySnapshotRecord = FinanceTimestampFields & {
  snapshot_date: string;
  revenue: string;
  total_costs: string;
  profit: string;
  notes: string;
};

export type ProfitabilitySnapshotPayload = Omit<
  ProfitabilitySnapshotRecord,
  "id" | "created_at" | "updated_at" | "profit"
>;
