import { z } from "zod";
import { commonValidations } from "@/utils/formUtils";

export const blogTagSchema = z.object({
  title: commonValidations.requiredString("Title"),
  title_ar: commonValidations.requiredString("Title (Arabic)"),
  sort_order: commonValidations.sortOrder,
  is_active: commonValidations.booleanStatus,
});

export type BlogTagFormData = z.infer<typeof blogTagSchema>;
