import React, { useState, useEffect } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { useCanManage } from "@/hooks/useCanManage";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ChevronDown,
  Search,
  Download,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Filter,
  Trash2,
  FileText,
  FileSpreadsheet,
  ArrowLeft,
} from "lucide-react";

const PAGE_SIZE_OPTIONS = [10, 20, 30, 40, 50];

// Always include the current page size, even when a caller uses a default
// (e.g. 15) outside the standard list — otherwise the Select has a value with
// no matching item and renders blank.
const buildPageSizeOptions = (size: number) =>
  PAGE_SIZE_OPTIONS.includes(size)
    ? PAGE_SIZE_OPTIONS
    : [...PAGE_SIZE_OPTIONS, size].sort((a, b) => a - b);

export interface FilterOption {
  id: string;
  label: string;
  type: "select" | "dateRange" | "toggle";
  options?: { label: string; value: string }[];
}

interface PaginationProps {
  currentPage: number;
  totalPages?: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  pageSize?: number;
  onPageSizeChange?: (size: number) => void;
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  title?: string;
  searchPlaceholder?: string;
  onAdd?: () => void;
  addButtonText?: string;
  showAddButton?: boolean;
  filters?: FilterOption[];
  onExport?: (type: "csv" | "excel" | "pdf", selectedRows?: any[]) => void;
  onBulkAction?: (action: string, selectedRows: any[]) => void;
  bulkActions?: { label: string; value: string; icon?: React.ReactNode }[];
  loading?: boolean;
  searching?: boolean;
  pagination?: PaginationProps;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  headerExtra?: React.ReactNode;
  onBack?: () => void;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  title,
  searchPlaceholder = "Search...",
  onAdd,
  addButtonText = "Add New",
  showAddButton = true,
  filters = [],
  onExport,
  onBulkAction,
  bulkActions = [],
  loading = false,
  searching = false,
  pagination,
  searchQuery,
  onSearchChange,
  headerExtra,
  onBack,
}: DataTableProps<TData, TValue>) {
  const canManage = useCanManage();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  // Initialize column visibility with default hidden columns
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    () => {
      const initialVisibility: VisibilityState = {};
      columns.forEach((column: any) => {
        if (column.meta?.defaultVisible === false) {
          initialVisibility[column.accessorKey || column.id] = false;
        }
      });
      return initialVisibility;
    },
  );

  const [rowSelection, setRowSelection] = useState({});
  const [globalFilter, setGlobalFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [localSearching, setLocalSearching] = useState(false);

  // Use external search query if provided, otherwise use internal globalFilter
  const effectiveSearchQuery =
    searchQuery !== undefined ? searchQuery : globalFilter;
  const setEffectiveSearchQuery = onSearchChange || setGlobalFilter;

  // Show brief animation for local search (when no external search management)
  useEffect(() => {
    if (!onSearchChange && effectiveSearchQuery !== "") {
      setLocalSearching(true);
      const timer = setTimeout(() => setLocalSearching(false), 200);
      return () => clearTimeout(timer);
    } else if (effectiveSearchQuery === "") {
      setLocalSearching(false);
    }
  }, [effectiveSearchQuery, onSearchChange]);

  // Combine external and local searching states
  const showSearchAnimation = searching || localSearching;

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: pagination ? undefined : getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    // When the caller owns search (passes onSearchChange), filtering already
    // happened server-side — skip the client-side global filter so it can't
    // double-filter (or diverge from) what the server already returned.
    getFilteredRowModel: onSearchChange ? undefined : getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: "includesString",
    manualPagination: !!pagination,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter: effectiveSearchQuery,
    },
  });

  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const hasSelectedRows = selectedRows.length > 0;

  const handleBulkAction = (action: string) => {
    if (onBulkAction && hasSelectedRows) {
      onBulkAction(
        action,
        selectedRows.map((row) => row.original),
      );
    }
  };

  const handleExport = (type: "csv" | "excel" | "pdf") => {
    if (onExport) {
      onExport(
        type,
        hasSelectedRows ? selectedRows.map((row) => row.original) : undefined,
      );
    }
  };

  return (
    <div className="min-w-0 space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button
              variant="outline"
              size="icon"
              onClick={onBack}
              aria-label="Back"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div>
            {title && (
              <h1 className="text-2xl font-bold text-foreground">{title}</h1>
            )}
            <p className="text-muted-foreground">
              Manage your {title?.toLowerCase() || "items"}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {headerExtra}
          {onAdd && showAddButton && canManage && (
            <Button onClick={onAdd} className="bg-primary hover:bg-primary/90">
              {addButtonText}
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex min-w-0 items-center space-x-2 flex-1">
              <div className="relative flex-1 max-w-sm">
                {showSearchAnimation ? (
                  <div className="absolute left-2 top-2.5 h-4 w-4 animate-spin rounded-full border-b-2 border-primary"></div>
                ) : (
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                )}
                <Input
                  placeholder={searchPlaceholder}
                  value={effectiveSearchQuery ?? ""}
                  onChange={(event) =>
                    setEffectiveSearchQuery(event.target.value)
                  }
                  className="pl-8"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {/* Advanced Filters Toggle */}
              {filters.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="mr-2 h-4 w-4" />
                  Filters
                  <ChevronDown
                    className={`ml-2 h-4 w-4 transition-transform ${showFilters ? "rotate-180" : ""}`}
                  />
                </Button>
              )}

              {/* Column visibility */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Settings className="mr-2 h-4 w-4" />
                    View
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {table
                    .getAllColumns()
                    .filter((column) => column.getCanHide())
                    .map((column) => {
                      return (
                        <DropdownMenuCheckboxItem
                          key={column.id}
                          className="capitalize"
                          checked={column.getIsVisible()}
                          onCheckedChange={(value) =>
                            column.toggleVisibility(!!value)
                          }
                        >
                          {column.id}
                        </DropdownMenuCheckboxItem>
                      );
                    })}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Export */}
              {onExport && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Download className="mr-2 h-4 w-4" />
                      Export
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleExport("csv")}>
                      <FileText className="mr-2 h-4 w-4" />
                      Export as CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport("excel")}>
                      <FileSpreadsheet className="mr-2 h-4 w-4" />
                      Export as Excel
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport("pdf")}>
                      <FileText className="mr-2 h-4 w-4" />
                      Export as PDF
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>

          {/* Advanced Filters */}
          <Collapsible open={showFilters} onOpenChange={setShowFilters}>
            <CollapsibleContent className="space-y-4">
              {filters.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
                  {filters.map((filter) => (
                    <div key={filter.id} className="space-y-2">
                      <label className="text-sm font-medium">
                        {filter.label}
                      </label>
                      {filter.type === "select" && filter.options && (
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            {filter.options.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      {filter.type === "toggle" && (
                        <div className="flex items-center space-x-2">
                          <Checkbox id={filter.id} />
                          <label htmlFor={filter.id} className="text-sm">
                            Active only
                          </label>
                        </div>
                      )}
                    </div>
                  ))}
                  <div className="flex items-end">
                    <Button variant="ghost" size="sm">
                      Clear Filters
                    </Button>
                  </div>
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>

          {/* Selection info and bulk actions */}
          {hasSelectedRows && (
            <div className="flex items-center justify-between bg-muted/50 p-3 rounded-lg">
              <Badge variant="secondary">
                {selectedRows.length} of{" "}
                {table.getFilteredRowModel().rows.length} row(s) selected
              </Badge>
              <div className="flex items-center space-x-2">
                {bulkActions.length > 0 && onBulkAction && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        Bulk Actions
                        <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {bulkActions.map((action, index) => (
                        <DropdownMenuItem
                          key={action.value}
                          onClick={() => handleBulkAction(action.value)}
                        >
                          {action.icon && (
                            <span className="mr-2">{action.icon}</span>
                          )}
                          {action.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleBulkAction("delete")}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Selected
                </Button>
              </div>
            </div>
          )}
        </CardHeader>

        <CardContent>
          {/* Table */}
          <div className="w-full max-w-full overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header, index) => (
                      <TableHead
                        key={header.id}
                        className={`text-left${
                          index < headerGroup.headers.length - 1
                            ? " border-r"
                            : ""
                        }`}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {loading && !data.length ? (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                        <span>Loading...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                    >
                      {row.getVisibleCells().map((cell, index) => (
                        <TableCell
                          key={cell.id}
                          className={`text-left${
                            index < row.getVisibleCells().length - 1
                              ? " border-r"
                              : ""
                          }`}
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      No results found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {pagination ? (
            <div className="flex flex-wrap items-center justify-between gap-2 py-4">
              <div className="flex items-center space-x-2">
                {/* <p className="text-sm text-muted-foreground">
                  {table.getFilteredSelectedRowModel().rows.length} of{" "}
                  {pagination ? pagination.totalCount : data.length} row(s) selected
                </p> */}
                {pagination.onPageSizeChange && (
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium">Rows per page</p>
                    <Select
                      value={`${pagination.pageSize || 10}`}
                      onValueChange={(value) => {
                        pagination.onPageSizeChange?.(Number(value));
                      }}
                    >
                      <SelectTrigger className="h-8 w-[100px]">
                        <SelectValue placeholder={pagination.pageSize || 10} />
                      </SelectTrigger>
                      <SelectContent side="top">
                        {buildPageSizeOptions(pagination.pageSize || 10).map((pageSize) => (
                          <SelectItem key={pageSize} value={`${pageSize}`}>
                            {pageSize}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-6 lg:space-x-8">
                <div className="flex w-[150px] items-center justify-center text-sm font-medium">
                  Page {pagination.currentPage} of{" "}
                  {pagination.totalPages ||
                    Math.ceil(
                      pagination.totalCount / (pagination.pageSize || 10),
                    )}
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    className="hidden h-8 w-8 p-0 lg:flex"
                    onClick={() => pagination.onPageChange(1)}
                    disabled={pagination.currentPage <= 1}
                  >
                    <span className="sr-only">Go to first page</span>
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    className="h-8 w-8 p-0"
                    onClick={() =>
                      pagination.onPageChange(pagination.currentPage - 1)
                    }
                    disabled={pagination.currentPage <= 1}
                  >
                    <span className="sr-only">Go to previous page</span>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    className="h-8 w-8 p-0"
                    onClick={() =>
                      pagination.onPageChange(pagination.currentPage + 1)
                    }
                    disabled={
                      pagination.currentPage >=
                      (pagination.totalPages ||
                        Math.ceil(
                          pagination.totalCount / (pagination.pageSize || 10),
                        ))
                    }
                  >
                    <span className="sr-only">Go to next page</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    className="hidden h-8 w-8 p-0 lg:flex"
                    onClick={() =>
                      pagination.onPageChange(
                        pagination.totalPages ||
                          Math.ceil(
                            pagination.totalCount / (pagination.pageSize || 10),
                          ),
                      )
                    }
                    disabled={
                      pagination.currentPage >=
                      (pagination.totalPages ||
                        Math.ceil(
                          pagination.totalCount / (pagination.pageSize || 10),
                        ))
                    }
                  >
                    <span className="sr-only">Go to last page</span>
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-2 py-4">
              <div className="flex items-center space-x-2">
                <p className="text-sm text-muted-foreground">
                  {table.getFilteredSelectedRowModel().rows.length} of{" "}
                  {table.getFilteredRowModel().rows.length} row(s) selected
                </p>
              </div>
              <div className="flex items-center space-x-6 lg:space-x-8">
                <div className="flex items-center space-x-2">
                  <p className="text-sm font-medium">Rows per page</p>
                  <Select
                    value={`${table.getState().pagination.pageSize}`}
                    onValueChange={(value) => {
                      table.setPageSize(Number(value));
                    }}
                  >
                    <SelectTrigger className="h-8 w-[100px]">
                      <SelectValue
                        placeholder={table.getState().pagination.pageSize}
                      />
                    </SelectTrigger>
                    <SelectContent side="top">
                      {buildPageSizeOptions(
                        table.getState().pagination.pageSize || 10,
                      ).map((pageSize) => (
                        <SelectItem key={pageSize} value={`${pageSize}`}>
                          {pageSize}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                  Page {table.getState().pagination.pageIndex + 1} of{" "}
                  {table.getPageCount()}
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    className="hidden h-8 w-8 p-0 lg:flex"
                    onClick={() => table.setPageIndex(0)}
                    disabled={!table.getCanPreviousPage()}
                  >
                    <span className="sr-only">Go to first page</span>
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    className="h-8 w-8 p-0"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                  >
                    <span className="sr-only">Go to previous page</span>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    className="h-8 w-8 p-0"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                  >
                    <span className="sr-only">Go to next page</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    className="hidden h-8 w-8 p-0 lg:flex"
                    onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                    disabled={!table.getCanNextPage()}
                  >
                    <span className="sr-only">Go to last page</span>
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
