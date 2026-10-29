import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/common/DataTable";
import MediaThumbnail from "@/components/common/MediaThumbnail";
import SortOrderCell from "@/components/common/SortOrderCell";
import StatusToggleCell from "@/components/common/StatusToggleCell";
import RowActionsMenu from "@/components/common/RowActionsMenu";
import {
  fetchCommonMilestoneList,
  deleteCommonMilestone,
  toggleCommonMilestoneStatus,
  toggleCommonMilestoneHome,
  updateCommonMilestoneSortOrder,
  CommonMilestonesRecord,
  ApiError,
} from "@/services/common/commonMilestonesApi";
import { useToast } from "@/hooks/use-toast";
import { useSortOrder } from "@/hooks/useSortOrder";
import { useStatusToggle } from "@/hooks/useStatusToggle";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import DeleteDialogue from "@/components/common/DeleteDialogue";
import StatusChangeDialogue from "@/components/common/StatusChangeDialogue";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import SharedBlockNotice from "@/components/common/SharedBlockNotice";

export default function CommonMilestoneList() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    items: milestones,
    setItems: setMilestones,
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
  } = usePaginatedList<CommonMilestonesRecord>(fetchCommonMilestoneList);
  const [deleteItemId, setDeleteItemId] = useState<number | null>(null);

  const handleSortOrderChange = useSortOrder(milestones, setMilestones, updateCommonMilestoneSortOrder);
  const { statusToggleItem, setStatusToggleItem, confirmStatusToggle } = useStatusToggle({
    setItems: setMilestones,
    refetch,
    toggleStatus: toggleCommonMilestoneStatus,
    label: "Milestone",
  });

  // Home toggle — same confirm→API→toast flow as status.
  const [homeToggleItem, setHomeToggleItem] = useState<{
    item: CommonMilestonesRecord;
    newValue: boolean;
  } | null>(null);
  const homeActionRef = useRef<HTMLButtonElement>(null);

  const confirmHomeToggle = async () => {
    if (!homeToggleItem) return;
    const { item, newValue } = homeToggleItem;
    try {
      await toggleCommonMilestoneHome(item, newValue);
      setMilestones((prev) =>
        prev.map((m) => (m.id === item.id ? { ...m, show_in_home: newValue } : m)),
      );
      toast({
        title: "Success",
        description: `Milestone ${newValue ? "added to" : "removed from"} home page successfully`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof ApiError ? error.message : "Failed to update home page visibility",
        variant: "destructive",
      });
    } finally {
      setHomeToggleItem(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteItemId) return;

    try {
      await deleteCommonMilestone(deleteItemId);
      if (milestones.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        refetch();
      }
      toast({
        title: "Success",
        description: "Milestone deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof ApiError ? error.message : "Failed to delete milestone",
        variant: "destructive",
      });
    } finally {
      setDeleteItemId(null);
    }
  };

  const columns: ColumnDef<CommonMilestonesRecord>[] = [
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
      accessorKey: "media_path",
      header: "Image",
      cell: ({ row }) => (
        <MediaThumbnail
          path={row.getValue("media_path")}
          alt={row.original.media_alt}
        />
      ),
    },
    {
      accessorKey: "value",
      header: "Value",
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("value") || "-"}</div>
      ),
    },
    {
      accessorKey: "label",
      header: "Label",
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("label") || "-"}</div>
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
      accessorKey: "show_in_home",
      header: "Home Visibility",
      cell: ({ row }) => (
        <StatusToggleCell
          status={row.original.show_in_home}
          onCheckedChange={(checked) =>
            setHomeToggleItem({ item: row.original, newValue: checked })
          }
        />
      ),
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
            onEdit={() => navigate(`/milestones/${item.id}/edit`)}
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
        data={milestones}
        title="Milestone"
        searchPlaceholder="Search milestones..."
        onAdd={() => navigate("/milestones/new")}
        addButtonText="Add Milestone"
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
        itemLabel="milestone"
      />

      <StatusChangeDialogue
        statusToggleItem={statusToggleItem}
        setStatusToggleItem={setStatusToggleItem}
        confirmStatusToggle={confirmStatusToggle}
        itemLabel="milestone"
      />

      <AlertDialog open={!!homeToggleItem} onOpenChange={() => setHomeToggleItem(null)}>
        <AlertDialogContent
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            homeActionRef.current?.focus();
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Home Page Change</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to{" "}
              {homeToggleItem?.newValue
                ? "show this milestone on the home page"
                : "remove this milestone from the home page"}
              ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction ref={homeActionRef} onClick={confirmHomeToggle}>
              {homeToggleItem?.newValue ? "Show in Home" : "Remove from Home"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
