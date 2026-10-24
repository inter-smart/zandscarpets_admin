import { useState, useEffect, useMemo } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useVisibleNav } from "@/hooks/useVisibleNav";
import { NavSearchTrigger } from "@/components/layout/NavSearch";
import {
  NAV,
  isNavGroup,
  type NavGroup,
  type NavItem,
} from "@/config/navigation";

const Logo =
  "https://cdn-lanhl.nitrocdn.com/BEDNLEoRmIKjWuHGWySaweMWUMbmbmac/assets/images/source/rev-b24f0bb/www.zandscarpets.com/assets/images/logo.svg";

type Loc = { pathname: string; search: string };

const isNavActive = (location: Loc, url: string, end = false) => {
  const [path, query] = url.split("?");
  const pathMatch = end
    ? location.pathname === path
    : location.pathname === path || location.pathname.startsWith(`${path}/`);
  if (!pathMatch) return false;

  // Query-param links (e.g. /product-labels?type=tag) are only active when the
  // matching param is present, so each type highlights its own entry.
  if (query) {
    const want = new URLSearchParams(query);
    const have = new URLSearchParams(location.search);
    for (const [key, value] of want) {
      if (have.get(key) !== value) return false;
    }
  }

  return true;
};

// "/bulk-upload" is a prefix of its sibling "/bulk-upload/products" etc., so
// it must match exactly or the Overview link would stay highlighted on every child page.
const itemIsExact = (item: NavItem, siblings: NavItem[]) =>
  siblings.some((o) => o !== item && o.url.split("?")[0].startsWith(`${item.url.split("?")[0]}/`));

const isItemActive = (location: Loc, item: NavItem, siblings: NavItem[]) =>
  isNavActive(location, item.url, itemIsExact(item, siblings));

const groupHasActive = (location: Loc, group: NavGroup): boolean =>
  (group.items ?? []).some((item) => isItemActive(location, item, group.items ?? [])) ||
  (group.children ?? []).some((child) => groupHasActive(location, child));

/** Ids of `target` and all its ancestors, outermost first (empty if not found). */
const groupChain = (groups: NavGroup[], target: string): string[] => {
  for (const group of groups) {
    if (group.id === target) return [group.id];
    const inner = groupChain(group.children ?? [], target);
    if (inner.length) return [group.id, ...inner];
  }
  return [];
};

const allGroups = (): NavGroup[] =>
  NAV.flatMap((section) => section.entries.filter(isNavGroup));

const navItemCls =
  "relative flex items-center w-full text-left text-sidebar-foreground " +
  "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground " +
  "data-[active=true]:bg-sidebar-primary/20 data-[active=true]:text-sidebar-primary-foreground data-[active=true]:font-medium " +
  "data-[active=true]:before:absolute data-[active=true]:before:left-0 data-[active=true]:before:top-1.5 " +
  "data-[active=true]:before:bottom-1.5 data-[active=true]:before:w-[3px] data-[active=true]:before:rounded-full " +
  "data-[active=true]:before:bg-sidebar-primary";

