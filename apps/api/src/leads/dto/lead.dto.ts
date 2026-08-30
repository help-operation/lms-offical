import { createZodDto } from 'nestjs-zod';
import {
  CreateLeadSchema,
  UpdateLeadSchema,
  CreateInterestLeadSchema,
  CreateCallbackLeadSchema,
  CreateAbandonedCheckoutLeadSchema,
  CreateCheckoutVisitLeadSchema,
} from '@repo/validators';

export class CreateLeadDto extends createZodDto(CreateLeadSchema) {}
export class UpdateLeadDto extends createZodDto(UpdateLeadSchema) {}
export class CreateInterestLeadDto extends createZodDto(CreateInterestLeadSchema) {}
export class CreateCallbackLeadDto extends createZodDto(CreateCallbackLeadSchema) {}
export class CreateAbandonedCheckoutLeadDto extends createZodDto(CreateAbandonedCheckoutLeadSchema) {}
export class CreateCheckoutVisitLeadDto extends createZodDto(CreateCheckoutVisitLeadSchema) {}
