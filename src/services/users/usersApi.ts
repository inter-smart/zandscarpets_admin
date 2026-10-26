import { apiFetch } from "@/lib/apiClient";

// Admin user management — this is a genuinely protected, admin-only resource
// (server: authMiddleware({ module: "users" })), so calls go through `apiFetch` for
// cookie credentials + 401-refresh-retry, unlike the plain-`fetch` services
// elsewhere in the app.
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL;

// Base path is singular "user" — matches the actual mounted backend route
// `/api/backend/user`, distinct from the frontend page route `/users`.
const USERS_URL = `${API_BASE_URL}/user`;

export interface AdminUserRecord {
  id: number;
  username: string;
  email: string;
  password?: string;
  role_id: number | null;
  roleInfo?: { id: number; name: string; slug: string; is_system: boolean } | null;
  is_active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  statusCode?: number;
  timestamp?: string;
  data: T;
}

interface ApiErrorEnvelope {
  success: false;
  error?: {
    message?: string;
    code?: string;
    statusCode?: number;
    details?: unknown;
  };
  message?: string;
}

export class ApiError extends Error {
  code?: string;
  details?: unknown;

  constructor(message: string, code?: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.details = details;
  }
}

const parseEnvelope = async <T>(
  response: Response,
): Promise<ApiEnvelope<T>> => {
  const body = await response
    .json()
    .catch(() => ({}) as ApiEnvelope<T> & ApiErrorEnvelope);
  if (!response.ok || !body.success) {
    const errorBody = body as ApiErrorEnvelope;
    const message =
      errorBody.error?.message ||
      errorBody.message ||
      `Request failed with status ${response.status}`;
    throw new ApiError(
      message,
      errorBody.error?.code,
      errorBody.error?.details,
    );
  }
  return body;
};

export interface UsersListResponse {
  data: {
    data: AdminUserRecord[];
    pagination: {
      totalCount: number;
      totalPages: number;
      currentPage: number;
      limit: number;
      isSearchApplied?: boolean;
    };
  };
}

export interface CreateUserPayload {
  username: string;
  email: string;
  password: string;
  role_id?: number;
  is_active: boolean;
}

export interface UpdateUserPayload {
  username?: string;
  email?: string;
  password?: string;
  role_id?: number;
  is_active?: boolean;
}

// Fetcher shape matches usePaginatedList's `Fetcher<T>` contract, so this can
// be passed straight in as the hook's fetcher.
export const fetchUsersList = async (
  page: number,
  limit: number,
  search?: string,
): Promise<UsersListResponse> => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  if (search) {
    params.append("search", search);
  }

  const response = await apiFetch(`${USERS_URL}?${params}`);
  return parseEnvelope<UsersListResponse["data"]>(response);
};

export const fetchUserById = async (
  id: number,
): Promise<{ data: AdminUserRecord }> => {
  const response = await apiFetch(`${USERS_URL}/${id}`);
  return parseEnvelope<AdminUserRecord>(response);
};

export const createUser = async (
  payload: CreateUserPayload,
): Promise<{ data: AdminUserRecord }> => {
  const response = await apiFetch(USERS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseEnvelope<AdminUserRecord>(response);
};

export const updateUser = async (
  id: number,
  payload: UpdateUserPayload,
): Promise<{ data: AdminUserRecord }> => {
  const response = await apiFetch(`${USERS_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseEnvelope<AdminUserRecord>(response);
};

export const deleteUser = async (
  id: number,
): Promise<{ data: { id: number } }> => {
  const response = await apiFetch(`${USERS_URL}/${id}`, {
    method: "DELETE",
  });
  return parseEnvelope<{ id: number }>(response);
};

export const toggleUserStatus = (item: AdminUserRecord, isActive: boolean) =>
  updateUser(item.id, { is_active: isActive });
