const HAS_SESSION_KEY = "zands_admin_has_session";
export const SESSION_STORAGE_KEY = HAS_SESSION_KEY;

export const hasStoredSession = (): boolean => {
  return localStorage.getItem(HAS_SESSION_KEY) === "true";
};

export const markStoredSession = (): void => {
  localStorage.setItem(HAS_SESSION_KEY, "true");
};

export const clearStoredSession = (): void => {
  localStorage.removeItem(HAS_SESSION_KEY);
};
