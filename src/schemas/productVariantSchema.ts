import { z } from "zod";
import { commonValidations } from "@/utils/formUtils";

// Mirrors server/modules/admin/http/request/products/variantsRequest.js.
// `attribute_value_ids` is one value per attribute the product uses; the exact
// per-attribute rule is re-checked on the server (and by the form UI).
const requiredFile = z.custom<File | string>().refine(
  (v) => (typeof v === "string" ? v.trim().length > 0 : v instanceof File),
  "Image is required",
);

export const productVariantSchema = z.object({
  attribute_value_ids: z
    .array(z.union([z.number(), z.string()]))
    .min(1, "Select a value for each attribute"),
  label: commonValidations.optionalString.or(z.literal("")),
  label_ar: commonValidations.optionalString.or(z.literal("")),
  // Auto-generated server-side from product + attribute values when left blank.
  sku: commonValidations.optionalString.or(z.literal("")),
  media_path: requiredFile,
  media_alt: commonValidations.optionalString.or(z.literal("")),
  media_alt_ar: commonValidations.optionalString.or(z.literal("")),
  sort_order: commonValidations.sortOrder,
  is_active: commonValidations.booleanStatus,
});

export type ProductVariantFormData = z.infer<typeof productVariantSchema>;
