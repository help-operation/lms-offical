import { Module } from '@nestjs/common';
import { EmailTemplatesService } from './email-templates.service';
import { EmailTemplatesController } from './email-templates.controller';
import { EmailBroadcastService } from './email-broadcast.service';
import { EmailBroadcastController } from './email-broadcast.controller';
import { DbModule } from 'src/db/db.module';
import { SystemSettingsModule } from 'src/system-settings/system-settings.module';
import { BroadcastJobsModule } from 'src/broadcast-jobs/broadcast-jobs.module';

@Module({
  imports: [DbModule, SystemSettingsModule, BroadcastJobsModule],
  controllers: [EmailTemplatesController, EmailBroadcastController],
  providers: [EmailTemplatesService, EmailBroadcastService],
  exports: [EmailTemplatesService, EmailBroadcastService],
})
export class EmailTemplatesModule {}
