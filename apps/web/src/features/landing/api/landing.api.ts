import { publicApiRequest } from "@/lib/api-client";

const COURSES_CACHE = { next: { revalidate: 3600, tags: ["courses"] } };
import type { Category, PublicCourse } from "@/features/courses/api";
import type { PublicLiveCourseCard } from "@/features/live-courses/api";
import type {
  CategoryIconKey,
  LandingCategory,
  LandingCourse,
} from "@/features/landing/types";

const PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?w=600&h=360&fit=crop";

// `PublicCourse` always comes from the `courses` table (recorded courses —
// see the course data model note in CLAUDE.md), never `live_courses`, so the
// type here is always "recorded". Do NOT infer it from `totalLessons === 0`:
// a recorded course with no lessons added yet (freshly created, or a "Copy
// of ..." duplicate) would otherwise be mislabeled "Live Course" — wrong
// badge, and a broken Details link (live courses route to `/${slug}`,
// recorded ones to `/courses/${slug}`).
function toLandingCourse(c: PublicCourse): LandingCourse {
  const price = parseFloat(c.price);
  const discount = c.discountPrice ? parseFloat(c.discountPrice) : null;
  return {
    id: c.id,
    title: c.title,
    slug: c.slug,
    image: c.thumbnail ?? PLACEHOLDER_IMAGE,
    type: "recorded",
    lessons: c.totalLessons,
    hours: c.totalDuration > 0 ? Math.max(1, Math.round(c.totalDuration / 3600)) : 0,
    rating: c.rating ? parseFloat(c.rating) : 5,
    reviews: 0,
    students: c.totalStudents,
    price: discount ?? price,
    oldPrice: price,
    status: "register",
    showBadge: c.showBadge ?? true,
  };
}

/**
 * "Top Courses" — admin-curated featured list (isFeatured = true).
 * Admin toggles the Featured flag per course in /admin/courses.
 */
export async function getTopCourses(limit = 8): Promise<LandingCourse[]> {
  const res = await publicApiRequest<PublicCourse[]>(
    `/courses?featured=true&page=1&limit=${limit}`,
    COURSES_CACHE,
  ).catch(() => null);
  return (res?.data ?? []).map(toLandingCourse);
}

/**
 * "Recorded Courses" — courses that have published lessons (totalLessons > 0).
 * Server-side filter via type=recorded.
 */
export async function getRecordedCourses(limit = 12): Promise<LandingCourse[]> {
  const res = await publicApiRequest<PublicCourse[]>(
    `/courses?type=recorded&page=1&limit=${limit}`,
    COURSES_CACHE,
  ).catch(() => null);
  return (res?.data ?? []).map(toLandingCourse);
}

function toLandingCourseFromLive(c: PublicLiveCourseCard): LandingCourse {
  const price = parseFloat(c.price);
  const oldPrice = c.originalPrice ? parseFloat(c.originalPrice) : price;
  const lessons = c.totalLiveClasses ? parseInt(c.totalLiveClasses, 10) : 0;
  return {
    id: c.id,
    title: c.title,
    slug: c.slug,
    image: c.hero?.bannerImage ?? PLACEHOLDER_IMAGE,
    type: "live",
    lessons: isNaN(lessons) ? 0 : lessons,
    hours: 0,
    rating: c.hero?.rating ?? 5,
    reviews: c.hero?.ratingCount ?? 0,
    students: 0,
    price,
    oldPrice,
    status: "seats",
    showBadge: c.showBadge,
  };
}

/**
 * "Upcoming Live Batches" — published entries from the live_courses table.
 * Used by the home Upcoming Batches carousel.
 */
export async function getLiveCourses(limit = 24): Promise<LandingCourse[]> {
  const res = await publicApiRequest<PublicLiveCourseCard[]>(
    `/live-courses`,
    COURSES_CACHE,
  ).catch(() => null);
  return (res?.data ?? []).slice(0, limit).map(toLandingCourseFromLive);
}

/**
 * All published courses from the recorded courses table (no lesson filter).
 * Used by the Upcoming Batches carousel when "Show Recorded" is enabled.
 */
