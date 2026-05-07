export type InventoryTimestampFields = {
  id: number;
  created_at: string;
  updated_at: string;
};

export type UnitRecord = InventoryTimestampFields & {
  name: string;
  symbol: string;
  description: string;
};

export type UnitPayload = Omit<UnitRecord, "id" | "created_at" | "updated_at">;

export type CategoryRecord = InventoryTimestampFields & {
  name: string;
  parent: number | null;
  parent_name: string;
  description: string;
};

export type CategoryPayload = Omit<
  CategoryRecord,
  "id" | "created_at" | "updated_at" | "parent_name"
>;

export type SupplierRecord = InventoryTimestampFields & {
  name: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
  payment_terms: string;
  lead_days: number;
  is_active: boolean;
};

export type SupplierPayload = Omit<
  SupplierRecord,
  "id" | "created_at" | "updated_at"
>;

export type StorageLocationRecord = InventoryTimestampFields & {
  name: string;
  location: string;
  manager: number | null;
  manager_name: string;
  description: string;
  is_active: boolean;
};

export type StorageLocationPayload = Omit<
  StorageLocationRecord,
  "id" | "created_at" | "updated_at" | "manager_name"
>;

export type RawMaterialRecord = InventoryTimestampFields & {
  name: string;
  description: string;
  unit: number;
  unit_name: string;
  supplier: number | null;
  supplier_name: string;
  reorder_level: string;
  notes: string;
  is_active: boolean;
};

export type RawMaterialPayload = Omit<
  RawMaterialRecord,
  "id" | "created_at" | "updated_at" | "unit_name" | "supplier_name"
>;

export type FinishedProductRecord = InventoryTimestampFields & {
  barcode: string;
  detail_path: string;
  detail_url: string;
  qr_code_value: string;
  name: string;
  description: string;
  category: number | null;
  category_name: string;
  supplier: number | null;
  supplier_name: string;
  unit: number;
  unit_name: string;
  unit_price: string;
  cost_price: string;
  reorder_level: string;
  reorder_quantity: string;
  current_stock: string;
  location: number | null;
  location_name: string;
  image: string | null;
  is_active: boolean;
};

export type FinishedProductPayload = {
  name: string;
  description: string;
  category: number | null;
  supplier: number | null;
  unit: number;
  unit_price: string;
  cost_price: string;
  reorder_level: string;
  reorder_quantity: string;
  location: number | null;
  image: File | string | null;
  clear_image?: boolean;
  is_active: boolean;
};

export type StockItemRecord = InventoryTimestampFields & {
  raw_material: number | null;
  finished_product: number | null;
  location: number;
  warehouse_name: string;
  quantity: string;
  bin_location: string;
  item_type: "raw_material" | "finished_product";
  item_name: string;
  reorder_level: string;
  unit_name: string;
  is_below_reorder: boolean;
};

export type StockItemPayload = {
  raw_material?: number | null;
  finished_product?: number | null;
  location: number;
  opening_stock?: string;
  bin_location: string;
};

export type StockMovementType =
  | "stock_in"
  | "stock_out"
  | "adjustment_positive"
  | "adjustment_negative"
  | "return";

export type StockMovementRecord = InventoryTimestampFields & {
  stock_item: number;
  stock_item_name: string;
  stock_item_type: "raw_material" | "finished_product";
  movement_type: StockMovementType;
  quantity: string;
  notes: string;
  movement_date: string;
  performed_by: number | null;
};

export type StockMovementPayload = Omit<
  StockMovementRecord,
  | "id"
  | "created_at"
  | "updated_at"
  | "performed_by"
  | "stock_item_name"
  | "stock_item_type"
>;

export type StockAlertRecord = InventoryTimestampFields & {
  stock_item: number;
  product_id: number | null;
  item_type: "raw_material" | "finished_product";
  item_name: string;
  warehouse_id: number;
  warehouse_name: string;
  quantity: string;
  alert_type: "low" | "out_of_stock" | "expiry";
  is_acknowledged: boolean;
  acknowledged_by: number | null;
  triggered_at: string;
};

export type StockAlertPayload = Pick<StockAlertRecord, "is_acknowledged">;

export type ReorderAlertRecord = StockAlertRecord;
