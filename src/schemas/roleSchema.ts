import { z } from "zod";

export const roleSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be at most 100 characters"),
  description: z.string().max(1000, "Description is too long").optional().nullable(),
  permissions: z.record(z.enum(["view", "manage"])),
});

export type RoleFormData = z.infer<typeof roleSchema>;
