import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { eq, and, gt } from 'drizzle-orm';
import type { DB } from 'src/db';
import { DB_TOKEN } from 'src/db/db.module';
import { otpVerifications } from 'src/db/schema';
import { MailService } from './mail.service';
import { SmsTemplatesService } from 'src/sms/sms-templates.service';

const OTP_TTL_MINUTES = 10;

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  constructor(
    @Inject(DB_TOKEN) private readonly db: DB,
    private mailService: MailService,
    private smsTemplates: SmsTemplatesService,
  ) {}

  private generate(): string {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }

  // ── Identifier (email OR phone) helpers ──────────────────────────────────

  async sendOtpTo(identifier: string): Promise<void> {
    if (identifier.includes('@')) {
      await this.sendEmailOtp(identifier);
    } else {
      await this.sendOtp(identifier);
    }
  }

  async verifyOtpFor(identifier: string, code: string): Promise<void> {
    if (identifier.includes('@')) {
      await this.verifyEmailOtp(identifier, code);
    } else {
      await this.verifyOtp(identifier, code);
    }
  }

  private async sendEmailOtp(email: string): Promise<void> {
    const code = this.generate();
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

    await this.db
      .update(otpVerifications)
      .set({ used: true })
      .where(eq(otpVerifications.email, email));

    await this.db.insert(otpVerifications).values({ email, code, expiresAt });

    await this.mailService.sendOtpEmail(email, code);
  }

  private async verifyEmailOtp(email: string, code: string): Promise<void> {
    const now = new Date();
    const [otp] = await this.db
      .select()
      .from(otpVerifications)
      .where(
        and(
          eq(otpVerifications.email, email),
          eq(otpVerifications.code, code),
          eq(otpVerifications.used, false),
          gt(otpVerifications.expiresAt, now),
        ),
      )
      .limit(1);

    if (!otp) throw new BadRequestException('Invalid or expired OTP');

    await this.db
      .update(otpVerifications)
      .set({ used: true })
      .where(eq(otpVerifications.id, otp.id));
  }

  async sendOtp(phone: string): Promise<void> {
    const code = this.generate();
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

    // Invalidate previous OTPs for this phone
    await this.db
      .update(otpVerifications)
      .set({ used: true })
      .where(eq(otpVerifications.phone, phone));

    await this.db.insert(otpVerifications).values({ phone, code, expiresAt });

    await this.sendSms(phone, code);
  }

  async verifyOtp(phone: string, code: string): Promise<void> {
    const now = new Date();
    const [otp] = await this.db
      .select()
      .from(otpVerifications)
      .where(
        and(
          eq(otpVerifications.phone, phone),
          eq(otpVerifications.code, code),
          eq(otpVerifications.used, false),
          gt(otpVerifications.expiresAt, now),
        ),
      )
      .limit(1);

    if (!otp) throw new BadRequestException('Invalid or expired OTP');

    await this.db
      .update(otpVerifications)
      .set({ used: true })
      .where(eq(otpVerifications.id, otp.id));
  }

  private async sendSms(phone: string, code: string): Promise<void> {
    // Uses the editable "otp_verification" SMS template. `ignoreDisabled` keeps
    // OTP working even if an admin toggles the template off (security-critical),
    // and `throwOnError` surfaces gateway failures to the caller.
    await this.smsTemplates.send(
      'otp_verification',
      phone,
      { code, minutes: OTP_TTL_MINUTES },
      { throwOnError: true, ignoreDisabled: true },
    );
  }
}
