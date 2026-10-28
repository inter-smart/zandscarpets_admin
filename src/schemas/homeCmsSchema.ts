import { z } from "zod";
import { commonValidations } from "@/utils/formUtils";

export const homeCmsSchema = z.object({
  discover_title: commonValidations.requiredText("Discover title"),
  discover_title_ar: commonValidations.requiredText("Discover title (Arabic)"),
  residential_title: commonValidations.requiredText("Residential title"),
  residential_title_ar: commonValidations.requiredText("Residential title (Arabic)"),
  project_title: commonValidations.requiredText("Project title"),
  project_title_ar: commonValidations.requiredText("Project title (Arabic)"),
  testimonial_title: commonValidations.requiredText("Testimonial title", 255),
  testimonial_title_ar: commonValidations.requiredText("Testimonial title (Arabic)", 255),
  brand_title: commonValidations.requiredText("Brand title", 255),
  brand_title_ar: commonValidations.requiredText("Brand title (Arabic)", 255),
  cta_title: commonValidations.richText("CTA title"),
  cta_title_ar: commonValidations.richText("CTA title (Arabic)"),
  cta_media_path: commonValidations.requiredFile("CTA image"),
  cta_description: commonValidations.richText("CTA description"),
  cta_description_ar: commonValidations.richText("CTA description (Arabic)"),
  faq_title: commonValidations.requiredText("FAQ title", 255),
  faq_title_ar: commonValidations.requiredText("FAQ title (Arabic)", 255),
  space_section_title: commonValidations.requiredText("Space section title", 255),
  space_section_title_ar: commonValidations.requiredText("Space section title (Arabic)", 255),
  space_button_text: commonValidations.requiredText("Space button text", 255),
  space_button_text_ar: commonValidations.requiredText("Space button text (Arabic)", 255),
  space_button_link: commonValidations.linkOrPath("Space button link"),
  space_bg_image: commonValidations.requiredFile("Space background image"),
  premium_title: commonValidations.requiredText("Premium title", 255),
  premium_title_ar: commonValidations.requiredText("Premium title (Arabic)", 255),
  premium_description: commonValidations.richText("Premium description"),
  premium_description_ar: commonValidations.richText("Premium description (Arabic)"),
});

export type HomeCmsFormData = z.infer<typeof homeCmsSchema>;
