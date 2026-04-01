import { apiRequest } from "./auth";
import type {
  FinishedProductPayload,
  FinishedProductRecord,
  RawMaterialPayload,
  RawMaterialRecord,
  ReorderAlertRecord,
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

export async function fetchStorageLocations() {
  return apiRequest<StorageLocationRecord[]>(resourcePath("storage-locations"));
}

export async function fetchStorageLocation(id: number) {
  return apiRequest<StorageLocationRecord>(detailPath("storage-locations", id));
}

export async function createStorageLocation(payload: StorageLocationPayload) {
  return apiRequest<StorageLocationRecord>(
    resourcePath("storage-locations"),
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    { csrf: true },
  );
}

export async function updateStorageLocation(
  id: number,
  payload: Partial<StorageLocationPayload>,
) {
  return apiRequest<StorageLocationRecord>(
    detailPath("storage-locations", id),
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
    { csrf: true },
  );
}

export async function deleteStorageLocation(id: number) {
  return apiRequest<void>(
    detailPath("storage-locations", id),
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

export async function fetchFinishedProducts() {
  return apiRequest<FinishedProductRecord[]>(resourcePath("finished-products"));
}

export async function fetchFinishedProduct(id: number) {
  return apiRequest<FinishedProductRecord>(detailPath("finished-products", id));
}

export async function createFinishedProduct(payload: FinishedProductPayload) {
  return apiRequest<FinishedProductRecord>(
    resourcePath("finished-products"),
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    { csrf: true },
  );
}

export async function updateFinishedProduct(
  id: number,
  payload: Partial<FinishedProductPayload>,
) {
  return apiRequest<FinishedProductRecord>(
    detailPath("finished-products", id),
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
    { csrf: true },
  );
}

export async function deleteFinishedProduct(id: number) {
  return apiRequest<void>(
    detailPath("finished-products", id),
    { method: "DELETE" },
    { csrf: true },
  );
}

export async function fetchStockItems() {
  return apiRequest<StockItemRecord[]>(resourcePath("stock-items"));
}

export async function fetchStockItem(id: number) {
  return apiRequest<StockItemRecord>(detailPath("stock-items", id));
}

export async function createStockItem(payload: StockItemPayload) {
  return apiRequest<StockItemRecord>(
    resourcePath("stock-items"),
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    { csrf: true },
  );
}

export async function updateStockItem(
  id: number,
  payload: Partial<StockItemPayload>,
) {
  return apiRequest<StockItemRecord>(
    detailPath("stock-items", id),
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
    { csrf: true },
  );
}

export async function deleteStockItem(id: number) {
  return apiRequest<void>(
    detailPath("stock-items", id),
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

export async function fetchReorderAlerts() {
  return apiRequest<ReorderAlertRecord[]>(resourcePath("reorder-alerts"));
}
