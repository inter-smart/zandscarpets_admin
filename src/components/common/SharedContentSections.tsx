import { Link } from "react-router-dom";
import { Info, Loader2 } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormTextField, FormTextareaField, FormFileUploadField } from "@/components/forms/FormFieldComponents";
import type { SharedContentForm } from "@/hooks/useSharedContentForm";

interface Props {
  shared: SharedContentForm;
  // Name of the other page that renders this content, for the notice.
  otherPage?: "Home" | "About";
}

// The shared `common_content` cards. Wrapped in its own <Form> provider (no <form> element) so it can
// sit inside a page's CMS <form> and still resolve its own field context.
export default function SharedContentSections({ shared, otherPage }: Props) {
  const { form, generatingThumbnail, mediaType } = shared;
  return (
    <Form {...form}>
      <div className="space-y-6">
      {otherPage && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            The three sections below (Why Choose Us, Side Section, How It Works) are shared with the {otherPage} page —
            editing them here updates both pages. Their list items are managed from the shared menu items.{" "}
            <Link to="/section-visibility" className="font-medium underline underline-offset-4">
              Hide a section on one page
            </Link>
            .
          </AlertDescription>
        </Alert>
      )}
      <Card>
        <CardHeader>
          <CardTitle>Why Choose Section</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormTextField form={form} name="why_choose_title" label="Why Choose Title" placeholder="Enter why choose title" />
            <FormTextField form={form} name="why_choose_title_ar" label="Why Choose Title (Arabic)" placeholder="أدخل عنوان لماذا تختارنا" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Side Section</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormTextField form={form} name="side_section_title" label="Side Section Title" placeholder="Enter side section title" />
            <FormTextField form={form} name="side_section_title_ar" label="Side Section Title (Arabic)" placeholder="أدخل عنوان القسم الجانبي" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormTextareaField form={form} name="side_section_description" label="Side Section Description" placeholder="Enter side section description" />
            <FormTextareaField form={form} name="side_section_description_ar" label="Side Section Description (Arabic)" placeholder="أدخل وصف القسم الجانبي" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormTextField form={form} name="button_text" label="Button Text" placeholder="Enter button text" />
            <FormTextField form={form} name="button_text_ar" label="Button Text (Arabic)" placeholder="أدخل نص الزر" />
          </div>
          <FormTextField form={form} name="button_link" label="Button Link" placeholder="/contact" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How It Works Section</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormTextField form={form} name="how_section_title" label="How Section Title" placeholder="Enter how section title" />
            <FormTextField form={form} name="how_section_title_ar" label="How Section Title (Arabic)" placeholder="أدخل عنوان قسم كيف يعمل" />
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormTextField form={form} name="how_section_bg_title" label="How Section Background Title" placeholder="e.g. OUR PROCESS (faint text behind the heading)" />
            <FormTextField form={form} name="how_section_bg_title_ar" label="How Section Background Title (Arabic)" placeholder="مثال: عمليتنا" />
          </div>

          <FormField
            control={form.control}
            name="how_section_media_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Media Type</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value);
                    // Existing file belongs to the previous type; force a re-upload.
                    form.setValue("how_section_media_path", "");
                    form.setValue("how_section_thumbnail", "");
                  }}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select media type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="image">Image</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {mediaType === "video" ? (
            <>
              <FormFileUploadField
                key="video"
                form={form}
                name="how_section_media_path"
                label="Video"
                placeholder="Upload video"
                accept="video/mp4,video/quicktime,video/webm"
                maxVideoSize={10 * 1024 * 1024}
              />
              <div className="space-y-2">
                {generatingThumbnail && (
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Generating thumbnail...
                  </p>
                )}
                <FormFileUploadField
                  key="thumbnail"
                  form={form}
                  name="how_section_thumbnail"
                  label="Thumbnail"
                  placeholder="Auto-generated from the video — upload to replace"
                  accept="image/*"
                />
              </div>
            </>
          ) : (
            <FormFileUploadField
              key="image"
              form={form}
              name="how_section_media_path"
              label="Image"
              placeholder="Upload image"
              accept="image/*"
            />
          )}
        </CardContent>
      </Card>
      </div>
    </Form>
  );
}
