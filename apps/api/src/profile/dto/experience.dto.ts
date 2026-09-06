import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const ExperienceSchema = z.object({
  company: z.string().max(300).optional(),
  designation: z.string().max(200).optional(),
  department: z.string().max(100).optional(),
  employmentType: z.string().max(30).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  currentlyWorking: z.boolean().optional(),
  responsibilities: z.string().optional(),
  order: z.number().int().optional(),
});
export class ExperienceDto extends createZodDto(ExperienceSchema) {}

export const ExperienceIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});
export class ExperienceIdParamDto extends createZodDto(ExperienceIdParamSchema) {}
