import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { FormTextField } from "@/components/forms/FormFieldComponents";
import { Save, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  fetchBlogTagById,
  createBlogTag,
  updateBlogTag,
  ApiError,
} from "@/services/blogs/blogTagApi";
import { blogTagSchema, BlogTagFormData } from "@/schemas/blogTagSchema";

export default function BlogTagForm() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditing);

  const form = useForm<BlogTagFormData>({
    resolver: zodResolver(blogTagSchema),
    defaultValues: {
      title: "",
      title_ar: "",
      sort_order: "1",
      is_active: true,
    },
  });

  useEffect(() => {
    if (isEditing && id) {
      loadTagData(parseInt(id));
    }
  }, [id, isEditing]);

  const loadTagData = async (itemId: number) => {
    try {
      setInitialLoading(true);
      const response = await fetchBlogTagById(itemId);
      const data = response.data;

      form.reset({
        title: data.title || "",
        title_ar: data.title_ar || "",
        sort_order: (data.sort_order ?? 1).toString(),
        is_active: data.is_active ?? true,
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof ApiError ? error.message : "Failed to load Blog Tag data",
        variant: "destructive",
      });
    } finally {
      setInitialLoading(false);
    }
  };

  const onSubmit = async (data: BlogTagFormData) => {
    try {
      setLoading(true);

      const payload = {
        title: data.title,
        title_ar: data.title_ar,
        sort_order: parseInt(data.sort_order || "1"),
        is_active: data.is_active,
      };

      if (isEditing && id) {
        await updateBlogTag(parseInt(id), payload);
        toast({ title: "Success", description: "Blog Tag updated successfully" });
      } else {
        await createBlogTag(payload);
        toast({ title: "Success", description: "Blog Tag created successfully" });
      }

      navigate("/blog-tags");
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof ApiError
            ? error.message
            : `Failed to ${isEditing ? "update" : "create"} Blog Tag`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading Blog Tag data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate("/blog-tags")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            {isEditing ? "Edit" : "Add"} Blog Tag
          </h1>
          <p className="text-muted-foreground">
            {isEditing ? "Update" : "Create a new"} Blog Tag
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Blog Tag Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormTextField
                  form={form}
                  name="title"
                  label="Title"
                  placeholder="e.g., Stain resistant"
                />

                <FormTextField
                  form={form}
                  name="title_ar"
                  label="Title (Arabic)"
                  placeholder="مثال: مقاوم للبقع"
                />
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
                        <Input
                          type="number"
                          min={1}
                          placeholder="1"
                          {...field}
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
                        <p className="text-sm text-muted-foreground">
                          Enable or disable this item.
                        </p>
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
              onClick={() => navigate("/blog-tags")}
            >
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
