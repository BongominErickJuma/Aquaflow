import { apiRequest } from "./auth";
import type {
  DeliveryRecord,
  DeliveryRecordPayload,
  DeliverySchedulePayload,
  DeliveryScheduleRecord,
  GoodsReceivedNoteItemPayload,
  GoodsReceivedNoteItemRecord,
  GoodsReceivedNotePayload,
  GoodsReceivedNoteRecord,
  OrderItemPayload,
  OrderItemRecord,
  OrderPayload,
  OrderRecord,
} from "../../types/orders";

const ORDERS_BASE_PATH = "/api/orders";

function resourcePath(resource: string) {
  return `${ORDERS_BASE_PATH}/${resource}/`;
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

const orders = createCrud<OrderRecord, OrderPayload>("orders");
const orderItems = createCrud<OrderItemRecord, OrderItemPayload>("order-items");
const goodsReceivedNotes = createCrud<
  GoodsReceivedNoteRecord,
  GoodsReceivedNotePayload
>("goods-received-notes");
const goodsReceivedNoteItems = createCrud<
  GoodsReceivedNoteItemRecord,
  GoodsReceivedNoteItemPayload
>("goods-received-note-items");
const deliverySchedules = createCrud<
  DeliveryScheduleRecord,
  DeliverySchedulePayload
>("delivery-schedules");
const deliveryRecords = createCrud<DeliveryRecord, DeliveryRecordPayload>(
  "delivery-records",
);

export const fetchOrders = orders.list;
export const fetchOrder = orders.detail;
export const createOrder = orders.create;
export const updateOrder = orders.update;
export const deleteOrder = orders.remove;

export const fetchOrderItems = orderItems.list;
export const fetchOrderItem = orderItems.detail;
export const createOrderItem = orderItems.create;
export const updateOrderItem = orderItems.update;
export const deleteOrderItem = orderItems.remove;

export const fetchGoodsReceivedNotes = goodsReceivedNotes.list;
export const fetchGoodsReceivedNote = goodsReceivedNotes.detail;
export const createGoodsReceivedNote = goodsReceivedNotes.create;
export const updateGoodsReceivedNote = goodsReceivedNotes.update;
export const deleteGoodsReceivedNote = goodsReceivedNotes.remove;

export const fetchGoodsReceivedNoteItems = goodsReceivedNoteItems.list;
export const fetchGoodsReceivedNoteItem = goodsReceivedNoteItems.detail;
export const createGoodsReceivedNoteItem = goodsReceivedNoteItems.create;
export const updateGoodsReceivedNoteItem = goodsReceivedNoteItems.update;
export const deleteGoodsReceivedNoteItem = goodsReceivedNoteItems.remove;

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
