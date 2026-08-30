import { Global, Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { DbModule } from 'src/db/db.module';
import { SmsGateway } from './sms.gateway';
import { SmsTemplatesService } from './sms-templates.service';
import { SmsTemplatesController } from './sms-templates.controller';
import { SmsBroadcastService } from './sms-broadcast.service';
import { SmsBroadcastController } from './sms-broadcast.controller';
import { SmsSchedulerService } from './sms-scheduler.service';
import { StorageConfigModule } from 'src/storage-config/storage-config.module';
import { SystemSettingsModule } from 'src/system-settings/system-settings.module';
import { BroadcastJobsModule } from 'src/broadcast-jobs/broadcast-jobs.module';

@Global()
@Module({
  imports: [DbModule, ScheduleModule.forRoot(), StorageConfigModule, SystemSettingsModule, BroadcastJobsModule],
  controllers: [SmsTemplatesController, SmsBroadcastController],
  providers: [
    SmsGateway,
    SmsTemplatesService,
    SmsBroadcastService,
    SmsSchedulerService,
  ],
  exports: [SmsGateway, SmsTemplatesService, SmsBroadcastService],
})
export class SmsModule {}
