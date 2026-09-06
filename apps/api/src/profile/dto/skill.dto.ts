import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const SkillSchema = z.object({
  skillName: z.string().min(1, 'Skill name is required').max(200),
  level: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).optional(),
});
export class SkillDto extends createZodDto(SkillSchema) {}

export const SkillIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});
export class SkillIdParamDto extends createZodDto(SkillIdParamSchema) {}
