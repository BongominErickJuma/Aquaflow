import type {
  AdminUser,
  AdminUserCreatePayload,
  AdminUserUpdatePayload,
  AuthUser,
  ChangePasswordPayload,
  CsrfResponse,
  LoginPayload,
  LoginResponse,
  LogoutResponse,
  PaginatedResponse,
  ProfileUpdatePayload,
  RefreshResponse,
} from "../../types/auth";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ?? "";

const CSRF_STORAGE_KEY = "ibms.csrfToken";
const CSRF_PATH = "/api/auth/csrf/";
const LOGIN_PATH = "/api/auth/login/";
const REFRESH_PATH = "/api/auth/token/refresh/";
const LOGOUT_PATH = "/api/auth/logout/";
const PROFILE_PATH = "/api/auth/profile/";
const CHANGE_PASSWORD_PATH = "/api/auth/change-password/";
const ROLES_PATH = "/api/auth/roles/";
const USERS_PATH = "/api/auth/users/";

let refreshPromise: Promise<void> | null = null;

export class ApiError extends Error {
  status: number;
  data?: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

type RequestOptions = {
  csrf?: boolean;
  retryOnAuthFailure?: boolean;
};

function getStoredCsrfToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(CSRF_STORAGE_KEY);
}

function storeCsrfToken(token: string | null) {
  if (typeof window === "undefined") {
    return;
  }

  if (token) {
    window.localStorage.setItem(CSRF_STORAGE_KEY, token);
    return;
  }

  window.localStorage.removeItem(CSRF_STORAGE_KEY);
}

function buildHeaders(initHeaders?: HeadersInit) {
  const headers = new Headers(initHeaders);
  headers.set("Accept", "application/json");
  return headers;
}

function shouldRetryWithRefresh(path: string, options: RequestOptions) {
  if (options.retryOnAuthFailure === false) {
    return false;
  }

  return ![CSRF_PATH, LOGIN_PATH, REFRESH_PATH, LOGOUT_PATH].includes(path);
}

function deriveErrorMessage(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return "Request failed.";
  }

  const details = payload as Record<string, unknown>;

  if (typeof details.detail === "string") {
    return details.detail;
  }

  for (const value of Object.values(details)) {
    if (typeof value === "string") {
      return value;
    }

    if (Array.isArray(value) && typeof value[0] === "string") {
      return value[0];
    }
  }

  return "Request failed.";
}

async function parseResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  const payload = isJson ? ((await response.json()) as T) : (null as T);
  const payloadObject =
    payload && typeof payload === "object"
      ? (payload as { csrfToken?: unknown; detail?: unknown })
      : null;

  if (typeof payloadObject?.csrfToken === "string") {
    storeCsrfToken(payloadObject.csrfToken);
  }

  if (!response.ok) {
    throw new ApiError(deriveErrorMessage(payload), response.status, payload);
  }

  return payload;
}

async function sendRequest(
  path: string,
  init: RequestInit = {},
  options: RequestOptions = {},
) {
  const headers = buildHeaders(init.headers);

  if (options.csrf) {
    const token = getStoredCsrfToken() ?? (await issueCsrfToken());
    headers.set("X-CSRFToken", token);
  }

  if (
    init.body &&
    !(init.body instanceof FormData) &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: "include",
    headers,
  });

  return { response, headers };
}

async function performRefresh() {
  const { response } = await sendRequest(
    REFRESH_PATH,
    { method: "POST" },
    { csrf: true, retryOnAuthFailure: false },
  );

  await parseResponse<RefreshResponse>(response);
}

