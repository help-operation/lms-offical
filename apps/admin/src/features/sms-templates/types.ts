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

/** Section display order + labels + guidelines for grouping in the admin UI. */
export const SECTION_META: { key: string; label: string; description: string; descriptionbn: string }[] = [
  {
    key: "auth",
    label: "Authentication & Account",
    description: "OTP, welcome, password reset — triggered on login/signup events. These SMS are sent automatically when users register, log in, or reset passwords.",
    descriptionbn: "OTP, স্বাগতম, পাসওয়ার্ড রিসেট — লগইন/সাইনআপ ইভেন্টে ট্রিগার হয়। ব্যবহারকারী রেজিস্টার, লগইন, বা পাসওয়ার্ড রিসেট করলে এসএমএস অটোমেটিক পাঠানো হয়।",
  },
  {
    key: "learning",
    label: "Enrollment & Learning",
    description: "Course enrollment, completion, certificate — triggered when students enroll, finish courses, or certificates are issued.",
    descriptionbn: "কোর্স এনরোলমেন্ট, সম্পূর্ণ, সার্টিফিকেট — ছাত্ররা এনরোল করলে, কোর্স শেষ করলে, বা সার্টিফিকেট জারি হলে ট্রিগার হয়।",
  },
  {
    key: "payments",
    label: "Payments",
    description: "Payment success/failure, due reminders, account credentials — triggered on order and payment events.",
    descriptionbn: "পেমেন্ট সফল/ব্যর্থ, বকেয়া রিমাইন্ড, অ্যাকাউন্ট তথ্য — অর্ডার ও পেমেন্ট ইভেন্টে ট্রিগার হয়।",
  },
  {
    key: "live",
    label: "Live Courses & Classes",
    description: "Live class reminders, batch notifications — triggered by scheduled live sessions and batch starts.",
    descriptionbn: "লাইভ ক্লাস রিমাইন্ডার, ব্যাচ নোটিফিকেশন — নির্ধারিত লাইভ সেশন এবং ব্যাচ শুরুর সময়ে ট্রিগার হয়।",
  },
  {
    key: "leads",
    label: "Leads & Marketing",
    description: "Lead follow-up, abandoned checkout, promotional — triggered for marketing and lead nurturing campaigns.",
    descriptionbn: "লিড ফলো-আপ, অসম্পূর্ণ চেকআউট, প্রচারণা — মার্কেটিং ও লিড নার্চারিং ক্যাম্পেইনে ট্রিগার হয়।",
  },
  {
    key: "support",
    label: "Support",
    description: "Support ticket replies — triggered when support team responds to a student ticket.",
    descriptionbn: "সাপোর্ট টিকেট উত্তর — সাপোর্ট টিম ছাত্রের টিকেতে উত্তর দিলে ট্রিগার হয়।",
  },
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
