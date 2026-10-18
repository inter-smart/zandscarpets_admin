import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useParams, useNavigate } from "react-router-dom";
import PageLoader from "@/components/layout/PageLoader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormTextField, FormSwitchField, FormSelectField } from "@/components/forms/FormFieldComponents";
import { Save, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  fetchDetailFieldById,
  createDetailField,
  updateDetailField,
  FIELD_TYPES,
  ApiError,
} from "@/services/details/detailFieldsApi";
import { detailFieldSchema, DetailFieldFormData } from "@/schemas/detailFieldSchema";

const TYPE_OPTIONS = [
  { value: "rich_text", label: "Rich Text" },
  { value: "image", label: "Image" },
  { value: "video", label: "Video" },
];

export default function DetailFieldForm() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditing);
  // Once any mapping of this field has items, the backend blocks a type
  // change — mirror that here so the select is disabled rather than letting
  // the admin hit a 422 after filling out the rest of the form.
  const [typeLocked, setTypeLocked] = useState(false);

  const form = useForm<DetailFieldFormData>({
    resolver: zodResolver(detailFieldSchema),
    defaultValues: {
      name: "",
      name_ar: "",
      type: "rich_text",
      allows_multiple: false,
      sort_order: "1",
      is_active: true,
    },
  });

  useEffect(() => {
    if (isEditing && id) loadData(parseInt(id));
  }, [id, isEditing]);

  const watchedType = form.watch("type");
  useEffect(() => {
    if (watchedType === "rich_text") {
      form.setValue("allows_multiple", false);
    }
  }, [watchedType]);

  const loadData = async (itemId: number) => {
    try {
      setInitialLoading(true);
      const { data } = await fetchDetailFieldById(itemId);
      form.reset({
        name: data.name || "",
        name_ar: data.name_ar || "",
        type: data.type,
        allows_multiple: data.allows_multiple ?? false,
        sort_order: (data.sort_order ?? 1).toString(),
        is_active: data.is_active ?? true,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof ApiError ? error.message : "Failed to load detail field",
        variant: "destructive",
      });
    } finally {
      setInitialLoading(false);
    }
  };

  const onSubmit = async (data: DetailFieldFormData) => {
    try {
      setLoading(true);

      const payload = {
        name: data.name,
        name_ar: data.name_ar || "",
        type: data.type,
        allows_multiple: data.allows_multiple,
        sort_order: parseInt(data.sort_order || "1"),
        is_active: data.is_active,
      };

      if (isEditing && id) {
        await updateDetailField(parseInt(id), payload);
        toast({ title: "Success", description: "Detail field updated successfully" });
      } else {
        await createDetailField(payload);
        toast({ title: "Success", description: "Detail field created successfully" });
      }

      navigate("/details/fields");
    } catch (error) {
      if (error instanceof ApiError && error.fieldErrors.some((e) => e.path === "type")) {
        setTypeLocked(true);
      }
      toast({
        title: "Error",
        description:
          error instanceof ApiError ? error.message : `Failed to ${isEditing ? "update" : "create"} detail field`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate("/details/fields")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{isEditing ? "Edit" : "Add"} Detail Field</h1>
          <p className="text-muted-foreground">
            A content-block type (e.g. Description, Gallery) that products and variants can map content onto
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Field Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormTextField form={form} name="name" label="Name" placeholder="e.g., Installation Guide" />
              <FormTextField form={form} name="name_ar" label="Name (Arabic)" placeholder="مثال: تعليمات التركيب" />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {typeLocked ? (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <FormControl>
                      <Input value={TYPE_OPTIONS.find((o) => o.value === form.watch("type"))?.label} disabled />
                    </FormControl>
                    <p className="text-sm text-muted-foreground">
                      This field already has content — its type cannot be changed.
                    </p>
                  </FormItem>
                ) : (
                  <FormSelectField form={form} name="type" label="Type" options={TYPE_OPTIONS} />
                )}
                {["image", "video"].includes(watchedType) && (
                  <FormSwitchField
                    form={form}
                    name="allows_multiple"
                    label="Allows Multiple Items"
                    description="E.g. a gallery of several images, vs. a single image."
                  />
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Publishing Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="sort_order"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sort Order</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} placeholder="1" {...field} />
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
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => navigate("/details/fields")}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? "Saving..." : isEditing ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
