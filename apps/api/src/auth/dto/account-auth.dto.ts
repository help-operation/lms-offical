import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const identifier = z
  .string()
  .min(3, 'Email or phone number is required')
  .max(150, 'Too long');

export const AccountSendOtpSchema = z.object({
  identifier,
  // Distinguishes the two OTP flows that share this endpoint: 'signup' rejects
  // existing accounts, 'reset' requires one. Defaults to 'signup' for back-compat.
  purpose: z.enum(['signup', 'reset']).default('signup'),
});
export class AccountSendOtpDto extends createZodDto(AccountSendOtpSchema) {}

export const AccountLoginSchema = z.object({
  identifier,
  password: z.string().min(1, 'Password is required'),
});
export class AccountLoginDto extends createZodDto(AccountLoginSchema) {}

export const AccountSignupSchema = z.object({
  identifier,
  code: z.string().length(4, 'OTP must be 4 digits'),
  // The signup form collects a single "Full Name" and splits it on the first
  // space, so lastName may be empty for single-word names.
  firstName: z.string().min(2, 'Full name must be at least 2 characters'),
  lastName: z.string().max(100, 'Name too long').optional().default(''),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  gender: z.enum(['male', 'female', 'other']).optional(),
});
export class AccountSignupDto extends createZodDto(AccountSignupSchema) {}

export const AccountResetSchema = z.object({
  identifier,
  code: z.string().length(4, 'OTP must be 4 digits'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
export class AccountResetDto extends createZodDto(AccountResetSchema) {}
