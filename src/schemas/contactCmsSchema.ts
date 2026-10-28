import { z } from "zod";
import { commonValidations } from "@/utils/formUtils";
import { extractMapEmbedUrl } from "@/utils/googleMapsEmbed";

export const contactCmsSchema = z.object({
  title: commonValidations.requiredText("Title", 255),
  title_ar: commonValidations.requiredText("Title (Arabic)", 255),
  description: commonValidations.richText("Description"),
  description_ar: commonValidations.richText("Description (Arabic)"),
  form_title: commonValidations.requiredText("Form title", 255),
  form_title_ar: commonValidations.requiredText("Form title (Arabic)", 255),
  social_media_title: commonValidations.requiredText("Social media title", 255),
  social_media_title_ar: commonValidations.requiredText("Social media title (Arabic)", 255),
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
  // phone / email / office detail cards (all required)
  phone_title: commonValidations.requiredText("Phone title", 255),
  phone_title_ar: commonValidations.requiredText("Phone title (Arabic)", 255),
  phone_description: commonValidations.richText("Phone description"),
  phone_description_ar: commonValidations.richText("Phone description (Arabic)"),
  phone_value: commonValidations.phone("Phone value"),
  phone_icon_media_alt: commonValidations.requiredText("Phone icon alt", 255),
  phone_icon_media_alt_ar: commonValidations.requiredText("Phone icon alt (Arabic)", 255),
  phone_icon_media_path: commonValidations.requiredFile("Phone icon"),
  email_title: commonValidations.requiredText("Email title", 255),
  email_title_ar: commonValidations.requiredText("Email title (Arabic)", 255),
  email_description: commonValidations.richText("Email description"),
  email_description_ar: commonValidations.richText("Email description (Arabic)"),
  email_value: commonValidations.email("Email value"),
  email_icon_media_alt: commonValidations.requiredText("Email icon alt", 255),
  email_icon_media_alt_ar: commonValidations.requiredText("Email icon alt (Arabic)", 255),
  email_icon_media_path: commonValidations.requiredFile("Email icon"),
  office_title: commonValidations.requiredText("Office title", 255),
  office_title_ar: commonValidations.requiredText("Office title (Arabic)", 255),
  office_description: commonValidations.richText("Office description"),
  office_description_ar: commonValidations.richText("Office description (Arabic)"),
  office_value: commonValidations.richText("Office value"),
  office_value_ar: commonValidations.richText("Office value (Arabic)"),
  office_icon_media_alt: commonValidations.requiredText("Office icon alt", 255),
  office_icon_media_alt_ar: commonValidations.requiredText("Office icon alt (Arabic)", 255),
  office_icon_media_path: commonValidations.requiredFile("Office icon"),
});

export type ContactCmsFormData = z.infer<typeof contactCmsSchema>;
