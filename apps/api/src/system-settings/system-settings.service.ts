import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { eq, inArray } from 'drizzle-orm';
import type { DB } from 'src/db';
import { DB_TOKEN } from 'src/db/db.module';
import { systemSettings } from 'src/db/schema';
import { RevalidationService } from 'src/common/revalidation/revalidation.service';
import { settingsKeysToTags } from 'src/common/revalidation/cache-tags';

const DEFAULTS: Record<string, string> = {
  // ─── Maintenance ──────────────────────────────────────────────────────────
  maintenance_enabled: 'false',
  maintenance_message: 'We are currently performing scheduled maintenance. We\'ll be back shortly.',

  // ─── SMS ──────────────────────────────────────────────────────────────────
  // Global kill switch for automatic/event-triggered SMS (welcome, payment,
  // certificates, reminders, etc — see SmsTemplatesService#send). Login and
  // password-reset OTP are exempt and always send regardless of this flag.
  // Manual sends (Broadcast, Student Filters) are also unaffected. Starts
  // 'false' (auto SMS off) while the notification module is still being built.
  sms_auto_notifications_enabled: 'false',

  // ─── General ──────────────────────────────────────────────────────────────
  general_site_name: 'Skillkoro',
  general_tagline: 'Learn. Grow. Succeed.',
  general_meta_description: 'Join 56K+ learners. 200+ expert-led courses across development, design, marketing and more.',
  general_logo_url: '',
  general_logo_url_dark: '',
  general_favicon_url: '',
  general_contact_email: 'hello@skillkoro.com',
  general_contact_phone: '+880 1700-000000',
  general_contact_phone2: '+880 1700-000000',
  general_support_whatsapp: '',
  general_address: 'Dhaka, Bangladesh',
  general_copyright: `© ${new Date().getFullYear()} Skillkoro. All rights reserved.`,
  general_trade_license: '',

  // ─── Business Info ────────────────────────────────────────────────────────
  general_company_name: '',
  general_business_country: '',
  general_business_state: '',
  general_business_postal_code: '',
  general_vat_tin_bin: '',
  general_registration_certificate_url: '',

  // Which page_sections `page` discriminator the public home page renders
  // (see apps/admin/src/features/home-page-templates/registry.ts for the ids).
  general_home_template: 'home',
  // Per-template default color (hex), JSON-encoded map of template id →
  // color, set from the swatch on each card in /admin/content/home-templates.
  // Templates with no entry here fall back to the base purple palette.
  general_home_template_colors: JSON.stringify({ 'home-v1': '#10b981' }),

  // ─── Admin Dashboard Appearance & Localization ───────────────────────────
  // Admin-app-only — never applied to the student-facing web app.
  general_admin_accent_color: '#a64dff',
  // Controls display formatting only, inside the admin dashboard — dates
  // stay stored/transmitted as UTC everywhere else.
  general_timezone: 'Asia/Dhaka',
  general_date_format: 'dd_mmm_yyyy', // dd_mmm_yyyy | mm_dd_yyyy | dd_mm_yyyy | yyyy_mm_dd
  general_time_format: '12h', // 12h | 24h

  // ─── Invoice Template ─────────────────────────────────────────────────────
  invoice_company_name: 'Skillkoro',
  invoice_tagline: 'Online Learning Platform',
  invoice_logo_url: '',
  invoice_address: '',
  invoice_website: 'www.skillkoro.com',
  invoice_phone: '',
  invoice_email: '',
  invoice_footer_tagline: 'SkillKoro – Empowering You With Skills For A Better Tomorrow.',
  // JSON-encoded Record<templateId, StyleOverrides> — one override set per
  // template design, produced by the click-to-style editor at
  // /admin/invoice-settings/design.
  invoice_style_overrides: '{}',
  // Which template design (see admin templates/registry.ts ids) every
  // invoice renders with, site-wide.
  invoice_template: 'classic',

  // Payment gateway config (PayStation/bKash credentials, which gateway is
  // active) lives in the `payment_gateway_configs` table now — see
  // PaymentGatewayConfigsService — managed entirely from Admin → Settings →
  // Payments, not here.

  // Global Checkout payment-method logos image (shown in /checkout Payment Method card).
  // Empty = no image (admin can leave blank to hide).
  payment_checkout_image: '',

  // ─── Social Links ─────────────────────────────────────────────────────────
  social_facebook: '',
  social_youtube: '',
  social_whatsapp: '',
  social_instagram: '',
  social_linkedin: '',
  social_twitter: '',

  // ─── Footer ───────────────────────────────────────────────────────────────
  footer_site_name: 'LearnHub',
  footer_description: 'One of the leading online learning platforms, committed to making quality education accessible to everyone. 200+ expert-led courses across development, design, marketing, and more.',
  footer_address: '123 Learning Street, Dhaka, Bangladesh',
  footer_phone: '+880 1700-000000',
  footer_email: 'hello@learnhub.com',
  footer_students_count: '56K+',
  footer_courses_count: '200+',
  footer_copyright: '© 2024 LearnHub. All rights reserved.',

  // ─── Contact ──────────────────────────────────────────────────────────────
  contact_email: 'hello@skillkoro.com',
  contact_phone: '+880 1700-000000',
  contact_address: '123 Learning Street, Dhaka',
  contact_hours_days: 'Saturday – Thursday',
  contact_hours_time: '9:00 AM – 6:00 PM',

  // ─── About ────────────────────────────────────────────────────────────────
  about_stat_students: '56,000+',
  about_stat_courses: '200+',
  about_stat_countries: '50+',
  about_stat_success_rate: '98%',
  about_mission_text: 'To help every learner reach their fullest potential. We aim to make education easy, engaging, and effective through world-class courses, experienced instructors, and modern technology.',
  about_vision_text: 'To create a world where anyone, from anywhere, at any time, can access world-class courses. We want to remove barriers to education and create equal opportunities for all.',
  about_cta_title: 'Join Our Growing Community',
  about_cta_subtitle: 'Be part of 56,000+ learners transforming their careers with Skillkoro.',
  about_team_members: JSON.stringify([
    { name: 'Dr. Aminul Islam', role: 'Founder & CEO', desc: 'EdTech visionary with 15+ years in education technology.', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face' },
    { name: 'Fatima Rahman', role: 'Head of Curriculum', desc: 'Curriculum design expert, passionate about accessible education.', image: 'https://images.unsplash.com/photo-1494790108755-2616b332906c?w=200&h=200&fit=crop&crop=face' },
    { name: 'Rafiq Hassan', role: 'CTO', desc: 'Full-stack engineer building scalable learning platforms.', image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face' },
    { name: 'Nusrat Jahan', role: 'Head of Marketing', desc: 'Growth strategist connecting learners with opportunities.', image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face' },
  ]),

  // ─── FAQ ──────────────────────────────────────────────────────────────────
  faq_categories: JSON.stringify([
    {
      id: 'general', title: 'General',
      questions: [
        { q: 'What is Skillkoro?', a: 'Skillkoro is one of the leading online learning platforms, committed to making quality education accessible to everyone. We offer 200+ expert-led courses across development, design, marketing, and more.' },
        { q: 'How do I create an account?', a: "Click the 'Get Started' button at the top of the page. Fill in your name, email, and password to create a free account in under a minute." },
        { q: 'Is Skillkoro free?', a: 'We offer both free and paid courses. Our Basic plan gives you access to all free courses. Upgrade to Pro to unlock the full library, certificates, and priority support.' },
      ],
    },
    {
      id: 'courses', title: 'Courses & Learning',
      questions: [
        { q: 'Do I get lifetime access to courses?', a: 'Yes! Once enrolled in a course, you get lifetime access including all future updates. Study at your own pace and revisit the material whenever you need.' },
        { q: 'Are there certificates upon completion?', a: 'Absolutely. Every completed course earns you a verified digital certificate that you can download, share on LinkedIn, or add to your resume.' },
        { q: 'Can I access courses on mobile?', a: 'Yes, Skillkoro is fully responsive and works on all modern browsers on desktop, tablet, and mobile.' },
        { q: 'How long do I have to complete a course?', a: 'There are no deadlines. You can complete courses at your own pace. Most learners finish within 4–8 weeks while studying part-time.' },
      ],
    },
    {
      id: 'payment', title: 'Payment & Refund',
      questions: [
        { q: 'What payment methods do you accept?', a: 'We accept bKash, mobile banking, and all major credit/debit cards. All transactions are secured with 256-bit SSL encryption.' },
        { q: 'What is your refund policy?', a: 'We offer a 30-day, no-questions-asked money-back guarantee on all paid courses. Simply contact our support team within 30 days of purchase.' },
        { q: 'Can I use promo codes?', a: 'Yes! Enter your promo code at checkout to apply the discount. Follow us on social media and subscribe to our newsletter to receive exclusive offers.' },
      ],
    },
  ]),
};

@Injectable()
export class SystemSettingsService implements OnModuleInit {
  constructor(
    @Inject(DB_TOKEN) private readonly db: DB,
    private readonly revalidation: RevalidationService,
  ) { }

  async onModuleInit() {
    for (const [key, value] of Object.entries(DEFAULTS)) {
      const existing = await this.db
        .select()
        .from(systemSettings)
        .where(eq(systemSettings.key, key))
        .limit(1);

      if (!existing[0]) {
        await this.db.insert(systemSettings).values({ key, value });
      }
    }
  }

  // Read multiple settings by key list
  async getByKeys(keys: string[]): Promise<Record<string, string>> {
    const rows = await this.db
      .select()
      .from(systemSettings)
      .where(inArray(systemSettings.key, keys));

    return Object.fromEntries(
      rows.map((r) => [r.key, r.value ?? '']),
    );
  }

  // Read all settings (admin)
  async getAll(): Promise<Record<string, string>> {
    const rows = await this.db.select().from(systemSettings);
    return Object.fromEntries(rows.map((r) => [r.key, r.value ?? '']));
  }

  // Upsert a single setting (no cache purge — callers handle that in a batch).
  private async upsert(key: string, value: string): Promise<void> {
    const existing = await this.db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, key))
      .limit(1);

    if (existing[0]) {
      await this.db
        .update(systemSettings)
        .set({ value, updatedAt: new Date() })
        .where(eq(systemSettings.key, key));
    } else {
      await this.db.insert(systemSettings).values({ key, value });
    }
  }

  // Update a single setting
  async set(key: string, value: string): Promise<void> {
    await this.upsert(key, value);
    this.revalidation.revalidate(settingsKeysToTags([key]));
  }

  // Bulk update (for admin forms)
  async setMany(entries: Record<string, string>): Promise<void> {
    const keys = Object.keys(entries);
    for (const key of keys) {
      await this.upsert(key, entries[key]!);
    }
    // One batched purge for every public tag the written keys map to.
    this.revalidation.revalidate(settingsKeysToTags(keys));
  }
}
