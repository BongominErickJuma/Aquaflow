import { apiRequest } from "./auth";
import type {
  NotificationBulkDeleteResponse,
  NotificationDeleteWarning,
  NotificationDetail,
  NotificationItem,
  NotificationSummaryResponse,
} from "../../types/notifications";

const NOTIFICATIONS_BASE_PATH = "/api/notifications/";

export async function fetchNotifications() {
  return apiRequest<NotificationItem[]>(NOTIFICATIONS_BASE_PATH);
}

export async function fetchNotificationSummary() {
  return apiRequest<NotificationSummaryResponse>(
    `${NOTIFICATIONS_BASE_PATH}summary/`,
  );
}

export async function fetchNotificationDetail(notificationId: number) {
  return apiRequest<NotificationDetail>(
    `${NOTIFICATIONS_BASE_PATH}${notificationId}/`,
  );
}

export async function markNotificationRead(notificationId: number) {
  return apiRequest<NotificationItem>(
    `${NOTIFICATIONS_BASE_PATH}${notificationId}/read/`,
    {
      method: "POST",
    },
    { csrf: true },
  );
}

export async function markAllNotificationsRead() {
  return apiRequest<{ detail: string; updated: number }>(
    `${NOTIFICATIONS_BASE_PATH}read-all/`,
    {
      method: "POST",
    },
    { csrf: true },
  );
}

export async function deleteNotification(
  notificationId: number,
  force = false,
) {
  const suffix = force ? "?force=true" : "";
  return apiRequest<NotificationDeleteWarning | null>(
    `${NOTIFICATIONS_BASE_PATH}${notificationId}/delete/${suffix}`,
    {
      method: "DELETE",
    },
    { csrf: true },
  );
}

export async function bulkDeleteNotifications(ids: number[], force = false) {
  return apiRequest<NotificationBulkDeleteResponse | NotificationDeleteWarning>(
    `${NOTIFICATIONS_BASE_PATH}bulk-delete/`,
    {
      method: "POST",
      body: JSON.stringify({ ids, force }),
    },
    { csrf: true },
  );
}
