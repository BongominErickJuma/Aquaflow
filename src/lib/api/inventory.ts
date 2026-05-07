import { apiRequest } from "./auth";
import type {
  CategoryPayload,
  CategoryRecord,
  FinishedProductPayload,
  FinishedProductRecord,
  RawMaterialPayload,
  RawMaterialRecord,
  ReorderAlertRecord,
  StockAlertRecord,
  StockItemPayload,
  StockItemRecord,
  StockMovementPayload,
  StockMovementRecord,
  StorageLocationPayload,
  StorageLocationRecord,
  SupplierPayload,
  SupplierRecord,
  UnitPayload,
  UnitRecord,
} from "../../types/inventory";

const INVENTORY_BASE_PATH = "/api/inventory";

function resourcePath(resource: string) {
  return `${INVENTORY_BASE_PATH}/${resource}/`;
}

function detailPath(resource: string, id: number) {
  return `${resourcePath(resource)}${id}/`;
}

function buildProductFormData(payload: FinishedProductPayload) {
  const formData = new FormData();
  formData.set("name", payload.name);
  formData.set("description", payload.description);
  formData.set("unit", String(payload.unit));
  formData.set("unit_price", payload.unit_price);
  formData.set("cost_price", payload.cost_price);
  formData.set("reorder_level", payload.reorder_level);
  formData.set("reorder_quantity", payload.reorder_quantity);
  formData.set("is_active", String(payload.is_active));
  formData.set("category", payload.category ? String(payload.category) : "");
  formData.set("supplier", payload.supplier ? String(payload.supplier) : "");
  formData.set("location", payload.location ? String(payload.location) : "");

  if (payload.image instanceof File) {
    formData.set("image", payload.image);
  }

  if (payload.clear_image) {
    formData.set("clear_image", "true");
  }

  return formData;
}

export async function fetchUnits() {
  return apiRequest<UnitRecord[]>(resourcePath("units"));
}

export async function fetchUnit(id: number) {
  return apiRequest<UnitRecord>(detailPath("units", id));
}

export async function createUnit(payload: UnitPayload) {
  return apiRequest<UnitRecord>(
    resourcePath("units"),
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    { csrf: true },
  );
}

export async function updateUnit(id: number, payload: Partial<UnitPayload>) {
  return apiRequest<UnitRecord>(
    detailPath("units", id),
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
    { csrf: true },
  );
}

export async function deleteUnit(id: number) {
  return apiRequest<void>(
    detailPath("units", id),
    { method: "DELETE" },
    { csrf: true },
  );
}

export async function fetchCategories() {
  return apiRequest<CategoryRecord[]>(resourcePath("categories"));
}

export async function fetchCategory(id: number) {
  return apiRequest<CategoryRecord>(detailPath("categories", id));
}

export async function createCategory(payload: CategoryPayload) {
  return apiRequest<CategoryRecord>(
    resourcePath("categories"),
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    { csrf: true },
  );
}

export async function updateCategory(
  id: number,
  payload: Partial<CategoryPayload>,
) {
  return apiRequest<CategoryRecord>(
    detailPath("categories", id),
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
    { csrf: true },
  );
}

export async function deleteCategory(id: number) {
  return apiRequest<void>(
    detailPath("categories", id),
    { method: "DELETE" },
    { csrf: true },
  );
}

export async function fetchSuppliers() {
  return apiRequest<SupplierRecord[]>(resourcePath("suppliers"));
}

export async function fetchSupplier(id: number) {
  return apiRequest<SupplierRecord>(detailPath("suppliers", id));
}

export async function createSupplier(payload: SupplierPayload) {
  return apiRequest<SupplierRecord>(
    resourcePath("suppliers"),
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    { csrf: true },
  );
}

export async function updateSupplier(
  id: number,
  payload: Partial<SupplierPayload>,
) {
  return apiRequest<SupplierRecord>(
    detailPath("suppliers", id),
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
    { csrf: true },
  );
}

export async function deleteSupplier(id: number) {
  return apiRequest<void>(
    detailPath("suppliers", id),
    { method: "DELETE" },
    { csrf: true },
  );
}

export async function fetchWarehouses() {
  return apiRequest<StorageLocationRecord[]>(resourcePath("warehouses"));
}

export async function fetchWarehouse(id: number) {
  return apiRequest<StorageLocationRecord>(detailPath("warehouses", id));
}

export async function createWarehouse(payload: StorageLocationPayload) {
  return apiRequest<StorageLocationRecord>(
    resourcePath("warehouses"),
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    { csrf: true },
  );
}

export async function updateWarehouse(
  id: number,
  payload: Partial<StorageLocationPayload>,
) {
  return apiRequest<StorageLocationRecord>(
    detailPath("warehouses", id),
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
    { csrf: true },
  );
}

