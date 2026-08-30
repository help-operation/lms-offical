import { Module } from '@nestjs/common';
import { SupportController } from './support.controller';
import { SupportService } from './support.service';
import { SupportSchedulerService } from './support-scheduler.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { UploadModule } from '../upload/upload.module';
import { EmailTemplatesModule } from '../email-templates/email-templates.module';

@Module({
  imports: [NotificationsModule, UploadModule, EmailTemplatesModule],
  controllers: [SupportController],
  providers: [SupportService, SupportSchedulerService],
})
export class SupportModule {}
