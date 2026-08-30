// apps/api/src/auth/dto/login.dto.ts
import { createZodDto } from 'nestjs-zod';
import { LoginSchema } from '@repo/validators';

export class LoginDto extends createZodDto(LoginSchema) {}