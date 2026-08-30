// packages/validators/src/profile.schema.ts
import { z } from "zod";
import { UserRoleSchema, UserStatusSchema } from "./auth.schema.js";

export const GenderSchema = z.enum(["male", "female", "other"]);

export const ProfileSchema = z.object({
  id: z.number(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email().nullable(),
  phone: z.string().nullable(),
  role: UserRoleSchema,
  status: UserStatusSchema,
  avatar: z.string().nullable(),
  gender: GenderSchema.nullable(),
  createdAt: z.string().nullable(),
  updatedAt: z.string().nullable(),
});
export type Profile = z.infer<typeof ProfileSchema>;

export const UpdateProfileSchema = z.object({
  firstName: z
    .string({ required_error: "First name is required" })
    .min(3, "First name must be at least 3 characters")
    .max(100, "First name must be at most 100 characters")
    .regex(/^[a-zA-Z\s]+$/, "First name can only contain letters"),
  lastName: z
    .string({ required_error: "Last name is required" })
    .min(3, "Last name must be at least 3 characters")
    .max(100, "Last name must be at most 100 characters")
    .regex(/^[a-zA-Z\s]+$/, "Last name can only contain letters"),
  gender: GenderSchema.optional(),
});
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;

// ─── Student profile ──────────────────────────────────────────────────────────

export const UpdateStudentProfileSchema = z.object({
  firstName: z.string().min(2).max(100).optional(),
  lastName: z.string().min(2).max(100).optional(),
  bio: z.string().max(1000).optional(),
  profession: z.string().max(150).optional(),
  socialLinks: z
    .object({
      twitter: z.string().url().optional(),
      linkedin: z.string().url().optional(),
      github: z.string().url().optional(),
      website: z.string().url().optional(),
    })
    .optional(),
});
export type UpdateStudentProfileInput = z.infer<typeof UpdateStudentProfileSchema>;

// ─── Instructor profile ───────────────────────────────────────────────────────

export const UpdateInstructorProfileSchema = z.object({
  firstName: z.string().min(2).max(100).optional(),
  lastName: z.string().min(2).max(100).optional(),
  bio: z.string().max(2000).optional(),
  expertise: z.string().max(255).optional(),
  socialLinks: z
    .object({
      twitter: z.string().url().optional(),
      linkedin: z.string().url().optional(),
      github: z.string().url().optional(),
      youtube: z.string().url().optional(),
      website: z.string().url().optional(),
    })
    .optional(),
});
export type UpdateInstructorProfileInput = z.infer<typeof UpdateInstructorProfileSchema>;
