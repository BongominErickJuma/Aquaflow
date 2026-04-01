export type ProductionTimestampFields = {
  id: number;
  created_at: string;
  updated_at: string;
};

export type MachineStatus =
  | "operational"
  | "maintenance"
  | "downtime"
  | "inactive";

export type MachineRecord = ProductionTimestampFields & {
  name: string;
  code: string;
  machine_type: string;
  manufacturer: string;
  model_number: string;
  serial_number: string | null;
  installation_date: string | null;
  location_name: string;
  status: MachineStatus;
  notes: string;
};

export type MachinePayload = Omit<
  MachineRecord,
  "id" | "created_at" | "updated_at"
>;

export type MachineUsageLogRecord = ProductionTimestampFields & {
  machine: number;
  machine_name: string;
  usage_date: string;
  hours_used: string;
  operator_name: string;
  purpose: string;
  notes: string;
};

export type MachineUsageLogPayload = Omit<
  MachineUsageLogRecord,
  "id" | "created_at" | "updated_at" | "machine_name"
>;

export type MaintenanceFrequency =
  | "daily"
  | "weekly"
  | "monthly"
  | "quarterly"
  | "yearly"
  | "custom";

export type MaintenanceScheduleRecord = ProductionTimestampFields & {
  machine: number;
  machine_name: string;
  title: string;
  maintenance_type: string;
  frequency: MaintenanceFrequency;
  interval_days: number | null;
  next_due_date: string;
  last_completed_date: string | null;
  is_active: boolean;
  notes: string;
};

export type MaintenanceSchedulePayload = Omit<
  MaintenanceScheduleRecord,
  "id" | "created_at" | "updated_at" | "machine_name"
>;

export type MaintenanceLogStatus = "completed" | "partial" | "cancelled";

export type MaintenanceLogRecord = ProductionTimestampFields & {
  machine: number;
  machine_name: string;
  schedule: number | null;
  schedule_title: string;
  maintenance_date: string;
  maintenance_type: string;
  status: MaintenanceLogStatus;
  performed_by_name: string;
  cost: string;
  downtime_hours: string;
  notes: string;
};

export type MaintenanceLogPayload = Omit<
  MaintenanceLogRecord,
  "id" | "created_at" | "updated_at" | "machine_name" | "schedule_title"
>;

export type DowntimeSeverity = "low" | "medium" | "high" | "critical";
export type DowntimeStatus = "open" | "resolved";

export type DowntimeAlertRecord = ProductionTimestampFields & {
  machine: number;
  machine_name: string;
  title: string;
  severity: DowntimeSeverity;
  status: DowntimeStatus;
  start_time: string;
  end_time: string | null;
  downtime_hours: number | null;
  cause: string;
  resolution_notes: string;
};

export type DowntimeAlertPayload = Omit<
  DowntimeAlertRecord,
  "id" | "created_at" | "updated_at" | "machine_name" | "downtime_hours"
>;

export type UtilityType = "electricity" | "water" | "diesel" | "fuel" | "other";

export type UtilityConsumptionLogRecord = ProductionTimestampFields & {
  machine: number | null;
  machine_name: string;
  utility_type: UtilityType;
  log_date: string;
  quantity: string;
  unit_name: string;
  cost: string;
  notes: string;
};

export type UtilityConsumptionLogPayload = Omit<
  UtilityConsumptionLogRecord,
  "id" | "created_at" | "updated_at" | "machine_name"
>;
