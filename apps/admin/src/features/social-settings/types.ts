export const SOCIAL_KEYS = [
  "social_facebook",
  "social_youtube",
  "social_whatsapp",
  "social_instagram",
  "social_linkedin",
  "social_twitter",
] as const;

export type SocialSettingsKey = (typeof SOCIAL_KEYS)[number];

export type SocialSettings = Record<SocialSettingsKey, string>;

export const SOCIAL_DEFAULTS: SocialSettings = {
  social_facebook:  "",
  social_youtube:   "",
  social_whatsapp:  "",
  social_instagram: "",
  social_linkedin:  "",
  social_twitter:   "",
};
