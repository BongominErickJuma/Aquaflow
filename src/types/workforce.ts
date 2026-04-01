export type WorkforceTimestampFields = {
  id: number;
  created_at: string;
  updated_at: string;
};

export type WorkforcePaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export type EmployeeStatus = "active" | "inactive" | "terminated";

export type EmployeeRecord = WorkforceTimestampFields & {
  user: number | null;
  employee_code: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone_number: string;
  job_title: string;
  department: string;
  hire_date: string;
  status: EmployeeStatus;
  notes: string;
};

export type EmployeePayload = Omit<
  EmployeeRecord,
  "id" | "created_at" | "updated_at" | "full_name"
>;

export type ShiftRecord = WorkforceTimestampFields & {
  name: string;
  start_time: string;
  end_time: string;
  is_overnight: boolean;
  notes: string;
  is_active: boolean;
};

export type ShiftPayload = Omit<
  ShiftRecord,
  "id" | "created_at" | "updated_at"
>;

export type AttendanceStatus = "present" | "absent" | "late" | "off" | "leave";

export type AttendanceRecord = WorkforceTimestampFields & {
  employee: number;
  employee_name: string;
  shift: number | null;
  shift_name: string;
  attendance_date: string;
  status: AttendanceStatus;
  clock_in: string | null;
  clock_out: string | null;
  notes: string;
};

export type AttendancePayload = Omit<
  AttendanceRecord,
  "id" | "created_at" | "updated_at" | "employee_name" | "shift_name"
>;

export type PayrollStatus = "pending" | "paid" | "partial";

export type PayrollRecord = WorkforceTimestampFields & {
  employee: number;
  employee_name: string;
  pay_period_start: string;
  pay_period_end: string;
  basic_pay: string;
  bonuses: string;
  deductions: string;
  net_pay: string;
  payment_status: PayrollStatus;
  payment_date: string | null;
  notes: string;
};

export type PayrollPayload = Omit<
  PayrollRecord,
  "id" | "created_at" | "updated_at" | "employee_name" | "net_pay"
>;

export type TaskPriority = "low" | "medium" | "high";
export type TaskStatus = "pending" | "in_progress" | "completed" | "cancelled";

export type TaskRecord = WorkforceTimestampFields & {
  employee: number;
  employee_name: string;
  title: string;
  description: string;
  assigned_by: number | null;
  assigned_by_email: string;
  assigned_date: string;
  due_date: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  notes: string;
};

export type TaskPayload = Omit<
  TaskRecord,
  "id" | "created_at" | "updated_at" | "employee_name" | "assigned_by_email"
>;

export type PerformanceRecord = WorkforceTimestampFields & {
  employee: number;
  employee_name: string;
  review_date: string;
  reviewer_name: string;
  score: string;
  strengths: string;
  improvement_areas: string;
  notes: string;
};

export type PerformancePayload = Omit<
  PerformanceRecord,
  "id" | "created_at" | "updated_at" | "employee_name"
>;
