import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import PageLoader from "@/components/layout/PageLoader";
import DeleteDialogue from "@/components/common/DeleteDialogue";
import { useToast } from "@/hooks/use-toast";
import { useCanManage } from "@/hooks/useCanManage";
import { deleteRole, fetchRoles, type RoleRecord } from "@/services/roles/rolesApi";

const summarize = (role: RoleRecord): string => {
  if (role.is_system) return "Full access";
  const entries = Object.values(role.permissions);
  if (entries.length === 0) return "No access";
  const manage = entries.filter((a) => a === "manage").length;
  return `${manage} manage · ${entries.length - manage} view-only`;
};

export default function RolesList() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const canManage = useCanManage();
  const [roles, setRoles] = useState<RoleRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteItemId, setDeleteItemId] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      setRoles(await fetchRoles());
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load roles",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const confirmDelete = async () => {
    if (!deleteItemId) return;
    try {
      await deleteRole(deleteItemId);
      toast({ title: "Success", description: "Role deleted successfully" });
      await load();
    } catch (error) {
      toast({
        title: "Cannot delete role",
        description: error instanceof Error ? error.message : "Failed to delete role",
        variant: "destructive",
      });
    } finally {
      setDeleteItemId(null);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Roles &amp; Permissions</h1>
            <p className="text-muted-foreground">
              Create roles and choose what each one can view or manage
            </p>
          </div>
          {canManage && (
            <Button onClick={() => navigate("/roles/new")}>
              <Plus className="mr-2 h-4 w-4" />
              Add Role
            </Button>
          )}
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role</TableHead>
                  <TableHead>Access</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead className="w-28 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell>
                      <div className="flex items-center gap-2 font-medium">
                        {role.name}
                        {role.is_system && <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
                      </div>
                      {role.description && (
                        <div className="text-xs text-muted-foreground">{role.description}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={role.is_system ? "default" : "secondary"}>{summarize(role)}</Badge>
                    </TableCell>
                    <TableCell>{role.user_count ?? 0}</TableCell>
                    <TableCell className="text-right">
                      {role.is_system ? (
                        <span className="text-xs text-muted-foreground">Locked</span>
                      ) : (
                        canManage && (
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={`Edit ${role.name}`}
                              onClick={() => navigate(`/roles/${role.id}/edit`)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={`Delete ${role.name}`}
                              className="text-destructive"
                              onClick={() => setDeleteItemId(role.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <DeleteDialogue
        deleteItemId={deleteItemId}
        setDeleteItemId={setDeleteItemId}
        confirmDelete={confirmDelete}
      />
    </>
  );
}
