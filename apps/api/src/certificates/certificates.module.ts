import { Module } from '@nestjs/common';
import { CertificatesService } from './certificates.service';
import { CertificatesController } from './certificates.controller';
import { DbModule } from 'src/db/db.module';
import { EmailTemplatesModule } from 'src/email-templates/email-templates.module';
import { ActivityLogsModule } from 'src/activity-logs/activity-logs.module';
import { SystemSettingsModule } from 'src/system-settings/system-settings.module';

@Module({
  imports: [DbModule, EmailTemplatesModule, ActivityLogsModule, SystemSettingsModule],
  controllers: [CertificatesController],
  providers: [CertificatesService],
  exports: [CertificatesService],
})
export class CertificatesModule {}
