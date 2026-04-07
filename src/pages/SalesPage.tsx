import { Check, ChevronDown, LoaderCircle, Pencil, Plus, Trash2 } from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { useLocation } from "react-router-dom";
import { ModuleTabs } from "../components/layout/ModuleTabs";
import { useAuth } from "../features/auth/AuthProvider";
import { ApiError } from "../lib/api/auth";
import { fetchFinishedProducts } from "../lib/api/inventory";
import { fetchEmployees } from "../lib/api/workforce";
import {
  createBrandingRecord,
  createClient,
  createCustomerCategory,
  createDeliveryRecord,
  createDeliverySchedule,
  createOrderItem,
  createSalesOrder,
  deleteBrandingRecord,
  deleteClient,
  deleteCustomerCategory,
  deleteDeliveryRecord,
  deleteDeliverySchedule,
  deleteOrderItem,
  deleteSalesOrder,
  fetchBrandingRecord,
  fetchBrandingRecords,
  fetchClient,
  fetchClients,
  fetchCustomerCategories,
  fetchCustomerCategory,
  fetchDeliveryRecord,
  fetchDeliveryRecords,
  fetchDeliverySchedule,
  fetchDeliverySchedules,
  fetchOrderItem,
  fetchOrderItems,
  fetchSalesOrder,
  fetchSalesOrders,
  updateBrandingRecord,
  updateClient,
  updateCustomerCategory,
  updateDeliveryRecord,
  updateDeliverySchedule,
  updateOrderItem,
  updateSalesOrder,
} from "../lib/api/sales";
import type { FinishedProductRecord } from "../types/inventory";
import type {
  BrandingPayload,
  BrandingRecord,
  BrandingStatus,
  ClientPayload,
  ClientRecord,
  CustomerCategoryPayload,
  CustomerCategoryRecord,
  DeliveryRecord as DeliveryRecordType,
  DeliveryRecordPayload,
  DeliveryRecordStatus,
  DeliverySchedulePayload,
  DeliveryScheduleRecord,
  DeliveryScheduleStatus,
  OrderItemPayload,
  OrderItemRecord,
  OrderStatus,
  PaymentMethod,
  SalesOrderPayload,
  SalesOrderRecord,
} from "../types/sales";

type SalesOrderFormState = SalesOrderPayload & {
  order_number: string;
};
import type { EmployeeRecord } from "../types/workforce";

const fieldClassName =
  "w-full rounded-2xl border border-slate-200/80 bg-slate-50/70 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-300";
const textAreaClassName = `${fieldClassName} min-h-[108px] resize-y`;
const primaryButtonClassName =
  "inline-flex items-center justify-center gap-2 rounded-2xl border border-sky-200 bg-[linear-gradient(135deg,#1f87ad,#0f6d8d)] px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(32,141,183,0.22)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70";
const secondaryButtonClassName =
  "inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70";
const dangerButtonClassName =
  "inline-flex items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-70";
const iconButtonClassName =
  "inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70";
const recordCardClassName =
  "group relative flex h-[242px] min-w-[280px] max-w-[280px] flex-shrink-0 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4";
const recordEditButtonClassName = `${iconButtonClassName} absolute right-4 top-4 opacity-0 pointer-events-none group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100`;

const salesMilestoneFlow = [
  {
    id: "categories",
    label: "Customer Categories",
    detail:
      "Set up customer categories here. Before this, there is nothing to prepare. Next, add clients.",
  },
  {
    id: "clients",
    label: "Clients",
    detail:
      "Create and update clients here. Before this, customer categories should already exist. Next, define branding records.",
  },
  {
    id: "branding",
    label: "Branding",
    detail:
      "Add branding entries here. Before this, make sure clients are in place. Next, create orders.",
  },
  {
    id: "orders",
    label: "Orders",
    detail:
      "Create and manage sales orders here. Before this, branding should already be ready. Next, add order items.",
  },
  {
    id: "items",
    label: "Order Items",
    detail:
      "Capture order items here. Before this, the parent orders should already exist. Next, schedule deliveries.",
  },
  {
    id: "schedules",
    label: "Delivery Schedules",
    detail:
      "Plan delivery schedules here. Before this, order items should already be set. Next, record delivery results.",
  },
  {
    id: "deliveries",
    label: "Delivery Records",
    detail:
      "Record delivery outcomes here. Before this, delivery schedules should be in place. This is the last sales step.",
  },
] as const;

type ActiveModal =
  | "category"
  | "client"
  | "branding"
  | "order"
  | "item"
  | "schedule"
  | "delivery"
  | null;

const brandingStatuses: BrandingStatus[] = ["active", "inactive", "archived"];
const orderStatuses: OrderStatus[] = [
  "draft",
  "confirmed",
  "pending",
  "dispatched",
  "completed",
  "cancelled",
];
const paymentMethods: PaymentMethod[] = [
  "cash",
  "mobile_money",
  "bank_transfer",
  "credit",
];
const deliveryScheduleStatuses: DeliveryScheduleStatus[] = [
  "scheduled",
  "rescheduled",
  "completed",
  "cancelled",
];
const deliveryRecordStatuses: DeliveryRecordStatus[] = [
  "pending",
  "delivered",
  "partial",
  "failed",
];

function createEmptyCategoryForm(): CustomerCategoryPayload {
  return { name: "", description: "", is_active: true };
}

function createEmptyClientForm(): ClientPayload {
  return {
    category: null,
    name: "",
    contact_person: "",
    email: "",
    phone_number: "",
    address: "",
    notes: "",
    is_active: true,
  };
}

function createEmptyBrandingForm(): BrandingPayload {
  return {
    client: null,
    title: "",
    branding_type: "",
    status: "active",
    notes: "",
  };
}

function createEmptyOrderForm(): SalesOrderFormState {
  return {
    client: 0,
    assigned_seller: null,
    order_number: "",
    order_date: "",
    expected_delivery_date: null,
    status: "draft",
    payment_method: "cash",
    notes: "",
  };
}

function createEmptyItemForm(): OrderItemPayload {
  return {
    order: 0,
    finished_product: null,
    product_name: "",
    quantity: "",
    unit_price: "",
    notes: "",
  };
}

function createEmptyScheduleForm(): DeliverySchedulePayload {
  return {
    order: 0,
    seller: null,
    scheduled_date: "",
    assigned_vehicle: "",
    assigned_driver: "",
    status: "scheduled",
    notes: "",
  };
}

function createEmptyDeliveryForm(): DeliveryRecordPayload {
  return {
    order: 0,
    schedule: null,
    delivery_date: "",
    recipient_name: "",
    delivery_status: "pending",
    delivery_note: "",
  };
}

function FieldMessage({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {message}
    </p>
  );
}

