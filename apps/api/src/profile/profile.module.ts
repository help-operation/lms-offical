import { Module } from '@nestjs/common';
import { UsersModule } from 'src/users/users.module';
import { AuthModule } from 'src/auth/auth.module';
import { EmailTemplatesModule } from 'src/email-templates/email-templates.module';
import { UploadModule } from 'src/upload/upload.module';
import { ProfileController } from './profile.controller';

@Module({
  imports: [UsersModule, AuthModule, EmailTemplatesModule, UploadModule],
  controllers: [ProfileController],
})
export class ProfileModule {}
