import { z } from "zod";
import { commonValidations } from "@/utils/formUtils";

export const createUserSchema = z.object({
  username: commonValidations.username,
  email: commonValidations.requiredEmail,
  password: commonValidations.requiredPassword,
  role_id: z.number({ required_error: "Role is required", invalid_type_error: "Role is required" }).int().positive(),
  is_active: commonValidations.booleanStatus,
});

export const updateUserSchema = z.object({
  username: commonValidations.username,
  email: commonValidations.requiredEmail,
  password: commonValidations.optionalPassword,
  role_id: z.number({ required_error: "Role is required", invalid_type_error: "Role is required" }).int().positive(),
  is_active: commonValidations.booleanStatus,
});

export type CreateUserFormData = z.infer<typeof createUserSchema>;
export type UpdateUserFormData = z.infer<typeof updateUserSchema>;
