import { useEffect, useState } from "react";
import PageLoader from "@/components/layout/PageLoader";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  fetchUserById,
  createUser,
  updateUser,
  type CreateUserPayload,
} from "@/services/users/usersApi";
import { fetchRoleOptions, type RoleOption } from "@/services/roles/rolesApi";
import {
  createUserSchema,
  updateUserSchema,
  CreateUserFormData,
  UpdateUserFormData,
} from "@/schemas/userSchema";

export default function UsersForm() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const params = useParams();
  const idParam = params.id ? parseInt(params.id, 10) : null;
  const isEdit = !!idParam;

  const [initialLoading, setInitialLoading] = useState<boolean>(isEdit);
  const [saving, setSaving] = useState(false);
  const [roles, setRoles] = useState<RoleOption[]>([]);

  const resolver = zodResolver(isEdit ? updateUserSchema : createUserSchema);

  const form = useForm<CreateUserFormData | UpdateUserFormData>({
    resolver,
    defaultValues: {
      username: "",
      email: "",
      password: "",
      role_id: undefined,
      is_active: true,
    },
  });

  useEffect(() => {
    fetchRoleOptions()
      .then((list) => {
        setRoles(list);
        // New users default to the first non-system role (Staff) rather than Admin.
        if (!isEdit && form.getValues("role_id") === undefined) {
          const fallback = list.find((r) => !r.is_system) ?? list[0];
          if (fallback) form.setValue("role_id", fallback.id);
        }
      })
      .catch(() =>
        toast({ title: "Error", description: "Failed to load roles", variant: "destructive" }),
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isEdit) return;

    const load = async () => {
      try {
        setInitialLoading(true);
        const resp = await fetchUserById(idParam as number);
        const data = resp.data;
        form.reset({
          username: data.username || "",
          email: data.email || "",
          password: "",
          role_id: data.role_id ?? undefined,
          is_active: data.is_active ?? true,
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load user data",
          variant: "destructive",
        });
      } finally {
        setInitialLoading(false);
      }
    };

    load();
  }, [idParam]);

  const onSubmit = async (values: CreateUserFormData | UpdateUserFormData) => {
    try {
      setSaving(true);

      if (isEdit && idParam) {
        // Remove empty password (means "don't change")
        const payload: CreateUserFormData = { ...values };
        if (!payload.password) delete payload.password;
        await updateUser(idParam, payload);
        toast({ title: "Success", description: "User updated" });
      } else {
        await createUser(values as CreateUserPayload);
        toast({ title: "Success", description: "User created" });
      }

      navigate("/users");
    } catch (error) {
      toast({
        title: "Error",
        description: error?.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (initialLoading) {
    return <PageLoader />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate("/users")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <div>
          <h1 className="text-2xl font-bold">
            {isEdit ? "Edit User" : "Create User"}
          </h1>
          <p className="text-muted-foreground">
            Manage dashboard users and access
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter email"
                        type="email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={
                          isEdit
                            ? "Leave blank to keep existing"
                            : "Enter password"
                        }
                        type="password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="role_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <FormControl>
                        <Combobox
                          options={roles.map((r) => ({ value: String(r.id), label: r.name }))}
                          value={field.value !== undefined ? String(field.value) : ""}
                          onChange={(v) => field.onChange(v ? Number(v) : undefined)}
                          placeholder="Select role"
                          searchPlaceholder="Search roles..."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Status</FormLabel>
                        <p className="text-sm text-muted-foreground">Enable or disable this item.</p>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/users")}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving..." : isEdit ? "Update User" : "Create User"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
