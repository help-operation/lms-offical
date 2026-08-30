// packages/validators/src/auth.schema.ts
import { z } from "zod";

export const UserRoleSchema = z.enum(["GUEST", "STUDENT", "INSTRUCTOR", "SUPER_ADMIN"]);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const UserStatusSchema = z.enum(["active", "suspended", "pending"]);
export type UserStatus = z.infer<typeof UserStatusSchema>;

// ─── Phone OTP (student/guest) ────────────────────────────────────────────────

export const SendOtpSchema = z.object({
  phone: z
    .string({ required_error: "Phone number is required" })
    .min(10, "Phone number must be at least 10 digits")
    .max(15, "Phone number must be at most 15 digits")
    .regex(/^\+?[0-9]+$/, "Invalid phone number format"),
});
export type SendOtpInput = z.infer<typeof SendOtpSchema>;

export const VerifyOtpSchema = z.object({
  phone: z
    .string({ required_error: "Phone number is required" })
    .min(10, "Phone number must be at least 10 digits")
    .max(15, "Phone number must be at most 15 digits"),
  code: z
    .string({ required_error: "OTP code is required" })
    .length(4, "OTP must be exactly 4 digits")
    .regex(/^[0-9]+$/, "OTP must contain only digits"),
});
export type VerifyOtpInput = z.infer<typeof VerifyOtpSchema>;

export const CompleteProfileSchema = z.object({
  firstName: z
    .string({ required_error: "First name is required" })
    .min(2, "First name must be at least 2 characters")
    .max(100, "First name must be at most 100 characters")
    .regex(/^[a-zA-Z\s]+$/, "First name can only contain letters"),
  lastName: z
    .string({ required_error: "Last name is required" })
    .min(2, "Last name must be at least 2 characters")
    .max(100, "Last name must be at most 100 characters")
    .regex(/^[a-zA-Z\s]+$/, "Last name can only contain letters"),
  email: z.string().email("Please enter a valid email address").optional(),
});
export type CompleteProfileInput = z.infer<typeof CompleteProfileSchema>;

// ─── Email Login (instructor/admin) ───────────────────────────────────────────

export const EmailLoginSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .email("Please enter a valid email address"),
  password: z
    .string({ required_error: "Password is required" })
    .min(1, "Password is required"),
});
export type EmailLoginInput = z.infer<typeof EmailLoginSchema>;

// ─── Signup (kept for backward compat / admin user creation) ─────────────────

export const SignupSchema = z.object({
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
  email: z
    .string({ required_error: "Email is required" })
    .email("Please enter a valid email address"),
  password: z
    .string({ required_error: "Password is required" })
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password must be at most 100 characters"),
});
export type SignupInput = z.infer<typeof SignupSchema>;

// ─── Responses ────────────────────────────────────────────────────────────────

export const OtpVerifyResponseSchema = z.object({
  isNewUser: z.boolean(),
  role: UserRoleSchema,
});
export type OtpVerifyResponse = z.infer<typeof OtpVerifyResponseSchema>;

export const SignupResponseSchema = z.object({
  id: z.number(),
  fullName: z.string(),
  email: z.string().email(),
  role: UserRoleSchema,
});
export type SignupResponse = z.infer<typeof SignupResponseSchema>;

