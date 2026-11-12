import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowLeft, Layers, RotateCcw, Wand2, LayoutList, Tags } from "lucide-react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { DataTable } from "@/components/common/DataTable";
import RowActionsMenu from "@/components/common/RowActionsMenu";
import StatusToggleCell from "@/components/common/StatusToggleCell";
import SortOrderCell from "@/components/common/SortOrderCell";
import DeleteDialogue from "@/components/common/DeleteDialogue";
import StatusChangeDialogue from "@/components/common/StatusChangeDialogue";
import MediaThumbnail from "@/components/common/MediaThumbnail";
import PageLoader from "@/components/layout/PageLoader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Option as MultiSelectOption } from "@/components/ui/multi-select";
import { Combobox } from "@/components/ui/combobox";
import VariantValuePicker, { groupValuesByAttribute } from "@/components/products/VariantValuePicker";
import VariantGeneratePreview from "@/components/products/VariantGeneratePreview";
import { AttributeSelection, buildComboPreviews } from "@/utils/variantCombinations";
import { useToast } from "@/hooks/use-toast";
import { useSortOrder } from "@/hooks/useSortOrder";
import { useStatusToggle } from "@/hooks/useStatusToggle";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { useUrlFilters } from "@/hooks/useUrlFilters";
import {
  fetchProductVariantList,
  deleteProductVariant,
  toggleProductVariantStatus,
  updateProductVariantSortOrder,
  generateProductVariants,
  ProductVariantRecord,
  VariantFilters,
  ApiError,
} from "@/services/products/productVariantsApi";
import { fetchProductById } from "@/services/products/productsApi";
import { fetchActiveAttributeValues, AttributeValueOption } from "@/services/products/attributeValuesApi";
import type { ProductAttributeOption } from "@/services/products/productsApi";
import { useParentProduct } from "./useParentProduct";

const ALL = "all";

type StatusFilter = "all" | "active" | "inactive";

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