function PickerField({
  value,
  options,
  onChange,
}: {
  value: string;
  options: Array<{ label: string; value: string }>;
  onChange: (value: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const selectedLabel =
    options.find((option) => option.value === value)?.label ??
    options[0]?.label ??
    "Select";

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    window.addEventListener("mousedown", handlePointerDown);
    return () => window.removeEventListener("mousedown", handlePointerDown);
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="inline-flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/70 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-white"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="truncate">{selectedLabel}</span>
        <ChevronDown
          className={[
            "h-4 w-4 shrink-0 text-slate-400 transition",
            isOpen ? "rotate-180" : "",
          ].join(" ")}
        />
      </button>

      {isOpen ? (
        <div className="absolute left-0 top-full z-20 mt-2 w-full rounded-3xl border border-slate-200 bg-white p-2 shadow-[0_24px_60px_rgba(15,23,42,0.14)]">
          <div className="space-y-1">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={[
                  "flex w-full items-center justify-between rounded-2xl px-3 py-2 text-left text-sm transition",
                  value === option.value
                    ? "bg-sky-50 text-sky-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                ].join(" ")}
              >
                <span>{option.label}</span>
                {value === option.value ? <Check className="h-4 w-4" /> : null}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
        {label}
      </p>
      <div className="text-sm text-slate-700">{value}</div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className={`${recordCardClassName} justify-center`}>
      <p className="text-sm leading-6 text-slate-500">{message}</p>
    </div>
  );
}

function SectionCard({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="panel p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <p className="text-sm text-slate-500">{description}</p>
        </div>
        {action}
      </div>
      <div className="module-card-lane mt-5">{children}</div>
    </section>
  );
}

function ModalShell({
  title,
  description,
  children,
  onClose,
}: {
  title: string;
  description: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/25 px-4 py-8 backdrop-blur-sm">
      <div className="scrollbar-hidden max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-[32px] border border-white/60 bg-[#f8fcff] p-6 shadow-[0_30px_90px_rgba(15,23,42,0.18)]">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
            <p className="text-sm text-slate-500">{description}</p>
          </div>
          <button
            type="button"
            className={secondaryButtonClassName}
            onClick={onClose}
          >
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function FormPanel({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-4 rounded-[28px] border border-slate-200/80 bg-white/90 p-6 shadow-[0_22px_60px_rgba(148,163,184,0.14)]">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
      {children}
    </div>
  );
}

function formatDate(value: string | null) {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat("en-UG", { dateStyle: "medium" }).format(
    new Date(value),
  );
}

function formatCurrency(value: number) {
  if (!Number.isFinite(value)) {
    return "UGX 0";
  }

  return `UGX ${new Intl.NumberFormat("en-UG", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)}`;
}

function formatCurrencyFromString(value: string) {
  return formatCurrency(Number.parseFloat(value || "0"));
}

export function SalesPage() {
  const location = useLocation();
  const { user } = useAuth();
  const isAdmin =
    user?.role.code === "admin" || user?.role.code === "superuser";

  const [categories, setCategories] = useState<CustomerCategoryRecord[]>([]);
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [brandingRecords, setBrandingRecords] = useState<BrandingRecord[]>([]);
  const [orders, setOrders] = useState<SalesOrderRecord[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItemRecord[]>([]);
  const [schedules, setSchedules] = useState<DeliveryScheduleRecord[]>([]);
  const [deliveries, setDeliveries] = useState<DeliveryRecordType[]>([]);
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [finishedProducts, setFinishedProducts] = useState<
    FinishedProductRecord[]
  >([]);

  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null,
  );
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [selectedBrandingId, setSelectedBrandingId] = useState<number | null>(
    null,
  );
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [selectedScheduleId, setSelectedScheduleId] = useState<number | null>(
    null,
  );
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<number | null>(
    null,
  );

  const [categoryForm, setCategoryForm] = useState<CustomerCategoryPayload>(
    createEmptyCategoryForm,
  );
  const [clientForm, setClientForm] = useState<ClientPayload>(
    createEmptyClientForm,
  );
  const [brandingForm, setBrandingForm] = useState<BrandingPayload>(
    createEmptyBrandingForm,
  );
  const [orderForm, setOrderForm] =
    useState<SalesOrderFormState>(createEmptyOrderForm);
  const [itemForm, setItemForm] =
    useState<OrderItemPayload>(createEmptyItemForm);
  const [scheduleForm, setScheduleForm] = useState<DeliverySchedulePayload>(
    createEmptyScheduleForm,
  );
  const [deliveryForm, setDeliveryForm] = useState<DeliveryRecordPayload>(
    createEmptyDeliveryForm,
  );

  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);
  const [brandingError, setBrandingError] = useState<string | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [itemError, setItemError] = useState<string | null>(null);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [deliveryError, setDeliveryError] = useState<string | null>(null);

  const [categoryPending, setCategoryPending] = useState(false);
  const [clientPending, setClientPending] = useState(false);
  const [brandingPending, setBrandingPending] = useState(false);
  const [orderPending, setOrderPending] = useState(false);
  const [itemPending, setItemPending] = useState(false);
  const [schedulePending, setSchedulePending] = useState(false);
  const [deliveryPending, setDeliveryPending] = useState(false);
  const [activeTab, setActiveTab] = useState("categories");
  const [recentGeneratedOrderNumber, setRecentGeneratedOrderNumber] = useState<
    string | null
  >(null);

  const tabs = salesMilestoneFlow.map(({ id, label }) => ({ id, label }));
  const activeFlowItem =
    salesMilestoneFlow.find((item) => item.id === activeTab) ??
    salesMilestoneFlow[0];

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const requestedTab = params.get("tab");
    if (
      requestedTab &&
      salesMilestoneFlow.some((item) => item.id === requestedTab)
    ) {
      setActiveTab(requestedTab);
    }
  }, [location.search]);

  const buildAssignableOrderOptions = (selectedOrderId?: number | null) =>
    orders.filter(
      (order) => order.status !== "cancelled" || order.id === selectedOrderId,
    );

  const salesEmployees = employees.filter(
    (employee) =>
      employee.status === "active" && employee.work_role === "sales",
  );

  const selectedScheduleOrder =
    orders.find((order) => order.id === Number(scheduleForm.order)) ?? null;
  const selectedScheduleSellerName =
    selectedScheduleOrder?.assigned_seller_name || "Select an order first";
  const selectedScheduleSellerCode =
    selectedScheduleOrder?.assigned_seller_code || "";
  const selectedFinishedProduct =
    finishedProducts.find(
      (product) => product.id === Number(itemForm.finished_product),
    ) ?? null;
  const itemLineTotalPreview =
    (Number.parseFloat(itemForm.quantity || "0") || 0) *
    (Number.parseFloat(itemForm.unit_price || "0") || 0);

  const buildAssignableScheduleOptions = ({
    orderId,
    selectedScheduleId,
  }: {
    orderId?: number | null;
    selectedScheduleId?: number | null;
  }) =>
    schedules.filter(
      (schedule) =>
        (!orderId || schedule.order === orderId) &&
        (schedule.status !== "cancelled" || schedule.id === selectedScheduleId),
    );

  async function reloadSalesData() {
    const [
      categoryList,
      clientList,
      brandingList,
      orderList,
      itemList,
      scheduleList,
      deliveryList,
      employeeList,
      productList,
    ] = await Promise.all([
      fetchCustomerCategories(),
      fetchClients(),
      fetchBrandingRecords(),
      fetchSalesOrders(),
      fetchOrderItems(),
      fetchDeliverySchedules(),
      fetchDeliveryRecords(),
      fetchEmployees(),
      fetchFinishedProducts(),
    ]);

    setCategories(categoryList);
    setClients(clientList);
    setBrandingRecords(brandingList);
    setOrders(orderList);
    setOrderItems(itemList);
    setSchedules(scheduleList);
    setDeliveries(deliveryList);
    setEmployees(employeeList);
    setFinishedProducts(productList);
  }

  useEffect(() => {
    let isMounted = true;
    async function loadPage() {
      try {
        setLoading(true);
        setPageError(null);
        await reloadSalesData();
      } catch (error) {
        if (!isMounted) return;
        setPageError(
          error instanceof ApiError
            ? error.message
            : "Unable to load sales records right now.",
        );
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    void loadPage();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedCategoryId) {
      setCategoryForm(createEmptyCategoryForm());
      return;
    }
    void fetchCustomerCategory(selectedCategoryId)
      .then((record) =>
        setCategoryForm({
          name: record.name,
          description: record.description,
          is_active: record.is_active,
        }),
      )
      .catch((error) =>
        setCategoryError(
          error instanceof ApiError
            ? error.message
            : "Unable to load category.",
        ),
      );
  }, [selectedCategoryId]);

  useEffect(() => {
    if (!selectedClientId) {
      setClientForm(createEmptyClientForm());
      return;
    }
    void fetchClient(selectedClientId)
      .then((record) =>
        setClientForm({
          category: record.category,
          name: record.name,
          contact_person: record.contact_person,
          email: record.email,
          phone_number: record.phone_number,
          address: record.address,
          notes: record.notes,
          is_active: record.is_active,
        }),
      )
      .catch((error) =>
        setClientError(
          error instanceof ApiError ? error.message : "Unable to load client.",
        ),
      );
  }, [selectedClientId]);

  useEffect(() => {
    if (!selectedBrandingId) {
      setBrandingForm(createEmptyBrandingForm());
      return;
    }
    void fetchBrandingRecord(selectedBrandingId)
      .then((record) =>
        setBrandingForm({
          client: record.client,
          title: record.title,
          branding_type: record.branding_type,
          status: record.status,
          notes: record.notes,
        }),
      )
      .catch((error) =>
        setBrandingError(
          error instanceof ApiError
            ? error.message
            : "Unable to load branding record.",
        ),
      );
  }, [selectedBrandingId]);

  useEffect(() => {
    if (!selectedOrderId) {
      setOrderForm(createEmptyOrderForm());
      return;
    }
    void fetchSalesOrder(selectedOrderId)
      .then((record) =>
        setOrderForm({
          client: record.client,
          assigned_seller: record.assigned_seller ?? null,
          order_number: record.order_number,
          order_date: record.order_date,
          expected_delivery_date: record.expected_delivery_date,
          status: record.status,
          payment_method: record.payment_method ?? "cash",
          notes: record.notes,
        }),
      )
      .catch((error) =>
        setOrderError(
          error instanceof ApiError ? error.message : "Unable to load order.",
        ),
      );
  }, [selectedOrderId]);

  useEffect(() => {
    if (!selectedItemId) {
      setItemForm(createEmptyItemForm());
      return;
    }
    void fetchOrderItem(selectedItemId)
      .then((record) =>
        setItemForm({
          order: record.order,
          finished_product: record.finished_product,
          product_name: record.product_name,
          quantity: record.quantity,
          unit_price: record.unit_price,
          notes: record.notes,
        }),
      )
      .catch((error) =>
        setItemError(
          error instanceof ApiError
            ? error.message
            : "Unable to load order item.",
        ),
      );
  }, [selectedItemId]);

  useEffect(() => {
    if (!selectedScheduleId) {
      setScheduleForm(createEmptyScheduleForm());
      return;
    }
    void fetchDeliverySchedule(selectedScheduleId)
      .then((record) =>
        setScheduleForm({
          order: record.order,
          seller: record.seller ?? null,
          scheduled_date: record.scheduled_date,
          assigned_vehicle: record.assigned_vehicle || "",
          assigned_driver: record.assigned_driver || "",
          status: record.status,
          notes: record.notes,
        }),
      )
      .catch((error) =>
        setScheduleError(
          error instanceof ApiError
            ? error.message
            : "Unable to load schedule.",
        ),
      );
  }, [selectedScheduleId]);

  useEffect(() => {
    if (!selectedDeliveryId) {
      setDeliveryForm(createEmptyDeliveryForm());
      return;
    }
    void fetchDeliveryRecord(selectedDeliveryId)
      .then((record) =>
        setDeliveryForm({
          order: record.order,
          schedule: record.schedule,
          delivery_date: record.delivery_date,
          recipient_name: record.recipient_name,
          delivery_status: record.delivery_status,
          delivery_note: record.delivery_note,
        }),
      )
      .catch((error) =>
        setDeliveryError(
          error instanceof ApiError
            ? error.message
            : "Unable to load delivery.",
        ),
      );
  }, [selectedDeliveryId]);

  function closeModal() {
    if (activeModal === "item" || activeModal === "schedule") {
      setRecentGeneratedOrderNumber(null);
    }
    setActiveModal(null);
    setCategoryError(null);
    setClientError(null);
    setBrandingError(null);
    setOrderError(null);
    setItemError(null);
    setScheduleError(null);
    setDeliveryError(null);
  }

  function resetCategoryForm() {
    setSelectedCategoryId(null);
    setCategoryForm(createEmptyCategoryForm());
    setCategoryError(null);
  }
  function resetClientForm() {
    setSelectedClientId(null);
    setClientForm(createEmptyClientForm());
    setClientError(null);
  }
  function resetBrandingForm() {
    setSelectedBrandingId(null);
    setBrandingForm(createEmptyBrandingForm());
    setBrandingError(null);
  }
  function resetOrderForm() {
    setSelectedOrderId(null);
    setOrderForm(createEmptyOrderForm());
    setOrderError(null);
  }
  function resetItemForm() {
    setSelectedItemId(null);
    setItemForm(createEmptyItemForm());
    setItemError(null);
  }
  function resetScheduleForm() {
    setSelectedScheduleId(null);
    setScheduleForm(createEmptyScheduleForm());
    setScheduleError(null);
  }
  function resetDeliveryForm() {
    setSelectedDeliveryId(null);
    setDeliveryForm(createEmptyDeliveryForm());
    setDeliveryError(null);
  }

  async function runDelete(
    deleter: () => Promise<void>,
    resetter: () => void,
    setError: (value: string | null) => void,
    setPending: (value: boolean) => void,
    fallbackMessage: string,
  ) {
    setPending(true);
    setError(null);
    try {
      await deleter();
      await reloadSalesData();
      resetter();
      closeModal();
    } catch (error) {
      setError(error instanceof ApiError ? error.message : fallbackMessage);
    } finally {
      setPending(false);
    }
  }

  async function handleCategorySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCategoryPending(true);
    setCategoryError(null);
    try {
      if (selectedCategoryId) {
        await updateCustomerCategory(selectedCategoryId, categoryForm);
      } else {
        await createCustomerCategory(categoryForm);
      }
      await reloadSalesData();
      resetCategoryForm();
      closeModal();
    } catch (error) {
      setCategoryError(
        error instanceof ApiError ? error.message : "Unable to save category.",
      );
    } finally {
      setCategoryPending(false);
    }
  }

  async function handleClientSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setClientPending(true);
    setClientError(null);
    try {
      if (selectedClientId) {
        await updateClient(selectedClientId, clientForm);
      } else {
        await createClient(clientForm);
      }
      await reloadSalesData();
      resetClientForm();
      closeModal();
    } catch (error) {
      setClientError(
        error instanceof ApiError ? error.message : "Unable to save client.",
      );
    } finally {
      setClientPending(false);
    }
  }

  async function handleBrandingSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBrandingPending(true);
    setBrandingError(null);
    try {
      if (selectedBrandingId) {
        await updateBrandingRecord(selectedBrandingId, brandingForm);
      } else {
        await createBrandingRecord(brandingForm);
      }
      await reloadSalesData();
      resetBrandingForm();
      closeModal();
    } catch (error) {
      setBrandingError(
        error instanceof ApiError
          ? error.message
          : "Unable to save branding record.",
      );
    } finally {
      setBrandingPending(false);
    }
  }

  async function handleOrderSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setOrderPending(true);
    setOrderError(null);
    try {
      if (!orderForm.assigned_seller) {
        setOrderError("Select the seller assigned to this order.");
        return;
      }

      const payload: SalesOrderPayload = {
        client: Number(orderForm.client),
        assigned_seller: orderForm.assigned_seller
          ? Number(orderForm.assigned_seller)
          : null,
        order_date: orderForm.order_date,
        expected_delivery_date: orderForm.expected_delivery_date || null,
        status: orderForm.status,
        payment_method: orderForm.payment_method ?? "cash",
        notes: orderForm.notes.trim(),
      };
      if (selectedOrderId) {
        await updateSalesOrder(selectedOrderId, payload);
        await reloadSalesData();
        resetOrderForm();
        closeModal();
      } else {
        const createdOrder = await createSalesOrder(payload);
        await reloadSalesData();
        resetOrderForm();
        setRecentGeneratedOrderNumber(createdOrder.order_number);
        setItemForm({
          ...createEmptyItemForm(),
          order: createdOrder.id,
        });
        setActiveTab("items");
        setSelectedItemId(null);
        setActiveModal("item");
        return;
      }
    } catch (error) {
      setOrderError(
        error instanceof ApiError ? error.message : "Unable to save order.",
      );
    } finally {
      setOrderPending(false);
    }
  }

  async function handleItemSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setItemPending(true);
    setItemError(null);
    try {
      const currentOrderId = Number(itemForm.order);
      const linkedOrder =
        orders.find((order) => order.id === currentOrderId) ?? null;
      const payload: OrderItemPayload = {
        order: currentOrderId,
        finished_product: itemForm.finished_product
          ? Number(itemForm.finished_product)
          : null,
        product_name: itemForm.product_name.trim(),
        quantity: itemForm.quantity,
        unit_price: itemForm.unit_price,
        notes: itemForm.notes.trim(),
      };
      if (selectedItemId) {
        await updateOrderItem(selectedItemId, payload);
        await reloadSalesData();
        resetItemForm();
        closeModal();
      } else {
        await createOrderItem(payload);
        await reloadSalesData();
        resetItemForm();
        setScheduleForm({
          ...createEmptyScheduleForm(),
          order: currentOrderId,
          seller: linkedOrder?.assigned_seller ?? null,
          scheduled_date: linkedOrder?.expected_delivery_date ?? "",
        });
        setActiveTab("schedules");
        setSelectedScheduleId(null);
        setActiveModal("schedule");
        return;
      }
    } catch (error) {
      setItemError(
        error instanceof ApiError
          ? error.message
          : "Unable to save order item.",
      );
    } finally {
      setItemPending(false);
    }
  }

  async function handleScheduleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSchedulePending(true);
    setScheduleError(null);
    try {
      const linkedOrder =
        orders.find((order) => order.id === Number(scheduleForm.order)) ?? null;

      if (!linkedOrder?.assigned_seller) {
        setScheduleError("Choose an order that already has an assigned seller.");
        return;
      }

      const payload: DeliverySchedulePayload = {
        order: Number(scheduleForm.order),
        seller: scheduleForm.seller ?? linkedOrder?.assigned_seller ?? null,
        scheduled_date: scheduleForm.scheduled_date,
        assigned_vehicle: "",
        assigned_driver: "",
        status: scheduleForm.status,
        notes: scheduleForm.notes.trim(),
      };
      if (selectedScheduleId) {
        await updateDeliverySchedule(selectedScheduleId, payload);
      } else {
        await createDeliverySchedule(payload);
      }
      await reloadSalesData();
      resetScheduleForm();
      closeModal();
    } catch (error) {
      setScheduleError(
        error instanceof ApiError ? error.message : "Unable to save schedule.",
      );
    } finally {
      setSchedulePending(false);
    }
  }

  async function handleDeliverySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setDeliveryPending(true);
    setDeliveryError(null);
    try {
      const payload: DeliveryRecordPayload = {
        order: Number(deliveryForm.order),
        schedule: deliveryForm.schedule ? Number(deliveryForm.schedule) : null,
        delivery_date: deliveryForm.delivery_date,
        recipient_name: deliveryForm.recipient_name.trim(),
        delivery_status: deliveryForm.delivery_status,
        delivery_note: deliveryForm.delivery_note.trim(),
      };
      if (selectedDeliveryId) {
        await updateDeliveryRecord(selectedDeliveryId, payload);
      } else {
        await createDeliveryRecord(payload);
      }
      await reloadSalesData();
      resetDeliveryForm();
      closeModal();
    } catch (error) {
      setDeliveryError(
        error instanceof ApiError ? error.message : "Unable to save delivery.",
      );
    } finally {
      setDeliveryPending(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-600 shadow-sm">
          <LoaderCircle className="h-4 w-4 animate-spin" />
          Loading sales records...
        </div>
      </div>
    );
  }

  if (pageError) {
    return (
      <div className="rounded-[28px] border border-red-200 bg-red-50 p-6 text-red-700 shadow-sm">
        {pageError}
      </div>
    );
  }

  return (
    <div className="module-page">
      <section className="rounded-[32px] border border-white/70 bg-[radial-gradient(circle_at_top_left,#ffffff,rgba(224,242,254,0.92)_52%,rgba(240,249,255,0.95))] py-6 pl-6 pr-0 shadow-[0_25px_80px_rgba(148,163,184,0.14)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/75 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-sky-700">
              Sales
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
                Sales and distribution
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-slate-600">
                Manage client relationships, orders, delivery planning, and
                branded requests without mixing in stock deduction.
              </p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="hero-metric-card">
              <p className="hero-metric-label">Clients</p>
              <p className="hero-metric-value">{clients.length}</p>
            </div>
            <div className="hero-metric-card">
              <p className="hero-metric-label">Orders</p>
              <p className="hero-metric-value">{orders.length}</p>
            </div>
            <div className="hero-metric-card">
              <p className="hero-metric-label">Schedules</p>
              <p className="hero-metric-value">{schedules.length}</p>
            </div>
            <div className="hero-metric-card">
              <p className="hero-metric-label">Deliveries</p>
              <p className="hero-metric-value">{deliveries.length}</p>
            </div>
          </div>
        </div>
      </section>
      <ModuleTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      <div className="module-page-stage !justify-start overflow-hidden">
        <div className="flex min-h-0 flex-1 flex-col gap-6">
          <div className="min-h-0 flex-1">
            {activeTab === "categories" ? (
              <SectionCard
                title="Customer categories"
                description="Group clients by hospitality, retail, wholesale, or direct channels."
                action={
                  isAdmin ? (
                    <button
                      type="button"
                      className={iconButtonClassName}
                      onClick={() => {
                        resetCategoryForm();
                        setActiveModal("category");
                      }}
                      aria-label="Add customer category"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  ) : null
                }
              >
                {categories.length ? (
                  categories.map((record) => (
                    <article key={record.id} className={recordCardClassName}>
                      {isAdmin ? (
                        <button
                          type="button"
                          className={recordEditButtonClassName}
                          onClick={() => {
                            setSelectedCategoryId(record.id);
                            setActiveModal("category");
                          }}
                          aria-label={`Edit category ${record.name}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      ) : null}
                      <div className="flex flex-1 flex-col gap-4">
                        <div className="space-y-1 pr-10">
                          <h3 className="line-clamp-2 text-sm font-semibold text-slate-900">
                            {record.name}
                          </h3>
                          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                            {record.is_active ? "Active" : "Inactive"}
                          </p>
                        </div>
                        <div className="flex-1 space-y-3">
                          <DetailItem
                            label="Description"
                            value={record.description || "No description"}
                          />
                        </div>
                      </div>
                    </article>
                  ))
                ) : (
                  <EmptyState message="No customer categories created yet." />
                )}
              </SectionCard>
            ) : null}

            {activeTab === "clients" ? (
              <SectionCard
                title="Clients"
                description="Company buyers, delivery contacts, and their relationship notes."
                action={
                  isAdmin ? (
                    <button
                      type="button"
                      className={iconButtonClassName}
                      onClick={() => {
                        resetClientForm();
                        setActiveModal("client");
                      }}
                      aria-label="Add client"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  ) : null
                }
              >
                {clients.length ? (
                  clients.map((record) => (
                    <article key={record.id} className={recordCardClassName}>
                      {isAdmin ? (
                        <button
                          type="button"
                          className={recordEditButtonClassName}
                          onClick={() => {
                            setSelectedClientId(record.id);
                            setActiveModal("client");
                          }}
                          aria-label={`Edit client ${record.name}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      ) : null}
                      <div className="flex flex-1 flex-col gap-4">
                        <div className="space-y-1 pr-10">
                          <h3 className="line-clamp-2 text-sm font-semibold text-slate-900">
                            {record.name}
                          </h3>
                          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                            {record.category_name || "Uncategorized"}
                          </p>
                        </div>
                        <div className="flex-1 space-y-3">
                          <DetailItem
                            label="Contact"
                            value={record.contact_person || "No contact person"}
                          />
                          <DetailItem
                            label="Phone"
                            value={record.phone_number || "No phone"}
                          />
                          <DetailItem
                            label="Status"
                            value={record.is_active ? "Active" : "Inactive"}
                          />
                        </div>
                      </div>
                    </article>
                  ))
                ) : (
                  <EmptyState message="No clients added yet." />
                )}
              </SectionCard>
            ) : null}

            {activeTab === "branding" ? (
              <SectionCard
                title="Branding records"
                description="Track customer-specific packaging, label, and brand requests."
                action={
                  isAdmin ? (
                    <button
                      type="button"
                      className={iconButtonClassName}
                      onClick={() => {
                        resetBrandingForm();
                        setActiveModal("branding");
                      }}
                      aria-label="Add branding record"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  ) : null
                }
              >
                {brandingRecords.length ? (
                  brandingRecords.map((record) => (
                    <article key={record.id} className={recordCardClassName}>
                      {isAdmin ? (
                        <button
                          type="button"
                          className={recordEditButtonClassName}
                          onClick={() => {
                            setSelectedBrandingId(record.id);
                            setActiveModal("branding");
                          }}
                          aria-label={`Edit branding ${record.title}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      ) : null}
                      <div className="flex flex-1 flex-col gap-4">
                        <div className="space-y-1 pr-10">
                          <h3 className="line-clamp-2 text-sm font-semibold text-slate-900">
                            {record.title}
                          </h3>
                          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                            {record.status}
                          </p>
                        </div>
                        <div className="flex-1 space-y-3">
                          <DetailItem
                            label="Client"
                            value={record.client_name || "No linked client"}
                          />
                          <DetailItem
                            label="Type"
                            value={record.branding_type}
                          />
                        </div>
                      </div>
                    </article>
                  ))
                ) : (
                  <EmptyState message="No branding records created yet." />
                )}
              </SectionCard>
            ) : null}

            {activeTab === "orders" ? (
              <SectionCard
                title="Sales orders"
                description="Customer orders with totals calculated from order items."
                action={
                  isAdmin ? (
                    <button
                      type="button"
                      className={iconButtonClassName}
                      onClick={() => {
                        resetOrderForm();
                        setActiveModal("order");
                      }}
                      aria-label="Add sales order"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  ) : null
                }
              >
                {orders.length ? (
                  orders.map((record) => (
                    <article key={record.id} className={recordCardClassName}>
                      {isAdmin ? (
                        <button
                          type="button"
                          className={recordEditButtonClassName}
                          onClick={() => {
                            setSelectedOrderId(record.id);
                            setActiveModal("order");
                          }}
                          aria-label={`Edit order ${record.order_number}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      ) : null}
                      <div className="flex flex-1 flex-col gap-4">
                        <div className="space-y-1 pr-10">
                          <h3 className="line-clamp-2 text-sm font-semibold text-slate-900">
                            {record.order_number}
                          </h3>
                          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                            {record.status}
                          </p>
                        </div>
                        <div className="flex-1 space-y-3">
                          <DetailItem
                            label="Client"
                            value={record.client_name}
                          />
                          <DetailItem
                            label="Seller"
                            value={record.assigned_seller_name || "Not assigned"}
                          />
                          <DetailItem
                            label="Order date"
                            value={formatDate(record.order_date)}
                          />
                          <DetailItem
                            label="Payment"
                            value={(record.payment_method ?? "cash").replaceAll("_", " ")}
                          />
                          <DetailItem
                            label="Total"
                            value={record.total_amount}
                          />
                        </div>
                      </div>
                    </article>
                  ))
                ) : (
                  <EmptyState message="No sales orders created yet." />
                )}
              </SectionCard>
            ) : null}

            {activeTab === "items" ? (
              <SectionCard
                title="Order items"
                description="Line items that feed order totals and can point to finished products."
                action={
                  isAdmin ? (
                    <button
                      type="button"
                      className={iconButtonClassName}
                      onClick={() => {
                        resetItemForm();
                        setActiveModal("item");
                      }}
                      aria-label="Add order item"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  ) : null
                }
              >
                {orderItems.length ? (
                  orderItems.map((record) => (
                    <article key={record.id} className={recordCardClassName}>
                      {isAdmin ? (
                        <button
                          type="button"
                          className={recordEditButtonClassName}
                          onClick={() => {
                            setSelectedItemId(record.id);
                            setActiveModal("item");
                          }}
                          aria-label={`Edit order item ${record.product_name}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      ) : null}
                      <div className="flex flex-1 flex-col gap-4">
                        <div className="space-y-1 pr-10">
                          <h3 className="line-clamp-2 text-sm font-semibold text-slate-900">
                            {record.product_name ||
                              record.finished_product_name}
                          </h3>
                          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                            {record.order_number}
                          </p>
                        </div>
                        <div className="flex-1 space-y-3">
                          <DetailItem
                            label="Quantity"
                            value={record.quantity}
                          />
                          <DetailItem
                            label="Unit price"
                            value={record.unit_price}
                          />
                          <DetailItem
                            label="Line total"
                            value={record.line_total}
                          />
                        </div>
                      </div>
                    </article>
                  ))
                ) : (
                  <EmptyState message="No order items created yet." />
                )}
              </SectionCard>
            ) : null}

            {activeTab === "schedules" ? (
              <SectionCard
                title="Delivery schedules"
                description="Plan transport windows, assigned vehicles, and driver details."
                action={
                  isAdmin ? (
                    <button
                      type="button"
                      className={iconButtonClassName}
                      onClick={() => {
                        resetScheduleForm();
                        setActiveModal("schedule");
                      }}
                      aria-label="Add delivery schedule"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  ) : null
                }
              >
                {schedules.length ? (
                  schedules.map((record) => (
                    <article key={record.id} className={recordCardClassName}>
                      {isAdmin ? (
                        <button
                          type="button"
                          className={recordEditButtonClassName}
                          onClick={() => {
                            setSelectedScheduleId(record.id);
                            setActiveModal("schedule");
                          }}
                          aria-label={`Edit schedule for ${record.order_number}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      ) : null}
                      <div className="flex flex-1 flex-col gap-4">
                        <div className="space-y-1 pr-10">
                          <h3 className="line-clamp-2 text-sm font-semibold text-slate-900">
                            {record.order_number}
                          </h3>
                          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                            {record.status}
                          </p>
                        </div>
                        <div className="flex-1 space-y-3">
                          <DetailItem
                            label="Scheduled"
                            value={formatDate(record.scheduled_date)}
                          />
                          <DetailItem
                            label="Seller"
                            value={record.seller_name || "Not assigned"}
                          />
                          <DetailItem
                            label="Seller code"
                            value={record.seller_code || "Not assigned"}
                          />
                        </div>
                      </div>
                    </article>
                  ))
                ) : (
                  <EmptyState message="No delivery schedules created yet." />
                )}
              </SectionCard>
            ) : null}

            {activeTab === "deliveries" ? (
              <SectionCard
                title="Delivery records"
                description="Capture proof of delivery, recipient name, and final delivery status."
                action={
                  isAdmin ? (
                    <button
                      type="button"
                      className={iconButtonClassName}
                      onClick={() => {
                        resetDeliveryForm();
                        setActiveModal("delivery");
                      }}
                      aria-label="Add delivery record"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  ) : null
                }
              >
                {deliveries.length ? (
                  deliveries.map((record) => (
                    <article key={record.id} className={recordCardClassName}>
                      {isAdmin ? (
                        <button
                          type="button"
                          className={recordEditButtonClassName}
                          onClick={() => {
                            setSelectedDeliveryId(record.id);
                            setActiveModal("delivery");
                          }}
                          aria-label={`Edit delivery for ${record.order_number}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      ) : null}
                      <div className="flex flex-1 flex-col gap-4">
                        <div className="space-y-1 pr-10">
                          <h3 className="line-clamp-2 text-sm font-semibold text-slate-900">
                            {record.order_number}
                          </h3>
                          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                            {record.delivery_status}
                          </p>
                        </div>
                        <div className="flex-1 space-y-3">
                          <DetailItem
                            label="Delivery date"
                            value={formatDate(record.delivery_date)}
                          />
                          <DetailItem
                            label="Recipient"
                            value={record.recipient_name || "Not recorded"}
                          />
                          <DetailItem
                            label="Proof"
                            value={
                              record.proof_reference || "No proof reference"
                            }
                          />
                        </div>
                      </div>
                    </article>
                  ))
                ) : (
                  <EmptyState message="No delivery records created yet." />
                )}
              </SectionCard>
            ) : null}
          </div>

          <footer className="panel mt-auto px-4 py-3">
            <p className="text-sm leading-6 text-slate-600">
              <span className="font-semibold text-sky-700">
                {activeFlowItem.label}
              </span>{" "}
              {activeFlowItem.detail}
            </p>
          </footer>
        </div>
      </div>
      {activeModal === "category" ? (
        <ModalShell
          title={
            selectedCategoryId
              ? "Edit customer category"
              : "Add customer category"
          }
          description="Create or update a client grouping."
          onClose={closeModal}
        >
          <form className="space-y-6" onSubmit={handleCategorySubmit}>
            <FormPanel
              title="Category details"
              description="Use the customer categories endpoint fields here."
            >
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
                  <span>Name</span>
                  <input
                    className={fieldClassName}
                    value={categoryForm.name}
                    onChange={(event) =>
                      setCategoryForm((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    required
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
                  <span>Description</span>
                  <textarea
                    className={textAreaClassName}
                    value={categoryForm.description}
                    onChange={(event) =>
                      setCategoryForm((current) => ({
                        ...current,
                        description: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 md:col-span-2">
                  <input
                    type="checkbox"
                    checked={categoryForm.is_active}
                    onChange={(event) =>
                      setCategoryForm((current) => ({
                        ...current,
                        is_active: event.target.checked,
                      }))
                    }
                  />
                  Category is active
                </label>
              </div>
            </FormPanel>
            <FieldMessage message={categoryError} />
            <div className="flex flex-wrap items-center justify-between gap-3">
              {selectedCategoryId ? (
                <button
                  type="button"
                  className={dangerButtonClassName}
                  disabled={categoryPending}
                  onClick={() =>
                    void runDelete(
                      () => deleteCustomerCategory(selectedCategoryId),
                      resetCategoryForm,
                      setCategoryError,
                      setCategoryPending,
                      "Unable to delete category.",
                    )
                  }
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              ) : (
                <span />
              )}
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  className={secondaryButtonClassName}
                  disabled={categoryPending}
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={primaryButtonClassName}
                  disabled={categoryPending}
                >
                  {categoryPending ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : null}
                  {selectedCategoryId ? "Save changes" : "Create category"}
                </button>
              </div>
            </div>
          </form>
        </ModalShell>
      ) : null}

      {activeModal === "client" ? (
        <ModalShell
          title={selectedClientId ? "Edit client" : "Add client"}
          description="Create or update a sales client."
          onClose={closeModal}
        >
          <form className="space-y-6" onSubmit={handleClientSubmit}>
            <FormPanel
              title="Client details"
              description="Use the clients endpoint fields here."
            >
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>Category</span>
                  <PickerField
                    value={
                      clientForm.category ? String(clientForm.category) : ""
                    }
                    options={[
                      { label: "No category", value: "" },
                      ...categories.map((category) => ({
                        label: category.name,
                        value: String(category.id),
                      })),
                    ]}
                    onChange={(value) =>
                      setClientForm((current) => ({
                        ...current,
                        category: value ? Number(value) : null,
                      }))
                    }
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>Name</span>
                  <input
                    className={fieldClassName}
                    value={clientForm.name}
                    onChange={(event) =>
                      setClientForm((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    required
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>Contact person</span>
                  <input
                    className={fieldClassName}
                    value={clientForm.contact_person}
                    onChange={(event) =>
                      setClientForm((current) => ({
                        ...current,
                        contact_person: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>Email</span>
                  <input
                    type="email"
                    className={fieldClassName}
                    value={clientForm.email}
                    onChange={(event) =>
                      setClientForm((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>Phone number</span>
                  <input
                    className={fieldClassName}
                    value={clientForm.phone_number}
                    onChange={(event) =>
                      setClientForm((current) => ({
                        ...current,
                        phone_number: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
                  <span>Address</span>
                  <textarea
                    className={textAreaClassName}
                    value={clientForm.address}
                    onChange={(event) =>
                      setClientForm((current) => ({
                        ...current,
                        address: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
                  <span>Notes</span>
                  <textarea
                    className={textAreaClassName}
                    value={clientForm.notes}
                    onChange={(event) =>
                      setClientForm((current) => ({
                        ...current,
                        notes: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 md:col-span-2">
                  <input
                    type="checkbox"
                    checked={clientForm.is_active}
                    onChange={(event) =>
                      setClientForm((current) => ({
                        ...current,
                        is_active: event.target.checked,
                      }))
                    }
                  />
                  Client is active
                </label>
              </div>
            </FormPanel>
            <FieldMessage message={clientError} />
            <div className="flex flex-wrap items-center justify-between gap-3">
              {selectedClientId ? (
                <button
                  type="button"
                  className={dangerButtonClassName}
                  disabled={clientPending}
                  onClick={() =>
                    void runDelete(
                      () => deleteClient(selectedClientId),
                      resetClientForm,
                      setClientError,
                      setClientPending,
                      "Unable to delete client.",
                    )
                  }
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              ) : (
                <span />
              )}
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  className={secondaryButtonClassName}
                  disabled={clientPending}
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={primaryButtonClassName}
                  disabled={clientPending}
                >
                  {clientPending ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : null}
                  {selectedClientId ? "Save changes" : "Create client"}
                </button>
              </div>
            </div>
          </form>
        </ModalShell>
      ) : null}

      {activeModal === "branding" ? (
        <ModalShell
          title={
            selectedBrandingId ? "Edit branding record" : "Add branding record"
          }
          description="Capture client-specific brand and packaging work."
          onClose={closeModal}
        >
          <form className="space-y-6" onSubmit={handleBrandingSubmit}>
            <FormPanel
              title="Branding details"
              description="Use the branding records endpoint fields here."
            >
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>Client</span>
                  <PickerField
                    value={
                      brandingForm.client ? String(brandingForm.client) : ""
                    }
                    options={[
                      { label: "No linked client", value: "" },
                      ...clients.map((client) => ({
                        label: client.name,
                        value: String(client.id),
                      })),
                    ]}
                    onChange={(value) =>
                      setBrandingForm((current) => ({
                        ...current,
                        client: value ? Number(value) : null,
                      }))
                    }
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>Status</span>
                  <PickerField
                    value={brandingForm.status}
                    options={brandingStatuses.map((status) => ({
                      label: status,
                      value: status,
                    }))}
                    onChange={(value) =>
                      setBrandingForm((current) => ({
                        ...current,
                        status: value as BrandingStatus,
                      }))
                    }
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
                  <span>Title</span>
                  <input
                    className={fieldClassName}
                    value={brandingForm.title}
                    onChange={(event) =>
                      setBrandingForm((current) => ({
                        ...current,
                        title: event.target.value,
                      }))
                    }
                    required
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
                  <span>Branding type</span>
                  <input
                    className={fieldClassName}
                    value={brandingForm.branding_type}
                    onChange={(event) =>
                      setBrandingForm((current) => ({
                        ...current,
                        branding_type: event.target.value,
                      }))
                    }
                    required
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
                  <span>Notes</span>
                  <textarea
                    className={textAreaClassName}
                    value={brandingForm.notes}
                    onChange={(event) =>
                      setBrandingForm((current) => ({
                        ...current,
                        notes: event.target.value,
                      }))
                    }
                  />
                </label>
              </div>
            </FormPanel>
            <FieldMessage message={brandingError} />
            <div className="flex flex-wrap items-center justify-between gap-3">
              {selectedBrandingId ? (
                <button
                  type="button"
                  className={dangerButtonClassName}
                  disabled={brandingPending}
                  onClick={() =>
                    void runDelete(
                      () => deleteBrandingRecord(selectedBrandingId),
                      resetBrandingForm,
                      setBrandingError,
                      setBrandingPending,
                      "Unable to delete branding record.",
                    )
                  }
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              ) : (
                <span />
              )}
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  className={secondaryButtonClassName}
                  disabled={brandingPending}
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={primaryButtonClassName}
                  disabled={brandingPending}
                >
                  {brandingPending ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : null}
                  {selectedBrandingId
                    ? "Save changes"
                    : "Create branding record"}
                </button>
              </div>
            </div>
          </form>
        </ModalShell>
      ) : null}

      {activeModal === "order" ? (
        <ModalShell
          title={selectedOrderId ? "Edit sales order" : "Add sales order"}
          description="Create or update a sales order and assign the seller responsible for it."
          onClose={closeModal}
        >
          <form className="space-y-6" onSubmit={handleOrderSubmit}>
            <FormPanel
              title="Order details"
              description="Capture the client, seller, dates, and order status."
            >
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>Client</span>
                  <PickerField
                    value={orderForm.client ? String(orderForm.client) : ""}
                    options={[
                      { label: "Select client", value: "" },
                      ...clients.map((client) => ({
                        label: client.name,
                        value: String(client.id),
                      })),
                    ]}
                    onChange={(value) =>
                      setOrderForm((current) => ({
                        ...current,
                        client: Number(value),
                      }))
                    }
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>Status</span>
                  <PickerField
                    value={orderForm.status}
                    options={orderStatuses.map((status) => ({
                      label: status,
                      value: status,
                    }))}
                    onChange={(value) =>
                      setOrderForm((current) => ({
                        ...current,
                        status: value as OrderStatus,
                      }))
                    }
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>Assigned seller</span>
                  <PickerField
                    value={
                      orderForm.assigned_seller
                        ? String(orderForm.assigned_seller)
                        : ""
                    }
                    options={[
                      { label: "Select seller", value: "" },
                      ...salesEmployees.map((employee) => ({
                        label: `${employee.full_name} (${employee.employee_code})`,
                        value: String(employee.id),
                      })),
                    ]}
                    onChange={(value) =>
                      setOrderForm((current) => ({
                        ...current,
                        assigned_seller: value ? Number(value) : null,
                      }))
                    }
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>Payment method</span>
                  <PickerField
                    value={orderForm.payment_method ?? "cash"}
                    options={paymentMethods.map((method) => ({
                      label: method.replaceAll("_", " "),
                      value: method,
                    }))}
                    onChange={(value) =>
                      setOrderForm((current) => ({
                        ...current,
                        payment_method: value as PaymentMethod,
                      }))
                    }
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>Order number</span>
                  <input
                    className={`${fieldClassName} bg-slate-50 text-slate-500`}
                    value={
                      selectedOrderId
                        ? orderForm.order_number || "Saved order number"
                        : "Will be generated automatically by the backend"
                    }
                    disabled
                    readOnly
                  />
                  <p className="text-xs text-slate-500">
                    {selectedOrderId
                      ? "Order numbers are backend-managed and cannot be edited."
                      : "The backend will assign the next ORD number when you create the order."}
                  </p>
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>Order date</span>
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
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
                  <span>Expected delivery date</span>
                  <input
                    type="date"
                    className={fieldClassName}
                    value={orderForm.expected_delivery_date ?? ""}
                    onChange={(event) =>
                      setOrderForm((current) => ({
                        ...current,
                        expected_delivery_date: event.target.value || null,
                      }))
                    }
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
                  <span>Notes</span>
                  <textarea
                    className={textAreaClassName}
                    value={orderForm.notes}
                    onChange={(event) =>
                      setOrderForm((current) => ({
                        ...current,
                        notes: event.target.value,
                      }))
                    }
                  />
                </label>
              </div>
            </FormPanel>
            <FieldMessage message={orderError} />
            <div className="flex flex-wrap items-center justify-between gap-3">
              {selectedOrderId ? (
                <button
                  type="button"
                  className={dangerButtonClassName}
                  disabled={orderPending}
                  onClick={() =>
                    void runDelete(
                      () => deleteSalesOrder(selectedOrderId),
                      resetOrderForm,
                      setOrderError,
                      setOrderPending,
                      "Unable to delete order.",
                    )
                  }
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              ) : (
                <span />
              )}
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  className={secondaryButtonClassName}
                  disabled={orderPending}
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={primaryButtonClassName}
                  disabled={orderPending}
                >
                  {orderPending ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : null}
                  {selectedOrderId ? "Save changes" : "Add order item"}
                </button>
              </div>
            </div>
          </form>
        </ModalShell>
      ) : null}

      {activeModal === "item" ? (
        <ModalShell
          title={selectedItemId ? "Edit order item" : "Add order item"}
          description="Create or update line items that feed an order total."
          onClose={closeModal}
        >
          <form className="space-y-6" onSubmit={handleItemSubmit}>
            {!selectedItemId && recentGeneratedOrderNumber ? (
              <div className="rounded-[28px] border border-sky-200 bg-[linear-gradient(135deg,rgba(224,242,254,0.95),rgba(186,230,253,0.78))] px-5 py-4 shadow-[0_18px_40px_rgba(14,116,144,0.14)]">
                <p className="text-base font-semibold text-sky-950">
                  {`Your generated order number is ${recentGeneratedOrderNumber}. Create the order item for that order below.`}
                </p>
              </div>
            ) : null}
            <FormPanel
              title="Item details"
              description="Use either a finished product link or a direct product name."
            >
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>Order</span>
                  <PickerField
                    value={itemForm.order ? String(itemForm.order) : ""}
                    options={[
                      { label: "Select order", value: "" },
                      ...buildAssignableOrderOptions(itemForm.order).map(
                        (order) => ({
                          label:
                            order.status === "cancelled"
                              ? `${order.order_number} (Cancelled)`
                              : order.order_number,
                          value: String(order.id),
                        }),
                      ),
                    ]}
                    onChange={(value) =>
                      setItemForm((current) => ({
                        ...current,
                        order: Number(value),
                      }))
                    }
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>Finished product</span>
                  <PickerField
                    value={
                      itemForm.finished_product
                        ? String(itemForm.finished_product)
                        : ""
                    }
                    options={[
                      { label: "Direct product name", value: "" },
                      ...finishedProducts.map((product) => ({
                        label: `${product.name} (${formatCurrency(Number.parseFloat(product.unit_price))})`,
                        value: String(product.id),
                      })),
                    ]}
                    onChange={(value) => {
                      const matchedProduct = finishedProducts.find(
                        (product) => product.id === Number(value),
                      );
                      setItemForm((current) => ({
                        ...current,
                        finished_product: value ? Number(value) : null,
                        unit_price: matchedProduct
                          ? matchedProduct.unit_price
                          : current.unit_price,
                      }));
                    }}
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
                  <span>Product name</span>
                  <input
                    className={fieldClassName}
                    value={itemForm.product_name}
                    onChange={(event) =>
                      setItemForm((current) => ({
                        ...current,
                        product_name: event.target.value,
                      }))
                    }
                    placeholder="Use when no finished product is selected"
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>Quantity</span>
                  <input
                    className={fieldClassName}
                    value={itemForm.quantity}
                    onChange={(event) =>
                      setItemForm((current) => ({
                        ...current,
                        quantity: event.target.value,
                      }))
                    }
                    required
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>Unit price</span>
                  <input
                    className={`${fieldClassName} ${selectedFinishedProduct ? "cursor-not-allowed bg-slate-100 text-slate-500" : ""}`}
                    type="number"
                    min="0"
                    step="0.01"
                    value={itemForm.unit_price}
                    onChange={(event) =>
                      setItemForm((current) => ({
                        ...current,
                        unit_price: event.target.value,
                      }))
                    }
                    readOnly={Boolean(selectedFinishedProduct)}
                    required
                  />
                  <p className="text-xs text-slate-500">
                    {selectedFinishedProduct
                      ? `${selectedFinishedProduct.name} price applied automatically: ${formatCurrencyFromString(itemForm.unit_price)}`
                      : "Enter the unit price only when using a direct product name."}
                  </p>
                </label>
                <div className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
                  <span>Line total</span>
                  <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 px-4 py-3 text-sm text-slate-700">
                    {formatCurrency(itemLineTotalPreview)}
                    {selectedFinishedProduct ? (
                      <span className="ml-2 text-slate-500">
                        from {selectedFinishedProduct.name}
                      </span>
                    ) : null}
                  </div>
                </div>
                <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
                  <span>Notes</span>
                  <textarea
                    className={textAreaClassName}
                    value={itemForm.notes}
                    onChange={(event) =>
                      setItemForm((current) => ({
                        ...current,
                        notes: event.target.value,
                      }))
                    }
                  />
                </label>
              </div>
            </FormPanel>
            <FieldMessage message={itemError} />
            <div className="flex flex-wrap items-center justify-between gap-3">
              {selectedItemId ? (
                <button
                  type="button"
                  className={dangerButtonClassName}
                  disabled={itemPending}
                  onClick={() =>
                    void runDelete(
                      () => deleteOrderItem(selectedItemId),
                      resetItemForm,
                      setItemError,
                      setItemPending,
                      "Unable to delete order item.",
                    )
                  }
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              ) : (
                <span />
              )}
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  className={secondaryButtonClassName}
                  disabled={itemPending}
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={primaryButtonClassName}
                  disabled={itemPending}
                >
                  {itemPending ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : null}
                  {selectedItemId ? "Save changes" : "Create order item"}
                </button>
              </div>
            </div>
          </form>
        </ModalShell>
      ) : null}

      {activeModal === "schedule" ? (
        <ModalShell
          title={
            selectedScheduleId
              ? "Edit delivery schedule"
              : "Add delivery schedule"
          }
          description="Plan the delivery date while keeping the order's assigned seller attached."
          onClose={closeModal}
        >
          <form className="space-y-6" onSubmit={handleScheduleSubmit}>
            {!selectedScheduleId && recentGeneratedOrderNumber ? (
              <div className="rounded-[28px] border border-sky-200 bg-[linear-gradient(135deg,rgba(224,242,254,0.95),rgba(186,230,253,0.78))] px-5 py-4 shadow-[0_18px_40px_rgba(14,116,144,0.14)]">
                <p className="text-base font-semibold text-sky-950">
                  {`Your generated order number is ${recentGeneratedOrderNumber}. Create the delivery schedule for that order below.`}
                </p>
              </div>
            ) : null}
            <FormPanel
              title="Schedule details"
              description="Schedules now inherit the seller from the selected sales order."
            >
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>Order</span>
                  <PickerField
                    value={scheduleForm.order ? String(scheduleForm.order) : ""}
                    options={[
                      { label: "Select order", value: "" },
                      ...buildAssignableOrderOptions(scheduleForm.order).map(
                        (order) => ({
                          label:
                            order.status === "cancelled"
                              ? `${order.order_number} (Cancelled)`
                              : order.order_number,
                          value: String(order.id),
                        }),
                      ),
                    ]}
                    onChange={(value) =>
                      setScheduleForm((current) => {
                        const nextOrder = orders.find(
                          (order) => order.id === Number(value),
                        );

                        return {
                          ...current,
                          order: Number(value),
                          seller: nextOrder?.assigned_seller ?? null,
                        };
                      })
                    }
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>Status</span>
                  <PickerField
                    value={scheduleForm.status}
                    options={deliveryScheduleStatuses.map((status) => ({
                      label: status,
                      value: status,
                    }))}
                    onChange={(value) =>
                      setScheduleForm((current) => ({
                        ...current,
                        status: value as DeliveryScheduleStatus,
                      }))
                    }
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>Scheduled date</span>
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
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>Seller</span>
                  <input
                    className={fieldClassName}
                    value={selectedScheduleSellerName}
                    disabled
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>Seller code</span>
                  <input
                    className={fieldClassName}
                    value={selectedScheduleSellerCode || "Will follow the order"}
                    disabled
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
                  <span>Notes</span>
                  <textarea
                    className={textAreaClassName}
                    value={scheduleForm.notes}
                    onChange={(event) =>
                      setScheduleForm((current) => ({
                        ...current,
                        notes: event.target.value,
                      }))
                    }
                  />
                </label>
              </div>
            </FormPanel>
            <FieldMessage message={scheduleError} />
            <div className="flex flex-wrap items-center justify-between gap-3">
              {selectedScheduleId ? (
                <button
                  type="button"
                  className={dangerButtonClassName}
                  disabled={schedulePending}
                  onClick={() =>
                    void runDelete(
                      () => deleteDeliverySchedule(selectedScheduleId),
                      resetScheduleForm,
                      setScheduleError,
                      setSchedulePending,
                      "Unable to delete schedule.",
                    )
                  }
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              ) : (
                <span />
              )}
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  className={secondaryButtonClassName}
                  disabled={schedulePending}
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={primaryButtonClassName}
                  disabled={schedulePending}
                >
                  {schedulePending ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : null}
                  {selectedScheduleId ? "Save changes" : "Create schedule"}
                </button>
              </div>
            </div>
          </form>
        </ModalShell>
      ) : null}

      {activeModal === "delivery" ? (
        <ModalShell
          title={
            selectedDeliveryId ? "Edit delivery record" : "Add delivery record"
          }
          description="Capture the final delivery outcome."
          onClose={closeModal}
        >
          <form className="space-y-6" onSubmit={handleDeliverySubmit}>
            <FormPanel
              title="Delivery details"
              description="Use the delivery records endpoint fields here."
            >
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>Order</span>
                  <PickerField
                    value={deliveryForm.order ? String(deliveryForm.order) : ""}
                    options={[
                      { label: "Select order", value: "" },
                      ...buildAssignableOrderOptions(deliveryForm.order).map(
                        (order) => ({
                          label:
                            order.status === "cancelled"
                              ? `${order.order_number} (Cancelled)`
                              : order.order_number,
                          value: String(order.id),
                        }),
                      ),
                    ]}
                    onChange={(value) =>
                      setDeliveryForm((current) => ({
                        ...current,
                        order: Number(value),
                        schedule: null,
                      }))
                    }
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>Schedule</span>
                  <PickerField
                    value={
                      deliveryForm.schedule ? String(deliveryForm.schedule) : ""
                    }
                    options={[
                      { label: "No linked schedule", value: "" },
                      ...buildAssignableScheduleOptions({
                        orderId: deliveryForm.order || null,
                        selectedScheduleId: deliveryForm.schedule,
                      }).map((schedule) => ({
                        label:
                          schedule.status === "cancelled"
                            ? `${schedule.order_number} - ${formatDate(schedule.scheduled_date)} (Cancelled)`
                            : `${schedule.order_number} - ${formatDate(schedule.scheduled_date)}`,
                        value: String(schedule.id),
                      })),
                    ]}
                    onChange={(value) =>
                      setDeliveryForm((current) => ({
                        ...current,
                        schedule: value ? Number(value) : null,
                      }))
                    }
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>Delivery date</span>
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
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>Status</span>
                  <PickerField
                    value={deliveryForm.delivery_status}
                    options={deliveryRecordStatuses.map((status) => ({
                      label: status,
                      value: status,
                    }))}
                    onChange={(value) =>
                      setDeliveryForm((current) => ({
                        ...current,
                        delivery_status: value as DeliveryRecordStatus,
                      }))
                    }
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>Recipient name</span>
                  <input
                    className={fieldClassName}
                    value={deliveryForm.recipient_name}
                    onChange={(event) =>
                      setDeliveryForm((current) => ({
                        ...current,
                        recipient_name: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
                  <span>Delivery note</span>
                  <textarea
                    className={textAreaClassName}
                    value={deliveryForm.delivery_note}
                    onChange={(event) =>
                      setDeliveryForm((current) => ({
                        ...current,
                        delivery_note: event.target.value,
                      }))
                    }
                  />
                </label>
              </div>
            </FormPanel>
            <FieldMessage message={deliveryError} />
            <div className="flex flex-wrap items-center justify-between gap-3">
              {selectedDeliveryId ? (
                <button
                  type="button"
                  className={dangerButtonClassName}
                  disabled={deliveryPending}
                  onClick={() =>
                    void runDelete(
                      () => deleteDeliveryRecord(selectedDeliveryId),
                      resetDeliveryForm,
                      setDeliveryError,
                      setDeliveryPending,
                      "Unable to delete delivery record.",
                    )
                  }
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              ) : (
                <span />
              )}
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  className={secondaryButtonClassName}
                  disabled={deliveryPending}
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={primaryButtonClassName}
                  disabled={deliveryPending}
                >
                  {deliveryPending ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : null}
                  {selectedDeliveryId
                    ? "Save changes"
                    : "Create delivery record"}
                </button>
              </div>
            </div>
          </form>
        </ModalShell>
      ) : null}
    </div>
  );
}
