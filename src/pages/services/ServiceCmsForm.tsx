import { useState, useEffect } from "react";
import PageLoader from "@/components/layout/PageLoader";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  FormTextField,
  FormRichTextField,
} from "@/components/forms/FormFieldComponents";
import {
  serviceCmsSchema,
  ServiceCmsFormData,
} from "@/schemas/serviceCmsSchema";
import {
  fetchServiceCms,
  saveServiceCms,
} from "@/services/services/serviceCmsApi";

const defaultValues: ServiceCmsFormData = {
  title: "",
  title_ar: "",
  description: "",
  description_ar: "",
  service_title: "",
  service_title_ar: "",
  process_steps_title: "",
  process_steps_title_ar: "",
  process_steps_bg_title: "",
  process_steps_bg_title_ar: "",
};

export default function ServiceCmsForm() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [recordId, setRecordId] = useState<number | undefined>(undefined);

  const form = useForm<ServiceCmsFormData>({
    resolver: zodResolver(serviceCmsSchema),
    defaultValues,
  });

  useEffect(() => {
    loadServiceCmsData();
  }, []);

  const loadServiceCmsData = async () => {
    try {
      setInitialLoading(true);
      const response = await fetchServiceCms();
      const data = response.data;

      if (data) {
        setRecordId(data.id);
        form.reset({
          title: data.title || "",
          title_ar: data.title_ar || "",
          description: data.description || "",
          description_ar: data.description_ar || "",
          service_title: data.service_title || "",
          service_title_ar: data.service_title_ar || "",
          process_steps_title: data.process_steps_title || "",
          process_steps_title_ar: data.process_steps_title_ar || "",
          process_steps_bg_title: data.process_steps_bg_title || "",
          process_steps_bg_title_ar: data.process_steps_bg_title_ar || "",
        });
      }
    } catch (error) {
      console.log("No existing data found, starting with empty form");
    } finally {
      setInitialLoading(false);
    }
  };

  const onSubmit = async (data: ServiceCmsFormData) => {
    try {
      setLoading(true);
      const payload = {
        title: data.title,
        title_ar: data.title_ar,
        description: data.description,
        description_ar: data.description_ar,
        service_title: data.service_title,
        service_title_ar: data.service_title_ar,
        process_steps_title: data.process_steps_title,
        process_steps_title_ar: data.process_steps_title_ar,
        process_steps_bg_title: data.process_steps_bg_title,
        process_steps_bg_title_ar: data.process_steps_bg_title_ar,
      };
      const response = await saveServiceCms(payload, recordId ?? 1);
      if (response.data?.id) {
        setRecordId(response.data.id);
      }
      toast({
        title: "Success",
        description: "Service CMS data saved successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to save Service CMS data",
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
      <div>
        <h1 className="text-2xl font-bold">Services Page CMS</h1>
        <p className="text-muted-foreground">
          Manage content for the Services page
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Services Section</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:col-span-2">
                <FormRichTextField required
                  form={form}
                  name="title"
                  label="Title"
                  placeholder="Enter section title"
                />

                <FormRichTextField required
                  form={form}
                  name="title_ar"
                  label="Title (Arabic)"
                  placeholder="أدخل عنوان القسم"
                />
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:col-span-2">
                <FormRichTextField required
                  form={form}
                  name="description"
                  label="Description"
                  placeholder="Enter section description"
                />

                <FormRichTextField required
                  form={form}
                  name="description_ar"
                  label="Description (Arabic)"
                  placeholder="أدخل وصف القسم"
                />
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:col-span-2">
                <FormRichTextField required
                  form={form}
                  name="service_title"
                  label="Services List Title"
                  placeholder="Enter services list heading"
                />

                <FormRichTextField required
                  form={form}
                  name="service_title_ar"
                  label="Services List Title (Arabic)"
                  placeholder="أدخل عنوان قائمة الخدمات"
                />
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:col-span-2">
                <FormTextField required
                  form={form}
                  name="process_steps_title"
                  label="Process Steps Title"
                  placeholder="Enter process steps heading"
                />

                <FormTextField required
                  form={form}
                  name="process_steps_title_ar"
                  label="Process Steps Title (Arabic)"
                  placeholder="أدخل عنوان خطوات العملية"
                />
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:col-span-2">
                <FormTextField required
                  form={form}
                  name="process_steps_bg_title"
                  label="Process Steps Background Title"
                  placeholder="e.g. OUR PROCESS (faint text behind the heading)"
                />

                <FormTextField required
                  form={form}
                  name="process_steps_bg_title_ar"
                  label="Process Steps Background Title (Arabic)"
                  placeholder="مثال: عمليتنا"
                />
              </div>
            </CardContent>
          </Card>

          <div className="sticky bottom-0 z-10 -mx-6 flex justify-end border-t bg-background/95 px-6 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80">
            <Button type="submit" disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
