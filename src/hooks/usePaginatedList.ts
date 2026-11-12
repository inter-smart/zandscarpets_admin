import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { parseAsInteger, parseAsString, useQueryStates } from "nuqs";

interface PaginatedResponse<T> {
  data: {
    data: T[];
    pagination: {
      totalCount: number;
      totalPages: number;
      currentPage: number;
      limit: number;
    };
  };
}

type Fetcher<T, F> = (
  page: number,
  limit: number,
  search?: string,
  filters?: F
) => Promise<PaginatedResponse<T>>;

const SEARCH_DEBOUNCE_MS = 600;

export function usePaginatedList<T, F = undefined>(
  fetcher: Fetcher<T, F>,
  initialLimit = 10,
  filters?: F
) {
  const [urlState, setUrlState] = useQueryStates(
    {
      page: parseAsInteger.withDefault(1),
      limit: parseAsInteger.withDefault(initialLimit),
      search: parseAsString.withDefault(""),
    },
    { history: "replace", shallow: false }
  );

  const page = urlState.page;
  const limit = urlState.limit;
  const committedSearch = urlState.search;

  const [items, setItems] = useState<T[]>([]);
  const [itemsPage, setItemsPage] = useState(page);
  const [itemsLimit, setItemsLimit] = useState(limit);
  const [searchInput, setSearchInput] = useState(committedSearch);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters are usually an inline object; the fetcher reads the latest value
  // through a ref while `filtersKey` (by value) drives refetch/reset.
  const filtersKey = JSON.stringify(filters ?? null);
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  const setPage = useCallback(
    (next: number) => setUrlState({ page: next }),
    [setUrlState]
  );
  const setLimit = useCallback(
    (next: number) => setUrlState({ limit: next }),
    [setUrlState]
  );

  // Debounce the search box, then commit it (resetting to page 1) into the URL.
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== committedSearch) {
        setUrlState({
          search: searchInput.trim() ? searchInput : null,
          page: 1,
        });
      }
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
    // committedSearch is read fresh; only searchInput should restart the timer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  // Keep the input in sync when the URL changes from outside (back/forward,
  // shared link) without clobbering the value while the user is typing.
  useEffect(() => {
    setSearchInput((current) =>
      current === committedSearch ? current : committedSearch
    );
  }, [committedSearch]);

  // Filters are persisted in the URL; when they change, restart from page 1.
  const previousFiltersKey = useRef(filtersKey);
  useEffect(() => {
    if (previousFiltersKey.current === filtersKey) return;
    previousFiltersKey.current = filtersKey;
    setUrlState({ page: 1 });
  }, [filtersKey, setUrlState]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetcher(
        page,
        limit,
        committedSearch || undefined,
        filtersRef.current
      );
      setItems(response.data.data);
      setItemsPage(page);
      setItemsLimit(limit);
      setTotalCount(response.data.pagination.totalCount);
      setTotalPages(response.data.pagination.totalPages);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
    // `filtersKey` is read via ref for the value, but must be a dep so a filter
    // change refetches even when the page/search stay the same.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetcher, page, limit, committedSearch, filtersKey]);

  useEffect(() => {
    load();
  }, [load]);

  const searching = searchInput !== committedSearch;

  return {
    items,
    setItems,
    page,
    setPage,
    limit,
    setLimit,
    searchInput,
    setSearchInput,
    totalCount,
    totalPages,
    loading,
    searching,
    itemsPage,
    itemsLimit,
    refetch: load,
  };
}
