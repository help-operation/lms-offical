import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const EducationSchema = z.object({
  degree: z.string().max(200).optional(),
  institution: z.string().max(300).optional(),
  subject: z.string().max(200).optional(),
  passingYear: z.number().int().min(1900).max(2100).optional(),
  result: z.string().max(50).optional(),
  order: z.number().int().optional(),
});
export class EducationDto extends createZodDto(EducationSchema) {}

export const EducationIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});
export class EducationIdParamDto extends createZodDto(EducationIdParamSchema) {}
