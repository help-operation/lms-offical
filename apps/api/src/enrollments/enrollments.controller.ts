import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CurrentUser, type RequestUser } from 'src/common/decorators/current-user.decorator';
import { Message } from 'src/common/decorators/message.decorator';
import { EnrollmentsService } from './enrollments.service';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Post('courses/:courseId/enroll')
  @Roles('STUDENT', 'GUEST')
  @Message('Enrolled successfully')
  enroll(
    @CurrentUser() user: RequestUser,
    @Param('courseId', ParseIntPipe) courseId: number,
  ) {
    return this.enrollmentsService.enroll(user.userId, courseId);
  }

  @Get('student/enrollments')
  @Roles('STUDENT', 'GUEST')
  @Message('Enrollments fetched')
  getMyEnrollments(@CurrentUser() user: RequestUser) {
    return this.enrollmentsService.getMyEnrollments(user.userId);
  }

  @Get('courses/:courseId/enrollment-status')
  @Roles('STUDENT', 'GUEST')
  @Message('Status fetched')
  getEnrollmentStatus(
    @CurrentUser() user: RequestUser,
    @Param('courseId', ParseIntPipe) courseId: number,
  ) {
    return this.enrollmentsService.getEnrollmentInfo(user.userId, courseId);
  }

  // Distinct path from the PUBLIC `/courses/:id/curriculum` so this
  // enrollment-gated handler is actually reachable (no route collision).
  @Get('learn/:courseId/curriculum')
  @Roles('STUDENT', 'GUEST')
  @Message('Curriculum fetched')
  getCurriculum(
    @CurrentUser() user: RequestUser,
    @Param('courseId', ParseIntPipe) courseId: number,
  ) {
    return this.enrollmentsService.getCourseCurriculum(user.userId, courseId);
  }
}
