import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/common/DataTable";
import SortOrderCell from "@/components/common/SortOrderCell";
import StatusToggleCell from "@/components/common/StatusToggleCell";
import RowActionsMenu from "@/components/common/RowActionsMenu";
import {
  fetchCommonFeatureList,
  deleteCommonFeature,
  toggleCommonFeatureStatus,
  updateCommonFeatureSortOrder,
  CommonFeaturesRecord,
  ApiError,
} from "@/services/common/commonFeaturesApi";
import { useToast } from "@/hooks/use-toast";
import { useSortOrder } from "@/hooks/useSortOrder";
import { useStatusToggle } from "@/hooks/useStatusToggle";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import DeleteDialogue from "@/components/common/DeleteDialogue";
import StatusChangeDialogue from "@/components/common/StatusChangeDialogue";
import SharedBlockNotice from "@/components/common/SharedBlockNotice";

export default function CommonFeaturesList() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    items: features,
    setItems: setFeatures,
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
  } = usePaginatedList<CommonFeaturesRecord>(fetchCommonFeatureList);
  const [deleteItemId, setDeleteItemId] = useState<number | null>(null);

  const handleSortOrderChange = useSortOrder(features, setFeatures, updateCommonFeatureSortOrder);
  const { statusToggleItem, setStatusToggleItem, confirmStatusToggle } = useStatusToggle({
    setItems: setFeatures,
    refetch,
    toggleStatus: toggleCommonFeatureStatus,
    label: "Feature",
  });

  const confirmDelete = async () => {
    if (!deleteItemId) return;

    try {
      await deleteCommonFeature(deleteItemId);
      if (features.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        refetch();
      }
      toast({
        title: "Success",
        description: "Feature deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof ApiError ? error.message : "Failed to delete feature",
        variant: "destructive",
      });
    } finally {
      setDeleteItemId(null);
    }
  };

  const columns: ColumnDef<CommonFeaturesRecord>[] = [
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
            onEdit={() => navigate(`/common-features/${item.id}/edit`)}
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
        data={features}
        title="Our Feature"
        searchPlaceholder="Search features..."
        onAdd={() => navigate("/common-features/new")}
        addButtonText="Add Feature"
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
        itemLabel="feature"
      />

      <StatusChangeDialogue
        statusToggleItem={statusToggleItem}
        setStatusToggleItem={setStatusToggleItem}
        confirmStatusToggle={confirmStatusToggle}
        itemLabel="feature"
      />
    </>
  );
}
