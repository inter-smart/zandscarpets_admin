import { z } from "zod";
import { commonValidations } from "@/utils/formUtils";

export const blogCmsSchema = z.object({
  title: commonValidations.requiredText("Heading", 255),
  title_ar: commonValidations.requiredText("Heading (Arabic)", 255),
  related_title: commonValidations.requiredText("Related title", 255),
  related_title_ar: commonValidations.requiredText("Related title (Arabic)", 255),
});

export type BlogCmsFormData = z.infer<typeof blogCmsSchema>;
