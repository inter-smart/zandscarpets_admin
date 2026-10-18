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
  fetchSocialMediaById,
  createSocialMedia,
  updateSocialMedia,
} from "@/services/common/socialMediaApi";
import {
  SOCIAL_ICON_ACCEPT,
  SOCIAL_ICON_MAX_BYTES,
  SOCIAL_ICON_RECOMMENDED,
  validateSocialIcon,
} from "@/utils/socialIconValidation";
import {
  socialMediaSchema,
  SocialMediaFormData,
} from "@/schemas/commonSchemas";

export default function SocialMediaForm() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditing);

  const form = useForm<SocialMediaFormData>({
    resolver: zodResolver(socialMediaSchema),
    defaultValues: {
      media_path: "",
      media_alt: "",
      media_alt_ar: "",
      link: "",
      sort_order: "1",
      is_active: true,
    },
  });

  useEffect(() => {
    if (isEditing && id) {
      loadSocialMediaData(parseInt(id));
    }
  }, [id, isEditing]);

  const loadSocialMediaData = async (itemId: number) => {
    try {
      setInitialLoading(true);
      const response = await fetchSocialMediaById(itemId);
      const data = response.data;

      if (data) {
        form.reset({
          media_path: data.media_path || "",
          media_alt: data.media_alt || "",
          media_alt_ar: data.media_alt_ar || "",
          link: data.link || "",
          sort_order: (data.sort_order ?? 1).toString(),
          is_active: data.is_active ?? true,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load social media data",
        variant: "destructive",
      });
    } finally {
      setInitialLoading(false);
    }
  };

  const onSubmit = async (data: SocialMediaFormData) => {
    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("media_alt", data.media_alt);
      formData.append("media_alt_ar", data.media_alt_ar);
      formData.append("link", data.link);
      formData.append("sort_order", (data.sort_order || "1").toString());
      formData.append("is_active", (data.is_active ?? true).toString());

      // Add each icon file if a new one was chosen, otherwise fall back to the existing path string
      const fileKeys = ["media_path"] as const;
      for (const key of fileKeys) {
        const value = data[key];
        if (value instanceof File || typeof value === "string") {
          formData.append(key, value);
        }
      }

      if (isEditing && id) {
        await updateSocialMedia(parseInt(id), formData);
        toast({
          title: "Success",
          description: "Social media item updated successfully",
        });
      } else {
        await createSocialMedia(formData);
        toast({
          title: "Success",
          description: "Social media item created successfully",
        });
      }

      navigate("/social-media");
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${isEditing ? "update" : "create"} social media item`,
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
          onClick={() => navigate("/social-media")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            {isEditing ? "Edit" : "Add"} Social Media
          </h1>
          <p className="text-muted-foreground">
            {isEditing ? "Update" : "Create a new"} social media item
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Social Media Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormTextField
                  form={form}
                  name="media_alt"
                  label="Alt Text"
                  placeholder="e.g., Facebook, Twitter, LinkedIn"
                />

                <FormTextField
                  form={form}
                  name="media_alt_ar"
                  label="Arabic Alt Text"
                  placeholder="مثال: فيسبوك، تويتر، لينكدإن"
                />
              </div>

              <FormTextField
                form={form}
                name="link"
                label="Link"
                placeholder="https://..."
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormFileUploadField
                  form={form}
                  name="media_path"
                  label="Icon"
                  placeholder="Upload social media icon"
                  accept={SOCIAL_ICON_ACCEPT}
                  maxImageSize={SOCIAL_ICON_MAX_BYTES}
                  recommendedDimensions={SOCIAL_ICON_RECOMMENDED}
                  validateImage={(file) => validateSocialIcon(file)}
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
              onClick={() => navigate("/social-media")}
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
