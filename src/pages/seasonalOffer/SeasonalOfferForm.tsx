import { useState, useEffect } from "react";
import PageLoader from "@/components/layout/PageLoader";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FormTextField,
  FormFileUploadField,
  FormNumberField,
} from "@/components/forms/FormFieldComponents";
import { Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  seasonalOfferSchema,
  SeasonalOfferFormData,
} from "@/schemas/seasonalOfferSchema";
import {
  fetchSeasonalOffer,
  saveSeasonalOffer,
} from "@/services/seasonalOffer/seasonalOfferApi";
import {
  SEASONAL_IMAGE_ACCEPT,
  SEASONAL_MAIN_MAX_BYTES,
  SEASONAL_BADGE_MAX_BYTES,
  SEASONAL_MAIN_RECOMMENDED,
  SEASONAL_BADGE_RECOMMENDED,
  validateSeasonalMainImage,
  validateSeasonalBadgeImage,
} from "@/utils/seasonalOfferImageValidation";

const defaultValues: SeasonalOfferFormData = {
  is_active: false,
  auto_show_delay_seconds: "",
  media_path: "",
  badge_image: "",
  button_text: "",
  button_text_ar: "",
  button_link: "",
};

export default function SeasonalOfferForm() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [recordId, setRecordId] = useState<number | undefined>(undefined);

  const form = useForm<SeasonalOfferFormData>({
    resolver: zodResolver(seasonalOfferSchema),
    defaultValues,
  });

  useEffect(() => {
    loadSeasonalOfferData();
  }, []);

  const loadSeasonalOfferData = async () => {
    try {
      setInitialLoading(true);
      const response = await fetchSeasonalOffer();
      const data = response.data;

      if (data) {
        setRecordId(data.id);
        form.reset({
          is_active: data.is_active ?? false,
          auto_show_delay_seconds:
            data.auto_show_delay_seconds != null
              ? String(data.auto_show_delay_seconds)
              : "",
          media_path: data.media_path || "",
          badge_image: data.badge_image || "",
          button_text: data.button_text || "",
          button_text_ar: data.button_text_ar || "",
          button_link: data.button_link || "",
        });
      }
    } catch (error) {
      console.log("No existing data found, starting with empty form");
    } finally {
      setInitialLoading(false);
    }
  };

  const onSubmit = async (data: SeasonalOfferFormData) => {
    try {
      setLoading(true);
      const payload = new FormData();
      const { media_path, badge_image, ...textFields } = data;
      Object.entries(textFields).forEach(([key, value]) =>
        payload.append(key, typeof value === "boolean" ? String(value) : (value ?? "")),
      );
      if (media_path instanceof File) {
        payload.append("media_path", media_path);
      } else if (typeof media_path === "string" && media_path) {
        payload.append("media_path", media_path);
      }
      if (badge_image instanceof File) {
        payload.append("badge_image", badge_image);
      } else if (typeof badge_image === "string" && badge_image) {
        payload.append("badge_image", badge_image);
      }
      const response = await saveSeasonalOffer(payload, recordId ?? 1);
      if (response.data?.id) {
        setRecordId(response.data.id);
      }
      toast({
        title: "Success",
        description: "Seasonal Offer saved successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to save Seasonal Offer",
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
        <h1 className="text-2xl font-bold">Seasonal Offer</h1>
        <p className="text-muted-foreground">
          Manage the promotional popup shown on the storefront
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Status</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Enable or disable the popup everywhere (the auto-show timer and the
                        manual trigger on the Seasonal Offer page).
                      </p>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormNumberField
                form={form}
                name="auto_show_delay_seconds"
                label="Auto-show delay (seconds)"
                placeholder="e.g. 10"
                description="Recommended: keep the delay between 10 and 15 seconds for a better user experience."
                min={0}
              />
              <p className="text-sm text-muted-foreground">
                Seconds after a visitor lands on the site before the popup opens
                automatically, site-wide. Leave empty to disable the auto-show timer (the
                popup can still be opened manually from the Seasonal Offer page).
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Main Image</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormFileUploadField
                form={form}
                name="media_path"
                label="Main Image"
                placeholder="Upload image"
                accept={SEASONAL_IMAGE_ACCEPT}
                maxImageSize={SEASONAL_MAIN_MAX_BYTES}
                recommendedDimensions={SEASONAL_MAIN_RECOMMENDED}
                validateImage={validateSeasonalMainImage}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Offer Badge</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormFileUploadField
                form={form}
                name="badge_image"
                label="Badge Image (optional)"
                placeholder="Upload badge image"
                accept={SEASONAL_IMAGE_ACCEPT}
                maxImageSize={SEASONAL_BADGE_MAX_BYTES}
                recommendedDimensions={SEASONAL_BADGE_RECOMMENDED}
                validateImage={validateSeasonalBadgeImage}
              />
              <p className="text-sm text-muted-foreground">
                Shown in a fixed circular badge over the top-left corner of the main
                image (e.g. "UP TO 40% OFF"). Leave empty to hide the badge.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Button</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormTextField
                form={form}
                name="button_text"
                label="Button Text"
                placeholder="e.g. Shop Now"
              />
              <FormTextField
                form={form}
                name="button_text_ar"
                label="Button Text (Arabic)"
                placeholder="مثال: تسوق الآن"
              />
              <div className="md:col-span-2">
                <FormTextField
                  form={form}
                  name="button_link"
                  label="Button Link"
                  placeholder="/products or https://..."
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
