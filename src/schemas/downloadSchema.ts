import { z } from "zod";
import { commonValidations } from "@/utils/formUtils";

export const downloadSchema = z.object({
  title: commonValidations.requiredString("Title"),
  title_ar: commonValidations.requiredString("Title (Arabic)"),
  description: z.string().trim().optional(),
  description_ar: z.string().trim().optional(),
  // optional: files are sent to requesters by hand
  file_path: z.union([z.instanceof(File), z.string()]).optional(),
  sort_order: commonValidations.sortOrder,
  is_active: commonValidations.booleanStatus,
});

export type DownloadFormData = z.infer<typeof downloadSchema>;
