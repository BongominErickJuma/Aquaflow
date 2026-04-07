import { apiRequest } from "./auth";
import type {
  AttendancePayload,
  AttendanceRecord,
  DepartmentPayload,
  DepartmentRecord,
  EmployeePayload,
  EmployeeRecord,
  PayrollPayload,
  PayrollRecord,
  PerformancePayload,
  PerformanceRecord,
  ShiftPayload,
  ShiftRecord,
  TaskPayload,
  TaskRecord,
  WorkforcePaginatedResponse,
} from "../../types/workforce";

const WORKFORCE_BASE_PATH = "/api/workforce";

function resourcePath(resource: string) {
  return `${WORKFORCE_BASE_PATH}/${resource}/`;
}

function detailPath(resource: string, id: number) {
  return `${resourcePath(resource)}${id}/`;
}

type FetchWorkforcePageParams = {
  page?: number;
  pageSize?: number;
};

function listPath(resource: string, params?: FetchWorkforcePageParams) {
  const query = new URLSearchParams();

  if (params?.page && params.page > 0) {
    query.set("page", String(params.page));
  }

  if (params?.pageSize && [5, 6, 10].includes(params.pageSize)) {
    query.set("page_size", String(params.pageSize));
  }

  return query.size
    ? `${resourcePath(resource)}?${query.toString()}`
    : resourcePath(resource);
}

function unpaginatedListPath(resource: string) {
  return `${resourcePath(resource)}?paginate=false`;
}

export async function fetchEmployeePage(params: FetchWorkforcePageParams = {}) {
  return apiRequest<WorkforcePaginatedResponse<EmployeeRecord>>(
    listPath("employees", params),
  );
}
export async function fetchDepartmentPage(params: FetchWorkforcePageParams = {}) {
  return apiRequest<WorkforcePaginatedResponse<DepartmentRecord>>(
    listPath("departments", params),
  );
}
export async function fetchDepartments() {
  return apiRequest<DepartmentRecord[]>(unpaginatedListPath("departments"));
}
export async function fetchDepartment(id: number) {
  return apiRequest<DepartmentRecord>(detailPath("departments", id));
}
export async function createDepartment(payload: DepartmentPayload) {
  return apiRequest<DepartmentRecord>(
    resourcePath("departments"),
    { method: "POST", body: JSON.stringify(payload) },
    { csrf: true },
  );
}
export async function updateDepartment(
  id: number,
  payload: Partial<DepartmentPayload>,
) {
  return apiRequest<DepartmentRecord>(
    detailPath("departments", id),
    { method: "PATCH", body: JSON.stringify(payload) },
    { csrf: true },
  );
}
export async function deleteDepartment(id: number) {
  return apiRequest<void>(
    detailPath("departments", id),
    { method: "DELETE" },
    { csrf: true },
  );
}
export async function fetchEmployees() {
  return apiRequest<EmployeeRecord[]>(unpaginatedListPath("employees"));
}
export async function fetchEmployee(id: number) {
  return apiRequest<EmployeeRecord>(detailPath("employees", id));
}
export async function createEmployee(payload: EmployeePayload) {
  return apiRequest<EmployeeRecord>(
    resourcePath("employees"),
    { method: "POST", body: JSON.stringify(payload) },
    { csrf: true },
  );
}
export async function updateEmployee(
  id: number,
  payload: Partial<EmployeePayload>,
) {
  return apiRequest<EmployeeRecord>(
    detailPath("employees", id),
    { method: "PATCH", body: JSON.stringify(payload) },
    { csrf: true },
  );
}
export async function deleteEmployee(id: number) {
  return apiRequest<void>(
    detailPath("employees", id),
    { method: "DELETE" },
    { csrf: true },
  );
}

export async function fetchShiftPage(params: FetchWorkforcePageParams = {}) {
  return apiRequest<WorkforcePaginatedResponse<ShiftRecord>>(
    listPath("shifts", params),
  );
}
export async function fetchShifts() {
  return apiRequest<ShiftRecord[]>(unpaginatedListPath("shifts"));
}
export async function fetchShift(id: number) {
  return apiRequest<ShiftRecord>(detailPath("shifts", id));
}
export async function createShift(payload: ShiftPayload) {
  return apiRequest<ShiftRecord>(
    resourcePath("shifts"),
    { method: "POST", body: JSON.stringify(payload) },
    { csrf: true },
  );
}
export async function updateShift(id: number, payload: Partial<ShiftPayload>) {
  return apiRequest<ShiftRecord>(
    detailPath("shifts", id),
    { method: "PATCH", body: JSON.stringify(payload) },
    { csrf: true },
  );
}
export async function deleteShift(id: number) {
  return apiRequest<void>(
    detailPath("shifts", id),
    { method: "DELETE" },
    { csrf: true },
  );
}

