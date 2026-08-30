import { createZodDto } from 'nestjs-zod';
import {
  CreateLessonSchema,
  UpdateLessonSchema,
  ReorderLessonsSchema,
} from '@repo/validators';

export class CreateLessonDto extends createZodDto(CreateLessonSchema) {}
export class UpdateLessonDto extends createZodDto(UpdateLessonSchema) {}
export class ReorderLessonsDto extends createZodDto(ReorderLessonsSchema) {}
