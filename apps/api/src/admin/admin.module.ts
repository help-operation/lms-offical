import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { EmailTemplatesModule } from 'src/email-templates/email-templates.module';
import { ActivityLogsModule } from 'src/activity-logs/activity-logs.module';

@Module({
  imports: [EmailTemplatesModule, ActivityLogsModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
