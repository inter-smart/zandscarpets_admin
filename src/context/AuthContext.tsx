import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import * as authApi from "@/services/auth/authApi";
import { registerAuthFailureHandler, refreshSession, isAuthRejection } from "@/lib/apiClient";
import { hasStoredSession, markStoredSession, clearStoredSession, SESSION_STORAGE_KEY } from "@/lib/authSession";
import { toast } from "@/hooks/use-toast";
import type { AdminUser } from "@/services/auth/authApi";

interface AuthContextValue {
  user: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  role: string;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const notifySessionExpired = () =>
  toast({
    title: "Session expired",
    description: "Please log in again.",
    variant: "destructive",
  });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const role = user?.role ?? "user";

  const clearSession = useCallback(() => {
    setUser(null);
    setIsAuthenticated(false);
    clearStoredSession();
  }, []);

  const applySession = useCallback((sessionUser: AdminUser) => {
    setUser(sessionUser);
    setIsAuthenticated(true);
    markStoredSession();
  }, []);

  useEffect(() => {
    let cancelled = false;

    const hydrate = async () => {
      if (!hasStoredSession()) {
        // Never logged in on this browser (or logged out since) — nothing to
        // check, so skip the /auth/me + /auth/refresh round trip entirely.
        setIsLoading(false);
        return;
      }

      try {
        const { user: me } = await authApi.getCurrentAdmin();
        if (!cancelled) applySession(me);
      } catch {
        try {
          const refreshed = await refreshSession();
          if (!cancelled) {
            applySession(refreshed);
          }
        } catch (error) {
          if (!cancelled && isAuthRejection(error)) {
            clearSession();
            notifySessionExpired();
          }
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    hydrate();
    return () => {
      cancelled = true;
    };
  }, [applySession, clearSession]);

  useEffect(() => {
    registerAuthFailureHandler(() => {
      // Parallel requests can all fail at once; only the first one toasts.
      const wasLoggedIn = hasStoredSession();
      clearSession();
      if (wasLoggedIn) notifySessionExpired();
    });
    return () => registerAuthFailureHandler(null);
  }, [clearSession]);

  // Sync logout/login across tabs via the localStorage session flag.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== SESSION_STORAGE_KEY) return;
      if (e.newValue !== "true") {
        setUser(null);
        setIsAuthenticated(false);
      } else {
        window.location.reload();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const login = useCallback(
    async (username: string, password: string) => {
      const { user: loggedInUser } = await authApi.login(username, password);
      applySession(loggedInUser);
    },
    [applySession]
  );

  const logout = useCallback(async () => {
    await authApi.logout();
    clearSession();
  }, [clearSession]);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, logout, role }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
