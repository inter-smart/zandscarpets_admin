import { useState, useEffect } from "react";
import PageLoader from "@/components/layout/PageLoader";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { FormTextField } from "@/components/forms/FormFieldComponents";
import { categoryCmsSchema, CategoryCmsFormData } from "@/schemas/categoryCmsSchema";
import { fetchCategoryCms, saveCategoryCms } from "@/services/products/categoryCmsApi";

const defaultValues: CategoryCmsFormData = {
  title: "",
  title_ar: "",
};

export default function CategoryCmsForm() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [recordId, setRecordId] = useState<number | undefined>(undefined);

  const form = useForm<CategoryCmsFormData>({
    resolver: zodResolver(categoryCmsSchema),
    defaultValues,
  });

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetchCategoryCms();
        const data = response.data;
        if (data) {
          setRecordId(data.id);
          form.reset({ title: data.title || "", title_ar: data.title_ar || "" });
        }
      } catch {
        console.log("No existing data found, starting with empty form");
      } finally {
        setInitialLoading(false);
      }
    };
    load();
  }, [form]);

  const onSubmit = async (data: CategoryCmsFormData) => {
    try {
      setLoading(true);
      const response = await saveCategoryCms(
        { title: data.title, title_ar: data.title_ar },
        recordId ?? 1,
      );
      if (response.data?.id) setRecordId(response.data.id);
      toast({ title: "Success", description: "Categories page content saved successfully" });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save content",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Categories Page CMS</h1>
        <p className="text-muted-foreground">
          Manage content for the Categories page. The banner and SEO are managed under Banners and
          Meta Data.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Category List Section</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormTextField
                  form={form}
                  name="title"
                  label="Heading"
                  placeholder="e.g. Explore Our Flooring Categories"
                />
                <FormTextField
                  form={form}
                  name="title_ar"
                  label="Heading (Arabic)"
                  placeholder="أدخل عنوان القائمة"
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
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
