export type RegistrationInfo = {
  id: number;
  authority_name: string;
  registration_number: string;
  registration_type: string;
  registration_date: string | null;
  expiry_date: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
};

export type RegistrationInfoPayload = Omit<
  RegistrationInfo,
  "id" | "created_at" | "updated_at"
>;

export type LicenseRecord = {
  id: number;
  license_name: string;
  license_number: string;
  issuing_authority: string;
  issue_date: string | null;
  expiry_date: string | null;
  status: "active" | "expired" | "pending";
  notes: string;
  created_at: string;
  updated_at: string;
};

export type LicenseRecordPayload = Omit<
  LicenseRecord,
  "id" | "created_at" | "updated_at"
>;

export type CompanyLocationRecord = {
  id: number;
  label: string;
  address_line_1: string;
  address_line_2: string;
  city: string;
  state_or_district: string;
  country: string;
  postal_code: string;
  is_head_office: boolean;
  notes: string;
  created_at: string;
  updated_at: string;
};

export type CompanyLocationRecordPayload = Omit<
  CompanyLocationRecord,
  "id" | "created_at" | "updated_at"
>;

export type KPIRecord = {
  id: number;
  name: string;
  value: string;
  unit: string;
  record_date: string;
  notes: string;
  created_at: string;
  updated_at: string;
};

export type KPIRecordPayload = Omit<
  KPIRecord,
  "id" | "created_at" | "updated_at"
>;

export type StrategicPlanRecord = {
  id: number;
  title: string;
  objective: string;
  start_date: string | null;
  end_date: string | null;
  status: "draft" | "active" | "completed";
  owner_name: string;
  notes: string;
  created_at: string;
  updated_at: string;
};

export type StrategicPlanRecordPayload = Omit<
  StrategicPlanRecord,
  "id" | "created_at" | "updated_at"
>;

export type CompanyProfile = {
  id: number;
  company_name: string;
  trading_name: string;
  email: string;
  phone_number: string;
  company_logo: string | null;
  tax_identification_number: string;
  registration_number: string;
  description: string;
  mission: string;
  vision: string;
  registration: RegistrationInfo | null;
  licenses: LicenseRecord[];
  locations: CompanyLocationRecord[];
  kpis: KPIRecord[];
  strategic_plans: StrategicPlanRecord[];
  created_at: string;
  updated_at: string;
};

export type CompanyProfilePayload = {
  company_name?: string;
  trading_name?: string;
  email?: string;
  phone_number?: string;
  tax_identification_number?: string;
  registration_number?: string;
  description?: string;
  mission?: string;
  vision?: string;
  remove_company_logo?: boolean;
  registration?: RegistrationInfoPayload | null;
  licenses?: LicenseRecordPayload[];
  append_licenses?: LicenseRecordPayload | LicenseRecordPayload[];
  locations?: CompanyLocationRecordPayload[];
  append_locations?:
    | CompanyLocationRecordPayload
    | CompanyLocationRecordPayload[];
  kpis?: KPIRecordPayload[];
  append_kpis?: KPIRecordPayload | KPIRecordPayload[];
  strategic_plans?: StrategicPlanRecordPayload[];
  append_strategic_plans?:
    | StrategicPlanRecordPayload
    | StrategicPlanRecordPayload[];
};
