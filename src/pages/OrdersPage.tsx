import {
  ClipboardCheck,
  LoaderCircle,
  PackageCheck,
  Pencil,
  Plus,
  RefreshCw,
  Truck,
  X,
} from "lucide-react";
import { PickerField } from "../components/forms/PickerField";
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { ModuleTabs } from "../components/layout/ModuleTabs";
import { ApiError } from "../lib/api/auth";
import { fetchProducts, fetchSuppliers } from "../lib/api/inventory";
import {
  createDeliveryRecord,
  createDeliverySchedule,
  createGoodsReceivedNote,
  createGoodsReceivedNoteItem,
  createOrder,
  createOrderItem,
  fetchDeliveryRecords,
  fetchDeliverySchedules,
  fetchGoodsReceivedNoteItems,
  fetchGoodsReceivedNotes,
  fetchOrderItems,
  fetchOrders,
  updateDeliveryRecord,
  updateDeliverySchedule,
  updateGoodsReceivedNote,
  updateGoodsReceivedNoteItem,
  updateOrder,
  updateOrderItem,
} from "../lib/api/orders";
import { fetchClients } from "../lib/api/sales";
import { fetchEmployees } from "../lib/api/workforce";
import type { FinishedProductRecord, SupplierRecord } from "../types/inventory";
import type {
  DeliveryRecord,
  DeliveryRecordPayload,
  DeliveryRecordStatus,
  DeliverySchedulePayload,
  DeliveryScheduleRecord,
  DeliveryScheduleStatus,
  GoodsReceivedNoteItemPayload,
  GoodsReceivedNoteItemRecord,
  GoodsReceivedNotePayload,
  GoodsReceivedNoteRecord,
  OrderItemPayload,
  OrderItemRecord,
  OrderPaymentMethod,
  OrderPayload,
  OrderRecord,
  OrderStatus,
} from "../types/orders";
import type { ClientRecord } from "../types/sales";
import type { EmployeeRecord } from "../types/workforce";

type OrdersTab =
  | "orders"
  | "items"
  | "grn"
  | "grnItems"
  | "schedules"
  | "deliveries";
type ActiveModal =
  | "order"
  | "item"
  | "grn"
  | "grnItem"
  | "schedule"
  | "delivery"
  | null;

const tabs: { id: OrdersTab; label: string }[] = [
  { id: "orders", label: "Orders" },
  { id: "items", label: "Items" },
  { id: "grn", label: "GRN" },
  { id: "grnItems", label: "GRN Items" },
  { id: "schedules", label: "Delivery Schedules" },
  { id: "deliveries", label: "Deliveries" },
];

const ordersMilestoneFlow: Array<{
  id: OrdersTab;
  label: string;
  detail: string;
}> = [
  {
    id: "orders",
    label: "Orders",
    detail:
      "Create order headers here. Before this, make sure suppliers or clients are ready. Next, add order items.",
  },
  {
    id: "items",
    label: "Items",
    detail:
      "Attach products or direct item names to orders here. Before this, create the order. Next, receive goods.",
  },
  {
    id: "grn",
    label: "GRN",
    detail:
      "Create goods received note headers here. Before this, order headers should exist. Next, add GRN items.",
  },
  {
    id: "grnItems",
    label: "GRN Items",
    detail:
      "Add received product lines here. Before this, create the matching GRN header. Next, schedule delivery movement.",
  },
  {
    id: "schedules",
    label: "Delivery Schedules",
    detail:
      "Schedule delivery movement here. Before this, confirm the order and received goods are ready. Next, record actual delivery.",
  },
  {
    id: "deliveries",
    label: "Deliveries",
    detail:
      "Record completed delivery movement here. Sales stays separate from this order movement workflow.",
  },
];

const fieldClassName =
  "w-full rounded-2xl border border-slate-200/80 bg-slate-50/70 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-300";
const primaryButtonClassName =
  "inline-flex items-center justify-center gap-2 rounded-2xl border border-sky-200 bg-[linear-gradient(135deg,#1f87ad,#0f6d8d)] px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(32,141,183,0.22)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70";
const iconButtonClassName =
  "inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70";
const recordCardClassName =
  "group relative flex h-[320px] min-w-[300px] max-w-[300px] flex-shrink-0 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4";
const recordEditButtonClassName = `${iconButtonClassName} absolute right-4 top-4 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:pointer-events-auto`;

const orderStatuses: OrderStatus[] = [
  "draft",
  "sent",
  "partial",
  "received",
  "cancelled",
];
const paymentMethods: OrderPaymentMethod[] = [
  "cash",
  "card",
  "mobile_money",
  "bank",
];
const scheduleStatuses: DeliveryScheduleStatus[] = [
  "scheduled",
  "rescheduled",
  "completed",
  "cancelled",
];
const deliveryStatuses: DeliveryRecordStatus[] = [
  "pending",
  "delivered",
  "partial",
  "failed",
];

function today() {
  return new Date().toISOString().slice(0, 10);
}

function titleCase(value: string) {
  return value
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat("en-UG", { dateStyle: "medium" }).format(
    new Date(value),
  );
}

function formatMoney(value: string | number | null | undefined) {
  const amount =
    typeof value === "number" ? value : Number.parseFloat(value ?? "0");
  return `UGX ${new Intl.NumberFormat("en-UG", {
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0)}`;
}