export async function deleteWarehouse(id: number) {
  return apiRequest<void>(
    detailPath("warehouses", id),
    { method: "DELETE" },
    { csrf: true },
  );
}

export async function fetchRawMaterials() {
  return apiRequest<RawMaterialRecord[]>(resourcePath("raw-materials"));
}

export async function fetchRawMaterial(id: number) {
  return apiRequest<RawMaterialRecord>(detailPath("raw-materials", id));
}

export async function createRawMaterial(payload: RawMaterialPayload) {
  return apiRequest<RawMaterialRecord>(
    resourcePath("raw-materials"),
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    { csrf: true },
  );
}

export async function updateRawMaterial(
  id: number,
  payload: Partial<RawMaterialPayload>,
) {
  return apiRequest<RawMaterialRecord>(
    detailPath("raw-materials", id),
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
    { csrf: true },
  );
}

export async function deleteRawMaterial(id: number) {
  return apiRequest<void>(
    detailPath("raw-materials", id),
    { method: "DELETE" },
    { csrf: true },
  );
}

export async function fetchProducts() {
  return apiRequest<FinishedProductRecord[]>(resourcePath("products"));
}

export async function fetchProduct(id: number) {
  return apiRequest<FinishedProductRecord>(detailPath("products", id));
}

export async function createProduct(payload: FinishedProductPayload) {
  return apiRequest<FinishedProductRecord>(
    resourcePath("products"),
    {
      method: "POST",
      body: buildProductFormData(payload),
    },
    { csrf: true },
  );
}

export async function updateProduct(
  id: number,
  payload: Partial<FinishedProductPayload>,
) {
  const normalizedPayload: FinishedProductPayload = {
    name: payload.name ?? "",
    description: payload.description ?? "",
    category:
      payload.category === undefined ? null : payload.category,
    supplier:
      payload.supplier === undefined ? null : payload.supplier,
    unit: payload.unit ?? 0,
    unit_price: payload.unit_price ?? "0.00",
    cost_price: payload.cost_price ?? "0.00",
    reorder_level: payload.reorder_level ?? "0.00",
    reorder_quantity: payload.reorder_quantity ?? "0.00",
    location:
      payload.location === undefined ? null : payload.location,
    image: payload.image ?? null,
    clear_image: payload.clear_image ?? false,
    is_active: payload.is_active ?? true,
  };

  return apiRequest<FinishedProductRecord>(
    detailPath("products", id),
    {
      method: "PATCH",
      body: buildProductFormData(normalizedPayload),
    },
    { csrf: true },
  );
}

export async function deleteProduct(id: number) {
  return apiRequest<void>(
    detailPath("products", id),
    { method: "DELETE" },
    { csrf: true },
  );
}

export async function fetchWarehouseStock() {
  return apiRequest<StockItemRecord[]>(resourcePath("warehouse-stock"));
}

export async function fetchWarehouseStockItem(id: number) {
  return apiRequest<StockItemRecord>(detailPath("warehouse-stock", id));
}

export async function createWarehouseStock(payload: StockItemPayload) {
  return apiRequest<StockItemRecord>(
    resourcePath("warehouse-stock"),
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    { csrf: true },
  );
}

export async function updateWarehouseStock(
  id: number,
  payload: Partial<StockItemPayload>,
) {
  return apiRequest<StockItemRecord>(
    detailPath("warehouse-stock", id),
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
    { csrf: true },
  );
}

export async function deleteWarehouseStock(id: number) {
  return apiRequest<void>(
    detailPath("warehouse-stock", id),
    { method: "DELETE" },
    { csrf: true },
  );
}

export async function fetchStockMovements() {
  return apiRequest<StockMovementRecord[]>(resourcePath("stock-movements"));
}

export async function fetchStockMovement(id: number) {
  return apiRequest<StockMovementRecord>(detailPath("stock-movements", id));
}

export async function createStockMovement(payload: StockMovementPayload) {
  return apiRequest<StockMovementRecord>(
    resourcePath("stock-movements"),
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    { csrf: true },
  );
}

export async function updateStockMovement(
  id: number,
  payload: Partial<StockMovementPayload>,
) {
  return apiRequest<StockMovementRecord>(
    detailPath("stock-movements", id),
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
    { csrf: true },
  );
}

export async function deleteStockMovement(id: number) {
  return apiRequest<void>(
    detailPath("stock-movements", id),
    { method: "DELETE" },
    { csrf: true },
  );
}

export async function fetchStockAlerts() {
  return apiRequest<StockAlertRecord[]>(resourcePath("stock-alerts"));
}

export async function acknowledgeStockAlert(id: number) {
  return apiRequest<StockAlertRecord>(
    `${detailPath("stock-alerts", id)}acknowledge/`,
    { method: "POST" },
    { csrf: true },
  );
}

export async function fetchReorderAlerts() {
  return apiRequest<ReorderAlertRecord[]>(resourcePath("reorder-alerts"));
}
