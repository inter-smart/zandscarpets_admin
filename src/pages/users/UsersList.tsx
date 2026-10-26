import { useNavigate } from "react-router-dom";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import RowActionsMenu from "@/components/common/RowActionsMenu";
import { useToast } from "@/hooks/use-toast";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import {
  fetchUsersList,
  deleteUser,
  AdminUserRecord,
  ApiError,
  toggleUserStatus,
} from "@/services/users/usersApi";
import { useState } from "react";
import { useCanManage } from "@/hooks/useCanManage";
import DeleteDialogue from "@/components/common/DeleteDialogue";
import StatusToggleCell from "@/components/common/StatusToggleCell";
import StatusChangeDialogue from "@/components/common/StatusChangeDialogue";

export default function UsersList() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const canManage = useCanManage();
  const [deleteItemId, setDeleteItemId] = useState<number | null>(null);
  const [statusToggleItem, setStatusToggleItem] = useState<{
    item: AdminUserRecord;
    newStatus: boolean;
  } | null>(null);

  const {
    items: users,
    setItems: setUsers,
    page,
    setPage,
    searchInput,
    setSearchInput,
    totalCount,
    totalPages,
    loading,
    searching,
    refetch,
  } = usePaginatedList<AdminUserRecord>(fetchUsersList, 10);

  const confirmDelete = async () => {
    if (!deleteItemId) return;

    try {
      await deleteUser(deleteItemId);
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof ApiError ? error.message : "Failed to delete user",
        variant: "destructive",
      });
    } finally {
      setDeleteItemId(null);
    }
  };

  const confirmStatusToggle = async () => {
    if (!statusToggleItem) return;

    try {
      const { item, newStatus } = statusToggleItem;
      await toggleUserStatus(item, newStatus);

      // Optimistic update for instant feedback...
      setUsers((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, is_active: newStatus } : i,
        ),
      );
      // ...then resync with the server so the row can't drift from the
      // current page/search results.
      refetch();

      toast({
        title: "Success",
        description: "User status updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error?.message,
        variant: "destructive",
      });
    } finally {
      setStatusToggleItem(null);
    }
  };
  const columns: ColumnDef<AdminUserRecord>[] = [
    {
      accessorKey: "username",
      header: "Username",
      cell: ({ row }) => (
        <div className="font-medium text-sm">{row.getValue("username")}</div>
      ),
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">
          {row.getValue("email")}
        </div>
      ),
    },
    {
      id: "role",
      header: "Role",
      cell: ({ row }) => {
        const role = row.original.roleInfo;
        return (
          <Badge variant={role?.is_system ? "default" : "secondary"}>
            {role?.name ?? "No role"}
          </Badge>
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
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const item = row.original;
        return (
          <RowActionsMenu
            onEdit={() => navigate(`/users/edit/${item.id}`)}
            onDelete={() => setDeleteItemId(item.id)}
          />
        );
      },
    },
  ];

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">User Management</h1>
            <p className="text-muted-foreground">
              Manage admin dashboard users and their access
            </p>
          </div>
          {canManage && <Button onClick={() => navigate("/users/create")}>Add User</Button>}
        </div>

        <DataTable
          columns={columns}
          data={users}
          searchPlaceholder="Search users..."
          showAddButton={false}
          loading={loading}
          searching={searching}
          searchQuery={searchInput}
          onSearchChange={setSearchInput}
          pagination={{
            currentPage: page,
            totalPages,
            totalCount,
            onPageChange: setPage,
          }}
        />
      </div>

      <DeleteDialogue
        deleteItemId={deleteItemId}
        setDeleteItemId={setDeleteItemId}
        confirmDelete={confirmDelete}
        // itemType="user"
      />

      <StatusChangeDialogue
        statusToggleItem={statusToggleItem}
        setStatusToggleItem={setStatusToggleItem}
        confirmStatusToggle={confirmStatusToggle}
        itemLabel="User"
      />
    </>
  );
}
