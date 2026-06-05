import { apiRequest } from "./auth";
import type {
  ClientPayload,
  ClientRecord,
  CustomerCategoryPayload,
  CustomerCategoryRecord,
  PaginatedSalesLogResponse,
  PaymentPayload,
  PaymentRecord,
  SaleItemPayload,
  SaleItemRecord,
  SalePayload,
  SaleRecord,
  SalesLogDetail,
  SalesLogSummary,
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
const sales = createCrud<SaleRecord, SalePayload>("sales");
const saleItems = createCrud<SaleItemRecord, SaleItemPayload>("sale-items");
const payments = createCrud<PaymentRecord, PaymentPayload>("payments");

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

export const fetchSales = sales.list;
export const fetchSale = sales.detail;
export const createSale = sales.create;
export const updateSale = sales.update;
export const deleteSale = sales.remove;

export const fetchSaleItems = saleItems.list;
export const fetchSaleItem = saleItems.detail;
export const createSaleItem = saleItems.create;
export const updateSaleItem = saleItems.update;
export const deleteSaleItem = saleItems.remove;

export const fetchPayments = payments.list;
export const fetchPayment = payments.detail;
export const createPayment = payments.create;
export const updatePayment = payments.update;
export const deletePayment = payments.remove;

// Deprecated compatibility export for pages that have not yet been moved.
export async function fetchSalesOrders() {
  const records = await fetchSales();
  return records.map(
    (sale): SalesOrderRecord => ({
      id: sale.id,
      created_at: sale.created_at,
      updated_at: sale.updated_at,
      client: sale.client,
      client_name: sale.client_name,
      assigned_seller: sale.seller,
      assigned_seller_name: sale.seller_name,
      assigned_seller_code: sale.seller_code,
      order_number: sale.sale_number,
      order_date: sale.sale_date,
      expected_delivery_date: null,
      status:
        sale.status === "completed"
          ? "completed"
          : sale.status === "cancelled"
            ? "cancelled"
            : "draft",
      payment_method: sale.payment_method,
      total_amount: sale.total_amount,
      notes: "",
    }),
  );
}

type FetchSalesLogParams = {
  page?: number;
  pageSize?: 5 | 6 | 10;
  search?: string;
  range?: "today" | "7days" | "month";
  paginate?: boolean;
};

export async function fetchSalesLog(params: FetchSalesLogParams = {}) {
  const query = new URLSearchParams();

  if (params.page && params.page > 0) {
    query.set("page", String(params.page));
  }

  if (params.pageSize && [5, 6, 10].includes(params.pageSize)) {
    query.set("page_size", String(params.pageSize));
  }

  if (params.search?.trim()) {
    query.set("search", params.search.trim());
  }

  if (params.range) {
    query.set("range", params.range);
  }

  if (params.paginate === false) {
    query.set("paginate", "false");
  }

  const path = query.size
    ? `${SALES_BASE_PATH}/sales-log/?${query.toString()}`
    : `${SALES_BASE_PATH}/sales-log/`;

  return apiRequest<PaginatedSalesLogResponse | SalesLogDetail["entry"][]>(path);
}

export async function fetchSalesLogSummary() {
  return apiRequest<SalesLogSummary>(`${SALES_BASE_PATH}/sales-log/summary/`);
}

export async function fetchSalesLogDetail(id: number) {
  return apiRequest<SalesLogDetail>(`${SALES_BASE_PATH}/sales-log/${id}/`);
}
