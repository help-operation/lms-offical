import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { asc, eq } from 'drizzle-orm';
import type { DB } from 'src/db';
import { DB_TOKEN } from 'src/db/db.module';
import { smsTemplates } from 'src/db/schema';
import { SmsGateway } from './sms.gateway';
import { SystemSettingsService } from 'src/system-settings/system-settings.service';

export type SmsVars = Record<string, string | number | null | undefined>;

type Seed = {
  eventType: string;
  name: string;
  section: string;
  body: string;
  variables: { key: string; description: string }[];
};

const v = (key: string, description: string) => ({ key, description });

/**
 * Default SMS templates, grouped by section. Mirrors the email-template seed
 * approach — inserted once per event (idempotent), then admin-editable.
 */
const SEEDS: Seed[] = [
  // ── Authentication & Account ────────────────────────────────────────────────
  {
    eventType: 'otp_verification',
    name: 'OTP Verification',
    section: 'auth',
    body: 'Your {{site_name}} OTP is {{code}}. Valid for {{minutes}} minutes. Do not share this code.',
    variables: [v('{{code}}', 'The one-time code'), v('{{minutes}}', 'Validity in minutes'), v('{{site_name}}', 'Site name')],
  },
  {
    eventType: 'welcome',
    name: 'Welcome (new signup)',
    section: 'auth',
    body: 'Hi {{name}}, welcome to {{site_name}}! Start exploring courses today.',
    variables: [v('{{name}}', 'User first name'), v('{{site_name}}', 'Site name')],
  },
  {
    eventType: 'password_reset_success',
    name: 'Password Reset Success',
    section: 'auth',
    body: 'Hi {{name}}, your {{site_name}} password was changed. If this was not you, contact support immediately.',
    variables: [v('{{name}}', 'User first name'), v('{{site_name}}', 'Site name')],
  },
  {
    eventType: 'phone_linked',
    name: 'Phone Linked',
    section: 'auth',
    body: 'Your {{site_name}} account is now linked to this phone number. If this was not you, contact support immediately.',
    variables: [v('{{site_name}}', 'Site name')],
  },
  {
    eventType: 'forgot_password_otp',
    name: 'Forgot Password OTP',
    section: 'auth',
    body: 'Your {{site_name}} password reset code is {{code}}. Valid for {{minutes}} minutes. Do not share this code.',
    variables: [v('{{code}}', 'The one-time code'), v('{{minutes}}', 'Validity in minutes'), v('{{site_name}}', 'Site name')],
  },

  // ── Enrollment & Learning ───────────────────────────────────────────────────
  {
    eventType: 'enrollment_confirmation',
    name: 'Enrollment Confirmation',
    section: 'learning',
    body: 'Hi {{name}}, you are enrolled in {{course_title}}. Happy learning with {{site_name}}!',
    variables: [v('{{name}}', 'Student name'), v('{{course_title}}', 'Course title'), v('{{site_name}}', 'Site name')],
  },
  {
    eventType: 'course_completed',
    name: 'Course Completed',
    section: 'learning',
    body: 'Congratulations {{name}}! You completed {{course_title}}. Your certificate is on the way.',
    variables: [v('{{name}}', 'Student name'), v('{{course_title}}', 'Course title')],
  },
  {
    eventType: 'certificate_ready',
    name: 'Certificate Ready',
    section: 'learning',
    body: 'Hi {{name}}, your certificate for {{course_title}} is ready: {{verify_url}}',
    variables: [v('{{name}}', 'Student name'), v('{{course_title}}', 'Course title'), v('{{verify_url}}', 'Certificate verify URL')],
  },
  {
    eventType: 'new_lesson_published',
    name: 'New Lesson Published',
    section: 'learning',
    body: 'Hi {{name}}, a new lesson "{{lesson_title}}" is live in {{course_title}}. Start learning now!',
    variables: [v('{{name}}', 'Student name'), v('{{lesson_title}}', 'Lesson title'), v('{{course_title}}', 'Course title')],
  },
  {
    eventType: 'assignment_reminder',
    name: 'Assignment Reminder',
    section: 'learning',
    body: 'Hi {{name}}, your assignment for {{course_title}} is due on {{due_date}}.',
    variables: [v('{{name}}', 'Student name'), v('{{course_title}}', 'Course title'), v('{{due_date}}', 'Assignment due date')],
  },
  {
    eventType: 'exam_reminder',
    name: 'Exam Reminder',
    section: 'learning',
    body: 'Hi {{name}}, your exam for {{course_title}} is scheduled on {{exam_date}} at {{exam_time}}.',
    variables: [v('{{name}}', 'Student name'), v('{{course_title}}', 'Course title'), v('{{exam_date}}', 'Exam date'), v('{{exam_time}}', 'Exam time')],
  },

  // ── Payments ──────────────────────────────────────────────────────────────
  {
    eventType: 'payment_received',
    name: 'Payment Received',
    section: 'payments',
    body: 'Hi {{name}}, we received your payment of {{amount}}. Thank you for choosing {{site_name}}!',
    variables: [v('{{name}}', 'Customer name'), v('{{amount}}', 'Amount paid'), v('{{site_name}}', 'Site name')],
  },
  {
    eventType: 'payment_failed',
    name: 'Payment Failed',
    section: 'payments',
    body: 'Hi {{name}}, your payment of {{amount}} could not be processed. Please try again or contact support.',
    variables: [v('{{name}}', 'Customer name'), v('{{amount}}', 'Amount')],
  },
  {
    eventType: 'manual_account_credentials',
    name: 'Account Credentials',
    section: 'payments',
    body: 'Hi {{name}}, your {{site_name}} account is ready. Login: {{phone}} | Password: {{password}}',
    variables: [v('{{name}}', 'User name'), v('{{phone}}', 'Login phone'), v('{{password}}', 'Temporary password'), v('{{site_name}}', 'Site name')],
  },
  {
    eventType: 'due_reminder',
    name: 'Due Payment Reminder',
    section: 'payments',
    body: 'Hi {{name}}, you have {{due_amount}} due for {{course_title}}. Pay now: {{payment_link}}',
    variables: [v('{{name}}', 'Student name'), v('{{course_title}}', 'Course or batch name'), v('{{due_amount}}', 'Remaining due amount'), v('{{payment_link}}', 'Payment link')],
  },

  // ── Live Courses & Classes ──────────────────────────────────────────────────
  {
    eventType: 'live_enrollment_confirmation',
    name: 'Live Enrollment Confirmation',
    section: 'live',
    body: 'Hi {{name}}, your seat in {{batch_name}} is confirmed. We will share the schedule soon!',
    variables: [v('{{name}}', 'Student name'), v('{{batch_name}}', 'Batch name')],
  },
  {
    eventType: 'live_class_reminder',
    name: 'Live Class Reminder',
    section: 'live',
    body: 'Reminder: your live class "{{title}}" starts at {{time}}. Join: {{join_link}}',
    variables: [v('{{title}}', 'Class title'), v('{{time}}', 'Start time'), v('{{join_link}}', 'Meeting link')],
  },
  {
    eventType: 'batch_starting_soon',
    name: 'Batch Starting Soon',
    section: 'live',
    body: 'Hi {{name}}, your batch {{batch_name}} starts on {{date}}. Get ready!',
    variables: [v('{{name}}', 'Student name'), v('{{batch_name}}', 'Batch name'), v('{{date}}', 'Start date')],
  },
  {
    eventType: 'class_starting_now',
    name: 'Class Starting Now',
    section: 'live',
    body: '{{title}} is starting now. Join immediately: {{join_link}}',
    variables: [v('{{title}}', 'Class or course title'), v('{{join_link}}', 'Meeting link')],
  },

  // ── Leads & Marketing ───────────────────────────────────────────────────────
  {
    eventType: 'lead_callback_ack',
    name: 'Lead / Callback Acknowledgement',
    section: 'leads',
    body: 'Hi {{name}}, thanks for your interest in {{site_name}}. Our team will contact you shortly.',
    variables: [v('{{name}}', 'Lead name'), v('{{site_name}}', 'Site name')],
  },
  {
    eventType: 'abandoned_checkout',
    name: 'Abandoned Checkout',
    section: 'leads',
    body: 'Hi {{name}}, you left {{course_title}} unfinished. Complete your enrollment: {{checkout_url}}',
    variables: [v('{{name}}', 'Lead name'), v('{{course_title}}', 'Course title'), v('{{checkout_url}}', 'Checkout URL')],
  },
  {
    eventType: 'promotional',
    name: 'Promotional / Broadcast',
    section: 'leads',
    body: '{{message}}',
    variables: [v('{{message}}', 'Your campaign message'), v('{{name}}', 'Recipient name (if available)')],
  },

  // ── Support ─────────────────────────────────────────────────────────────────
  {
    eventType: 'support_reply',
    name: 'Support Reply',
    section: 'support',
    body: 'Hi {{name}}, we replied to your ticket "{{subject}}". Check your {{site_name}} support inbox.',
    variables: [v('{{name}}', 'User name'), v('{{subject}}', 'Ticket subject'), v('{{site_name}}', 'Site name')],
  },
];

