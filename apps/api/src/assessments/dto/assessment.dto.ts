import { createZodDto } from 'nestjs-zod';
import {
  UpsertQuizSchema,
  UpsertQuestionSchema,
  SubmitQuizSchema,
  UpsertAssignmentSchema,
  SubmitAssignmentSchema,
  GradeSubmissionSchema,
  UpsertResourceSchema,
} from '@repo/validators';

export class UpsertQuizDto extends createZodDto(UpsertQuizSchema) {}
export class UpsertQuestionDto extends createZodDto(UpsertQuestionSchema) {}
export class SubmitQuizDto extends createZodDto(SubmitQuizSchema) {}
export class UpsertAssignmentDto extends createZodDto(UpsertAssignmentSchema) {}
export class SubmitAssignmentDto extends createZodDto(SubmitAssignmentSchema) {}
export class GradeSubmissionDto extends createZodDto(GradeSubmissionSchema) {}
export class UpsertResourceDto extends createZodDto(UpsertResourceSchema) {}
