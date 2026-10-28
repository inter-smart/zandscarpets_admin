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
  FormTextareaField,
  FormFileUploadField,
  FormRichTextField,
} from "@/components/forms/FormFieldComponents";
import {
  contactCmsSchema,
  ContactCmsFormData,
} from "@/schemas/contactCmsSchema";
import {
  fetchContactCms,
  saveContactCms,
} from "@/services/contact/contactCmsApi";

const defaultValues: ContactCmsFormData = {
  title: "",
  title_ar: "",
  description: "",
  description_ar: "",
  form_title: "",
  form_title_ar: "",
  social_media_title: "",
  social_media_title_ar: "",
  map_url: "",
  phone_title: "",
  phone_title_ar: "",
  phone_description: "",
  phone_description_ar: "",
  phone_value: "",
  phone_icon_media_alt: "",
  phone_icon_media_alt_ar: "",
  phone_icon_media_path: "",
  email_title: "",
  email_title_ar: "",
  email_description: "",
  email_description_ar: "",
  email_value: "",
  email_icon_media_alt: "",
  email_icon_media_alt_ar: "",
  email_icon_media_path: "",
  office_title: "",
  office_title_ar: "",
  office_description: "",
  office_description_ar: "",
  office_value: "",
  office_value_ar: "",
  office_icon_media_alt: "",
  office_icon_media_alt_ar: "",
  office_icon_media_path: "",
};

