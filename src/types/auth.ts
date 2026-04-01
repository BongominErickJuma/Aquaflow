export type UserRole = {
  id: number;
  code: string;
  name: string;
};

export type AuthUser = {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  phone_number: string | null;
  profile_photo: string | null;
  is_active: boolean;
  date_joined: string;
};

export type AdminUser = {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string | null;
  profile_photo: string | null;
  role: UserRole;
  is_active: boolean;
  date_joined: string;
  last_login: string | null;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type CsrfResponse = {
  detail: string;
  csrfToken: string;
};

export type LoginResponse = {
  detail: string;
  csrfToken: string;
  user: AuthUser;
};

export type RefreshResponse = {
  detail: string;
  csrfToken: string;
};

export type LogoutResponse = {
  detail: string;
  csrfToken: string;
};

export type ProfileUpdatePayload = {
  email?: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  remove_profile_photo?: boolean;
};

export type ChangePasswordPayload = {
  current_password: string;
  new_password: string;
  confirm_password: string;
};

export type AdminUserCreatePayload = {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  role: string;
  is_active: boolean;
};

export type AdminUserUpdatePayload = {
  email?: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  role?: string;
  is_active?: boolean;
};

export type MemberSummary = {
  total: number;
  active: number;
  admins: number;
};

export type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
  summary: MemberSummary;
};