async function ensureFreshSession() {
  if (!refreshPromise) {
    refreshPromise = performRefresh().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

async function request<T>(
  path: string,
  init: RequestInit = {},
  options: RequestOptions = {},
) {
  const firstAttempt = await sendRequest(path, init, options);

  if (
    firstAttempt.response.status !== 401 ||
    !shouldRetryWithRefresh(path, options)
  ) {
    return parseResponse<T>(firstAttempt.response);
  }

  try {
    await ensureFreshSession();
  } catch {
    clearStoredCsrfToken();
    return parseResponse<T>(firstAttempt.response);
  }

  const retryAttempt = await sendRequest(path, init, options);
  return parseResponse<T>(retryAttempt.response);
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
  options: RequestOptions = {},
) {
  return request<T>(path, init, options);
}

export async function issueCsrfToken() {
  const response = await request<CsrfResponse>(
    CSRF_PATH,
    {},
    { retryOnAuthFailure: false },
  );
  return response.csrfToken;
}

export async function login(payload: LoginPayload) {
  const response = await request<LoginResponse>(
    LOGIN_PATH,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    { csrf: true, retryOnAuthFailure: false },
  );

  return response.user;
}

export async function logout() {
  await request<LogoutResponse>(
    LOGOUT_PATH,
    { method: "POST" },
    { retryOnAuthFailure: false },
  );
}

export async function refreshSession() {
  await ensureFreshSession();
}

export async function fetchProfile() {
  return request<AuthUser>(PROFILE_PATH);
}

export async function updateProfile(payload: FormData | ProfileUpdatePayload) {
  const body = payload instanceof FormData ? payload : JSON.stringify(payload);

  return request<AuthUser>(
    PROFILE_PATH,
    {
      method: "PATCH",
      body,
    },
    { csrf: true },
  );
}

export async function changePassword(payload: ChangePasswordPayload) {
  return request<CsrfResponse>(
    CHANGE_PASSWORD_PATH,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    { csrf: true, retryOnAuthFailure: false },
  );
}

export async function fetchRoles() {
  return request<{ id: number; code: string; name: string }[]>(ROLES_PATH);
}

type FetchUsersParams = {
  page?: number;
  pageSize?: number;
  search?: string;
  role?: string;
  status?: string;
};

export async function fetchUsers(params: FetchUsersParams = {}) {
  const query = new URLSearchParams();

  if (params.page && params.page > 0) {
    query.set("page", String(params.page));
  }

  if (params.pageSize && [5, 6, 10].includes(params.pageSize)) {
    query.set("page_size", String(params.pageSize));
  }

  if (params.search?.trim()) {
    query.set("search", params.search.trim());
  }

  if (params.role && params.role !== "all") {
    query.set("role", params.role);
  }

  if (params.status && params.status !== "all") {
    query.set("status", params.status);
  }

  const path = query.size ? `${USERS_PATH}?${query.toString()}` : USERS_PATH;
  return request<PaginatedResponse<AdminUser>>(path);
}

export async function fetchAllUsers() {
  return request<AdminUser[]>(`${USERS_PATH}?paginate=false`);
}

export async function createUser(payload: AdminUserCreatePayload | FormData) {
  const body = payload instanceof FormData ? payload : JSON.stringify(payload);

  return request<AdminUser>(
    USERS_PATH,
    {
      method: "POST",
      body,
    },
    { csrf: true },
  );
}

export async function updateUser(
  userId: number,
  payload: AdminUserUpdatePayload | FormData,
) {
  const body = payload instanceof FormData ? payload : JSON.stringify(payload);

  return request<AdminUser>(
    `${USERS_PATH}${userId}/`,
    {
      method: "PATCH",
      body,
    },
    { csrf: true },
  );
}

export function resolveApiAssetUrl(path: string | null) {
  if (!path) {
    return null;
  }

  if (/^(https?:|data:)/i.test(path)) {
    return path;
  }

  if (path.startsWith("/")) {
    return API_BASE_URL ? `${API_BASE_URL}${path}` : path;
  }

  return API_BASE_URL ? `${API_BASE_URL}/${path}` : `/${path}`;
}

export function clearStoredCsrfToken() {
  storeCsrfToken(null);
}
