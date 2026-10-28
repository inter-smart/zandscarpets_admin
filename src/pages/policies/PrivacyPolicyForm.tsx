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
  privacyPolicySchema,
  PrivacyPolicyFormData,
} from "@/schemas/privacyPolicySchema";
import {
  fetchPrivacyPolicy,
  savePrivacyPolicy,
} from "@/services/policies/privacyPolicyApi";
import { uploadEditorImage } from "@/services/editor/editorImageApi";

const defaultValues: PrivacyPolicyFormData = {
  title: "",
  title_ar: "",
  content: "",
  content_ar: "",
};

export default function PrivacyPolicyForm() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [recordId, setRecordId] = useState<number | undefined>(undefined);

  const form = useForm<PrivacyPolicyFormData>({
    resolver: zodResolver(privacyPolicySchema),
    defaultValues,
  });

  useEffect(() => {
    loadPrivacyPolicyData();
  }, []);

  const loadPrivacyPolicyData = async () => {
    try {
      setInitialLoading(true);
      const response = await fetchPrivacyPolicy();
      const data = response.data;

      if (data) {
        setRecordId(data.id);
        form.reset({
          title: data.title || "",
          title_ar: data.title_ar || "",
          content: data.content || "",
          content_ar: data.content_ar || "",
        });
      }
    } catch (error) {
      console.log("No existing data found, starting with empty form");
    } finally {
      setInitialLoading(false);
    }
  };

  const onSubmit = async (data: PrivacyPolicyFormData) => {
    try {
      setLoading(true);
      const payload = {
        title: data.title,
        title_ar: data.title_ar,
        content: data.content,
        content_ar: data.content_ar,
      };
      const response = await savePrivacyPolicy(payload, recordId ?? 1);
      if (response.data?.id) {
        setRecordId(response.data.id);
      }
      toast({
        title: "Success",
        description: "Privacy Policy saved successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to save Privacy Policy",
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
        <h1 className="text-2xl font-bold">Privacy Policy</h1>
        <p className="text-muted-foreground">
          Manage content for the Privacy Policy page
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Privacy Policy Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormTextField required
                  form={form}
                  name="title"
                  label="Title"
                  placeholder="Enter privacy policy title"
                />
                <FormTextField required
                  form={form}
                  name="title_ar"
                  label="Title (Arabic)"
                  placeholder="أدخل عنوان سياسة الخصوصية"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormRichTextField required
                  form={form}
                  name="content"
                  uploadImage={uploadEditorImage}
                  label="Content"
                  placeholder="Enter privacy policy content"
                />
                <FormRichTextField required
                  form={form}
                  name="content_ar"
                  uploadImage={uploadEditorImage}
                  label="Content (Arabic)"
                  placeholder="أدخل محتوى سياسة الخصوصية"
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
