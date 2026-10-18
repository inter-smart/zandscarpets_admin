import { z } from "zod";
import { commonValidations } from "@/utils/formUtils";

// Categories, tags and the gallery are managed outside react-hook-form (their own state in the form).
export const blogSchema = z.object({
  title: commonValidations.requiredString("Title"),
  title_ar: commonValidations.requiredString("Title (Arabic)"),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]*$/i, "Use letters, numbers and hyphens only")
    .optional(),
  excerpt: commonValidations.requiredString("Excerpt"),
  excerpt_ar: commonValidations.optionalString,
  content: commonValidations.richText("Content"),
  content_ar: commonValidations.optionalRichText,
  author_name: commonValidations.optionalString,
  author_name_ar: commonValidations.optionalString,
  media_path: commonValidations.requiredFile("Hero image"),
  media_alt: commonValidations.requiredString("Hero image alt text"),
  media_alt_ar: commonValidations.optionalString,
  // `datetime-local` value (yyyy-MM-ddTHH:mm); empty = publish now
  published_at: z.string().optional(),
  is_active: commonValidations.booleanStatus,
});

export type BlogFormData = z.infer<typeof blogSchema>;
