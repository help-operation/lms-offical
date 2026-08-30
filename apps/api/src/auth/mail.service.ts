import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailTemplatesService } from 'src/email-templates/email-templates.service';

const OTP_TTL_MINUTES = 5;

/**
 * Facade over the DB-backed EmailTemplatesService for transactional/auth emails.
 * The HTML/subject for each of these now lives in the `email_templates` table
 * and is editable from the admin "Email Templates" page. This service only maps
 * call-site arguments to template variables and preserves the original error
 * semantics (auth emails rethrow; notifications are fire-and-forget).
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(
    private config: ConfigService,
    private templates: EmailTemplatesService,
  ) {}

  async sendOtpEmail(to: string, code: string): Promise<void> {
    // Debug aid for local dev (no SMTP configured) — never logged at info level.
    this.logger.debug(`[OTP] ${to} | Code: ${code}`);
    try {
      await this.templates.dispatch('otp_verification', to, {
        otp_code:  code,
        otp_ttl:   String(OTP_TTL_MINUTES),
      });
    } catch (err) {
      this.logger.error('OTP email send failed', err as Error);
      throw new InternalServerErrorException(
        'Failed to send verification email. Please try again.',
      );
    }
  }

  async sendPasswordResetEmail(
    to: string,
    userName: string,
    resetUrl: string,
  ): Promise<void> {
    try {
      await this.templates.dispatch('password_reset', to, {
        user_name: userName,
        reset_url: resetUrl,
      });
    } catch (err) {
      this.logger.error('Password reset email failed', err as Error);
      throw new InternalServerErrorException(
        'Failed to send reset email. Please try again.',
      );
    }
  }

  async sendContactNotification(
    to: string,
    msg: { name: string; email: string; subject: string; message: string },
  ): Promise<void> {
    try {
      await this.templates.dispatch(
        'contact_notification',
        to,
        {
          contact_name:    msg.name,
          contact_email:   msg.email,
          contact_subject: msg.subject,
          contact_message: msg.message,
        },
        { replyTo: msg.email },
      );
    } catch (err) {
      // Non-fatal: a failed staff notification should not break the contact form.
      this.logger.error('Contact notification failed', err as Error);
    }
  }

  async sendInstructorApprovalEmail(to: string, name: string, tempPassword: string): Promise<void> {
    const adminUrl = this.config.get<string>('ADMIN_URL') ?? 'http://localhost:3003';
    try {
      await this.templates.dispatch('instructor_approved', to, {
        instructor_name: name,
        login_email:     to,
        temp_password:   tempPassword,
        admin_url:       adminUrl,
      });
    } catch (err) {
      this.logger.error('Instructor approval email failed', err as Error);
    }
  }

  async sendInstructorRejectionEmail(to: string, name: string, notes?: string): Promise<void> {
    const reason =
      notes?.trim() ||
      'We are unable to move forward with your application at this time.';
    try {
      await this.templates.dispatch('instructor_rejected', to, {
        instructor_name:  name,
        rejection_reason: reason,
      });
    } catch (err) {
      this.logger.error('Instructor rejection email failed', err as Error);
    }
  }
}