@Injectable()
export class SmsTemplatesService implements OnModuleInit {
  private readonly logger = new Logger(SmsTemplatesService.name);

  constructor(
    @Inject(DB_TOKEN) private readonly db: DB,
    private readonly gateway: SmsGateway,
    private readonly systemSettings: SystemSettingsService,
  ) {}

  // Live site name from General Settings — overrides any site_name a caller
  // passes, so admin edits apply everywhere without touching every call site.
  private async siteName(): Promise<string> {
    const { general_site_name } = await this.systemSettings.getByKeys(['general_site_name']);
    return general_site_name || 'Skillkoro';
  }

  async onModuleInit() {
    for (const seed of SEEDS) {
      const [existing] = await this.db
        .select({ id: smsTemplates.id })
        .from(smsTemplates)
        .where(eq(smsTemplates.eventType, seed.eventType))
        .limit(1);
      if (!existing) {
        await this.db.insert(smsTemplates).values({
          eventType: seed.eventType,
          name: seed.name,
          section: seed.section,
          body: seed.body,
          variables: JSON.stringify(seed.variables),
        });
      }
    }
  }

  // ── Admin CRUD ────────────────────────────────────────────────────────────

  async findAll() {
    return this.db.select().from(smsTemplates).orderBy(asc(smsTemplates.id));
  }

