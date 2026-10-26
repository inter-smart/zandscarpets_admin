import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import PageLoader from "@/components/layout/PageLoader";
import { useToast } from "@/hooks/use-toast";
import { roleSchema, type RoleFormData } from "@/schemas/roleSchema";
import {
  createRole,
  fetchPermissionModules,
  fetchRoleById,
  updateRole,
  type AccessLevel,
  type PermissionModuleInfo,
} from "@/services/roles/rolesApi";
import { cn } from "@/lib/utils";

type Choice = "none" | AccessLevel;

const CHOICES: { value: Choice; label: string }[] = [
  { value: "none", label: "None" },
  { value: "view", label: "View" },
  { value: "manage", label: "Manage" },
];

export default function RoleForm() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const params = useParams();
  const idParam = params.id ? parseInt(params.id, 10) : null;
  const isEdit = !!idParam;

  const [modules, setModules] = useState<PermissionModuleInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const form = useForm<RoleFormData>({
    resolver: zodResolver(roleSchema),
    defaultValues: { name: "", description: "", permissions: {} },
  });

  useEffect(() => {
    const load = async () => {
      try {
        setModules(await fetchPermissionModules());
        if (idParam) {
          const role = await fetchRoleById(idParam);
          if (role.is_system) {
            toast({ title: "Locked", description: "System roles cannot be edited" });
            navigate("/roles", { replace: true });
            return;
          }
          form.reset({
            name: role.name,
            description: role.description ?? "",
            permissions: role.permissions,
          });
        }
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to load role",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idParam]);

  const grouped = useMemo(() => {
    const map = new Map<string, PermissionModuleInfo[]>();
    modules.forEach((m) => map.set(m.group, [...(map.get(m.group) ?? []), m]));
    return [...map.entries()];
  }, [modules]);

  const permissions = form.watch("permissions");

  const setChoice = (key: string, choice: Choice) => {
    const next = { ...form.getValues("permissions") };
    if (choice === "none") delete next[key];
    else next[key] = choice;
    form.setValue("permissions", next, { shouldDirty: true });
  };

  const setAll = (choice: Choice) => {
    const next: Record<string, AccessLevel> = {};
    if (choice !== "none") modules.forEach((m) => (next[m.key] = choice));
    form.setValue("permissions", next, { shouldDirty: true });
  };

  const onSubmit = async (values: RoleFormData) => {
    try {
      setSaving(true);
      const payload = {
        name: values.name,
        description: values.description || null,
        permissions: values.permissions,
      };
      if (isEdit && idParam) await updateRole(idParam, payload);
      else await createRole(payload);
      toast({ title: "Success", description: isEdit ? "Role updated" : "Role created" });
      navigate("/roles");
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save role",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate("/roles")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{isEdit ? "Edit Role" : "Create Role"}</h1>
          <p className="text-muted-foreground">
            Changes apply to everyone with this role on their next action
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Role</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. SEO Team" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea rows={2} placeholder="Optional" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle>Permissions</CardTitle>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Set all:</span>
                {CHOICES.map((c) => (
                  <Button key={c.value} type="button" variant="outline" size="sm" onClick={() => setAll(c.value)}>
                    {c.label}
                  </Button>
                ))}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-sm text-muted-foreground">
                <strong>View</strong> lets the role open pages and read data. <strong>Manage</strong> also allows
                adding, editing and deleting. The dashboard is always available.
              </p>
              <p className="text-xs text-muted-foreground">
                Pages and menus are hidden by these settings. Behind the scenes, content that other forms use
                for dropdowns (everything except Leads, Site Settings, Users and Roles) can still be read by
                any signed-in user, but only changed by roles with Manage.
              </p>
              {grouped.map(([group, items]) => (
                <div key={group}>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {group}
                  </h3>
                  <div className="divide-y rounded-md border">
                    {items.map((m) => {
                      const current: Choice = permissions?.[m.key] ?? "none";
                      return (
                        <div key={m.key} className="flex flex-wrap items-center justify-between gap-3 p-3">
                          <div className="min-w-0">
                            <div className="text-sm font-medium">{m.label}</div>
                            {m.description && (
                              <div className="text-xs text-muted-foreground">{m.description}</div>
                            )}
                          </div>
                          <div className="inline-flex rounded-md border p-0.5" role="radiogroup" aria-label={m.label}>
                            {CHOICES.map((c) => (
                              <button
                                key={c.value}
                                type="button"
                                role="radio"
                                aria-checked={current === c.value}
                                onClick={() => setChoice(m.key, c.value)}
                                className={cn(
                                  "rounded px-3 py-1 text-xs font-medium transition-colors",
                                  current === c.value
                                    ? c.value === "none"
                                      ? "bg-muted text-foreground"
                                      : "bg-primary text-primary-foreground"
                                    : "text-muted-foreground hover:bg-muted",
                                )}
                              >
                                {c.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => navigate("/roles")}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Saving..." : isEdit ? "Update Role" : "Create Role"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
