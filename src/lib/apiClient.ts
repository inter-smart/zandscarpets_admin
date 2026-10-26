import * as authApi from "@/services/auth/authApi";
import { toast } from "@/hooks/use-toast";

// Drop-in replacement for `fetch()` used by feature-service files. Adds
// `credentials: "include"` (so the httpOnly auth cookies are sent) and, on a
// 401, transparently refreshes the access token once and retries the
// original request before giving up. Response parsing/error-throwing stays
// in each service file exactly as before — this only changes how the
// network call itself is made.

type AuthFailureHandler = () => void;

let onAuthFailure: AuthFailureHandler | null = null;

export const registerAuthFailureHandler = (handler: AuthFailureHandler | null): void => {
  onAuthFailure = handler;
};

let refreshInFlight: Promise<authApi.AdminUser> | null = null;

// Single entry point for every refresh (401 retry, boot hydrate, silent
// timer). Refresh tokens are single-use, so concurrent callers must share one
// network call.
export const refreshSession = (): Promise<authApi.AdminUser> => {
  if (!refreshInFlight) {
    refreshInFlight = authApi
      .refresh()
      .then(({ user }) => user)
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
};

// True only when the server actually rejected the session (401/403), as
// opposed to a network error or 5xx where the session may still be valid.
export const isAuthRejection = (error: unknown): boolean =>
  error instanceof authApi.ApiError && (error.status === 401 || error.status === 403);

export const apiFetch = async (
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<Response> => {
  const requestInit: RequestInit = { ...init, credentials: "include" };
  const response = await fetch(input, requestInit);

  if (response.status === 403) {
    // Permission denied by the server — not an auth failure, so no refresh/retry.
    toast({
      title: "Permission denied",
      description: "Your role doesn't allow this action.",
      variant: "destructive",
    });
    return response;
  }

  if (response.status !== 401) {
    return response;
  }

  try {
    await refreshSession();
  } catch (error) {
    // Only end the session if the server rejected it; on a network/5xx
    // failure keep the user signed in and surface the original 401.
    if (isAuthRejection(error)) onAuthFailure?.();
    return response;
  }

  return fetch(input, requestInit);
};
