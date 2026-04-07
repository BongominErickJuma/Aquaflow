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

export type SupplierRecord = InventoryTimestampFields & {
  name: string;
  contact_person: string;
  email: string;
  phone_number: string;
  address: string;
  notes: string;
  is_active: boolean;
};

export type SupplierPayload = Omit<
  SupplierRecord,
  "id" | "created_at" | "updated_at"
>;

export type StorageLocationRecord = InventoryTimestampFields & {
  name: string;
  description: string;
  is_active: boolean;
};

export type StorageLocationPayload = Omit<
  StorageLocationRecord,
  "id" | "created_at" | "updated_at"
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
  name: string;
  sku: string;
  description: string;
  unit: number;
  unit_name: string;
  unit_price: string;
  reorder_level: string;
  notes: string;
  is_active: boolean;
};

export type FinishedProductPayload = Omit<
  FinishedProductRecord,
  "id" | "created_at" | "updated_at" | "unit_name" | "sku"
>;

export type StockItemRecord = InventoryTimestampFields & {
  raw_material: number | null;
  finished_product: number | null;
  location: number;
  quantity: string;
  notes: string;
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
  notes: string;
};

export type StockMovementType =
  | "stock_in"
  | "stock_out"
  | "adjustment_positive"
  | "adjustment_negative";

export type StockMovementRecord = InventoryTimestampFields & {
  stock_item: number;
  stock_item_name: string;
  stock_item_type: "raw_material" | "finished_product";
  movement_type: StockMovementType;
  quantity: string;
  reference_note: string;
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

export type ReorderAlertRecord = {
  id: number;
  item_type: "raw_material" | "finished_product";
  item_name: string;
  location: number;
  quantity: string;
  reorder_level: string;
  shortage: string;
  unit_name: string;
  updated_at: string;
};
