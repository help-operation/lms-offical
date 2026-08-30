import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';
import type { DB } from 'src/db';
import { DB_TOKEN } from 'src/db/db.module';
import { users } from 'src/db/schema';
import { verifyPassword, isLegacyHash, hashPassword } from './password.util';
import { OtpService } from './otp.service';
import { AuthService } from './auth.service';
import { AdminNotificationsService } from 'src/notifications/admin-notifications.service';
import { SmsTemplatesService } from 'src/sms/sms-templates.service';
import type {
  AccountLoginDto,
  AccountSignupDto,
  AccountResetDto,
} from './dto/account-auth.dto';

type Identity = { type: 'email' | 'phone'; value: string };

@Injectable()
export class AccountAuthService {
  constructor(
    @Inject(DB_TOKEN) private readonly db: DB,
    private otpService: OtpService,
    private authService: AuthService,
    private adminNotifications: AdminNotificationsService,
    private smsTemplates: SmsTemplatesService,
  ) {}

  /** Detect & normalise an email-or-phone identifier */
  private parse(raw: string): Identity {
    const value = raw.trim();
    if (value.includes('@')) {
      const email = value.toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        throw new BadRequestException('Invalid email address');
      return { type: 'email', value: email };
    }
    const phone = value.replace(/[\s-]/g, '');
    if (!/^\+?[0-9]{10,15}$/.test(phone))
      throw new BadRequestException('Invalid phone number');
    return { type: 'phone', value: phone };
  }

  private async findUser(id: Identity) {
    const [user] = await this.db
      .select()
      .from(users)
      .where(
        id.type === 'email'
          ? eq(users.email, id.value)
          : eq(users.phone, id.value),
      )
      .limit(1);
    return user;
  }

  async sendOtp(rawIdentifier: string, purpose: 'signup' | 'reset' = 'signup') {
    const id = this.parse(rawIdentifier);
    const existing = await this.findUser(id);

    // Signup: reject duplicates up front so the user is told at the email/phone
    // step instead of after the OTP round-trip — and we don't waste an OTP send.
    if (purpose === 'signup' && existing)
      throw new ConflictException(
        `This ${id.type === 'email' ? 'email' : 'phone number'} is already registered`,
      );

    // Reset: the account must exist — otherwise there's nothing to reset.
    if (purpose === 'reset' && !existing)
      throw new NotFoundException(
        `No account found for this ${id.type === 'email' ? 'email' : 'phone number'}`,
      );

    await this.otpService.sendOtpTo(id.value);
  }

  async signup(dto: AccountSignupDto) {
    const id = this.parse(dto.identifier);
    await this.otpService.verifyOtpFor(id.value, dto.code);

    if (await this.findUser(id))
      throw new ConflictException(
        `This ${id.type === 'email' ? 'email' : 'phone number'} is already registered`,
      );

    const hash = await bcrypt.hash(dto.password, 10);
    const [user] = await this.db
      .insert(users)
      .values({
        email: id.type === 'email' ? id.value : null,
        phone: id.type === 'phone' ? id.value : null,
        firstName: dto.firstName,
        lastName: dto.lastName,
        password: hash,
        role: 'GUEST',
        status: 'active',
        gender: dto.gender,
      })
      .returning();

    await this.adminNotifications.notifyAdmins(
      'signup',
      'New user signup',
      `${user.firstName} ${user.lastName} • ${id.value}`,
      '/admin/users',
    );

    // Welcome SMS (only phone signups have a number to text).
    if (id.type === 'phone') {
      await this.smsTemplates.send('welcome', id.value, { name: user.firstName });
    }

    return this.authService.login(user, 'user');
  }

  async login(dto: AccountLoginDto) {
    const id = this.parse(dto.identifier);
    const user = await this.findUser(id);

    if (!user)
      throw new UnauthorizedException({
        message: `No account found for this ${id.type === 'email' ? 'email' : 'phone number'}`,
        code: 'ACCOUNT_NOT_FOUND',
      });
    if (!user.password)
      throw new UnauthorizedException('No password set for this account');

    // Reject early if the account is currently locked out.
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

    // Successful login clears any accumulated failures.
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

  async forgotPassword(dto: AccountResetDto) {
    const id = this.parse(dto.identifier);
    await this.otpService.verifyOtpFor(id.value, dto.code);

    const user = await this.findUser(id);
    if (!user) throw new BadRequestException('Account not found');

    const hash = await bcrypt.hash(dto.password, 10);
    const [updated] = await this.db
      .update(users)
      .set({
        password: hash,
        updatedAt: new Date(),
        // Invalidate pre-reset sessions and clear any lockout.
        tokensValidFrom: new Date(),
        failedLoginAttempts: 0,
        lockedUntil: null,
      })
      .where(eq(users.id, user.id))
      .returning();

    await this.smsTemplates.send('password_reset_success', updated.phone, {
      name: updated.firstName,
    });

    return this.authService.login(updated, 'user');
  }

  /** Google OAuth — find existing user by email or create a new guest */
  async findOrCreateGoogleUser(profile: {
    email: string;
    firstName: string;
    lastName: string;
    avatar?: string | null;
  }) {
    const email = profile.email.toLowerCase();
    const [existing] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing) {
      if (existing.status === 'suspended')
        throw new UnauthorizedException('Your account has been suspended');
      return this.authService.login(existing, 'user');
    }

    const [user] = await this.db
      .insert(users)
      .values({
        email,
        firstName: profile.firstName || 'Google',
        lastName: profile.lastName || 'User',
        avatar: profile.avatar ?? null,
        role: 'GUEST',
        status: 'active',
      })
      .returning();

    return this.authService.login(user, 'user');
  }
}
