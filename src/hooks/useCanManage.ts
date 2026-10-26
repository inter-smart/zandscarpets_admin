import { useLocation } from "react-router-dom";
import { moduleForPath } from "@/config/navigation";
import { usePermissions } from "@/hooks/usePermissions";

/**
 * Whether the current user may change data on the page being shown. The module is resolved from
 * the URL via the menu config, so shared list components (DataTable, RowActionsMenu, …) can hide
 * write actions without every page passing it down. The API still enforces this server-side.
 */
export function useCanManage(): boolean {
  const { pathname } = useLocation();
  const { can } = usePermissions();
  return can(moduleForPath(pathname), "manage");
}
