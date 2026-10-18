import { z } from "zod";
import { commonValidations } from "@/utils/formUtils";

export const adsBannerSchema = z.object({
  media_path: commonValidations.requiredFile("Banner Image"),
  media_alt: commonValidations.requiredString("Alt text"),
  media_alt_ar: commonValidations.requiredString("Alt text (Arabic)"),
  // where the banner leads (a site path like /en/products or a full URL); optional
  link: z.string().trim().max(255, "Link must be at most 255 characters").optional(),
  link_new_tab: z.boolean().optional(),
  // optional button over the banner (needs a link); empty = default "Shop Now"
  button_text: z.string().trim().max(60, "At most 60 characters").optional(),
  button_text_ar: z.string().trim().max(60, "At most 60 characters").optional(),
  sort_order: commonValidations.sortOrder,
  is_active: commonValidations.booleanStatus,
});

export type AdsBannerFormData = z.infer<typeof adsBannerSchema>;
