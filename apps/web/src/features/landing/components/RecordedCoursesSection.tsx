import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { getRecordedCourses } from "@/features/landing/api/landing.api";
import { RecordedCoursesCarousel } from "@/features/landing/components/RecordedCoursesCarousel";

export type RecordedCoursesContent = {
  title_prefix?: string;
  title_highlight?: string;
  title_suffix?: string;
  see_all_label?: string;
  see_all_link?: string;
};

type Props = { content?: RecordedCoursesContent };

const DEFAULTS: RecordedCoursesContent = {
  title_prefix:    "",
  title_highlight: "Recorded",
  title_suffix:    "Courses All",
  see_all_label:   "See all",
  see_all_link:    "/courses",
};

export default async function RecordedCoursesSection({ content = {} }: Props) {
  const d = { ...DEFAULTS, ...content } as Required<RecordedCoursesContent>;
  const courses = await getRecordedCourses();

  // No recorded courses yet → hide the whole section
  if (courses.length === 0) return null;

  return (
    <section className="bg-white dark:bg-gradient-to-br dark:from-gray-950 dark:via-[#160f2e] dark:to-gray-900 py-16 lg:py-24">
      <div className="container mx-auto px-4">
        <div className="flex items-end justify-between">
          <h2 className="text-3xl md:text-[48px] font-bold leading-tight text-gray-900 dark:text-white">
            {d.title_prefix && <>{d.title_prefix}{" "}</>}
            <span className="relative text-accent">
              {d.title_highlight}
              <span className="absolute -bottom-2 left-0 h-[6px] w-full rounded-full bg-accent/40" />
            </span>
            {d.title_suffix && <>{" "}{d.title_suffix}</>}
          </h2>
          <Link
            href={d.see_all_link}
            className="hidden sm:flex items-center gap-2 text-lg font-bold text-brand-600 dark:text-brand-400 hover:gap-3 transition-all"
          >
            {d.see_all_label} <ArrowUpRight className="h-5 w-5" />
          </Link>
        </div>

        {/* Carousel (client island) */}
        <RecordedCoursesCarousel courses={courses} />
      </div>
    </section>
  );
}
