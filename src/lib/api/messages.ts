import { apiRequest } from "./auth";
import type {
  MessageBulkDeleteResponse,
  MessageDeleteWarning,
  MessageDetail,
  MessageItem,
  MessagePayload,
  MessageSummaryResponse,
} from "../../types/messages";

const MESSAGES_BASE_PATH = "/api/messages/";

export async function fetchMessages() {
  return apiRequest<MessageItem[]>(MESSAGES_BASE_PATH);
}

export async function fetchMessageSummary() {
  return apiRequest<MessageSummaryResponse>(`${MESSAGES_BASE_PATH}summary/`);
}

export async function fetchMessageDetail(messageId: number) {
  return apiRequest<MessageDetail>(`${MESSAGES_BASE_PATH}${messageId}/`);
}

export async function createMessage(payload: MessagePayload) {
  return apiRequest<MessageDetail>(
    MESSAGES_BASE_PATH,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    { csrf: true },
  );
}

export async function updateMessage(
  messageId: number,
  payload: Partial<MessagePayload>,
) {
  return apiRequest<MessageDetail>(
    `${MESSAGES_BASE_PATH}${messageId}/`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
    { csrf: true },
  );
}

export async function markMessageRead(messageId: number) {
  return apiRequest<MessageItem>(
    `${MESSAGES_BASE_PATH}${messageId}/read/`,
    {
      method: "POST",
    },
    { csrf: true },
  );
}

export async function markAllMessagesRead() {
  return apiRequest<{ detail: string; updated: number }>(
    `${MESSAGES_BASE_PATH}read-all/`,
    {
      method: "POST",
    },
    { csrf: true },
  );
}

export async function deleteMessage(messageId: number, force = false) {
  const suffix = force ? "?force=true" : "";
  return apiRequest<MessageDeleteWarning | null>(
    `${MESSAGES_BASE_PATH}${messageId}/delete/${suffix}`,
    {
      method: "DELETE",
    },
    { csrf: true },
  );
}

export async function bulkDeleteMessages(ids: number[], force = false) {
  return apiRequest<MessageBulkDeleteResponse | MessageDeleteWarning>(
    `${MESSAGES_BASE_PATH}bulk-delete/`,
    {
      method: "POST",
      body: JSON.stringify({ ids, force }),
    },
    { csrf: true },
  );
}
