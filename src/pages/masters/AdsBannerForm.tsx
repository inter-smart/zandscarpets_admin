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
  FormTextField,
} from "@/components/forms/FormFieldComponents";
import { Save, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  fetchAdsBannerById,
  createAdsBanner,
  updateAdsBanner,
  ApiError,
} from "@/services/masters/adsBannerApi";
import { adsBannerSchema, AdsBannerFormData } from "@/schemas/adsBannerSchema";

export default function AdsBannerForm() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditing);

  const form = useForm<AdsBannerFormData>({
    resolver: zodResolver(adsBannerSchema),
    defaultValues: {
      media_path: "",
      media_alt: "",
      media_alt_ar: "",
      link: "",
      link_new_tab: false,
      button_text: "",
      button_text_ar: "",
      sort_order: "1",
      is_active: true,
    },
  });

  useEffect(() => {
    if (isEditing && id) {
      loadAdsBannerData(parseInt(id));
    }
  }, [id, isEditing]);

  const loadAdsBannerData = async (itemId: number) => {
    try {
      setInitialLoading(true);
      const response = await fetchAdsBannerById(itemId);
      const data = response.data;

      if (data) {
        form.reset({
          media_path: data.media_path || "",
          media_alt: data.media_alt || "",
          media_alt_ar: data.media_alt_ar || "",
          link: data.link || "",
          link_new_tab: data.link_new_tab ?? false,
          button_text: data.button_text || "",
          button_text_ar: data.button_text_ar || "",
          sort_order: (data.sort_order ?? 1).toString(),
          is_active: data.is_active ?? true,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof ApiError
            ? error.message
            : "Failed to load banner data",
        variant: "destructive",
      });
    } finally {
      setInitialLoading(false);
    }
  };

  const onSubmit = async (data: AdsBannerFormData) => {
    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("media_alt", data.media_alt || "");
      formData.append("media_alt_ar", data.media_alt_ar || "");
      formData.append("link", data.link || "");
      formData.append("link_new_tab", (data.link_new_tab ?? false).toString());
      formData.append("button_text", data.button_text || "");
      formData.append("button_text_ar", data.button_text_ar || "");
      formData.append("sort_order", (data.sort_order || "1").toString());
      formData.append("is_active", (data.is_active ?? true).toString());

      if (data.media_path instanceof File) {
        formData.append("media_path", data.media_path);
      } else if (typeof data.media_path === "string" && data.media_path) {
        formData.append("media_path", data.media_path);
      }

      if (isEditing && id) {
        await updateAdsBanner(parseInt(id), formData);
        toast({
          title: "Success",
          description: "Ads banner updated successfully",
        });
      } else {
        await createAdsBanner(formData);
        toast({
          title: "Success",
          description: "Ads banner created successfully",
        });
      }

      navigate("/ads-banner");
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof ApiError
            ? error.message
            : `Failed to ${isEditing ? "update" : "create"} ads banner`,
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
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate("/ads-banner")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            {isEditing ? "Edit" : "Add"} Ads Banner
          </h1>
          <p className="text-muted-foreground">
            {isEditing ? "Update" : "Create a new"} ads banner
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Banner Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormFileUploadField
                form={form}
                name="media_path"
                label="Banner image"
                placeholder="Upload banner image"
                accept="image/*"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormTextField
                  form={form}
                  name="media_alt"
                  label="Media Alt Text"
                  placeholder="Describe the banner media"
                />

                <FormTextField
                  form={form}
                  name="media_alt_ar"
                  label="Media Alt Text (Arabic)"
                  placeholder="صف وسائط الإعلان"
                />
              </div>

              <FormTextField
                form={form}
                name="link"
                label="Link"
                placeholder="/en/products?category=vinyl-flooring or https://..."
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormTextField
                  form={form}
                  name="button_text"
                  label="Button Text"
                  placeholder="Shop Now (default when a link is set)"
                />
                <FormTextField
                  form={form}
                  name="button_text_ar"
                  label="Button Text (Arabic)"
                  placeholder="تسوق الآن"
                />
              </div>
              <FormField
                control={form.control}
                name="link_new_tab"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Open in a new tab</FormLabel>
                      <p className="text-sm text-muted-foreground">Open the link in a new browser tab.</p>
                    </div>
                    <FormControl>
                      <Switch checked={!!field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
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
              onClick={() => navigate("/ads-banner")}
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
