import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ColumnDef } from "@tanstack/react-table";
import { FileText } from "lucide-react";
import { DataTable } from "@/components/common/DataTable";
import SortOrderCell from "@/components/common/SortOrderCell";
import StatusToggleCell from "@/components/common/StatusToggleCell";
import RowActionsMenu from "@/components/common/RowActionsMenu";
import {
  fetchDownloadList,
  deleteDownload,
  toggleDownloadStatus,
  updateDownloadSortOrder,
  DownloadRecord,
  ApiError,
} from "@/services/downloads/downloadsApi";
import { resolveImageUrl } from "@/lib/resolveImageUrl";
import { useToast } from "@/hooks/use-toast";
import { useSortOrder } from "@/hooks/useSortOrder";
import { useStatusToggle } from "@/hooks/useStatusToggle";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import DeleteDialogue from "@/components/common/DeleteDialogue";
import StatusChangeDialogue from "@/components/common/StatusChangeDialogue";

export default function DownloadList() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    items: downloads,
    setItems: setDownloads,
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
  } = usePaginatedList<DownloadRecord>(fetchDownloadList);
  const [deleteItemId, setDeleteItemId] = useState<number | null>(null);

  const handleSortOrderChange = useSortOrder(downloads, setDownloads, updateDownloadSortOrder);
  const { statusToggleItem, setStatusToggleItem, confirmStatusToggle } = useStatusToggle({
    setItems: setDownloads,
    refetch,
    toggleStatus: toggleDownloadStatus,
    label: "Download",
  });

  const confirmDelete = async () => {
    if (!deleteItemId) return;
    try {
      await deleteDownload(deleteItemId);
      if (downloads.length === 1 && page > 1) setPage(page - 1);
      else refetch();
      toast({ title: "Success", description: "Download deleted successfully" });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof ApiError ? error.message : "Failed to delete download",
        variant: "destructive",
      });
    } finally {
      setDeleteItemId(null);
    }
  };

  const columns: ColumnDef<DownloadRecord>[] = [
    {
      id: "id",
      header: "ID",
      cell: ({ row }) => (
        <div className="font-mono text-sm">{(itemsPage - 1) * itemsLimit + row.index + 1}</div>
      ),
    },
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => <div className="font-medium">{row.getValue("title") || "-"}</div>,
    },
    {
      accessorKey: "file_path",
      header: "File",
      cell: ({ row }) => {
        const item = row.original;
        const url = resolveImageUrl(item.file_path);
        if (!url) return <span className="text-muted-foreground">-</span>;
        return (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm text-primary hover:underline"
          >
            <FileText className="h-4 w-4 flex-shrink-0" />
            <span className="truncate max-w-50">{item.file_original_filename || "View file"}</span>
          </a>
        );
      },
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
            onCheckedChange={(checked) => setStatusToggleItem({ item: row.original, newStatus: checked })}
          />
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Created At",
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">
          {row.getValue("createdAt") ? new Date(row.getValue("createdAt")).toLocaleDateString() : "-"}
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
            onEdit={() => navigate(`/downloads/${item.id}/edit`)}
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
        data={downloads}
        title="Downloads"
        searchPlaceholder="Search downloads..."
        onAdd={() => navigate("/downloads/new")}
        addButtonText="Add Download"
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
        itemLabel="download"
      />

      <StatusChangeDialogue
        statusToggleItem={statusToggleItem}
        setStatusToggleItem={setStatusToggleItem}
        confirmStatusToggle={confirmStatusToggle}
        itemLabel="download"
      />
    </>
  );
}
