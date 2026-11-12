import { useMemo } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { ColumnDef } from "@tanstack/react-table";
import { Edit, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/common/DataTable";
import { Combobox } from "@/components/ui/combobox";
import { fetchMetaTagsList, MetaTag, MetaTagFilters } from "@/services/common/metaTagsApi";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { useUrlFilters } from "@/hooks/useUrlFilters";
import { pageLabel } from "@/constants/pagenames";

const ALL = "all";

const TYPE_OPTIONS = [
  { value: ALL, label: "All types" },
  { value: "page", label: "Page" },
  { value: "product", label: "Product" },
  { value: "product-variant", label: "Product Variant" },
  { value: "blog", label: "Blog" },
  { value: "project", label: "Project" },
];

export const MetaTagsList: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navState = { state: location.state };

  const { filters: listFilters, setFilter } = useUrlFilters({ type: ALL });
  const typeFilter = listFilters.type as string;

  // Deep-links (product/variant "SEO Meta" buttons) carry the target id in the
  // URL; read those through so the list lands pre-filtered on that single row.
  const pageNameParam = searchParams.get("page_name") || undefined;
  const productIdParam = searchParams.get("product_id") || undefined;
  const variantIdParam = searchParams.get("variant_id") || undefined;
  const blogIdParam = searchParams.get("blog_id") || undefined;
  const projectIdParam = searchParams.get("project_id") || undefined;

  const filters = useMemo<MetaTagFilters>(
    () => ({
      type: typeFilter === ALL ? undefined : typeFilter,
      page_name: pageNameParam,
      product_id: productIdParam ? Number(productIdParam) : undefined,
      variant_id: variantIdParam ? Number(variantIdParam) : undefined,
      blog_id: blogIdParam,
      project_id: projectIdParam ? Number(projectIdParam) : undefined,
    }),
    [typeFilter, pageNameParam, productIdParam, variantIdParam, blogIdParam, projectIdParam],
  );

  const {
    items: metaTags,
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
  } = usePaginatedList<MetaTag, MetaTagFilters>(fetchMetaTagsList, 15, filters);

  const hasTargetFilter = Boolean(
    pageNameParam || productIdParam || variantIdParam || blogIdParam || projectIdParam,
  );
  const clearTargetFilter = () => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        ["page_name", "product_id", "variant_id", "blog_id", "project_id"].forEach((k) => next.delete(k));
        return next;
      },
      { replace: true },
    );
  };

  const addQuery = () => {
    const params = new URLSearchParams();
    if (typeFilter !== ALL) params.set("type", typeFilter);
    if (pageNameParam) params.set("page_name", pageNameParam);
    if (productIdParam) params.set("product_id", productIdParam);
    if (variantIdParam) params.set("variant_id", variantIdParam);
    if (blogIdParam) params.set("blog_id", blogIdParam);
    if (projectIdParam) params.set("project_id", projectIdParam);
    const qs = params.toString();
    return qs ? `?${qs}` : "";
  };

  const columns: ColumnDef<MetaTag>[] = [
    // Serial ID that increments from 1 and stays continuous across pagination
    {
      id: "id",
      header: "ID",
      enableHiding: true,
      meta: { defaultVisible: true },
      cell: ({ row }) => (
        <div className="font-medium">{(itemsPage - 1) * itemsLimit + row.index + 1}</div>
      ),
    },
    {
      id: "target",
      header: "Target",
      cell: ({ row }) => {
        const item = row.original;
        if (item.type === "page") {
          return (
            <div className="font-medium capitalize">
              {pageLabel(item.page_name) ?? item.page_name ?? "-"}
            </div>
          );
        }
        if (item.type === "product") {
          return (
            <div className="font-medium max-w-[240px] truncate">
              {item.product?.title || "-"}
            </div>
          );
        }
        if (item.type === "blog") {
          return (
            <div className="font-medium max-w-[240px] truncate">
              <span className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                {item.blog_id || "-"}
              </span>
            </div>
          );
        }
        if (item.type === "project") {
          return (
            <div className="font-medium max-w-[240px] truncate">
              {item.project?.title || "-"}
            </div>
          );
        }
        return (
          <div className="font-medium max-w-[240px] truncate">
            {item.variant?.product?.title && item.variant?.label
              ? `${item.variant.product.title} — ${item.variant.label}`
              : item.variant?.label || "-"}
          </div>
        );
      },
    },
    {
      accessorKey: "meta_title",
      header: "Meta Title",
      cell: ({ row }) => (
        <div
          className="max-w-[250px] truncate"
          title={row.getValue("meta_title")}
        >
          {row.getValue("meta_title")}
        </div>
      ),
    },
    {
      accessorKey: "meta_description",
      header: "Meta Description",
      enableHiding: true,
      meta: { defaultVisible: true },
      cell: ({ row }) => (
        <div
          className="max-w-[300px] truncate"
          title={row.getValue("meta_description")}
        >
          {row.getValue("meta_description")}
        </div>
      ),
    },
    {
      accessorKey: "meta_keywords",
      header: "Keywords",
      enableHiding: true,
      meta: { defaultVisible: true },
      cell: ({ row }) => (
        <div
          className="max-w-[200px] truncate"
          title={row.getValue("meta_keywords")}
        >
          {row.getValue("meta_keywords")}
        </div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/meta-tags/${row.original.id}/edit`, navState)}
        >
          <Edit className="h-4 w-4 mr-1" />
          Edit
        </Button>
      ),
    },
  ];

  return (
    <div className="">
      <DataTable
        columns={columns}
        data={metaTags}
        title="Meta Tags"
        loading={loading}
        searching={searching}
        searchPlaceholder="Search by target or title..."
        searchQuery={searchInput}
        onSearchChange={setSearchInput}
        onAdd={() => navigate(`/meta-tags/new${addQuery()}`, navState)}
        addButtonText="Add Meta Tag"
        headerExtra={
          <div className="flex items-center gap-2">
            {hasTargetFilter && (
              <Button variant="secondary" size="sm" onClick={clearTargetFilter}>
                Filtered to one target
                <X className="h-3.5 w-3.5 ml-1" />
              </Button>
            )}
          <Combobox
            maxVisibleItems={4}
            autoWidth
            value={typeFilter}
            options={TYPE_OPTIONS}
            placeholder="All types"
            searchPlaceholder="Search type..."
            onChange={(value) => {
              if (hasTargetFilter) clearTargetFilter();
              setFilter("type", value);
            }}
          />
          </div>
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
    </div>
  );
};