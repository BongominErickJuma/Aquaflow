import { Check, LoaderCircle, Pencil, Plus, RefreshCw, X } from "lucide-react";
import { PickerField } from "../components/forms/PickerField";
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { ModuleTabs } from "../components/layout/ModuleTabs";
import { ApiError } from "../lib/api/auth";
import { fetchProducts } from "../lib/api/inventory";
import {
  createClient,
  createCustomerCategory,
  createPayment,
  createSale,
  createSaleItem,
  fetchClients,
  fetchCustomerCategories,
  fetchPayments,
  fetchSaleItems,
  fetchSales,
  updateClient,
  updateCustomerCategory,
  updatePayment,
  updateSale,
  updateSaleItem,
} from "../lib/api/sales";
import { fetchEmployees } from "../lib/api/workforce";
import type { FinishedProductRecord } from "../types/inventory";
import type {
  ClientPayload,
  ClientRecord,
  CustomerCategoryPayload,
  CustomerCategoryRecord,
  PaymentPayload,
  PaymentRecord,
  SaleItemPayload,
  SaleItemRecord,
  SalePayload,
  SaleRecord,
  SaleStatus,
  SalesPaymentMethod,
} from "../types/sales";
import type { EmployeeRecord } from "../types/workforce";

type SalesTab = "sales" | "items" | "payments" | "clients" | "categories";
type ActiveModal = "sale" | "item" | "payment" | "client" | "category" | null;

const tabs: { id: SalesTab; label: string }[] = [
  { id: "sales", label: "Sales" },
  { id: "items", label: "Items" },
  { id: "payments", label: "Payments" },
  { id: "clients", label: "Clients" },
  { id: "categories", label: "Client Categories" },
];

