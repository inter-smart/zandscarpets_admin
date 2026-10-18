// Auth endpoints talk to the backend purely via httpOnly cookies (access_token /
// refresh_token) — no token is ever read or stored by JS. These calls use a plain
// `fetch` (not `apiClient`'s `apiFetch`) since `apiFetch` itself calls `refresh()`
// on a 401, and routing refresh/login/logout through it would be circular.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export interface AdminUser {
  id: number;
  username: string;
  email: string;
  role: string;
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

// Thrown by parseEnvelope on any failed request. Carries the backend's error
// `code` (e.g. "OTP_MAX_ATTEMPTS") and `details` (e.g. { remainingAttempts })
// so callers can branch on them instead of string-matching the message.
export class ApiError extends Error {
  code?: string;
  details?: unknown;
  status?: number;

  constructor(message: string, code?: string, details?: unknown, status?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const parseEnvelope = async <T>(response: Response): Promise<ApiEnvelope<T>> => {
  const body = await response.json().catch(() => ({} as ApiEnvelope<T> & ApiErrorEnvelope));
  if (!response.ok || !body.success) {
    const errorBody = body as ApiErrorEnvelope;
    const message = errorBody.error?.message || errorBody.message || `Request failed with status ${response.status}`;
    throw new ApiError(message, errorBody.error?.code, errorBody.error?.details, response.status);
  }
  return body;
};

export const login = async (username: string, password: string): Promise<{ user: AdminUser }> => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const envelope = await parseEnvelope<{ user: AdminUser }>(response);
  return envelope.data;
};

export const logout = async (): Promise<void> => {
  // Best-effort: the caller always clears local auth state regardless of
  // whether this network call succeeds.
  try {
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
  } catch (error) {
    console.error("Logout request failed:", error);
  }
};

export const refresh = async (): Promise<{ user: AdminUser }> => {
  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: "POST",
    credentials: "include",
  });
  const envelope = await parseEnvelope<{ user: AdminUser }>(response);
  return envelope.data;
};

export const getCurrentAdmin = async (): Promise<{ user: AdminUser }> => {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    credentials: "include",
  });
  const envelope = await parseEnvelope<{ user: AdminUser }>(response);
  return envelope.data;
};

// --- Forgot password / OTP / reset password ---
// forgotPassword returns 404 (code "EMAIL_NOT_FOUND") when the email isn't
// registered, and on success returns the resend cooldown (seconds) so the
// OTP step's countdown timer can be driven by the server, not a client guess.

export const forgotPassword = async (email: string): Promise<{ cooldownSeconds: number }> => {
  const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const envelope = await parseEnvelope<{ cooldownSeconds: number }>(response);
  return envelope.data;
};

export const verifyOtp = async (email: string, otp: string): Promise<{ resetToken: string }> => {
  const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp }),
  });
  const envelope = await parseEnvelope<{ resetToken: string }>(response);
  return envelope.data;
};

export const resetPassword = async (
  email: string,
  resetToken: string,
  password: string
): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, resetToken, password }),
  });
  await parseEnvelope<null>(response);
};