export async function getAllRecordedCourses(limit = 24): Promise<LandingCourse[]> {
  const res = await publicApiRequest<PublicCourse[]>(
    `/courses?page=1&limit=${limit}`,
    COURSES_CACHE,
  ).catch(() => null);
  return (res?.data ?? []).map(toLandingCourse);
}

/**
 * "Free Courses" — courses with price = 0.
 * Used by the /free-courses page.
 */
export async function getFreeCourses(limit = 24): Promise<LandingCourse[]> {
  const res = await publicApiRequest<PublicCourse[]>(
    `/courses?pricing=free&page=1&limit=${limit}`,
    COURSES_CACHE,
  ).catch(() => null);
  return (res?.data ?? []).map(toLandingCourse);
}

/**
 * Raw `PublicCourse` rows (unnormalized), for sections that render the shared
 * `@/features/courses/CourseCard` component directly instead of the landing
 * carousels' own card markup.
 */
export async function getPublicCoursesRaw(limit = 6): Promise<PublicCourse[]> {
  const res = await publicApiRequest<PublicCourse[]>(
    `/courses?page=1&limit=${limit}`,
    COURSES_CACHE,
  ).catch(() => null);
  return res?.data ?? [];
}

/** Category names for the "Best Selling Courses" filter row, in DB order. */
export async function getCourseCategoryNames(): Promise<string[]> {
  const res = await publicApiRequest<Category[]>(`/categories`, {
    next: { revalidate: 3600, tags: ["categories"] },
  }).catch(() => null);
  return (res?.data ?? []).map((c) => c.name);
}

/** Map an arbitrary DB category to one of the carousel's 5 icon keys. */
function pickIconKey(slug: string | null, name: string | null): CategoryIconKey {
  const s = `${slug ?? ""} ${name ?? ""}`.toLowerCase();
  if (/(ai|machine|data|ml|program|develop|code|tech|software|web)/.test(s)) return "ai";
  if (/(market|seo|sales|business|ads|advert)/.test(s)) return "marketing";
  if (/(design|graphic|ui|ux|art|photo|draw)/.test(s)) return "graphic";
  if (/(content|video|writ|media|film|edit)/.test(s)) return "content";
  return "soft";
}

/**
 * "Our Courses" — published courses grouped by their category, for the tabbed
 * carousel on the home page. Only categories that actually have courses are
 * returned, so empty tabs never show.
 */
export async function getCoursesByCategory(limit = 60): Promise<LandingCategory[]> {
  const [catsRes, coursesRes] = await Promise.all([
    publicApiRequest<Category[]>(`/categories`, COURSES_CACHE).catch(() => null),
    publicApiRequest<PublicCourse[]>(`/courses?page=1&limit=${limit}`, COURSES_CACHE).catch(() => null),
  ]);

  const categories = catsRes?.data ?? [];
  const courses = coursesRes?.data ?? [];
  if (courses.length === 0 || categories.length === 0) return [];

  const grouped: LandingCategory[] = [];
  for (const cat of categories) {
    const catCourses = courses
      .filter((c) => c.categorySlug === cat.slug)
      .map(toLandingCourse);
    if (catCourses.length === 0) continue;
    grouped.push({
      key: cat.slug,
      name: cat.name,
      iconKey: pickIconKey(cat.slug, cat.name),
      courses: catCourses,
    });
  }

  return grouped;
}

export type MixedCourse = {
  id: number;
  title: string;
  slug: string;
  image: string | null;
  type: "recorded" | "live";
  price: string;
  originalPrice: string | null;
  isFeatured: boolean;
  showBadge: boolean;
  rating: number;
  totalStudents: number;
  totalLessons: number;
  totalDuration: number;
};

export async function getAllMixedCourses(
  limit: number,
  sortOrder: string,
): Promise<MixedCourse[]> {
  const res = await publicApiRequest<MixedCourse[]>(
    `/courses/all-mixed?limit=${limit}&sort_order=${sortOrder}`,
    { next: { revalidate: 3600, tags: ["courses", "live-courses"] } },
  ).catch(() => null);
  return res?.data ?? [];
}