export async function fetchAttendancePage(
  params: FetchWorkforcePageParams = {},
) {
  return apiRequest<WorkforcePaginatedResponse<AttendanceRecord>>(
    listPath("attendance", params),
  );
}
export async function fetchAttendance() {
  return apiRequest<AttendanceRecord[]>(unpaginatedListPath("attendance"));
}
export async function fetchAttendanceRecord(id: number) {
  return apiRequest<AttendanceRecord>(detailPath("attendance", id));
}
export async function createAttendanceRecord(payload: AttendancePayload) {
  return apiRequest<AttendanceRecord>(
    resourcePath("attendance"),
    { method: "POST", body: JSON.stringify(payload) },
    { csrf: true },
  );
}
export async function updateAttendanceRecord(
  id: number,
  payload: Partial<AttendancePayload>,
) {
  return apiRequest<AttendanceRecord>(
    detailPath("attendance", id),
    { method: "PATCH", body: JSON.stringify(payload) },
    { csrf: true },
  );
}
export async function deleteAttendanceRecord(id: number) {
  return apiRequest<void>(
    detailPath("attendance", id),
    { method: "DELETE" },
    { csrf: true },
  );
}

export async function fetchPayrollPage(params: FetchWorkforcePageParams = {}) {
  return apiRequest<WorkforcePaginatedResponse<PayrollRecord>>(
    listPath("payroll", params),
  );
}
export async function fetchPayroll() {
  return apiRequest<PayrollRecord[]>(unpaginatedListPath("payroll"));
}
export async function fetchPayrollRecord(id: number) {
  return apiRequest<PayrollRecord>(detailPath("payroll", id));
}
export async function createPayrollRecord(payload: PayrollPayload) {
  return apiRequest<PayrollRecord>(
    resourcePath("payroll"),
    { method: "POST", body: JSON.stringify(payload) },
    { csrf: true },
  );
}
export async function updatePayrollRecord(
  id: number,
  payload: Partial<PayrollPayload>,
) {
  return apiRequest<PayrollRecord>(
    detailPath("payroll", id),
    { method: "PATCH", body: JSON.stringify(payload) },
    { csrf: true },
  );
}
export async function deletePayrollRecord(id: number) {
  return apiRequest<void>(
    detailPath("payroll", id),
    { method: "DELETE" },
    { csrf: true },
  );
}

export async function fetchTasks() {
  return apiRequest<TaskRecord[]>(unpaginatedListPath("tasks"));
}
export async function fetchTaskPage(params: FetchWorkforcePageParams = {}) {
  return apiRequest<WorkforcePaginatedResponse<TaskRecord>>(
    listPath("tasks", params),
  );
}
export async function fetchTask(id: number) {
  return apiRequest<TaskRecord>(detailPath("tasks", id));
}
export async function createTask(payload: TaskPayload) {
  return apiRequest<TaskRecord>(
    resourcePath("tasks"),
    { method: "POST", body: JSON.stringify(payload) },
    { csrf: true },
  );
}
export async function updateTask(id: number, payload: Partial<TaskPayload>) {
  return apiRequest<TaskRecord>(
    detailPath("tasks", id),
    { method: "PATCH", body: JSON.stringify(payload) },
    { csrf: true },
  );
}
export async function deleteTask(id: number) {
  return apiRequest<void>(
    detailPath("tasks", id),
    { method: "DELETE" },
    { csrf: true },
  );
}

export async function fetchPerformanceRecordPage(
  params: FetchWorkforcePageParams = {},
) {
  return apiRequest<WorkforcePaginatedResponse<PerformanceRecord>>(
    listPath("performance-records", params),
  );
}
export async function fetchPerformanceRecords() {
  return apiRequest<PerformanceRecord[]>(
    unpaginatedListPath("performance-records"),
  );
}
export async function fetchPerformanceRecord(id: number) {
  return apiRequest<PerformanceRecord>(detailPath("performance-records", id));
}
export async function createPerformanceRecord(payload: PerformancePayload) {
  return apiRequest<PerformanceRecord>(
    resourcePath("performance-records"),
    { method: "POST", body: JSON.stringify(payload) },
    { csrf: true },
  );
}
export async function updatePerformanceRecord(
  id: number,
  payload: Partial<PerformancePayload>,
) {
  return apiRequest<PerformanceRecord>(
    detailPath("performance-records", id),
    { method: "PATCH", body: JSON.stringify(payload) },
    { csrf: true },
  );
}
export async function deletePerformanceRecord(id: number) {
  return apiRequest<void>(
    detailPath("performance-records", id),
    { method: "DELETE" },
    { csrf: true },
  );
}
