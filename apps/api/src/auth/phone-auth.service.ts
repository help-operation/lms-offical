import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';
import type { DB } from 'src/db';
import { DB_TOKEN } from 'src/db/db.module';
import { users } from 'src/db/schema';
import { OtpService } from './otp.service';
import { AuthService } from './auth.service';
import { verifyPassword, isLegacyHash, hashPassword } from './password.util';
import { AdminNotificationsService } from 'src/notifications/admin-notifications.service';
import { SmsTemplatesService } from 'src/sms/sms-templates.service';
import type {
  PhoneSignupDto,
  PhoneLoginDto,
  PhoneResetPasswordDto,
} from './dto/phone-auth.dto';

@Injectable()
export class PhoneAuthService {
  constructor(
    @Inject(DB_TOKEN) private readonly db: DB,
    private otpService: OtpService,
    private authService: AuthService,
    private adminNotifications: AdminNotificationsService,
    private smsTemplates: SmsTemplatesService,
  ) {}

  async sendOtp(phone: string): Promise<void> {
    await this.otpService.sendOtp(phone);
  }

  async signup(dto: PhoneSignupDto) {
    // Verify OTP
    await this.otpService.verifyOtp(dto.phone, dto.code);

    // Check phone not already taken
    const [existing] = await this.db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.phone, dto.phone))
      .limit(1);

    if (existing) throw new ConflictException('Phone number already registered');

    const hash = await bcrypt.hash(dto.password, 10);

    const [user] = await this.db
      .insert(users)
      .values({
        phone: dto.phone,
        firstName: dto.firstName,
        lastName: dto.lastName,
        password: hash,
        // New users start as GUEST; upgraded to STUDENT on first enrollment.
        role: 'GUEST',
        status: 'active',
      })
      .returning();

    await this.adminNotifications.notifyAdmins(
      'signup',
      'New user signup',
      `${user.firstName} ${user.lastName} • ${dto.phone}`,
      '/admin/users',
    );

    await this.smsTemplates.send('welcome', dto.phone, { name: user.firstName });

    return this.authService.login(user, 'user');
  }

  async login(dto: PhoneLoginDto) {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.phone, dto.phone))
      .limit(1);

    if (!user) throw new UnauthorizedException('Phone number not registered');
    if (!user.password) throw new UnauthorizedException('No password set for this account');

    this.authService.assertNotLocked(user.lockedUntil);

    const match = await verifyPassword(dto.password, user.password);
    if (!match) {
      await this.authService.registerFailedLogin(
        'user',
        user.id,
        user.failedLoginAttempts,
      );
      throw new UnauthorizedException('Incorrect password');
    }

    if (user.status === 'suspended')
      throw new UnauthorizedException('Your account has been suspended');

    await this.authService.resetFailedLogin('user', user.id);

    // Transparently upgrade a legacy WordPress hash to native bcrypt.
    if (isLegacyHash(user.password)) {
      await this.db
        .update(users)
        .set({ password: await hashPassword(dto.password) })
        .where(eq(users.id, user.id));
    }

    return this.authService.login(user, 'user');
  }

  async forgotPassword(dto: PhoneResetPasswordDto) {
    // Verify OTP
    await this.otpService.verifyOtp(dto.phone, dto.code);

    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.phone, dto.phone))
      .limit(1);

    if (!user) throw new BadRequestException('Phone number not found');

    const hash = await bcrypt.hash(dto.password, 10);

    const [updated] = await this.db
      .update(users)
      .set({
        password: hash,
        updatedAt: new Date(),
        tokensValidFrom: new Date(),
        failedLoginAttempts: 0,
        lockedUntil: null,
      })
      .where(eq(users.id, user.id))
      .returning();

    return this.authService.login(updated, 'user');
  }
}
