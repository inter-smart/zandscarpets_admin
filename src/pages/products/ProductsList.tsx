import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/common/DataTable";
import RowActionsMenu from "@/components/common/RowActionsMenu";
import StatusToggleCell from "@/components/common/StatusToggleCell";
import SortOrderCell from "@/components/common/SortOrderCell";
import DeleteDialogue from "@/components/common/DeleteDialogue";
import StatusChangeDialogue from "@/components/common/StatusChangeDialogue";
import FooterChangeDialogue from "@/components/common/FooterChangeDialogue";
import { useFooterToggle } from "@/hooks/useFooterToggle";
import MediaThumbnail from "@/components/common/MediaThumbnail";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { HelpCircle, Layers, RotateCcw, LayoutList, Tags } from "lucide-react";
import { Combobox, ComboboxOption } from "@/components/ui/combobox";
import FilterField from "@/components/common/FilterField";
import { useToast } from "@/hooks/use-toast";
import { useSortOrder } from "@/hooks/useSortOrder";
import { useStatusToggle } from "@/hooks/useStatusToggle";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { useUrlFilters } from "@/hooks/useUrlFilters";
import {
  fetchProductList,
  deleteProduct,
  toggleProductStatus,
  toggleProductHome,
  toggleProductFooter,
  toggleProductNavbar,
  updateProductSortOrder,
  ProductRecord,
  ProductFilters,
  ApiError,
} from "@/services/products/productsApi";
import { fetchActiveProductCategories } from "@/services/products/productCategoryApi";

const ALL = "all";

type StatusFilter = "all" | "active" | "inactive";

const STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

type HomeFilter = "all" | "yes" | "no";

const HOME_OPTIONS = [
  { value: "all", label: "All" },
  { value: "yes", label: "In home" },
  { value: "no", label: "Not in home" },
];

const NAVBAR_OPTIONS = [
  { value: "all", label: "All" },
  { value: "yes", label: "In navbar" },
  { value: "no", label: "Not in navbar" },
];

const FOOTER_OPTIONS = [
  { value: "all", label: "All" },
  { value: "yes", label: "In footer" },
  { value: "no", label: "Not in footer" },
];

