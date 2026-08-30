import { createZodDto } from 'nestjs-zod';
import { ManualEnrollmentSchema } from '@repo/validators';

export class ManualEnrollmentDto extends createZodDto(ManualEnrollmentSchema) {}
