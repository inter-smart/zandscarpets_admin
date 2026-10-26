import { useCallback } from "react";
import { useAuth } from "@/context/AuthContext";

export type AccessLevel = "view" | "manage";

/**
 * Permission checks for the current user. Permissions come from the server (login / refresh / me),
 * which is the source of truth; this only drives what the panel shows. The API enforces them too.
 */
export function usePermissions() {
  const { user } = useAuth();
  const isAdmin = Boolean(user?.is_admin);
  const permissions = user?.permissions;

  /** `module` undefined means "no module required" (e.g. the dashboard). */
  const can = useCallback(
    (module: string | undefined, level: AccessLevel = "view"): boolean => {
      if (!module) return true;
      if (isAdmin) return true;
      const have = permissions?.[module];
      if (!have) return false;
      return level === "view" ? true : have === "manage";
    },
    [isAdmin, permissions],
  );

  return { can, isAdmin };
}
