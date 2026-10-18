import { z } from "zod";
import { commonValidations } from "@/utils/formUtils";

export const blogCmsSchema = z.object({
  title: commonValidations.requiredText("Heading"),
  title_ar: commonValidations.requiredText("Heading (Arabic)"),
  related_title: z.string().optional(),
  related_title_ar: z.string().optional(),
});

export type BlogCmsFormData = z.infer<typeof blogCmsSchema>;
