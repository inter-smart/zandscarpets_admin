import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/common/DataTable";
import RowActionsMenu from "@/components/common/RowActionsMenu";
import StatusToggleCell from "@/components/common/StatusToggleCell";
import SortOrderCell from "@/components/common/SortOrderCell";
import DeleteDialogue from "@/components/common/DeleteDialogue";
import StatusChangeDialogue from "@/components/common/StatusChangeDialogue";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Combobox, ComboboxOption } from "@/components/ui/combobox";
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
import { Tags, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSortOrder } from "@/hooks/useSortOrder";
import { useStatusToggle } from "@/hooks/useStatusToggle";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { useUrlFilters } from "@/hooks/useUrlFilters";
import {
  fetchProjectsList,
  deleteProject,
  toggleProjectStatus,
  toggleProjectHome,
  updateProjectSortOrder,
  ProjectRecord,
  ProjectFilters,
  ApiError,
} from "@/services/masters/projectsApi";
import { fetchActiveIndustries } from "@/services/masters/industryApi";
import MediaThumbnail from "@/components/common/MediaThumbnail";
import { STATUS_OPTIONS, StatusFilter } from "@/constants/filterOptions";

const ALL = "all";

type HomeFilter = "all" | "yes" | "no";

const HOME_OPTIONS = [
  { value: "all", label: "All home" },
  { value: "yes", label: "In home" },
  { value: "no", label: "Not in home" },
];

export default function ProjectsList() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [deleteItemId, setDeleteItemId] = useState<number | null>(null);
  const [industryOptions, setIndustryOptions] = useState<ComboboxOption[]>([]);

  const {
    filters: listFilters,
    setFilter,
    reset: resetListFilters,
  } = useUrlFilters({
    industry_id: ALL,
    status: ALL,
    home: ALL,
  });
  const industryFilter = listFilters.industry_id;
  const statusFilter = listFilters.status as StatusFilter;
  const homeFilter = listFilters.home as HomeFilter;

  useEffect(() => {
    fetchActiveIndustries()
      .then((res) => setIndustryOptions(res.data.map((i) => ({ value: String(i.id), label: i.title }))))
      .catch(() => setIndustryOptions([]));
  }, []);

  const filters = useMemo<ProjectFilters>(
    () => ({
      industry_id: industryFilter === ALL ? undefined : Number(industryFilter),
      status: statusFilter === ALL ? undefined : statusFilter,
      show_in_home: homeFilter === ALL ? undefined : homeFilter === "yes",
    }),
    [industryFilter, statusFilter, homeFilter],
  );

  const {
    items: projects,
    setItems: setProjects,
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
  } = usePaginatedList<ProjectRecord, ProjectFilters>(fetchProjectsList, 10, filters);

  const hasActiveFilters = industryFilter !== ALL || statusFilter !== ALL || homeFilter !== ALL || searchInput !== "";

  const resetAll = () => {
    resetListFilters();
    setSearchInput("");
    setPage(1);
  };

  const handleSortOrderChange = useSortOrder(projects, setProjects, updateProjectSortOrder);
  const { statusToggleItem, setStatusToggleItem, confirmStatusToggle } = useStatusToggle({
    setItems: setProjects,
    refetch,
    toggleStatus: toggleProjectStatus,
    label: "Project",
  });

  // Home toggle — confirm -> API -> optimistic row update -> toast.
  const [homeToggleItem, setHomeToggleItem] = useState<{
    item: ProjectRecord;
    newValue: boolean;
  } | null>(null);
  const homeActionRef = useRef<HTMLButtonElement>(null);

  const confirmHomeToggle = async () => {
    if (!homeToggleItem) return;
    const { item, newValue } = homeToggleItem;
    try {
      await toggleProjectHome(item, newValue);
      setProjects((prev) => prev.map((p) => (p.id === item.id ? { ...p, is_show_in_home: newValue } : p)));
      toast({
        title: "Success",
        description: `Project ${newValue ? "added to" : "removed from"} home page successfully`,
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
      await deleteProject(deleteItemId);
      if (projects.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        refetch();
      }
      toast({ title: "Success", description: "Project deleted successfully" });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof ApiError ? error.message : "Failed to delete project",
        variant: "destructive",
      });
    } finally {
      setDeleteItemId(null);
    }
  };

  const columns: ColumnDef<ProjectRecord>[] = [
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ row }) => <div className="font-mono">{(itemsPage - 1) * itemsLimit + row.index + 1}</div>,
    },
    {
      accessorKey: "thumbnail",
      header: "Thumbnail",
      cell: ({ row }) => <MediaThumbnail path={row.getValue("thumbnail")} alt={row.original.title} />,
    },
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => <div className="font-medium">{row.getValue("title")}</div>,
    },
    {
      id: "industry",
      header: "Industry",
      cell: ({ row }) => <div className="text-sm text-muted-foreground">{row.original.industry?.title || "-"}</div>,
    },
    {
      id: "category",
      header: "Category",
      cell: ({ row }) => <div className="text-sm text-muted-foreground">{row.original.category?.title || "-"}</div>,
    },
    {
      accessorKey: "location",
      header: "Location",
      cell: ({ row }) => <div className="text-sm text-muted-foreground">{row.getValue("location") || "-"}</div>,
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
      accessorKey: "is_show_in_home",
      header: "Home Visibility",
      cell: ({ row }) => (
        <StatusToggleCell
          status={!!row.original.is_show_in_home}
          onCheckedChange={(checked) => setHomeToggleItem({ item: row.original, newValue: checked })}
        />
      ),
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
            extraItems={
              <DropdownMenuItem onClick={() => navigate(`/meta-tags/new?type=project&project_id=${item.id}`, { state: { from: location.pathname + location.search } })}>
                <Tags className="mr-2 h-4 w-4" />
                SEO Meta
              </DropdownMenuItem>
            }
            onEdit={() => navigate(`/projects/${item.id}/edit`)}
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
        data={projects}
        title="Projects"
        searchPlaceholder="Search projects..."
        onAdd={() => navigate("/projects/new")}
        addButtonText="Add Project"
        loading={loading}
        searching={searching}
        searchQuery={searchInput}
        onSearchChange={setSearchInput}
        headerExtra={
          <>
            <Combobox
              maxVisibleItems={5}
              autoWidth
              value={industryFilter}
              options={[{ value: ALL, label: "All industries" }, ...industryOptions]}
              placeholder="All industries"
              searchPlaceholder="Search industry..."
              onChange={(v) => setFilter("industry_id", v || ALL)}
            />
            <Combobox
              maxVisibleItems={3}
              autoWidth
              value={statusFilter}
              options={STATUS_OPTIONS}
              placeholder="All statuses"
              searchPlaceholder="Search status..."
              onChange={(value) => setFilter("status", value)}
            />
            <Combobox
              maxVisibleItems={3}
              autoWidth
              value={homeFilter}
              options={HOME_OPTIONS}
              placeholder="All home"
              searchPlaceholder="Search home..."
              onChange={(value) => setFilter("home", value || ALL)}
            />
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

      <DeleteDialogue deleteItemId={deleteItemId} setDeleteItemId={setDeleteItemId} confirmDelete={confirmDelete} />

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
                ? "show this project on the home page"
                : "remove this project from the home page"}
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

      <StatusChangeDialogue
        statusToggleItem={statusToggleItem}
        setStatusToggleItem={setStatusToggleItem}
        confirmStatusToggle={confirmStatusToggle}
        itemLabel="project"
      />
    </>
  );
}
