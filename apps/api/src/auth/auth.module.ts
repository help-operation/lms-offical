import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersModule } from 'src/users/users.module';
import { PassportModule } from '@nestjs/passport';
import { LocalStrategy } from './local.strategy';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './constants';
import { JWTStrategy } from './jwt.strategy';
import { OtpService } from './otp.service';
import { MailService } from './mail.service';
import { PhoneAuthService } from './phone-auth.service';
import { PhoneAuthController } from './phone-auth.controller';
import { AccountAuthService } from './account-auth.service';
import { AccountAuthController } from './account-auth.controller';
import { GoogleStrategy } from './google.strategy';
import { GoogleController } from './google.controller';
import { DbModule } from 'src/db/db.module';
import { RbacModule } from 'src/rbac/rbac.module';
import { EmailTemplatesModule } from 'src/email-templates/email-templates.module';
import { ActivityLogsModule } from 'src/activity-logs/activity-logs.module';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    DbModule,
    RbacModule,
    EmailTemplatesModule,
    ActivityLogsModule,
    // registerAsync so the factory runs at module init (after ConfigModule has
    // loaded .env), rather than reading the secret at import time.
    JwtModule.registerAsync({
      useFactory: () => ({ secret: jwtConstants.secret }),
    }),
  ],
  providers: [
    AuthService,
    LocalStrategy,
    JWTStrategy,
    OtpService,
    MailService,
    PhoneAuthService,
    AccountAuthService,
    GoogleStrategy,
  ],
  controllers: [
    AuthController,
    PhoneAuthController,
    AccountAuthController,
    GoogleController,
  ],
  exports: [OtpService],
})
export class AuthModule {}
