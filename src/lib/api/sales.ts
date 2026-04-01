import { apiRequest } from "./auth";
import type {
  BrandingPayload,
  BrandingRecord,
  ClientPayload,
  ClientRecord,
  CustomerCategoryPayload,
  CustomerCategoryRecord,
  DeliveryRecord,
  DeliveryRecordPayload,
  DeliverySchedulePayload,
  DeliveryScheduleRecord,
  OrderItemPayload,
  OrderItemRecord,
  SalesOrderPayload,
  SalesOrderRecord,
} from "../../types/sales";

const SALES_BASE_PATH = "/api/sales";

function resourcePath(resource: string) {
  return `${SALES_BASE_PATH}/${resource}/`;
}

function detailPath(resource: string, id: number) {
  return `${resourcePath(resource)}${id}/`;
}

function createCrud<TRecord, TPayload>(resource: string) {
  return {
    list: () => apiRequest<TRecord[]>(resourcePath(resource)),
    detail: (id: number) => apiRequest<TRecord>(detailPath(resource, id)),
    create: (payload: TPayload) =>
      apiRequest<TRecord>(
        resourcePath(resource),
        { method: "POST", body: JSON.stringify(payload) },
        { csrf: true },
      ),
    update: (id: number, payload: Partial<TPayload>) =>
      apiRequest<TRecord>(
        detailPath(resource, id),
        { method: "PATCH", body: JSON.stringify(payload) },
        { csrf: true },
      ),
    remove: (id: number) =>
      apiRequest<void>(
        detailPath(resource, id),
        { method: "DELETE" },
        { csrf: true },
      ),
  };
}

const customerCategories = createCrud<
  CustomerCategoryRecord,
  CustomerCategoryPayload
>("customer-categories");
const clients = createCrud<ClientRecord, ClientPayload>("clients");
const brandingRecords = createCrud<BrandingRecord, BrandingPayload>(
  "branding-records",
);
const orders = createCrud<SalesOrderRecord, SalesOrderPayload>("orders");
const orderItems = createCrud<OrderItemRecord, OrderItemPayload>("order-items");
const deliverySchedules = createCrud<
  DeliveryScheduleRecord,
  DeliverySchedulePayload
>("delivery-schedules");
const deliveryRecords = createCrud<DeliveryRecord, DeliveryRecordPayload>(
  "delivery-records",
);

export const fetchCustomerCategories = customerCategories.list;
export const fetchCustomerCategory = customerCategories.detail;
export const createCustomerCategory = customerCategories.create;
export const updateCustomerCategory = customerCategories.update;
export const deleteCustomerCategory = customerCategories.remove;

export const fetchClients = clients.list;
export const fetchClient = clients.detail;
export const createClient = clients.create;
export const updateClient = clients.update;
export const deleteClient = clients.remove;

export const fetchBrandingRecords = brandingRecords.list;
export const fetchBrandingRecord = brandingRecords.detail;
export const createBrandingRecord = brandingRecords.create;
export const updateBrandingRecord = brandingRecords.update;
export const deleteBrandingRecord = brandingRecords.remove;

export const fetchSalesOrders = orders.list;
export const fetchSalesOrder = orders.detail;
export const createSalesOrder = orders.create;
export const updateSalesOrder = orders.update;
export const deleteSalesOrder = orders.remove;

export const fetchOrderItems = orderItems.list;
export const fetchOrderItem = orderItems.detail;
export const createOrderItem = orderItems.create;
export const updateOrderItem = orderItems.update;
export const deleteOrderItem = orderItems.remove;

export const fetchDeliverySchedules = deliverySchedules.list;
export const fetchDeliverySchedule = deliverySchedules.detail;
export const createDeliverySchedule = deliverySchedules.create;
export const updateDeliverySchedule = deliverySchedules.update;
export const deleteDeliverySchedule = deliverySchedules.remove;

export const fetchDeliveryRecords = deliveryRecords.list;
export const fetchDeliveryRecord = deliveryRecords.detail;
export const createDeliveryRecord = deliveryRecords.create;
export const updateDeliveryRecord = deliveryRecords.update;
export const deleteDeliveryRecord = deliveryRecords.remove;