  async findByEvent(eventType: string) {
    const [row] = await this.db
      .select()
      .from(smsTemplates)
      .where(eq(smsTemplates.eventType, eventType))
      .limit(1);
    return row ?? null;
  }

  async update(
    eventType: string,
    data: { body?: string; name?: string },
  ) {
    const [row] = await this.db
      .update(smsTemplates)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(smsTemplates.eventType, eventType))
      .returning();
    return row;
  }

  async toggle(eventType: string) {
    const tpl = await this.findByEvent(eventType);
    if (!tpl) return null;
    const [row] = await this.db
      .update(smsTemplates)
      .set({ isEnabled: !tpl.isEnabled, updatedAt: new Date() })
      .where(eq(smsTemplates.eventType, eventType))
      .returning();
    return row;
  }

  // ── Rendering & sending ─────────────────────────────────────────────────────

  render(body: string, vars: SmsVars): string {
    return body.replace(/\{\{\s*(\w+)\s*\}\}/g, (_m, key: string) => {
      const val = vars[key] ?? vars[`{{${key}}}`];
      return val === undefined || val === null ? '' : String(val);
    });
  }

  /** Admin "send test" — fills placeholders with sample values and sends now. */
  async sendTest(eventType: string, phone: string): Promise<boolean> {
    const tpl = await this.findByEvent(eventType);
    if (!tpl) return false;

    const siteName = await this.siteName();
    const SAMPLES: Record<string, string> = {
      code: '1234', minutes: '10', name: 'Rafiq', site_name: siteName,
      course_title: 'Web Development Bootcamp', verify_url: 'https://skillkoro.com/verify/ABC123',
      amount: '৳1,999', invoice: 'INV-1024', phone, password: 'Temp1234',
      batch_name: '4th Batch', title: 'Live Q&A', time: '8:00 PM',
      join_link: 'https://meet.example.com/abc', date: '15 Jun 2026',
      checkout_url: 'https://skillkoro.com/checkout', subject: 'Payment issue',
      message: 'This is a test broadcast message.',
    };

    let vars: { key: string }[] = [];
    try { vars = JSON.parse(tpl.variables); } catch { /* ignore */ }
    const sampleVars: SmsVars = {};
    for (const item of vars) {
      const inner = item.key.replace(/[{}]/g, '').trim();
      sampleVars[inner] = SAMPLES[inner] ?? inner;
    }

    const message = this.render(tpl.body, { ...sampleVars, site_name: siteName });
    return this.gateway.send(phone, message, true);
  }

  /**
   * Send a templated SMS for an event. Fire-and-forget by default (never throws
   * into the business flow). Pass `throwOnError` for critical sends (OTP), and
   * `ignoreDisabled` to bypass the per-template on/off switch (OTP again).
   */
  async send(
    eventType: string,
    phone: string | null | undefined,
    vars: SmsVars = {},
    opts: { throwOnError?: boolean; ignoreDisabled?: boolean } = {},
  ): Promise<boolean> {
    try {
      if (!phone) return false;
      const tpl = await this.findByEvent(eventType);
      if (!tpl) {
        this.logger.warn(`No SMS template for "${eventType}"`);
        return false;
      }
      if (!tpl.isEnabled && !opts.ignoreDisabled) return false;

      // Global auto-SMS kill switch (Admin → Settings). Only affects
      // automatic/event-triggered sends routed through this method — manual
      // broadcasts and Student Filters sends go straight through SmsGateway
      // and are unaffected. OTP passes ignoreDisabled and stays exempt, same
      // as the per-template toggle above, so login/password-reset never breaks.
      if (!opts.ignoreDisabled) {
        const { sms_auto_notifications_enabled } = await this.systemSettings.getByKeys([
          'sms_auto_notifications_enabled',
        ]);
        if (sms_auto_notifications_enabled === 'false') return false;
      }

      const siteName = await this.siteName();
      const message = this.render(tpl.body, { ...vars, site_name: siteName });
      return await this.gateway.send(phone, message, opts.throwOnError);
    } catch (err) {
      if (opts.throwOnError) throw err;
      this.logger.error(`SMS send "${eventType}" failed`, err as Error);
      return false;
    }
  }
}