// Variants for one product, reached from the Products list row actions.
export default function ProductVariantsList() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const listPath = (location.state as { from?: string } | null)?.from ?? "/products";
  const goToList = () => navigate(listPath);

  const { productId, productTitle, loading: productLoading } = useParentProduct();
  const [generateOpen, setGenerateOpen] = useState(Boolean((location.state as { reopenGenerate?: boolean } | null)?.reopenGenerate));
  const [deleteItemId, setDeleteItemId] = useState<number | null>(null);
  const basePath = `/products/${productId}/variants`;

  const {
    filters: listFilters,
    setFilter,
    reset: resetListFilters,
  } = useUrlFilters({
    status: ALL,
  });
  const statusFilter = listFilters.status as StatusFilter;

  const filters = useMemo<VariantFilters>(
    () => ({
      product_id: productId,
      status: statusFilter === "all" ? undefined : statusFilter,
    }),
    [productId, statusFilter],
  );
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
  } = usePaginatedList<ProductVariantRecord, VariantFilters>(fetchProductVariantList, 10, filters);

  const hasActiveFilters = statusFilter !== "all" || searchInput !== "";

  const resetAll = () => {
    resetListFilters();
    setSearchInput("");
    setPage(1);
  };

  useEffect(() => {
    if ((location.state as { reopenGenerate?: boolean } | null)?.reopenGenerate) {
      // clear the flag so reload/back doesn't reopen the dialog
      navigate(location.pathname, { replace: true, state: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSortOrderChange = useSortOrder(items, setItems, updateProductVariantSortOrder);
  const { statusToggleItem, setStatusToggleItem, confirmStatusToggle } = useStatusToggle({
    setItems,
    refetch,
    toggleStatus: toggleProductVariantStatus,
    label: "Variant",
  });

  const confirmDelete = async () => {
    if (!deleteItemId) return;
    try {
      await deleteProductVariant(deleteItemId);
      if (items.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        refetch();
      }
      toast({ title: "Success", description: "Variant deleted successfully" });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof ApiError ? error.message : "Failed to delete variant",
        variant: "destructive",
      });
    } finally {
      setDeleteItemId(null);
    }
  };

  const columns: ColumnDef<ProductVariantRecord>[] = [
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ row }) => <div className="font-mono">{(itemsPage - 1) * itemsLimit + row.index + 1}</div>,
    },
    {
      accessorKey: "media_path",
      header: "Image",
      cell: ({ row }) => <MediaThumbnail path={row.original.media_path} alt={row.original.media_alt || row.original.label} />,
    },
    {
      accessorKey: "label",
      header: "Variant",
      cell: ({ row }) => <div className="font-medium max-w-[220px] truncate">{row.original.label}</div>,
    },
    {
      id: "values",
      header: "Attributes",
      cell: ({ row }) => {
        const links = row.original.valueLinks || [];
        if (!links.length) return "-";
        return (
          <div className="flex flex-wrap gap-1 max-w-[320px]">
            {links.map((link) => (
              <Badge key={link.id} variant="secondary">
                {link.attribute?.title ? `${link.attribute.title}: ` : ""}
                {link.attributeValue?.value || "-"}
              </Badge>
            ))}
          </div>
        );
      },
    },
    {
      accessorKey: "sku",
      header: "SKU",
      cell: ({ row }) => <div className="font-mono text-sm">{row.original.sku || "-"}</div>,
    },
    {
      accessorKey: "sort_order",
      header: "Sort Order",
      cell: ({ row }) => (
        <SortOrderCell
          sortOrder={row.original.sort_order}
          onIncrement={() => handleSortOrderChange(row.original, 1)}
          onDecrement={() => handleSortOrderChange(row.original, -1)}
        />
      ),
    },
    {
      accessorKey: "is_active",
      header: "Status",
      cell: ({ row }) => (
        <StatusToggleCell
          status={row.original.is_active}
          onCheckedChange={(checked) => setStatusToggleItem({ item: row.original, newStatus: checked })}
        />
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <RowActionsMenu
          extraItems={
            <>
              <DropdownMenuItem onClick={() => navigate(`${basePath}/${row.original.id}/details`)}>
                <LayoutList className="mr-2 h-4 w-4" />
                Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate(`/meta-tags/new?type=product-variant&variant_id=${row.original.id}`, { state: { from: location.pathname + location.search } })}>
                <Tags className="mr-2 h-4 w-4" />
                SEO Meta
              </DropdownMenuItem>
            </>
          }
          onEdit={() => navigate(`${basePath}/${row.original.id}/edit`)}
          onDelete={() => setDeleteItemId(row.original.id)}
        />
      ),
    },
  ];

  if (productLoading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => goToList()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Variants — {productTitle}</h1>
          <p className="text-muted-foreground">Options generated from this product's attributes</p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={items}
        title="Variants"
        searchPlaceholder="Search variants..."
        loading={loading}
        searching={searching}
        searchQuery={searchInput}
        onSearchChange={setSearchInput}
        headerExtra={
          <>
            <Combobox
              maxVisibleItems={3}
              autoWidth
              value={statusFilter}
              options={STATUS_OPTIONS}
              placeholder="All statuses"
              searchPlaceholder="Search status..."
              onChange={(value) => setFilter("status", value)}
            />
            <Button variant="outline" size="sm" onClick={resetAll} disabled={!hasActiveFilters}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset
            </Button>
            <Button type="button" variant="outline" onClick={() => setGenerateOpen(true)}>
              <Wand2 className="mr-2 h-4 w-4" />
              Generate
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

      <GenerateVariantsDialog open={generateOpen} onOpenChange={setGenerateOpen} productId={productId} onGenerated={refetch} />

      <DeleteDialogue deleteItemId={deleteItemId} setDeleteItemId={setDeleteItemId} confirmDelete={confirmDelete} itemLabel="Variant" />

      <StatusChangeDialogue
        statusToggleItem={statusToggleItem}
        setStatusToggleItem={setStatusToggleItem}
        confirmStatusToggle={confirmStatusToggle}
        itemLabel="Variant"
      />
    </div>
  );
}

interface GenerateVariantsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: number;
  onGenerated: () => void;
}

