import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

// Link-based admin password reset. `forgot-password` takes no body (the link is
// always sent to the super-admin's registered email).
export const ResetPasswordSchema = z
  .object({
    token: z.string().min(10, 'Invalid reset token'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    password_confirmation: z.string().min(6, 'Password must be at least 6 characters'),
  })
  .refine((d) => d.password === d.password_confirmation, {
    message: 'Passwords do not match',
    path: ['password_confirmation'],
  });

export class ResetPasswordDto extends createZodDto(ResetPasswordSchema) {}
