export interface TemplateVariable {
  key: string;
  description: string;
}

export interface EmailTemplate {
  id: number;
  eventType: string;
  name: string;
  subject: string;
  htmlBody: string;
  isEnabled: boolean;
  variables: string; // JSON string: TemplateVariable[]
  createdAt: string | null;
  updatedAt: string | null;
}

export const EVENT_META: Record<
  string,
  { description: string; icon: string; color: string; critical?: boolean }
> = {
  enrollment_confirmation: {
    description: "Sent to a student immediately after they successfully enroll in a course.",
    icon: "🎓",
    color: "bg-violet-100 text-violet-700",
  },
  welcome: {
    description: "Sent when a new user registers an account on the platform.",
    icon: "👋",
    color: "bg-blue-100 text-blue-700",
  },
  live_enrollment_confirmation: {
    description: "Sent after a student successfully enrolls in a live course batch.",
    icon: "📡",
    color: "bg-red-100 text-red-700",
  },
  certificate_issued: {
    description: "Sent when a student earns a certificate after completing a course.",
    icon: "🏆",
    color: "bg-amber-100 text-amber-700",
  },
  email_linked: {
    description: "Sent when a new email address is linked to a user's account.",
    icon: "🔗",
    color: "bg-emerald-100 text-emerald-700",
  },
  otp_verification: {
    description: "Sent during login/signup with a one-time verification code. Required for authentication.",
    icon: "🔢",
    color: "bg-violet-100 text-violet-700",
    critical: true,
  },
  password_reset: {
    description: "Sent when an admin requests a password reset link. Required for account recovery.",
    icon: "🔐",
    color: "bg-violet-100 text-violet-700",
    critical: true,
  },
  contact_notification: {
    description: "Sent to your support inbox when a visitor submits the contact form.",
    icon: "📨",
    color: "bg-sky-100 text-sky-700",
  },
  instructor_approved: {
    description: "Sent to an applicant when their instructor application is approved.",
    icon: "🎉",
    color: "bg-green-100 text-green-700",
  },
  instructor_rejected: {
    description: "Sent to an applicant when their instructor application is rejected.",
    icon: "📋",
    color: "bg-gray-100 text-gray-700",
  },
  account_credentials: {
    description: "Sent to a person when an admin manually creates their account, with a temporary password.",
    icon: "🔑",
    color: "bg-violet-100 text-violet-700",
  },
};