const salesMilestoneFlow: Array<{ id: SalesTab; label: string; detail: string }> =
  [
    {
      id: "categories",
      label: "Client Categories",
      detail:
        "Create and manage customer categories here. Next, assign categories to client records.",
    },
    {
      id: "clients",
      label: "Clients",
      detail:
        "Create and manage customers here. Before this, add client categories if needed. Next, create sales.",
    },
    {
      id: "sales",
      label: "Sales",
      detail:
        "Create sale headers here. Before this, the client should already exist. Next, add sale items.",
    },
    {
      id: "items",
      label: "Items",
      detail:
        "Attach products or direct item names to a sale here. Before this, create the sale. Next, record payments.",
    },
    {
      id: "payments",
      label: "Payments",
      detail:
        "Record payment receipts against sales here. Orders and delivery movement are handled in the Orders module.",
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

const saleStatuses: SaleStatus[] = ["draft", "completed", "cancelled"];
const paymentMethods: SalesPaymentMethod[] = [
  "cash",
  "card",
  "mobile_money",
  "bank",
];

function today() {
  return new Date().toISOString().slice(0, 10);
}

function formatMoney(value: string | number | null | undefined) {
  const amount =
    typeof value === "number" ? value : Number.parseFloat(value ?? "0");
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  const absoluteAmount = Math.abs(safeAmount);

  if (absoluteAmount >= 1_000_000) {
    const millions = safeAmount / 1_000_000;
    const truncatedMillions = Math.trunc(millions * 10) / 10;
    const formattedMillions = Number.isInteger(truncatedMillions)
      ? truncatedMillions.toFixed(0)
      : truncatedMillions.toFixed(1);
    return `UGX ${formattedMillions}m`;
  }

  return `UGX ${new Intl.NumberFormat("en-UG", {
    maximumFractionDigits: 2,
  }).format(safeAmount)}`;
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

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

function createEmptyCategoryForm(): CustomerCategoryPayload {
  return { name: "", description: "", is_active: true };
}

function buildCategoryForm(
  record: CustomerCategoryRecord | null,
): CustomerCategoryPayload {
  if (!record) return createEmptyCategoryForm();
  return {
    name: record.name,
    description: record.description,
    is_active: record.is_active,
  };
}

function createEmptyClientForm(): ClientPayload {
  return {
    category: null,
    name: "",
    contact_person: "",
    email: "",
    phone: "",
    address: "",
    credit_limit: "0.00",
    balance: "0.00",
    is_active: true,
  };
}

function buildClientForm(record: ClientRecord | null): ClientPayload {
  if (!record) return createEmptyClientForm();
  return {
    category: record.category,
    name: record.name,
    contact_person: record.contact_person,
    email: record.email,
    phone: record.phone,
    address: record.address,
    credit_limit: record.credit_limit,
    balance: record.balance,
    is_active: record.is_active,
  };
}

function createEmptySaleForm(): SalePayload {
  return {
    client: 0,
    seller: null,
    sale_date: today(),
    status: "draft",
    payment_method: "cash",
  };
}

function buildSaleForm(record: SaleRecord | null): SalePayload {
  if (!record) return createEmptySaleForm();
  return {
    client: record.client,
    seller: record.seller,
    sale_date: record.sale_date,
    status: record.status,
    payment_method: record.payment_method,
  };
}

function createEmptyItemForm(): SaleItemPayload {
  return {
    sale: 0,
    product: null,
    product_name: "",
    quantity: "",
    unit_price: "",
  };
}

function buildItemForm(record: SaleItemRecord | null): SaleItemPayload {
  if (!record) return createEmptyItemForm();
  return {
    sale: record.sale,
    product: record.product,
    product_name: record.product_name,
    quantity: record.quantity,
    unit_price: record.unit_price,
  };
}

function createEmptyPaymentForm(): PaymentPayload {
  return {
    sale: 0,
    amount: "",
    payment_method: "cash",
    reference: "",
    received_by: null,
    payment_date: today(),
  };
}

function buildPaymentForm(record: PaymentRecord | null): PaymentPayload {
  if (!record) return createEmptyPaymentForm();
  return {
    sale: record.sale,
    amount: record.amount,
    payment_method: record.payment_method,
    reference: record.reference,
    received_by: record.received_by,
    payment_date: record.payment_date,
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

export function SalesPage() {
  const [activeTab, setActiveTab] = useState<SalesTab>("sales");
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [categories, setCategories] = useState<CustomerCategoryRecord[]>([]);
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [items, setItems] = useState<SaleItemRecord[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [products, setProducts] = useState<FinishedProductRecord[]>([]);
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [selectedSaleId, setSelectedSaleId] = useState<number | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [selectedPaymentId, setSelectedPaymentId] = useState<number | null>(null);

  const [categoryForm, setCategoryForm] = useState<CustomerCategoryPayload>(
    createEmptyCategoryForm(),
  );
  const [clientForm, setClientForm] = useState<ClientPayload>(
    createEmptyClientForm(),
  );
  const [saleForm, setSaleForm] = useState<SalePayload>(createEmptySaleForm());
  const [itemForm, setItemForm] = useState<SaleItemPayload>(
    createEmptyItemForm(),
  );
  const [paymentForm, setPaymentForm] = useState<PaymentPayload>(
    createEmptyPaymentForm(),
  );

  const salesEmployees = useMemo(
    () => employees.filter((employee) => employee.work_role === "sales"),
    [employees],
  );
  const totalSalesAmount = useMemo(
    () =>
      sales.reduce(
        (total, sale) => total + Number.parseFloat(sale.total_amount || "0"),
        0,
      ),
    [sales],
  );

  async function loadData() {
    try {
      setLoading(true);
      setPageError(null);
      const [
        categoryRows,
        clientRows,
        saleRows,
        itemRows,
        paymentRows,
        productRows,
        employeeRows,
      ] = await Promise.all([
        fetchCustomerCategories(),
        fetchClients(),
        fetchSales(),
        fetchSaleItems(),
        fetchPayments(),
        fetchProducts(),
        fetchEmployees(),
      ]);
      setCategories(categoryRows);
      setClients(clientRows);
      setSales(saleRows);
      setItems(itemRows);
      setPayments(paymentRows);
      setProducts(productRows);
      setEmployees(employeeRows);
    } catch (error) {
      setPageError(getErrorMessage(error, "Unable to load sales data."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  async function submitCategory(event: FormEvent) {
    event.preventDefault();
    setPending("category");
    setFormError(null);
    try {
      if (selectedCategoryId) {
        await updateCustomerCategory(selectedCategoryId, categoryForm);
      } else {
        await createCustomerCategory(categoryForm);
      }
      setCategoryForm(createEmptyCategoryForm());
      await loadData();
      setActiveModal(null);
    } catch (error) {
      setFormError(getErrorMessage(error, "Unable to create category."));
    } finally {
      setPending(null);
    }
  }

  async function submitClient(event: FormEvent) {
    event.preventDefault();
    setPending("client");
    setFormError(null);
    try {
      if (selectedClientId) {
        await updateClient(selectedClientId, clientForm);
      } else {
        await createClient(clientForm);
      }
      setClientForm(createEmptyClientForm());
      await loadData();
      setActiveModal(null);
    } catch (error) {
      setFormError(getErrorMessage(error, "Unable to create client."));
    } finally {
      setPending(null);
    }
  }

  async function submitSale(event: FormEvent) {
    event.preventDefault();
    setPending("sale");
    setFormError(null);
    try {
      if (selectedSaleId) {
        await updateSale(selectedSaleId, saleForm);
      } else {
        await createSale(saleForm);
      }
      setSaleForm(createEmptySaleForm());
      await loadData();
      setActiveModal(null);
    } catch (error) {
      setFormError(getErrorMessage(error, "Unable to create sale."));
    } finally {
      setPending(null);
    }
  }

  async function submitSaleItem(event: FormEvent) {
    event.preventDefault();
    setPending("item");
    setFormError(null);
    try {
      const payload = {
        ...itemForm,
        unit_price: itemForm.unit_price || undefined,
      };
      if (selectedItemId) {
        await updateSaleItem(selectedItemId, payload);
      } else {
        await createSaleItem(payload);
      }
      setItemForm(createEmptyItemForm());
      await loadData();
      setActiveModal(null);
    } catch (error) {
      setFormError(getErrorMessage(error, "Unable to create sale item."));
    } finally {
      setPending(null);
    }
  }

  async function submitPayment(event: FormEvent) {
    event.preventDefault();
    setPending("payment");
    setFormError(null);
    try {
      if (selectedPaymentId) {
        await updatePayment(selectedPaymentId, paymentForm);
      } else {
        await createPayment(paymentForm);
      }
      setPaymentForm(createEmptyPaymentForm());
      await loadData();
      setActiveModal(null);
    } catch (error) {
      setFormError(getErrorMessage(error, "Unable to create payment."));
    } finally {
      setPending(null);
    }
  }

  function selectedProductPrice(productId: number | null) {
    const product = products.find((row) => row.id === productId);
    return product?.unit_price ?? "";
  }

  function closeModal() {
    setActiveModal(null);
    setFormError(null);
  }

  function openCreateModal(modal: Exclude<ActiveModal, null>) {
    setFormError(null);
    if (modal === "category") {
      setSelectedCategoryId(null);
      setCategoryForm(createEmptyCategoryForm());
    }
    if (modal === "client") {
      setSelectedClientId(null);
      setClientForm(createEmptyClientForm());
    }
    if (modal === "sale") {
      setSelectedSaleId(null);
      setSaleForm(createEmptySaleForm());
    }
    if (modal === "item") {
      setSelectedItemId(null);
      setItemForm(createEmptyItemForm());
    }
    if (modal === "payment") {
      setSelectedPaymentId(null);
      setPaymentForm(createEmptyPaymentForm());
    }
    setActiveModal(modal);
  }

  function openEditClient(record: ClientRecord) {
    setSelectedClientId(record.id);
    setClientForm(buildClientForm(record));
    setActiveModal("client");
  }

  function openEditCategory(record: CustomerCategoryRecord) {
    setSelectedCategoryId(record.id);
    setCategoryForm(buildCategoryForm(record));
    setActiveModal("category");
  }

  function openEditSale(record: SaleRecord) {
    setSelectedSaleId(record.id);
    setSaleForm(buildSaleForm(record));
    setActiveModal("sale");
  }

  function openEditItem(record: SaleItemRecord) {
    setSelectedItemId(record.id);
    setItemForm(buildItemForm(record));
    setActiveModal("item");
  }

  function openEditPayment(record: PaymentRecord) {
    setSelectedPaymentId(record.id);
    setPaymentForm(buildPaymentForm(record));
    setActiveModal("payment");
  }

  const activeFlowItem =
    salesMilestoneFlow.find((item) => item.id === activeTab) ??
    salesMilestoneFlow[0];

  function renderActiveList() {
    if (loading) {
      return (
        <section className="panel flex min-h-[320px] items-center justify-center p-8">
          <div className="inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-600 shadow-sm">
            <LoaderCircle className="h-4 w-4 animate-spin" />
            Loading sales records...
          </div>
        </section>
      );
    }

    if (activeTab === "items") {
      return (
        <section className="panel p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="section-label">Sale Items</p>
              <h2 className="mt-1 text-2xl font-semibold text-slate-900">
                Product lines sold
              </h2>
            </div>
            <button
              type="button"
              onClick={() => openCreateModal("item")}
              className={iconButtonClassName}
              aria-label="Add sale item"
              title="Add sale item"
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
                      {item.sale_number}
                    </p>
                    <p className="mt-3 text-sm text-slate-600">
                      Quantity: {item.quantity}
                    </p>
                    <p className="mt-2 text-sm text-slate-600">
                      Unit price: {formatMoney(item.unit_price)}
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
                title="No sale items yet"
                description="Add product lines after creating a sale."
                className={`${recordCardClassName} justify-center`}
              />
            )}
          </div>
        </section>
      );
    }

    if (activeTab === "payments") {
      return (
        <section className="panel p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="section-label">Payments</p>
              <h2 className="mt-1 text-2xl font-semibold text-slate-900">
                Receipts against sales
              </h2>
            </div>
            <button
              type="button"
              onClick={() => openCreateModal("payment")}
              className={iconButtonClassName}
              aria-label="Add payment"
              title="Add payment"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <div className="scrollbar-hidden mt-5 flex gap-3 overflow-x-auto pb-2">
            {payments.length ? (
              payments.map((payment) => (
                <div key={payment.id} className={recordCardClassName}>
                  <div className="scrollbar-hidden min-h-0 flex-1 overflow-y-auto pr-2">
                    <p className="font-semibold text-slate-900">
                      {payment.sale_number}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {formatDate(payment.payment_date)}
                    </p>
                    <p className="mt-3 text-sm font-semibold text-slate-900">
                      {formatMoney(payment.amount)}
                    </p>
                    <p className="mt-2 text-sm text-slate-600">
                      Method: {titleCase(payment.payment_method)}
                    </p>
                    <p className="mt-2 text-sm text-slate-600">
                      Ref: {payment.reference || "Not recorded"}
                    </p>
                    <p className="mt-2 text-sm text-slate-600">
                      Received by: {payment.received_by_name || "Unassigned"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openEditPayment(payment)}
                    className={recordEditButtonClassName}
                    aria-label={`Edit ${payment.sale_number} payment`}
                    title={`Edit ${payment.sale_number} payment`}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                </div>
              ))
            ) : (
              <EmptyState
                title="No payments yet"
                description="Record a payment after the sale exists."
                className={`${recordCardClassName} justify-center`}
              />
            )}
          </div>
        </section>
      );
    }

    if (activeTab === "categories") {
      return (
        <section className="panel p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="section-label">Client Categories</p>
              <h2 className="mt-1 text-2xl font-semibold text-slate-900">
                Customer grouping
              </h2>
            </div>
            <button
              type="button"
              onClick={() => openCreateModal("category")}
              className={iconButtonClassName}
              aria-label="Add client category"
              title="Add client category"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <div className="scrollbar-hidden mt-5 flex gap-3 overflow-x-auto pb-2">
            {categories.length ? (
              categories.map((category) => (
                <div key={category.id} className={recordCardClassName}>
                  <div className="scrollbar-hidden min-h-0 flex-1 overflow-y-auto pr-14">
                    <p className="font-semibold text-slate-900">
                      {category.name}
                    </p>
                    <p className="mt-3 text-sm text-slate-600">
                      {category.description || "No description"}
                    </p>
                    <p className="mt-3 text-sm text-slate-500">
                      {category.is_active ? "Active" : "Inactive"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openEditCategory(category)}
                    className={recordEditButtonClassName}
                    aria-label={`Edit ${category.name}`}
                    title={`Edit ${category.name}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                </div>
              ))
            ) : (
              <EmptyState
                title="No client categories yet"
                description="Create categories before assigning them to clients."
                className={`${recordCardClassName} justify-center`}
              />
            )}
          </div>
        </section>
      );
    }

    if (activeTab === "clients") {
      return (
        <section className="panel p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="section-label">Clients</p>
              <h2 className="mt-1 text-2xl font-semibold text-slate-900">
                Sales customer list
              </h2>
            </div>
            <button
              type="button"
              onClick={() => openCreateModal("client")}
              className={iconButtonClassName}
              aria-label="Add client"
              title="Add client"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <div className="scrollbar-hidden mt-5 flex gap-3 overflow-x-auto pb-2">
            {clients.length ? (
              clients.map((client) => (
                <div key={client.id} className={recordCardClassName}>
                  <div className="scrollbar-hidden min-h-0 flex-1 overflow-y-auto pr-2">
                    <p className="font-semibold text-slate-900">{client.name}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {client.category_name || "Uncategorised"}
                    </p>
                    <p className="mt-3 text-sm text-slate-600">
                      Contact: {client.contact_person || "Not recorded"}
                    </p>
                    <p className="mt-2 text-sm text-slate-600">
                      Phone: {client.phone || "Not recorded"}
                    </p>
                    <p className="mt-2 text-sm text-slate-600">
                      Credit limit: {formatMoney(client.credit_limit)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openEditClient(client)}
                    className={recordEditButtonClassName}
                    aria-label={`Edit ${client.name}`}
                    title={`Edit ${client.name}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                </div>
              ))
            ) : (
              <EmptyState
                title="No clients yet"
                description="Create the customer record before creating a sale."
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
            <p className="section-label">Sales</p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-900">
              Sale records
            </h2>
          </div>
          <button
            type="button"
            onClick={() => openCreateModal("sale")}
            className={iconButtonClassName}
            aria-label="Add sale"
            title="Add sale"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <div className="scrollbar-hidden mt-5 flex gap-3 overflow-x-auto pb-2">
          {sales.length ? (
            sales.map((sale) => (
              <div key={sale.id} className={recordCardClassName}>
                <div className="scrollbar-hidden min-h-0 flex-1 overflow-y-auto pr-2">
                  <p className="font-semibold text-sky-700">{sale.sale_number}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {sale.client_name}
                  </p>
                  <p className="mt-3 text-sm text-slate-600">
                    Date: {formatDate(sale.sale_date)}
                  </p>
                  <p className="mt-2 text-sm text-slate-600">
                    Seller: {sale.seller_name || "Unassigned"}
                  </p>
                  <p className="mt-2 text-sm text-slate-600">
                    Status: {titleCase(sale.status)}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {formatMoney(sale.total_amount)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => openEditSale(sale)}
                  className={recordEditButtonClassName}
                  aria-label={`Edit ${sale.sale_number}`}
                  title={`Edit ${sale.sale_number}`}
                >
                  <Pencil className="h-4 w-4" />
                </button>
              </div>
            ))
          ) : (
            <EmptyState
              title="No sales yet"
              description="Create a sale once the client is available."
              className={`${recordCardClassName} justify-center`}
            />
          )}
        </div>
      </section>
    );
  }

  function renderActiveForm() {
    if (activeModal === "item") {
      return (
        <FormPanel label="Sale Items" title="Item form">
          <form onSubmit={submitSaleItem} className="grid gap-4">
            <PickerField
              value={itemForm.sale ? String(itemForm.sale) : ""}
              options={[
                { label: "Select sale", value: "" },
                ...sales.map((sale) => ({
                  label: `${sale.sale_number} - ${sale.client_name}`,
                  value: String(sale.id),
                  searchText: `${sale.sale_number} ${sale.client_name}`,
                })),
              ]}
              searchable
              searchPlaceholder="Search sales"
              onChange={(value) =>
                setItemForm((current) => ({
                  ...current,
                  sale: value ? Number(value) : 0,
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
                const productId = value ? Number(value) : null;
                setItemForm((current) => ({
                  ...current,
                  product: productId,
                  unit_price: selectedProductPrice(productId) || current.unit_price,
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
                placeholder="Quantity"
                value={itemForm.quantity}
                onChange={(event) =>
                  setItemForm((current) => ({
                    ...current,
                    quantity: event.target.value,
                  }))
                }
                required
              />
              <input
                type="number"
                min="0"
                step="0.01"
                className={fieldClassName}
                placeholder="Unit price"
                value={itemForm.unit_price ?? ""}
                onChange={(event) =>
                  setItemForm((current) => ({
                    ...current,
                    unit_price: event.target.value,
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
                <Plus className="h-4 w-4" />
              )}
              Add item
            </button>
          </form>
        </FormPanel>
      );
    }

    if (activeModal === "payment") {
      return (
        <FormPanel label="Payments" title="Payment form">
          <form onSubmit={submitPayment} className="grid gap-4">
            <PickerField
              value={paymentForm.sale ? String(paymentForm.sale) : ""}
              options={[
                { label: "Select sale", value: "" },
                ...sales.map((sale) => ({
                  label: `${sale.sale_number} - ${sale.client_name}`,
                  value: String(sale.id),
                  searchText: `${sale.sale_number} ${sale.client_name}`,
                })),
              ]}
              searchable
              searchPlaceholder="Search sales"
              onChange={(value) =>
                setPaymentForm((current) => ({
                  ...current,
                  sale: value ? Number(value) : 0,
                }))
              }
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <input
                className={fieldClassName}
                placeholder="Amount"
                value={paymentForm.amount}
                onChange={(event) =>
                  setPaymentForm((current) => ({
                    ...current,
                    amount: event.target.value,
                  }))
                }
                required
              />
              <PickerField
                value={paymentForm.payment_method}
                options={paymentMethods.map((method) => ({
                  label: titleCase(method),
                  value: method,
                }))}
                onChange={(value) =>
                  setPaymentForm((current) => ({
                    ...current,
                    payment_method: value as SalesPaymentMethod,
                  }))
                }
              />
            </div>
            <input
              className={fieldClassName}
              placeholder="Reference"
              value={paymentForm.reference}
              onChange={(event) =>
                setPaymentForm((current) => ({
                  ...current,
                  reference: event.target.value,
                }))
              }
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <input
                type="date"
                className={fieldClassName}
                value={paymentForm.payment_date}
                onChange={(event) =>
                  setPaymentForm((current) => ({
                    ...current,
                    payment_date: event.target.value,
                  }))
                }
                required
              />
              <PickerField
                value={paymentForm.received_by ? String(paymentForm.received_by) : ""}
                options={[
                  { label: "No receiver", value: "" },
                  ...employees.map((employee) => ({
                    label: employee.full_name,
                    value: String(employee.id),
                    searchText: `${employee.full_name} ${employee.employee_code}`,
                  })),
                ]}
                searchable
                searchPlaceholder="Search employees"
                onChange={(value) =>
                  setPaymentForm((current) => ({
                    ...current,
                    received_by: value ? Number(value) : null,
                  }))
                }
              />
            </div>
            <button
              type="submit"
              className={primaryButtonClassName}
              disabled={pending === "payment"}
            >
              {pending === "payment" ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              Record payment
            </button>
          </form>
        </FormPanel>
      );
    }

    if (activeModal === "client") {
      return (
        <FormPanel label="Clients" title="Client form">
          <form onSubmit={submitClient} className="grid gap-4">
            <input
              className={fieldClassName}
              placeholder="Client name"
              value={clientForm.name}
              onChange={(event) =>
                setClientForm((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              required
            />
            <PickerField
              value={clientForm.category ? String(clientForm.category) : ""}
              options={[
                { label: "No category", value: "" },
                ...categories.map((category) => ({
                  label: category.name,
                  value: String(category.id),
                  searchText: category.name,
                })),
              ]}
              searchable
              searchPlaceholder="Search categories"
              onChange={(value) =>
                setClientForm((current) => ({
                  ...current,
                  category: value ? Number(value) : null,
                }))
              }
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <input
                className={fieldClassName}
                placeholder="Contact person"
                value={clientForm.contact_person}
                onChange={(event) =>
                  setClientForm((current) => ({
                    ...current,
                    contact_person: event.target.value,
                  }))
                }
              />
              <input
                className={fieldClassName}
                placeholder="Phone"
                value={clientForm.phone}
                onChange={(event) =>
                  setClientForm((current) => ({
                    ...current,
                    phone: event.target.value,
                  }))
                }
              />
            </div>
            <input
              className={fieldClassName}
              placeholder="Email"
              type="email"
              value={clientForm.email}
              onChange={(event) =>
                setClientForm((current) => ({
                  ...current,
                  email: event.target.value,
                }))
              }
            />
            <input
              className={fieldClassName}
              placeholder="Credit limit"
              value={clientForm.credit_limit}
              onChange={(event) =>
                setClientForm((current) => ({
                  ...current,
                  credit_limit: event.target.value,
                }))
              }
            />
            <textarea
              className={`${fieldClassName} min-h-24`}
              placeholder="Address"
              value={clientForm.address}
              onChange={(event) =>
                setClientForm((current) => ({
                  ...current,
                  address: event.target.value,
                }))
              }
            />
            <button
              type="submit"
              className={primaryButtonClassName}
              disabled={pending === "client"}
            >
              {pending === "client" ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Create client
            </button>
          </form>
        </FormPanel>
      );
    }

    if (activeModal === "category") {
      return (
        <FormPanel label="Client Categories" title="Category form">
          <form onSubmit={submitCategory} className="grid gap-4">
            <input
              className={fieldClassName}
              placeholder="Category name"
              value={categoryForm.name}
              onChange={(event) =>
                setCategoryForm((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              required
            />
            <input
              className={fieldClassName}
              placeholder="Description"
              value={categoryForm.description}
              onChange={(event) =>
                setCategoryForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
            />
            <button
              type="submit"
              className={primaryButtonClassName}
              disabled={pending === "category"}
            >
              {pending === "category" ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Add category
            </button>
          </form>
        </FormPanel>
      );
    }

    return (
      <FormPanel label="Sales" title="Sale form">
        <form onSubmit={submitSale} className="grid gap-4">
          <PickerField
            value={saleForm.client ? String(saleForm.client) : ""}
            options={[
              { label: "Select client", value: "" },
              ...clients.map((client) => ({
                label: client.name,
                value: String(client.id),
                searchText: `${client.name} ${client.contact_person} ${client.phone}`,
              })),
            ]}
            searchable
            searchPlaceholder="Search clients"
            onChange={(value) =>
              setSaleForm((current) => ({
                ...current,
                client: value ? Number(value) : 0,
              }))
            }
          />
          <PickerField
            value={saleForm.seller ? String(saleForm.seller) : ""}
            options={[
              { label: "Unassigned seller", value: "" },
              ...salesEmployees.map((employee) => ({
                label: `${employee.full_name} (${employee.employee_code})`,
                value: String(employee.id),
                searchText: `${employee.full_name} ${employee.employee_code}`,
              })),
            ]}
            searchable
            searchPlaceholder="Search sellers"
            onChange={(value) =>
              setSaleForm((current) => ({
                ...current,
                seller: value ? Number(value) : null,
              }))
            }
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <input
              type="date"
              className={fieldClassName}
              value={saleForm.sale_date}
              onChange={(event) =>
                setSaleForm((current) => ({
                  ...current,
                  sale_date: event.target.value,
                }))
              }
              required
            />
            <PickerField
              value={saleForm.status}
              options={saleStatuses.map((status) => ({
                label: titleCase(status),
                value: status,
              }))}
              onChange={(value) =>
                setSaleForm((current) => ({
                  ...current,
                  status: value as SaleStatus,
                }))
              }
            />
          </div>
          <PickerField
            value={saleForm.payment_method}
            options={paymentMethods.map((method) => ({
              label: titleCase(method),
              value: method,
            }))}
            onChange={(value) =>
              setSaleForm((current) => ({
                ...current,
                payment_method: value as SalesPaymentMethod,
              }))
            }
          />
          <button
            type="submit"
            className={primaryButtonClassName}
            disabled={pending === "sale"}
          >
            {pending === "sale" ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Create sale
          </button>
        </form>
      </FormPanel>
    );
  }

  function activeModalTitle() {
    if (activeModal === "item") return "Add sale item";
    if (activeModal === "payment") return "Record payment";
    if (activeModal === "client") return "Add client";
    if (activeModal === "category") return "Add category";
    return "Add sale";
  }

  return (
    <div className="module-page">
      <section className="rounded-[32px] border border-white/70 bg-[radial-gradient(circle_at_top_left,#ffffff,rgba(224,242,254,0.92)_52%,rgba(240,249,255,0.95))] py-6 pl-6 pr-0 shadow-[0_25px_80px_rgba(148,163,184,0.14)]">
        <div className="flex flex-col gap-6 pr-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/75 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-sky-700">
              Sales
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
                Sales workspace
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-slate-600">
                Manage clients, sale records, sold items, and payments. Orders
                and delivery movement stay in the Orders module.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-4">
            <div className="hero-metric-card">
              <p className="hero-metric-label">Clients</p>
              <p className="hero-metric-value">{clients.length}</p>
            </div>
            <div className="hero-metric-card">
              <p className="hero-metric-label">Sales</p>
              <p className="hero-metric-value">{sales.length}</p>
            </div>
            <div className="hero-metric-card">
              <p className="hero-metric-label">Payments</p>
              <p className="hero-metric-value">{payments.length}</p>
            </div>
            <div className="hero-metric-card">
              <p className="hero-metric-label">Value</p>
              <p className="hero-metric-value">{formatMoney(totalSalesAmount)}</p>
            </div>
          </div>
        </div>
      </section>
      <ModuleTabs tabs={tabs} activeTab={activeTab} onChange={(tab) => setActiveTab(tab as SalesTab)} />

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
              <span className="text-slate-500">
                {activeTab === "sales"
                  ? sales.length
                  : activeTab === "items"
                    ? items.length
                    : activeTab === "payments"
                      ? payments.length
                      : activeTab === "clients"
                        ? clients.length
                        : categories.length}{" "}
                records
              </span>
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
