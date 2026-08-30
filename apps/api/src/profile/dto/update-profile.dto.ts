import { createZodDto } from 'nestjs-zod';
import { UpdateProfileSchema } from '@repo/validators';

export class UpdateProfileDto extends createZodDto(UpdateProfileSchema) {}
