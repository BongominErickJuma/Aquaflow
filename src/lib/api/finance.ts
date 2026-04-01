import { apiRequest } from "./auth";
import type {
  CapitalPayload,
  CapitalRecord,
  ExpensePayload,
  ExpenseRecord,
  InsurancePayload,
  InsuranceRecord,
  InvoicePayload,
  InvoiceRecord,
  OperatingCostPayload,
  OperatingCostRecord,
  ProfitabilitySnapshotPayload,
  ProfitabilitySnapshotRecord,
  ReceiptPayload,
  ReceiptRecord,
} from "../../types/finance";

const FINANCE_BASE_PATH = "/api/finance";

function resourcePath(resource: string) {
  return `${FINANCE_BASE_PATH}/${resource}/`;
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

const capitalRecords = createCrud<CapitalRecord, CapitalPayload>(
  "capital-records",
);
const operatingCosts = createCrud<OperatingCostRecord, OperatingCostPayload>(
  "operating-costs",
);
const expenses = createCrud<ExpenseRecord, ExpensePayload>("expenses");
const invoices = createCrud<InvoiceRecord, InvoicePayload>("invoices");
const receipts = createCrud<ReceiptRecord, ReceiptPayload>("receipts");
const insuranceRecords = createCrud<InsuranceRecord, InsurancePayload>(
  "insurance-records",
);
const profitabilitySnapshots = createCrud<
  ProfitabilitySnapshotRecord,
  ProfitabilitySnapshotPayload
>("profitability-snapshots");

export const fetchCapitalRecords = capitalRecords.list;
export const fetchCapitalRecord = capitalRecords.detail;
export const createCapitalRecord = capitalRecords.create;
export const updateCapitalRecord = capitalRecords.update;
export const deleteCapitalRecord = capitalRecords.remove;

export const fetchOperatingCosts = operatingCosts.list;
export const fetchOperatingCost = operatingCosts.detail;
export const createOperatingCost = operatingCosts.create;
export const updateOperatingCost = operatingCosts.update;
export const deleteOperatingCost = operatingCosts.remove;

export const fetchExpenses = expenses.list;
export const fetchExpense = expenses.detail;
export const createExpense = expenses.create;
export const updateExpense = expenses.update;
export const deleteExpense = expenses.remove;

export const fetchInvoices = invoices.list;
export const fetchInvoice = invoices.detail;
export const createInvoice = invoices.create;
export const updateInvoice = invoices.update;
export const deleteInvoice = invoices.remove;

export const fetchReceipts = receipts.list;
export const fetchReceipt = receipts.detail;
export const createReceipt = receipts.create;
export const updateReceipt = receipts.update;
export const deleteReceipt = receipts.remove;

export const fetchInsuranceRecords = insuranceRecords.list;
export const fetchInsuranceRecord = insuranceRecords.detail;
export const createInsuranceRecord = insuranceRecords.create;
export const updateInsuranceRecord = insuranceRecords.update;
export const deleteInsuranceRecord = insuranceRecords.remove;

export const fetchProfitabilitySnapshots = profitabilitySnapshots.list;
export const fetchProfitabilitySnapshot = profitabilitySnapshots.detail;
export const createProfitabilitySnapshot = profitabilitySnapshots.create;
export const updateProfitabilitySnapshot = profitabilitySnapshots.update;
export const deleteProfitabilitySnapshot = profitabilitySnapshots.remove;
