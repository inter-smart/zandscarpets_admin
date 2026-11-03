import { useState, useEffect, useCallback } from "react";
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
} from "@/components/forms/FormFieldComponents";
import { Save, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  fetchHomeTestimonialsById,
  createHomeTestimonials,
  updateHomeTestimonials,
  ApiError,
} from "@/services/home/homeTestimonialsApi";
import {
  homeTestimonialsSchema,
  HomeTestimonialsFormData,
} from "@/schemas/homeTestimonialsSchema";

export default function HomeTestimonialsForm() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditing);

  const form = useForm<HomeTestimonialsFormData>({
    resolver: zodResolver(homeTestimonialsSchema),
    defaultValues: {
      profile_media_path: "",
      name: "",
      name_ar: "",
      designation: "",
      designation_ar: "",
      message: "",
      message_ar: "",
      sort_order: "1",
      is_active: true,
    },
  });

  const loadData = useCallback(
    async (itemId: number) => {
      try {
        setInitialLoading(true);
        const res = await fetchHomeTestimonialsById(itemId);
        const data = res.data;
        form.reset({
          profile_media_path: data.profile_media_path || "",
          name: data.name || "",
          name_ar: data.name_ar || "",
          designation: data.designation || "",
          designation_ar: data.designation_ar || "",
          message: data.message || "",
          message_ar: data.message_ar || "",
          sort_order: (data.sort_order ?? 1).toString(),
          is_active: data.is_active ?? true,
        });
      } catch (error) {
        toast({
          title: "Error",
          description:
            error instanceof ApiError ? error.message : "Failed to load data",
          variant: "destructive",
        });
      } finally {
        setInitialLoading(false);
      }
    },
    [form, toast],
  );

  useEffect(() => {
    if (isEditing && id) loadData(parseInt(id));
  }, [id, isEditing]);

  const onSubmit = async (data: HomeTestimonialsFormData) => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("name_ar", data.name_ar);
      formData.append("designation", data.designation ?? "");
      formData.append("designation_ar", data.designation_ar ?? "");
      formData.append("message", data.message);
      formData.append("message_ar", data.message_ar);
      formData.append("sort_order", (data.sort_order || "1").toString());
      formData.append("is_active", (data.is_active ?? true).toString());

      if (data.profile_media_path instanceof File) {
        formData.append("profile_media_path", data.profile_media_path);
      } else if (
        typeof data.profile_media_path === "string" &&
        data.profile_media_path
      ) {
        formData.append("profile_media_path", data.profile_media_path);
      } else if (isEditing) {
        // image was removed in the form: empty value tells the server to delete it
        formData.append("profile_media_path", "");
      }

      if (isEditing && id) {
        await updateHomeTestimonials(parseInt(id), formData);
        toast({
          title: "Success",
          description: "Testimonial updated successfully",
        });
      } else {
        await createHomeTestimonials(formData);
        toast({
          title: "Success",
          description: "Testimonial created successfully",
        });
      }

      navigate("/home-testimonials");
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof ApiError
            ? error.message
            : `Failed to ${isEditing ? "update" : "create"}`,
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
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate("/home-testimonials")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            {isEditing ? "Edit" : "Add"} Testimonial
          </h1>
          <p className="text-muted-foreground">
            {isEditing ? "Update" : "Create a new"} testimonial
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Testimonial</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="name_ar"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name (Arabic)</FormLabel>
                      <FormControl>
                        <Input dir="rtl" className="text-right" placeholder="الاسم" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="designation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Designation</FormLabel>
                      <FormControl>
                        <Input placeholder="Designation" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="designation_ar"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Designation (Arabic)</FormLabel>
                      <FormControl>
                        <Input dir="rtl" className="text-right" placeholder="المنصب" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormFileUploadField
                form={form}
                name="profile_media_path"
                label="Profile Image"
                placeholder="Upload profile image"
                accept="image/*"
                description="Optional. If no image is provided, a placeholder image will be shown."
              />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormTextareaField form={form} name="message" label="Message" placeholder="Testimonial message" rows={8} />
                <FormTextareaField form={form} name="message_ar" label="Message (Arabic)" placeholder="رسالة التدشين" rows={8} />
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
              onClick={() => navigate("/home-testimonials")}
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
