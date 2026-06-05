export type SalesTimestampFields = {
  id: number;
  created_at: string;
  updated_at: string;
};

export type SaleStatus = "draft" | "completed" | "cancelled";
export type SalesPaymentMethod = "cash" | "card" | "mobile_money" | "bank";
export type SalesLogTone = "success" | "warning" | "danger" | "neutral";

export type CustomerCategoryRecord = SalesTimestampFields & {
  name: string;
  description: string;
  is_active: boolean;
};

export type CustomerCategoryPayload = Omit<
  CustomerCategoryRecord,
  "id" | "created_at" | "updated_at"
>;

export type ClientRecord = SalesTimestampFields & {
  category: number | null;
  category_name: string;
  name: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
  credit_limit: string;
  balance: string;
  is_active: boolean;
};

export type ClientPayload = {
  category: number | null;
  name: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
  credit_limit: string;
  balance: string;
  is_active: boolean;
};

export type SaleRecord = SalesTimestampFields & {
  client: number;
  client_name: string;
  seller: number | null;
  seller_name: string;
  seller_code: string;
  sale_number: string;
  sale_date: string;
  status: SaleStatus;
  payment_method: SalesPaymentMethod;
  total_amount: string;
  completed_at: string | null;
  cancelled_at: string | null;
};

export type SalePayload = {
  client: number;
  seller: number | null;
  sale_date: string;
  status: SaleStatus;
  payment_method: SalesPaymentMethod;
};

export type SaleItemRecord = SalesTimestampFields & {
  sale: number;
  sale_number: string;
  product: number | null;
  product_name_display: string;
  product_name: string;
  quantity: string;
  unit_price: string;
  line_total: string;
};

export type SaleItemPayload = {
  sale: number;
  product: number | null;
  product_name: string;
  quantity: string;
  unit_price?: string;
};

export type PaymentRecord = SalesTimestampFields & {
  sale: number;
  sale_number: string;
  amount: string;
  payment_method: SalesPaymentMethod;
  reference: string;
  received_by: number | null;
  received_by_name: string;
  payment_date: string;
};

export type PaymentPayload = {
  sale: number;
  amount: string;
  payment_method: SalesPaymentMethod;
  reference: string;
  received_by: number | null;
  payment_date: string;
};

export type SalesLogRecord = {
  id: number;
  sale_id: string;
  business_date: string;
  logged_at: string;
  seller_name: string;
  seller_code: string;
  customer_name: string;
  product_summary: string;
  quantity_total: number;
  item_count: number;
  amount: number;
  payment_method: SalesPaymentMethod;
  payment_method_label: string;
  status_label: string;
  status_tone: SalesLogTone;
};

export type SalesLogSummary = {
  total_sales_today: number;
  total_sales_amount: number;
  average_sale_value: number;
  cancelled_sales_count: number;
  top_client_name: string | null;
  top_client_amount: number;
  top_seller_name: string | null;
  top_seller_names: string[];
  top_seller_sales_count: number;
};

export type PaginatedSalesLogResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: SalesLogRecord[];
};

export type SalesLogDetail = {
  entry: SalesLogRecord;
  sale: SaleRecord;
  items: SaleItemRecord[];
  payments: PaymentRecord[];
};

// Deprecated compatibility types kept while older pages finish moving.
export type BrandingStatus = "active" | "inactive" | "archived";
export type OrderStatus =
  | "draft"
  | "confirmed"
  | "pending"
  | "dispatched"
  | "completed"
  | "cancelled";
export type PaymentMethod = SalesPaymentMethod | "bank_transfer" | "credit";
export type DeliveryScheduleStatus =
  | "scheduled"
  | "rescheduled"
  | "completed"
  | "cancelled";
export type DeliveryRecordStatus = "pending" | "delivered" | "partial" | "failed";

export type SalesOrderRecord = SalesTimestampFields & {
  client: number;
  client_name: string;
  assigned_seller?: number | null;
  assigned_seller_name?: string;
  assigned_seller_code?: string;
  order_number: string;
  order_date: string;
  expected_delivery_date: string | null;
  status: OrderStatus;
  payment_method?: PaymentMethod;
  total_amount: string;
  notes: string;
};

export type SalesOrderPayload = {
  client: number;
  assigned_seller?: number | null;
  order_date: string;
  expected_delivery_date: string | null;
  status: OrderStatus;
  payment_method?: PaymentMethod;
  notes: string;
};

export type BrandingRecord = SalesTimestampFields & {
  client: number | null;
  client_name: string;
  title: string;
  branding_type: string;
  status: BrandingStatus;
  notes: string;
};

export type BrandingPayload = Omit<
  BrandingRecord,
  "id" | "created_at" | "updated_at" | "client_name"
>;

export type OrderItemRecord = SalesTimestampFields & {
  order: number;
  order_number: string;
  finished_product: number | null;
  finished_product_name: string;
  product_name: string;
  quantity: string;
  unit_price: string;
  line_total: string;
  notes: string;
};

export type OrderItemPayload = Omit<
  OrderItemRecord,
  | "id"
  | "created_at"
  | "updated_at"
  | "order_number"
  | "finished_product_name"
  | "line_total"
>;

export type DeliveryScheduleRecord = SalesTimestampFields & {
  order: number;
  order_number: string;
  scheduled_date: string;
  seller?: number | null;
  seller_name?: string;
  seller_code?: string;
  assigned_vehicle: string;
  assigned_driver: string;
  status: DeliveryScheduleStatus;
  notes: string;
};

export type DeliverySchedulePayload = {
  order: number;
  scheduled_date: string;
  seller?: number | null;
  assigned_vehicle: string;
  assigned_driver: string;
  status: DeliveryScheduleStatus;
  notes: string;
};

export type DeliveryRecord = SalesTimestampFields & {
  order: number;
  order_number: string;
  schedule: number | null;
  delivery_date: string;
  recipient_name: string;
  delivery_status: DeliveryRecordStatus;
  proof_reference: string;
  delivery_note: string;
};

export type DeliveryRecordPayload = {
  order: number;
  schedule: number | null;
  delivery_date: string;
  recipient_name: string;
  delivery_status: DeliveryRecordStatus;
  delivery_note: string;
};
