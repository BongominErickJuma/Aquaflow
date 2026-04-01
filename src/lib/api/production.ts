import { apiRequest } from "./auth";
import type {
  DowntimeAlertPayload,
  DowntimeAlertRecord,
  MachinePayload,
  MachineRecord,
  MachineUsageLogPayload,
  MachineUsageLogRecord,
  MaintenanceLogPayload,
  MaintenanceLogRecord,
  MaintenanceSchedulePayload,
  MaintenanceScheduleRecord,
  UtilityConsumptionLogPayload,
  UtilityConsumptionLogRecord,
} from "../../types/production";

const PRODUCTION_BASE_PATH = "/api/production";

function resourcePath(resource: string) {
  return `${PRODUCTION_BASE_PATH}/${resource}/`;
}

function detailPath(resource: string, id: number) {
  return `${resourcePath(resource)}${id}/`;
}

export async function fetchMachines() {
  return apiRequest<MachineRecord[]>(resourcePath("machines"));
}

export async function fetchMachine(id: number) {
  return apiRequest<MachineRecord>(detailPath("machines", id));
}

export async function createMachine(payload: MachinePayload) {
  return apiRequest<MachineRecord>(
    resourcePath("machines"),
    { method: "POST", body: JSON.stringify(payload) },
    { csrf: true },
  );
}

export async function updateMachine(
  id: number,
  payload: Partial<MachinePayload>,
) {
  return apiRequest<MachineRecord>(
    detailPath("machines", id),
    { method: "PATCH", body: JSON.stringify(payload) },
    { csrf: true },
  );
}

export async function deleteMachine(id: number) {
  return apiRequest<void>(
    detailPath("machines", id),
    { method: "DELETE" },
    { csrf: true },
  );
}

export async function fetchMachineUsageLogs() {
  return apiRequest<MachineUsageLogRecord[]>(
    resourcePath("machine-usage-logs"),
  );
}

export async function fetchMachineUsageLog(id: number) {
  return apiRequest<MachineUsageLogRecord>(
    detailPath("machine-usage-logs", id),
  );
}

export async function createMachineUsageLog(payload: MachineUsageLogPayload) {
  return apiRequest<MachineUsageLogRecord>(
    resourcePath("machine-usage-logs"),
    { method: "POST", body: JSON.stringify(payload) },
    { csrf: true },
  );
}

export async function updateMachineUsageLog(
  id: number,
  payload: Partial<MachineUsageLogPayload>,
) {
  return apiRequest<MachineUsageLogRecord>(
    detailPath("machine-usage-logs", id),
    { method: "PATCH", body: JSON.stringify(payload) },
    { csrf: true },
  );
}

export async function deleteMachineUsageLog(id: number) {
  return apiRequest<void>(
    detailPath("machine-usage-logs", id),
    { method: "DELETE" },
    { csrf: true },
  );
}

export async function fetchMaintenanceSchedules() {
  return apiRequest<MaintenanceScheduleRecord[]>(
    resourcePath("maintenance-schedules"),
  );
}

export async function fetchMaintenanceSchedule(id: number) {
  return apiRequest<MaintenanceScheduleRecord>(
    detailPath("maintenance-schedules", id),
  );
}

export async function createMaintenanceSchedule(
  payload: MaintenanceSchedulePayload,
) {
  return apiRequest<MaintenanceScheduleRecord>(
    resourcePath("maintenance-schedules"),
    { method: "POST", body: JSON.stringify(payload) },
    { csrf: true },
  );
}

export async function updateMaintenanceSchedule(
  id: number,
  payload: Partial<MaintenanceSchedulePayload>,
) {
  return apiRequest<MaintenanceScheduleRecord>(
    detailPath("maintenance-schedules", id),
    { method: "PATCH", body: JSON.stringify(payload) },
    { csrf: true },
  );
}

export async function deleteMaintenanceSchedule(id: number) {
  return apiRequest<void>(
    detailPath("maintenance-schedules", id),
    { method: "DELETE" },
    { csrf: true },
  );
}

export async function fetchMaintenanceLogs() {
  return apiRequest<MaintenanceLogRecord[]>(resourcePath("maintenance-logs"));
}

export async function fetchMaintenanceLog(id: number) {
  return apiRequest<MaintenanceLogRecord>(detailPath("maintenance-logs", id));
}

export async function createMaintenanceLog(payload: MaintenanceLogPayload) {
  return apiRequest<MaintenanceLogRecord>(
    resourcePath("maintenance-logs"),
    { method: "POST", body: JSON.stringify(payload) },
    { csrf: true },
  );
}

export async function updateMaintenanceLog(
  id: number,
  payload: Partial<MaintenanceLogPayload>,
) {
  return apiRequest<MaintenanceLogRecord>(
    detailPath("maintenance-logs", id),
    { method: "PATCH", body: JSON.stringify(payload) },
    { csrf: true },
  );
}

export async function deleteMaintenanceLog(id: number) {
  return apiRequest<void>(
    detailPath("maintenance-logs", id),
    { method: "DELETE" },
    { csrf: true },
  );
}

export async function fetchDowntimeAlerts() {
  return apiRequest<DowntimeAlertRecord[]>(resourcePath("downtime-alerts"));
}

export async function fetchDowntimeAlert(id: number) {
  return apiRequest<DowntimeAlertRecord>(detailPath("downtime-alerts", id));
}

export async function createDowntimeAlert(payload: DowntimeAlertPayload) {
  return apiRequest<DowntimeAlertRecord>(
    resourcePath("downtime-alerts"),
    { method: "POST", body: JSON.stringify(payload) },
    { csrf: true },
  );
}

export async function updateDowntimeAlert(
  id: number,
  payload: Partial<DowntimeAlertPayload>,
) {
  return apiRequest<DowntimeAlertRecord>(
    detailPath("downtime-alerts", id),
    { method: "PATCH", body: JSON.stringify(payload) },
    { csrf: true },
  );
}

export async function deleteDowntimeAlert(id: number) {
  return apiRequest<void>(
    detailPath("downtime-alerts", id),
    { method: "DELETE" },
    { csrf: true },
  );
}

export async function fetchUtilityConsumptionLogs() {
  return apiRequest<UtilityConsumptionLogRecord[]>(
    resourcePath("utility-consumption-logs"),
  );
}

export async function fetchUtilityConsumptionLog(id: number) {
  return apiRequest<UtilityConsumptionLogRecord>(
    detailPath("utility-consumption-logs", id),
  );
}

export async function createUtilityConsumptionLog(
  payload: UtilityConsumptionLogPayload,
) {
  return apiRequest<UtilityConsumptionLogRecord>(
    resourcePath("utility-consumption-logs"),
    { method: "POST", body: JSON.stringify(payload) },
    { csrf: true },
  );
}

export async function updateUtilityConsumptionLog(
  id: number,
  payload: Partial<UtilityConsumptionLogPayload>,
) {
  return apiRequest<UtilityConsumptionLogRecord>(
    detailPath("utility-consumption-logs", id),
    { method: "PATCH", body: JSON.stringify(payload) },
    { csrf: true },
  );
}

export async function deleteUtilityConsumptionLog(id: number) {
  return apiRequest<void>(
    detailPath("utility-consumption-logs", id),
    { method: "DELETE" },
    { csrf: true },
  );
}
