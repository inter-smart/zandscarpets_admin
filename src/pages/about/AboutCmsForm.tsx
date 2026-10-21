import { useState, useEffect } from "react";
import PageLoader from "@/components/layout/PageLoader";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FormTextField,
  FormFileUploadField,
  FormRichTextField,
} from "@/components/forms/FormFieldComponents";
import { Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { aboutCmsSchema, AboutCmsFormData } from "@/schemas/aboutCmsSchema";
import {
  fetchAboutCms,
  saveAboutCms,
  ApiError,
} from "@/services/about/aboutCmsApi";

const defaultValues: AboutCmsFormData = {
  about_title: "",
  about_title_ar: "",
  about_description: "",
  about_description_ar: "",
  media_path: "",
  media_alt: "",
  media_alt_ar: "",
  trust_title: "",
  trust_title_ar: "",
  trust_description: "",
  trust_description_ar: "",
  trust_button_text: "",
  trust_button_text_ar: "",
  trust_button_link: "",
  mission_title: "",
  mission_title_ar: "",
  vision_title: "",
  vision_title_ar: "",
  mission_description: "",
  mission_description_ar: "",
  vision_description: "",
  vision_description_ar: "",
  history_title: "",
  history_title_ar: "",
  message_title: "",
  message_title_ar: "",
  message_subtitle: "",
  message_subtitle_ar: "",
  about_core_title: "",
  about_core_title_ar: "",
  about_core_description: "",
  about_core_description_ar: "",
  about_core_media_path: "",
  about_core_media_alt: "",
  about_core_media_alt_ar: "",
  industry_title: "",
  industry_title_ar: "",
  industry_description: "",
  industry_description_ar: "",
  industry_media_path: "",
  industry_media_alt: "",
  industry_media_alt_ar: "",
};

export default function AboutCmsForm() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [recordId, setRecordId] = useState<number | undefined>(undefined);

  const form = useForm<AboutCmsFormData>({
    resolver: zodResolver(aboutCmsSchema),
    defaultValues,
  });

  useEffect(() => {
    loadAboutCmsData();
  }, []);

  const loadAboutCmsData = async () => {
    try {
      setInitialLoading(true);
      const response = await fetchAboutCms();
      const data = response.data;

      if (data) {
        setRecordId(data.id);
        form.reset({
          about_title: data.about_title || "",
          about_title_ar: data.about_title_ar || "",
          about_description: data.about_description || "",
          about_description_ar: data.about_description_ar || "",
          media_path: data.media_path || "",
          media_alt: data.media_alt || "",
          media_alt_ar: data.media_alt_ar || "",
          trust_title: data.trust_title || "",
          trust_title_ar: data.trust_title_ar || "",
          trust_description: data.trust_description || "",
          trust_description_ar: data.trust_description_ar || "",
          trust_button_text: data.trust_button_text || "",
          trust_button_text_ar: data.trust_button_text_ar || "",
          trust_button_link: data.trust_button_link || "",
          mission_title: data.mission_title || "",
          mission_title_ar: data.mission_title_ar || "",
          vision_title: data.vision_title || "",
          vision_title_ar: data.vision_title_ar || "",
          mission_description: data.mission_description || "",
          mission_description_ar: data.mission_description_ar || "",
          vision_description: data.vision_description || "",
          vision_description_ar: data.vision_description_ar || "",
          history_title: data.history_title || "",
          history_title_ar: data.history_title_ar || "",
          message_title: data.message_title || "",
          message_title_ar: data.message_title_ar || "",
          message_subtitle: data.message_subtitle || "",
          message_subtitle_ar: data.message_subtitle_ar || "",
          about_core_title: data.about_core_title || "",
          about_core_title_ar: data.about_core_title_ar || "",
          about_core_description: data.about_core_description || "",
          about_core_description_ar: data.about_core_description_ar || "",
          about_core_media_path: data.about_core_media_path || "",
          about_core_media_alt: data.about_core_media_alt || "",
          about_core_media_alt_ar: data.about_core_media_alt_ar || "",
          industry_title: data.industry_title || "",
          industry_title_ar: data.industry_title_ar || "",
          industry_description: data.industry_description || "",
          industry_description_ar: data.industry_description_ar || "",
          industry_media_path: data.industry_media_path || "",
          industry_media_alt: data.industry_media_alt || "",
          industry_media_alt_ar: data.industry_media_alt_ar || "",
        });
      }
    } catch (error) {
      console.log("No existing data found, starting with empty form");
    } finally {
      setInitialLoading(false);
    }
  };

  const appendFile = (formData: FormData, key: string, value: unknown) => {
    if (value instanceof File) {
      formData.append(key, value);
    } else if (typeof value === "string" && value) {
      formData.append(key, value);
    }
  };

  const onSubmit = async (data: AboutCmsFormData) => {
    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("about_title", data.about_title);
      formData.append("about_title_ar", data.about_title_ar || "");
      formData.append("about_description", data.about_description);
      formData.append("about_description_ar", data.about_description_ar || "");
      formData.append("media_alt", data.media_alt || "");
      formData.append("media_alt_ar", data.media_alt_ar || "");
      formData.append("trust_title", data.trust_title);
      formData.append("trust_title_ar", data.trust_title_ar || "");
      formData.append("trust_description", data.trust_description);
      formData.append("trust_description_ar", data.trust_description_ar || "");
      formData.append("trust_button_text", data.trust_button_text || "");
      formData.append("trust_button_text_ar", data.trust_button_text_ar || "");
      formData.append("trust_button_link", data.trust_button_link || "");
      formData.append("mission_title", data.mission_title);
      formData.append("mission_title_ar", data.mission_title_ar || "");
      formData.append("vision_title", data.vision_title);
      formData.append("vision_title_ar", data.vision_title_ar || "");
      formData.append("mission_description", data.mission_description);
      formData.append(
        "mission_description_ar",
        data.mission_description_ar || "",
      );
      formData.append("vision_description", data.vision_description);
      formData.append(
        "vision_description_ar",
        data.vision_description_ar || "",
      );
      formData.append("history_title", data.history_title);
      formData.append("history_title_ar", data.history_title_ar || "");
      formData.append("message_title", data.message_title);
      formData.append("message_title_ar", data.message_title_ar || "");
      formData.append("message_subtitle", data.message_subtitle);
      formData.append("message_subtitle_ar", data.message_subtitle_ar || "");
      formData.append("about_core_title", data.about_core_title);
      formData.append("about_core_title_ar", data.about_core_title_ar || "");
      formData.append("about_core_description", data.about_core_description);
      formData.append(
        "about_core_description_ar",
        data.about_core_description_ar || "",
      );
      formData.append("about_core_media_alt", data.about_core_media_alt || "");
      formData.append(
        "about_core_media_alt_ar",
        data.about_core_media_alt_ar || "",
      );
      formData.append("industry_title", data.industry_title);
      formData.append("industry_title_ar", data.industry_title_ar || "");
      formData.append("industry_description", data.industry_description);
      formData.append(
        "industry_description_ar",
        data.industry_description_ar || "",
      );
      formData.append("industry_media_alt", data.industry_media_alt || "");
      formData.append(
        "industry_media_alt_ar",
        data.industry_media_alt_ar || "",
      );

      appendFile(formData, "media_path", data.media_path);
      appendFile(formData, "about_core_media_path", data.about_core_media_path);
      appendFile(formData, "industry_media_path", data.industry_media_path);

      const response = await saveAboutCms(formData, recordId ?? 1);
      if (response.data?.id) {
        setRecordId(response.data.id);
      }
      toast({
        title: "Success",
        description: "About page content saved successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof ApiError
            ? error.message
            : "Failed to save About page content",
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
        <h1 className="text-2xl font-bold">About Page CMS</h1>
        <p className="text-muted-foreground">
          Manage content for the About page
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>About Section</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormTextField
                form={form}
                name="about_title"
                label="About Title"
                placeholder="Enter about title"
              />
              <FormTextField
                form={form}
                name="about_title_ar"
                label="About Title (Arabic)"
                placeholder="أدخل عنوان نبذة عنا"
              />
              <FormRichTextField
                form={form}
                name="about_description"
                label="About Description"
                placeholder="Enter about description"
              />
              <FormRichTextField
                form={form}
                name="about_description_ar"
                label="About Description (Arabic)"
                placeholder="أدخل وصف نبذة عنا"
              />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:col-span-2">
                <div className="md:col-span-2">
                  <FormFileUploadField
                    form={form}
                    name="media_path"
                    label="Image"
                    placeholder="Upload image"
                    accept="image/*"
                  />
                </div>
                <FormTextField
                  form={form}
                  name="media_alt"
                  label="Image Alt Text"
                  placeholder="Describe the media"
                />
                <FormTextField
                  form={form}
                  name="media_alt_ar"
                  label="Image Alt Text (Arabic)"
                  placeholder="وصف الصورة"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Trust Section</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormTextField
                form={form}
                name="trust_title"
                label="Trust Title"
                placeholder="Enter trust title"
              />
              <FormTextField
                form={form}
                name="trust_title_ar"
                label="Trust Title (Arabic)"
                placeholder="أدخل عنوان الثقة"
              />
              <FormRichTextField
                form={form}
                name="trust_description"
                label="Trust Description"
                placeholder="Enter trust description"
              />
              <FormRichTextField
                form={form}
                name="trust_description_ar"
                label="Trust Description (Arabic)"
                placeholder="أدخل وصف الثقة"
              />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:col-span-2">
                <FormTextField
                  form={form}
                  name="trust_button_text"
                  label="Button Text"
                  placeholder="e.g. Get a Quote"
                />
                <FormTextField
                  form={form}
                  name="trust_button_text_ar"
                  label="Button Text (Arabic)"
                  placeholder="مثال: اطلب عرض سعر"
                />
                <FormTextField
                  form={form}
                  name="trust_button_link"
                  label="Button Link"
                  placeholder="/contact (leave empty to hide the button)"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Mission &amp; Vision Section</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:col-span-2">
                <FormTextField
                  form={form}
                  name="mission_title"
                  label="Mission Title"
                  placeholder="Enter mission title"
                />
                <FormTextField
                  form={form}
                  name="mission_title_ar"
                  label="Mission Title (Arabic)"
                  placeholder="أدخل عنوان الرسالة"
                />
                <FormTextField
                  form={form}
                  name="vision_title"
                  label="Vision Title"
                  placeholder="Enter vision title"
                />
                <FormTextField
                  form={form}
                  name="vision_title_ar"
                  label="Vision Title (Arabic)"
                  placeholder="أدخل عنوان الرؤية"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:col-span-2">
                <FormRichTextField
                  form={form}
                  name="mission_description"
                  label="Mission Description"
                  placeholder="Enter mission description"
                />
                <FormRichTextField
                  form={form}
                  name="mission_description_ar"
                  label="Mission Description (Arabic)"
                  placeholder="أدخل وصف الرسالة"
                />
                <FormRichTextField
                  form={form}
                  name="vision_description"
                  label="Vision Description"
                  placeholder="Enter vision description"
                />
                <FormRichTextField
                  form={form}
                  name="vision_description_ar"
                  label="Vision Description (Arabic)"
                  placeholder="أدخل وصف الرؤية"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>History Section</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormTextField
                form={form}
                name="history_title"
                label="History Title"
                placeholder="Enter history title"
              />
              <FormTextField
                form={form}
                name="history_title_ar"
                label="History Title (Arabic)"
                placeholder="أدخل عنوان التاريخ"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Message Section</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:col-span-2">
                <FormTextField
                  form={form}
                  name="message_title"
                  label="Message Title"
                  placeholder="Enter message title"
                />
                <FormTextField
                  form={form}
                  name="message_title_ar"
                  label="Message Title (Arabic)"
                  placeholder="أدخل عنوان الرسائل"
                />
                <FormTextField
                  form={form}
                  name="message_subtitle"
                  label="Message Subtitle"
                  placeholder="Enter message subtitle"
                />
                <FormTextField
                  form={form}
                  name="message_subtitle_ar"
                  label="Message Subtitle (Arabic)"
                  placeholder="أدخل العنوان الفرعي للرسائل"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Core Values Section</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:col-span-2">
                <FormTextField
                  form={form}
                  name="about_core_title"
                  label="About Core Title"
                  placeholder="Enter core values title"
                />
                <FormTextField
                  form={form}
                  name="about_core_title_ar"
                  label="Core Values Title (Arabic)"
                  placeholder="أدخل عنوان القيم الأساسية"
                />

                <FormRichTextField
                  form={form}
                  name="about_core_description"
                  label="About Core Description"
                  placeholder="Enter core values description"
                />
                <FormRichTextField
                  form={form}
                  name="about_core_description_ar"
                  label="About Core Description (Arabic)"
                  placeholder="أدخل وصف القيم الأساسية"
                />

                <FormTextField
                  form={form}
                  name="about_core_media_alt"
                  label="Image Alt Text"
                  placeholder="Describe the media"
                />
                <FormTextField
                  form={form}
                  name="about_core_media_alt_ar"
                  label="Image Alt Text (Arabic)"
                  placeholder="وصف الصورة"
                />
              </div>

              <div className="md:col-span-2">
                <FormFileUploadField
                  form={form}
                  name="about_core_media_path"
                  label="Image"
                  placeholder="Upload image"
                  accept="image/*"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Industry Section</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormTextField
                form={form}
                name="industry_title"
                label="Industry Title"
                placeholder="Enter industry title"
              />
              <FormTextField
                form={form}
                name="industry_title_ar"
                label="Industry Title (Arabic)"
                placeholder="أدخل عنوان القطاع"
              />
              <FormRichTextField
                form={form}
                name="industry_description"
                label="Industry Description"
                placeholder="Enter industry description"
              />
              <FormRichTextField
                form={form}
                name="industry_description_ar"
                label="Industry Description (Arabic)"
                placeholder="أدخل وصف القطاع"
              />
              <div className="grid grid-cols-1 gap-4 md:col-span-2 md:grid-cols-2">
                <div className="md:col-span-2">
                  <FormFileUploadField
                    form={form}
                    name="industry_media_path"
                    label="Image"
                    placeholder="Upload image"
                    accept="image/*"
                  />
                </div>
                <FormTextField
                  form={form}
                  name="industry_media_alt"
                  label="Image Alt Text"
                  placeholder="Describe the media"
                />
                <FormTextField
                  form={form}
                  name="industry_media_alt_ar"
                  label="Image Alt Text (Arabic)"
                  placeholder="وصف الصورة"
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
