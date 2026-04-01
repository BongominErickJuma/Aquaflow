export type SalesTimestampFields = {
  id: number;
  created_at: string;
  updated_at: string;
};

export type BrandingStatus = "active" | "inactive" | "archived";
export type OrderStatus =
  | "draft"
  | "confirmed"
  | "processing"
  | "dispatched"
  | "completed"
  | "cancelled";
export type DeliveryScheduleStatus =
  | "scheduled"
  | "rescheduled"
  | "completed"
  | "cancelled";
export type DeliveryRecordStatus =
  | "pending"
  | "delivered"
  | "partial"
  | "failed";

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
  phone_number: string;
  address: string;
  notes: string;
  is_active: boolean;
};

export type ClientPayload = Omit<
  ClientRecord,
  "id" | "created_at" | "updated_at" | "category_name"
>;

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

export type SalesOrderRecord = SalesTimestampFields & {
  client: number;
  client_name: string;
  order_number: string;
  order_date: string;
  expected_delivery_date: string | null;
  status: OrderStatus;
  total_amount: string;
  notes: string;
};

export type SalesOrderPayload = Omit<
  SalesOrderRecord,
  "id" | "created_at" | "updated_at" | "client_name" | "total_amount"
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
  assigned_vehicle: string;
  assigned_driver: string;
  status: DeliveryScheduleStatus;
  notes: string;
};

export type DeliverySchedulePayload = Omit<
  DeliveryScheduleRecord,
  "id" | "created_at" | "updated_at" | "order_number"
>;

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

export type DeliveryRecordPayload = Omit<
  DeliveryRecord,
  "id" | "created_at" | "updated_at" | "order_number"
>;
