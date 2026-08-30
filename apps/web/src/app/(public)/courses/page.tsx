import { coursesApi } from "@/features/courses/api";
import { enrollmentsApi } from "@/features/courses/api/enrollments";
import { liveCoursesApi } from "@/features/live-courses/api";
import { liveCurriculumApi } from "@/features/live-courses/api/curriculum";
import { CourseCard } from "@/features/courses/CourseCard";
import { CourseListTracker } from "@/features/courses/CourseListTracker";
import { LiveCourseCard } from "@/features/live-courses/LiveCourseCard";
import { CoursesTypePills } from "@/features/courses/CoursesToolbar";
import { BookOpen } from "lucide-react";
import Link from "next/link";
import { getPublicPageSections } from "@/features/cms/api/page-sections";
import { ContentContext } from "@/shared/components/ContentContext";
import { CourseSearchTracker } from "@/features/courses/CourseSearchTracker";

export const metadata = {
  title: "Courses",
  description: "Browse all courses",
};

interface CoursesPageProps {
  searchParams: Promise<{
    type?: string;
    page?: string;
    search?: string;
  }>;
}

export default async function CoursesPage({ searchParams }: CoursesPageProps) {
  const params = await searchParams;
  const type = params.type; // "live" | "recorded" | "free" | undefined (= all)
  const isFreeFilter = type === "free";
  const showLive     = type !== "recorded"; // show for: undefined, "live", "free"
  const showRecorded = type !== "live";     // show for: undefined, "recorded", "free"
  const page = Number(params.page ?? 1);
  const limit = 12;
  const search = params.search?.trim() ?? "";

  // ── Fetch only what we'll show ────────────────────────────────────────────
  const sections = await getPublicPageSections("courses");
  const heroSection = sections.find((s) => s.type === "simple_hero");
  const heroTitle = (heroSection?.content?.title as string) || "Our Courses";
  const heroSubtitle = (heroSection?.content?.subtitle as string) ||
    "All the modern, practical courses you need to build your career, now on one platform. Each course is curated to match current market demand — with live support, project-based learning and real experience for assured skill development.";

  const [liveRes, liveEnrolledRes, coursesRes, recordedEnrolledRes] = await Promise.all([
    showLive ? liveCoursesApi.list().catch(() => null) : Promise.resolve(null),
    showLive
      ? liveCurriculumApi.myEnrollments().then((r) => r.data.courseIds).catch(() => [])
      : Promise.resolve([]),
    showRecorded ? coursesApi.list({ page, limit, ...(search ? { search } : {}) }).catch(() => null) : Promise.resolve(null),
    showRecorded
      ? enrollmentsApi.myEnrollments().then((r) => r.data.filter((e) => e.courseType === "recorded").map((e) => e.courseId)).catch(() => [])
      : Promise.resolve([]),
  ]);

  const allLiveCourses = liveRes?.data ?? [];
  const liveCourses    = isFreeFilter
    ? allLiveCourses.filter((c) => parseFloat(c.price) === 0)
    : allLiveCourses;
  const enrolledIds = new Set(liveEnrolledRes);
  const recordedEnrolledIds = new Set(recordedEnrolledRes);

  const rawRecorded  = coursesRes?.data ?? [];
  const recorded = isFreeFilter
    ? rawRecorded.filter((c) => parseFloat(c.discountPrice ?? c.price) === 0)
    : rawRecorded;

  const liveSection = showLive && (liveCourses.length > 0 || type === "live");
  const recordedSection = showRecorded && (rawRecorded.length > 0 || type === "recorded");
  const nothingToShow = !liveSection && !recordedSection;
  const emptyMessage =
    type === "live" && liveCourses.length === 0
      ? "No live courses available yet."
      : type === "recorded" && recorded.length === 0
        ? "No recorded courses match this filter."
        : null;

  const buildPageHref = (p: number) => {
    const q = new URLSearchParams();
    if (params.type) q.set("type", params.type);
    if (search) q.set("search", search);
    q.set("page", String(p));
    return `/courses?${q.toString()}`;
  };

  return (
    <main className="min-h-screen bg-white transition-colors duration-300 animate-content-in dark:bg-gray-950">
      {/* recordedSection-only count — this listing has no category-scoped filter, so a
          category/tag total (per the content-context spec's listing scenario) doesn't
          apply here; only the current-page count is meaningful. */}
      <ContentContext type="course_list" pageCount={recordedSection ? recorded.length : 0} />
      {search && <CourseSearchTracker query={search} resultCount={recorded.length} />}
      {/* Hero banner */}
      <section className="relative overflow-hidden bg-gradient-to-b from-surface-hero to-white transition-colors duration-300 dark:bg-gradient-to-br dark:from-gray-950 dark:via-[#160f2e] dark:to-gray-900">
        <div className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-brand-tint/40 blur-3xl dark:bg-brand-600/25" />
        <div className="pointer-events-none absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-brand-tint/40 blur-3xl dark:bg-brand-600/25" />
        <div className="container relative mx-auto px-4 py-16 text-center">
          <h1 className="text-3xl md:text-[44px] font-bold text-brand dark:text-brand-400">{heroTitle}</h1>
          <p className="mx-auto mt-4 max-w-3xl text-sm leading-relaxed text-ink-soft dark:text-gray-400 md:text-base">
            {heroSubtitle}
          </p>
          <div className="mt-8">
            <CoursesTypePills />
          </div>
        </div>
      </section>

      {/* Listing */}
      <div className="container mx-auto px-4 py-12">
        {nothingToShow ? (
          <div className="py-24 text-center">
            <BookOpen className="mx-auto mb-4 h-14 w-14 text-gray-300 dark:text-gray-700" />
            <h3 className="mb-1 text-lg font-semibold text-gray-700 dark:text-gray-300">
              No courses available yet
            </h3>
            <p className="text-gray-400 dark:text-gray-500">
              Courses will appear here once they&apos;re published from the admin.
            </p>
          </div>
        ) : emptyMessage ? (
          <p className="text-sm text-gray-400 dark:text-gray-500">{emptyMessage}</p>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {liveSection &&
                liveCourses.map((course) => (
                  <LiveCourseCard
                    key={`live-${course.id}`}
                    course={course}
                    enrolled={enrolledIds.has(course.id)}
                  />
                ))}
              {recordedSection &&
                recorded.map((course) => (
                  <CourseCard
                    key={`recorded-${course.id}`}
                    course={course}
                    enrolled={recordedEnrolledIds.has(course.id)}
                    listName="Courses page"
                  />
                ))}
            </div>

            {recordedSection && recorded.length > 0 && (
              <CourseListTracker
                listName="Courses page"
                items={recorded.map((c) => ({
                  item_id: String(c.id),
                  item_name: c.title,
                  price: c.discountPrice ? parseFloat(c.discountPrice) : parseFloat(c.price),
                }))}
              />
            )}

            {/* Pagination — recorded only */}
            {recordedSection && (page > 1 || rawRecorded.length === limit) && (
              <div className="mt-14 flex justify-center gap-3">
                {page > 1 && (
                  <Link
                    href={buildPageHref(page - 1)}
                    className="rounded-md border border-brand-200 bg-white px-5 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-brand-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    Previous
                  </Link>
                )}
                {rawRecorded.length === limit && (
                  <Link
                    href={buildPageHref(page + 1)}
                    className="rounded-md bg-gradient-to-r from-brand-from to-brand-to px-5 py-2 text-sm font-semibold text-white shadow-md transition-all hover:scale-105"
                  >
                    Next
                  </Link>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
