import { Module } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CoursesSchedulerService } from './courses-scheduler.service';
import { BunnyStreamModule } from 'src/bunny-stream/bunny-stream.module';
import { ActivityLogsModule } from 'src/activity-logs/activity-logs.module';
import {
  AdminCoursesController,
  InstructorCoursesController,
  InstructorsController,
  PublicCoursesController,
  StatsController,
} from './courses.controller';

@Module({
  imports: [BunnyStreamModule, ActivityLogsModule],
  controllers: [
    PublicCoursesController,
    StatsController,
    InstructorsController,
    InstructorCoursesController,
    AdminCoursesController,
  ],
  // CoursesSchedulerService also auto-publishes scheduled live courses
  // (liveCourses table) — kept here rather than LiveCoursesModule to avoid
  // a second @Cron job / module cycle; it only needs DB_TOKEN + RevalidationService.
  providers: [CoursesService, CoursesSchedulerService],
  exports: [CoursesService],
})
export class CoursesModule {}
