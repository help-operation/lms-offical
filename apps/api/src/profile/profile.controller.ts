import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
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
import { AddressDto } from './dto/address.dto';
import { EmergencyContactDto } from './dto/emergency-contact.dto';
import { EducationDto } from './dto/education.dto';
import { ExperienceDto } from './dto/experience.dto';
import { SkillDto } from './dto/skill.dto';
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

  // ── Avatar ──────────────────────────────────────────────────────────────────

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

  // ── Notifications ──────────────────────────────────────────────────────────

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

  // ── Contact (OTP-verified, add-only) ──────────────────────────────────────

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

  // ── Password ───────────────────────────────────────────────────────────────

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

  // ── Address ────────────────────────────────────────────────────────────────

  @Get('address')
  @Message('Address fetched successfully')
  async getAddress(@Request() req) {
    return this.usersService.getAddress(req.user.userId);
  }

  @Patch('address')
  @Message('Address updated successfully')
  async updateAddress(@Request() req, @Body() dto: AddressDto) {
    const user = await this.usersService.updateAddress(req.user.userId, dto as unknown as Record<string, string | boolean | undefined>);
    if (!user) throw new NotFoundException('User not found');
    return toProfileResponse(user);
  }

  // ── Emergency Contact ──────────────────────────────────────────────────────

  @Get('emergency-contact')
  @Message('Emergency contact fetched successfully')
  async getEmergencyContact(@Request() req) {
    return this.usersService.getEmergencyContact(req.user.userId);
  }

  @Patch('emergency-contact')
  @Message('Emergency contact updated successfully')
  async updateEmergencyContact(
    @Request() req,
    @Body() dto: EmergencyContactDto,
  ) {
    const user = await this.usersService.updateEmergencyContact(
      req.user.userId,
      dto,
    );
    if (!user) throw new NotFoundException('User not found');
    return toProfileResponse(user);
  }

  // ── Education ──────────────────────────────────────────────────────────────

  @Get('education')
  @Message('Education records fetched successfully')
  async listEducation(@Request() req) {
    return this.usersService.listEducation(req.user.userId);
  }

  @Post('education')
  @HttpCode(HttpStatus.CREATED)
  @Message('Education record created successfully')
  async createEducation(@Request() req, @Body() dto: EducationDto) {
    return this.usersService.createEducation(req.user.userId, dto);
  }

  @Patch('education/:id')
  @Message('Education record updated successfully')
  async updateEducation(
    @Request() req,
    @Param('id') id: number,
    @Body() dto: EducationDto,
  ) {
    return this.usersService.updateEducation(req.user.userId, id, dto as unknown as Record<string, unknown>);
  }

  @Delete('education/:id')
  @Message('Education record deleted successfully')
  async deleteEducation(@Request() req, @Param('id') id: number) {
    await this.usersService.deleteEducation(req.user.userId, id);
    return null;
  }

  // ── Experience ─────────────────────────────────────────────────────────────

  @Get('experience')
  @Message('Experience records fetched successfully')
  async listExperience(@Request() req) {
    return this.usersService.listExperience(req.user.userId);
  }

  @Post('experience')
  @HttpCode(HttpStatus.CREATED)
  @Message('Experience record created successfully')
  async createExperience(@Request() req, @Body() dto: ExperienceDto) {
    const data: Record<string, unknown> = { ...dto };
    if (data.startDate) data.startDate = new Date(data.startDate as string);
    if (data.endDate) data.endDate = new Date(data.endDate as string);
    return this.usersService.createExperience(req.user.userId, data);
  }

  @Patch('experience/:id')
  @Message('Experience record updated successfully')
  async updateExperience(
    @Request() req,
    @Param('id') id: number,
    @Body() dto: ExperienceDto,
  ) {
    const data: Record<string, unknown> = { ...dto };
    if (data.startDate) data.startDate = new Date(data.startDate as string);
    if (data.endDate) data.endDate = new Date(data.endDate as string);
    return this.usersService.updateExperience(req.user.userId, id, data);
  }

  @Delete('experience/:id')
  @Message('Experience record deleted successfully')
  async deleteExperience(@Request() req, @Param('id') id: number) {
    await this.usersService.deleteExperience(req.user.userId, id);
    return null;
  }

  // ── Skills ─────────────────────────────────────────────────────────────────

  @Get('skills')
  @Message('Skills fetched successfully')
  async listSkills(@Request() req) {
    return this.usersService.listSkills(req.user.userId);
  }

  @Post('skills')
  @HttpCode(HttpStatus.CREATED)
  @Message('Skill added successfully')
  async addSkill(@Request() req, @Body() dto: SkillDto) {
    return this.usersService.addSkill(req.user.userId, dto);
  }

  @Delete('skills/:id')
  @Message('Skill removed successfully')
  async removeSkill(@Request() req, @Param('id') id: number) {
    await this.usersService.removeSkill(req.user.userId, id);
    return null;
  }
}
