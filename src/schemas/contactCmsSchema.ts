import { z } from "zod";
import { commonValidations } from "@/utils/formUtils";
import { extractMapEmbedUrl } from "@/utils/googleMapsEmbed";

export const contactCmsSchema = z.object({
  title: commonValidations.requiredText("Title"),
  title_ar: commonValidations.requiredText("Title (Arabic)"),
  description: commonValidations.richText("Description"),
  description_ar: commonValidations.richText("Description (Arabic)"),
  form_title: commonValidations.requiredText("Form title"),
  form_title_ar: commonValidations.requiredText("Form title (Arabic)"),
  social_media_title: commonValidations.requiredText("Social media title"),
  social_media_title_ar: commonValidations.requiredText("Social media title (Arabic)"),
  // the pasted iframe code is allowed; only the embed URL inside it is kept
  map_url: z
    .string()
    .trim()
    .min(1, "Map URL is required")
    .refine(
      (value) => extractMapEmbedUrl(value) !== "",
      "Paste the embed code from Google Maps (Share > Embed a map)",
    )
    .transform(extractMapEmbedUrl),
  // phone / email / office detail cards (all optional; a card without a value is not shown)
  phone_title: z.string().optional(),
  phone_title_ar: z.string().optional(),
  phone_description: z.string().optional(),
  phone_description_ar: z.string().optional(),
  phone_value: z.string().optional(),
  phone_icon_media_alt: z.string().optional(),
  phone_icon_media_alt_ar: z.string().optional(),
  phone_icon_media_path: z.any().optional(),
  email_title: z.string().optional(),
  email_title_ar: z.string().optional(),
  email_description: z.string().optional(),
  email_description_ar: z.string().optional(),
  email_value: z.string().optional(),
  email_icon_media_alt: z.string().optional(),
  email_icon_media_alt_ar: z.string().optional(),
  email_icon_media_path: z.any().optional(),
  office_title: z.string().optional(),
  office_title_ar: z.string().optional(),
  office_description: z.string().optional(),
  office_description_ar: z.string().optional(),
  office_value: z.string().optional(),
  office_value_ar: z.string().optional(),
  office_icon_media_alt: z.string().optional(),
  office_icon_media_alt_ar: z.string().optional(),
  office_icon_media_path: z.any().optional(),
});

export type ContactCmsFormData = z.infer<typeof contactCmsSchema>;
