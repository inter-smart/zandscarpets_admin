import { useMemo } from "react";
import { usePermissions } from "@/hooks/usePermissions";
import {
  NAV,
  isNavGroup,
  type NavGroup,
  type NavItem,
  type NavSection,
  type PermissionModule,
} from "@/config/navigation";

/** The menu filtered to what the current user may view. Shared by the sidebar and the search palette. */
export function useVisibleNav(): NavSection[] {
  const { can } = usePermissions();

  return useMemo(() => {
    const keepItems = (items: NavItem[] | undefined, inherited?: PermissionModule) =>
      (items ?? []).filter((item) => can(item.module ?? inherited));

    const filterGroup = (group: NavGroup, inherited?: PermissionModule): NavGroup | null => {
      const mod = group.module ?? inherited;
      if (!can(mod)) return null;
      const children = (group.children ?? [])
        .map((child) => filterGroup(child, mod))
        .filter((child): child is NavGroup => child !== null);
      const items = keepItems(group.items, mod);
      if (children.length === 0 && items.length === 0) return null;
      return { ...group, children, items };
    };

    return NAV.map((section) => {
      const entries = section.entries
        .map((entry) =>
          isNavGroup(entry)
            ? filterGroup(entry, section.module)
            : can(entry.module ?? section.module)
              ? entry
              : null,
        )
        .filter((entry): entry is NavGroup | NavItem => entry !== null);
      return { ...section, entries };
    }).filter((section) => section.entries.length > 0);
  }, [can]);
}
