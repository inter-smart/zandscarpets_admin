import { z } from "zod";
import { commonValidations } from "@/utils/formUtils";
import { FIELD_TYPES } from "@/services/details/detailFieldsApi";

export const detailFieldSchema = z.object({
  name: commonValidations.requiredString("Name"),
  name_ar: z.string().trim().optional(),
  type: z.enum(FIELD_TYPES),
  allows_multiple: z.boolean(),
  sort_order: commonValidations.sortOrder,
  is_active: commonValidations.booleanStatus,
});

export type DetailFieldFormData = z.infer<typeof detailFieldSchema>;
