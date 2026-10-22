import { z } from "zod";
import { commonValidations } from "@/utils/formUtils";

export const seasonalOfferSchema = z.object({
  is_active: z.boolean(),
  auto_show_delay_seconds: z.string().optional(),
  media_path: commonValidations.requiredFile("Main image"),
  badge_image: commonValidations.fileUpload,
  button_text: commonValidations.requiredText("Button text"),
  button_text_ar: commonValidations.requiredText("Button text (Arabic)"),
  button_link: commonValidations.requiredText("Button link"),
});

export type SeasonalOfferFormData = z.infer<typeof seasonalOfferSchema>;
