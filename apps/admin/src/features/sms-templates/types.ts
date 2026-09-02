export type SmsTemplate = {
  id: number;
  eventType: string;
  name: string;
  section: string;
  templateType: string;
  body: string;
  isEnabled: boolean;
  variables: string; // JSON string: [{ key, description }]
  createdAt: string | null;
  updatedAt: string | null;
};

export type TemplateVariable = { key: string; description: string };

/** Section display order + labels for grouping in the admin UI. */
export const SECTION_META: { key: string; label: string }[] = [
  { key: "auth",     label: "Authentication & Account" },
  { key: "learning", label: "Enrollment & Learning" },
  { key: "payments", label: "Payments" },
  { key: "live",     label: "Live Courses & Classes" },
  { key: "leads",    label: "Leads & Marketing" },
  { key: "support",  label: "Support" },
];

export const BROADCAST_SEGMENTS: { key: string; label: string }[] = [
  { key: "all_users",        label: "All users (with phone)" },
  { key: "students",         label: "Students" },
  { key: "guests",           label: "Guests" },
  { key: "leads",            label: "Leads (not converted)" },
  { key: "live_enrollments", label: "Live-course enrollees" },
];

export type CreateTemplateInput = {
  eventType: string;
  name: string;
  section: string;
  templateType: string;
  body: string;
  variables: TemplateVariable[];
};