export function AppSidebar() {
  const location = useLocation();
  const visibleNav = useVisibleNav();
  const [openIds, setOpenIds] = useState<string[]>([]);

  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const groups = useMemo(allGroups, []);

  // Open the chain of groups containing the current route (replaces the old
  // path-substring else-if chain); unmatched routes such as the dashboard collapse everything.
  useEffect(() => {
    const active = groups.find((group) => groupHasActive(location, group));
    if (!active) {
      setOpenIds([]);
      return;
    }
    const ids: string[] = [active.id];
    let current: NavGroup | undefined = active;
    while (current) {
      const next: NavGroup | undefined = (current.children ?? []).find((child) =>
        groupHasActive(location, child),
      );
      if (next) ids.push(next.id);
      current = next;
    }
    setOpenIds(ids);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, location.search, groups]);

  const toggle = (id: string, isOpen: boolean) => {
    if (!isOpen) {
      setOpenIds((ids) => ids.filter((x) => x !== id));
      return;
    }
    // Accordion behaviour: opening a group closes unrelated ones.
    setOpenIds(groupChain(groups, id));
  };

  return (
    <Sidebar className={isCollapsed ? "w-16" : "w-64"} collapsible="icon">
      <SidebarContent className="bg-sidebar border-r border-sidebar-border gap-0">
        {/* Logo Section */}
        <div
          className={`border-b border-sidebar-border ${isCollapsed ? "py-4 px-2" : "p-4"}`}
        >
          {!isCollapsed ? (
            <div className="flex items-center justify-center rounded-lg bg-white px-3 py-2 shadow-sm">
              <img
                src={Logo}
                alt="Z&S"
                className="h-8 w-auto max-w-full object-contain"
              />
            </div>
          ) : (
            <div className="w-8 h-8 bg-sidebar-primary rounded-md flex items-center justify-center mx-auto">
              <span className="text-sidebar-primary-foreground font-bold text-sm">
                Z&S
              </span>
            </div>
          )}
        </div>

        {/* Search */}
        <SidebarGroup className="py-2">
          <SidebarMenu>
            {isCollapsed ? (
              <SidebarMenuItem>
                <NavSearchTrigger variant="sidebar-icon" />
              </SidebarMenuItem>
            ) : (
              <NavSearchTrigger variant="sidebar" />
            )}
          </SidebarMenu>
        </SidebarGroup>

        {visibleNav.map((section) => {
          const entries = section.entries;
          return (
            <SidebarGroup key={section.id} className="py-1">
              {!isCollapsed && (
                <SidebarGroupLabel className="h-7 px-2 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">
                  {section.label}
                </SidebarGroupLabel>
              )}
              <SidebarMenu>
                {entries.map((entry) =>
                  isNavGroup(entry) ? (
                    <NavGroupItem
                      key={entry.id}
                      group={entry}
                      location={location}
                      isCollapsed={isCollapsed}
                      openIds={openIds}
                      onToggle={toggle}
                    />
                  ) : (
                    <NavLinkItem
                      key={entry.url}
                      item={entry}
                      location={location}
                      isCollapsed={isCollapsed}
                      exact={entry.url === "/"}
                    />
                  ),
                )}
              </SidebarMenu>
            </SidebarGroup>
          );
        })}
      </SidebarContent>
    </Sidebar>
  );
}

