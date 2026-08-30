import { createZodDto } from 'nestjs-zod';
import { CreateCourseSchema, UpdateCourseSchema } from '@repo/validators';

export class CreateCourseDto extends createZodDto(CreateCourseSchema) {}
export class UpdateCourseDto extends createZodDto(UpdateCourseSchema) {}
