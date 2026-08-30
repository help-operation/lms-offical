import { createZodDto } from 'nestjs-zod';
import { CreateCategorySchema, UpdateCategorySchema } from '@repo/validators';

export class CreateCategoryDto extends createZodDto(CreateCategorySchema) {}
export class UpdateCategoryDto extends createZodDto(UpdateCategorySchema) {}
