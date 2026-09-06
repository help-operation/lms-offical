import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const EmergencyContactSchema = z.object({
  emergencyContactName: z.string().min(1, 'Contact name is required').max(200),
  emergencyContactPhone: z.string().min(1, 'Phone number is required').max(20),
  emergencyContactRelationship: z.string().max(50).optional(),
});
export class EmergencyContactDto extends createZodDto(EmergencyContactSchema) {}
