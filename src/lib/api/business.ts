import { apiRequest } from "./auth";
import type {
  CompanyLocationRecord,
  CompanyLocationRecordPayload,
  CompanyProfile,
  CompanyProfilePayload,
  KPIRecord,
  KPIRecordPayload,
  LicenseRecord,
  LicenseRecordPayload,
  RegistrationInfo,
  RegistrationInfoPayload,
  StrategicPlanRecord,
  StrategicPlanRecordPayload,
} from "../../types/business";

const COMPANY_PATH = "/api/business/company/";

export async function fetchCompanyProfile() {
  return apiRequest<CompanyProfile>(COMPANY_PATH);
}

export async function createCompanyProfile(
  payload: CompanyProfilePayload | FormData,
) {
  return apiRequest<CompanyProfile>(
    COMPANY_PATH,
    {
      method: "POST",
      body: payload instanceof FormData ? payload : JSON.stringify(payload),
    },
    { csrf: true },
  );
}

export async function updateCompanyProfile(
  payload: CompanyProfilePayload | FormData,
) {
  return apiRequest<CompanyProfile>(
    COMPANY_PATH,
    {
      method: "PATCH",
      body: payload instanceof FormData ? payload : JSON.stringify(payload),
    },
    { csrf: true },
  );
}

export async function fetchRegistrationInfo(companyId: number) {
  return apiRequest<RegistrationInfo>(
    `${COMPANY_PATH}${companyId}/registration/`,
  );
}

export async function updateRegistrationInfo(
  companyId: number,
  payload: Partial<RegistrationInfoPayload>,
) {
  return apiRequest<RegistrationInfo>(
    `${COMPANY_PATH}${companyId}/registration/`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
    { csrf: true },
  );
}

export async function deleteRegistrationInfo(companyId: number) {
  return apiRequest<void>(
    `${COMPANY_PATH}${companyId}/registration/`,
    { method: "DELETE" },
    { csrf: true },
  );
}

export async function fetchLicenseRecord(companyId: number, recordId: number) {
  return apiRequest<LicenseRecord>(
    `${COMPANY_PATH}${companyId}/licenses/${recordId}/`,
  );
}

export async function updateLicenseRecord(
  companyId: number,
  recordId: number,
  payload: Partial<LicenseRecordPayload>,
) {
  return apiRequest<LicenseRecord>(
    `${COMPANY_PATH}${companyId}/licenses/${recordId}/`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
    { csrf: true },
  );
}

export async function deleteLicenseRecord(companyId: number, recordId: number) {
  return apiRequest<void>(
    `${COMPANY_PATH}${companyId}/licenses/${recordId}/`,
    { method: "DELETE" },
    { csrf: true },
  );
}

export async function fetchLocationRecord(companyId: number, recordId: number) {
  return apiRequest<CompanyLocationRecord>(
    `${COMPANY_PATH}${companyId}/locations/${recordId}/`,
  );
}

export async function updateLocationRecord(
  companyId: number,
  recordId: number,
  payload: Partial<CompanyLocationRecordPayload>,
) {
  return apiRequest<CompanyLocationRecord>(
    `${COMPANY_PATH}${companyId}/locations/${recordId}/`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
    { csrf: true },
  );
}

export async function deleteLocationRecord(
  companyId: number,
  recordId: number,
) {
  return apiRequest<void>(
    `${COMPANY_PATH}${companyId}/locations/${recordId}/`,
    { method: "DELETE" },
    { csrf: true },
  );
}

export async function fetchKpiRecord(companyId: number, recordId: number) {
  return apiRequest<KPIRecord>(`${COMPANY_PATH}${companyId}/kpis/${recordId}/`);
}

export async function updateKpiRecord(
  companyId: number,
  recordId: number,
  payload: Partial<KPIRecordPayload>,
) {
  return apiRequest<KPIRecord>(
    `${COMPANY_PATH}${companyId}/kpis/${recordId}/`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
    { csrf: true },
  );
}

export async function deleteKpiRecord(companyId: number, recordId: number) {
  return apiRequest<void>(
    `${COMPANY_PATH}${companyId}/kpis/${recordId}/`,
    { method: "DELETE" },
    { csrf: true },
  );
}

export async function fetchStrategicPlanRecord(
  companyId: number,
  recordId: number,
) {
  return apiRequest<StrategicPlanRecord>(
    `${COMPANY_PATH}${companyId}/strategic-plans/${recordId}/`,
  );
}

export async function updateStrategicPlanRecord(
  companyId: number,
  recordId: number,
  payload: Partial<StrategicPlanRecordPayload>,
) {
  return apiRequest<StrategicPlanRecord>(
    `${COMPANY_PATH}${companyId}/strategic-plans/${recordId}/`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
    { csrf: true },
  );
}

export async function deleteStrategicPlanRecord(
  companyId: number,
  recordId: number,
) {
  return apiRequest<void>(
    `${COMPANY_PATH}${companyId}/strategic-plans/${recordId}/`,
    { method: "DELETE" },
    { csrf: true },
  );
}
