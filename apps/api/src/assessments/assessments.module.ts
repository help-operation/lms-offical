import { Module } from '@nestjs/common';
import { AssessmentsService } from './assessments.service';
import {
  AssessmentsAuthorController,
  AssessmentsStudentController,
} from './assessments.controller';

@Module({
  controllers: [AssessmentsAuthorController, AssessmentsStudentController],
  providers: [AssessmentsService],
})
export class AssessmentsModule {}
