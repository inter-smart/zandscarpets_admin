import { z } from "zod";
import { commonValidations } from "@/utils/formUtils";

// Mirrors server/modules/admin/http/request/products/productsRequest.js.
// Relation id arrays (labels, related products) are managed outside
// react-hook-form (MultiSelect state in the form).
const requiredFile = (label: string) =>
  z
    .custom<File | string | null>()
    .refine(
      (v) => v instanceof File || (typeof v === "string" && v.trim().length > 0),
      `${label} is required`,
    );

const optionalFile = z.custom<File | string | null>().optional();

// Rich-text editors emit "<p></p>" (or similar) when cleared; the shared
// commonValidations.richText rule handles that by stripping tags first.

export const productSchema = z.object({
  product_category_id: z.string().min(1, "Category is required"),
  title: commonValidations.requiredString("Title"),
  title_ar: commonValidations.requiredString("Title (Arabic)"),
  price: z
    .string()
    .optional()
    .refine(
      (v) => !v || /^\d+(\.\d{1,2})?$/.test(v),
      "Price must be a number with up to 2 decimals",
    ),
  short_description: commonValidations.requiredString("Short description"),
  short_description_ar: commonValidations.requiredString("Short description (Arabic)"),
  product_description: commonValidations.richText("Product description"),
  product_description_ar: commonValidations.richText("Product description (Arabic)"),
  // the first image of the detail carousel and the image on listing cards
  list_media_path: requiredFile("Product image"),
  list_media_alt: commonValidations.optionalString.or(z.literal("")),
  list_media_alt_ar: commonValidations.optionalString.or(z.literal("")),
  sort_order: commonValidations.sortOrder,
  is_active: commonValidations.booleanStatus,
  list_in_navbar: z.boolean(),
  show_in_home: z.boolean(),
  show_in_footer: z.boolean(),
});

export type ProductFormData = z.infer<typeof productSchema>;