import { z } from "zod";
import { commonValidations } from "@/utils/formUtils";

export const seasonalOfferSchema = z.object({
  is_active: z.boolean(),
  // empty or 0 disables the auto-show timer; otherwise 5-60 whole seconds
  auto_show_delay_seconds: z
    .string()
    .optional()
    .refine(
      (val) => {
        const v = (val ?? "").trim();
        if (v === "") return true;
        if (!/^\d+$/.test(v)) return false;
        const n = Number(v);
        return n === 0 || (n >= 5 && n <= 60);
      },
      { message: "Enter 0 / leave empty to disable, or a whole number between 5 and 60 seconds" },
    ),
  media_path: commonValidations.requiredFile("Main image"),
  mobile_media_path: commonValidations.fileUpload,
  badge_image: commonValidations.fileUpload,
  button_text: commonValidations.requiredText("Button text"),
  button_text_ar: commonValidations.requiredText("Button text (Arabic)"),
  button_link: commonValidations.requiredText("Button link"),
});

export type SeasonalOfferFormData = z.infer<typeof seasonalOfferSchema>;
