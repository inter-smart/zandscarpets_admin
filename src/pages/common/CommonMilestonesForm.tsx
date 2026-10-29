import { useState, useEffect } from "react";
import PageLoader from "@/components/layout/PageLoader";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormFileUploadField, FormTextareaField } from "@/components/forms/FormFieldComponents";
import { Save, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { fetchCommonMilestoneById, createCommonMilestone, updateCommonMilestone, ApiError } from "@/services/common/commonMilestonesApi";
import { commonMilestoneSchema, CommonMilestoneFormData } from "@/schemas/commonMilestonesSchema";
import SharedBlockNotice from "@/components/common/SharedBlockNotice";

export default function CommonMilestoneForm() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditing);

  const form = useForm<CommonMilestoneFormData>({
    resolver: zodResolver(commonMilestoneSchema),
    defaultValues: {
      value: "",
      value_ar: "",
      label: "",
      label_ar: "",
      media_path: "",
      media_alt: "",
      media_alt_ar: "",
      sort_order: "1",
      is_active: true,
      show_in_home: true,
    },
  });

  useEffect(() => {
    if (isEditing && id) {
      loadCommonMilestoneData(parseInt(id));
    }
  }, [id, isEditing]);

  const loadCommonMilestoneData = async (itemId: number) => {
    try {
      setInitialLoading(true);
      const response = await fetchCommonMilestoneById(itemId);
      const data = response.data;

      if (data) {
        form.reset({
          value: data.value || "",
          value_ar: data.value_ar || "",
          label: data.label || "",
          label_ar: data.label_ar || "",
          media_path: data.media_path || "",
          media_alt: data.media_alt || "",
          media_alt_ar: data.media_alt_ar || "",
          sort_order: (data.sort_order ?? 1).toString(),
          is_active: data.is_active ?? true,
          show_in_home: data.show_in_home ?? true,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof ApiError ? error.message : "Failed to load milestone data",
        variant: "destructive",
      });
    } finally {
      setInitialLoading(false);
    }
  };

  const onSubmit = async (data: CommonMilestoneFormData) => {
    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("value", data.value);
      formData.append("value_ar", data.value_ar);
      formData.append("label", data.label);
      formData.append("label_ar", data.label_ar);
      formData.append("media_alt", data.media_alt || "");
      formData.append("media_alt_ar", data.media_alt_ar || "");
      formData.append("sort_order", (data.sort_order || "1").toString());
      formData.append("is_active", (data.is_active ?? true).toString());
      formData.append("show_in_home", (data.show_in_home ?? true).toString());
      if (data.media_path instanceof File) {
        formData.append("media_path", data.media_path);
      } else if (typeof data.media_path === "string" && data.media_path) {
        formData.append("media_path", data.media_path);
      }

      if (isEditing && id) {
        await updateCommonMilestone(parseInt(id), formData);
        toast({ title: "Success", description: "Milestone updated successfully" });
      } else {
        await createCommonMilestone(formData);
        toast({ title: "Success", description: "Milestone created successfully" });
      }

      navigate("/milestones");
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof ApiError ? error.message : `Failed to ${isEditing ? "update" : "create"} milestone`,
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
      <SharedBlockNotice />
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate("/milestones")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{isEditing ? "Edit" : "Add"} Milestone</h1>
          <p className="text-muted-foreground">{isEditing ? "Update" : "Create a new"} milestone</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Milestone Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Value</FormLabel>
                      <FormControl>
                        <Input placeholder="Milestone value" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="value_ar"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Value (Arabic)</FormLabel>
                      <FormControl>
                        <Input dir="rtl" className="text-right" placeholder="قيمة الإنجاز" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormTextareaField form={form} name="label" label="Label" placeholder="Milestone label" />
                <FormTextareaField form={form} name="label_ar" label="Label (Arabic)" placeholder="وصف الإنجاز" />
              </div>

              <FormFileUploadField form={form} name="media_path" label="Image" placeholder="Upload milestone image" accept="image/*" />
              <p className="text-sm text-muted-foreground">
                Optional. This image is only shown in the Home page section.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="media_alt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Image Alt Text</FormLabel>
                      <FormControl>
                        <Input placeholder="Describe the milestone media" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="media_alt_ar"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Image Alt Text (Arabic)</FormLabel>
                      <FormControl>
                        <Input dir="rtl" className="text-right" placeholder="وصف صورة الإنجاز" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
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
                <FormField
                  control={form.control}
                  name="show_in_home"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Show in Home</FormLabel>
                        <p className="text-sm text-muted-foreground">Display this item on the home page.</p>
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
            <Button type="button" variant="outline" onClick={() => navigate("/milestones")}>
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
