export type OrdersTimestampFields = {
  id: number;
  created_at: string;
  updated_at: string;
};

export type OrderStatus = "draft" | "sent" | "partial" | "received" | "cancelled";
export type OrderPaymentMethod = "cash" | "card" | "mobile_money" | "bank";
export type DeliveryScheduleStatus =
  | "scheduled"
  | "rescheduled"
  | "completed"
  | "cancelled";
export type DeliveryRecordStatus = "pending" | "delivered" | "partial" | "failed";

export type OrderRecord = OrdersTimestampFields & {
  order_number: string;
  supplier: number | null;
  supplier_name: string;
  client: number | null;
  client_name: string;
  seller: number | null;
  seller_name: string;
  performed_by: number | null;
  performed_by_name: string;
  payment_record: number | null;
  order_date: string;
  expected_delivery: string | null;
  status: OrderStatus;
  total_amount: string;
  payment_method: OrderPaymentMethod;
};

export type OrderPayload = {
  supplier: number | null;
  client: number | null;
  seller: number | null;
  performed_by: number | null;
  payment_record: number | null;
  order_date: string;
  expected_delivery: string | null;
  status: OrderStatus;
  payment_method: OrderPaymentMethod;
};

export type OrderItemRecord = OrdersTimestampFields & {
  order: number;
  order_number: string;
  product: number | null;
  product_name_display: string;
  product_name: string;
  quantity_ordered: string;
  unit_cost: string;
  line_total: string;
};

export type OrderItemPayload = {
  order: number;
  product: number | null;
  product_name: string;
  quantity_ordered: string;
  unit_cost?: string;
};

export type GoodsReceivedNoteRecord = OrdersTimestampFields & {
  order: number;
  order_number: string;
  grn_number: string;
  received_date: string;
  received_by: number | null;
  received_by_name: string;
  remarks: string;
};

export type GoodsReceivedNotePayload = {
  order: number;
  received_date: string;
  received_by: number | null;
  remarks: string;
};

export type GoodsReceivedNoteItemRecord = OrdersTimestampFields & {
  goods_received_note: number;
  grn_number: string;
  order_item: number | null;
  product: number | null;
  product_name_display: string;
  product_name: string;
  quantity_received: string;
  condition: string;
};

export type GoodsReceivedNoteItemPayload = {
  goods_received_note: number;
  order_item: number | null;
  product: number | null;
  product_name: string;
  quantity_received: string;
  condition: string;
};

export type DeliveryScheduleRecord = OrdersTimestampFields & {
  order: number;
  order_number: string;
  seller: number | null;
  seller_name: string;
  scheduled_date: string;
  status: DeliveryScheduleStatus;
  notes: string;
};

export type DeliverySchedulePayload = {
  order: number;
  seller: number | null;
  scheduled_date: string;
  status: DeliveryScheduleStatus;
  notes: string;
};

export type DeliveryRecord = OrdersTimestampFields & {
  order: number;
  order_number: string;
  schedule: number | null;
  delivery_date: string;
  recipient_name: string;
  delivery_status: DeliveryRecordStatus;
  quantity_received: string;
  condition: string;
  proof_reference: string;
  delivery_note: string;
};

export type DeliveryRecordPayload = {
  order: number;
  schedule: number | null;
  delivery_date: string;
  recipient_name: string;
  delivery_status: DeliveryRecordStatus;
  quantity_received: string;
  condition: string;
  proof_reference: string;
  delivery_note: string;
};
