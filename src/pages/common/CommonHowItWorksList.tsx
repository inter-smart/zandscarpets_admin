import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/common/DataTable";
import SortOrderCell from "@/components/common/SortOrderCell";
import StatusToggleCell from "@/components/common/StatusToggleCell";
import RowActionsMenu from "@/components/common/RowActionsMenu";
import {
  fetchCommonHowItWorksList,
  deleteCommonHowItWorks,
  toggleCommonHowItWorksStatus,
  updateCommonHowItWorksSortOrder,
  CommonHowItWorksRecord,
  ApiError,
} from "@/services/common/commonHowItWorksApi";
import { useToast } from "@/hooks/use-toast";
import { useSortOrder } from "@/hooks/useSortOrder";
import { useStatusToggle } from "@/hooks/useStatusToggle";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import DeleteDialogue from "@/components/common/DeleteDialogue";
import StatusChangeDialogue from "@/components/common/StatusChangeDialogue";
import SharedBlockNotice from "@/components/common/SharedBlockNotice";

export default function CommonHowItWorksList() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    items: steps,
    setItems: setSteps,
    page,
    setPage,
    limit,
    setLimit,
    itemsPage,
    itemsLimit,
    searchInput,
    setSearchInput,
    totalCount,
    totalPages,
    loading,
    searching,
    refetch,
  } = usePaginatedList<CommonHowItWorksRecord>(fetchCommonHowItWorksList);
  const [deleteItemId, setDeleteItemId] = useState<number | null>(null);

  const handleSortOrderChange = useSortOrder(steps, setSteps, updateCommonHowItWorksSortOrder);
  const { statusToggleItem, setStatusToggleItem, confirmStatusToggle } = useStatusToggle({
    setItems: setSteps,
    refetch,
    toggleStatus: toggleCommonHowItWorksStatus,
    label: "Step",
  });

  const confirmDelete = async () => {
    if (!deleteItemId) return;

    try {
      await deleteCommonHowItWorks(deleteItemId);
      if (steps.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        refetch();
      }
      toast({
        title: "Success",
        description: "Step deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof ApiError ? error.message : "Failed to delete step",
        variant: "destructive",
      });
    } finally {
      setDeleteItemId(null);
    }
  };

  const columns: ColumnDef<CommonHowItWorksRecord>[] = [
    {
      id: "id",
      header: "ID",
      cell: ({ row }) => (
        <div className="font-mono text-sm">
          {(itemsPage - 1) * itemsLimit + row.index + 1}
        </div>
      ),
    },
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("title") || "-"}</div>
      ),
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => (
        <div className="max-w-md truncate text-sm text-muted-foreground">
          {row.getValue("description") || "-"}
        </div>
      ),
    },

    {
      accessorKey: "sort_order",
      header: "Sort Order",
      cell: ({ row }) => {
        const item = row.original;
        const sortOrder = row.getValue("sort_order") as number;
        return (
          <SortOrderCell
            sortOrder={sortOrder}
            onIncrement={() => handleSortOrderChange(item, 1)}
            onDecrement={() => handleSortOrderChange(item, -1)}
          />
        );
      },
    },
    {
      accessorKey: "is_active",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("is_active") as boolean;
        return (
          <StatusToggleCell
            status={status}
            onCheckedChange={(checked) =>
              setStatusToggleItem({
                item: row.original,
                newStatus: checked,
              })
            }
          />
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Created At",
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
            onEdit={() => navigate(`/common-how-it-works/${item.id}/edit`)}
            onDelete={() => setDeleteItemId(item.id)}
          />
        );
      },
    },
  ];

  return (
    <>
      <div className="mb-4">
        <SharedBlockNotice />
      </div>
      <DataTable
        columns={columns}
        data={steps}
        title="How It Works"
        searchPlaceholder="Search steps..."
        onAdd={() => navigate("/common-how-it-works/new")}
        addButtonText="Add Step"
        loading={loading}
        searching={searching}
        searchQuery={searchInput}
        onSearchChange={setSearchInput}
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
        itemLabel="step"
      />

      <StatusChangeDialogue
        statusToggleItem={statusToggleItem}
        setStatusToggleItem={setStatusToggleItem}
        confirmStatusToggle={confirmStatusToggle}
        itemLabel="step"
      />
    </>
  );
}
