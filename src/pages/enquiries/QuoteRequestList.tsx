import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/common/DataTable";
import RowActionsMenu from "@/components/common/RowActionsMenu";
import DeleteDialogue from "@/components/common/DeleteDialogue";
import FilterField from "@/components/common/FilterField";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { useUrlFilters } from "@/hooks/useUrlFilters";
import {
  fetchQuoteRequestList,
  deleteQuoteRequest,
  QuoteRequestRecord,
  QuoteRequestFilters,
  QuoteRequestStatus,
  ApiError,
} from "@/services/enquiries/quoteRequestApi";
import {
  QUOTE_STATUS_LABELS,
  QUOTE_STATUS_BADGE_VARIANT,
  QUOTE_STATUS_OPTIONS,
} from "@/lib/quoteRequestStatus";

const ALL = "all";

export default function QuoteRequestList() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [deleteItemId, setDeleteItemId] = useState<number | null>(null);

  const { filters: listFilters, setFilter, reset: resetListFilters } = useUrlFilters({
    status: ALL,
  });
  const statusFilter = listFilters.status;

  const filters = useMemo<QuoteRequestFilters>(
    () => ({ status: statusFilter === ALL ? undefined : (statusFilter as QuoteRequestStatus) }),
    [statusFilter],
  );

  const {
    items: requests,
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
    refetch,
  } = usePaginatedList<QuoteRequestRecord, QuoteRequestFilters>(fetchQuoteRequestList, 10, filters);

  const hasActiveFilters = statusFilter !== ALL || searchInput !== "";

  const resetAll = () => {
    resetListFilters();
    setSearchInput("");
    setPage(1);
  };

  const confirmDelete = async () => {
    if (!deleteItemId) return;

    try {
      await deleteQuoteRequest(deleteItemId);
      if (requests.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        refetch();
      }
      toast({ title: "Success", description: "Quote request deleted successfully" });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof ApiError ? error.message : "Failed to delete quote request",
        variant: "destructive",
      });
    } finally {
      setDeleteItemId(null);
    }
  };

  const columns: ColumnDef<QuoteRequestRecord>[] = [
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ row }) => (
        <div className="font-mono">
          {(itemsPage - 1) * itemsLimit + row.index + 1}
        </div>
      ),
    },
    {
      accessorKey: "reference_code",
      header: "Reference",
      cell: ({ row }) => (
        <div className="font-mono font-medium">{row.original.reference_code || "-"}</div>
      ),
    },
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>,
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => <div className="text-sm">{row.getValue("email")}</div>,
    },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }) => <div className="text-sm">{row.getValue("phone")}</div>,
    },
    {
      id: "item_count",
      header: "Items",
      cell: ({ row }) => (
        <div className="text-sm">{row.original.items?.length ?? "-"}</div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={QUOTE_STATUS_BADGE_VARIANT[row.original.status]}>
          {QUOTE_STATUS_LABELS[row.original.status]}
        </Badge>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Submitted At",
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">
          {row.getValue("createdAt")
            ? new Date(row.getValue("createdAt")).toLocaleDateString()
            : "-"}
        </div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const item = row.original;
        return (
          <RowActionsMenu
            onView={() => navigate(`/quote-requests/${item.id}`)}
            onDelete={() => setDeleteItemId(item.id)}
          />
        );
      },
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        data={requests}
        title="Quote Requests"
        searchPlaceholder="Search quote requests..."
        loading={loading}
        searching={searching}
        searchQuery={searchInput}
        onSearchChange={setSearchInput}
        headerExtra={
          <>
            <FilterField label="Status">
              <Select value={statusFilter} onValueChange={(value) => setFilter("status", value)}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All</SelectItem>
                  {QUOTE_STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterField>
            <Button variant="outline" size="sm" onClick={resetAll} disabled={!hasActiveFilters}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset
            </Button>
          </>
        }
        pagination={{
          currentPage: page,
          totalPages,
          totalCount,
          onPageChange: setPage,
          pageSize: limit,
          onPageSizeChange: (size) => {
            setLimit(size);
            setPage(1);
          },
        }}
      />

      <DeleteDialogue
        deleteItemId={deleteItemId}
        setDeleteItemId={setDeleteItemId}
        confirmDelete={confirmDelete}
        itemLabel="Quote Request"
      />
    </>
  );
}
