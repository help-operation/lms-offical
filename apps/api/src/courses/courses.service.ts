import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, desc, eq, getTableColumns, ilike, inArray, ne, or, sql, type SQL } from 'drizzle-orm';
import type { DB } from 'src/db';
import { DB_TOKEN } from 'src/db/db.module';
import {
  adminUsers,
  categories,
  courseBundleItems,
  courseModules,
  courses,
  enrollments,
  instructorProfiles,
  lessons,
  liveCourses,
  liveEnrollments,
  orderItems,
  orders,
  reviews,
  userCourseInterests,
  users,
} from 'src/db/schema';
import { toSlug, toUniqueSlug } from 'src/common/utils/slug.util';
import { canEditCourse, getAssignedCourseIds, getListableCourseIds } from 'src/common/rbac/course-access';
import {
  buildTableQuery,
  formatPaginatedResponse,
  type TableQueryInput,
} from 'src/common/utils/table-query.util';
import { BunnyStreamService } from 'src/bunny-stream/bunny-stream.service';
import { RevalidationService } from 'src/common/revalidation/revalidation.service';
import { CacheTag } from 'src/common/revalidation/cache-tags';
import type { CreateCourseDto, UpdateCourseDto } from './dto/course.dto';
import { ActivityLogsService } from 'src/activity-logs/activity-logs.service';

@Injectable()
export class CoursesService {
  constructor(
    @Inject(DB_TOKEN) private readonly db: DB,
    private readonly bunny: BunnyStreamService,
    private readonly revalidation: RevalidationService,
    private readonly activityLogs: ActivityLogsService,
  ) {}

  // ─── Public ───────────────────────────────────────────────────────────────

  async findAllPublished(filters: {
    categoryId?: number;
    level?: string;
    search?: string;
    page?: number;
    limit?: number;
    /** When true, only courses with isFeatured = true (drives "Top Courses"). */
    featured?: boolean;
    /** 'free' → price = 0, 'paid' → price > 0. */
    pricing?: 'free' | 'paid';
    /** 'live' → totalLessons = 0, 'recorded' → totalLessons > 0. */
    type?: 'live' | 'recorded';
  }) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 12;
    const offset = (page - 1) * limit;

    const conditions = [eq(courses.status, 'published'), ne(courses.isUnlisted, true)];

    if (filters.categoryId) conditions.push(eq(courses.categoryId, filters.categoryId));
    if (filters.level) conditions.push(eq(courses.level, filters.level as any));
    if (filters.search) {
      conditions.push(
        or(
          ilike(courses.title, `%${filters.search}%`),
          ilike(courses.description, `%${filters.search}%`),
        )!,
      );
    }
    if (filters.featured) conditions.push(eq(courses.isFeatured, true));
    if (filters.pricing === 'free') conditions.push(eq(courses.price, '0'));
    if (filters.pricing === 'paid') conditions.push(sql`${courses.price}::numeric > 0`);
    // Live vs recorded is derived from the live lesson count, not the stale
    // stored counter column (which is never updated).
    const lessonCountSql = sql`(
      SELECT COUNT(*) FROM ${lessons}
      INNER JOIN ${courseModules} ON ${lessons.moduleId} = ${courseModules.id}
      WHERE ${courseModules.courseId} = ${courses.id}
    )`;
    if (filters.type === 'live') conditions.push(sql`${lessonCountSql} = 0`);
    if (filters.type === 'recorded') conditions.push(sql`${lessonCountSql} > 0`);

    const rows = await this.db
      .select({
        id: courses.id,
        title: courses.title,
        slug: courses.slug,
        description: courses.description,
        thumbnail: courses.thumbnail,
        price: courses.price,
        discountPrice: courses.discountPrice,
        level: courses.level,
        language: courses.language,
        isFeatured: courses.isFeatured,
        showBadge: courses.showBadge,
        totalLessons: sql<number>`(
          SELECT COUNT(*)::int FROM ${lessons}
          INNER JOIN ${courseModules} ON ${lessons.moduleId} = ${courseModules.id}
          WHERE ${courseModules.courseId} = ${courses.id}
        )`,
        totalDuration: sql<number>`(
          SELECT COALESCE(SUM(${lessons.duration}), 0)::int FROM ${lessons}
          INNER JOIN ${courseModules} ON ${lessons.moduleId} = ${courseModules.id}
          WHERE ${courseModules.courseId} = ${courses.id}
        )`,
        totalStudents: sql<number>`(
          COALESCE(${courses.manualStudentCount}, (SELECT COUNT(*)::int FROM ${enrollments}
          WHERE ${enrollments.courseId} = ${courses.id} AND ${enrollments.status} = 'active'))
        )`,
        rating: courses.rating,
        ratingCount: courses.ratingCount,
        ratingSource: courses.ratingSource,
        bunnyPreviewVideoId: courses.bunnyPreviewVideoId,
        previewVideoSource: courses.previewVideoSource,
        previewExternalUrl: courses.previewExternalUrl,
        previewSlides: courses.previewSlides,
        categoryName: categories.name,
        categorySlug: categories.slug,
        instructorFirstName: sql<string>`CASE WHEN ${courses.publishAs} = 'teacher' AND ${instructorProfiles.displayName} IS NOT NULL THEN ${instructorProfiles.displayName} ELSE ${adminUsers.firstName} END`,
        instructorLastName:  sql<string>`CASE WHEN ${courses.publishAs} = 'teacher' AND ${instructorProfiles.displayName} IS NOT NULL THEN '' ELSE ${adminUsers.lastName} END`,
        instructorAvatar:    sql<string | null>`CASE WHEN ${courses.publishAs} = 'teacher' AND ${instructorProfiles.displayAvatar} IS NOT NULL THEN ${instructorProfiles.displayAvatar} ELSE ${adminUsers.avatar} END`,
      })
      .from(courses)
      .leftJoin(categories, eq(courses.categoryId, categories.id))
      .leftJoin(adminUsers, eq(courses.instructorId, adminUsers.id))
      .leftJoin(instructorProfiles, eq(courses.instructorId, instructorProfiles.userId))
      .where(and(...conditions))
      .orderBy(desc(courses.createdAt))
      .limit(limit)
      .offset(offset);

