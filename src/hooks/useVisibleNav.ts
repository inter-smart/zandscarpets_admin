import { useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { ROLES } from "@/lib/utils";
import { NAV, type NavSection } from "@/config/navigation";

/** The menu filtered for the current user. Shared by the sidebar and the search palette. */
export function useVisibleNav(): NavSection[] {
  const { role } = useAuth();
  return useMemo(
    () =>
      NAV.map((section) => ({
        ...section,
        entries: section.entries.filter(
          (entry) => !entry.adminOnly || role === ROLES.ADMIN,
        ),
      })).filter((section) => section.entries.length > 0),
    [role],
  );
}
