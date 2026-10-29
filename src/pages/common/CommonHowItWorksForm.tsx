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
import { FormTextareaField } from "@/components/forms/FormFieldComponents";
import { Save, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { fetchCommonHowItWorksById, createCommonHowItWorks, updateCommonHowItWorks, ApiError } from "@/services/common/commonHowItWorksApi";
import { commonHowItWorksSchema, CommonHowItWorksFormData } from "@/schemas/commonHowItWorksSchema";
import SharedBlockNotice from "@/components/common/SharedBlockNotice";

export default function CommonHowItWorksForm() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditing);

  const form = useForm<CommonHowItWorksFormData>({
    resolver: zodResolver(commonHowItWorksSchema),
    defaultValues: {
      title: "",
      title_ar: "",
      description: "",
      description_ar: "",
      sort_order: "1",
      is_active: true,
    },
  });

  useEffect(() => {
    if (isEditing && id) {
      loadCommonHowItWorksData(parseInt(id));
    }
  }, [id, isEditing]);

  const loadCommonHowItWorksData = async (itemId: number) => {
    try {
      setInitialLoading(true);
      const response = await fetchCommonHowItWorksById(itemId);
      const data = response.data;

      if (data) {
        form.reset({
          title: data.title || "",
          title_ar: data.title_ar || "",
          description: data.description || "",
          description_ar: data.description_ar || "",
          sort_order: (data.sort_order ?? 1).toString(),
          is_active: data.is_active ?? true,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof ApiError ? error.message : "Failed to load step data",
        variant: "destructive",
      });
    } finally {
      setInitialLoading(false);
    }
  };

  const onSubmit = async (data: CommonHowItWorksFormData) => {
    try {
      setLoading(true);

      const payload = {
        title: data.title,
        title_ar: data.title_ar,
        description: data.description,
        description_ar: data.description_ar,
        sort_order: Number(data.sort_order || 1),
        is_active: data.is_active ?? true,
      };

      if (isEditing && id) {
        await updateCommonHowItWorks(parseInt(id), payload);
        toast({ title: "Success", description: "Step updated successfully" });
      } else {
        await createCommonHowItWorks(payload);
        toast({ title: "Success", description: "Step created successfully" });
      }

      navigate("/common-how-it-works");
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof ApiError ? error.message : `Failed to ${isEditing ? "update" : "create"} step`,
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
        <Button variant="outline" size="icon" onClick={() => navigate("/common-how-it-works")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{isEditing ? "Edit" : "Add"} Step</h1>
          <p className="text-muted-foreground">{isEditing ? "Update" : "Create a new"} step</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Step Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Step title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="title_ar"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title (Arabic)</FormLabel>
                      <FormControl>
                        <Input dir="rtl" className="text-right" placeholder="عنوان الخطوة" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormTextareaField form={form} name="description" label="Description" placeholder="Step description" />
                <FormTextareaField form={form} name="description_ar" label="Description (Arabic)" placeholder="وصف الخطوة" />
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
            <Button type="button" variant="outline" onClick={() => navigate("/common-how-it-works")}>
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
