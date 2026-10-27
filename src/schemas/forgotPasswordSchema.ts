import { z } from "zod";
import { commonValidations } from "@/utils/formUtils";

export const emailSchema = z.object({
  email: commonValidations.requiredEmail,
});
export type EmailFormData = z.infer<typeof emailSchema>;

export const otpSchema = z.object({
  otp: z
    .string()
    .length(6, "Enter the 6-digit code")
    .regex(/^\d{6}$/, "Code must contain only digits"),
});
export type OtpFormData = z.infer<typeof otpSchema>;

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password must be at most 128 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
