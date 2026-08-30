import { BookOpen } from "lucide-react";
import { publicApiRequest } from "@/lib/api-client";
import { CourseCard } from "@/features/courses/CourseCard";
import type { PublicCourse } from "@/features/courses/api";

export type FreeCoursesGridContent = {
  title_prefix?: string;
  title_highlight?: string;
  title_suffix?: string;
};

type Props = { content?: FreeCoursesGridContent };

const DEFAULTS: Required<FreeCoursesGridContent> = {
  title_prefix:    "Our",
  title_highlight: "Free Courses",
  title_suffix:    "",
};

/**
 * Fetches all courses with price = 0. Cached with tag 'courses' so the same
 * cache is invalidated when any course changes (price edits → admin save).
 */
async function getFreeCourses(): Promise<PublicCourse[]> {
  const res = await publicApiRequest<PublicCourse[]>(
    "/courses?pricing=free&page=1&limit=24",
    { next: { revalidate: 3600, tags: ["courses"] } },
  ).catch(() => null);
  return res?.data ?? [];
}

const FreeCoursesGrid = async ({ content = {} }: Props) => {
  const d = { ...DEFAULTS, ...content };
  const courses = await getFreeCourses();

  return (
    <section className="container mx-auto px-4 py-12">
      <h2 className="text-3xl md:text-[44px] font-bold leading-tight text-gray-900">
        {d.title_prefix && <>{d.title_prefix}{" "}</>}
        <span className="relative text-accent">
          {d.title_highlight}
          <span className="absolute -bottom-2 left-0 h-[6px] w-full rounded-full bg-accent/40" />
        </span>
        {d.title_suffix && <>{" "}{d.title_suffix}</>}
      </h2>

      {courses.length === 0 ? (
        <div className="mt-10 rounded-2xl border-2 border-dashed border-gray-200 bg-white p-10 text-center">
          <BookOpen className="mx-auto mb-3 h-12 w-12 text-gray-300" />
          <p className="text-sm font-semibold text-gray-700">
            No free courses available yet.
          </p>
          <p className="mt-1 text-xs text-gray-400">
            When an admin sets a course&rsquo;s price to ৳0, it will appear here.
          </p>
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </section>
  );
};

export default FreeCoursesGrid;
