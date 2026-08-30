import { Module } from '@nestjs/common';
import { InstructorApplicationsService } from './instructor-applications.service';
import { InstructorApplicationsController } from './instructor-applications.controller';
import { DbModule } from 'src/db/db.module';
import { MailService } from 'src/auth/mail.service';
import { EmailTemplatesModule } from 'src/email-templates/email-templates.module';

@Module({
  imports: [DbModule, EmailTemplatesModule],
  controllers: [InstructorApplicationsController],
  providers: [InstructorApplicationsService, MailService],
})
export class InstructorApplicationsModule {}
