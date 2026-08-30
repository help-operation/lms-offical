import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const contactType = z.enum(['email', 'phone']);
const value = z.string().min(3, 'Value is required').max(150, 'Too long');

export const ContactSendOtpSchema = z.object({ type: contactType, value });
export class ContactSendOtpDto extends createZodDto(ContactSendOtpSchema) {}

export const ContactVerifySchema = z.object({
  type: contactType,
  value,
  code: z.string().length(4, 'OTP must be 4 digits'),
});
export class ContactVerifyDto extends createZodDto(ContactVerifySchema) {}