    return rows;
  }

  async findAllMixed(limit: number, sortOrder: string) {
    const fetchLimit = Math.max(limit * 2, 60);

    // Raw SQL subqueries with explicit table qualifiers bypass a Drizzle bug
    // where single-table outer queries emit unqualified column names, causing
    // Postgres to misresolve references inside correlated subqueries.
    const [recordedRows, liveRows] = await Promise.all([
      this.db
        .select({
          id: courses.id,
          title: courses.title,
          slug: courses.slug,
          image: courses.thumbnail,
          price: courses.price,
          discountPrice: courses.discountPrice,
          isFeatured: courses.isFeatured,
          showBadge: courses.showBadge,
          rating: courses.rating,
          totalStudents: sql<number>`(COALESCE("courses"."manual_student_count", (SELECT COUNT(*)::int FROM "enrollments" WHERE "enrollments"."course_id" = "courses"."id" AND "enrollments"."status" = 'active')))`,
          totalLessons: sql<number>`(SELECT COUNT(*)::int FROM "lessons" INNER JOIN "course_modules" ON "lessons"."module_id" = "course_modules"."id" WHERE "course_modules"."course_id" = "courses"."id")`,
          totalDuration: sql<number>`(SELECT COALESCE(SUM("lessons"."duration"),0)::int FROM "lessons" INNER JOIN "course_modules" ON "lessons"."module_id" = "course_modules"."id" WHERE "course_modules"."course_id" = "courses"."id")`,
          createdAt: courses.createdAt,
        })
        .from(courses)
        .where(and(eq(courses.status, 'published'), ne(courses.isUnlisted, true)))
        .orderBy(desc(courses.createdAt))
        .limit(fetchLimit),

      this.db
        .select({
          id: liveCourses.id,
          title: liveCourses.title,
          slug: liveCourses.slug,
          hero: liveCourses.hero,
          price: liveCourses.price,
          originalPrice: liveCourses.originalPrice,
          totalLiveClasses: liveCourses.totalLiveClasses,
          totalStudents: sql<number>`(SELECT COUNT(*)::int FROM "live_enrollments" WHERE "live_enrollments"."live_course_id" = "live_courses"."id")`,
          createdAt: liveCourses.createdAt,
        })
        .from(liveCourses)
        .where(eq(liveCourses.status, 'published'))
        .orderBy(desc(liveCourses.createdAt))
        .limit(fetchLimit),
    ]);

    type MixedItem = {
      id: number;
      title: string;
      slug: string;
      image: string | null;
      type: 'recorded' | 'live';
      price: string;
      originalPrice: string | null;
      isFeatured: boolean;
      showBadge: boolean;
      rating: number;
      totalStudents: number;
      totalLessons: number;
      totalDuration: number;
      createdAt: Date | string | null;
    };

    const getTime = (d: Date | string | null) =>
      d ? new Date(d as string).getTime() : 0;

    const recorded: MixedItem[] = recordedRows.map((r) => {
      const basePrice = parseFloat(r.price);
      const discountPrice = r.discountPrice ? parseFloat(r.discountPrice) : null;
      const hasDiscount =
        discountPrice !== null && !Number.isNaN(discountPrice) && discountPrice < basePrice;
      return {
        id: r.id,
        title: r.title,
        slug: r.slug,
        image: r.image,
        type: 'recorded',
        price: hasDiscount ? r.discountPrice! : r.price,
        originalPrice: hasDiscount ? r.price : null,
        isFeatured: r.isFeatured ?? false,
        showBadge: r.showBadge ?? true,
        rating: r.rating ? parseFloat(r.rating) : 0,
        totalStudents: r.totalStudents,
        totalLessons: r.totalLessons,
        totalDuration: r.totalDuration,
        createdAt: r.createdAt,
      };
    });

    const live: MixedItem[] = liveRows.map((r) => {
      const hero = r.hero as Record<string, unknown> | null;
      return {
        id: r.id,
        title: r.title,
        slug: r.slug,
        image: (hero?.bannerImage as string | null) ?? null,
        type: 'live',
        price: r.price,
        originalPrice: r.originalPrice,
        isFeatured: false,
        showBadge: true,
        rating: hero?.rating ? parseFloat(String(hero.rating)) : 0,
        totalStudents: r.totalStudents,
        totalLessons: r.totalLiveClasses ? parseInt(r.totalLiveClasses, 10) : 0,
        totalDuration: 0,
        createdAt: r.createdAt,
      };
    });

    const merged = [...recorded, ...live];

    switch (sortOrder) {
      case 'featured':
        merged.sort((a, b) => {
          if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1;
          return getTime(b.createdAt) - getTime(a.createdAt);
        });
        break;
      case 'live_first':
        merged.sort((a, b) => {
          if (a.type !== b.type) return a.type === 'live' ? -1 : 1;
          return getTime(b.createdAt) - getTime(a.createdAt);
        });
        break;
      case 'recorded_first':
        merged.sort((a, b) => {
          if (a.type !== b.type) return a.type === 'recorded' ? -1 : 1;
          return getTime(b.createdAt) - getTime(a.createdAt);
        });
        break;
      case 'newest':
      default:
        merged.sort((a, b) => getTime(b.createdAt) - getTime(a.createdAt));
        break;
    }

    return merged.slice(0, limit);
  }

  async findBySlugPublic(slug: string) {
    const [course] = await this.db
      .select({
        id: courses.id,
        title: courses.title,
        slug: courses.slug,
        shortDescription: courses.shortDescription,
        description: courses.description,
        thumbnail: courses.thumbnail,
        price: courses.price,
        discountPrice: courses.discountPrice,
        level: courses.level,
        language: courses.language,
        isFeatured: courses.isFeatured,
        showBadge: courses.showBadge,
        totalLessons: sql<number>`(
          SELECT COUNT(*)::int FROM ${lessons}
          INNER JOIN ${courseModules} ON ${lessons.moduleId} = ${courseModules.id}
          WHERE ${courseModules.courseId} = ${courses.id}
        )`,
        totalDuration: sql<number>`(
          SELECT COALESCE(SUM(${lessons.duration}), 0)::int FROM ${lessons}
          INNER JOIN ${courseModules} ON ${lessons.moduleId} = ${courseModules.id}
          WHERE ${courseModules.courseId} = ${courses.id}
        )`,
        totalStudents: sql<number>`(
          COALESCE(${courses.manualStudentCount}, (SELECT COUNT(*)::int FROM ${enrollments}
          WHERE ${enrollments.courseId} = ${courses.id} AND ${enrollments.status} = 'active'))
        )`,
        rating: courses.rating,
        ratingCount: courses.ratingCount,
        ratingSource: courses.ratingSource,
        bunnyPreviewVideoId: courses.bunnyPreviewVideoId,
        previewVideoSource: courses.previewVideoSource,
        previewExternalUrl: courses.previewExternalUrl,
        previewSlides: courses.previewSlides,
        publishAs: courses.publishAs,
        learningOutcomes: courses.learningOutcomes,
        requirements: courses.requirements,
        status: courses.status,
        // Detail-page content (per-course)
        facilities: courses.facilities,
        targetAudience: courses.targetAudience,
        certificatePerks: courses.certificatePerks,
        faq: courses.faq,
        quizCount: courses.quizCount,
        exerciseCount: courses.exerciseCount,
        hasLifetimeAccess: courses.hasLifetimeAccess,
        supportPhone: courses.supportPhone,
        paymentInstructions: courses.paymentInstructions,
        paymentGuideVideo: courses.paymentGuideVideo,
        certificateImage: courses.certificateImage,
        detailPageSections: courses.detailPageSections,
        template: courses.template,
        courseType: courses.courseType,
        bundleCurriculum: courses.bundleCurriculum,
        bundleCurriculumHeader: courses.bundleCurriculumHeader,
        masteryCheckoutImage: courses.masteryCheckoutImage,
        masterySectionOrder: courses.masterySectionOrder,
        socialProofImage: courses.socialProofImage,
        styleOverrides: courses.styleOverrides,
        batchInfo: courses.batchInfo,
        toolsInfo: courses.toolsInfo,
        toolsTitle: courses.toolsTitle,
        whyDifferentInfo: courses.whyDifferentInfo,
        instructorsInfo: courses.instructorsInfo,
        benefitsTitle: courses.benefitsTitle,
        benefitsInfo: courses.benefitsInfo,
        videoTestimonialsInfo: courses.videoTestimonialsInfo,
        testimonialsInfo: courses.testimonialsInfo,
        valueBreakdownInfo: courses.valueBreakdownInfo,
        categoryName: categories.name,
        categorySlug: categories.slug,
        instructorId: adminUsers.id,
        instructorFirstName: sql<string>`CASE WHEN ${courses.publishAs} = 'teacher' AND ${instructorProfiles.displayName} IS NOT NULL THEN ${instructorProfiles.displayName} ELSE ${adminUsers.firstName} END`,
        instructorLastName:  sql<string>`CASE WHEN ${courses.publishAs} = 'teacher' AND ${instructorProfiles.displayName} IS NOT NULL THEN '' ELSE ${adminUsers.lastName} END`,
        instructorAvatar:    sql<string | null>`CASE WHEN ${courses.publishAs} = 'teacher' AND ${instructorProfiles.displayAvatar} IS NOT NULL THEN ${instructorProfiles.displayAvatar} ELSE ${adminUsers.avatar} END`,
        instructorBio: instructorProfiles.bio,
        instructorExpertise: instructorProfiles.expertise,
        // Live counts derived from real data, not the static profile columns.
        instructorTotalStudents: sql<number>`(
          SELECT COUNT(DISTINCT ${enrollments.userId})::int FROM ${enrollments}
          INNER JOIN courses ic ON ${enrollments.courseId} = ic.id
          WHERE ic.instructor_id = ${adminUsers.id}
            AND ic.status = 'published'
            AND ${enrollments.status} = 'active'
        )`,
        instructorTotalCourses: sql<number>`(
          SELECT COUNT(*)::int FROM courses ic
          WHERE ic.instructor_id = ${adminUsers.id} AND ic.status = 'published'
        )`,
        instructorRating: instructorProfiles.rating,
      })
      .from(courses)
      .leftJoin(categories, eq(courses.categoryId, categories.id))
      .leftJoin(adminUsers, eq(courses.instructorId, adminUsers.id))
      .leftJoin(instructorProfiles, eq(adminUsers.id, instructorProfiles.userId))
      .where(and(eq(courses.slug, slug), eq(courses.status, 'published')))
      .limit(1);

    if (!course) throw new NotFoundException('Course not found');

    // Mastery bundle — fetch bundled courses
    let bundledCourses: Array<{ id: number; title: string; slug: string; price: string; discountPrice: string | null; thumbnail: string | null }> = [];
    if ((course as any).courseType === 'bundle') {
      const rows = await this.db
        .select({
          id: courses.id,
          title: courses.title,
          slug: courses.slug,
          price: courses.price,
          discountPrice: courses.discountPrice,
          thumbnail: courses.thumbnail,
        })
        .from(courseBundleItems)
        .innerJoin(courses, eq(courses.id, courseBundleItems.bundledCourseId))
        .where(eq(courseBundleItems.bundleCourseId, course.id))
        .orderBy(courseBundleItems.order);
      bundledCourses = rows;
    }
    return { ...course, bundledCourses };
  }

  async getCurriculum(courseId: number) {
    const mods = await this.db
      .select({ id: courseModules.id, title: courseModules.title, order: courseModules.order })
      .from(courseModules)
      .where(eq(courseModules.courseId, courseId))
      .orderBy(asc(courseModules.order));

    const allLessons = await this.db
      .select({
        id: lessons.id,
        moduleId: lessons.moduleId,
        title: lessons.title,
        type: lessons.type,
        duration: lessons.duration,
        isFree: lessons.isFree,
        order: lessons.order,
      })
      .from(lessons)
      .where(
        mods.length > 0
          ? sql`${lessons.moduleId} IN (${sql.join(mods.map((m) => sql`${m.id}`), sql`, `)})`
          : sql`false`,
      )
      .orderBy(asc(lessons.order));

    return mods.map((mod) => ({
      ...mod,
      lessons: allLessons.filter((l) => l.moduleId === mod.id),
    }));
  }

  /** Public — return all instructor profiles for the mentors page. */
  async getPublicInstructors() {
    const rows = await this.db
      .select({
        id:           instructorProfiles.id,
        displayName:  instructorProfiles.displayName,
        displayAvatar: instructorProfiles.displayAvatar,
        expertise:    instructorProfiles.expertise,
        bio:          instructorProfiles.bio,
        rating:       instructorProfiles.rating,
        totalStudents: instructorProfiles.totalStudents,
        totalCourses: instructorProfiles.totalCourses,
        firstName:    adminUsers.firstName,
        lastName:     adminUsers.lastName,
        avatar:       adminUsers.avatar,
      })
      .from(instructorProfiles)
      .innerJoin(adminUsers, eq(instructorProfiles.userId, adminUsers.id))
      .orderBy(asc(instructorProfiles.id));

    return rows.map((r) => ({
      id:           r.id,
      name:         r.displayName || `${r.firstName ?? ''} ${r.lastName ?? ''}`.trim(),
      image:        r.displayAvatar || r.avatar || '',
      expertise:    r.expertise || '',
      bio:          r.bio || '',
      rating:       r.rating,
      totalStudents: r.totalStudents,
      totalCourses: r.totalCourses,
    }));
  }

  /** Public — return all admin-curated text reviews across all courses for the landing page testimonials. */
  async getFeaturedReviews() {
    const rows = await this.db
      .select({
        id: reviews.id,
        rating: reviews.rating,
        comment: reviews.comment,
        displayName: reviews.displayName,
        displayRole: reviews.displayRole,
        displayAvatar: reviews.displayAvatar,
      })
      .from(reviews)
      .where(and(eq(reviews.source, 'admin_curated'), eq(reviews.reviewType, 'text')))
      .orderBy(desc(reviews.createdAt));

    return rows;
  }

  async getReviews(courseId: number) {
    // LEFT JOIN — admin-curated rows have userId=null. The display name /
    // avatar / role for those rows comes from the curated display* columns.
    const rows = await this.db
      .select({
        id: reviews.id,
        rating: reviews.rating,
        comment: reviews.comment,
        createdAt: reviews.createdAt,
        source: reviews.source,
        reviewType: reviews.reviewType,
        videoUrl: reviews.videoUrl,
        videoThumbnail: reviews.videoThumbnail,
        // For student-submitted rows
        userId: users.id,
        userFirstName: users.firstName,
        userLastName: users.lastName,
        userAvatar: users.avatar,
        // For admin-curated rows
        displayName: reviews.displayName,
        displayRole: reviews.displayRole,
        displayAvatar: reviews.displayAvatar,
      })
      .from(reviews)
      .leftJoin(users, eq(reviews.userId, users.id))
      .where(eq(reviews.courseId, courseId))
      .orderBy(desc(reviews.createdAt));

    const total = rows.length;
    const avg = total > 0 ? rows.reduce((s, r) => s + r.rating, 0) / total : 0;

    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    rows.forEach((r) => { distribution[r.rating] = (distribution[r.rating] ?? 0) + 1; });

    return { avg: parseFloat(avg.toFixed(1)), total, distribution, reviews: rows };
  }

  /**
   * Recompute `courses.rating` (cached column) from all reviews — both
   * student-submitted and admin-curated. Called after any review mutation.
   */
  private async recomputeCourseRating(courseId: number) {
    // Skip if course uses manual/static rating
    const [course] = await this.db
      .select({ ratingSource: courses.ratingSource })
      .from(courses)
      .where(eq(courses.id, courseId));
    if (course?.ratingSource === 'static') return;

    const [row] = await this.db
      .select({ avg: sql<string>`COALESCE(AVG(${reviews.rating}), 0)::numeric(3,2)` })
      .from(reviews)
      .where(eq(reviews.courseId, courseId));

    await this.db
      .update(courses)
      .set({ rating: row?.avg ?? '0.00', updatedAt: new Date() })
      .where(eq(courses.id, courseId));

    // Any review change moves both the landing rating and the featured-reviews list.
    this.revalidation.revalidate([CacheTag.courses, CacheTag.featuredReviews]);
  }

  /** Admin — list every review (organic + curated) for a single course. */
  async listReviewsForAdmin(courseId: number) {
    return this.getReviews(courseId);
  }

  /** Admin — add a curated review (text or video). */
  async createCuratedReview(
    courseId: number,
    data: {
      rating: number;
      reviewType: 'text' | 'video';
      displayName: string;
      displayRole?: string | null;
      displayAvatar?: string | null;
      comment?: string | null;
      videoUrl?: string | null;
      videoThumbnail?: string | null;
    },
  ) {
    const [row] = await this.db
      .insert(reviews)
      .values({
        userId: null,
        courseId,
        rating: data.rating,
        source: 'admin_curated',
        reviewType: data.reviewType,
        displayName: data.displayName.trim(),
        displayRole: data.displayRole ?? null,
        displayAvatar: data.displayAvatar ?? null,
        comment: data.comment ?? null,
        videoUrl: data.videoUrl ?? null,
        videoThumbnail: data.videoThumbnail ?? null,
      })
      .returning();

    await this.recomputeCourseRating(courseId);
    return row;
  }

  /** Admin — update an existing curated review. */
  async updateCuratedReview(
    reviewId: number,
    data: Partial<{
      rating: number;
      reviewType: 'text' | 'video';
      displayName: string;
      displayRole: string | null;
      displayAvatar: string | null;
      comment: string | null;
      videoUrl: string | null;
      videoThumbnail: string | null;
    }>,
  ) {
    const [existing] = await this.db
      .select()
      .from(reviews)
      .where(eq(reviews.id, reviewId))
      .limit(1);
    if (!existing) throw new NotFoundException('Review not found');
    if (existing.source !== 'admin_curated') {
      throw new ForbiddenException('Only admin-curated reviews can be edited');
    }

    const [row] = await this.db
      .update(reviews)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(reviews.id, reviewId))
      .returning();

    await this.recomputeCourseRating(existing.courseId);
    return row;
  }

  /** Admin — delete any review (organic OR curated). */
  async deleteReview(reviewId: number) {
    const [existing] = await this.db
      .select()
      .from(reviews)
      .where(eq(reviews.id, reviewId))
      .limit(1);
    if (!existing) throw new NotFoundException('Review not found');

    await this.db.delete(reviews).where(eq(reviews.id, reviewId));
    await this.recomputeCourseRating(existing.courseId);
    return { deleted: true };
  }

  async getStats() {
    const [totalCourses] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(courses)
      .where(eq(courses.status, 'published'));

    const [totalStudents] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(enrollments)
      .where(eq(enrollments.status, 'active'));

    const [totalInstructors] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(adminUsers);

    return {
      totalCourses: Number(totalCourses?.count ?? 0),
      totalStudents: Number(totalStudents?.count ?? 0),
      totalInstructors: Number(totalInstructors?.count ?? 0),
    };
  }

  async findInstructors() {
    // Public mentors directory: only active accounts with the INSTRUCTOR role
    // (excludes SUPER_ADMIN and other staff admins). Prefer the teacher display
    // identity (displayName/displayAvatar) over the admin login name/avatar.
    return this.db
      .select({
        id: adminUsers.id,
        firstName: sql<string>`CASE WHEN ${instructorProfiles.displayName} IS NOT NULL AND ${instructorProfiles.displayName} <> '' THEN ${instructorProfiles.displayName} ELSE ${adminUsers.firstName} END`,
        lastName: sql<string>`CASE WHEN ${instructorProfiles.displayName} IS NOT NULL AND ${instructorProfiles.displayName} <> '' THEN '' ELSE ${adminUsers.lastName} END`,
        avatar: sql<string | null>`COALESCE(${instructorProfiles.displayAvatar}, ${adminUsers.avatar})`,
        bio: instructorProfiles.bio,
        expertise: instructorProfiles.expertise,
        totalStudents: instructorProfiles.totalStudents,
        totalCourses: instructorProfiles.totalCourses,
        rating: instructorProfiles.rating,
      })
      .from(adminUsers)
      .leftJoin(instructorProfiles, eq(adminUsers.id, instructorProfiles.userId))
      .where(
        and(
          eq(adminUsers.status, 'active'),
          eq(adminUsers.role, 'INSTRUCTOR'),
        ),
      );
  }

  async findInstructorById(id: number) {
    const [instructor] = await this.db
      .select({
        id: adminUsers.id,
        firstName: sql<string>`CASE WHEN ${instructorProfiles.displayName} IS NOT NULL AND ${instructorProfiles.displayName} <> '' THEN ${instructorProfiles.displayName} ELSE ${adminUsers.firstName} END`,
        lastName: sql<string>`CASE WHEN ${instructorProfiles.displayName} IS NOT NULL AND ${instructorProfiles.displayName} <> '' THEN '' ELSE ${adminUsers.lastName} END`,
        avatar: sql<string | null>`COALESCE(${instructorProfiles.displayAvatar}, ${adminUsers.avatar})`,
        bio: instructorProfiles.bio,
        expertise: instructorProfiles.expertise,
        totalStudents: instructorProfiles.totalStudents,
        totalCourses: instructorProfiles.totalCourses,
        rating: instructorProfiles.rating,
        socialLinks: instructorProfiles.socialLinks,
      })
      .from(adminUsers)
      .leftJoin(instructorProfiles, eq(adminUsers.id, instructorProfiles.userId))
      .where(and(eq(adminUsers.id, id), eq(adminUsers.role, 'INSTRUCTOR')))
      .limit(1);

    if (!instructor) throw new NotFoundException('Instructor not found');

    const instructorCourses = await this.db
      .select()
      .from(courses)
      .where(and(eq(courses.instructorId, id), eq(courses.status, 'published')));

    return { ...instructor, courses: instructorCourses };
  }

  // ─── Instructor ───────────────────────────────────────────────────────────

  /** Owned-or-assigned condition for "my courses"-style listings — see `canEditCourse`. */
  private async myCoursesCondition(instructorId: number) {
    const assignedIds = await getAssignedCourseIds(this.db, instructorId);
    return assignedIds.length > 0
      ? or(eq(courses.instructorId, instructorId), inArray(courses.id, assignedIds))
      : eq(courses.instructorId, instructorId);
  }

  async findInstructorCourses(instructorId: number) {
    return this.db
      .select({
        ...getTableColumns(courses),
        totalLessons: sql<number>`(
          SELECT COUNT(*)::int FROM lessons
          INNER JOIN course_modules ON lessons.module_id = course_modules.id
          WHERE course_modules.course_id = courses.id
        )`,
        totalDuration: sql<number>`(
          SELECT COALESCE(SUM(lessons.duration), 0)::int FROM lessons
          INNER JOIN course_modules ON lessons.module_id = course_modules.id
          WHERE course_modules.course_id = courses.id
        )`,
        totalStudents: sql<number>`(
          COALESCE(courses.manual_student_count, (SELECT COUNT(*)::int FROM enrollments
          WHERE enrollments.course_id = courses.id AND enrollments.status = 'active'))
        )`,
      })
      .from(courses)
      .where(await this.myCoursesCondition(instructorId))
      .orderBy(desc(courses.createdAt));
  }

  async getInstructorStats(instructorId: number) {
    const myCourses = await this.db
      .select({ id: courses.id, status: courses.status })
      .from(courses)
      .where(await this.myCoursesCondition(instructorId));

    const totalCourses = myCourses.length;
    const publishedCourses = myCourses.filter((c) => c.status === 'published').length;
    const draftCourses = myCourses.filter((c) => c.status === 'draft').length;

    const courseIds = myCourses.map((c) => c.id);

    let totalStudents = 0;
    let totalRevenue = 0;

    if (courseIds.length > 0) {
      const inClause = sql`${enrollments.courseId} IN (${sql.join(courseIds.map((id) => sql`${id}`), sql`, `)})`;

      const [studentRow] = await this.db
        .select({ count: sql<number>`count(*)` })
        .from(enrollments)
        .where(and(eq(enrollments.status, 'active'), inClause));
      totalStudents = Number(studentRow?.count ?? 0);

      const revenueRows = await this.db
        .select({ price: orderItems.price })
        .from(orderItems)
        .innerJoin(orders, eq(orderItems.orderId, orders.id))
        .where(
          and(
            eq(orders.status, 'paid'),
            sql`${orderItems.courseId} IN (${sql.join(courseIds.map((id) => sql`${id}`), sql`, `)})`,
          ),
        );
      totalRevenue = revenueRows.reduce((sum, r) => sum + Number(r.price ?? 0), 0);
    }

    const avgRow = courseIds.length > 0
      ? (
          await this.db
            .select({ avg: sql<string>`COALESCE(AVG(${reviews.rating}), 0)` })
            .from(reviews)
            .where(inArray(reviews.courseId, courseIds))
        )[0]
      : undefined;

    return {
      totalCourses,
      publishedCourses,
      draftCourses,
      totalStudents,
      totalRevenue: totalRevenue.toFixed(2),
      avgRating: avgRow && Number(avgRow.avg) > 0 ? Number(avgRow.avg).toFixed(1) : null,
    };
  }

  async getInstructorCurriculum(courseId: number, instructorId: number, isAdmin = false) {
    // Verify ownership
    await this.findByIdForInstructor(courseId, instructorId, isAdmin);

    const mods = await this.db
      .select({ id: courseModules.id, title: courseModules.title, order: courseModules.order })
      .from(courseModules)
      .where(eq(courseModules.courseId, courseId))
      .orderBy(asc(courseModules.order));

    const allLessons = await this.db
      .select()
      .from(lessons)
      .where(
        mods.length > 0
          ? sql`${lessons.moduleId} IN (${sql.join(mods.map((m) => sql`${m.id}`), sql`, `)})`
          : sql`false`,
      )
      .orderBy(asc(lessons.order));

    // Self-heal Bunny status: a lesson is marked 'processing' on upload and is
    // meant to flip to 'ready' via Bunny's encoding webhook. If that webhook was
    // missed (e.g. unreachable in local dev), the row stays stale. Ask Bunny
    // directly for any not-yet-ready Bunny lesson and persist the real state, so
    // the curriculum builder reflects reality without depending on the webhook.
    const pending = allLessons.filter(
      (l) => l.videoSource === 'bunny' && l.bunnyVideoId && l.bunnyStatus !== 'ready',
    );
    if (pending.length > 0) {
      await Promise.all(
        pending.map(async (l) => {
          const live = await this.bunny.getVideoStatus(l.bunnyVideoId!);
          if (live.state === l.bunnyStatus) return;
          const updates: Partial<typeof lessons.$inferInsert> = {
            bunnyStatus: live.state,
            updatedAt: new Date(),
          };
          if (live.duration) updates.duration = live.duration;
          await this.db.update(lessons).set(updates).where(eq(lessons.id, l.id));
          l.bunnyStatus = live.state;
          if (live.duration) l.duration = live.duration;
        }),
      );
    }

    return mods.map((mod) => ({
      ...mod,
      lessons: allLessons.filter((l) => l.moduleId === mod.id),
    }));
  }

  async findByIdForInstructor(id: number, instructorId: number, isAdmin = false) {
    const [course] = await this.db
      .select()
      .from(courses)
      .where(eq(courses.id, id))
      .limit(1);

    if (!course) throw new NotFoundException('Course not found');
    if (!(await canEditCourse(this.db, id, course.instructorId, instructorId, isAdmin))) {
      throw new NotFoundException('Course not found');
    }
    // Include bundled courses for Mastery bundle editing
    let bundledCourses: Array<{ id: number; title: string; slug: string; price: string; thumbnail: string | null }> = [];
    if ((course as any).courseType === 'bundle') {
      const rows = await this.db
        .select({ id: courses.id, title: courses.title, slug: courses.slug, price: courses.price, thumbnail: courses.thumbnail })
        .from(courseBundleItems)
        .innerJoin(courses, eq(courses.id, courseBundleItems.bundledCourseId))
        .where(eq(courseBundleItems.bundleCourseId, id))
        .orderBy(courseBundleItems.order);
      bundledCourses = rows as any;
    }
    return { ...course, bundledCourses } as typeof course & { bundledCourses: typeof bundledCourses };
  }

  async create(instructorId: number, dto: CreateCourseDto) {
    // Mastery-only bundle guard
    const wantsBundle = (dto as any).courseType === 'bundle';
    const template = (dto as any).template ?? '2';
    if (wantsBundle && template !== '2') {
      throw new BadRequestException('Bundles are only allowed with Mastery template (template=2)');
    }
    if (wantsBundle) {
      const ids = (dto as any).bundledCourseIds as number[] | undefined;
      if (!ids || ids.length === 0) throw new BadRequestException('A bundle must include at least one course');
    }

    // Insert first with a temp slug to get the ID, then update with unique slug
    const tempSlug = `${toSlug(dto.title)}-${Date.now()}`;

    const [course] = await this.db
      .insert(courses)
      .values({
        instructorId,
        categoryId: dto.categoryId,
        title: dto.title,
        slug: tempSlug,
        description: dto.description,
        price: String(dto.price ?? 0),
        discountPrice: dto.discountPrice ? String(dto.discountPrice) : null,
        level: dto.level ?? 'beginner',
        language: dto.language ?? 'English',
        showBadge: dto.showBadge ?? true,
        template: (dto as any).template ?? '2',
        courseType: (dto as any).courseType ?? 'single',
        bundleCurriculum: (dto as any).bundleCurriculum ?? [],
        bundleCurriculumHeader: (dto as any).bundleCurriculumHeader ?? { title: "কোর্স কারিকুলাম", moduleLabel: "মডিউল", courseTypeLabel: "রেকর্ডেড কোর্স" },
        masteryCheckoutImage: (dto as any).masteryCheckoutImage ?? null,
      })
      .returning();

    // Bundle items (Mastery only)
    if (wantsBundle) {
      const ids = (dto as any).bundledCourseIds as number[];
      // prevent self-reference (course.id not yet in list, but guard anyway)
      const clean = [...new Set(ids)].filter((id) => id !== course.id);
      if (clean.length > 0) {
        await this.db.insert(courseBundleItems).values(
          clean.map((bundledCourseId, idx) => ({ bundleCourseId: course.id, bundledCourseId, order: idx })),
        );
      }
    }

    // Update slug to include ID for guaranteed uniqueness
    const finalSlug = toUniqueSlug(dto.title, course.id);
    const [updated] = await this.db
      .update(courses)
      .set({ slug: finalSlug })
      .where(eq(courses.id, course.id))
      .returning();

    this.revalidation.revalidate([CacheTag.courses]);
    void this.activityLogs.log({ adminUserId: instructorId, action: 'course_created', entity: 'course', entityId: updated.id, meta: { title: updated.title } });
    return updated;
  }

  async update(id: number, instructorId: number, dto: UpdateCourseDto, isAdmin = false) {
    await this.findByIdForInstructor(id, instructorId, isAdmin);

    const updates: Partial<typeof courses.$inferInsert> = {};
    if (dto.title) {
      updates.title = dto.title;
      updates.slug = toUniqueSlug(dto.title, id);
    }
    if (dto.description !== undefined) updates.description = dto.description;
    if (dto.shortDescription !== undefined) updates.shortDescription = dto.shortDescription;
    if (dto.categoryId !== undefined) updates.categoryId = dto.categoryId;
    if (dto.price !== undefined) updates.price = String(dto.price);
    if (dto.discountPrice !== undefined) updates.discountPrice = dto.discountPrice ? String(dto.discountPrice) : null;
    if (dto.level !== undefined) updates.level = dto.level;
    if (dto.language !== undefined) updates.language = dto.language;
    if (dto.thumbnail !== undefined) updates.thumbnail = dto.thumbnail ?? null;
    if (dto.isFeatured !== undefined) updates.isFeatured = dto.isFeatured;
    if (dto.isUnlisted !== undefined) updates.isUnlisted = dto.isUnlisted;
    if (dto.slug !== undefined) updates.slug = dto.slug || undefined;
    if (dto.showBadge !== undefined) updates.showBadge = dto.showBadge;
    if (dto.status !== undefined) updates.status = dto.status;
    if (dto.learningOutcomes !== undefined) updates.learningOutcomes = dto.learningOutcomes;
    if (dto.requirements !== undefined) updates.requirements = dto.requirements;
    // Detail-page content (per-course)
    if (dto.facilities !== undefined)          updates.facilities = dto.facilities;
    if (dto.targetAudience !== undefined)      updates.targetAudience = dto.targetAudience;
    if (dto.certificatePerks !== undefined)    updates.certificatePerks = dto.certificatePerks;
    if (dto.faq !== undefined)                 updates.faq = dto.faq;
    if (dto.quizCount !== undefined)           updates.quizCount = dto.quizCount;
    if (dto.exerciseCount !== undefined)       updates.exerciseCount = dto.exerciseCount;
    if (dto.hasLifetimeAccess !== undefined)   updates.hasLifetimeAccess = dto.hasLifetimeAccess;
    if (dto.accessDurationDays !== undefined)  updates.accessDurationDays = dto.accessDurationDays;
    if (dto.supportPhone !== undefined)        updates.supportPhone = dto.supportPhone;
    if (dto.paymentInstructions !== undefined) updates.paymentInstructions = dto.paymentInstructions;
    if (dto.paymentGuideVideo !== undefined)   updates.paymentGuideVideo = dto.paymentGuideVideo;
    if (dto.certificateImage !== undefined)    updates.certificateImage = dto.certificateImage;
    if (dto.detailPageSections !== undefined)  updates.detailPageSections = dto.detailPageSections;
    if (dto.previewSlides !== undefined)       updates.previewSlides = dto.previewSlides;
    if (dto.publishAs   !== undefined)         updates.publishAs = dto.publishAs;
    if (dto.requireSequentialProgress !== undefined) updates.requireSequentialProgress = dto.requireSequentialProgress;
    if (dto.template !== undefined) updates.template = dto.template;
    if ((dto as any).courseType !== undefined) {
      const ct = (dto as any).courseType as string;
      const effectiveTemplate = (dto as any).template ?? (await this.db.select({ template: courses.template }).from(courses).where(eq(courses.id, id)).then(r=>r[0]?.template)) ?? '1';
      if (ct === 'bundle' && effectiveTemplate !== '2') throw new BadRequestException('Bundles are only allowed with Mastery template (template=2)');
      (updates as any).courseType = ct;
    }
    if (dto.socialProofImage !== undefined) updates.socialProofImage = dto.socialProofImage ?? null;
    if (dto.styleOverrides !== undefined) updates.styleOverrides = dto.styleOverrides;
    if (dto.batchInfo !== undefined) updates.batchInfo = dto.batchInfo;
    if (dto.toolsInfo !== undefined) updates.toolsInfo = dto.toolsInfo;
    if (dto.toolsTitle !== undefined) updates.toolsTitle = dto.toolsTitle;
    if (dto.whyDifferentInfo !== undefined) updates.whyDifferentInfo = dto.whyDifferentInfo;
    if (dto.instructorsInfo !== undefined) updates.instructorsInfo = dto.instructorsInfo;
    if (dto.benefitsTitle !== undefined) updates.benefitsTitle = dto.benefitsTitle;
    if (dto.benefitsInfo !== undefined) updates.benefitsInfo = dto.benefitsInfo;
    if (dto.videoTestimonialsInfo !== undefined) updates.videoTestimonialsInfo = dto.videoTestimonialsInfo;
    if (dto.testimonialsInfo !== undefined) updates.testimonialsInfo = dto.testimonialsInfo;
    if (dto.valueBreakdownInfo !== undefined) updates.valueBreakdownInfo = dto.valueBreakdownInfo;
    if ((dto as any).bundleCurriculum !== undefined) (updates as any).bundleCurriculum = (dto as any).bundleCurriculum as any;
    if ((dto as any).bundleCurriculumHeader !== undefined) (updates as any).bundleCurriculumHeader = (dto as any).bundleCurriculumHeader as any;
    if ((dto as any).masteryCheckoutImage !== undefined) (updates as any).masteryCheckoutImage = (dto as any).masteryCheckoutImage ? String((dto as any).masteryCheckoutImage) : null;
    if ((dto as any).masterySectionOrder !== undefined) (updates as any).masterySectionOrder = (dto as any).masterySectionOrder as any;
    if (dto.manualStudentCount !== undefined) updates.manualStudentCount = dto.manualStudentCount ?? null;
    if (dto.rating !== undefined) updates.rating = String(dto.rating);
    if (dto.ratingCount !== undefined) updates.ratingCount = dto.ratingCount;
    if (dto.ratingSource !== undefined) updates.ratingSource = dto.ratingSource;
    updates.updatedAt = new Date();

    const [updated] = await this.db
      .update(courses)
      .set(updates)
      .where(eq(courses.id, id))
      .returning();

    // Bundle items upsert (Mastery only)
    if ((dto as any).bundledCourseIds !== undefined) {
      const ids = (dto as any).bundledCourseIds as number[];
      if (updated.courseType === 'bundle' && (!ids || ids.length === 0)) {
        throw new BadRequestException('A bundle must include at least one course');
      }
      if (updated.courseType === 'bundle' && ids.includes(id)) {
        throw new BadRequestException('A course cannot bundle itself');
      }
      await this.db.delete(courseBundleItems).where(eq(courseBundleItems.bundleCourseId, id));
      if (updated.courseType === 'bundle' && ids.length > 0) {
        const clean = [...new Set(ids)].filter(v => v !== id);
        await this.db.insert(courseBundleItems).values(clean.map((bundledCourseId, idx) => ({ bundleCourseId: id, bundledCourseId, order: idx })));
      }
    } else if ((dto as any).courseType === 'single') {
      // switched to single -> clear bundles
      await this.db.delete(courseBundleItems).where(eq(courseBundleItems.bundleCourseId, id));
    }

    this.revalidation.revalidate([CacheTag.courses]);
    void this.activityLogs.log({ adminUserId: instructorId, action: 'course_updated', entity: 'course', entityId: id });
    return updated;
  }

  async duplicate(courseId: number, instructorId: number, includeCurriculum: boolean, isAdmin = false) {
    const original = await this.findByIdForInstructor(courseId, instructorId, isAdmin);

    const newTitle = `Copy of ${original.title}`;
    const tempSlug = `${toSlug(newTitle)}-${Date.now()}`;

    const [newCourse] = await this.db
      .insert(courses)
      .values({
        instructorId,
        categoryId:          original.categoryId,
        title:               newTitle,
        slug:                tempSlug,
        description:         original.description,
        price:               original.price,
        discountPrice:       original.discountPrice,
        level:               original.level,
        language:            original.language,
        thumbnail:           original.thumbnail,
        status:              'draft',
        publishAs:           original.publishAs,
        learningOutcomes:    original.learningOutcomes,
        requirements:        original.requirements,
        facilities:          original.facilities as any,
        targetAudience:      original.targetAudience,
        certificatePerks:    original.certificatePerks as any,
        faq:                 original.faq as any,
        quizCount:           original.quizCount,
        exerciseCount:       original.exerciseCount,
        hasLifetimeAccess:   original.hasLifetimeAccess,
        accessDurationDays:  original.accessDurationDays,
        supportPhone:        original.supportPhone,
        paymentInstructions: original.paymentInstructions,
        paymentGuideVideo:   original.paymentGuideVideo,
        certificateImage:    original.certificateImage,
        detailPageSections:  original.detailPageSections as any,
        previewSlides:       original.previewSlides as any,
        previewVideoSource:  original.previewVideoSource,
        previewExternalUrl:  original.previewExternalUrl,
        bunnyPreviewVideoId: original.bunnyPreviewVideoId,
      })
      .returning();

    const finalSlug = toUniqueSlug(newTitle, newCourse.id);
    const [updated] = await this.db
      .update(courses)
      .set({ slug: finalSlug })
      .where(eq(courses.id, newCourse.id))
      .returning();

    if (includeCurriculum) {
      const mods = await this.db
        .select()
        .from(courseModules)
        .where(eq(courseModules.courseId, courseId))
        .orderBy(asc(courseModules.order));

      if (mods.length > 0) {
        const allLessons = await this.db
          .select()
          .from(lessons)
          .where(sql`${lessons.moduleId} IN (${sql.join(mods.map((m) => sql`${m.id}`), sql`, `)})`)
          .orderBy(asc(lessons.order));

        for (const mod of mods) {
          const [newMod] = await this.db
            .insert(courseModules)
            .values({ courseId: newCourse.id, title: mod.title, order: mod.order })
            .returning();

          const modLessons = allLessons.filter((l) => l.moduleId === mod.id);
          if (modLessons.length > 0) {
            await this.db.insert(lessons).values(
              modLessons.map((l) => ({
                moduleId:        newMod.id,
                title:           l.title,
                type:            l.type,
                videoSource:     l.videoSource,
                bunnyVideoId:    l.bunnyVideoId,
                bunnyStatus:     l.bunnyStatus,
                externalVideoUrl: l.externalVideoUrl,
                duration:        l.duration,
                content:         l.content,
                isFree:          l.isFree,
                order:           l.order,
              })),
            );
          }
        }
      }
    }

    this.revalidation.revalidate([CacheTag.courses]);
    void this.activityLogs.log({ adminUserId: instructorId, action: 'course_created', entity: 'course', entityId: updated.id, meta: { title: updated.title, duplicatedFrom: courseId } });
    return updated;
  }

  /** Soft-delete — moves the course to Trash. Reversible via restore(). */
  async remove(id: number, instructorId: number, isAdmin = false) {
    await this.findByIdForInstructor(id, instructorId, isAdmin);

    const [updated] = await this.db
      .update(courses)
      .set({ status: 'trash', updatedAt: new Date() })
      .where(eq(courses.id, id))
      .returning();

    this.revalidation.revalidate([CacheTag.courses]);
    void this.activityLogs.log({ adminUserId: instructorId, action: 'course_trashed', entity: 'course', entityId: id });
    return updated;
  }

  /** Restores a trashed course back to Draft. */
  async restore(id: number, instructorId: number, isAdmin = false) {
    const course = await this.findByIdForInstructor(id, instructorId, isAdmin);
    if (course.status !== 'trash') throw new ForbiddenException('Course is not in Trash');

    const [updated] = await this.db
      .update(courses)
      .set({ status: 'draft', updatedAt: new Date() })
      .where(eq(courses.id, id))
      .returning();

    this.revalidation.revalidate([CacheTag.courses]);
    void this.activityLogs.log({ adminUserId: instructorId, action: 'course_restored', entity: 'course', entityId: id });
    return updated;
  }

  /** Permanently deletes a trashed course — only callable from the Trash view. */
  async purge(id: number, instructorId: number, isAdmin = false) {
    const course = await this.findByIdForInstructor(id, instructorId, isAdmin);
    if (course.status !== 'trash') throw new ForbiddenException('Only trashed courses can be permanently deleted');

    // Clean up every lesson's Bunny video before the DB cascade drops the
    // modules/lessons (otherwise the videos are orphaned in Bunny).
    const vids = await this.db
      .select({ bunnyVideoId: lessons.bunnyVideoId })
      .from(lessons)
      .innerJoin(courseModules, eq(lessons.moduleId, courseModules.id))
      .where(eq(courseModules.courseId, id));
    await Promise.all(
      vids
        .filter((v) => v.bunnyVideoId)
        .map((v) => this.bunny.deleteVideo(v.bunnyVideoId as string)),
    );

    await this.db.delete(courses).where(eq(courses.id, id));
    this.revalidation.revalidate([CacheTag.courses]);
    void this.activityLogs.log({ adminUserId: instructorId, action: 'course_purged', entity: 'course', entityId: id });
    return { deleted: true };
  }

  /** Sets status to 'scheduled' — CoursesSchedulerService auto-publishes at publishAt. */
  async schedulePublish(id: number, instructorId: number, publishAt: Date, isAdmin = false) {
    await this.findByIdForInstructor(id, instructorId, isAdmin);
    const [updated] = await this.db
      .update(courses)
      .set({ status: 'scheduled', publishAt, updatedAt: new Date() })
      .where(eq(courses.id, id))
      .returning();
    this.revalidation.revalidate([CacheTag.courses]);
    void this.activityLogs.log({ adminUserId: instructorId, action: 'course_scheduled', entity: 'course', entityId: id, meta: { publishAt } });
    return updated;
  }

  /** Cancels a scheduled publish, reverting to Draft. */
  async unschedule(id: number, instructorId: number, isAdmin = false) {
    await this.findByIdForInstructor(id, instructorId, isAdmin);
    const [updated] = await this.db
      .update(courses)
      .set({ status: 'draft', publishAt: null, updatedAt: new Date() })
      .where(eq(courses.id, id))
      .returning();
    this.revalidation.revalidate([CacheTag.courses]);
    void this.activityLogs.log({ adminUserId: instructorId, action: 'course_unscheduled', entity: 'course', entityId: id });
    return updated;
  }

  async publish(id: number, instructorId: number, isAdmin = false) {
    await this.findByIdForInstructor(id, instructorId, isAdmin);
    const [updated] = await this.db
      .update(courses)
      .set({ status: 'published', updatedAt: new Date() })
      .where(eq(courses.id, id))
      .returning();
    this.revalidation.revalidate([CacheTag.courses]);
    void this.activityLogs.log({ adminUserId: instructorId, action: 'course_published', entity: 'course', entityId: id });
    return updated;
  }

  async unpublish(id: number, instructorId: number, isAdmin = false) {
    await this.findByIdForInstructor(id, instructorId, isAdmin);
    const [updated] = await this.db
      .update(courses)
      .set({ status: 'draft', updatedAt: new Date() })
      .where(eq(courses.id, id))
      .returning();
    this.revalidation.revalidate([CacheTag.courses]);
    void this.activityLogs.log({ adminUserId: instructorId, action: 'course_unpublished', entity: 'course', entityId: id });
    return updated;
  }

  // ─── Admin ────────────────────────────────────────────────────────────────

  async findAllAdmin(params: TableQueryInput = {}, adminUserId?: number, isAdmin = false) {
    const q = buildTableQuery(params, {
      searchable: [courses.title, courses.slug],
      sortable: {
        title: courses.title,
        price: courses.price,
        createdAt: courses.createdAt,
        totalStudents: courses.totalStudents,
      },
      filterable: {
        status: (v) => eq(courses.status, v as 'draft' | 'published' | 'archived' | 'inactive' | 'scheduled' | 'trash'),
      },
      dateColumn: courses.createdAt,
      defaultSort: desc(courses.createdAt),
    });

    // Roles restricted to `edit_assigned_courses` only ever see their own
    // assigned/owned courses in this table too — not the full catalog.
    const listableIds = adminUserId !== undefined
      ? await getListableCourseIds(this.db, adminUserId, isAdmin)
      : null;
    const scopeCondition = listableIds !== null
      ? (listableIds.length > 0 ? inArray(courses.id, listableIds) : sql`false`)
      : undefined;
    // Trash is hidden from the default list — only shown when explicitly
    // filtering status=trash (the admin's dedicated Trash view).
    const trashCondition = params.status ? undefined : ne(courses.status, 'trash');
    const where = and(...[q.where, scopeCondition, trashCondition].filter(Boolean) as SQL[]);

    const [rows, [countRow]] = await Promise.all([
      this.db
        .select({
          id: courses.id,
          title: courses.title,
          slug: courses.slug,
          status: courses.status,
          isFeatured: courses.isFeatured,
          isUnlisted: courses.isUnlisted,
          price: courses.price,
          totalStudents: sql<number>`(
            COALESCE(${courses.manualStudentCount}, (SELECT COUNT(*)::int FROM ${enrollments}
            WHERE ${enrollments.courseId} = ${courses.id} AND ${enrollments.status} = 'active'))
          )`,
          rating: courses.rating,
          createdAt: courses.createdAt,
          instructorFirstName: adminUsers.firstName,
          instructorLastName: adminUsers.lastName,
          categoryName: categories.name,
          template: courses.template,
        })
        .from(courses)
        .leftJoin(adminUsers, eq(courses.instructorId, adminUsers.id))
        .leftJoin(categories, eq(courses.categoryId, categories.id))
        .where(where)
        .orderBy(q.orderBy)
        .limit(q.limit)
        .offset(q.offset),
      this.db
        .select({ count: sql<number>`COUNT(*)`.mapWith(Number) })
        .from(courses)
        .where(where),
    ]);

    return formatPaginatedResponse(rows, countRow?.count ?? 0, q.page, q.perPage);
  }

  async adminUpdateStatus(id: number, status: 'published' | 'inactive') {
    const [course] = await this.db
      .select()
      .from(courses)
      .where(eq(courses.id, id))
      .limit(1);
    if (!course) throw new NotFoundException('Course not found');

    const [updated] = await this.db
      .update(courses)
      .set({ status, updatedAt: new Date() })
      .where(eq(courses.id, id))
      .returning();

    this.revalidation.revalidate([CacheTag.courses]);
    void this.activityLogs.log({ action: 'course_status_updated', entity: 'course', entityId: id, meta: { status } });
    return updated;
  }

  async toggleFeatured(id: number) {
    const [course] = await this.db
      .select()
      .from(courses)
      .where(eq(courses.id, id))
      .limit(1);
    if (!course) throw new NotFoundException('Course not found');

    const [updated] = await this.db
      .update(courses)
      .set({ isFeatured: !course.isFeatured, updatedAt: new Date() })
      .where(eq(courses.id, id))
      .returning();

    this.revalidation.revalidate([CacheTag.courses]);
    void this.activityLogs.log({ action: 'course_featured_toggled', entity: 'course', entityId: id, meta: { isFeatured: updated.isFeatured } });
    return updated;
  }

  async submitReview(userId: number, courseId: number, data: { rating: number; comment?: string }) {
    const result = await this.submitReviewInner(userId, courseId, data);
    await this.recomputeCourseRating(courseId);
    return result;
  }

  private async submitReviewInner(userId: number, courseId: number, data: { rating: number; comment?: string }) {
    // Check if enrolled
    const [enrollment] = await this.db
      .select()
      .from(enrollments)
      .where(and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId)))
      .limit(1);
    if (!enrollment) throw new ForbiddenException('You must be enrolled to review');

    // Upsert review using onConflictDoUpdate
    await this.db
      .insert(reviews)
      .values({ userId, courseId, rating: data.rating, comment: data.comment })
      .onConflictDoUpdate({
        target: [reviews.userId, reviews.courseId],
        set: { rating: data.rating, comment: data.comment, updatedAt: new Date() },
      });

    // Update course avg rating
    const allReviews = await this.db
      .select({ rating: reviews.rating })
      .from(reviews)
      .where(eq(reviews.courseId, courseId));
    const avg = allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length;
    await this.db
      .update(courses)
      .set({ rating: String(avg.toFixed(2)) })
      .where(eq(courses.id, courseId));

    return { submitted: true };
  }

  async getInstructorProfile(userId: number) {
    const [profile] = await this.db
      .select({
        bio:           instructorProfiles.bio,
        expertise:     instructorProfiles.expertise,
        displayName:   instructorProfiles.displayName,
        displayAvatar: instructorProfiles.displayAvatar,
      })
      .from(instructorProfiles)
      .where(eq(instructorProfiles.userId, userId))
      .limit(1);
    return profile ?? { bio: null, expertise: null, displayName: null, displayAvatar: null };
  }

  async updateInstructorProfile(
    userId: number,
    data: { bio?: string; expertise?: string; displayName?: string | null; displayAvatar?: string | null },
  ) {
    await this.db
      .insert(instructorProfiles)
      .values({
        userId,
        bio:           data.bio,
        expertise:     data.expertise,
        displayName:   data.displayName ?? null,
        displayAvatar: data.displayAvatar ?? null,
      })
      .onConflictDoUpdate({
        target: instructorProfiles.userId,
        set: {
          bio:           data.bio,
          expertise:     data.expertise,
          displayName:   data.displayName ?? null,
          displayAvatar: data.displayAvatar ?? null,
          updatedAt:     new Date(),
        },
      });
    this.revalidation.revalidate([CacheTag.instructors]);
    return { updated: true };
  }

  // Update course preview video (Bunny or external)
  async updateCoursePreview(
    courseId: number,
    instructorId: number,
    data: {
      bunnyPreviewVideoId?: string;
      previewVideoSource?: 'bunny' | 'external';
      previewExternalUrl?: string;
    },
    isAdmin = false,
  ) {
    await this.findByIdForInstructor(courseId, instructorId, isAdmin);

    const [updated] = await this.db
      .update(courses)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(courses.id, courseId))
      .returning();

    this.revalidation.revalidate([CacheTag.courses]);
    return updated;
  }

  /**
   * Upsert a course-interest row for a logged-in user who viewed a course
   * they don't yet own. Deduplicated per (userId, courseId) — repeat visits
   * just refresh seenAt. Silent — never throws.
   */
  async trackCourseInterest(userId: number, courseId: number): Promise<void> {
    try {
      const now = new Date();
      await this.db
        .insert(userCourseInterests)
        .values({ userId, courseId, liveCourseId: null, firstSeenAt: now, lastSeenAt: now, visitCount: 1 })
        .onConflictDoUpdate({
          target: [userCourseInterests.userId, userCourseInterests.courseId],
          targetWhere: sql`${userCourseInterests.courseId} IS NOT NULL`,
          set: {
            lastSeenAt: now,
            visitCount: sql`${userCourseInterests.visitCount} + 1`,
          },
        });
    } catch { /* intentionally swallowed */ }
  }
}