function NavLinkItem({
  item,
  location,
  isCollapsed,
  exact = false,
  small = false,
  title = item.title,
  Icon = item.icon,
}: {
  item: NavItem;
  location: Loc;
  isCollapsed: boolean;
  exact?: boolean;
  small?: boolean;
  title?: string;
  Icon?: LucideIcon;
}) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        size={small ? "sm" : "default"}
        tooltip={title}
        isActive={isNavActive(location, item.url, exact)}
      >
        <NavLink to={item.url} end={exact} className={navItemCls}>
          <Icon className={small ? "h-4 w-4 flex-shrink-0" : "h-5 w-5 flex-shrink-0"} />
          {!isCollapsed && <span className="ml-2">{title}</span>}
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function NavGroupItem({
  group,
  location,
  isCollapsed,
  openIds,
  onToggle,
  nested = false,
}: {
  group: NavGroup;
  location: Loc;
  isCollapsed: boolean;
  openIds: string[];
  onToggle: (id: string, isOpen: boolean) => void;
  nested?: boolean;
}) {
  const items = group.items ?? [];
  const children = group.children ?? [];
  const open = openIds.includes(group.id);

  // A group with a single page and no sub-groups is just a link.
  if (items.length === 1 && children.length === 0) {
    return (
      <NavLinkItem
        item={items[0]}
        title={group.title}
        Icon={group.icon}
        location={location}
        isCollapsed={isCollapsed}
        small={nested}
      />
    );
  }

  const Icon = group.icon;

  // Collapsed rail: no inline expansion, so a click opens a flyout menu beside the icon
  // (tooltip with the group name shows on hover).
  if (isCollapsed) {
    return (
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              tooltip={group.title}
              isActive={groupHasActive(location, group)}
              className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-primary/20 data-[active=true]:text-sidebar-primary-foreground data-[state=open]:bg-sidebar-accent"
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              <span className="sr-only">{group.title}</span>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="right"
            align="start"
            sideOffset={8}
            className="min-w-48 border-sidebar-border bg-sidebar text-sidebar-foreground"
          >
            <FlyoutContent group={group} location={location} />
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    );
  }

  return (
    <SidebarMenuItem>
      <Collapsible open={!isCollapsed && open} onOpenChange={(isOpen) => onToggle(group.id, isOpen)}>
        <CollapsibleTrigger
          title={isCollapsed ? group.title : undefined}
          className={`flex items-center w-full p-2 text-sm font-medium rounded-md transition-colors ${
            open
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : groupHasActive(location, group)
                ? "text-sidebar-accent-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
          }`}
        >
          <Icon className="h-4 w-4 flex-shrink-0" />
          {!isCollapsed && (
            <>
              <span className="ml-2">{group.title}</span>
              <ChevronRight
                className={`h-4 w-4 ml-auto transition-transform ${open ? "rotate-90" : ""}`}
              />
            </>
          )}
        </CollapsibleTrigger>
        {!isCollapsed && (
          <CollapsibleContent
            className={`ml-4 mt-1 space-y-1 border-l pl-2 transition-colors ${
              open ? "border-sidebar-primary/60" : "border-sidebar-border"
            }`}
          >
            {children.length > 0 && (
              <SidebarMenu>
                {children.map((child) => (
                  <NavGroupItem
                    key={child.id}
                    nested
                    group={child}
                    location={location}
                    isCollapsed={isCollapsed}
                    openIds={openIds}
                    onToggle={onToggle}
                  />
                ))}
              </SidebarMenu>
            )}
            <SidebarMenu>
              {items.map((item) => (
                <NavLinkItem
                  key={item.url}
                  small
                  item={item}
                  location={location}
                  isCollapsed={isCollapsed}
                  exact={itemIsExact(item, items)}
                />
              ))}
            </SidebarMenu>
          </CollapsibleContent>
        )}
      </Collapsible>
    </SidebarMenuItem>
  );
}

const flyoutItemCls =
  "cursor-pointer focus:bg-sidebar-accent focus:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-primary/20 data-[active=true]:text-sidebar-primary-foreground";

function FlyoutContent({ group, location }: { group: NavGroup; location: Loc }) {
  const items = group.items ?? [];
  return (
    <>
      <DropdownMenuLabel className="text-xs uppercase tracking-wider text-sidebar-foreground/60">
        {group.title}
      </DropdownMenuLabel>
      {(group.children ?? []).map((child) => (
        <DropdownMenuSub key={child.id}>
          <DropdownMenuSubTrigger className="focus:bg-sidebar-accent focus:text-sidebar-accent-foreground data-[state=open]:bg-sidebar-accent">
            <child.icon className="mr-2 h-4 w-4" />
            {child.title}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="min-w-44 border-sidebar-border bg-sidebar text-sidebar-foreground">
            {(child.items ?? []).map((item) => (
              <FlyoutLink
                key={item.url}
                item={item}
                active={isItemActive(location, item, child.items ?? [])}
              />
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      ))}
      {items.map((item) => (
        <FlyoutLink key={item.url} item={item} active={isItemActive(location, item, items)} />
      ))}
    </>
  );
}

function FlyoutLink({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <DropdownMenuItem asChild data-active={active} className={flyoutItemCls}>
      <NavLink to={item.url}>
        <item.icon className="mr-2 h-4 w-4" />
        {item.title}
      </NavLink>
    </DropdownMenuItem>
  );
}
