export type ComplianceTimestampFields = {
  id: number;
  created_at: string;
  updated_at: string;
};

export type CheckStatus = "pass" | "fail" | "pending";

export type HygieneCheckRecord = ComplianceTimestampFields & {
  check_date: string;
  area: string;
  inspector_name: string;
  status: CheckStatus;
  corrective_action: string;
  notes: string;
};

export type HygieneCheckPayload = Omit<
  HygieneCheckRecord,
  "id" | "created_at" | "updated_at"
>;

export type WaterQualityTestRecord = ComplianceTimestampFields & {
  test_date: string;
  location: string;
  parameter_name: string;
  result_value: string;
  unit_name: string;
  standard_limit: string;
  status: CheckStatus;
  tested_by: string;
  notes: string;
};

export type WaterQualityTestPayload = Omit<
  WaterQualityTestRecord,
  "id" | "created_at" | "updated_at"
>;

export type SafetySeverity = "low" | "medium" | "high" | "critical";
export type SafetyStatus = "open" | "closed";

export type SafetyRecord = ComplianceTimestampFields & {
  record_date: string;
  incident_type: string;
  severity: SafetySeverity;
  status: SafetyStatus;
  reported_by: string;
  description: string;
  action_taken: string;
  notes: string;
};

export type SafetyPayload = Omit<
  SafetyRecord,
  "id" | "created_at" | "updated_at"
>;

export type TrainingRecord = ComplianceTimestampFields & {
  employee: number;
  employee_name: string;
  training_title: string;
  training_date: string;
  trainer_name: string;
  certificate_number: string;
  notes: string;
};

export type TrainingPayload = Omit<
  TrainingRecord,
  "id" | "created_at" | "updated_at" | "employee_name"
>;

export type DocumentStatus = "draft" | "active" | "expired" | "archived";

export type ComplianceDocumentRecord = ComplianceTimestampFields & {
  title: string;
  document_type: string;
  issue_date: string | null;
  file: string | null;
  status: DocumentStatus;
  notes: string;
};

export type ComplianceDocumentPayload = {
  title?: string;
  document_type?: string;
  issue_date?: string | null;
  file?: File;
  remove_file?: boolean;
  status?: DocumentStatus;
  notes?: string;
};
