import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/common/DataTable";
import RowActionsMenu from "@/components/common/RowActionsMenu";
import StatusToggleCell from "@/components/common/StatusToggleCell";
import DeleteDialogue from "@/components/common/DeleteDialogue";
import StatusChangeDialogue from "@/components/common/StatusChangeDialogue";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useStatusToggle } from "@/hooks/useStatusToggle";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { resolveImageUrl } from "@/lib/resolveImageUrl";
import {
  fetchBlogList,
  deleteBlog,
  toggleBlogStatus,
  BlogRecord,
  ApiError,
} from "@/services/blogs/blogApi";

export default function BlogList() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [deleteItemId, setDeleteItemId] = useState<number | null>(null);

  const {
    items: blogs,
    setItems: setBlogs,
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
    refetch,
  } = usePaginatedList<BlogRecord>(fetchBlogList);

  const { statusToggleItem, setStatusToggleItem, confirmStatusToggle } = useStatusToggle({
    setItems: setBlogs,
    refetch,
    toggleStatus: toggleBlogStatus,
    label: "Blog",
  });

  const confirmDelete = async () => {
    if (!deleteItemId) return;

    try {
      await deleteBlog(deleteItemId);
      if (blogs.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        refetch();
      }
      toast({ title: "Success", description: "Blog deleted successfully" });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof ApiError ? error.message : "Failed to delete Blog",
        variant: "destructive",
      });
    } finally {
      setDeleteItemId(null);
    }
  };

  const columns: ColumnDef<BlogRecord>[] = [
    {
      accessorKey: "media_path",
      header: "Image",
      cell: ({ row }) => {
        const src = resolveImageUrl(row.original.media_path);
        return src ? (
          <img src={src} alt={row.original.media_alt || row.original.title} className="h-12 w-16 rounded object-cover" />
        ) : (
          <div className="h-12 w-16 rounded bg-muted" />
        );
      },
    },
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => (
        <div className="max-w-[320px]">
          <div className="truncate font-medium">{row.original.title}</div>
          <div className="truncate text-xs text-muted-foreground">/{row.original.slug}</div>
        </div>
      ),
    },
    {
      accessorKey: "author_name",
      header: "Author",
      cell: ({ row }) => <div className="text-sm">{row.original.author_name || "-"}</div>,
    },
    {
      accessorKey: "published_at",
      header: "Published",
      cell: ({ row }) => {
        const date = new Date(row.original.published_at);
        const scheduled = date.getTime() > Date.now();
        return (
          <div className="flex flex-col gap-1 text-sm">
            <span>{date.toLocaleString()}</span>
            {scheduled && (
              <Badge variant="outline" className="w-fit text-xs">
                Scheduled
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "is_active",
      header: "Status",
      cell: ({ row }) => (
        <StatusToggleCell
          status={row.getValue("is_active") as boolean}
          onCheckedChange={(checked) => setStatusToggleItem({ item: row.original, newStatus: checked })}
        />
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const item = row.original;
        return (
          <RowActionsMenu
            onEdit={() => navigate(`/blogs/${item.id}/edit`)}
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
        data={blogs}
        title="Blogs"
        searchPlaceholder="Search blogs..."
        onAdd={() => navigate("/blogs/new")}
        addButtonText="Add Blog"
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
      />

      <StatusChangeDialogue
        statusToggleItem={statusToggleItem}
        setStatusToggleItem={setStatusToggleItem}
        confirmStatusToggle={confirmStatusToggle}
        itemLabel="Blog"
      />
    </>
  );
}