export default function ProductsList() {
  const navigate = useNavigate();
  const location = useLocation();
  // Passed along so the add/edit form can come back here with filters intact.
  const returnState = { state: { from: location.pathname + location.search } };
  const { toast } = useToast();
  const [deleteItemId, setDeleteItemId] = useState<number | null>(null);
  const {
    filters: listFilters,
    setFilter,
    reset: resetListFilters,
  } = useUrlFilters({
    product_category_id: ALL,
    status: ALL,
    home: ALL,
    footer: ALL,
    navbar: ALL,
  });
  const categoryFilter = listFilters.product_category_id;
  const statusFilter = listFilters.status as StatusFilter;
  const homeFilter = listFilters.home as HomeFilter;
  const footerFilter = listFilters.footer as HomeFilter;
  const navbarFilter = listFilters.navbar as HomeFilter;
  const [categoryOptions, setCategoryOptions] = useState<ComboboxOption[]>([]);

  useEffect(() => {
    fetchActiveProductCategories()
      .then((res) => setCategoryOptions(res.data.map((c) => ({ value: String(c.id), label: c.title }))))
      .catch(() => setCategoryOptions([]));
  }, []);

  const filters = useMemo<ProductFilters>(
    () => ({
      product_category_id: categoryFilter === ALL ? undefined : Number(categoryFilter),
      status: statusFilter === "all" ? undefined : statusFilter,
      show_in_home: homeFilter === ALL ? undefined : homeFilter === "yes",
      show_in_footer: footerFilter === ALL ? undefined : footerFilter === "yes",
      list_in_navbar: navbarFilter === ALL ? undefined : navbarFilter === "yes",
    }),
    [categoryFilter, statusFilter, homeFilter, footerFilter, navbarFilter],
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
  } = usePaginatedList<ProductRecord, ProductFilters>(fetchProductList, 10, filters);

  const hasActiveFilters =
    categoryFilter !== ALL || statusFilter !== "all" || homeFilter !== ALL || footerFilter !== ALL || navbarFilter !== ALL || searchInput !== "";

  const resetAll = () => {
    resetListFilters();
    setSearchInput("");
    setPage(1);
  };

  const handleSortOrderChange = useSortOrder(items, setItems, updateProductSortOrder);
  const { statusToggleItem, setStatusToggleItem, confirmStatusToggle } = useStatusToggle({
    setItems,
    refetch,
    toggleStatus: toggleProductStatus,
    label: "Product",
  });

  // Navbar toggle — confirm -> API -> optimistic row update -> toast.
  const [navbarToggleItem, setNavbarToggleItem] = useState<{
    item: ProductRecord;
    newValue: boolean;
  } | null>(null);
  const navbarActionRef = useRef<HTMLButtonElement>(null);

  const confirmNavbarToggle = async () => {
    if (!navbarToggleItem) return;
    const { item, newValue } = navbarToggleItem;
    try {
      await toggleProductNavbar(item, newValue);
      setItems((prev) => prev.map((p) => (p.id === item.id ? { ...p, list_in_navbar: newValue } : p)));
      toast({
        title: "Success",
        description: `Product ${newValue ? "added to" : "removed from"} navbar successfully`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof ApiError ? error.message : "Failed to update navbar visibility",
        variant: "destructive",
      });
    } finally {
      setNavbarToggleItem(null);
    }
  };

  const { footerToggleItem, setFooterToggleItem, confirmFooterToggle } = useFooterToggle<ProductRecord>({
    setItems,
    toggleFooter: toggleProductFooter,
    label: "Product",
  });

  // Home toggle — confirm -> API -> optimistic row update -> toast.
  const [homeToggleItem, setHomeToggleItem] = useState<{
    item: ProductRecord;
    newValue: boolean;
  } | null>(null);
  const homeActionRef = useRef<HTMLButtonElement>(null);

  const confirmHomeToggle = async () => {
    if (!homeToggleItem) return;
    const { item, newValue } = homeToggleItem;
    try {
      await toggleProductHome(item, newValue);
      setItems((prev) => prev.map((p) => (p.id === item.id ? { ...p, show_in_home: newValue } : p)));
      toast({
        title: "Success",
        description: `Product ${newValue ? "added to" : "removed from"} home page successfully`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof ApiError ? error.message : "Failed to update home page visibility",
        variant: "destructive",
      });
    } finally {
      setHomeToggleItem(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteItemId) return;

    try {
      await deleteProduct(deleteItemId);
      if (items.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        refetch();
      }
      toast({ title: "Success", description: "Product deleted successfully" });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof ApiError ? error.message : "Failed to delete Product",
        variant: "destructive",
      });
    } finally {
      setDeleteItemId(null);
    }
  };

  const columns: ColumnDef<ProductRecord>[] = [
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ row }) => <div className="font-mono">{(itemsPage - 1) * itemsLimit + row.index + 1}</div>,
    },
    {
      accessorKey: "main_media_path",
      header: "Image",
      cell: ({ row }) => <MediaThumbnail path={row.original.main_media_path} alt={row.original.media_alt || row.original.title} />,
    },
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => <div className="font-medium max-w-[280px] truncate">{row.getValue("title")}</div>,
    },
    {
      id: "category",
      header: "Category",
      cell: ({ row }) => <div className="text-sm">{row.original.category?.title || "-"}</div>,
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
        return <StatusToggleCell status={status} onCheckedChange={(checked) => setStatusToggleItem({ item: row.original, newStatus: checked })} />;
      },
    },
    {
      accessorKey: "show_in_home",
      header: "Home Visibility",
      cell: ({ row }) => (
        <StatusToggleCell
         
          status={!!row.original.show_in_home}
          onCheckedChange={(checked) => setHomeToggleItem({ item: row.original, newValue: checked })}
        />
      ),
    },
    {
      accessorKey: "list_in_navbar",
      header: "Navbar Visibility",
      cell: ({ row }) => (
        <StatusToggleCell
         
          status={!!row.original.list_in_navbar}
          onCheckedChange={(checked) => setNavbarToggleItem({ item: row.original, newValue: checked })}
        />
      ),
    },
    {
      accessorKey: "show_in_footer",
      header: "Footer Visibility",
      cell: ({ row }) => (
        <StatusToggleCell
         
          status={!!row.original.show_in_footer}
          onCheckedChange={(checked) => setFooterToggleItem({ item: row.original, newValue: checked })}
        />
      ),
    },
    {
      id: "variants",
      header: "Variants",
      cell: ({ row }) => {
        const count = row.original.variant_count ?? 0;
        return <Badge variant={count ? "secondary" : "outline"}>{count}</Badge>;
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const item = row.original;
        return (
          <RowActionsMenu
            extraItems={
              <>
                <DropdownMenuItem onClick={() => navigate(`/products/${item.id}/variants`, returnState)}>
                  <Layers className="mr-2 h-4 w-4" />
                  Variants
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate(`/faqs?product_id=${item.id}`, returnState)}>
                  <HelpCircle className="mr-2 h-4 w-4" />
                  FAQs
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate(`/products/${item.id}/details`, returnState)}>
                  <LayoutList className="mr-2 h-4 w-4" />
                  Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate(`/meta-tags?type=product&product_id=${item.id}`, returnState)}>
                  <Tags className="mr-2 h-4 w-4" />
                  SEO Meta
                </DropdownMenuItem>
              </>
            }
            onEdit={() => navigate(`/products/${item.id}/edit`, returnState)}
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
        data={items}
        title="Products"
        searchPlaceholder="Search Products..."
        onAdd={() => navigate("/products/new", returnState)}
        addButtonText="Add Product"
        loading={loading}
        searching={searching}
        searchQuery={searchInput}
        onSearchChange={setSearchInput}
        headerExtra={
          <>
            <FilterField label="Category">
              <Combobox
                maxVisibleItems={5}
                autoWidth
                value={categoryFilter}
                options={[{ value: ALL, label: "All" }, ...categoryOptions]}
                placeholder="All"
                searchPlaceholder="Search category..."
                onChange={(v) => setFilter("product_category_id", v || ALL)}
              />
            </FilterField>
            <FilterField label="Status">
              <Combobox
                maxVisibleItems={3}
                autoWidth
                value={statusFilter}
                options={STATUS_OPTIONS}
                placeholder="All"
                searchPlaceholder="Search status..."
                onChange={(value) => setFilter("status", value)}
              />
            </FilterField>
            <FilterField label="Home">
              <Combobox
                maxVisibleItems={3}
                autoWidth
                value={homeFilter}
                options={HOME_OPTIONS}
                placeholder="All"
                searchPlaceholder="Search home..."
                onChange={(value) => setFilter("home", value || ALL)}
              />
            </FilterField>
            <FilterField label="Navbar">
              <Combobox
                maxVisibleItems={3}
                autoWidth
                value={navbarFilter}
                options={NAVBAR_OPTIONS}
                placeholder="All"
                searchPlaceholder="Search navbar..."
                onChange={(value) => setFilter("navbar", value || ALL)}
              />
            </FilterField>
            <FilterField label="Footer">
              <Combobox
                maxVisibleItems={3}
                autoWidth
                value={footerFilter}
                options={FOOTER_OPTIONS}
                placeholder="All"
                searchPlaceholder="Search footer..."
                onChange={(value) => setFilter("footer", value || ALL)}
              />
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

      <DeleteDialogue deleteItemId={deleteItemId} setDeleteItemId={setDeleteItemId} confirmDelete={confirmDelete} itemLabel="Product" />

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
              Are you sure you want to {homeToggleItem?.newValue ? "show this product on the home page" : "remove this product from the home page"}?
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

      <AlertDialog open={!!navbarToggleItem} onOpenChange={() => setNavbarToggleItem(null)}>
        <AlertDialogContent
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            navbarActionRef.current?.focus();
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Navbar Change</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {navbarToggleItem?.newValue ? "show this product in the navbar" : "remove this product from the navbar"}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction ref={navbarActionRef} onClick={confirmNavbarToggle}>
              {navbarToggleItem?.newValue ? "Show in Navbar" : "Remove from Navbar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <FooterChangeDialogue
        footerToggleItem={footerToggleItem}
        setFooterToggleItem={setFooterToggleItem}
        confirmFooterToggle={confirmFooterToggle}
        itemLabel="product"
      />

      <StatusChangeDialogue
        statusToggleItem={statusToggleItem}
        setStatusToggleItem={setStatusToggleItem}
        confirmStatusToggle={confirmStatusToggle}
        itemLabel="Product"
      />
    </>
  );
}
