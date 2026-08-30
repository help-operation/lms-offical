import { Module } from '@nestjs/common';
import { LiveCoursesService } from './live-courses.service';
import {
  AdminLiveCoursesController,
  PublicLiveCoursesController,
} from './live-courses.controller';
import { LiveCourseBatchesService } from './live-course-batches.service';
import { LiveCourseBatchesController } from './live-course-batches.controller';
import { LiveCourseCurriculumService } from './live-course-curriculum.service';
import {
  AdminLiveCourseCurriculumController,
  StudentLiveCourseCurriculumController,
  LiveLessonPlaybackController,
} from './live-course-curriculum.controller';
import { LiveBatchService } from './live-batch.service';
import {
  AdminLiveBatchController,
  StudentLiveBatchController,
} from './live-batch.controller';
import { LiveLessonAssessmentsService } from './live-lesson-assessments.service';
import {
  AdminLiveLessonAssessmentsController,
  StudentLiveLessonAssessmentsController,
  StudentLiveAssessmentActionsController,
} from './live-lesson-assessments.controller';
import { LiveSubscriptionsModule } from './live-subscriptions.module';
import { SubscriptionBillingService } from './subscription-billing.service';
import { PaymentsModule } from 'src/payments/payments.module';
import { SystemSettingsModule } from 'src/system-settings/system-settings.module';
import { BunnyStreamModule } from 'src/bunny-stream/bunny-stream.module';
import { ActivityLogsModule } from 'src/activity-logs/activity-logs.module';
import { NotificationsModule } from 'src/notifications/notifications.module';

@Module({
  // PaymentsModule (not OrdersModule) here — OrdersModule imports
  // LiveCoursesModule, so importing OrdersModule back would cycle.
  // PaymentsModule is a leaf module with no dependency on either.
  imports: [SystemSettingsModule, BunnyStreamModule, ActivityLogsModule, PaymentsModule, LiveSubscriptionsModule, NotificationsModule],
  controllers: [
    AdminLiveCoursesController,
    PublicLiveCoursesController,
    LiveCourseBatchesController,
    AdminLiveCourseCurriculumController,
    StudentLiveCourseCurriculumController,
    LiveLessonPlaybackController,
    AdminLiveBatchController,
    StudentLiveBatchController,
    AdminLiveLessonAssessmentsController,
    StudentLiveLessonAssessmentsController,
    StudentLiveAssessmentActionsController,
  ],
  providers: [LiveCoursesService, LiveCourseBatchesService, LiveCourseCurriculumService, LiveBatchService, LiveLessonAssessmentsService, SubscriptionBillingService],
  exports: [LiveCoursesService, LiveCourseBatchesService, LiveCourseCurriculumService, LiveBatchService],
})
export class LiveCoursesModule {}
