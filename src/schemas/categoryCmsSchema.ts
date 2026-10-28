import { z } from "zod";
import { commonValidations } from "@/utils/formUtils";

export const categoryCmsSchema = z.object({
  title: commonValidations.requiredText("Title", 255),
  title_ar: commonValidations.requiredText("Title (Arabic)", 255),
});

export type CategoryCmsFormData = z.infer<typeof categoryCmsSchema>;