export default function ContactCmsForm() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [recordId, setRecordId] = useState<number | undefined>(undefined);

  const form = useForm<ContactCmsFormData>({
    resolver: zodResolver(contactCmsSchema),
    defaultValues,
  });

  useEffect(() => {
    loadContactCmsData();
  }, []);

  const loadContactCmsData = async () => {
    try {
      setInitialLoading(true);
      const response = await fetchContactCms();
      const data = response.data;

      if (data) {
        setRecordId(data.id);
        form.reset({
          title: data.title || "",
          title_ar: data.title_ar || "",
          description: data.description || "",
          description_ar: data.description_ar || "",
          form_title: data.form_title || "",
          form_title_ar: data.form_title_ar || "",
          social_media_title: data.social_media_title || "",
          social_media_title_ar: data.social_media_title_ar || "",
          map_url: data.map_url || "",
          phone_title: data.phone_title || "",
          phone_title_ar: data.phone_title_ar || "",
          phone_description: data.phone_description || "",
          phone_description_ar: data.phone_description_ar || "",
          phone_value: data.phone_value || "",
          phone_icon_media_alt: data.phone_icon_media_alt || "",
          phone_icon_media_alt_ar: data.phone_icon_media_alt_ar || "",
          phone_icon_media_path: data.phone_icon_media_path || "",
          email_title: data.email_title || "",
          email_title_ar: data.email_title_ar || "",
          email_description: data.email_description || "",
          email_description_ar: data.email_description_ar || "",
          email_value: data.email_value || "",
          email_icon_media_alt: data.email_icon_media_alt || "",
          email_icon_media_alt_ar: data.email_icon_media_alt_ar || "",
          email_icon_media_path: data.email_icon_media_path || "",
          office_title: data.office_title || "",
          office_title_ar: data.office_title_ar || "",
          office_description: data.office_description || "",
          office_description_ar: data.office_description_ar || "",
          office_value: data.office_value || "",
          office_value_ar: data.office_value_ar || "",
          office_icon_media_alt: data.office_icon_media_alt || "",
          office_icon_media_alt_ar: data.office_icon_media_alt_ar || "",
          office_icon_media_path: data.office_icon_media_path || "",
        });
      }
    } catch (error) {
      console.log("No existing data found, starting with empty form");
    } finally {
      setInitialLoading(false);
    }
  };

  const onSubmit = async (data: ContactCmsFormData) => {
    try {
      setLoading(true);
      const formData = new FormData();
      const textFields = [
        "title",
        "title_ar",
        "description",
        "description_ar",
        "form_title",
        "form_title_ar",
        "social_media_title",
        "social_media_title_ar",
        "map_url",
        "phone_title",
        "phone_title_ar",
        "phone_description",
        "phone_description_ar",
        "phone_value",
        "phone_icon_media_alt",
        "phone_icon_media_alt_ar",
        "email_title",
        "email_title_ar",
        "email_description",
        "email_description_ar",
        "email_value",
        "email_icon_media_alt",
        "email_icon_media_alt_ar",
        "office_title",
        "office_title_ar",
        "office_description",
        "office_description_ar",
        "office_value",
        "office_value_ar",
        "office_icon_media_alt",
        "office_icon_media_alt_ar",
      ] as const;
      textFields.forEach((key) => formData.append(key, data[key] ?? ""));

      // icons: a new upload is sent as a file; an unchanged one keeps its saved path
      (
        [
          "phone_icon_media_path",
          "email_icon_media_path",
          "office_icon_media_path",
        ] as const
      ).forEach((key) => {
        const value = data[key];
        if (value instanceof File) {
          formData.append(key, value);
        } else if (typeof value === "string" && value) {
          formData.append(key, value);
        }
      });
      const response = await saveContactCms(formData, recordId ?? 1);
      if (response.data?.id) {
        setRecordId(response.data.id);
      }
      toast({
        title: "Success",
        description: "Contact CMS data saved successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to save Contact CMS data",
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
        <h1 className="text-2xl font-bold">Contact Page CMS</h1>
        <p className="text-muted-foreground">
          Manage content for the Contact page
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contact Section</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:col-span-2 md:grid-cols-2">
                <FormTextField required
                  form={form}
                  name="title"
                  label="Title"
                  placeholder="Enter contact title"
                />
                <FormTextField required
                  form={form}
                  name="title_ar"
                  label="Title (Arabic)"
                  placeholder="أدخل عنوان جهة الاتصال"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:col-span-2 md:grid-cols-2">
                <FormRichTextField required
                  form={form}
                  name="description"
                  label="Description"
                  placeholder="Enter contact description"
                />
                <FormRichTextField required
                  form={form}
                  name="description_ar"
                  label="Description (Arabic)"
                  placeholder="أدخل وصف جهة الاتصال"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Phone Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormFileUploadField required
                form={form}
                name="phone_icon_media_path"
                label="Icon"
                placeholder="Upload icon"
                accept="image/*"
              />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormTextField required
                  form={form}
                  name="phone_icon_media_alt"
                  label="Icon Alt Text"
                  placeholder="Enter alt text"
                />
                <FormTextField required
                  form={form}
                  name="phone_icon_media_alt_ar"
                  label="Icon Alt Text (Arabic)"
                  placeholder="أدخل النص البديل"
                />
                <FormTextField required
                  form={form}
                  name="phone_title"
                  label="Title"
                  placeholder="Enter title"
                />
                <FormTextField required
                  form={form}
                  name="phone_title_ar"
                  label="Title (Arabic)"
                  placeholder="أدخل العنوان"
                />
                <FormRichTextField required
                  form={form}
                  name="phone_description"
                  label="Description"
                  placeholder="Enter description"
                />
                <FormRichTextField required
                  form={form}
                  name="phone_description_ar"
                  label="Description (Arabic)"
                  placeholder="أدخل الوصف"
                />
                <FormTextField required
                  form={form}
                  name="phone_value"
                  label="Phone Value"
                  placeholder="e.g. +971 5270 044 20"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Email Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormFileUploadField required
                form={form}
                name="email_icon_media_path"
                label="Icon"
                placeholder="Upload icon"
                accept="image/*"
              />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormTextField required
                  form={form}
                  name="email_icon_media_alt"
                  label="Icon Alt Text"
                  placeholder="Enter alt text"
                />
                <FormTextField required
                  form={form}
                  name="email_icon_media_alt_ar"
                  label="Icon Alt Text (Arabic)"
                  placeholder="أدخل النص البديل"
                />
                <FormTextField required
                  form={form}
                  name="email_title"
                  label="Title"
                  placeholder="Enter title"
                />
                <FormTextField required
                  form={form}
                  name="email_title_ar"
                  label="Title (Arabic)"
                  placeholder="أدخل العنوان"
                />
                <FormRichTextField required
                  form={form}
                  name="email_description"
                  label="Description"
                  placeholder="Enter description"
                />
                <FormRichTextField required
                  form={form}
                  name="email_description_ar"
                  label="Description (Arabic)"
                  placeholder="أدخل الوصف"
                />
                <FormTextField required
                  form={form}
                  name="email_value"
                  label="Email Value"
                  placeholder="e.g. info@zandscarpets.com"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Office Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormFileUploadField required
                form={form}
                name="office_icon_media_path"
                label="Icon"
                placeholder="Upload icon"
                accept="image/*"
              />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormTextField required
                  form={form}
                  name="office_icon_media_alt"
                  label="Icon Alt Text"
                  placeholder="Enter alt text"
                />
                <FormTextField required
                  form={form}
                  name="office_icon_media_alt_ar"
                  label="Icon Alt Text (Arabic)"
                  placeholder="أدخل النص البديل"
                />
                <FormTextField required
                  form={form}
                  name="office_title"
                  label="Title"
                  placeholder="Enter title"
                />
                <FormTextField required
                  form={form}
                  name="office_title_ar"
                  label="Title (Arabic)"
                  placeholder="أدخل العنوان"
                />
                <FormRichTextField required
                  form={form}
                  name="office_description"
                  label="Description"
                  placeholder="Enter description"
                />
                <FormRichTextField required
                  form={form}
                  name="office_description_ar"
                  label="Description (Arabic)"
                  placeholder="أدخل الوصف"
                />
                <FormRichTextField required
                  form={form}
                  name="office_value"
                  label="Address"
                  placeholder="Enter office address"
                />
                <FormRichTextField required
                  form={form}
                  name="office_value_ar"
                  label="Address (Arabic)"
                  placeholder="أدخل عنوان المكتب"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Form Section</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:col-span-2 md:grid-cols-2">
                <FormTextField required
                  form={form}
                  name="form_title"
                  label="Form Title"
                  placeholder="Enter form title"
                />
                <FormTextField required
                  form={form}
                  name="form_title_ar"
                  label="Form Title (Arabic)"
                  placeholder="أدخل عنوان النموذج"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Social Media Section</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:col-span-2 md:grid-cols-2">
                <FormTextField required
                  form={form}
                  name="social_media_title"
                  label="Social Media Title"
                  placeholder="Enter social media title"
                />
                <FormTextField required
                  form={form}
                  name="social_media_title_ar"
                  label="Social Media Title (Arabic)"
                  // arabic placeholder is intentionally left empty as per the original code
                  placeholder="أدخل عنوان وسائل التواصل الاجتماعي"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Map Section</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormTextareaField required
                form={form}
                name="map_url"
                label="Map URL"
                placeholder="Enter map embed URL"
              />
              <p className="text-sm text-muted-foreground">
                Paste the Google Maps embed link (the src of the iframe) or the
                whole iframe code. Only Google Maps embeds are shown.
              </p>
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
