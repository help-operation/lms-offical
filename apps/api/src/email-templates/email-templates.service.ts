import { BadRequestException, Inject, Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { eq } from 'drizzle-orm';
import * as nodemailer from 'nodemailer';
import type { DB } from 'src/db';
import { DB_TOKEN } from 'src/db/db.module';
import { emailTemplates } from 'src/db/schema';
import { SystemSettingsService } from 'src/system-settings/system-settings.service';

// ─── Default templates ────────────────────────────────────────────────────────

interface TemplateVariable { key: string; description: string }

interface DefaultTemplate {
  eventType: string;
  name: string;
  subject: string;
  htmlBody: string;
  variables: TemplateVariable[];
}

const ENROLLMENT_HTML = `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08)">
  <div style="background:linear-gradient(135deg,#a64dff,#bb6bff);padding:40px 36px;text-align:center">
    <h1 style="color:#fff;margin:0;font-size:26px;font-weight:800;letter-spacing:-0.5px">🎉 Enrollment Confirmed!</h1>
    <p style="color:rgba(255,255,255,.85);margin:10px 0 0;font-size:15px">You're officially in. Time to start learning.</p>
  </div>
  <div style="padding:36px">
    <p style="color:#374151;font-size:15px;margin:0 0 8px">Hi <strong>{{student_name}}</strong>,</p>
    <p style="color:#6b7280;font-size:14px;line-height:1.7;margin:0 0 24px">
      Great news — your enrollment in <strong style="color:#111827">{{course_title}}</strong> is confirmed.
      You now have full lifetime access to the course content. Start learning whenever you're ready!
    </p>
    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:20px 24px;margin-bottom:28px">
      <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:.5px">Course Details</p>
      <p style="margin:0;font-size:16px;font-weight:700;color:#111827">{{course_title}}</p>
    </div>
    <div style="text-align:center;margin-bottom:32px">
      <a href="{{course_url}}" style="display:inline-block;background:#a64dff;color:#fff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 36px;border-radius:10px">
        Start Learning →
      </a>
    </div>
    <p style="color:#9ca3af;font-size:13px;line-height:1.6;border-top:1px solid #e5e7eb;padding-top:20px;margin:0">
      If you have any questions, our support team is here to help.<br>
      — The <strong>{{site_name}}</strong> Team
    </p>
  </div>
</div>`;

const WELCOME_HTML = `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08)">
  <div style="background:linear-gradient(135deg,#a64dff,#bb6bff);padding:40px 36px;text-align:center">
    <h1 style="color:#fff;margin:0;font-size:26px;font-weight:800">👋 Welcome to {{site_name}}!</h1>
    <p style="color:rgba(255,255,255,.85);margin:10px 0 0;font-size:15px">Your learning journey starts now.</p>
  </div>
  <div style="padding:36px">
    <p style="color:#374151;font-size:15px;margin:0 0 8px">Hi <strong>{{student_name}}</strong>,</p>
    <p style="color:#6b7280;font-size:14px;line-height:1.7;margin:0 0 24px">
      Welcome aboard! Your account has been created and you're ready to start exploring hundreds of courses
      designed to help you grow your skills and advance your career.
    </p>
    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:20px 24px;margin-bottom:28px">
      <p style="margin:0 0 10px;font-size:13px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:.5px">Getting Started</p>
      <ul style="margin:0;padding:0 0 0 18px;color:#6b7280;font-size:14px;line-height:2">
        <li>Browse our course catalog</li>
        <li>Enroll in a course that interests you</li>
        <li>Learn at your own pace — no deadlines</li>
        <li>Earn certificates upon completion</li>
      </ul>
    </div>
    <div style="text-align:center;margin-bottom:32px">
      <a href="{{site_url}}/courses" style="display:inline-block;background:#a64dff;color:#fff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 36px;border-radius:10px">
        Browse Courses →
      </a>
    </div>
    <p style="color:#9ca3af;font-size:13px;line-height:1.6;border-top:1px solid #e5e7eb;padding-top:20px;margin:0">
      Happy learning! 🚀<br>— The <strong>{{site_name}}</strong> Team
    </p>
  </div>
</div>`;

const LIVE_ENROLLMENT_HTML = `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08)">
  <div style="background:linear-gradient(135deg,#a64dff,#bb6bff);padding:40px 36px;text-align:center">
    <h1 style="color:#fff;margin:0;font-size:26px;font-weight:800">✅ Live Course Enrollment Confirmed</h1>
    <p style="color:rgba(255,255,255,.85);margin:10px 0 0;font-size:15px">Your seat is reserved. See you in class!</p>
  </div>
  <div style="padding:36px">
    <p style="color:#374151;font-size:15px;margin:0 0 8px">Hi <strong>{{student_name}}</strong>,</p>
    <p style="color:#6b7280;font-size:14px;line-height:1.7;margin:0 0 24px">
      Your enrollment in the live course <strong style="color:#111827">{{course_title}}</strong> is confirmed. Here are your batch details:
    </p>
    <div style="background:#f5f0ff;border:1px solid #e6d9ff;border-radius:10px;padding:20px 24px;margin-bottom:28px">
      <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#a64dff;text-transform:uppercase;letter-spacing:.5px">Batch Details</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        <tr><td style="padding:4px 0;color:#6b7280;width:130px">Batch:</td><td style="color:#111827;font-weight:600">{{batch_name}}</td></tr>
        <tr><td style="padding:4px 0;color:#6b7280">Start Date:</td><td style="color:#111827;font-weight:600">{{batch_start_date}}</td></tr>
        <tr><td style="padding:4px 0;color:#6b7280">Schedule:</td><td style="color:#111827;font-weight:600">{{batch_schedule}}</td></tr>
      </table>
    </div>
    <p style="color:#9ca3af;font-size:13px;line-height:1.6;border-top:1px solid #e5e7eb;padding-top:20px;margin:0">
      We'll send reminders before each class. If you have questions, reach out to our support team.<br>
      — The <strong>{{site_name}}</strong> Team
    </p>
  </div>
</div>`;

const CERTIFICATE_HTML = `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08)">
  <div style="background:linear-gradient(135deg,#a64dff,#bb6bff);padding:40px 36px;text-align:center">
    <h1 style="color:#fff;margin:0;font-size:26px;font-weight:800;letter-spacing:-0.5px">🏆 Certificate Earned!</h1>
    <p style="color:rgba(255,255,255,.85);margin:10px 0 0;font-size:15px">Congratulations on completing your course.</p>
  </div>
  <div style="padding:36px">
    <p style="color:#374151;font-size:15px;margin:0 0 8px">Hi <strong>{{student_name}}</strong>,</p>
    <p style="color:#6b7280;font-size:14px;line-height:1.7;margin:0 0 24px">
      You've earned a certificate of completion for <strong style="color:#111827">{{course_title}}</strong>.
      Your achievement is now verifiable online — view, download, or share it any time.
    </p>
    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:20px 24px;margin-bottom:28px">
      <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:.5px">Certificate ID</p>
      <p style="margin:0;font-size:16px;font-weight:700;font-family:monospace;color:#a64dff">{{certificate_code}}</p>
    </div>
    <div style="text-align:center;margin-bottom:32px">
      <a href="{{certificate_url}}" style="display:inline-block;background:#a64dff;color:#fff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 36px;border-radius:10px">
        View Certificate →
      </a>
    </div>
    <p style="color:#9ca3af;font-size:13px;line-height:1.6;border-top:1px solid #e5e7eb;padding-top:20px;margin:0">
      Keep up the great work!<br>
      — The <strong>{{site_name}}</strong> Team
    </p>
  </div>
</div>`;

const EMAIL_LINKED_HTML = `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08)">
  <div style="background:linear-gradient(135deg,#a64dff,#bb6bff);padding:40px 36px;text-align:center">
    <h1 style="color:#fff;margin:0;font-size:26px;font-weight:800;letter-spacing:-0.5px">🔗 Email Linked</h1>
    <p style="color:rgba(255,255,255,.85);margin:10px 0 0;font-size:15px">This email is now connected to your account.</p>
  </div>
  <div style="padding:36px">
    <p style="color:#374151;font-size:15px;margin:0 0 8px">Hi <strong>{{student_name}}</strong>,</p>
    <p style="color:#6b7280;font-size:14px;line-height:1.7;margin:0 0 24px">
      This email address was just linked to your <strong style="color:#111827">{{site_name}}</strong> account.
      You can now sign in with it.
    </p>
    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:16px 20px;margin-bottom:28px">
      <p style="margin:0;font-size:13px;color:#991b1b;line-height:1.6">
        <strong>Didn't do this?</strong> If you didn't link this email, please contact our support team immediately.
      </p>
    </div>
    <p style="color:#9ca3af;font-size:13px;line-height:1.6;border-top:1px solid #e5e7eb;padding-top:20px;margin:0">
      — The <strong>{{site_name}}</strong> Team
    </p>
  </div>
</div>`;

// ── Transactional / system templates (migrated from MailService) ─────────────

const OTP_HTML = `
<div style="font-family:'Segoe UI',Arial,sans-serif;background:#f4f6fb;padding:32px 16px;color:#1a1a2e">
  <div style="max-width:480px;margin:0 auto">
    <div style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
      <div style="background:linear-gradient(135deg,#a64dff 0%,#bb6bff 100%);padding:36px 32px;text-align:center">
        <h1 style="color:#fff;font-size:24px;font-weight:800;letter-spacing:0.3px;margin:0">{{site_name}}</h1>
        <p style="color:rgba(255,255,255,0.85);font-size:14px;margin:6px 0 0">Verification Code</p>
      </div>
      <div style="padding:36px 32px;text-align:center">
        <p style="font-size:14px;line-height:1.7;color:#4b5563;margin:0 0 22px">
          Use the verification code below to continue. This code is valid for <strong>{{otp_ttl}} minutes</strong>.
        </p>
        <div style="display:inline-block;background:#f5f0ff;border:1px solid #e6d9ff;border-radius:12px;padding:18px 30px;margin:0 0 22px">
          <span style="font-size:34px;font-weight:800;letter-spacing:10px;color:#a64dff">{{otp_code}}</span>
        </div>
        <div style="background:#fff7ed;border-left:4px solid #f97316;border-radius:8px;padding:12px 16px;text-align:left">
          <p style="font-size:13px;color:#9a3412;line-height:1.6;margin:0">
            <strong>Do not share this code</strong> with anyone. {{site_name}} will never ask you for it.
          </p>
        </div>
      </div>
      <div style="background:#f9fafb;border-top:1px solid #f3f4f6;padding:20px 32px;text-align:center">
        <p style="font-size:12px;color:#9ca3af;line-height:1.6;margin:0">
          This is an automated message from <strong style="color:#6b7280">{{site_name}}</strong>. Please do not reply.
        </p>
      </div>
    </div>
  </div>
</div>`;

const PASSWORD_RESET_HTML = `
<div style="font-family:'Segoe UI',Arial,sans-serif;background:#f4f6fb;padding:32px 16px;color:#1a1a2e">
  <div style="max-width:560px;margin:0 auto">
    <div style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
      <div style="background:linear-gradient(135deg,#a64dff 0%,#bb6bff 100%);padding:36px 32px;text-align:center">
        <div style="display:inline-flex;align-items:center;justify-content:center;width:64px;height:64px;background:rgba(255,255,255,0.2);border-radius:50%;margin-bottom:16px">
          <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        </div>
        <h1 style="color:#fff;font-size:22px;font-weight:700;letter-spacing:0.3px;margin:0">Password Reset</h1>
        <p style="color:rgba(255,255,255,0.85);font-size:14px;margin:6px 0 0">{{site_name}}</p>
      </div>
      <div style="padding:36px 32px">
        <p style="font-size:16px;font-weight:600;margin:0 0 16px;color:#1a1a2e">Dear {{user_name}},</p>
        <p style="font-size:14px;line-height:1.7;color:#4b5563;margin:0 0 16px">
          We received a request to reset the password for your account. Click the button below to set a new password.
        </p>
        <div style="text-align:center;margin:32px 0">
          <a href="{{reset_url}}" style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#a64dff 0%,#bb6bff 100%);color:#fff;text-decoration:none;border-radius:10px;font-size:15px;font-weight:700;letter-spacing:0.3px;box-shadow:0 4px 14px rgba(166,77,255,0.4)">🔐 Set New Password</a>
        </div>
        <div style="background:#fff7ed;border-left:4px solid #f97316;border-radius:8px;padding:14px 16px;margin:24px 0">
          <p style="font-size:13px;color:#9a3412;line-height:1.6;margin:0">
            <strong>⚠️ Warning:</strong> This link is only valid for <strong>15 minutes</strong>. After that, the link will expire.
          </p>
        </div>
        <div style="height:1px;background:#f3f4f6;margin:24px 0"></div>
        <p style="font-size:14px;line-height:1.7;color:#4b5563;margin:0">
          If you did not request a password reset, please ignore this email. Your password will not be changed.
        </p>
        <p style="margin:8px 0 0;font-size:13px;color:#9ca3af">If the button doesn't work, copy and paste the link below into your browser:</p>
        <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:12px 14px;margin-top:12px;word-break:break-all;font-size:12px;color:#6b7280">{{reset_url}}</div>
      </div>
      <div style="background:#f9fafb;border-top:1px solid #f3f4f6;padding:24px 32px;text-align:center">
        <p style="font-size:12px;color:#9ca3af;line-height:1.6;margin:0">
          This email was sent automatically by <strong style="color:#6b7280">{{site_name}}</strong>.<br/>Please do not reply to this email.
        </p>
      </div>
    </div>
  </div>
</div>`;

const CONTACT_NOTIFICATION_HTML = `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
  <div style="background:linear-gradient(135deg,#a64dff,#bb6bff);padding:24px 28px">
    <h2 style="color:white;margin:0;font-size:20px;font-weight:800">New Contact Message</h2>
  </div>
  <div style="padding:24px 28px">
    <table style="width:100%;border-collapse:collapse">
      <tr><td style="padding:8px 0;color:#6b7280;width:100px">Name</td><td style="padding:8px 0;font-weight:600">{{contact_name}}</td></tr>
      <tr><td style="padding:8px 0;color:#6b7280">Email</td><td style="padding:8px 0"><a href="mailto:{{contact_email}}" style="color:#a64dff">{{contact_email}}</a></td></tr>
      <tr><td style="padding:8px 0;color:#6b7280">Subject</td><td style="padding:8px 0">{{contact_subject}}</td></tr>
    </table>
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0"/>
    <p style="color:#374151;line-height:1.6;white-space:pre-wrap">{{contact_message}}</p>
  </div>
  <div style="background:#f9fafb;padding:12px 28px;font-size:12px;color:#9ca3af">
    You can reply directly to this email to respond to {{contact_name}}.
  </div>
</div>`;

const INSTRUCTOR_APPROVED_HTML = `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
  <div style="background:linear-gradient(135deg,#a64dff,#bb6bff);padding:28px">
    <h2 style="color:white;margin:0;font-size:20px;font-weight:800">Welcome to {{site_name}}, {{instructor_name}}!</h2>
  </div>
  <div style="padding:24px 28px">
    <p>Congratulations! Your instructor application has been <strong>approved</strong>.</p>
    <p>Here are your login credentials for the admin panel:</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0">
      <tr><td style="padding:8px 0;color:#6b7280;width:120px">Email</td><td style="font-weight:600">{{login_email}}</td></tr>
      <tr><td style="padding:8px 0;color:#6b7280">Password</td><td style="font-weight:600;font-family:monospace;background:#f3f4f6;padding:4px 8px;border-radius:4px">{{temp_password}}</td></tr>
    </table>
    <p><strong>Please change your password after your first login.</strong></p>
    <a href="{{admin_url}}" style="display:inline-block;background:#a64dff;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:8px">Login to Admin Panel</a>
  </div>
</div>`;

const INSTRUCTOR_REJECTED_HTML = `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
  <div style="background:#6b7280;padding:24px 28px">
    <h2 style="color:white;margin:0;font-size:20px;font-weight:700">Application Update</h2>
  </div>
  <div style="padding:24px 28px">
    <p>Dear {{instructor_name}},</p>
    <p>Thank you for applying to become an instructor at {{site_name}}. After careful review, we are unable to move forward with your application at this time.</p>
    <p style="background:#f9fafb;padding:12px;border-left:4px solid #d1d5db;border-radius:4px">{{rejection_reason}}</p>
    <p>We encourage you to reapply in the future. Thank you for your interest.</p>
  </div>
</div>`;

const ACCOUNT_CREDENTIALS_HTML = `
<div style="font-family:'Segoe UI',Arial,sans-serif;background:#f4f6fb;padding:32px 16px;color:#1a1a2e">
  <div style="max-width:480px;margin:0 auto">
    <div style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
      <div style="background:linear-gradient(135deg,#a64dff 0%,#bb6bff 100%);padding:36px 32px;text-align:center">
        <h1 style="color:#fff;font-size:24px;font-weight:800;margin:0">{{site_name}}</h1>
        <p style="color:rgba(255,255,255,0.85);font-size:14px;margin:6px 0 0">Your account is ready</p>
      </div>
      <div style="padding:36px 32px">
        <p style="font-size:15px;color:#374151;margin:0 0 16px">Hi <strong>{{student_name}}</strong>,</p>
        <p style="font-size:14px;line-height:1.7;color:#4b5563;margin:0 0 20px">
          An account has been created for you on {{site_name}}. Use the details below to log in,
          then change your password from your profile.
        </p>
        <div style="background:#f5f0ff;border:1px solid #e6d9ff;border-radius:12px;padding:18px 20px;margin:0 0 20px">
          <p style="margin:0 0 5px;font-size:12px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.5px">Login ID</p>
          <p style="margin:0 0 4px;font-size:16px;font-weight:700;color:#111827;background:#fff;border:1px solid #e6d9ff;border-radius:8px;padding:10px 14px;cursor:text;user-select:all;-webkit-user-select:all;-moz-user-select:all">{{login_id}}</p>
          <p style="margin:0 0 18px;font-size:11px;color:#9ca3af">&#128070; Click to select &mdash; then Ctrl+C / Cmd+C to copy</p>
          <p style="margin:0 0 5px;font-size:12px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.5px">Temporary Password</p>
          <p style="margin:0 0 4px;font-size:20px;font-weight:800;letter-spacing:3px;color:#a64dff;font-family:monospace;background:#fff;border:1px solid #e6d9ff;border-radius:8px;padding:10px 14px;cursor:text;user-select:all;-webkit-user-select:all;-moz-user-select:all">{{temp_password}}</p>
          <p style="margin:0;font-size:11px;color:#9ca3af">&#128070; Click to select &mdash; then Ctrl+C / Cmd+C to copy</p>
        </div>
        <div style="text-align:center;margin:24px 0">
          <a href="{{login_url}}" style="display:inline-block;padding:13px 34px;background:linear-gradient(135deg,#a64dff 0%,#bb6bff 100%);color:#fff;text-decoration:none;border-radius:10px;font-size:15px;font-weight:700">Log in</a>
        </div>
        <p style="font-size:12px;color:#9ca3af;line-height:1.6;margin:0">
          For your security, please change this temporary password after your first login.
        </p>
      </div>
    </div>
  </div>
</div>`;

// ─── Support templates ────────────────────────────────────────────────────────

const SUPPORT_TICKET_CREATED_HTML = `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08)">
  <div style="background:linear-gradient(135deg,#a64dff,#bb6bff);padding:40px 36px;text-align:center">
    <h1 style="color:#fff;margin:0;font-size:26px;font-weight:800">✅ We Got Your Request</h1>
    <p style="color:rgba(255,255,255,.85);margin:10px 0 0;font-size:15px">Your support ticket has been received.</p>
  </div>
  <div style="padding:36px">
    <p style="color:#374151;font-size:15px;margin:0 0 8px">Hi <strong>{{student_name}}</strong>,</p>
    <p style="color:#6b7280;font-size:14px;line-height:1.7;margin:0 0 24px">
      Thanks for reaching out. We've received your support request and our team will get back to you
      <strong>within 24 hours</strong> during business hours (Sat–Thu, 10 AM – 6 PM).
    </p>
    <div style="background:#f5f0ff;border:1px solid #e6d9ff;border-radius:10px;padding:20px 24px;margin-bottom:28px">
      <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#a64dff;text-transform:uppercase;letter-spacing:.5px">Ticket Details</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        <tr><td style="padding:4px 0;color:#6b7280;width:90px">Ticket ID:</td><td style="color:#111827;font-weight:700">#{{ticket_id}}</td></tr>
        <tr><td style="padding:4px 0;color:#6b7280">Subject:</td><td style="color:#111827;font-weight:600">{{subject}}</td></tr>
        <tr><td style="padding:4px 0;color:#6b7280">Category:</td><td style="color:#111827">{{category}}</td></tr>
      </table>
    </div>
    <div style="text-align:center;margin-bottom:32px">
      <a href="{{ticket_url}}" style="display:inline-block;background:#a64dff;color:#fff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 36px;border-radius:10px">
        View My Ticket →
      </a>
    </div>
    <p style="color:#9ca3af;font-size:13px;line-height:1.6;border-top:1px solid #e5e7eb;padding-top:20px;margin:0">
      You can reply directly to this email or log in to your dashboard to add more details.<br>
      — The <strong>{{site_name}}</strong> Support Team
    </p>
  </div>
</div>`;

const SUPPORT_TICKET_REPLY_HTML = `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08)">
  <div style="background:linear-gradient(135deg,#a64dff,#bb6bff);padding:40px 36px;text-align:center">
    <h1 style="color:#fff;margin:0;font-size:26px;font-weight:800">💬 New Reply on Your Ticket</h1>
    <p style="color:rgba(255,255,255,.85);margin:10px 0 0;font-size:15px">Our support team has responded.</p>
  </div>
  <div style="padding:36px">
    <p style="color:#374151;font-size:15px;margin:0 0 8px">Hi <strong>{{student_name}}</strong>,</p>
    <p style="color:#6b7280;font-size:14px;line-height:1.7;margin:0 0 20px">
      Our support team has replied to your ticket <strong style="color:#111827">{{subject}}</strong> (Ticket #{{ticket_id}}).
    </p>
    <div style="background:#f9fafb;border-left:4px solid #a64dff;border-radius:0 10px 10px 0;padding:16px 20px;margin-bottom:28px">
      <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:#a64dff;text-transform:uppercase;letter-spacing:.5px">Support Reply</p>
      <p style="margin:0;font-size:14px;color:#374151;line-height:1.7">{{reply_preview}}</p>
    </div>
    <div style="text-align:center;margin-bottom:32px">
      <a href="{{ticket_url}}" style="display:inline-block;background:#a64dff;color:#fff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 36px;border-radius:10px">
        View Full Conversation →
      </a>
    </div>
    <p style="color:#9ca3af;font-size:13px;line-height:1.6;border-top:1px solid #e5e7eb;padding-top:20px;margin:0">
      If your issue is resolved, you can close the ticket from your dashboard.<br>
      — The <strong>{{site_name}}</strong> Support Team
    </p>
  </div>
</div>`;

const SUPPORT_TICKET_STATUS_HTML = `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08)">
  <div style="background:linear-gradient(135deg,#a64dff,#bb6bff);padding:40px 36px;text-align:center">
    <h1 style="color:#fff;margin:0;font-size:26px;font-weight:800">🔄 Ticket Status Updated</h1>
    <p style="color:rgba(255,255,255,.85);margin:10px 0 0;font-size:15px">Your support request has a new status.</p>
  </div>
  <div style="padding:36px">
    <p style="color:#374151;font-size:15px;margin:0 0 8px">Hi <strong>{{student_name}}</strong>,</p>
    <p style="color:#6b7280;font-size:14px;line-height:1.7;margin:0 0 24px">
      The status of your ticket <strong style="color:#111827">{{subject}}</strong> (Ticket #{{ticket_id}}) has been updated.
    </p>
    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:20px 24px;margin-bottom:28px">
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        <tr>
          <td style="padding:6px 0;color:#6b7280;width:110px">Previous Status:</td>
          <td style="color:#6b7280;font-weight:600;text-transform:capitalize">{{old_status}}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#6b7280">New Status:</td>
          <td style="color:#a64dff;font-weight:700;text-transform:capitalize">{{new_status}}</td>
        </tr>
      </table>
    </div>
    <div style="text-align:center;margin-bottom:32px">
      <a href="{{ticket_url}}" style="display:inline-block;background:#a64dff;color:#fff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 36px;border-radius:10px">
        View Ticket →
      </a>
    </div>
    <p style="color:#9ca3af;font-size:13px;line-height:1.6;border-top:1px solid #e5e7eb;padding-top:20px;margin:0">
      — The <strong>{{site_name}}</strong> Support Team
    </p>
  </div>
</div>`;

const DEFAULTS: DefaultTemplate[] = [
  {
    eventType: 'enrollment_confirmation',
    name:      'Enrollment Confirmation',
    subject:   '🎉 You\'re enrolled in {{course_title}}!',
    htmlBody:  ENROLLMENT_HTML,
    variables: [
      { key: '{{student_name}}', description: 'Student\'s full name' },
      { key: '{{course_title}}', description: 'Title of the enrolled course' },
      { key: '{{course_url}}',   description: 'Direct link to the course' },
      { key: '{{site_name}}',    description: 'Platform name from General Settings' },
    ],
  },
  {
    eventType: 'welcome',
    name:      'Welcome Email',
    subject:   'Welcome to {{site_name}}! 👋',
    htmlBody:  WELCOME_HTML,
    variables: [
      { key: '{{student_name}}', description: 'Student\'s full name' },
      { key: '{{site_name}}',    description: 'Platform name from General Settings' },
      { key: '{{site_url}}',     description: 'Frontend URL of the platform' },
    ],
  },
  {
    eventType: 'certificate_issued',
    name:      'Certificate Issued',
    subject:   '🏆 Your certificate for {{course_title}} is ready!',
    htmlBody:  CERTIFICATE_HTML,
    variables: [
      { key: '{{student_name}}',     description: 'Student\'s full name' },
      { key: '{{course_title}}',     description: 'Title of the completed course' },
      { key: '{{certificate_code}}', description: 'Unique verification code (prefix derived from site name)' },
      { key: '{{certificate_url}}',  description: 'Public link to view/download the certificate' },
      { key: '{{site_name}}',        description: 'Platform name from General Settings' },
    ],
  },
  {
    eventType: 'email_linked',
    name:      'Email Linked',
    subject:   'Your {{site_name}} account email was just linked',
    htmlBody:  EMAIL_LINKED_HTML,
    variables: [
      { key: '{{student_name}}', description: 'User\'s full name' },
      { key: '{{site_name}}',    description: 'Platform name from General Settings' },
    ],
  },
  {
    eventType: 'live_enrollment_confirmation',
    name:      'Live Course Enrollment',
    subject:   '✅ Live Course Confirmed — {{course_title}} ({{batch_name}})',
    htmlBody:  LIVE_ENROLLMENT_HTML,
    variables: [
      { key: '{{student_name}}',    description: 'Student\'s full name' },
      { key: '{{course_title}}',    description: 'Live course title' },
      { key: '{{batch_name}}',      description: 'Batch name (e.g. Batch 2)' },
      { key: '{{batch_start_date}}', description: 'Batch start date' },
      { key: '{{batch_schedule}}',  description: 'Class schedule (days/time)' },
      { key: '{{site_name}}',       description: 'Platform name from General Settings' },
    ],
  },
  {
    eventType: 'otp_verification',
    name:      'Verification Code (OTP)',
    subject:   'Your {{site_name}} verification code',
    htmlBody:  OTP_HTML,
    variables: [
      { key: '{{otp_code}}',  description: 'The numeric verification code' },
      { key: '{{otp_ttl}}',   description: 'Minutes the code stays valid' },
      { key: '{{site_name}}', description: 'Platform name' },
    ],
  },
  {
    eventType: 'password_reset',
    name:      'Password Reset',
    subject:   'Reset your {{site_name}} password',
    htmlBody:  PASSWORD_RESET_HTML,
    variables: [
      { key: '{{user_name}}', description: 'Recipient\'s name' },
      { key: '{{reset_url}}', description: 'Single-use password reset link' },
      { key: '{{site_name}}', description: 'Platform name' },
    ],
  },
  {
    eventType: 'contact_notification',
    name:      'Contact Message Notification',
    subject:   'New Contact Message: {{contact_subject}}',
    htmlBody:  CONTACT_NOTIFICATION_HTML,
    variables: [
      { key: '{{contact_name}}',    description: 'Sender\'s name' },
      { key: '{{contact_email}}',   description: 'Sender\'s email address' },
      { key: '{{contact_subject}}', description: 'Message subject' },
      { key: '{{contact_message}}', description: 'Message body' },
    ],
  },
  {
    eventType: 'instructor_approved',
    name:      'Instructor Application Approved',
    subject:   '🎉 Your {{site_name}} Instructor Application is Approved!',
    htmlBody:  INSTRUCTOR_APPROVED_HTML,
    variables: [
      { key: '{{instructor_name}}', description: 'Approved instructor\'s name' },
      { key: '{{login_email}}',     description: 'Admin panel login email' },
      { key: '{{temp_password}}',   description: 'Temporary password to first log in' },
      { key: '{{admin_url}}',       description: 'Admin panel URL' },
      { key: '{{site_name}}',       description: 'Platform name' },
    ],
  },
  {
    eventType: 'instructor_rejected',
    name:      'Instructor Application Rejected',
    subject:   'Update on your {{site_name}} Instructor Application',
    htmlBody:  INSTRUCTOR_REJECTED_HTML,
    variables: [
      { key: '{{instructor_name}}',  description: 'Applicant\'s name' },
      { key: '{{rejection_reason}}', description: 'Reviewer notes / reason (optional)' },
      { key: '{{site_name}}',        description: 'Platform name' },
    ],
  },
  {
    eventType: 'account_credentials',
    name:      'New Account Credentials',
    subject:   'Your {{site_name}} account is ready',
    htmlBody:  ACCOUNT_CREDENTIALS_HTML,
    variables: [
      { key: '{{student_name}}',  description: 'New user\'s name' },
      { key: '{{login_id}}',      description: 'Email or phone used to log in' },
      { key: '{{temp_password}}', description: 'Temporary password to first log in' },
      { key: '{{login_url}}',     description: 'Login page URL' },
      { key: '{{site_name}}',     description: 'Platform name' },
    ],
  },
  // ── Support ──────────────────────────────────────────────────────────────────
  {
    eventType: 'support_ticket_created',
    name:      'Support Ticket Received (Auto-Reply)',
    subject:   '[Ticket #{{ticket_id}}] We received your support request',
    htmlBody:  SUPPORT_TICKET_CREATED_HTML,
    variables: [
      { key: '{{student_name}}', description: 'Student\'s first name' },
      { key: '{{ticket_id}}',    description: 'Numeric ticket ID' },
      { key: '{{subject}}',      description: 'Ticket subject' },
      { key: '{{category}}',     description: 'Human-readable category label' },
      { key: '{{ticket_url}}',   description: 'Direct link to view the ticket' },
      { key: '{{site_name}}',    description: 'Platform name' },
    ],
  },
  {
    eventType: 'support_ticket_reply',
    name:      'Support Ticket Reply',
    subject:   '[Ticket #{{ticket_id}}] New reply on "{{subject}}"',
    htmlBody:  SUPPORT_TICKET_REPLY_HTML,
    variables: [
      { key: '{{student_name}}',  description: 'Student\'s first name' },
      { key: '{{ticket_id}}',     description: 'Numeric ticket ID' },
      { key: '{{subject}}',       description: 'Ticket subject' },
      { key: '{{reply_preview}}', description: 'First 200 chars of the reply' },
      { key: '{{ticket_url}}',    description: 'Direct link to view the ticket' },
      { key: '{{site_name}}',     description: 'Platform name' },
    ],
  },
  {
    eventType: 'support_ticket_status_changed',
    name:      'Support Ticket Status Update',
    subject:   '[Ticket #{{ticket_id}}] Status updated to {{new_status}}',
    htmlBody:  SUPPORT_TICKET_STATUS_HTML,
    variables: [
      { key: '{{student_name}}', description: 'Student\'s first name' },
      { key: '{{ticket_id}}',    description: 'Numeric ticket ID' },
      { key: '{{subject}}',      description: 'Ticket subject' },
      { key: '{{old_status}}',   description: 'Previous status label' },
      { key: '{{new_status}}',   description: 'New status label' },
      { key: '{{ticket_url}}',   description: 'Direct link to view the ticket' },
      { key: '{{site_name}}',    description: 'Platform name' },
    ],
  },
];

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class EmailTemplatesService implements OnModuleInit {
  private readonly logger = new Logger(EmailTemplatesService.name);

  constructor(
    @Inject(DB_TOKEN) private readonly db: DB,
    private readonly config: ConfigService,
    private readonly systemSettings: SystemSettingsService,
  ) {}

  // Live site name/tagline from General Settings — always wins over any
  // site_name/tagline a caller passes in `vars`, so admin edits apply
  // everywhere without touching every call site.
  private async brandVars(): Promise<{ site_name: string; tagline: string }> {
    const { general_site_name, general_tagline } = await this.systemSettings.getByKeys([
      'general_site_name',
      'general_tagline',
    ]);
    return {
      site_name: general_site_name || 'Skillkoro',
      tagline: general_tagline || 'Learn. Grow. Succeed.',
    };
  }

  // ── Init: seed default templates ──────────────────────────────────────────

  // Legacy accent colors used by the pre-rebrand default templates. A stored
  // template still containing any of these is an untouched/old-branded default,
  // so it's safe to refresh to the current brand-purple defaults. Once refreshed
  // (htmlBody no longer contains these), this is skipped — making it idempotent.
  private static readonly LEGACY_BRAND_MARKERS = ['#7c3aed', '#9f67ff', '#dc2626'];

  // System emails that must always be deliverable — they cannot be disabled in
  // the admin UI (disabling OTP/reset would lock users out of auth flows) and
  // dispatch() ignores the isEnabled flag for them.
  static readonly CRITICAL_EVENTS = new Set(['otp_verification', 'password_reset']);

  async onModuleInit() {
    for (const tpl of DEFAULTS) {
      const [existing] = await this.db
        .select({ id: emailTemplates.id, htmlBody: emailTemplates.htmlBody })
        .from(emailTemplates)
        .where(eq(emailTemplates.eventType, tpl.eventType))
        .limit(1);

      if (!existing) {
        await this.db.insert(emailTemplates).values({
          eventType: tpl.eventType,
          name:      tpl.name,
          subject:   tpl.subject,
          htmlBody:  tpl.htmlBody,
          variables: JSON.stringify(tpl.variables),
        });
        continue;
      }

      // One-time rebrand: refresh only templates still on the legacy palette.
      const isLegacy = EmailTemplatesService.LEGACY_BRAND_MARKERS.some((m) =>
        existing.htmlBody.includes(m),
      );
      if (isLegacy) {
        await this.db
          .update(emailTemplates)
          .set({ subject: tpl.subject, htmlBody: tpl.htmlBody, updatedAt: new Date() })
          .where(eq(emailTemplates.id, existing.id));
        this.logger.log(`Rebranded default template "${tpl.eventType}" to brand purple`);
      }
    }
  }

  // ── CRUD ──────────────────────────────────────────────────────────────────

  async findAll() {
    return this.db
      .select()
      .from(emailTemplates)
      .orderBy(emailTemplates.id);
  }

  async findByEvent(eventType: string) {
    const [tpl] = await this.db
      .select()
      .from(emailTemplates)
      .where(eq(emailTemplates.eventType, eventType))
      .limit(1);

    if (!tpl) throw new NotFoundException(`Template "${eventType}" not found`);
    return tpl;
  }

  async update(eventType: string, data: { subject?: string; htmlBody?: string }) {
    const existing = await this.findByEvent(eventType);
    const [updated] = await this.db
      .update(emailTemplates)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(emailTemplates.id, existing.id))
      .returning();
    return updated;
  }

  async toggle(eventType: string) {
    if (EmailTemplatesService.CRITICAL_EVENTS.has(eventType)) {
      throw new BadRequestException(
        `"${eventType}" is a required system email and cannot be disabled.`,
      );
    }
    const existing = await this.findByEvent(eventType);
    const [updated] = await this.db
      .update(emailTemplates)
      .set({ isEnabled: !existing.isEnabled, updatedAt: new Date() })
      .where(eq(emailTemplates.id, existing.id))
      .returning();
    return updated;
  }

  // ── Rendering ─────────────────────────────────────────────────────────────

  render(template: { subject: string; htmlBody: string }, vars: Record<string, string>) {
    let subject  = template.subject;
    let htmlBody = template.htmlBody;
    for (const [key, value] of Object.entries(vars)) {
      const placeholder = `{{${key}}}`;
      subject  = subject.replaceAll(placeholder, value);
      htmlBody = htmlBody.replaceAll(placeholder, value);
    }
    return { subject, htmlBody };
  }

  // ── Sending ───────────────────────────────────────────────────────────────

  private transporter() {
    const user = this.config.get<string>('EMAIL_USER');
    const pass = this.config.get<string>('EMAIL_PASS');
    if (!user || !pass) return null;

    const host = this.config.get<string>('EMAIL_HOST') ?? 'smtp.hostinger.com';
    const port = Number(this.config.get<string>('EMAIL_PORT') ?? 465);
    // 465 → implicit SSL (secure); 587 → STARTTLS (not secure on connect)
    const secure = port === 465;

    return nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    });
  }

  async send(eventType: string, to: string, vars: Record<string, string>): Promise<void> {
    // Silently skip if template is disabled or if no email address
    if (!to || !to.includes('@')) return;

    let tpl: Awaited<ReturnType<typeof this.findByEvent>>;
    try {
      tpl = await this.findByEvent(eventType);
    } catch {
      this.logger.warn(`Template "${eventType}" not found — skipping`);
      return;
    }

    if (!tpl.isEnabled) {
      this.logger.log(`Template "${eventType}" is disabled — skipping`);
      return;
    }

    const brand = await this.brandVars();
    const { subject, htmlBody } = this.render(
      { subject: tpl.subject, htmlBody: tpl.htmlBody },
      { ...vars, ...brand },
    );

    const transporter = this.transporter();
    const from = this.config.get<string>('EMAIL_USER');

    if (!transporter) {
      this.logger.warn(`EMAIL_USER/PASS not set — would send "${subject}" to ${to}`);
      return;
    }

    try {
      await transporter.sendMail({ from: `"${brand.site_name}" <${from}>`, to, subject, html: htmlBody });
      this.logger.log(`"${eventType}" sent to ${to}`);
    } catch (err) {
      // Non-fatal: log but don't throw — enrollment should succeed even if email fails
      this.logger.error(`Failed to send "${eventType}" to ${to}`, err as Error);
    }
  }

  /**
   * Render + send a DB template, rethrowing on SMTP failure. Used by the
   * MailService facade for transactional emails whose failures must surface to
   * the caller (e.g. OTP). Critical events (OTP, password reset) always send,
   * even if the template was somehow disabled. Returns whether mail went out
   * (false in dev when SMTP isn't configured — mirrors the old dev fallback).
   */
  async dispatch(
    eventType: string,
    to: string,
    vars: Record<string, string>,
    opts: { replyTo?: string; subjectPrefix?: string } = {},
  ): Promise<{ sent: boolean }> {
    if (!to || !to.includes('@')) return { sent: false };

    const tpl = await this.findByEvent(eventType); // throws NotFound if missing

    const isCritical = EmailTemplatesService.CRITICAL_EVENTS.has(eventType);
    if (!tpl.isEnabled && !isCritical) {
      this.logger.log(`Template "${eventType}" is disabled — skipping`);
      return { sent: false };
    }

    const brand = await this.brandVars();
    const rendered = this.render({ subject: tpl.subject, htmlBody: tpl.htmlBody }, { ...vars, ...brand });
    const subject = opts.subjectPrefix ? `${opts.subjectPrefix}${rendered.subject}` : rendered.subject;

    const transporter = this.transporter();
    const from = this.config.get<string>('EMAIL_USER');

    if (!transporter) {
      this.logger.warn(`EMAIL not configured — would send "${eventType}" to ${to}`);
      return { sent: false };
    }

    await transporter.sendMail({
      from: `"${brand.site_name}" <${from}>`,
      to,
      subject,
      html: rendered.htmlBody,
      ...(opts.replyTo ? { replyTo: opts.replyTo } : {}),
    });
    this.logger.log(`"${eventType}" dispatched to ${to}`);
    return { sent: true };
  }

