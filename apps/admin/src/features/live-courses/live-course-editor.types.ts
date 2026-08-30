export type PaymentLogo = { name: string; image?: string };
export type BatchInfo = {
  startDate?: string;
  liveSchedule?: string;
  supportSchedule?: string;
  seatsLeft?: string;
};
export type CurriculumItem = { title: string; lessons: string[] };
export type Tool = { name: string; icon?: string; bgColor?: string };
export type WhyItem = { title: string; description?: string; icon?: string };
export type Instructor = {
  name: string;
  title?: string;
  image?: string;
  bio?: string;
  students?: string;
  courses?: string;
  rating?: string;
  years?: string;
  clients?: string;
  projects?: string;
  profileUrl?: string;
};
export type WhatYouGetItem = { title: string; description?: string; icon?: string };
export type VideoItem = { url: string; title?: string; description?: string };
export type Testimonial = { name: string; role?: string; review: string };
export type ValueItem = { title: string; description?: string; value: string };

// Template 2 specific types
export type FaqItem = { question: string; answer: string };
export type CompRow = { feature: string; col1?: string; col2?: string; highlight?: boolean };
export type VideoTabItem = {
  category: string;
  videos: Array<{ url: string; title?: string; thumbnail?: string }>;
};
export type PcConfig = {
  ram?: string;
  processor?: string;
  storage?: string;
  graphics?: string;
  note?: string;
};

// Template 3 specific types
export type T3FeatureItem   = { icon?: string; text: string };
export type T3Level         = { label: string; description: string; color?: string };
export type T3Review        = { name: string; role?: string; avatar?: string; text: string };
export type T3SuccessStory  = { name: string; badge?: string; description?: string; image?: string };
export type T3VideoItem     = { url: string; thumbnail?: string };

// Template 4 specific types
export type T4ForWhomCard   = { icon?: string; title: string; description?: string };
export type T4Module        = { icon?: string; title: string; bullets?: string[]; fullWidth?: boolean };
