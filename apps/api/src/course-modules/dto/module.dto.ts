import { createZodDto } from 'nestjs-zod';
import {
  CreateModuleSchema,
  UpdateModuleSchema,
  ReorderModulesSchema,
} from '@repo/validators';

export class CreateModuleDto extends createZodDto(CreateModuleSchema) {}
export class UpdateModuleDto extends createZodDto(UpdateModuleSchema) {}
export class ReorderModulesDto extends createZodDto(ReorderModulesSchema) {}
