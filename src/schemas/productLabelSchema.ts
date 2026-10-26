import { z } from "zod";
import { commonValidations } from "@/utils/formUtils";

const LABEL_TYPES = ["feature", "tag", "specification"] as const;

export const productLabelSchema = z.object({
  type: z.enum(LABEL_TYPES),
  title: commonValidations.requiredString("Title"),
  title_ar: commonValidations.requiredString("Title (Arabic)"),
  is_product_badge: z.boolean(),
  show_in_filter: z.boolean(),
  sort_order: commonValidations.sortOrder,
  is_active: commonValidations.booleanStatus,
});

export type ProductLabelFormData = z.infer<typeof productLabelSchema>;