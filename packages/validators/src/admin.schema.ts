// packages/validators/src/admin.schema.ts
import { z } from "zod";
import { UserRoleSchema, UserStatusSchema } from "./auth.schema.js";

// ─── User Management ──────────────────────────────────────────────────────────

export const CreateAdminUserSchema = z.object({
  firstName: z
    .string({ required_error: "First name is required" })
    .min(2, "First name must be at least 2 characters")
    .max(100),
  lastName: z
    .string({ required_error: "Last name is required" })
    .min(2, "Last name must be at least 2 characters")
    .max(100),
  email: z
    .string({ required_error: "Email is required" })
    .email("Please enter a valid email address"),
  password: z
    .string({ required_error: "Password is required" })
    .min(8, "Password must be at least 8 characters"),
  role: z.enum(["INSTRUCTOR", "SUPER_ADMIN"]),
});
export type CreateAdminUserInput = z.infer<typeof CreateAdminUserSchema>;

export const UpdateAdminUserSchema = z.object({
  firstName: z.string().min(2).max(100).optional(),
  lastName: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  role: UserRoleSchema.optional(),
  status: UserStatusSchema.optional(),
});
export type UpdateAdminUserInput = z.infer<typeof UpdateAdminUserSchema>;

export const SuspendUserSchema = z.object({
  reason: z.string().min(5, "Please provide a reason").max(500).optional(),
});
export type SuspendUserInput = z.infer<typeof SuspendUserSchema>;

// ─── System Settings ──────────────────────────────────────────────────────────

export const UpdateSettingsSchema = z.object({
  settings: z.array(
    z.object({
      key: z.string().min(1),
      value: z.string(),
    })
  ),
});
export type UpdateSettingsInput = z.infer<typeof UpdateSettingsSchema>;
