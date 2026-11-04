import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/common/DataTable";
import MediaThumbnail from "@/components/common/MediaThumbnail";
import RowActionsMenu from "@/components/common/RowActionsMenu";
import DeleteDialogue from "@/components/common/DeleteDialogue";
import { useToast } from "@/hooks/use-toast";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { BANNER_EXCLUDED_PAGE_SLUGS } from "@/constants/bannerPages";
import { fetchActivePages } from "@/services/masters/pagesApi";
import {
  fetchBannersList,
  deleteBanner,
  Banner,
  ApiError,
} from "@/services/siteSettings/bannerApi";

export default function BannersList() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [deleteItemId, setDeleteItemId] = useState<number | null>(null);

  const {
    items: banners,
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
  } = usePaginatedList<Banner>(fetchBannersList);

  // Disable "Add" once every bannerable page (all active pages except the
  // excluded ones) already has a banner.
  const [allPagesHaveBanner, setAllPagesHaveBanner] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [activePages, bannersRes] = await Promise.all([
          fetchActivePages(),
          fetchBannersList(1, 100, undefined, ["page_id"]),
        ]);
        const used = new Set(bannersRes.data.data.map((b) => b.page_id));
        const remaining = activePages.filter(
          (p) =>
            !BANNER_EXCLUDED_PAGE_SLUGS.includes(p.page_slug) &&
            !used.has(p.id),
        );
        if (!cancelled) setAllPagesHaveBanner(remaining.length === 0);
      } catch {
        if (!cancelled) setAllPagesHaveBanner(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [banners]);

  const confirmDelete = async () => {
    if (!deleteItemId) return;

    try {
      await deleteBanner(deleteItemId);
      if (banners.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        refetch();
      }
      toast({ title: "Success", description: "Banner deleted successfully" });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof ApiError ? error.message : "Failed to delete banner",
        variant: "destructive",
      });
    } finally {
      setDeleteItemId(null);
    }
  };

  const columns: ColumnDef<Banner>[] = [
    {
      // id
      accessorKey: "id",
      header: "ID",
      enableHiding: true,
      meta: { defaultVisible: true },
      cell: ({ row }) => (
        <div className="font-medium">
          {(itemsPage - 1) * itemsLimit + row.index + 1}
        </div>
      ),
    },
    {
      accessorKey: "media_path",
      header: "Media",
      cell: ({ row }) => (
        <MediaThumbnail
          path={row.original.media_path}
          alt={row.original.media_alt}
        />
      ),
    },
    {
      id: "page",
      header: "Page",
      cell: ({ row }) => (
        <div className="font-medium capitalize">{row.original.page?.page ?? "-"}</div>
      ),
    },
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => (
        <div className="max-w-[200px] truncate" title={row.getValue("title")}>
          {row.getValue("title")}
        </div>
      ),
    },
    {
      accessorKey: "sub_title",
      header: "Sub Title",
      cell: ({ row }) => (
        <div
          className="max-w-[200px] truncate text-muted-foreground"
          title={row.getValue("sub_title")}
        >
          {row.getValue("sub_title")}
        </div>
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
            onEdit={() => navigate(`/banners/${item.id}/edit`)}
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
        data={banners}
        title="Banners"
        searchPlaceholder="Search banners by pages..."
        onAdd={() => navigate("/banners/new")}
        addButtonText="Add Banner"
        addDisabled={allPagesHaveBanner}
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
    </>
  );
}
