import { Module } from '@nestjs/common';
import { ContactMessagesService } from './contact-messages.service';
import { ContactMessagesController } from './contact-messages.controller';
import { DbModule } from 'src/db/db.module';
import { MailService } from 'src/auth/mail.service';
import { SystemSettingsModule } from 'src/system-settings/system-settings.module';
import { EmailTemplatesModule } from 'src/email-templates/email-templates.module';

@Module({
  imports: [DbModule, SystemSettingsModule, EmailTemplatesModule],
  controllers: [ContactMessagesController],
  providers: [ContactMessagesService, MailService],
})
export class ContactMessagesModule {}
