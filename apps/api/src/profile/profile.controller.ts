import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Message } from 'src/common/decorators/message.decorator';
import { OtpService } from 'src/auth/otp.service';
import { SmsTemplatesService } from 'src/sms/sms-templates.service';
import { EmailTemplatesService } from 'src/email-templates/email-templates.service';
import { UsersService, normalizeContact } from 'src/users/users.service';
import { UploadService } from 'src/upload/upload.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ContactSendOtpDto, ContactVerifyDto } from './dto/contact.dto';
import type { User } from 'src/db/schema';

type PublicProfile = Omit<User, 'password'> & { hasPassword: boolean };

function toProfileResponse(user: PublicProfile) {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    role: user.role,
    avatar: user.avatar,
    gender: user.gender,
    emailNotifications: user.emailNotifications,
    hasPassword: user.hasPassword,
    createdAt: user.createdAt?.toISOString() ?? null,
    updatedAt: user.updatedAt?.toISOString() ?? null,
  };
}

@UseGuards(JwtAuthGuard)
@Controller('profile')
export class ProfileController {
  constructor(
    private readonly usersService: UsersService,
    private readonly otpService: OtpService,
    private readonly smsTemplates: SmsTemplatesService,
    private readonly emailTemplates: EmailTemplatesService,
    private readonly uploadService: UploadService,
  ) {}

  @Get()
  @Message('Profile fetched successfully')
  async getProfile(@Request() req) {
    const user = await this.usersService.findById(req.user.userId);
    if (!user) throw new NotFoundException('User not found');
    return toProfileResponse(user);
  }

  @Patch()
  @Message('Profile updated successfully')
  async updateProfile(@Request() req, @Body() dto: UpdateProfileDto) {
    const user = await this.usersService.updateProfile(req.user.userId, dto);
    if (!user) throw new NotFoundException('User not found');
    return toProfileResponse(user);
  }

  // Presigned upload URL for the account's own avatar photo.
  @Post('avatar/upload-url')
  @Message('Avatar upload URL created')
  createAvatarUploadUrl(@Body('contentType') contentType?: string) {
    return this.uploadService.createThumbnailUploadUrl('avatars', contentType ?? 'image/jpeg');
  }

  @Patch('avatar')
  @Message('Avatar updated successfully')
  async updateAvatar(@Request() req, @Body('avatar') avatar: string) {
    const user = await this.usersService.updateAvatar(req.user.userId, avatar);
    if (!user) throw new NotFoundException('User not found');
    return toProfileResponse(user);
  }

  @Patch('notifications')
  @Message('Notification preferences updated')
  async updateNotifications(
    @Request() req,
    @Body() body: { emailNotifications: boolean },
  ) {
    const user = await this.usersService.updateNotificationPref(
      req.user.userId,
      !!body.emailNotifications,
    );
    if (!user) throw new NotFoundException('User not found');
    return toProfileResponse(user);
  }

  // ── Add a contact method (email/phone) — OTP-verified, add-only ───────────
  // Sends a code to the new email/phone after confirming the slot is empty and
  // the value isn't already used by another account.
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @Post('contact/send-otp')
  @HttpCode(HttpStatus.OK)
  @Message('OTP sent successfully')
  async sendContactOtp(@Request() req, @Body() dto: ContactSendOtpDto) {
    const value = normalizeContact(dto.type, dto.value);
    await this.usersService.assertContactAvailable(
      req.user.userId,
      dto.type,
      value,
    );
    await this.otpService.sendOtpTo(value);
    return null;
  }

  // Verifies the code and saves the new email/phone onto the account.
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('contact/verify')
  @HttpCode(HttpStatus.OK)
  @Message('Contact updated successfully')
  async verifyContact(@Request() req, @Body() dto: ContactVerifyDto) {
    const value = normalizeContact(dto.type, dto.value);
    await this.otpService.verifyOtpFor(value, dto.code);
    const user = await this.usersService.setContact(
      req.user.userId,
      dto.type,
      value,
    );
    if (!user) throw new NotFoundException('User not found');

    // Confirmation notification (fire-and-forget — linking already succeeded).
    if (dto.type === 'phone') {
      void this.smsTemplates.send('phone_linked', value, {});
    } else {
      const fullName = `${user.firstName} ${user.lastName}`.trim();
      void this.emailTemplates.send('email_linked', value, {
        student_name: fullName || 'there',
      });
    }

    return toProfileResponse(user);
  }

  @Patch('password')
  @Message('Password updated successfully')
  async changePassword(
    @Request() req,
    @Body() body: { currentPassword?: string; newPassword: string },
  ) {
    await this.usersService.changePassword(
      req.user.userId,
      body.currentPassword,
      body.newPassword,
    );
    return { success: true };
  }
}
