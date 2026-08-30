import { CoursesGridV2, type CoursesGridContent } from "@repo/ui/home-v1-courses-grid";
import { CourseCard } from "@/features/courses/CourseCard";
import { getPublicCoursesRaw, getCourseCategoryNames } from "@/features/landing/api/landing.api";
import type { PublicCourse } from "@/features/courses/api";

export type { CoursesGridContent };

type Props = { content?: CoursesGridContent };

// Fetch a larger pool than what's shown so the category filter tabs (below)
// have enough courses per category to filter from client-side.
const FETCH_POOL_SIZE = 60;

export default async function CoursesGridSection({ content = {} }: Props) {
  const [courses, categoryNames] = await Promise.all([
    getPublicCoursesRaw(FETCH_POOL_SIZE),
    getCourseCategoryNames(),
  ]);
  // The filter tabs must match real category names to actually filter
  // anything, so live category names always win over a stale CMS-saved
  // `filters` list (which predates this section becoming interactive).
  const filters = ["All Courses", ...categoryNames];
  const cards = Object.fromEntries(
    courses.map((c: PublicCourse) => [String(c.id), <CourseCard key={c.id} course={c} />]),
  );

  return (
    <CoursesGridV2
      content={{ ...content, filters }}
      courses={courses}
      cards={cards}
    />
  );
}