export const MeResponseSchema = z.object({
  id: z.number(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email().nullable(),
  phone: z.string().nullable(),
  role: UserRoleSchema,
  status: UserStatusSchema,
  avatar: z.string().nullable(),
  createdAt: z.string().nullable(),
  updatedAt: z.string().nullable(),
  // Effective admin permission slugs (empty for web users). Drives the admin
  // UI's hasPermission() so it mirrors backend enforcement.
  permissions: z.array(z.string()).optional().default([]),
  // Web (student) users only — admin users have no billing/location columns.
  // Not collected anywhere yet (no checkout step asks for them); present for a
  // future feature. Consumers (e.g. Enhanced Conversions) must handle absence.
  country: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  postalCode: z.string().nullable().optional(),
});
export type MeResponse = z.infer<typeof MeResponseSchema>;

// ─── JWT payload ──────────────────────────────────────────────────────────────

export const JwtPayloadSchema = z.object({
  sub: z.number(),
  username: z.string(),
  role: UserRoleSchema,
  iat: z.number().optional(),
  exp: z.number().optional(),
});
export type JwtPayload = z.infer<typeof JwtPayloadSchema>;

// ─── Phone Login (student/guest web) ─────────────────────────────────────────

export const PhoneLoginSchema = z.object({
  phone: z
    .string({ required_error: "Phone number is required" })
    .min(10, "Phone number must be at least 10 digits")
    .max(15, "Phone number too long"),
  password: z
    .string({ required_error: "Password is required" })
    .min(1, "Password is required"),
});
export type PhoneLoginInput = z.infer<typeof PhoneLoginSchema>;

// ─── Phone Signup (student) ───────────────────────────────────────────────────

export const PhoneSignupSchema = z.object({
  phone: z
    .string({ required_error: "Phone number is required" })
    .min(10, "Phone number must be at least 10 digits")
    .max(15, "Phone number too long"),
  code: z
    .string({ required_error: "OTP is required" })
    .length(4, "OTP must be 4 digits"),
  firstName: z
    .string({ required_error: "First name is required" })
    .min(2, "First name must be at least 2 characters"),
  lastName: z
    .string({ required_error: "Last name is required" })
    .min(2, "Last name must be at least 2 characters"),
  password: z
    .string({ required_error: "Password is required" })
    .min(6, "Password must be at least 6 characters"),
});
export type PhoneSignupInput = z.infer<typeof PhoneSignupSchema>;

// ─── Phone Reset Password ─────────────────────────────────────────────────────

export const PhoneResetPasswordSchema = z.object({
  phone: z
    .string({ required_error: "Phone number is required" })
    .min(10, "Phone number must be at least 10 digits")
    .max(15, "Phone number too long"),
  code: z
    .string({ required_error: "OTP is required" })
    .length(4, "OTP must be 4 digits"),
  password: z
    .string({ required_error: "Password is required" })
    .min(6, "Password must be at least 6 characters"),
});
export type PhoneResetPasswordInput = z.infer<typeof PhoneResetPasswordSchema>;

// ─── Combined identifier (email OR phone) auth — student/guest web ───────────

const identifier = z
  .string({ required_error: "Email or phone number is required" })
  .min(3, "Email or phone number is required")
  .max(150, "Too long");

export const IdentifierSendOtpSchema = z.object({ identifier });
export type IdentifierSendOtpInput = z.infer<typeof IdentifierSendOtpSchema>;

export const IdentifierLoginSchema = z.object({
  identifier,
  password: z
    .string({ required_error: "Password is required" })
    .min(1, "Password is required"),
});
export type IdentifierLoginInput = z.infer<typeof IdentifierLoginSchema>;

export const IdentifierSignupSchema = z.object({
  identifier,
  code: z
    .string({ required_error: "OTP is required" })
    .length(4, "OTP must be 4 digits"),
  firstName: z
    .string({ required_error: "First name is required" })
    .min(2, "First name must be at least 2 characters"),
  lastName: z
    .string({ required_error: "Last name is required" })
    .min(2, "Last name must be at least 2 characters"),
  password: z
    .string({ required_error: "Password is required" })
    .min(6, "Password must be at least 6 characters"),
});
export type IdentifierSignupInput = z.infer<typeof IdentifierSignupSchema>;

export const IdentifierResetPasswordSchema = z.object({
  identifier,
  code: z
    .string({ required_error: "OTP is required" })
    .length(4, "OTP must be 4 digits"),
  password: z
    .string({ required_error: "Password is required" })
    .min(6, "Password must be at least 6 characters"),
});
export type IdentifierResetPasswordInput = z.infer<
  typeof IdentifierResetPasswordSchema
>;

// ─── Login alias (kept for backward compat) ───────────────────────────────────
export const LoginSchema = EmailLoginSchema;
export type LoginInput = EmailLoginInput;

export const AuthTokenSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
});
export type AuthToken = z.infer<typeof AuthTokenSchema>;
