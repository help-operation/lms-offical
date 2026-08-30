import { publicApiRequest } from "@/lib/api-client";

export type GeneralContactSettings = {
  general_contact_email: string;
  general_contact_phone: string;
  general_contact_phone2: string;
  general_support_whatsapp: string;
};

const CONTACT_DEFAULTS: GeneralContactSettings = {
  general_contact_email: "",
  general_contact_phone: "",
  general_contact_phone2: "",
  general_support_whatsapp: "",
};

const CONTACT_KEYS = Object.keys(CONTACT_DEFAULTS).join(",");

export async function getPublicContactSettings(): Promise<GeneralContactSettings> {
  const res = await publicApiRequest<Record<string, string>>(
    `/system-settings/public?keys=${CONTACT_KEYS}`,
    { next: { revalidate: 3600, tags: ["general-settings"] } },
  ).catch(() => null);

  const data = res?.data ?? {};
  return {
    general_contact_email:     data.general_contact_email     ?? CONTACT_DEFAULTS.general_contact_email,
    general_contact_phone:     data.general_contact_phone     ?? CONTACT_DEFAULTS.general_contact_phone,
    general_contact_phone2:    data.general_contact_phone2    ?? CONTACT_DEFAULTS.general_contact_phone2,
    general_support_whatsapp:  data.general_support_whatsapp  ?? CONTACT_DEFAULTS.general_support_whatsapp,
  };
}

function parseTemplateColors(raw: string | undefined): Record<string, string> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed ? parsed : {};
  } catch {
    return {};
  }
}

export async function getCheckoutPaymentImage(): Promise<string | null> {
  const res = await publicApiRequest<Record<string, string>>(
    `/system-settings/public?keys=payment_checkout_image`,
    { next: { revalidate: 3600, tags: ["general-settings"] } },
  ).catch(() => null);
  const url = res?.data?.payment_checkout_image?.trim() ?? "";
  return url || null;
}

export async function getPublicSiteSettings(): Promise<{
  logo_url: string;
  logo_url_dark: string;
  site_name: string;
  home_template: string;
  template_colors: Record<string, string>;
}> {
  const res = await publicApiRequest<Record<string, string>>(
    `/system-settings/public?keys=general_logo_url,general_logo_url_dark,general_site_name,general_home_template,general_home_template_colors`,
    { next: { revalidate: 3600, tags: ["general-settings"] } },
  ).catch(() => null);

  const data = res?.data ?? {};
  return {
    logo_url:        data.general_logo_url      ?? "",
    logo_url_dark:   data.general_logo_url_dark  ?? "",
    site_name:       data.general_site_name     ?? "",
    home_template:   data.general_home_template || "home",
    template_colors: parseTemplateColors(data.general_home_template_colors),
  };
}

const DEFAULT_META_DESCRIPTION =
  "Join 56K+ learners. 200+ expert-led courses across development, design, marketing and more.";

export async function getPublicMetaDescription(): Promise<string> {
  const res = await publicApiRequest<Record<string, string>>(
    `/system-settings/public?keys=general_meta_description`,
    { next: { revalidate: 3600, tags: ["general-settings"] } },
  ).catch(() => null);

  const data = res?.data ?? {};
  return data.general_meta_description?.trim() || DEFAULT_META_DESCRIPTION;
}

export type CourseCtaSettings = {
  enroll: string;
  enrollFree: string;
  continueLearning: string;
};

const CTA_DEFAULTS: CourseCtaSettings = {
  enroll: "Enroll Now",
  enrollFree: "Enroll for Free",
  continueLearning: "Continue Learning",
};

// Global, admin-editable labels for the course purchase buttons. Blank values
// fall back to the defaults above so the buttons always read sensibly.
export async function getPublicCourseCtaSettings(): Promise<CourseCtaSettings> {
  const res = await publicApiRequest<Record<string, string>>(
    `/system-settings/public?keys=general_cta_enroll,general_cta_enroll_free,general_cta_continue`,
    { next: { revalidate: 3600, tags: ["general-settings"] } },
  ).catch(() => null);

  const data = res?.data ?? {};
  return {
    enroll:           data.general_cta_enroll?.trim()      || CTA_DEFAULTS.enroll,
    enrollFree:       data.general_cta_enroll_free?.trim() || CTA_DEFAULTS.enrollFree,
    continueLearning: data.general_cta_continue?.trim()    || CTA_DEFAULTS.continueLearning,
  };
}

export type DashboardCtaSettings = {
  goToClass: string;
  startLearning: string;
  continueText: string;
  review: string;
};

const DASH_DEFAULTS: DashboardCtaSettings = {
  goToClass: "Go to Class",
  startLearning: "Start Learning",
  continueText: "Continue",
  review: "Review",
};

// Global, admin-editable labels for the student "My Courses" dashboard button.
// Blank values fall back to the defaults above.
export async function getPublicDashboardCtaSettings(): Promise<DashboardCtaSettings> {
  const res = await publicApiRequest<Record<string, string>>(
    `/system-settings/public?keys=general_dash_go_to_class,general_dash_start_learning,general_dash_continue,general_dash_review`,
    { next: { revalidate: 3600, tags: ["general-settings"] } },
  ).catch(() => null);

  const data = res?.data ?? {};
  return {
    goToClass:     data.general_dash_go_to_class?.trim()   || DASH_DEFAULTS.goToClass,
    startLearning: data.general_dash_start_learning?.trim() || DASH_DEFAULTS.startLearning,
    continueText:  data.general_dash_continue?.trim()       || DASH_DEFAULTS.continueText,
    review:        data.general_dash_review?.trim()         || DASH_DEFAULTS.review,
  };
}

export type SocialLinks = {
  facebook:  string;
  youtube:   string;
  whatsapp:  string;
  instagram: string;
  linkedin:  string;
  twitter:   string;
};

export async function getPublicSocialLinks(): Promise<SocialLinks> {
  const res = await publicApiRequest<Record<string, string>>(
    `/system-settings/public?keys=social_facebook,social_youtube,social_whatsapp,social_instagram,social_linkedin,social_twitter`,
    { next: { revalidate: 3600, tags: ["social-settings"] } },
  ).catch(() => null);

  const data = res?.data ?? {};
  return {
    facebook:  data.social_facebook  ?? "",
    youtube:   data.social_youtube   ?? "",
    whatsapp:  data.social_whatsapp  ?? "",
    instagram: data.social_instagram ?? "",
    linkedin:  data.social_linkedin  ?? "",
    twitter:   data.social_twitter   ?? "",
  };
}
