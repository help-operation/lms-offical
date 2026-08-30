import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { WatchDemoButton } from "./WatchDemoButton";
import { CountUpNumber } from "./CountUpNumber";

export type HeroContent = {
  badge?: string;
  title?: string;
  subtitle?: string;
  primary_cta?: string;
  primary_cta_link?: string;
  secondary_cta?: string;
  secondary_cta_link?: string;
  demo_video_url?: string;
  popular_tags?: string[];
  hero_image?: string;
  student_count?: string;
  rating?: string;
  review_count?: string;
};

type Props = { content?: HeroContent };

const DEFAULTS: HeroContent = {
  badge:              "Learn skills, live",
  title:              "Smart learning, now in the palm of your hand",
  subtitle:           "Build the skills your career needs. Learn international-standard courses from home, office, or anywhere — at your own pace.",
  primary_cta:        "Let's get started",
  primary_cta_link:   "/courses",
  secondary_cta:      "Watch us",
  secondary_cta_link: "/about",
  popular_tags:       ["Web Development", "UI/UX Design", "Data Science", "Marketing"],
  hero_image:         "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=480&h=480&fit=crop&crop=face",
  student_count:      "100K",
  rating:             "4.9",
  review_count:       "200+",
};

const HeroSection = ({ content = {} }: Props) => {
  const d = { ...DEFAULTS, ...content } as Required<HeroContent>;

  return (
    <section className="relative bg-white dark:bg-gradient-to-br dark:from-gray-950 dark:via-[#160f2e] dark:to-gray-900 lg:h-[700px] h-full overflow-hidden">
      {/* Soft background shapes */}
      <div className="pointer-events-none absolute -left-40 top-0 h-[34rem] w-[34rem] rounded-full bg-surface-hero/60 dark:bg-brand-600/25 blur-[120px]" />
      <div className="pointer-events-none absolute -left-24 -bottom-24 h-96 w-96 rounded-full bg-surface-hero/50 dark:bg-brand-700/20 blur-[120px]" />
      <div className="pointer-events-none absolute right-0 top-1/3 h-[28rem] w-[28rem] rounded-full bg-surface-hero/40 dark:bg-brand-500/15 blur-[120px]" />

      <div className="container mx-auto px-4 z-30 relative flex justify-between items-center gap-6 py-16 lg:py-0 h-full">

        {/* ── Left content ─────────────────────────────────────────── */}
        <div className="xl:max-w-[834px] md:max-w-[600px] flex w-full flex-col gap-6">

          {/* Live badge */}
          <div className="w-fit rounded-full h-[36px] border border-slate-300 dark:border-gray-600 dark:text-white flex items-center justify-between px-3 gap-1 text-[16px] font-[700]">
            <span className="relative h-3 w-3 rounded-full bg-red-600 flex justify-center items-center">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
            </span>
            <div className="flex gap-1">
              <span className="text-nowrap">{d.badge.split(",")[0]}</span>
              {d.badge.includes(",") && (
                <span className="text-red-500">{d.badge.split(",")[1]!.trim()}</span>
              )}
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-5xl lg:text-[50px] xl:text-[72px] font-bold text-ink dark:text-white xl:leading-[80px] lg:leading-[60px]">
            {d.title}
          </h1>

          {/* Subtitle */}
          <p className="xl:text-xl lg:text-[16px] xl:leading-[26px] lg:leading-[22.5px] xl:w-[82%] font-medium text-ink-soft dark:text-gray-400">
            {d.subtitle}
          </p>

          {/* CTAs */}
          <div className="flex lg:flex-row lg:items-center flex-col gap-5">

            {/* Primary — gradient pill button with glow lift and sliding arrow */}
            <Link
              href={d.primary_cta_link}
              className="group relative isolate inline-flex w-fit items-center justify-center gap-2.5 overflow-hidden rounded-full bg-gradient-to-r from-brand-from to-brand-to px-9 py-4 text-[18px] font-[700] leading-[23px] text-white shadow-[0_10px_30px_-8px_var(--color-brand-shadow)] transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_16px_36px_-8px_var(--color-brand-shadow)] active:translate-y-0 active:shadow-[0_6px_16px_-6px_var(--color-brand-shadow)] cursor-pointer"
            >
              <span className="relative z-10">{d.primary_cta}</span>
              <ArrowRight className="relative z-10 h-5 w-5 shrink-0 transition-transform duration-300 ease-out group-hover:translate-x-1.5" />
              {/* shine sweep */}
              <span className="pointer-events-none absolute inset-0 -z-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full" />
            </Link>

            {/* Secondary — opens video modal if demo_video_url is set */}
            {d.demo_video_url && (
              <WatchDemoButton label={d.secondary_cta} videoUrl={d.demo_video_url} />
            )}
          </div>

          {/* Stats — green left bar via after: pseudo-element */}
          <div className="grid grid-cols-2 max-w-[350px]">
            <div className="flex mt-2 flex-col relative ps-4 after:content-[''] after:absolute after:left-0 after:top-0 after:w-[5px] after:h-full after:bg-brand-600 after:rounded-full">
              <div className="flex items-center gap-1 justify-start">
                <CountUpNumber
                  value={d.student_count}
                  className="text-[32px] font-[700] leading-[40px] text-ink dark:text-white"
                />
              </div>
              <p className="text-[18px] leading-[23px] font-[700] text-ink dark:text-white">Total learners</p>
            </div>
            <div className="flex mt-2 flex-col relative ps-4 after:content-[''] after:absolute after:left-0 after:top-0 after:w-[5px] after:h-full after:bg-brand-600 after:rounded-full">
              <div className="flex items-center gap-1 justify-start">
                <CountUpNumber
                  value={d.review_count}
                  className="text-[32px] font-[700] leading-[40px] text-ink dark:text-white"
                />
              </div>
              <p className="text-[18px] leading-[23px] font-[700] text-ink dark:text-white">Total reviews</p>
            </div>
          </div>
        </div>

        {/* ── Right — robot illustration in a soft green halo ────────── */}
        <div className="flex-1 mx-auto hidden lg:flex justify-center items-center w-full relative">
          <div className="relative flex items-center justify-center">
            {/* Soft circular glow behind the robot */}
            <div className="absolute h-[26rem] w-[26rem] rounded-full bg-[radial-gradient(circle,var(--color-surface-hero)_0%,transparent_70%)] dark:bg-[radial-gradient(circle,var(--color-brand-600)_0%,transparent_70%)] dark:opacity-40" />

            {/* Halo ring */}
            <div className="relative flex h-80 w-80 md:h-[26rem] md:w-[26rem] items-center justify-center rounded-full bg-gradient-to-b from-brand-tint/60 to-surface-hero/30 dark:from-brand-500/25 dark:to-gray-900/60 dark:ring-1 dark:ring-brand-400/30 dark:shadow-[0_0_80px_-12px_var(--color-brand-500)]">
              <img
                src={d.hero_image}
                alt="AI learning assistant"
                className="h-[88%] w-[88%] rounded-full object-cover drop-shadow-2xl dark:ring-4 dark:ring-gray-900/60"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Polygon clip-path divider */}
      <div className="hidden lg:block relative h-[124px] after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[124px] after:bg-white dark:after:bg-gray-900 after:[clip-path:polygon(0_66.39%,100%_0,100%_100%,0_100%)] after:border-t after:border-dashed after:border-brand-600 after:z-[5]" />
    </section>
  );
};

export default HeroSection;
