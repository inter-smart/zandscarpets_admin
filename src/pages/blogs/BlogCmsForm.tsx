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
import { blogCmsSchema, BlogCmsFormData } from "@/schemas/blogCmsSchema";
import { fetchBlogCms, saveBlogCms } from "@/services/blogs/blogCmsApi";

const defaultValues: BlogCmsFormData = {
  title: "",
  title_ar: "",
  related_title: "",
  related_title_ar: "",
};

export default function BlogCmsForm() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [recordId, setRecordId] = useState<number | undefined>(undefined);

  const form = useForm<BlogCmsFormData>({
    resolver: zodResolver(blogCmsSchema),
    defaultValues,
  });

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetchBlogCms();
        const data = response.data;
        if (data) {
          setRecordId(data.id);
          form.reset({
            title: data.title || "",
            title_ar: data.title_ar || "",
            related_title: data.related_title || "",
            related_title_ar: data.related_title_ar || "",
          });
        }
      } catch {
        console.log("No existing data found, starting with empty form");
      } finally {
        setInitialLoading(false);
      }
    };
    load();
  }, [form]);

  const onSubmit = async (data: BlogCmsFormData) => {
    try {
      setLoading(true);
      const response = await saveBlogCms(
        {
          title: data.title,
          title_ar: data.title_ar,
          related_title: data.related_title,
          related_title_ar: data.related_title_ar,
        },
        recordId ?? 1,
      );
      if (response.data?.id) setRecordId(response.data.id);
      toast({ title: "Success", description: "Blog page content saved successfully" });
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
        <h1 className="text-2xl font-bold">Blog Page CMS</h1>
        <p className="text-muted-foreground">
          Manage the headings of the blog pages. The banner and SEO are managed under Banners and Meta Data.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Blog List</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormTextField required
                  form={form}
                  name="title"
                  label="Heading"
                  placeholder="e.g. Latest Updates & Insights"
                />
                <FormTextField required
                  form={form}
                  name="title_ar"
                  label="Heading (Arabic)"
                  placeholder="أدخل عنوان القائمة"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Related Blogs (blog page)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormTextField required
                  form={form}
                  name="related_title"
                  label="Related Blogs Heading"
                  placeholder="e.g. Related Blogs"
                />
                <FormTextField required
                  form={form}
                  name="related_title_ar"
                  label="Related Blogs Heading (Arabic)"
                  placeholder="مثال: مقالات ذات صلة"
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