/**
   * A pooled transporter (persistent SMTP connections, reused across sends)
   * plus resolved from/brand info — for high-volume manual broadcasts where
   * opening a fresh connection per recipient would be far too slow. Caller
   * must call `.transporter.close()` when done.
   */
  async createBulkMailer(): Promise<{ transporter: nodemailer.Transporter; from: string } | null> {
    const user = this.config.get<string>('EMAIL_USER');
    const pass = this.config.get<string>('EMAIL_PASS');
    if (!user || !pass) return null;

    const host = this.config.get<string>('EMAIL_HOST') ?? 'smtp.hostinger.com';
    const port = Number(this.config.get<string>('EMAIL_PORT') ?? 465);
    const secure = port === 465;

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
      pool: true,
      maxConnections: 5,
      maxMessages: 200,
    });

    const brand = await this.brandVars();
    return { transporter, from: `"${brand.site_name}" <${user}>` };
  }

  /**
   * Sends an ad-hoc (non-template) HTML email — used for one-off manual
   * sends. Returns whether it was actually sent (false if SMTP isn't
   * configured or delivery failed; failures are logged, not thrown). For
   * bulk sends to many recipients, use `createBulkMailer()` instead so
   * connections are pooled rather than opened per email.
   */
  async sendManual(to: string, subject: string, html: string): Promise<boolean> {
    if (!to || !to.includes('@')) return false;

    const brand = await this.brandVars();
    const transporter = this.transporter();
    const from = this.config.get<string>('EMAIL_USER');

    if (!transporter) {
      this.logger.warn(`EMAIL_USER/PASS not set — would send "${subject}" to ${to}`);
      return false;
    }

    try {
      await transporter.sendMail({ from: `"${brand.site_name}" <${from}>`, to, subject, html });
      this.logger.log(`Manual email "${subject}" sent to ${to}`);
      return true;
    } catch (err) {
      this.logger.error(`Failed to send manual email to ${to}`, err as Error);
      return false;
    }
  }

  async sendTest(eventType: string, toEmail: string): Promise<{ sent: boolean }> {
    const tpl = await this.findByEvent(eventType);
    const brand = await this.brandVars();
    const sampleVars: Record<string, string> = {
      student_name:     'Test Student',
      course_title:     'Sample Course Title',
      course_url:       'https://example.com/courses/sample',
      site_name:        brand.site_name,
      site_url:         'https://example.com',
      batch_name:       'Batch 1',
      batch_start_date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }),
      batch_schedule:   'Sat & Sun, 10:00 AM – 12:00 PM',
      // Transactional / system template samples
      otp_code:         '1043',
      otp_ttl:          '5',
      user_name:        'Test User',
      reset_url:        'https://example.com/reset?token=sample-token',
      contact_name:     'Jane Doe',
      contact_email:    'jane@example.com',
      contact_subject:  'Question about a course',
      contact_message:  'Hi, I would like to know more about your live courses.',
      instructor_name:  'Test Instructor',
      login_email:      toEmail,
      temp_password:    'Temp@1234',
      admin_url:        'https://example.com/admin',
      rejection_reason: 'Your application did not meet our current requirements.',
    };

    const { subject, htmlBody } = this.render(
      { subject: tpl.subject, htmlBody: tpl.htmlBody },
      sampleVars,
    );

    const transporter = this.transporter();
    const from = this.config.get<string>('EMAIL_USER');

    if (!transporter) {
      this.logger.warn(`Test email would be sent to ${toEmail} (EMAIL_USER/PASS not set)`);
      return { sent: false };
    }

    await transporter.sendMail({
      from:    `"${brand.site_name}" <${from}>`,
      to:      toEmail,
      subject: `[TEST] ${subject}`,
      html:    htmlBody,
    });
    this.logger.log(`Test "${eventType}" sent to ${toEmail}`);
    return { sent: true };
  }
}
