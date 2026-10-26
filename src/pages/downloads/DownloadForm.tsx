import { useState, useEffect } from "react";
import PageLoader from "@/components/layout/PageLoader";
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
import {
  FormFileUploadField,
  FormTextareaField,
  FormTextField,
} from "@/components/forms/FormFieldComponents";
import { Save, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  fetchDownloadById,
  createDownload,
  updateDownload,
  ApiError,
} from "@/services/downloads/downloadsApi";
import { downloadSchema, DownloadFormData } from "@/schemas/downloadSchema";

export default function DownloadForm() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditing);

  const form = useForm<DownloadFormData>({
    resolver: zodResolver(downloadSchema),
    defaultValues: {
      title: "",
      title_ar: "",
      description: "",
      description_ar: "",
      file_path: "",
      sort_order: "1",
      is_active: true,
    },
  });

  useEffect(() => {
    if (isEditing && id) {
      loadDownloadData(parseInt(id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isEditing]);

  const loadDownloadData = async (itemId: number) => {
    try {
      setInitialLoading(true);
      const response = await fetchDownloadById(itemId);
      const data = response.data;

      if (data) {
        form.reset({
          title: data.title || "",
          title_ar: data.title_ar || "",
          description: data.description || "",
          description_ar: data.description_ar || "",
          file_path: data.file_path || "",
          sort_order: (data.sort_order ?? 1).toString(),
          is_active: data.is_active ?? true,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof ApiError ? error.message : "Failed to load download data",
        variant: "destructive",
      });
    } finally {
      setInitialLoading(false);
    }
  };

  const onSubmit = async (data: DownloadFormData) => {
    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("title_ar", data.title_ar);
      formData.append("description", data.description || "");
      formData.append("description_ar", data.description_ar || "");
      formData.append("sort_order", (data.sort_order || "1").toString());
      formData.append("is_active", (data.is_active ?? true).toString());

      if (data.file_path instanceof File) {
        formData.append("file_path", data.file_path);
      } else if (typeof data.file_path === "string" && data.file_path) {
        formData.append("file_path", data.file_path);
      }

      if (isEditing && id) {
        await updateDownload(parseInt(id), formData);
        toast({ title: "Success", description: "Download updated successfully" });
      } else {
        await createDownload(formData);
        toast({ title: "Success", description: "Download created successfully" });
      }

      navigate("/downloads");
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof ApiError ? error.message : `Failed to ${isEditing ? "update" : "create"} download`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return <PageLoader />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate("/downloads")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{isEditing ? "Edit" : "Add"} Download</h1>
          <p className="text-muted-foreground">
            {isEditing ? "Update" : "Create a new"} downloadable file for the public Downloads page
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Download Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormTextField form={form} name="title" label="Title" placeholder="Catalogue Products" />
                <FormTextField
                  form={form}
                  name="title_ar"
                  label="Title (Arabic)"
                  placeholder="كتالوج المنتجات"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormTextareaField
                  form={form}
                  name="description"
                  label="Description"
                  placeholder="Short description shown on the card"
                />
                <FormTextareaField
                  form={form}
                  name="description_ar"
                  label="Description (Arabic)"
                  placeholder="وصف مختصر يظهر في البطاقة"
                />
              </div>
              <FormFileUploadField
                form={form}
                name="file_path"
                label="File (PDF, optional)"
                placeholder="Upload a PDF, up to 10MB"
                accept="application/pdf"
              />
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
            <Button type="button" variant="outline" onClick={() => navigate("/downloads")}>
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
