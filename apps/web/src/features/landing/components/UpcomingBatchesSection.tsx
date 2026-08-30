import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { getLiveCourses, getAllRecordedCourses } from "@/features/landing/api/landing.api";
import { UpcomingBatchesCarousel } from "@/features/landing/components/UpcomingBatchesCarousel";

export type UpcomingBatchesContent = {
  title_prefix?: string;
  title_highlight?: string;
  title_suffix?: string;
  see_all_label?: string;
  see_all_link?: string;
  show_live?: boolean;
  live_badge_label?: string;
  live_badge_color?: string;
  show_recorded?: boolean;
  recorded_badge_label?: string;
  recorded_badge_color?: string;
  /** Legacy field — ignored. */
  batches?: unknown;
};

type Props = { content?: UpcomingBatchesContent };

const DEFAULTS = {
  title_prefix:         "",
  title_highlight:      "Upcoming",
  title_suffix:         "Batches All",
  see_all_label:        "See all",
  see_all_link:         "/live-classes",
  show_live:            true,
  live_badge_label:     "Live Course",
  live_badge_color:     "#dc2626",
  show_recorded:        false,
  recorded_badge_label: "Recorded",
  recorded_badge_color: "#7c3aed",
} as const;

export type BadgeConfig = { label: string; color: string };

export default async function UpcomingBatchesSection({ content = {} }: Props) {
  const d = { ...DEFAULTS, ...content };

  const showLive     = d.show_live !== false;
  const showRecorded = d.show_recorded === true;

  const [liveCourses, recordedCourses] = await Promise.all([
    showLive     ? getLiveCourses(12)        : Promise.resolve([]),
    showRecorded ? getAllRecordedCourses(24) : Promise.resolve([]),
  ]);

  const courses = [...liveCourses, ...recordedCourses];
  if (courses.length === 0) return null;

  const liveBadge:     BadgeConfig = { label: d.live_badge_label,     color: d.live_badge_color };
  const recordedBadge: BadgeConfig = { label: d.recorded_badge_label, color: d.recorded_badge_color };

  return (
    <section className="bg-white dark:bg-gradient-to-br dark:from-gray-950 dark:via-[#160f2e] dark:to-gray-900 py-16 lg:py-24">
      <div className="container mx-auto px-4">
        {/* Heading */}
        <div className="flex items-end justify-between">
          <h2 className="text-3xl md:text-[48px] font-bold leading-tight text-ink dark:text-white">
            {d.title_prefix && <>{d.title_prefix}{" "}</>}
            <span className="relative text-accent">
              {d.title_highlight}
              <span className="absolute -bottom-2 left-0 h-[6px] w-full rounded-full bg-accent/50" />
            </span>
            {d.title_suffix && <>{" "}{d.title_suffix}</>}
          </h2>
          <Link
            href={d.see_all_link}
            className="hidden sm:flex items-center gap-2 text-lg font-bold text-ink dark:text-white hover:gap-3 transition-all"
          >
            {d.see_all_label} <ArrowUpRight className="h-5 w-5" />
          </Link>
        </div>

        {/* Carousel (client island) */}
        <UpcomingBatchesCarousel
          batches={courses}
          liveBadge={liveBadge}
          recordedBadge={recordedBadge}
        />
      </div>
    </section>
  );
}
