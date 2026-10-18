import { z } from "zod";
import { commonValidations } from "@/utils/formUtils";

export const categoryCmsSchema = z.object({
  title: commonValidations.requiredText("Title"),
  title_ar: commonValidations.requiredText("Title (Arabic)"),
});

export type CategoryCmsFormData = z.infer<typeof categoryCmsSchema>;