function formatCompactValue(value: string | number | null | undefined) {
  const amount =
    typeof value === "number" ? value : Number.parseFloat(value ?? "0");
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  const absoluteAmount = Math.abs(safeAmount);

  const compact = (divisor: number, suffix: string) => {
    const scaledValue = safeAmount / divisor;
    const decimals = Math.abs(scaledValue) >= 10 ? 0 : 2;
    return `${scaledValue
      .toFixed(decimals)
      .replace(/\.?0+$/, "")}${suffix}`;
  };

  if (absoluteAmount >= 1_000_000) {
    return compact(1_000_000, "m");
  }

  if (absoluteAmount >= 1_000) {
    return compact(1_000, "k");
  }

  return new Intl.NumberFormat("en-UG", {
    maximumFractionDigits: 0,
  }).format(safeAmount);
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

function numberOrNull(value: string) {
  return value ? Number(value) : null;
}

function createEmptyOrderForm(): OrderPayload {
  return {
    supplier: null,
    client: null,
    seller: null,
    performed_by: null,
    payment_record: null,
    order_date: today(),
    expected_delivery: "",
    status: "draft",
    payment_method: "cash",
  };
}

function buildOrderForm(record: OrderRecord | null): OrderPayload {
  if (!record) return createEmptyOrderForm();
  return {
    supplier: record.supplier,
    client: record.client,
    seller: record.seller,
    performed_by: record.performed_by,
    payment_record: record.payment_record,
    order_date: record.order_date,
    expected_delivery: record.expected_delivery ?? "",
    status: record.status,
    payment_method: record.payment_method,
  };
}

function createEmptyItemForm(): OrderItemPayload {
  return {
    order: 0,
    product: null,
    product_name: "",
    quantity_ordered: "",
    unit_cost: "",
  };
}

function buildItemForm(record: OrderItemRecord | null): OrderItemPayload {
  if (!record) return createEmptyItemForm();
  return {
    order: record.order,
    product: record.product,
    product_name: record.product_name,
    quantity_ordered: record.quantity_ordered,
    unit_cost: record.unit_cost,
  };
}

function createEmptyGrnForm(): GoodsReceivedNotePayload {
  return {
    order: 0,
    received_date: today(),
    received_by: null,
    remarks: "",
  };
}

function buildGrnForm(
  record: GoodsReceivedNoteRecord | null,
): GoodsReceivedNotePayload {
  if (!record) return createEmptyGrnForm();
  return {
    order: record.order,
    received_date: record.received_date,
    received_by: record.received_by,
    remarks: record.remarks,
  };
}

function createEmptyGrnItemForm(): GoodsReceivedNoteItemPayload {
  return {
    goods_received_note: 0,
    order_item: null,
    product: null,
    product_name: "",
    quantity_received: "",
    condition: "good",
  };
}

function buildGrnItemForm(
  record: GoodsReceivedNoteItemRecord | null,
): GoodsReceivedNoteItemPayload {
  if (!record) return createEmptyGrnItemForm();
  return {
    goods_received_note: record.goods_received_note,
    order_item: record.order_item,
    product: record.product,
    product_name: record.product_name,
    quantity_received: record.quantity_received,
    condition: record.condition,
  };
}

function createEmptyScheduleForm(): DeliverySchedulePayload {
  return {
    order: 0,
    seller: null,
    scheduled_date: today(),
    status: "scheduled",
    notes: "",
  };
}

function buildScheduleForm(
  record: DeliveryScheduleRecord | null,
): DeliverySchedulePayload {
  if (!record) return createEmptyScheduleForm();
  return {
    order: record.order,
    seller: record.seller,
    scheduled_date: record.scheduled_date,
    status: record.status,
    notes: record.notes,
  };
}

function createEmptyDeliveryForm(): DeliveryRecordPayload {
  return {
    order: 0,
    schedule: null,
    delivery_date: today(),
    recipient_name: "",
    delivery_status: "pending",
    quantity_received: "",
    condition: "good",
    proof_reference: "",
    delivery_note: "",
  };
}

function buildDeliveryForm(record: DeliveryRecord | null): DeliveryRecordPayload {
  if (!record) return createEmptyDeliveryForm();
  return {
    order: record.order,
    schedule: record.schedule,
    delivery_date: record.delivery_date,
    recipient_name: record.recipient_name,
    delivery_status: record.delivery_status,
    quantity_received: record.quantity_received,
    condition: record.condition,
    proof_reference: record.proof_reference,
    delivery_note: record.delivery_note,
  };
}

function EmptyState({
  title,
  description,
  className = "",
}: {
  title: string;
  description: string;
  className?: string;
}) {
  return (
    <div
      className={[
        "rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-6 text-sm text-slate-500",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <p className="font-semibold text-slate-700">{title}</p>
      <p className="mt-2 leading-6">{description}</p>
    </div>
  );
}

function FormPanel({
  label,
  title,
  children,
}: {
  label: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="panel p-6">
      <p className="section-label">{label}</p>
      <h2 className="mt-1 text-2xl font-semibold text-slate-900">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function ModalShell({
  title,
  onClose,
  children,
  panelClassName = "",
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  panelClassName?: string;
}) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/32 px-4 py-6 backdrop-blur-sm">
      <div
        className={`panel scrollbar-hidden flex max-h-[90vh] w-full max-w-3xl flex-col overflow-y-auto p-6 ${panelClassName}`.trim()}
      >
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-2xl font-semibold text-slate-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="modal-close-button"
            aria-label="Close"
            title="Close"
          >
            <X className="h-4 w-4 sm:hidden" />
            <span className="hidden sm:inline">Close</span>
          </button>
        </div>
        <div className="mt-8 flex-1">{children}</div>
      </div>
    </div>
  );
}

export function OrdersPage() {
  const [activeTab, setActiveTab] = useState<OrdersTab>("orders");
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [items, setItems] = useState<OrderItemRecord[]>([]);
  const [grns, setGrns] = useState<GoodsReceivedNoteRecord[]>([]);
  const [grnItems, setGrnItems] = useState<GoodsReceivedNoteItemRecord[]>([]);
  const [schedules, setSchedules] = useState<DeliveryScheduleRecord[]>([]);
  const [deliveries, setDeliveries] = useState<DeliveryRecord[]>([]);
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierRecord[]>([]);
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [products, setProducts] = useState<FinishedProductRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [selectedGrnId, setSelectedGrnId] = useState<number | null>(null);
  const [selectedGrnItemId, setSelectedGrnItemId] = useState<number | null>(null);
  const [selectedScheduleId, setSelectedScheduleId] = useState<number | null>(null);
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<number | null>(null);

  const [orderForm, setOrderForm] = useState<OrderPayload>(
    createEmptyOrderForm(),
  );
  const [itemForm, setItemForm] = useState<OrderItemPayload>(
    createEmptyItemForm(),
  );
  const [grnForm, setGrnForm] = useState<GoodsReceivedNotePayload>(
    createEmptyGrnForm(),
  );
  const [grnItemForm, setGrnItemForm] =
    useState<GoodsReceivedNoteItemPayload>(createEmptyGrnItemForm());
  const [scheduleForm, setScheduleForm] = useState<DeliverySchedulePayload>(
    createEmptyScheduleForm(),
  );
  const [deliveryForm, setDeliveryForm] = useState<DeliveryRecordPayload>(
    createEmptyDeliveryForm(),
  );

  const salesEmployees = useMemo(
    () => employees.filter((employee) => employee.work_role === "sales"),
    [employees],
  );
  const totalOrderValue = useMemo(
    () =>
      orders.reduce(
        (total, order) =>
          total + Number.parseFloat(order.total_amount || "0"),
        0,
      ),
    [orders],
  );

  async function loadData() {
    try {
      setLoading(true);
      setPageError(null);
      const [
        orderRows,
        itemRows,
        grnRows,
        grnItemRows,
        scheduleRows,
        deliveryRows,
        clientRows,
        supplierRows,
        employeeRows,
        productRows,
      ] = await Promise.all([
        fetchOrders(),
        fetchOrderItems(),
        fetchGoodsReceivedNotes(),
        fetchGoodsReceivedNoteItems(),
        fetchDeliverySchedules(),
        fetchDeliveryRecords(),
        fetchClients(),
        fetchSuppliers(),
        fetchEmployees(),
        fetchProducts(),
      ]);
      setOrders(orderRows);
      setItems(itemRows);
      setGrns(grnRows);
      setGrnItems(grnItemRows);
      setSchedules(scheduleRows);
      setDeliveries(deliveryRows);
      setClients(clientRows);
      setSuppliers(supplierRows);
      setEmployees(employeeRows);
      setProducts(productRows);
    } catch (error) {
      setPageError(getErrorMessage(error, "Unable to load orders data."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  async function submitOrder(event: FormEvent) {
    event.preventDefault();
    setPending("order");
    setFormError(null);
    try {
      const payload = {
        ...orderForm,
        expected_delivery: orderForm.expected_delivery || null,
      };
      if (selectedOrderId) {
        await updateOrder(selectedOrderId, payload);
      } else {
        await createOrder(payload);
      }
      setOrderForm(createEmptyOrderForm());
      await loadData();
      setActiveModal(null);
    } catch (error) {
      setFormError(getErrorMessage(error, "Unable to create order."));
    } finally {
      setPending(null);
    }
  }

  async function submitItem(event: FormEvent) {
    event.preventDefault();
    setPending("item");
    setFormError(null);
    try {
      const payload = {
        ...itemForm,
        unit_cost: itemForm.unit_cost || undefined,
      };
      if (selectedItemId) {
        await updateOrderItem(selectedItemId, payload);
      } else {
        await createOrderItem(payload);
      }
      setItemForm(createEmptyItemForm());
      await loadData();
      setActiveModal(null);
    } catch (error) {
      setFormError(getErrorMessage(error, "Unable to add order item."));
    } finally {
      setPending(null);
    }
  }

  async function submitGrn(event: FormEvent) {
    event.preventDefault();
    setPending("grn");
    setFormError(null);
    try {
      if (selectedGrnId) {
        await updateGoodsReceivedNote(selectedGrnId, grnForm);
      } else {
        await createGoodsReceivedNote(grnForm);
      }
      setGrnForm(createEmptyGrnForm());
      await loadData();
      setActiveModal(null);
    } catch (error) {
      setFormError(getErrorMessage(error, "Unable to create GRN."));
    } finally {
      setPending(null);
    }
  }

  async function submitGrnItem(event: FormEvent) {
    event.preventDefault();
    setPending("grn-item");
    setFormError(null);
    try {
      if (selectedGrnItemId) {
        await updateGoodsReceivedNoteItem(selectedGrnItemId, grnItemForm);
      } else {
        await createGoodsReceivedNoteItem(grnItemForm);
      }
      setGrnItemForm(createEmptyGrnItemForm());
      await loadData();
      setActiveModal(null);
    } catch (error) {
      setFormError(getErrorMessage(error, "Unable to add GRN item."));
    } finally {
      setPending(null);
    }
  }

  async function submitSchedule(event: FormEvent) {
    event.preventDefault();
    setPending("schedule");
    setFormError(null);
    try {
      if (selectedScheduleId) {
        await updateDeliverySchedule(selectedScheduleId, scheduleForm);
      } else {
        await createDeliverySchedule(scheduleForm);
      }
      setScheduleForm(createEmptyScheduleForm());
      await loadData();
      setActiveModal(null);
    } catch (error) {
      setFormError(getErrorMessage(error, "Unable to schedule delivery."));
    } finally {
      setPending(null);
    }
  }

  async function submitDelivery(event: FormEvent) {
    event.preventDefault();
    setPending("delivery");
    setFormError(null);
    try {
      if (selectedDeliveryId) {
        await updateDeliveryRecord(selectedDeliveryId, deliveryForm);
      } else {
        await createDeliveryRecord(deliveryForm);
      }
      setDeliveryForm(createEmptyDeliveryForm());
      await loadData();
      setActiveModal(null);
    } catch (error) {
      setFormError(getErrorMessage(error, "Unable to record delivery."));
    } finally {
      setPending(null);
    }
  }

  function selectedProductCost(productId: number | null) {
    const product = products.find((row) => row.id === productId);
    return product?.cost_price || product?.unit_price || "";
  }

  function closeModal() {
    setActiveModal(null);
    setFormError(null);
  }

  function openCreateModal(modal: Exclude<ActiveModal, null>) {
    setFormError(null);
    if (modal === "order") {
      setSelectedOrderId(null);
      setOrderForm(createEmptyOrderForm());
    }
    if (modal === "item") {
      setSelectedItemId(null);
      setItemForm(createEmptyItemForm());
    }
    if (modal === "grn") {
      setSelectedGrnId(null);
      setGrnForm(createEmptyGrnForm());
    }
    if (modal === "grnItem") {
      setSelectedGrnItemId(null);
      setGrnItemForm(createEmptyGrnItemForm());
    }
    if (modal === "schedule") {
      setSelectedScheduleId(null);
      setScheduleForm(createEmptyScheduleForm());
    }
    if (modal === "delivery") {
      setSelectedDeliveryId(null);
      setDeliveryForm(createEmptyDeliveryForm());
    }
    setActiveModal(modal);
  }

  function openEditOrder(record: OrderRecord) {
    setSelectedOrderId(record.id);
    setOrderForm(buildOrderForm(record));
    setActiveModal("order");
  }

  function openEditItem(record: OrderItemRecord) {
    setSelectedItemId(record.id);
    setItemForm(buildItemForm(record));
    setActiveModal("item");
  }

  function openEditGrn(record: GoodsReceivedNoteRecord) {
    setSelectedGrnId(record.id);
    setGrnForm(buildGrnForm(record));
    setActiveModal("grn");
  }

  function openEditGrnItem(record: GoodsReceivedNoteItemRecord) {
    setSelectedGrnItemId(record.id);
    setGrnItemForm(buildGrnItemForm(record));
    setActiveModal("grnItem");
  }

  function openEditSchedule(record: DeliveryScheduleRecord) {
    setSelectedScheduleId(record.id);
    setScheduleForm(buildScheduleForm(record));
    setActiveModal("schedule");
  }

  function openEditDelivery(record: DeliveryRecord) {
    setSelectedDeliveryId(record.id);
    setDeliveryForm(buildDeliveryForm(record));
    setActiveModal("delivery");
  }

  const activeFlowItem =
    ordersMilestoneFlow.find((item) => item.id === activeTab) ??
    ordersMilestoneFlow[0];

  function renderActiveList() {
    if (loading) {
      return (
        <section className="panel flex min-h-[320px] items-center justify-center p-8">
          <div className="inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-600 shadow-sm">
            <LoaderCircle className="h-4 w-4 animate-spin" />
            Loading order records...
          </div>
        </section>
      );
    }

    if (activeTab === "items") {
      return (
        <section className="panel p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="section-label">Order Items</p>
              <h2 className="mt-1 text-2xl font-semibold text-slate-900">
                Products attached to orders
              </h2>
            </div>
            <button
              type="button"
              onClick={() => openCreateModal("item")}
              className={iconButtonClassName}
              aria-label="Add order item"
              title="Add order item"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <div className="scrollbar-hidden mt-5 flex gap-3 overflow-x-auto pb-2">
            {items.length ? (
              items.map((item) => (
                <div key={item.id} className={recordCardClassName}>
                  <div className="scrollbar-hidden min-h-0 flex-1 overflow-y-auto pr-2">
                    <p className="font-semibold text-slate-900">
                      {item.product_name || item.product_name_display}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {item.order_number}
                    </p>
                    <p className="mt-3 text-sm text-slate-600">
                      Ordered: {item.quantity_ordered}
                    </p>
                    <p className="mt-2 text-sm text-slate-600">
                      Unit cost: {formatMoney(item.unit_cost)}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      Total: {formatMoney(item.line_total)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openEditItem(item)}
                    className={recordEditButtonClassName}
                    aria-label={`Edit ${item.product_name || item.product_name_display}`}
                    title={`Edit ${item.product_name || item.product_name_display}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                </div>
              ))
            ) : (
              <EmptyState
                title="No order items yet"
                description="Add product lines after creating an order."
                className={`${recordCardClassName} justify-center`}
              />
            )}
          </div>
        </section>
      );
    }

    if (activeTab === "grn") {
      return (
        <section className="panel p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="section-label">GRN</p>
              <h2 className="mt-1 text-2xl font-semibold text-slate-900">
                Goods received notes
              </h2>
            </div>
            <button
              type="button"
              onClick={() => openCreateModal("grn")}
              className={iconButtonClassName}
              aria-label="Add goods received note"
              title="Add goods received note"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <div className="scrollbar-hidden mt-5 flex gap-3 overflow-x-auto pb-2">
            {grns.length ? (
              grns.map((grn) => (
                <div key={`grn-${grn.id}`} className={recordCardClassName}>
                  <div className="scrollbar-hidden min-h-0 flex-1 overflow-y-auto pr-14">
                    <span className="inline-flex rounded-full bg-sky-100 px-2.5 py-1 text-xs font-semibold text-sky-700">
                      GRN
                    </span>
                    <p className="mt-3 font-semibold text-sky-700">
                      {grn.grn_number}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {grn.order_number}
                    </p>
                    <p className="mt-3 text-sm text-slate-600">
                      Received: {formatDate(grn.received_date)}
                    </p>
                    <p className="mt-2 text-sm text-slate-600">
                      By: {grn.received_by_name || "Unassigned"}
                    </p>
                    <p className="mt-2 text-sm text-slate-600">
                      {grn.remarks || "No remarks"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openEditGrn(grn)}
                    className={recordEditButtonClassName}
                    aria-label={`Edit ${grn.grn_number}`}
                    title={`Edit ${grn.grn_number}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                </div>
              ))
            ) : (
              <EmptyState
                title="No GRNs yet"
                description="Create a goods received note header before adding received items."
                className={`${recordCardClassName} justify-center`}
              />
            )}
          </div>
        </section>
      );
    }

    if (activeTab === "grnItems") {
      return (
        <section className="panel p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="section-label">GRN Items</p>
              <h2 className="mt-1 text-2xl font-semibold text-slate-900">
                Received product lines
              </h2>
            </div>
            <button
              type="button"
              onClick={() => openCreateModal("grnItem")}
              className={iconButtonClassName}
              aria-label="Add GRN item"
              title="Add GRN item"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <div className="scrollbar-hidden mt-5 flex gap-3 overflow-x-auto pb-2">
            {grnItems.length ? (
              grnItems.map((item) => (
                <div key={`grn-item-${item.id}`} className={recordCardClassName}>
                  <div className="scrollbar-hidden min-h-0 flex-1 overflow-y-auto pr-14">
                    <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                      GRN Item
                    </span>
                    <p className="mt-3 font-semibold text-slate-900">
                      {item.product_name || item.product_name_display}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {item.grn_number}
                    </p>
                    <p className="mt-3 text-sm text-slate-600">
                      Quantity: {item.quantity_received}
                    </p>
                    <p className="mt-2 text-sm text-slate-600">
                      Condition: {item.condition || "Not recorded"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openEditGrnItem(item)}
                    className={recordEditButtonClassName}
                    aria-label={`Edit ${item.product_name || item.product_name_display}`}
                    title={`Edit ${item.product_name || item.product_name_display}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                </div>
              ))
            ) : (
              <EmptyState
                title="No GRN items yet"
                description="Add received product lines after creating a GRN."
                className={`${recordCardClassName} justify-center`}
              />
            )}
          </div>
        </section>
      );
    }

    if (activeTab === "schedules") {
      return (
        <section className="panel p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="section-label">Delivery Schedules</p>
              <h2 className="mt-1 text-2xl font-semibold text-slate-900">
                Planned movement
              </h2>
            </div>
            <button
              type="button"
              onClick={() => openCreateModal("schedule")}
              className={iconButtonClassName}
              aria-label="Add delivery schedule"
              title="Add delivery schedule"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <div className="scrollbar-hidden mt-5 flex gap-3 overflow-x-auto pb-2">
            {schedules.length ? (
              schedules.map((schedule) => (
                <div key={`schedule-${schedule.id}`} className={recordCardClassName}>
                  <div className="scrollbar-hidden min-h-0 flex-1 overflow-y-auto pr-14">
                    <span className="inline-flex rounded-full bg-sky-100 px-2.5 py-1 text-xs font-semibold text-sky-700">
                      Schedule
                    </span>
                    <p className="mt-3 font-semibold text-sky-700">
                      {schedule.order_number}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {formatDate(schedule.scheduled_date)}
                    </p>
                    <p className="mt-3 text-sm text-slate-600">
                      Status: {titleCase(schedule.status)}
                    </p>
                    <p className="mt-2 text-sm text-slate-600">
                      Seller: {schedule.seller_name || "Unassigned"}
                    </p>
                    <p className="mt-2 text-sm text-slate-600">
                      {schedule.notes || "No notes"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openEditSchedule(schedule)}
                    className={recordEditButtonClassName}
                    aria-label={`Edit ${schedule.order_number} schedule`}
                    title={`Edit ${schedule.order_number} schedule`}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                </div>
              ))
            ) : (
              <EmptyState
                title="No delivery schedules yet"
                description="Schedule delivery movement from an order."
                className={`${recordCardClassName} justify-center`}
              />
            )}
          </div>
        </section>
      );
    }

    if (activeTab === "deliveries") {
      return (
        <section className="panel p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="section-label">Deliveries</p>
              <h2 className="mt-1 text-2xl font-semibold text-slate-900">
                Completed movement records
              </h2>
            </div>
            <button
              type="button"
              onClick={() => openCreateModal("delivery")}
              className={iconButtonClassName}
              aria-label="Add delivery record"
              title="Add delivery record"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <div className="scrollbar-hidden mt-5 flex gap-3 overflow-x-auto pb-2">
            {deliveries.length ? (
              deliveries.map((delivery) => (
                <div key={`delivery-${delivery.id}`} className={recordCardClassName}>
                  <div className="scrollbar-hidden min-h-0 flex-1 overflow-y-auto pr-14">
                    <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                      Delivery
                    </span>
                    <p className="mt-3 font-semibold text-sky-700">
                      {delivery.order_number}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {formatDate(delivery.delivery_date)}
                    </p>
                    <p className="mt-3 text-sm text-slate-600">
                      Status: {titleCase(delivery.delivery_status)}
                    </p>
                    <p className="mt-2 text-sm text-slate-600">
                      Recipient: {delivery.recipient_name || "Not recorded"}
                    </p>
                    <p className="mt-2 text-sm text-slate-600">
                      Proof: {delivery.proof_reference || "Not recorded"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openEditDelivery(delivery)}
                    className={recordEditButtonClassName}
                    aria-label={`Edit ${delivery.order_number} delivery`}
                    title={`Edit ${delivery.order_number} delivery`}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                </div>
              ))
            ) : (
              <EmptyState
                title="No deliveries yet"
                description="Record actual delivery movement from an order or schedule."
                className={`${recordCardClassName} justify-center`}
              />
            )}
          </div>
        </section>
      );
    }

    return (
      <section className="panel p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="section-label">Orders</p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-900">
              Order records
            </h2>
          </div>
          <button
            type="button"
            onClick={() => openCreateModal("order")}
            className={iconButtonClassName}
            aria-label="Add order"
            title="Add order"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <div className="scrollbar-hidden mt-5 flex gap-3 overflow-x-auto pb-2">
          {orders.length ? (
            orders.map((order) => (
              <div key={order.id} className={recordCardClassName}>
                <div className="scrollbar-hidden min-h-0 flex-1 overflow-y-auto pr-2">
                  <p className="font-semibold text-sky-700">
                    {order.order_number}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {order.supplier_name || order.client_name || "No counterparty"}
                  </p>
                  <p className="mt-3 text-sm text-slate-600">
                    Date: {formatDate(order.order_date)}
                  </p>
                  <p className="mt-2 text-sm text-slate-600">
                    Expected: {formatDate(order.expected_delivery)}
                  </p>
                  <p className="mt-2 text-sm text-slate-600">
                    Status: {titleCase(order.status)}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {formatMoney(order.total_amount)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => openEditOrder(order)}
                  className={recordEditButtonClassName}
                  aria-label={`Edit ${order.order_number}`}
                  title={`Edit ${order.order_number}`}
                >
                  <Pencil className="h-4 w-4" />
                </button>
              </div>
            ))
          ) : (
            <EmptyState
              title="No orders yet"
              description="Create an order before adding items or movement records."
              className={`${recordCardClassName} justify-center`}
            />
          )}
        </div>
      </section>
    );
  }

  function renderOrderForm() {
    return (
      <FormPanel label="Orders" title="Order form">
        <form onSubmit={submitOrder} className="grid gap-4">
          <PickerField
            value={orderForm.supplier ? String(orderForm.supplier) : ""}
            options={[
              { label: "No supplier", value: "" },
              ...suppliers.map((supplier) => ({
                label: supplier.name,
                value: String(supplier.id),
                searchText: `${supplier.name} ${supplier.contact_person}`,
              })),
            ]}
            searchable
            searchPlaceholder="Search suppliers"
            onChange={(value) =>
              setOrderForm((current) => ({
                ...current,
                supplier: numberOrNull(value),
              }))
            }
          />
          <PickerField
            value={orderForm.client ? String(orderForm.client) : ""}
            options={[
              { label: "No client", value: "" },
              ...clients.map((client) => ({
                label: client.name,
                value: String(client.id),
                searchText: `${client.name} ${client.contact_person} ${client.phone}`,
              })),
            ]}
            searchable
            searchPlaceholder="Search clients"
            onChange={(value) =>
              setOrderForm((current) => ({
                ...current,
                client: numberOrNull(value),
              }))
            }
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <PickerField
              value={orderForm.seller ? String(orderForm.seller) : ""}
              options={[
                { label: "No seller", value: "" },
                ...salesEmployees.map((employee) => ({
                  label: employee.full_name,
                  value: String(employee.id),
                  searchText: `${employee.full_name} ${employee.employee_code}`,
                })),
              ]}
              searchable
              searchPlaceholder="Search sellers"
              onChange={(value) =>
                setOrderForm((current) => ({
                  ...current,
                  seller: numberOrNull(value),
                }))
              }
            />
            <PickerField
              value={orderForm.performed_by ? String(orderForm.performed_by) : ""}
              options={[
                { label: "Performed by", value: "" },
                ...employees.map((employee) => ({
                  label: employee.full_name,
                  value: String(employee.id),
                  searchText: `${employee.full_name} ${employee.employee_code}`,
                })),
              ]}
              searchable
              searchPlaceholder="Search employees"
              onChange={(value) =>
                setOrderForm((current) => ({
                  ...current,
                  performed_by: numberOrNull(value),
                }))
              }
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <input
              type="date"
              className={fieldClassName}
              value={orderForm.order_date}
              onChange={(event) =>
                setOrderForm((current) => ({
                  ...current,
                  order_date: event.target.value,
                }))
              }
              required
            />
            <input
              type="date"
              className={fieldClassName}
              value={orderForm.expected_delivery ?? ""}
              onChange={(event) =>
                setOrderForm((current) => ({
                  ...current,
                  expected_delivery: event.target.value,
                }))
              }
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <PickerField
              value={orderForm.status}
              options={orderStatuses.map((status) => ({
                label: titleCase(status),
                value: status,
              }))}
              onChange={(value) =>
                setOrderForm((current) => ({
                  ...current,
                  status: value as OrderStatus,
                }))
              }
            />
            <PickerField
              value={orderForm.payment_method}
              options={paymentMethods.map((method) => ({
                label: titleCase(method),
                value: method,
              }))}
              onChange={(value) =>
                setOrderForm((current) => ({
                  ...current,
                  payment_method: value as OrderPaymentMethod,
                }))
              }
            />
          </div>
          <button
            type="submit"
            className={primaryButtonClassName}
            disabled={pending === "order"}
          >
            {pending === "order" ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Create order
          </button>
        </form>
      </FormPanel>
    );
  }

  function renderItemForm() {
    return (
      <FormPanel label="Order Items" title="Item form">
        <form onSubmit={submitItem} className="grid gap-4">
          <PickerField
            value={itemForm.order ? String(itemForm.order) : ""}
            options={[
              { label: "Select order", value: "" },
              ...orders.map((order) => ({
                label: order.order_number,
                value: String(order.id),
                searchText: `${order.order_number} ${order.supplier_name} ${order.client_name}`,
              })),
            ]}
            searchable
            searchPlaceholder="Search orders"
            onChange={(value) =>
              setItemForm((current) => ({
                ...current,
                order: value ? Number(value) : 0,
              }))
            }
          />
          <PickerField
            value={itemForm.product ? String(itemForm.product) : ""}
            options={[
              { label: "Direct item name", value: "" },
              ...products.map((product) => ({
                label: product.name,
                value: String(product.id),
                searchText: product.name,
              })),
            ]}
            searchable
            searchPlaceholder="Search products"
            onChange={(value) => {
              const productId = numberOrNull(value);
              setItemForm((current) => ({
                ...current,
                product: productId,
                unit_cost: selectedProductCost(productId) || current.unit_cost,
              }));
            }}
          />
          <input
            className={fieldClassName}
            placeholder="Product name"
            value={itemForm.product_name}
            onChange={(event) =>
              setItemForm((current) => ({
                ...current,
                product_name: event.target.value,
              }))
            }
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <input
              className={fieldClassName}
              placeholder="Quantity ordered"
              value={itemForm.quantity_ordered}
              onChange={(event) =>
                setItemForm((current) => ({
                  ...current,
                  quantity_ordered: event.target.value,
                }))
              }
              required
            />
            <input
              type="number"
              min="0"
              step="0.01"
              className={fieldClassName}
              placeholder="Unit cost"
              value={itemForm.unit_cost ?? ""}
              onChange={(event) =>
                setItemForm((current) => ({
                  ...current,
                  unit_cost: event.target.value,
                }))
              }
            />
          </div>
          <button
            type="submit"
            className={primaryButtonClassName}
            disabled={pending === "item"}
          >
            {pending === "item" ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <PackageCheck className="h-4 w-4" />
            )}
            Add item
          </button>
        </form>
      </FormPanel>
    );
  }

  function renderGrnForm() {
    return (
      <FormPanel label="Goods Received Notes" title="GRN form">
          <form onSubmit={submitGrn} className="grid gap-4">
            <PickerField
              value={grnForm.order ? String(grnForm.order) : ""}
              options={[
                { label: "Select order", value: "" },
                ...orders.map((order) => ({
                  label: order.order_number,
                  value: String(order.id),
                  searchText: `${order.order_number} ${order.supplier_name} ${order.client_name}`,
                })),
              ]}
              searchable
              searchPlaceholder="Search orders"
              onChange={(value) =>
                setGrnForm((current) => ({
                  ...current,
                  order: value ? Number(value) : 0,
                }))
              }
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <input
                type="date"
                className={fieldClassName}
                value={grnForm.received_date}
                onChange={(event) =>
                  setGrnForm((current) => ({
                    ...current,
                    received_date: event.target.value,
                  }))
                }
                required
              />
              <PickerField
                value={grnForm.received_by ? String(grnForm.received_by) : ""}
                options={[
                  { label: "Received by", value: "" },
                  ...employees.map((employee) => ({
                    label: employee.full_name,
                    value: String(employee.id),
                    searchText: `${employee.full_name} ${employee.employee_code}`,
                  })),
                ]}
                searchable
                searchPlaceholder="Search employees"
                onChange={(value) =>
                  setGrnForm((current) => ({
                    ...current,
                    received_by: numberOrNull(value),
                  }))
                }
              />
            </div>
            <input
              className={fieldClassName}
              placeholder="Remarks"
              value={grnForm.remarks}
              onChange={(event) =>
                setGrnForm((current) => ({
                  ...current,
                  remarks: event.target.value,
                }))
              }
            />
            <button
              type="submit"
              className={primaryButtonClassName}
              disabled={pending === "grn"}
            >
              {pending === "grn" ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <ClipboardCheck className="h-4 w-4" />
              )}
              Create GRN
            </button>
          </form>
      </FormPanel>
    );
  }

  function renderGrnItemForm() {
    return (
        <FormPanel label="GRN Items" title="GRN item form">
          <form onSubmit={submitGrnItem} className="grid gap-4">
            <PickerField
              value={
                grnItemForm.goods_received_note
                  ? String(grnItemForm.goods_received_note)
                  : ""
              }
              options={[
                { label: "Select GRN", value: "" },
                ...grns.map((grn) => ({
                  label: grn.grn_number,
                  value: String(grn.id),
                  searchText: `${grn.grn_number} ${grn.order_number}`,
                })),
              ]}
              searchable
              searchPlaceholder="Search GRNs"
              onChange={(value) =>
                setGrnItemForm((current) => ({
                  ...current,
                  goods_received_note: value ? Number(value) : 0,
                }))
              }
            />
            <PickerField
              value={grnItemForm.order_item ? String(grnItemForm.order_item) : ""}
              options={[
                { label: "No order item link", value: "" },
                ...items.map((item) => ({
                  label: `${item.order_number} - ${
                    item.product_name || item.product_name_display
                  }`,
                  value: String(item.id),
                  searchText: `${item.order_number} ${item.product_name} ${item.product_name_display}`,
                })),
              ]}
              searchable
              searchPlaceholder="Search order items"
              onChange={(value) =>
                setGrnItemForm((current) => ({
                  ...current,
                  order_item: numberOrNull(value),
                }))
              }
            />
            <PickerField
              value={grnItemForm.product ? String(grnItemForm.product) : ""}
              options={[
                { label: "Direct item name", value: "" },
                ...products.map((product) => ({
                  label: product.name,
                  value: String(product.id),
                  searchText: product.name,
                })),
              ]}
              searchable
              searchPlaceholder="Search products"
              onChange={(value) =>
                setGrnItemForm((current) => ({
                  ...current,
                  product: numberOrNull(value),
                }))
              }
            />
            <input
              className={fieldClassName}
              placeholder="Product name"
              value={grnItemForm.product_name}
              onChange={(event) =>
                setGrnItemForm((current) => ({
                  ...current,
                  product_name: event.target.value,
                }))
              }
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <input
                className={fieldClassName}
                placeholder="Quantity received"
                value={grnItemForm.quantity_received}
                onChange={(event) =>
                  setGrnItemForm((current) => ({
                    ...current,
                    quantity_received: event.target.value,
                  }))
                }
                required
              />
              <input
                className={fieldClassName}
                placeholder="Condition"
                value={grnItemForm.condition}
                onChange={(event) =>
                  setGrnItemForm((current) => ({
                    ...current,
                    condition: event.target.value,
                  }))
                }
              />
            </div>
            <button
              type="submit"
              className={primaryButtonClassName}
              disabled={pending === "grn-item"}
            >
              {pending === "grn-item" ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Add received item
            </button>
          </form>
        </FormPanel>
    );
  }

  function renderScheduleForm() {
    return (
      <FormPanel label="Delivery Schedules" title="Schedule form">
          <form onSubmit={submitSchedule} className="grid gap-4">
            <PickerField
              value={scheduleForm.order ? String(scheduleForm.order) : ""}
              options={[
                { label: "Select order", value: "" },
                ...orders.map((order) => ({
                  label: order.order_number,
                  value: String(order.id),
                  searchText: `${order.order_number} ${order.supplier_name} ${order.client_name}`,
                })),
              ]}
              searchable
              searchPlaceholder="Search orders"
              onChange={(value) =>
                setScheduleForm((current) => ({
                  ...current,
                  order: value ? Number(value) : 0,
                }))
              }
            />
            <PickerField
              value={scheduleForm.seller ? String(scheduleForm.seller) : ""}
              options={[
                { label: "No seller", value: "" },
                ...salesEmployees.map((employee) => ({
                  label: employee.full_name,
                  value: String(employee.id),
                  searchText: `${employee.full_name} ${employee.employee_code}`,
                })),
              ]}
              searchable
              searchPlaceholder="Search sellers"
              onChange={(value) =>
                setScheduleForm((current) => ({
                  ...current,
                  seller: numberOrNull(value),
                }))
              }
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <input
                type="date"
                className={fieldClassName}
                value={scheduleForm.scheduled_date}
                onChange={(event) =>
                  setScheduleForm((current) => ({
                    ...current,
                    scheduled_date: event.target.value,
                  }))
                }
                required
              />
              <PickerField
                value={scheduleForm.status}
                options={scheduleStatuses.map((status) => ({
                  label: titleCase(status),
                  value: status,
                }))}
                onChange={(value) =>
                  setScheduleForm((current) => ({
                    ...current,
                    status: value as DeliveryScheduleStatus,
                  }))
                }
              />
            </div>
            <textarea
              className={`${fieldClassName} min-h-24`}
              placeholder="Notes"
              value={scheduleForm.notes}
              onChange={(event) =>
                setScheduleForm((current) => ({
                  ...current,
                  notes: event.target.value,
                }))
              }
            />
            <button
              type="submit"
              className={primaryButtonClassName}
              disabled={pending === "schedule"}
            >
              {pending === "schedule" ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <Truck className="h-4 w-4" />
              )}
              Schedule delivery
            </button>
          </form>
      </FormPanel>
    );
  }

  function renderDeliveryForm() {
    return (
        <FormPanel label="Delivery" title="Delivery form">
          <form onSubmit={submitDelivery} className="grid gap-4">
            <PickerField
              value={deliveryForm.order ? String(deliveryForm.order) : ""}
              options={[
                { label: "Select order", value: "" },
                ...orders.map((order) => ({
                  label: order.order_number,
                  value: String(order.id),
                  searchText: `${order.order_number} ${order.supplier_name} ${order.client_name}`,
                })),
              ]}
              searchable
              searchPlaceholder="Search orders"
              onChange={(value) =>
                setDeliveryForm((current) => ({
                  ...current,
                  order: value ? Number(value) : 0,
                }))
              }
            />
            <PickerField
              value={deliveryForm.schedule ? String(deliveryForm.schedule) : ""}
              options={[
                { label: "No schedule link", value: "" },
                ...schedules.map((schedule) => ({
                  label: `${schedule.order_number} - ${formatDate(
                    schedule.scheduled_date,
                  )}`,
                  value: String(schedule.id),
                  searchText: `${schedule.order_number} ${schedule.seller_name}`,
                })),
              ]}
              searchable
              searchPlaceholder="Search schedules"
              onChange={(value) =>
                setDeliveryForm((current) => ({
                  ...current,
                  schedule: numberOrNull(value),
                }))
              }
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <input
                type="date"
                className={fieldClassName}
                value={deliveryForm.delivery_date}
                onChange={(event) =>
                  setDeliveryForm((current) => ({
                    ...current,
                    delivery_date: event.target.value,
                  }))
                }
                required
              />
              <PickerField
                value={deliveryForm.delivery_status}
                options={deliveryStatuses.map((status) => ({
                  label: titleCase(status),
                  value: status,
                }))}
                onChange={(value) =>
                  setDeliveryForm((current) => ({
                    ...current,
                    delivery_status: value as DeliveryRecordStatus,
                  }))
                }
              />
            </div>
            <input
              className={fieldClassName}
              placeholder="Recipient name"
              value={deliveryForm.recipient_name}
              onChange={(event) =>
                setDeliveryForm((current) => ({
                  ...current,
                  recipient_name: event.target.value,
                }))
              }
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <input
                className={fieldClassName}
                placeholder="Quantity received"
                value={deliveryForm.quantity_received}
                onChange={(event) =>
                  setDeliveryForm((current) => ({
                    ...current,
                    quantity_received: event.target.value,
                  }))
                }
              />
              <input
                className={fieldClassName}
                placeholder="Condition"
                value={deliveryForm.condition}
                onChange={(event) =>
                  setDeliveryForm((current) => ({
                    ...current,
                    condition: event.target.value,
                  }))
                }
              />
            </div>
            <input
              className={fieldClassName}
              placeholder="Proof reference"
              value={deliveryForm.proof_reference}
              onChange={(event) =>
                setDeliveryForm((current) => ({
                  ...current,
                  proof_reference: event.target.value,
                }))
              }
            />
            <textarea
              className={`${fieldClassName} min-h-24`}
              placeholder="Delivery note"
              value={deliveryForm.delivery_note}
              onChange={(event) =>
                setDeliveryForm((current) => ({
                  ...current,
                  delivery_note: event.target.value,
                }))
              }
            />
            <button
              type="submit"
              className={primaryButtonClassName}
              disabled={pending === "delivery"}
            >
              {pending === "delivery" ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <PackageCheck className="h-4 w-4" />
              )}
              Record delivery
            </button>
          </form>
        </FormPanel>
    );
  }

  function renderActiveForm() {
    if (activeModal === "item") return renderItemForm();
    if (activeModal === "grn") return renderGrnForm();
    if (activeModal === "grnItem") return renderGrnItemForm();
    if (activeModal === "schedule") return renderScheduleForm();
    if (activeModal === "delivery") return renderDeliveryForm();
    return renderOrderForm();
  }

  function activeModalTitle() {
    if (activeModal === "item") return "Add order item";
    if (activeModal === "grn") return "Create goods received note";
    if (activeModal === "grnItem") return "Add received item";
    if (activeModal === "schedule") return "Schedule delivery";
    if (activeModal === "delivery") return "Record delivery";
    return "Add order";
  }

  const activeCount =
    activeTab === "orders"
      ? orders.length
      : activeTab === "items"
        ? items.length
        : activeTab === "grn"
          ? grns.length
          : activeTab === "grnItems"
            ? grnItems.length
            : activeTab === "schedules"
              ? schedules.length
              : deliveries.length;

  return (
    <div className="module-page">
      <section className="rounded-[32px] border border-white/70 bg-[radial-gradient(circle_at_top_left,#ffffff,rgba(224,242,254,0.92)_52%,rgba(240,249,255,0.95))] py-6 pl-6 pr-0 shadow-[0_25px_80px_rgba(148,163,184,0.14)]">
        <div className="flex flex-col gap-6 pr-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/75 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-sky-700">
              Orders
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
                Orders workspace
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-slate-600">
                Manage orders, ordered products, goods received notes, and
                delivery movement away from the sales workflow.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-4">
            <div className="hero-metric-card">
              <p className="hero-metric-label">Orders</p>
              <p className="hero-metric-value">{orders.length}</p>
            </div>
            <div className="hero-metric-card">
              <p className="hero-metric-label">GRNs</p>
              <p className="hero-metric-value">{grns.length}</p>
            </div>
            <div className="hero-metric-card">
              <p className="hero-metric-label">Deliveries</p>
              <p className="hero-metric-value">{deliveries.length}</p>
            </div>
            <div className="hero-metric-card">
              <p className="hero-metric-label">Value</p>
              <p className="hero-metric-value">
                {formatCompactValue(totalOrderValue)}
              </p>
            </div>
          </div>
        </div>
      </section>
      <ModuleTabs tabs={tabs} activeTab={activeTab} onChange={(tab) => setActiveTab(tab as OrdersTab)} />

      <div className="module-page-stage !justify-start overflow-hidden">
        <div className="flex min-h-0 flex-1 flex-col gap-6">
          {pageError ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {pageError}
            </div>
          ) : null}
          {formError ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {formError}
            </div>
          ) : null}

          <div className="min-h-0">{renderActiveList()}</div>

          <footer className="panel mt-auto px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
              <p className="leading-6">
                <span className="font-semibold text-sky-700">
                  {activeFlowItem.label}
                </span>{" "}
                {activeFlowItem.detail}
              </p>
              <span className="text-slate-500">{activeCount} records</span>
              <button
                type="button"
                onClick={() => void loadData()}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>
            </div>
          </footer>
        </div>
      </div>

      {activeModal ? (
        <ModalShell title={activeModalTitle()} onClose={closeModal}>
          {formError ? (
            <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {formError}
            </div>
          ) : null}
          {renderActiveForm()}
        </ModalShell>
      ) : null}
    </div>
  );
}
