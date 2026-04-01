import { apiRequest } from "./auth";
import type {
  ComplianceDocumentPayload,
  ComplianceDocumentRecord,
  HygieneCheckPayload,
  HygieneCheckRecord,
  SafetyPayload,
  SafetyRecord,
  TrainingPayload,
  TrainingRecord,
  WaterQualityTestPayload,
  WaterQualityTestRecord,
} from "../../types/compliance";

const COMPLIANCE_BASE_PATH = "/api/compliance";

function resourcePath(resource: string) {
  return `${COMPLIANCE_BASE_PATH}/${resource}/`;
}

function detailPath(resource: string, id: number) {
  return `${resourcePath(resource)}${id}/`;
}

export async function fetchHygieneChecks() {
  return apiRequest<HygieneCheckRecord[]>(resourcePath("hygiene-checks"));
}
export async function fetchHygieneCheck(id: number) {
  return apiRequest<HygieneCheckRecord>(detailPath("hygiene-checks", id));
}
export async function createHygieneCheck(payload: HygieneCheckPayload) {
  return apiRequest<HygieneCheckRecord>(
    resourcePath("hygiene-checks"),
    { method: "POST", body: JSON.stringify(payload) },
    { csrf: true },
  );
}
export async function updateHygieneCheck(
  id: number,
  payload: Partial<HygieneCheckPayload>,
) {
  return apiRequest<HygieneCheckRecord>(
    detailPath("hygiene-checks", id),
    { method: "PATCH", body: JSON.stringify(payload) },
    { csrf: true },
  );
}
export async function deleteHygieneCheck(id: number) {
  return apiRequest<void>(
    detailPath("hygiene-checks", id),
    { method: "DELETE" },
    { csrf: true },
  );
}

export async function fetchWaterQualityTests() {
  return apiRequest<WaterQualityTestRecord[]>(
    resourcePath("water-quality-tests"),
  );
}
export async function fetchWaterQualityTest(id: number) {
  return apiRequest<WaterQualityTestRecord>(
    detailPath("water-quality-tests", id),
  );
}
export async function createWaterQualityTest(payload: WaterQualityTestPayload) {
  return apiRequest<WaterQualityTestRecord>(
    resourcePath("water-quality-tests"),
    { method: "POST", body: JSON.stringify(payload) },
    { csrf: true },
  );
}
export async function updateWaterQualityTest(
  id: number,
  payload: Partial<WaterQualityTestPayload>,
) {
  return apiRequest<WaterQualityTestRecord>(
    detailPath("water-quality-tests", id),
    { method: "PATCH", body: JSON.stringify(payload) },
    { csrf: true },
  );
}
export async function deleteWaterQualityTest(id: number) {
  return apiRequest<void>(
    detailPath("water-quality-tests", id),
    { method: "DELETE" },
    { csrf: true },
  );
}

export async function fetchSafetyRecords() {
  return apiRequest<SafetyRecord[]>(resourcePath("safety-records"));
}
export async function fetchSafetyRecord(id: number) {
  return apiRequest<SafetyRecord>(detailPath("safety-records", id));
}
export async function createSafetyRecord(payload: SafetyPayload) {
  return apiRequest<SafetyRecord>(
    resourcePath("safety-records"),
    { method: "POST", body: JSON.stringify(payload) },
    { csrf: true },
  );
}
export async function updateSafetyRecord(
  id: number,
  payload: Partial<SafetyPayload>,
) {
  return apiRequest<SafetyRecord>(
    detailPath("safety-records", id),
    { method: "PATCH", body: JSON.stringify(payload) },
    { csrf: true },
  );
}
export async function deleteSafetyRecord(id: number) {
  return apiRequest<void>(
    detailPath("safety-records", id),
    { method: "DELETE" },
    { csrf: true },
  );
}

export async function fetchTrainingRecords() {
  return apiRequest<TrainingRecord[]>(resourcePath("training-records"));
}
export async function fetchTrainingRecord(id: number) {
  return apiRequest<TrainingRecord>(detailPath("training-records", id));
}
export async function createTrainingRecord(payload: TrainingPayload) {
  return apiRequest<TrainingRecord>(
    resourcePath("training-records"),
    { method: "POST", body: JSON.stringify(payload) },
    { csrf: true },
  );
}
export async function updateTrainingRecord(
  id: number,
  payload: Partial<TrainingPayload>,
) {
  return apiRequest<TrainingRecord>(
    detailPath("training-records", id),
    { method: "PATCH", body: JSON.stringify(payload) },
    { csrf: true },
  );
}
export async function deleteTrainingRecord(id: number) {
  return apiRequest<void>(
    detailPath("training-records", id),
    { method: "DELETE" },
    { csrf: true },
  );
}

function buildDocumentBody(payload: ComplianceDocumentPayload | FormData) {
  if (payload instanceof FormData) {
    return payload;
  }

  const formData = new FormData();
  if (payload.title !== undefined) formData.append("title", payload.title);
  if (payload.document_type !== undefined)
    formData.append("document_type", payload.document_type);
  if (payload.issue_date !== undefined && payload.issue_date !== null) {
    formData.append("issue_date", payload.issue_date);
  }
  if (payload.expiry_date !== undefined && payload.expiry_date !== null) {
    formData.append("expiry_date", payload.expiry_date);
  }
  if (payload.file) formData.append("file", payload.file);
  if (payload.remove_file !== undefined)
    formData.append("remove_file", String(payload.remove_file));
  if (payload.status !== undefined) formData.append("status", payload.status);
  if (payload.notes !== undefined) formData.append("notes", payload.notes);
  return formData;
}

export async function fetchComplianceDocuments() {
  return apiRequest<ComplianceDocumentRecord[]>(resourcePath("documents"));
}
export async function fetchComplianceDocument(id: number) {
  return apiRequest<ComplianceDocumentRecord>(detailPath("documents", id));
}
export async function createComplianceDocument(
  payload: ComplianceDocumentPayload | FormData,
) {
  return apiRequest<ComplianceDocumentRecord>(
    resourcePath("documents"),
    { method: "POST", body: buildDocumentBody(payload) },
    { csrf: true },
  );
}
export async function updateComplianceDocument(
  id: number,
  payload: ComplianceDocumentPayload | FormData,
) {
  return apiRequest<ComplianceDocumentRecord>(
    detailPath("documents", id),
    { method: "PATCH", body: buildDocumentBody(payload) },
    { csrf: true },
  );
}
export async function deleteComplianceDocument(id: number) {
  return apiRequest<void>(
    detailPath("documents", id),
    { method: "DELETE" },
    { csrf: true },
  );
}
