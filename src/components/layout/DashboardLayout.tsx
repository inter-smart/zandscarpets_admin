import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";
import PageLoader from "./PageLoader";

export function DashboardLayout() {
  return (
    // The shell is exactly one viewport tall and never scrolls itself; only <main>
    // scrolls. This keeps the header pinned and stops wide content (data tables)
    // from pushing the whole page sideways.
    <SidebarProvider defaultOpen={true} className="h-svh min-h-0 overflow-hidden">
      <div className="flex h-full w-full overflow-hidden bg-background">
        <AppSidebar />
        {/* min-w-0 lets this flex child shrink below its content's width, so wide
            tables scroll inside their own container instead of stretching the page. */}
        <div className="flex h-full min-w-0 flex-1 flex-col">
          <AppHeader />
          <main className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-6 [scrollbar-gutter:stable]">
            <Suspense fallback={<PageLoader />}>
              <Outlet />
            </Suspense>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
