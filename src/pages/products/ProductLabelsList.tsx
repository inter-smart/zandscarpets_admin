import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/common/DataTable";
import RowActionsMenu from "@/components/common/RowActionsMenu";
import StatusToggleCell from "@/components/common/StatusToggleCell";
import SortOrderCell from "@/components/common/SortOrderCell";
import DeleteDialogue from "@/components/common/DeleteDialogue";
import StatusChangeDialogue from "@/components/common/StatusChangeDialogue";
import { Badge } from "@/components/ui/badge";
import { Combobox } from "@/components/ui/combobox";
import { useToast } from "@/hooks/use-toast";
import { useSortOrder } from "@/hooks/useSortOrder";
import { useStatusToggle } from "@/hooks/useStatusToggle";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { useUrlFilters } from "@/hooks/useUrlFilters";
import {
  fetchProductLabelList,
  deleteProductLabel,
  toggleProductLabelStatus,
  updateProductLabelSortOrder,
  ProductLabelRecord,
  LabelType,
  LABEL_TYPES,
  ApiError,
} from "@/services/products/productLabelsApi";

const TYPE_LABELS: Record<LabelType, string> = {
  feature: "Feature",
  tag: "Tag",
  specification: "Specification",
};

const ALL = "all";
type TypeFilter = LabelType | typeof ALL;

const isLabelType = (value: string | null): value is LabelType => !!value && (LABEL_TYPES as readonly string[]).includes(value);

export default function ProductLabelsList() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [deleteItemId, setDeleteItemId] = useState<number | null>(null);

  // The URL (`?type=…`) is the single source of truth, so the sidebar menu
  // entries (/product-labels?type=tag) apply the filter on load and update it
  // while the page is already mounted.
  const { filters: listFilters, setFilter } = useUrlFilters({ type: ALL });
  const typeFilter: TypeFilter = isLabelType(listFilters.type) ? listFilters.type : ALL;

  const handleTypeChange = (value: string) => {
    setFilter("type", value || ALL);
  };

  const filters = useMemo(() => (typeFilter === ALL ? undefined : { type: typeFilter }), [typeFilter]);

  const {
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
    refetch,
  } = usePaginatedList<ProductLabelRecord, { type?: LabelType }>(fetchProductLabelList, 10, filters);

  const handleSortOrderChange = useSortOrder(items, setItems, updateProductLabelSortOrder);
  const { statusToggleItem, setStatusToggleItem, confirmStatusToggle } = useStatusToggle({
    setItems,
    refetch,
    toggleStatus: toggleProductLabelStatus,
    label: "Product Label",
  });

  const confirmDelete = async () => {
    if (!deleteItemId) return;

    try {
      await deleteProductLabel(deleteItemId);
      if (items.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        refetch();
      }
      toast({ title: "Success", description: "Product label deleted successfully" });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof ApiError ? error.message : "Failed to delete product label",
        variant: "destructive",
      });
    } finally {
      setDeleteItemId(null);
    }
  };

  const columns: ColumnDef<ProductLabelRecord>[] = [
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ row }) => <div className="font-mono">{(itemsPage - 1) * itemsLimit + row.index + 1}</div>,
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => <Badge variant="secondary">{TYPE_LABELS[row.original.type]}</Badge>,
    },
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => <div className="font-medium max-w-[280px] truncate">{row.getValue("title")}</div>,
    },
    {
      accessorKey: "title_ar",
      header: "Title (Arabic)",
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground max-w-[280px] truncate" dir="rtl">
          {row.getValue("title_ar") || "-"}
        </div>
      ),
    },
    // The badge concept only applies to tags, so only surface it for that type.
    ...(typeFilter === "tag" || typeFilter === ALL
      ? ([
          {
            accessorKey: "is_product_badge",
            header: "Badge",
            cell: ({ row }) => (row.original.is_product_badge ? <Badge>Badge</Badge> : <span className="text-sm text-muted-foreground">-</span>),
          },
          {
            accessorKey: "show_in_filter",
            header: "In Filter",
            cell: ({ row }) =>
              row.original.show_in_filter ? <Badge variant="outline">Filter</Badge> : <span className="text-sm text-muted-foreground">-</span>,
          },
        ] as ColumnDef<ProductLabelRecord>[])
      : []),
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
        return <StatusToggleCell status={status} onCheckedChange={(checked) => setStatusToggleItem({ item: row.original, newStatus: checked })} />;
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
        return <RowActionsMenu onEdit={() => navigate(`/product-labels/${item.id}/edit`)} onDelete={() => setDeleteItemId(item.id)} />;
      },
    },
  ];

  const newLabelUrl = typeFilter === ALL ? "/product-labels/new" : `/product-labels/new?type=${typeFilter}`;

  return (
    <>
      <DataTable
        columns={columns}
        data={items}
        title="Product Labels"
        searchPlaceholder="Search labels..."
        onAdd={() => navigate(newLabelUrl)}
        addButtonText="Add Label"
        loading={loading}
        searching={searching}
        searchQuery={searchInput}
        onSearchChange={setSearchInput}
        headerExtra={
          <Combobox
            maxVisibleItems={5}
            autoWidth
            value={typeFilter}
            options={[
              { value: ALL, label: "All types" },
              { value: "feature", label: "Features" },
              { value: "tag", label: "Tags" },
              { value: "specification", label: "Specifications" },
            ]}
            placeholder="All types"
            searchPlaceholder="Search type..."
            onChange={(v) => handleTypeChange(v || ALL)}
          />
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

      <DeleteDialogue deleteItemId={deleteItemId} setDeleteItemId={setDeleteItemId} confirmDelete={confirmDelete} itemLabel="Product Label" />

      <StatusChangeDialogue
        statusToggleItem={statusToggleItem}
        setStatusToggleItem={setStatusToggleItem}
        confirmStatusToggle={confirmStatusToggle}
        itemLabel="Product Label"
      />
    </>
  );
}
