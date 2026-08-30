import { createZodDto } from "nestjs-zod";
import { SignupSchema } from "@repo/validators";

export class SignupDto extends createZodDto(SignupSchema) {}