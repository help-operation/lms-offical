import { createZodDto } from 'nestjs-zod';
import { CreateVisitSchema, UpdateVisitDurationSchema } from '@repo/validators';

export class CreateVisitDto extends createZodDto(CreateVisitSchema) {}
export class UpdateVisitDurationDto extends createZodDto(UpdateVisitDurationSchema) {}
