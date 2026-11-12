import * as React from "react"
import { Check, ChevronsUpDown, Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export interface AsyncComboboxOption {
  value: string
  label: string
}

interface AsyncComboboxProps {
  /** Fetch one page of options; the server does the searching and paging. */
  fetchPage: (
    search: string,
    page: number,
    signal?: AbortSignal
  ) => Promise<{ options: AsyncComboboxOption[]; hasMore: boolean }>
  value?: string
  onChange: (value: string) => void
  /** Label shown for `value` when it is not among the loaded options. */
  selectedLabel?: string
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  disabled?: boolean
  className?: string
  maxVisibleItems?: number
}

const SEARCH_DEBOUNCE_MS = 300

/**
 * Combobox for large lists: nothing is fetched until it opens, results are
 * searched and paged by the server (first page on open, more on scroll), and
 * only { value, label } is kept per option.
 */
export function AsyncCombobox({
  fetchPage,
  value,
  onChange,
  selectedLabel,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  emptyText = "No results found.",
  disabled,
  className,
  maxVisibleItems,
}: AsyncComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const [debouncedSearch, setDebouncedSearch] = React.useState("")
  const [options, setOptions] = React.useState<AsyncComboboxOption[]>([])
  const [page, setPage] = React.useState(0)
  const [hasMore, setHasMore] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  // Label of an item picked in this session, so the trigger keeps showing it.
  const [pickedLabel, setPickedLabel] = React.useState<{ value: string; label: string } | null>(null)

  // Always call the latest fetcher without re-triggering the load effect.
  const fetchRef = React.useRef(fetchPage)
  fetchRef.current = fetchPage
  const abortRef = React.useRef<AbortController | null>(null)

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [search])

  const load = React.useCallback(async (term: string, nextPage: number) => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setLoading(true)
    setError(null)
    try {
      const result = await fetchRef.current(term, nextPage, controller.signal)
      if (controller.signal.aborted) return
      setOptions((prev) => (nextPage === 1 ? result.options : [...prev, ...result.options]))
      setPage(nextPage)
      setHasMore(result.hasMore)
    } catch (err) {
      if (controller.signal.aborted) return
      setError(err instanceof Error ? err.message : "Failed to load options")
    } finally {
      if (!controller.signal.aborted) setLoading(false)
    }
  }, [])

  // (Re)load the first page when the popover opens or the search term settles.
  React.useEffect(() => {
    if (!open) return
    setOptions([])
    setHasMore(false)
    load(debouncedSearch, 1)
    return () => abortRef.current?.abort()
  }, [open, debouncedSearch, load])

  const loadMore = () => {
    if (!loading && hasMore) load(debouncedSearch, page + 1)
  }

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const el = event.currentTarget
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 32) loadMore()
  }

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (!next) {
      setSearch("")
      setDebouncedSearch("")
    }
  }

  const displayLabel =
    options.find((o) => o.value === value)?.label ??
    (pickedLabel?.value === value ? pickedLabel.label : undefined) ??
    selectedLabel
  const hasSelection = Boolean(value) && Boolean(displayLabel)

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full max-w-sm justify-between font-normal",
            !hasSelection && "text-muted-foreground",
            className
          )}
        >
          <span className="truncate">{hasSelection ? displayLabel : placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] min-w-[16rem] p-0">
        <Command shouldFilter={false}>
          <CommandInput placeholder={searchPlaceholder} value={search} onValueChange={setSearch} />
          <CommandList
            onScroll={handleScroll}
            style={maxVisibleItems ? { maxHeight: maxVisibleItems * 32 + 8 } : undefined}
          >
            {!loading && !error && options.length === 0 && <CommandEmpty>{emptyText}</CommandEmpty>}
            {error && <div className="px-3 py-4 text-center text-sm text-destructive">{error}</div>}
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={() => {
                    setPickedLabel({ value: option.value, label: option.label })
                    onChange(option.value)
                    handleOpenChange(false)
                  }}
                >
                  <Check
                    className={cn("mr-2 h-4 w-4 shrink-0", option.value === value ? "opacity-100" : "opacity-0")}
                  />
                  <span className="truncate">{option.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
            {loading && (
              <div className="flex items-center justify-center py-3 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            )}
            {!loading && hasMore && (
              <button
                type="button"
                onClick={loadMore}
                className="w-full py-2 text-center text-xs text-muted-foreground hover:text-foreground"
              >
                Load more
              </button>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