function GenerateVariantsDialog({ open, onOpenChange, productId, onGenerated }: GenerateVariantsDialogProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [attributes, setAttributes] = useState<ProductAttributeOption[]>([]);
  const [valuesByAttribute, setValuesByAttribute] = useState<Record<number, MultiSelectOption[]>>({});
  const [valuesById, setValuesById] = useState<Record<number, AttributeValueOption>>({});
  const [existingKeys, setExistingKeys] = useState<Set<string>>(new Set());
  const [selections, setSelections] = useState<Record<number, (number | string)[]>>({});
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    Promise.all([fetchProductById(productId), fetchActiveAttributeValues(), fetchProductVariantList(1, 1000, undefined, { product_id: productId })])
      .then(([productRes, valuesRes, variantsRes]) => {
        if (cancelled) return;
        const attrs = productRes.data.attributes || [];
        setAttributes(attrs);
        setValuesByAttribute(groupValuesByAttribute(valuesRes.data, attrs));
        setValuesById(Object.fromEntries(valuesRes.data.map((v) => [v.id, v])));
        setExistingKeys(new Set(variantsRes.data.data.map((v) => v.combination_key)));
        setSelections({});
      })
      .catch((error) => {
        if (!cancelled)
          toast({
            title: "Error",
            description: error instanceof ApiError ? error.message : "Failed to load attributes",
            variant: "destructive",
          });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, productId]);

  const orderedSelections: AttributeSelection[] = attributes.map((a) => ({
    attributeId: a.id,
    valueIds: selections[a.id] || [],
  }));
  const isComplete = attributes.length > 0 && orderedSelections.every((s) => s.valueIds.length > 0);
  const newCount = isComplete ? buildComboPreviews(orderedSelections, valuesById, existingKeys).filter((p) => !p.exists).length : 0;

  const handleGenerate = async () => {
    if (!attributes.length) {
      toast({
        title: "No attributes",
        description: "Add attributes to this product before generating variants.",
        variant: "destructive",
      });
      return;
    }

    const emptyAttr = attributes.find((a) => !(valuesByAttribute[a.id] || []).length);
    if (emptyAttr) {
      toast({
        title: "Missing attribute values",
        description: `Add values for "${emptyAttr.title}" under Attribute Values first.`,
        variant: "destructive",
      });
      return;
    }

    const missing = attributes.find((a) => !(selections[a.id] || []).length);
    if (missing) {
      toast({
        title: "Incomplete selection",
        description: `Choose at least one value for ${missing.title}.`,
        variant: "destructive",
      });
      return;
    }

    try {
      setGenerating(true);
      const { data } = await generateProductVariants({
        product_id: productId,
        selections: attributes.map((a) => ({
          attribute_id: a.id,
          value_ids: (selections[a.id] || []).map((v) => Number(v)),
        })),
      });
      toast({
        title: "Success",
        description: `${data.created} variant(s) created${data.skipped ? `, ${data.skipped} already existed` : ""}`,
      });
      onOpenChange(false);
      onGenerated();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof ApiError ? error.message : "Failed to generate variants",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Generate Variants</DialogTitle>
          <DialogDescription>Pick the values to combine. Existing combinations are skipped.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto py-2">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Layers className="h-4 w-4 animate-pulse" />
              Loading attributes...
            </div>
          ) : attributes.length ? (
            <>
              <VariantValuePicker
                attributes={attributes}
                valuesByAttribute={valuesByAttribute}
                selections={selections}
                onChange={(attrId, selected) => setSelections((prev) => ({ ...prev, [attrId]: selected }))}
              />
              <div className="pt-2 border-t">
                <VariantGeneratePreview
                  selections={orderedSelections}
                  attributeValuesById={valuesById}
                  isComplete={isComplete}
                  existingKeys={existingKeys}
                />
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">This product has no attributes. Add attributes in the product form first.</p>
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  navigate(`/products/${productId}/edit`, {
                    state: {
                      from: `/products/${productId}/variants`,
                      reopenGenerate: true,
                    },
                  })
                }
              >
                Add Attributes
              </Button>
            </div>
          )}
        </div>

        <DialogFooter className="sm:flex-col sm:items-end sm:gap-2">
          {isComplete && newCount === 0 && <p className="text-xs text-muted-foreground">All selected combinations already exist.</p>}
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleGenerate} disabled={loading || generating || !attributes.length || (isComplete && newCount === 0)}>
              <Wand2 className="mr-2 h-4 w-4" />
              {generating ? "Generating..." : isComplete ? `Generate ${newCount} new variant${newCount === 1 ? "" : "s"}` : "Generate"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
