import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Search } from "lucide-react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { useVisibleNav } from "@/hooks/useVisibleNav";
import { usePermissions } from "@/hooks/usePermissions";
import { flattenNav, moduleForPath, QUICK_ACTIONS, type SearchEntry } from "@/config/navigation";

const RECENT_KEY = "admin-nav-recent";
const MAX_RECENT = 5;

const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);
const shortcutLabel = isMac ? "⌘K" : "Ctrl K";

const readRecent = (): string[] => {
  try {
    const parsed = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((u) => typeof u === "string") : [];
  } catch {
    return [];
  }
};

const writeRecent = (urls: string[]) => {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(urls));
  } catch {
    /* storage unavailable — recents are a convenience only */
  }
};

type Variant = "header" | "sidebar" | "sidebar-icon";

const OPEN_EVENT = "open-nav-search";

/** Mount once (in the layout): owns the dialog and the Cmd/Ctrl+K shortcut. */
export function NavSearchDialog() {
  const [open, setOpen] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const navigate = useNavigate();
  const location = useLocation();
  const sections = useVisibleNav();
  const { can } = usePermissions();

  const entries = useMemo(() => flattenNav(sections), [sections]);
  const bySection = useMemo(() => {
    const map = new Map<string, SearchEntry[]>();
    for (const entry of entries) {
      map.set(entry.section, [...(map.get(entry.section) ?? []), entry]);
    }
    return [...map.entries()];
  }, [entries]);

  // "New …" shortcuts need manage access to the module that owns the route.
  const actions = useMemo(
    () => QUICK_ACTIONS.filter((a) => can(moduleForPath(a.url), "manage")),
    [can],
  );

  const recentEntries = useMemo(
    () =>
      recent
        .map((url) => entries.find((e) => e.url === url))
        .filter((e): e is SearchEntry => Boolean(e)),
    [recent, entries],
  );

  useEffect(() => {
    const onOpen = () => {
      setRecent(readRecent());
      setOpen(true);
    };
    window.addEventListener(OPEN_EVENT, onOpen);
    const onKey = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setRecent(readRecent());
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_EVENT, onOpen);
    };
  }, []);

  const go = (url: string) => {
    setOpen(false);
    const next = [url, ...readRecent().filter((u) => u !== url)].slice(0, MAX_RECENT);
    writeRecent(next);
    if (`${location.pathname}${location.search}` !== url) navigate(url);
  };

  const row = (entry: SearchEntry, keyPrefix: string) => (
    <CommandItem
      key={`${keyPrefix}-${entry.url}`}
      value={`${keyPrefix} ${entry.value}`}
      onSelect={() => go(entry.url)}
    >
      <entry.icon className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="flex min-w-0 flex-col">
        <span className="truncate">{entry.title}</span>
        <span className="truncate text-xs text-muted-foreground">{entry.breadcrumb}</span>
      </div>
    </CommandItem>
  );

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search pages, e.g. banners, tags, seo…" />
      <CommandList className="max-h-[60vh]">
        <CommandEmpty>No pages found.</CommandEmpty>
        {recentEntries.length > 0 && (
          <CommandGroup heading="Recent">
            {recentEntries.map((entry) => row(entry, "recent"))}
          </CommandGroup>
        )}
        {actions.length > 0 && (
          <CommandGroup heading="Actions">
            {actions.map((action) => (
              <CommandItem
                key={action.url}
                value={`action ${action.title} create add`}
                onSelect={() => go(action.url)}
              >
                <action.icon className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                {action.title}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {bySection.map(([label, items]) => (
          <CommandGroup key={label} heading={label}>
            {items.map((entry) => row(entry, "page"))}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  );
}

/** Trigger buttons; they just ask the mounted dialog to open. */
export function NavSearchTrigger({ variant }: { variant: Variant }) {
  const open = () => window.dispatchEvent(new Event(OPEN_EVENT));

  if (variant === "header") {
    return (
      <Button
        variant="outline"
        onClick={open}
        aria-label="Search pages"
        className="h-9 w-9 justify-center p-0 text-muted-foreground sm:w-64 sm:justify-start sm:px-3"
      >
        <Search className="h-4 w-4 sm:mr-2" />
        <span className="hidden flex-1 text-left text-sm font-normal sm:inline">Search pages…</span>
        <kbd className="pointer-events-none hidden rounded border bg-muted px-1.5 text-[10px] font-medium sm:inline">
          {shortcutLabel}
        </kbd>
      </Button>
    );
  }

  if (variant === "sidebar-icon") {
    return (
      <SidebarMenuButton tooltip={`Search (${shortcutLabel})`} onClick={open} className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
        <Search className="h-5 w-5 flex-shrink-0" />
        <span className="sr-only">Search pages</span>
      </SidebarMenuButton>
    );
  }

  return (
    <button
      type="button"
      onClick={open}
      className="flex w-full items-center gap-2 rounded-md border border-sidebar-border bg-sidebar-accent/40 px-3 py-2 text-sm text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
    >
      <Search className="h-4 w-4 flex-shrink-0" />
      <span className="flex-1 text-left">Search…</span>
      <kbd className="rounded border border-sidebar-border px-1.5 text-[10px] font-medium">
        {shortcutLabel}
      </kbd>
    </button>
  );
}
