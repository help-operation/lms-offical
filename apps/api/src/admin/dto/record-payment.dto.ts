import { createZodDto } from 'nestjs-zod';
import { RecordPaymentSchema } from '@repo/validators';

export class RecordPaymentDto extends createZodDto(RecordPaymentSchema) {}
