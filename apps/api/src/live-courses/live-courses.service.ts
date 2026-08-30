import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, eq, desc, gte, ilike, inArray, isNull, ne, or, sql, type SQL } from 'drizzle-orm';
import type { DB } from 'src/db';
import { DB_TOKEN } from 'src/db/db.module';
import { liveCourses, liveCourseBatches, liveEnrollments, adminUsers, instructorProfiles, roles, users, userCourseInterests, liveCourseModules, liveCourseLessons, courses, enrollments, liveCourseRecordedBundles, leads, liveSubscriptions, liveSubscriptionPayments } from 'src/db/schema';
import { PaystationService } from 'src/orders/paystation.service';
import { BkashService } from 'src/payments/bkash.service';
import { PaymentGatewayService } from 'src/payments/payment-gateway.service';
import { LiveCourseBatchesService } from './live-course-batches.service';
import { SmsTemplatesService } from 'src/sms/sms-templates.service';
import { RevalidationService } from 'src/common/revalidation/revalidation.service';
import { CacheTag } from 'src/common/revalidation/cache-tags';
import { AdminNotificationsService } from 'src/notifications/admin-notifications.service';
import { InvoiceNumberService } from 'src/common/invoice-number/invoice-number.service';
import { canEditLiveCourse, getListableLiveCourseIds } from 'src/common/rbac/course-access';
import { computeEnrollmentExpiry } from 'src/common/utils/access-expiry.util';

@Injectable()
export class LiveCoursesService {
  private readonly logger = new Logger(LiveCoursesService.name);

  constructor(
    @Inject(DB_TOKEN) private readonly db: DB,
    private readonly paystation: PaystationService,
    private readonly bkash: BkashService,
    private readonly paymentGateway: PaymentGatewayService,
    private readonly batches: LiveCourseBatchesService,
    private readonly smsTemplates: SmsTemplatesService,
    private readonly revalidation: RevalidationService,
    private readonly adminNotifications: AdminNotificationsService,
    private readonly invoiceNumbers: InvoiceNumberService,
  ) {}

  /**
   * Guest (no account) checkout/enrollment — captures a lead so the purchase
   * surfaces on the admin Leads page instead of requiring a manual search
   * through Enrollments. Mirrors LeadsService.create() for recorded courses,
   * but points at live_enrollments (live courses have no orders/order_items).
   * Never throws — a lead-capture failure must not block the actual purchase.
   */
  private async captureGuestLead(opts: {
    liveCourseId: number;
    liveEnrollmentId: number;
    name: string;
    phone: string;
    email: string;
    amount: number;
    paymentMethod: string | null;
  }) {
    try {
      await this.db.insert(leads).values({
        name: opts.name.trim(),
        email: opts.email.trim().toLowerCase(),
        phone: opts.phone.trim(),
        source: 'live_checkout',
        courseIds: [],
        liveCourseId: opts.liveCourseId,
        liveEnrollmentId: opts.liveEnrollmentId,
        subtotal: String(opts.amount),
        discountAmount: '0',
        finalAmount: String(opts.amount),
        paymentMethod: opts.paymentMethod,
        status: 'pending',
      });

      await this.adminNotifications.notifyAdmins(
        'lead',
        'New live/bundle checkout',
        `${opts.name} • ${opts.phone}`,
        '/admin/leads',
      );
    } catch (err) {
      this.logger.error('[captureGuestLead] failed', err as Error);
    }
  }

  // ── Admin: list teachers (for the Instructors "Add from teachers" picker) ──

  async listTeachers() {
    return this.db
      .select({
        id:            adminUsers.id,
        firstName:     adminUsers.firstName,
        lastName:      adminUsers.lastName,
        email:         adminUsers.email,
        avatar:        adminUsers.avatar,
        bio:           instructorProfiles.bio,
        expertise:     instructorProfiles.expertise,
        displayName:   instructorProfiles.displayName,
        displayAvatar: instructorProfiles.displayAvatar,
        totalStudents: instructorProfiles.totalStudents,
        totalCourses:  instructorProfiles.totalCourses,
        rating:        instructorProfiles.rating,
      })
      .from(adminUsers)
      .leftJoin(instructorProfiles, eq(instructorProfiles.userId, adminUsers.id))
      .innerJoin(roles, eq(roles.id, adminUsers.roleId))
      .where(eq(roles.slug, 'instructor'))
      .orderBy(desc(adminUsers.createdAt));
  }

  // ── Admin: list all ────────────────────────────────────────────────────────

  async findAll(adminUserId?: number, isAdmin = false, status?: string) {
    // Roles restricted to `edit_assigned_live_courses` only ever see their
    // assigned courses in this table too — not every live course.
    const listableIds = adminUserId !== undefined
      ? await getListableLiveCourseIds(this.db, adminUserId, isAdmin)
      : null;
    const scopeCondition = listableIds !== null
      ? (listableIds.length > 0 ? inArray(liveCourses.id, listableIds) : sql`false`)
      : undefined;
    // Trash is hidden from the default list — only shown when explicitly
    // requesting status=trash (the admin's dedicated Trash view).
    const statusCondition = status
      ? eq(liveCourses.status, status as 'draft' | 'published' | 'inactive' | 'scheduled' | 'trash')
      : ne(liveCourses.status, 'trash');
    const where = and(...[scopeCondition, statusCondition].filter(Boolean) as SQL[]);

    return this.db
      .select({
        id:           liveCourses.id,
        title:        liveCourses.title,
        slug:         liveCourses.slug,
        status:       liveCourses.status,
        price:        liveCourses.price,
        originalPrice:liveCourses.originalPrice,
        createdAt:    liveCourses.createdAt,
        updatedAt:    liveCourses.updatedAt,
      })
      .from(liveCourses)
      .where(where)
      .orderBy(liveCourses.createdAt);
  }

  // ── Admin: get one by id ───────────────────────────────────────────────────

  async findById(id: number) {
    const [course] = await this.db
      .select()
      .from(liveCourses)
      .where(eq(liveCourses.id, id))
      .limit(1);

    if (!course) throw new NotFoundException('Live course not found');

    const bundledCourses = course.courseType === 'bundle'
      ? await this.db
          .select({ id: courses.id, title: courses.title, slug: courses.slug, price: courses.price, thumbnail: courses.thumbnail })
          .from(liveCourseRecordedBundles)
          .innerJoin(courses, eq(courses.id, liveCourseRecordedBundles.courseId))
          .where(eq(liveCourseRecordedBundles.liveCourseId, id))
          .orderBy(liveCourseRecordedBundles.order)
      : [];

    return { ...course, bundledCourses };
  }

  // ── Public: list all published (card fields only) ─────────────────────────

  async findAllPublished() {
    return this.db
      .select({
        id:               liveCourses.id,
        title:            liveCourses.title,
        slug:             liveCourses.slug,
        price:            liveCourses.price,
        originalPrice:    liveCourses.originalPrice,
        totalLiveClasses: liveCourses.totalLiveClasses,
        countdownEnd:     liveCourses.countdownEnd,
        template:         liveCourses.template,
        hero:             liveCourses.hero,
        showBadge:        liveCourses.showBadge,
        createdAt:        liveCourses.createdAt,
      })
      .from(liveCourses)
      .where(eq(liveCourses.status, 'published'))
      .orderBy(liveCourses.createdAt);
  }

  // ── Public: get one by slug (published only) + active batch ──────────────

  /** Whether a slug/custom-path is free (optionally excluding the course being edited). */
  async checkSlug(slug: string, excludeId?: number) {
    const normalized = (slug ?? '').trim();
    if (!normalized) return { available: false };
    const [row] = await this.db
      .select({ id: liveCourses.id })
      .from(liveCourses)
      .where(
        excludeId
          ? and(eq(liveCourses.slug, normalized), ne(liveCourses.id, excludeId))
          : eq(liveCourses.slug, normalized),
      )
      .limit(1);
    return { available: !row };
  }

  async findBySlug(slug: string) {
    const [course] = await this.db
      .select()
      .from(liveCourses)
      .where(eq(liveCourses.slug, slug))
      .limit(1);

    if (!course) throw new NotFoundException('Live course not found');
    if (course.status !== 'published')
      throw new NotFoundException('Live course not found');

    const [activeBatch, bundledCourses] = await Promise.all([
      this.batches.getActiveBatch(course.id),
      course.courseType === 'bundle'
        ? this.db
            .select({ id: courses.id, title: courses.title, slug: courses.slug, price: courses.price, thumbnail: courses.thumbnail })
            .from(liveCourseRecordedBundles)
            .innerJoin(courses, eq(courses.id, liveCourseRecordedBundles.courseId))
            .where(eq(liveCourseRecordedBundles.liveCourseId, course.id))
            .orderBy(liveCourseRecordedBundles.order)
        : Promise.resolve([]),
    ]);

    return { ...course, activeBatch: activeBatch ?? null, bundledCourses };
  }

  /** Public lookup by id (published only) — used by the /c/<id> course flows. */
  async findByIdPublic(id: number) {
    const [course] = await this.db
      .select()
      .from(liveCourses)
      .where(eq(liveCourses.id, id))
      .limit(1);

    if (!course || course.status !== 'published')
      throw new NotFoundException('Live course not found');

    const [activeBatch, bundledCourses] = await Promise.all([
      this.batches.getActiveBatch(course.id),
      course.courseType === 'bundle'
        ? this.db
            .select({ id: courses.id, title: courses.title, slug: courses.slug, price: courses.price, thumbnail: courses.thumbnail })
            .from(liveCourseRecordedBundles)
            .innerJoin(courses, eq(courses.id, liveCourseRecordedBundles.courseId))
            .where(eq(liveCourseRecordedBundles.liveCourseId, id))
            .orderBy(liveCourseRecordedBundles.order)
        : Promise.resolve([]),
    ]);

    return { ...course, activeBatch: activeBatch ?? null, bundledCourses };
  }

  // ── Create ─────────────────────────────────────────────────────────────────

  async create(dto: {
    title: string;
    slug: string;
    price?: string;
    originalPrice?: string;
    hero?: Record<string, unknown>;
    paymentLogos?: unknown[];
    batchInfo?: Record<string, unknown>;
    curriculum?: unknown[];
    tools?: unknown[];
    whyDifferent?: unknown[];
    stats?: Record<string, unknown>;
    instructors?: unknown[];
    whatYouGet?: unknown[];
    videos?: unknown[];
    testimonials?: unknown[];
    valueItems?: unknown[];
    totalValue?: string;
    totalLiveClasses?: string;
    totalModules?: string;
    countdownEnd?: string;
    template?: string;
    faq?: unknown[];
    comparisonTable?: Record<string, unknown>;
    pcRequirements?: Record<string, unknown>;
    ctaBanner?: Record<string, unknown>;
    certificate?: Record<string, unknown>;
    urgencyCta?: Record<string, unknown>;
    videoTabs?: unknown[];
    // Template 3
    marqueeText?: string;
    announcementBar?: Record<string, unknown>;
    blueprintSection?: Record<string, unknown>;
    whyJoinItems?: unknown[];
    featuresGrid?: Record<string, unknown>;
    bonusChecklist?: Record<string, unknown>;
    challengeSection?: Record<string, unknown>;
    supportLevels?: Record<string, unknown>;
    salesUpdateSlider?: Record<string, unknown>;
    communitySection?: Record<string, unknown>;
    textReviewsSlider?: Record<string, unknown>;
    successStories?: Record<string, unknown>;
    videoGrid?: Record<string, unknown>;
    faqContactButtons?: Record<string, unknown>;
    footerBranding?: Record<string, unknown>;
    // Template 4
    t4LiveSessionCard?: Record<string, unknown>;
    t4StudentProgress?: Record<string, unknown>;
    t4ForWhomSection?: Record<string, unknown>;
    t4InstructorStory?: Record<string, unknown>;
    t4ModuleGrid?: Record<string, unknown>;
    t4PricingSection?: Record<string, unknown>;
    t4SupportSection?: Record<string, unknown>;
    t4CountdownBanner?: Record<string, unknown>;
    // Template 5
    t5StatCards?: unknown[];
    t5WhoFor?: Record<string, unknown>;
    t5RealProjects?: Record<string, unknown>;
    t5Roadmap?: Record<string, unknown>;
    // Per-element style overrides
    styleOverrides?: Record<string, unknown>;
    lessonIcon?: string;
    valueSection?: Record<string, unknown>;
    sectionHeadings?: Record<string, string>;
    sectionOrder?: string[];
        courseType?: 'live' | 'bundle';
        bundledCourseIds?: number[];
        showBadge?: boolean;
        hasLifetimeAccess?: boolean;
        accessDurationDays?: number;
        hasSubscription?: boolean;
        monthlyPrice?: string | null;
  }) {
    // Check slug uniqueness
    const existing = await this.db
      .select({ id: liveCourses.id })
      .from(liveCourses)
      .where(eq(liveCourses.slug, dto.slug))
      .limit(1);

    if (existing.length > 0)
      throw new ConflictException('A live course with this slug already exists');

    const [course] = await this.db
      .insert(liveCourses)
      .values({
        title:           dto.title,
        slug:            dto.slug,
        price:           dto.price ?? '0',
        originalPrice:   dto.originalPrice ?? null,
        hero:            (dto.hero as any) ?? {},
        paymentLogos:    (dto.paymentLogos as any) ?? [],
        batchInfo:       (dto.batchInfo as any) ?? {},
        curriculum:      (dto.curriculum as any) ?? [],
        tools:           (dto.tools as any) ?? [],
        whyDifferent:    (dto.whyDifferent as any) ?? [],
        stats:           (dto.stats as any) ?? {},
        instructors:     (dto.instructors as any) ?? [],
        whatYouGet:      (dto.whatYouGet as any) ?? [],
        videos:          (dto.videos as any) ?? [],
        testimonials:    (dto.testimonials as any) ?? [],
        valueItems:      (dto.valueItems as any) ?? [],
        totalValue:      dto.totalValue ?? null,
        totalLiveClasses: dto.totalLiveClasses ?? null,
        totalModules:     dto.totalModules ?? null,
        countdownEnd:    dto.countdownEnd ? new Date(dto.countdownEnd) : null,
        template:        dto.template ?? '1',
        faq:             (dto.faq as any) ?? [],
        comparisonTable: (dto.comparisonTable as any) ?? {},
        pcRequirements:  (dto.pcRequirements as any) ?? {},
        ctaBanner:       (dto.ctaBanner as any) ?? {},
        certificate:     (dto.certificate as any) ?? {},
        urgencyCta:      (dto.urgencyCta as any) ?? {},
        videoTabs:       (dto.videoTabs as any) ?? [],
        // Template 3
        marqueeText:       dto.marqueeText ?? null,
        announcementBar:   (dto.announcementBar as any) ?? {},
        blueprintSection:  (dto.blueprintSection as any) ?? {},
        whyJoinItems:      (dto.whyJoinItems as any) ?? [],
        featuresGrid:      (dto.featuresGrid as any) ?? {},
        bonusChecklist:    (dto.bonusChecklist as any) ?? {},
        challengeSection:  (dto.challengeSection as any) ?? {},
        supportLevels:     (dto.supportLevels as any) ?? {},
        salesUpdateSlider: (dto.salesUpdateSlider as any) ?? {},
        communitySection:  (dto.communitySection as any) ?? {},
        textReviewsSlider: (dto.textReviewsSlider as any) ?? {},
        successStories:    (dto.successStories as any) ?? {},
        videoGrid:         (dto.videoGrid as any) ?? {},
        faqContactButtons: (dto.faqContactButtons as any) ?? {},
        footerBranding:    (dto.footerBranding as any) ?? {},
        // Template 4
        t4LiveSessionCard: (dto.t4LiveSessionCard as any) ?? {},
        t4StudentProgress: (dto.t4StudentProgress as any) ?? {},
        t4ForWhomSection:  (dto.t4ForWhomSection as any) ?? {},
        t4InstructorStory: (dto.t4InstructorStory as any) ?? {},
        t4ModuleGrid:      (dto.t4ModuleGrid as any) ?? {},
        t4PricingSection:  (dto.t4PricingSection as any) ?? {},
        t4SupportSection:  (dto.t4SupportSection as any) ?? {},
        t4CountdownBanner: (dto.t4CountdownBanner as any) ?? {},
        // Template 5
        t5StatCards:       (dto.t5StatCards as any) ?? [],
        t5WhoFor:          (dto.t5WhoFor as any) ?? {},
        t5RealProjects:    (dto.t5RealProjects as any) ?? {},
        t5Roadmap:         (dto.t5Roadmap as any) ?? {},
        styleOverrides:    (dto.styleOverrides as any) ?? {},
        lessonIcon:        dto.lessonIcon ?? null,
        valueSection:      (dto.valueSection as any) ?? {},
        sectionHeadings:   (dto.sectionHeadings as any) ?? {},
        sectionOrder:      (dto.sectionOrder as any) ?? [],
        courseType:        dto.courseType ?? 'live',
        showBadge:         dto.showBadge ?? true,
        hasLifetimeAccess: dto.hasLifetimeAccess ?? true,
        accessDurationDays: dto.accessDurationDays ?? null,
        hasSubscription:   dto.hasSubscription ?? false,
        monthlyPrice:      dto.hasSubscription ? (dto.monthlyPrice ?? null) : null,
        updatedAt:       new Date(),
      })
      .returning();

    if (dto.courseType === 'bundle' && dto.bundledCourseIds?.length) {
      await this.db.insert(liveCourseRecordedBundles).values(
        dto.bundledCourseIds.map((courseId, idx) => ({ liveCourseId: course.id, courseId, order: idx })),
      );
    }

    this.revalidation.revalidate([CacheTag.courses]);
    return course;
  }

  // ── Update ─────────────────────────────────────────────────────────────────

  async update(id: number, dto: Partial<{
    title: string;
    slug: string;
    price: string;
    originalPrice: string;
    hero: Record<string, unknown>;
    paymentLogos: unknown[];
    batchInfo: Record<string, unknown>;
    curriculum: unknown[];
    tools: unknown[];
    whyDifferent: unknown[];
    stats: Record<string, unknown>;
    instructors: unknown[];
    whatYouGet: unknown[];
    videos: unknown[];
    testimonials: unknown[];
    valueItems: unknown[];
    totalValue: string;
    totalLiveClasses: string;
    totalModules: string;
    countdownEnd: string;
    template: string;
    faq: unknown[];
    comparisonTable: Record<string, unknown>;
    pcRequirements: Record<string, unknown>;
    ctaBanner: Record<string, unknown>;
    certificate: Record<string, unknown>;
    urgencyCta: Record<string, unknown>;
    videoTabs: unknown[];
    // Template 3
    marqueeText: string;
    announcementBar: Record<string, unknown>;
    blueprintSection: Record<string, unknown>;
    whyJoinItems: unknown[];
    featuresGrid: Record<string, unknown>;
    bonusChecklist: Record<string, unknown>;
    challengeSection: Record<string, unknown>;
    supportLevels: Record<string, unknown>;
    salesUpdateSlider: Record<string, unknown>;
    communitySection: Record<string, unknown>;
    textReviewsSlider: Record<string, unknown>;
    successStories: Record<string, unknown>;
    videoGrid: Record<string, unknown>;
    faqContactButtons: Record<string, unknown>;
    footerBranding: Record<string, unknown>;
    // Template 4
    t4LiveSessionCard: Record<string, unknown>;
    t4StudentProgress: Record<string, unknown>;
    t4ForWhomSection: Record<string, unknown>;
    t4InstructorStory: Record<string, unknown>;
    t4ModuleGrid: Record<string, unknown>;
    t4PricingSection: Record<string, unknown>;
    t4SupportSection: Record<string, unknown>;
    t4CountdownBanner: Record<string, unknown>;
    // Template 5
    t5StatCards: unknown[];
    t5WhoFor: Record<string, unknown>;
    t5RealProjects: Record<string, unknown>;
    t5Roadmap: Record<string, unknown>;
    styleOverrides: Record<string, unknown>;
    lessonIcon: string;
    valueSection: Record<string, unknown>;
    sectionHeadings: Record<string, string>;
    sectionOrder: string[];
    requireSequentialProgress: boolean;
    courseType: 'live' | 'bundle';
    bundledCourseIds: number[];
    showBadge: boolean;
    hasLifetimeAccess: boolean;
    accessDurationDays: number;
    hasSubscription: boolean;
    monthlyPrice: string | null;
  }>, adminUserId: number, isAdmin = false) {
    const existing = await this.findById(id);
    if (!(await canEditLiveCourse(this.db, id, adminUserId, isAdmin))) {
      throw new ForbiddenException('Access denied');
    }

    // Check slug uniqueness if changing
    if (dto.slug && dto.slug !== existing.slug) {
      const slugTaken = await this.db
        .select({ id: liveCourses.id })
        .from(liveCourses)
        .where(eq(liveCourses.slug, dto.slug))
        .limit(1);
      if (slugTaken.length > 0)
        throw new ConflictException('A live course with this slug already exists');
    }

    const [updated] = await this.db
      .update(liveCourses)
      .set({
        ...(dto.title            !== undefined && { title:            dto.title }),
        ...(dto.slug             !== undefined && { slug:             dto.slug }),
        ...(dto.price            !== undefined && { price:            dto.price }),
        ...(dto.originalPrice    !== undefined && { originalPrice:    dto.originalPrice }),
        ...(dto.hero             !== undefined && { hero:             dto.hero as any }),
        ...(dto.paymentLogos     !== undefined && { paymentLogos:     dto.paymentLogos as any }),
        ...(dto.batchInfo        !== undefined && { batchInfo:        dto.batchInfo as any }),
        ...(dto.curriculum       !== undefined && { curriculum:       dto.curriculum as any }),
        ...(dto.tools            !== undefined && { tools:            dto.tools as any }),
        ...(dto.whyDifferent     !== undefined && { whyDifferent:     dto.whyDifferent as any }),
        ...(dto.stats            !== undefined && { stats:            dto.stats as any }),
        ...(dto.instructors      !== undefined && { instructors:      dto.instructors as any }),
        ...(dto.whatYouGet       !== undefined && { whatYouGet:       dto.whatYouGet as any }),
        ...(dto.videos           !== undefined && { videos:           dto.videos as any }),
        ...(dto.testimonials     !== undefined && { testimonials:     dto.testimonials as any }),
        ...(dto.valueItems       !== undefined && { valueItems:       dto.valueItems as any }),
        ...(dto.totalValue       !== undefined && { totalValue:       dto.totalValue }),
        ...(dto.totalLiveClasses !== undefined && { totalLiveClasses: dto.totalLiveClasses }),
        ...(dto.totalModules     !== undefined && { totalModules:     dto.totalModules }),
        ...(dto.countdownEnd     !== undefined && {
          countdownEnd: dto.countdownEnd ? new Date(dto.countdownEnd) : null,
        }),
        ...(dto.template        !== undefined && { template:        dto.template }),
        ...(dto.faq             !== undefined && { faq:             dto.faq as any }),
        ...(dto.comparisonTable !== undefined && { comparisonTable: dto.comparisonTable as any }),
        ...(dto.pcRequirements  !== undefined && { pcRequirements:  dto.pcRequirements as any }),
        ...(dto.ctaBanner       !== undefined && { ctaBanner:       dto.ctaBanner as any }),
        ...(dto.certificate     !== undefined && { certificate:     dto.certificate as any }),
        ...(dto.urgencyCta      !== undefined && { urgencyCta:      dto.urgencyCta as any }),
        ...(dto.videoTabs           !== undefined && { videoTabs:           dto.videoTabs as any }),
        ...(dto.marqueeText         !== undefined && { marqueeText:         dto.marqueeText }),
        ...(dto.announcementBar     !== undefined && { announcementBar:     dto.announcementBar as any }),
        ...(dto.blueprintSection    !== undefined && { blueprintSection:    dto.blueprintSection as any }),
        ...(dto.whyJoinItems        !== undefined && { whyJoinItems:        dto.whyJoinItems as any }),
        ...(dto.featuresGrid        !== undefined && { featuresGrid:        dto.featuresGrid as any }),
        ...(dto.bonusChecklist      !== undefined && { bonusChecklist:      dto.bonusChecklist as any }),
        ...(dto.challengeSection    !== undefined && { challengeSection:    dto.challengeSection as any }),
        ...(dto.supportLevels       !== undefined && { supportLevels:       dto.supportLevels as any }),
        ...(dto.salesUpdateSlider   !== undefined && { salesUpdateSlider:   dto.salesUpdateSlider as any }),
        ...(dto.communitySection    !== undefined && { communitySection:    dto.communitySection as any }),
        ...(dto.textReviewsSlider   !== undefined && { textReviewsSlider:   dto.textReviewsSlider as any }),
        ...(dto.successStories      !== undefined && { successStories:      dto.successStories as any }),
        ...(dto.videoGrid           !== undefined && { videoGrid:           dto.videoGrid as any }),
        ...(dto.faqContactButtons   !== undefined && { faqContactButtons:   dto.faqContactButtons as any }),
        ...(dto.footerBranding      !== undefined && { footerBranding:      dto.footerBranding as any }),
        // Template 4
        ...(dto.t4LiveSessionCard   !== undefined && { t4LiveSessionCard:   dto.t4LiveSessionCard as any }),
        ...(dto.t4StudentProgress   !== undefined && { t4StudentProgress:   dto.t4StudentProgress as any }),
        ...(dto.t4ForWhomSection    !== undefined && { t4ForWhomSection:    dto.t4ForWhomSection as any }),
        ...(dto.t4InstructorStory   !== undefined && { t4InstructorStory:   dto.t4InstructorStory as any }),
        ...(dto.t4ModuleGrid        !== undefined && { t4ModuleGrid:        dto.t4ModuleGrid as any }),
        ...(dto.t4PricingSection    !== undefined && { t4PricingSection:    dto.t4PricingSection as any }),
        ...(dto.t4SupportSection    !== undefined && { t4SupportSection:    dto.t4SupportSection as any }),
        ...(dto.t4CountdownBanner   !== undefined && { t4CountdownBanner:   dto.t4CountdownBanner as any }),
        // Template 5
        ...(dto.t5StatCards         !== undefined && { t5StatCards:         dto.t5StatCards as any }),
        ...(dto.t5WhoFor            !== undefined && { t5WhoFor:            dto.t5WhoFor as any }),
        ...(dto.t5RealProjects      !== undefined && { t5RealProjects:      dto.t5RealProjects as any }),
        ...(dto.t5Roadmap           !== undefined && { t5Roadmap:           dto.t5Roadmap as any }),
        ...(dto.styleOverrides      !== undefined && { styleOverrides:      dto.styleOverrides as any }),
        ...(dto.lessonIcon          !== undefined && { lessonIcon:          dto.lessonIcon }),
        ...(dto.valueSection        !== undefined && { valueSection:        dto.valueSection as any }),
        ...(dto.sectionHeadings          !== undefined && { sectionHeadings:          dto.sectionHeadings as any }),
        ...(dto.sectionOrder             !== undefined && { sectionOrder:             dto.sectionOrder as any }),
        ...(dto.requireSequentialProgress !== undefined && { requireSequentialProgress: dto.requireSequentialProgress }),
        ...(dto.courseType !== undefined && { courseType: dto.courseType }),
        ...(dto.showBadge !== undefined && { showBadge: dto.showBadge }),
        ...(dto.hasLifetimeAccess !== undefined && { hasLifetimeAccess: dto.hasLifetimeAccess }),
        ...(dto.accessDurationDays !== undefined && { accessDurationDays: dto.accessDurationDays }),
        ...(dto.hasSubscription !== undefined && { hasSubscription: dto.hasSubscription }),
        ...(dto.hasSubscription !== undefined && {
          monthlyPrice: dto.hasSubscription ? (dto.monthlyPrice ?? null) : null,
        }),
        updatedAt: new Date(),
      })
      .where(eq(liveCourses.id, id))
      .returning();

    if (dto.bundledCourseIds !== undefined) {
      await this.db.delete(liveCourseRecordedBundles).where(eq(liveCourseRecordedBundles.liveCourseId, id));
      if (dto.bundledCourseIds.length > 0) {
        await this.db.insert(liveCourseRecordedBundles).values(
          dto.bundledCourseIds.map((courseId, idx) => ({ liveCourseId: id, courseId, order: idx })),
        );
      }
    }

    this.revalidation.revalidate([CacheTag.courses]);
    return updated;
  }

  // ── Toggle publish ─────────────────────────────────────────────────────────

  async togglePublish(id: number) {
    const course = await this.findById(id);
    const newStatus = course.status === 'published' ? 'draft' : 'published';

    const [updated] = await this.db
      .update(liveCourses)
      .set({ status: newStatus, updatedAt: new Date() })
      .where(eq(liveCourses.id, id))
      .returning({ id: liveCourses.id, status: liveCourses.status });

    this.revalidation.revalidate([CacheTag.courses]);
    return updated;
  }

  // ── Duplicate ──────────────────────────────────────────────────────────────

  async duplicate(id: number, includeCurriculum: boolean) {
    const original = await this.findById(id);
    const newSlug = `${original.slug}-copy-${Date.now()}`;

    const { id: _id, status: _status, createdAt: _ca, updatedAt: _ua, ...rest } = original as any;

    const [newCourse] = await this.db
      .insert(liveCourses)
      .values({
        ...rest,
        title:  `Copy of ${original.title}`,
        slug:   newSlug,
        status: 'draft',
      })
      .returning();

    if (includeCurriculum) {
      const mods = await this.db
        .select()
        .from(liveCourseModules)
        .where(eq(liveCourseModules.liveCourseId, id))
        .orderBy(asc(liveCourseModules.order));

      if (mods.length > 0) {
        const allLessons = await this.db
          .select()
          .from(liveCourseLessons)
          .where(sql`${liveCourseLessons.moduleId} IN (${sql.join(mods.map((m) => sql`${m.id}`), sql`, `)})`)
          .orderBy(asc(liveCourseLessons.order));

        for (const mod of mods) {
          const [newMod] = await this.db
            .insert(liveCourseModules)
            .values({ liveCourseId: newCourse.id, title: mod.title, order: mod.order })
            .returning();

          const modLessons = allLessons.filter((l) => l.moduleId === mod.id);
          if (modLessons.length > 0) {
            await this.db.insert(liveCourseLessons).values(
              modLessons.map((l) => ({
                moduleId:         newMod.id,
                liveCourseId:     newCourse.id,
                title:            l.title,
                type:             l.type,
                videoSource:      l.videoSource,
                bunnyVideoId:     l.bunnyVideoId,
                bunnyStatus:      l.bunnyStatus,
                externalVideoUrl: l.externalVideoUrl,
                duration:         l.duration,
                content:          l.content,
                isFree:           l.isFree,
                order:            l.order,
              })),
            );
          }
        }
      }
    }

    this.revalidation.revalidate([CacheTag.courses]);
    return newCourse;
  }

  // ── Delete (soft — moves to Trash, reversible) ──────────────────────────────

  async delete(id: number) {
    await this.findById(id);
    const [updated] = await this.db
      .update(liveCourses)
      .set({ status: 'trash', updatedAt: new Date() })
      .where(eq(liveCourses.id, id))
      .returning();
    this.revalidation.revalidate([CacheTag.courses]);
    return updated;
  }

  async restore(id: number) {
    const course = await this.findById(id);
    if (course.status !== 'trash') throw new BadRequestException('Course is not in Trash');
    const [updated] = await this.db
      .update(liveCourses)
      .set({ status: 'draft', updatedAt: new Date() })
      .where(eq(liveCourses.id, id))
      .returning();
    this.revalidation.revalidate([CacheTag.courses]);
    return updated;
  }

  /** Permanently deletes a trashed course — only callable from the Trash view. */
  async purge(id: number) {
    const course = await this.findById(id);
    if (course.status !== 'trash') throw new BadRequestException('Only trashed courses can be permanently deleted');
    await this.db.delete(liveCourses).where(eq(liveCourses.id, id));
    this.revalidation.revalidate([CacheTag.courses]);
    return { deleted: true };
  }

  async schedulePublish(id: number, publishAt: Date) {
    await this.findById(id);
    const [updated] = await this.db
      .update(liveCourses)
      .set({ status: 'scheduled', publishAt, updatedAt: new Date() })
      .where(eq(liveCourses.id, id))
      .returning();
    this.revalidation.revalidate([CacheTag.courses]);
    return updated;
  }

  async unschedule(id: number) {
    await this.findById(id);
    const [updated] = await this.db
      .update(liveCourses)
      .set({ status: 'draft', publishAt: null, updatedAt: new Date() })
      .where(eq(liveCourses.id, id))
      .returning();
    this.revalidation.revalidate([CacheTag.courses]);
    return updated;
  }

  /**
   * Best-effort duplicate-purchase guard for guests (no account to key off
   * of). Blocks re-checkout when the same email or phone already has a
   * completed enrollment for this course — a real account match is exact
   * (enrollFree/initiatePayment already check userId separately); this only
   * covers the guest case where the same person retypes the same contact info.
   */
  private async guestAlreadyEnrolled(liveCourseId: number, email: string, phone: string): Promise<boolean> {
    const [existing] = await this.db
      .select({ id: liveEnrollments.id })
      .from(liveEnrollments)
      .where(
        and(
          eq(liveEnrollments.liveCourseId, liveCourseId),
          eq(liveEnrollments.status, 'completed'),
          or(ilike(liveEnrollments.email, email.trim()), eq(liveEnrollments.phone, phone.trim())),
        ),
      )
      .limit(1);
    return !!existing;
  }

  // ── Payment: initiate PayStation checkout ──────────────────────────────────

  async initiatePayment(
    liveCourseId: number,
    dto: { name: string; phone: string; email: string; callbackUrl: string; batchId?: number; userId?: number },
  ) {
    // Fetch course and ensure it is published
    const raw = await this.findById(liveCourseId);
    if (raw.status !== 'published')
      throw new BadRequestException('This course is not available for enrollment');
    const course = raw;

    const amount = parseFloat(String(course.price ?? 0));
    if (amount <= 0)
      throw new BadRequestException('This course is free — no payment required');

    if (!dto.userId && (await this.guestAlreadyEnrolled(liveCourseId, dto.email, dto.phone))) {
      throw new ConflictException('You are already enrolled in this course. Please log in to access it.');
    }

    // Reuse a still-pending enrollment for the same person + course made
    // recently, instead of inserting a new row on every retry (double-click,
    // reload, "try again" after a failed attempt). Otherwise each duplicate
    // row independently completes and fires its own confirmation SMS/lead.
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const [existingPending] = await this.db
      .select()
      .from(liveEnrollments)
      .where(
        and(
          eq(liveEnrollments.liveCourseId, liveCourseId),
          eq(liveEnrollments.status, 'pending'),
          gte(liveEnrollments.createdAt, oneHourAgo),
          dto.userId
            ? eq(liveEnrollments.userId, dto.userId)
            : and(eq(liveEnrollments.phone, dto.phone), eq(liveEnrollments.email, dto.email)),
        ),
      )
      .limit(1);

    let enrollment: typeof liveEnrollments.$inferSelect;
    if (existingPending) {
      enrollment = existingPending;
      if (dto.batchId && dto.batchId !== existingPending.batchId) {
        await this.batches.incrementSeatsFilled(dto.batchId);
      }
    } else {
      [enrollment] = await this.db
        .insert(liveEnrollments)
        .values({
          liveCourseId,
          batchId: dto.batchId ?? null,
          userId:  dto.userId ?? null,
          name:    dto.name,
          phone:   dto.phone,
          email:   dto.email,
          amount:  String(amount),
          status:  'pending',
          displayInvoiceNumber: await this.invoiceNumbers.generate(),
        })
        .returning();

      // Increment seats filled on the batch if provided
      if (dto.batchId) {
        await this.batches.incrementSeatsFilled(dto.batchId);
      }

      // Guest checkout (no account) — capture a lead so admin can find + fulfil
      // it from the Leads page instead of manually searching Enrollments.
      if (!dto.userId) {
        await this.captureGuestLead({
          liveCourseId: liveCourseId,
          liveEnrollmentId: enrollment.id,
          name: dto.name,
          phone: dto.phone,
          email: dto.email,
          amount,
          paymentMethod: null,
        });
      }
    }

    const checkoutItems = course.courseType === 'bundle' && course.bundledCourses.length > 0
      ? course.bundledCourses.map((c) => c.title).join(', ')
      : course.title;

    const gateway = await this.paymentGateway.getActiveGateway();

    if (gateway === 'bkash') {
      const apiBase = process.env.API_URL ?? 'http://localhost:3000';
      const invoiceNumber = this.bkash.generateLiveInvoiceNumber(enrollment.id);

      await this.db
        .update(liveEnrollments)
        .set({ bkashInvoiceNumber: invoiceNumber, batchId: dto.batchId ?? enrollment.batchId })
        .where(eq(liveEnrollments.id, enrollment.id));

      const result = await this.bkash.createPayment({
        invoiceNumber,
        amount,
        callbackUrl: `${apiBase}/bkash/callback/live`,
        payerReference: dto.phone,
      });

      await this.db
        .update(liveEnrollments)
        .set({ bkashPaymentId: result.paymentID })
        .where(eq(liveEnrollments.id, enrollment.id));

      return { paymentUrl: result.paymentUrl, invoiceNumber };
    }

    const invoiceNumber = `LCE-${enrollment.id}-${Date.now()}`;

    // Store the (possibly refreshed) invoice id so callback can look it up
    await this.db
      .update(liveEnrollments)
      .set({ paystationInvoiceId: invoiceNumber, batchId: dto.batchId ?? enrollment.batchId })
      .where(eq(liveEnrollments.id, enrollment.id));

    const result = await this.paystation.initiatePayment({
      invoiceNumber,
      amount,
      custName:      dto.name,
      custPhone:     dto.phone,
      custEmail:     dto.email,
      callbackUrl:   dto.callbackUrl,
      reference:     `live-course-${liveCourseId}`,
      checkoutItems,
    });

    return { paymentUrl: result.paymentUrl, invoiceNumber };
  }

  // ── Free enrollment (price = 0) ───────────────────────────────────────────

  async enrollFree(
    liveCourseId: number,
    dto: { name: string; phone: string; email: string; batchId?: number; userId?: number },
  ) {
    const raw = await this.findById(liveCourseId);
    if (raw.status !== 'published')
      throw new BadRequestException('This course is not available for enrollment');

    const amount = parseFloat(String(raw.price ?? 0));
    if (amount > 0)
      throw new BadRequestException('This course requires payment');

    // Idempotency: if the user is already enrolled, return success
    if (dto.userId) {
      const [existing] = await this.db
        .select({ id: liveEnrollments.id })
        .from(liveEnrollments)
        .where(
          and(
            eq(liveEnrollments.liveCourseId, liveCourseId),
            eq(liveEnrollments.userId, dto.userId),
            eq(liveEnrollments.status, 'completed'),
          ),
        )
        .limit(1);
      if (existing) return { enrolled: true, alreadyEnrolled: true, liveCourseId, courseSlug: raw.slug };
    } else if (await this.guestAlreadyEnrolled(liveCourseId, dto.email, dto.phone)) {
      throw new ConflictException('You are already enrolled in this course. Please log in to access it.');
    }

    const [enrollment] = await this.db
      .insert(liveEnrollments)
      .values({
        liveCourseId,
        batchId: dto.batchId ?? null,
        userId:  dto.userId  ?? null,
        name:    dto.name,
        phone:   dto.phone,
        email:   dto.email,
        amount:  '0',
        status:  'completed',
        paidAt:  new Date(),
        expiresAt: computeEnrollmentExpiry(raw),
        displayInvoiceNumber: await this.invoiceNumbers.generate(),
      })
      .returning();

    if (dto.batchId) {
      await this.batches.incrementSeatsFilled(dto.batchId);
    }

    await this.promoteToStudent(dto.userId ?? null);

    // Guest enrollment (no account) — capture a lead so admin can find + fulfil
    // it from the Leads page instead of manually searching Enrollments.
    if (!dto.userId) {
      await this.captureGuestLead({
        liveCourseId: liveCourseId,
        liveEnrollmentId: enrollment.id,
        name: dto.name,
        phone: dto.phone,
        email: dto.email,
        amount: 0,
        paymentMethod: 'free',
      });
    }

    // For bundles: enroll the user in each included recorded course
    if (raw.courseType === 'bundle' && dto.userId && raw.bundledCourses.length > 0) {
      for (const bc of raw.bundledCourses) {
        await this.db
          .insert(enrollments)
          .values({ userId: dto.userId, courseId: bc.id, orderId: null, status: 'active' })
          .onConflictDoNothing();
      }
    }

    // Best-effort confirmation SMS
    try {
      await this.smsTemplates.send('live_enrollment_confirmation', enrollment.phone ?? '', {
        name: enrollment.name,
        courseTitle: raw.title,
      });
    } catch {}

    return { enrolled: true, liveCourseId, courseSlug: raw.slug };
  }

  // ── Payment: verify callback from PayStation ───────────────────────────────

  async verifyLivePayment(invoiceNumber: string) {
    // Find the enrollment
    const [enrollment] = await this.db
      .select()
      .from(liveEnrollments)
      .where(eq(liveEnrollments.paystationInvoiceId, invoiceNumber))
      .limit(1);

    if (!enrollment) throw new NotFoundException('Enrollment not found');

    if (enrollment.status === 'completed') {
      // Self-heal: ensure an account-linked buyer is a STUDENT even if they
      // paid before role promotion existed in this flow.
      await this.promoteToStudent(enrollment.userId);
      const course = await this.findById(enrollment.liveCourseId);
      return { alreadyPaid: true, liveCourseId: enrollment.liveCourseId, courseSlug: course.slug };
    }

    // Verify with PayStation. The callback is hit more than once (server ping +
    // browser redirect). The two hits race: one verifies & completes the
    // enrollment, the other can get a non-success re-verify OR a thrown gateway
    // error on the duplicate query. Neither must turn a real success into a
    // failure page — on ANY verify problem, re-check whether the enrollment was
    // already completed (by the concurrent hit) and honour that.
    let verification: Awaited<ReturnType<typeof this.paystation.verifyByInvoice>>;
    try {
      verification = await this.paystation.verifyByInvoice(invoiceNumber);
    } catch (err) {
      const done = await this.completedResultIfPaid(enrollment);
      if (done) return done;
      throw err;
    }

    const codeOk   = String(verification.status_code) === '200';
    const statusOk = verification.status?.toLowerCase() === 'success';
    const trxOk    = ['success', 'successful'].includes(
      verification.data?.trx_status?.toLowerCase() ?? '',
    );

    if (!codeOk || !statusOk || !trxOk) {
      const done = await this.completedResultIfPaid(enrollment);
      if (done) return done;

      this.logger.warn(`Live payment NOT verified for invoice ${invoiceNumber}: ${JSON.stringify(verification)}`);
      throw new BadRequestException('Payment verification failed');
    }

    // Mark as paid — atomically claim the transition so only the first of any
    // racing/duplicate callbacks proceeds. The confirmation-SMS marker is set
    // in the same UPDATE, so the enrollee is messaged exactly once even without
    // DB transactions (Neon HTTP driver). A concurrent callback that already
    // passed the status fast-path above gets no row back here and skips the SMS.
    const courseForExpiry = await this.findById(enrollment.liveCourseId);
    const [claimed] = await this.db
      .update(liveEnrollments)
      .set({
        status:                'completed',
        paystationTrxId:       verification.data?.trx_id,
        paystationMethod:      verification.data?.payment_method,
        paidAt:                new Date(),
        expiresAt:             computeEnrollmentExpiry(courseForExpiry),
        confirmationSmsSentAt: new Date(),
      })
      .where(and(eq(liveEnrollments.id, enrollment.id), ne(liveEnrollments.status, 'completed')))
      .returning({ id: liveEnrollments.id });

    // Payment is now recorded. Everything below is a side-effect — it must
    // never throw out of here and turn a completed payment into a failure page.
    let courseSlug = '';
    try {
      const course = await this.findById(enrollment.liveCourseId);
      courseSlug = course.slug;

      if (claimed) {
        // Promote an account-linked buyer GUEST → STUDENT, mirroring the recorded
        // course flow (OrdersService.ensureStudentRole). Guests with no linked
        // user (standalone leads) are untouched — admin sets them up later.
        await this.promoteToStudent(enrollment.userId);

        // For bundles: enroll the user in each included recorded course
        if (course.courseType === 'bundle' && enrollment.userId && course.bundledCourses.length > 0) {
          for (const bc of course.bundledCourses) {
            await this.db
              .insert(enrollments)
              .values({ userId: enrollment.userId, courseId: bc.id, orderId: null, status: 'active' })
              .onConflictDoNothing();
          }
        }

        // Confirmation SMS to the enrollee (best effort).
        await this.smsTemplates.send('live_enrollment_confirmation', enrollment.phone, {
          name: enrollment.name,
          batch_name: course.title,
        });

        // Guest purchase — reflect the confirmed payment method on the linked
        // lead so admin sees it before fulfilling.
        if (!enrollment.userId) {
          await this.db
            .update(leads)
            .set({ paymentMethod: verification.data?.payment_method ?? null, updatedAt: new Date() })
            .where(eq(leads.liveEnrollmentId, enrollment.id));
        }

        // Auto-create subscription for subscription-enabled courses
        if (course.hasSubscription && enrollment.userId) {
          const monthlyPrice = parseFloat(String(course.monthlyPrice ?? 0));
          if (monthlyPrice > 0) {
            // Check if subscription already exists (idempotent)
            const [existingSub] = await this.db
              .select({ id: liveSubscriptions.id })
              .from(liveSubscriptions)
              .where(eq(liveSubscriptions.enrollmentId, enrollment.id))
              .limit(1);

            if (!existingSub) {
              const now = new Date();
              const nextBilling = new Date(now);
              nextBilling.setDate(nextBilling.getDate() + 30);

              // Mark enrollment as subscription mode
              await this.db
                .update(liveEnrollments)
                .set({ paymentMode: 'subscription' })
                .where(eq(liveEnrollments.id, enrollment.id));

              const [newSub] = await this.db
                .insert(liveSubscriptions)
                .values({
                  liveCourseId: course.id,
                  enrollmentId: enrollment.id,
                  userId: enrollment.userId,
                  batchId: enrollment.batchId,
                  gateway: 'paystation',
                  monthlyPrice: String(monthlyPrice),
                  status: 'active',
                  currentPeriodStart: now,
                  nextBillingAt: nextBilling,
                  lastPaymentAt: now,
                })
                .returning({ id: liveSubscriptions.id });

              // Record initial payment
              if (newSub) {
                await this.db.insert(liveSubscriptionPayments).values({
                  subscriptionId: newSub.id,
                  amount: String(monthlyPrice),
                  method: 'paystation',
                  status: 'completed',
                  paidAt: now,
                });
              }
            }
          }
        }
      }
    } catch (err) {
      this.logger.error(`Post-payment side-effect failed for invoice ${invoiceNumber}`, err as Error);
    }

    return { alreadyPaid: !claimed, liveCourseId: enrollment.liveCourseId, courseSlug };
  }

  // ── Payment: verify callback from bKash ─────────────────────────────────────

  async verifyBkashLivePayment(paymentID: string, status: string) {
    const [enrollment] = await this.db
      .select()
      .from(liveEnrollments)
      .where(eq(liveEnrollments.bkashPaymentId, paymentID))
      .limit(1);

    if (!enrollment) throw new NotFoundException('Enrollment not found');

    if (enrollment.status === 'completed') {
      await this.promoteToStudent(enrollment.userId);
      const course = await this.findById(enrollment.liveCourseId);
      return { alreadyPaid: true, liveCourseId: enrollment.liveCourseId, courseSlug: course.slug };
    }

    if (status !== 'success') {
      const done = await this.completedResultIfPaid(enrollment);
      if (done) return done;
      throw new BadRequestException(`Payment ${status}`);
    }

    let execution: Awaited<ReturnType<typeof this.bkash.executePayment>>;
    try {
      execution = await this.bkash.executePayment(paymentID);
    } catch (err) {
      const done = await this.completedResultIfPaid(enrollment);
      if (done) return done;
      throw err;
    }

    const succeeded = execution.transactionStatus?.toLowerCase() === 'completed';

    if (!succeeded) {
      const done = await this.completedResultIfPaid(enrollment);
      if (done) return done;

      this.logger.warn(`Live bKash payment NOT verified for paymentID ${paymentID}: ${JSON.stringify(execution)}`);
      throw new BadRequestException('Payment verification failed');
    }

    const courseForExpiry = await this.findById(enrollment.liveCourseId);
    const [claimed] = await this.db
      .update(liveEnrollments)
      .set({
        status:                'completed',
        bkashPgwTrxId:         execution.trxID,
        bkashPgwStatus:        execution.transactionStatus,
        paidAt:                new Date(),
        expiresAt:             computeEnrollmentExpiry(courseForExpiry),
        confirmationSmsSentAt: new Date(),
      })
      .where(and(eq(liveEnrollments.id, enrollment.id), ne(liveEnrollments.status, 'completed')))
      .returning({ id: liveEnrollments.id });

    let courseSlug = '';
    try {
      const course = await this.findById(enrollment.liveCourseId);
      courseSlug = course.slug;

      if (claimed) {
        await this.promoteToStudent(enrollment.userId);

        if (course.courseType === 'bundle' && enrollment.userId && course.bundledCourses.length > 0) {
          for (const bc of course.bundledCourses) {
            await this.db
              .insert(enrollments)
              .values({ userId: enrollment.userId, courseId: bc.id, orderId: null, status: 'active' })
              .onConflictDoNothing();
          }
        }

        await this.smsTemplates.send('live_enrollment_confirmation', enrollment.phone, {
          name: enrollment.name,
          batch_name: course.title,
        });

        if (!enrollment.userId) {
          await this.db
            .update(leads)
            .set({ paymentMethod: 'bKash', updatedAt: new Date() })
            .where(eq(leads.liveEnrollmentId, enrollment.id));
        }

        // Auto-create subscription for subscription-enabled courses
        if (course.hasSubscription && enrollment.userId) {
          const monthlyPrice = parseFloat(String(course.monthlyPrice ?? 0));
          if (monthlyPrice > 0) {
            // Check if subscription already exists (idempotent)
            const [existingSub] = await this.db
              .select({ id: liveSubscriptions.id })
              .from(liveSubscriptions)
              .where(eq(liveSubscriptions.enrollmentId, enrollment.id))
              .limit(1);

            if (!existingSub) {
              const now = new Date();
              const nextBilling = new Date(now);
              nextBilling.setDate(nextBilling.getDate() + 30);

              // Mark enrollment as subscription mode
              await this.db
                .update(liveEnrollments)
                .set({ paymentMode: 'subscription' })
                .where(eq(liveEnrollments.id, enrollment.id));

              const [newSub] = await this.db
                .insert(liveSubscriptions)
                .values({
                  liveCourseId: course.id,
                  enrollmentId: enrollment.id,
                  userId: enrollment.userId,
                  batchId: enrollment.batchId,
                  gateway: 'bkash_pgw',
                  monthlyPrice: String(monthlyPrice),
                  status: 'active',
                  currentPeriodStart: now,
                  nextBillingAt: nextBilling,
                  lastPaymentAt: now,
                })
                .returning({ id: liveSubscriptions.id });

              if (newSub) {
                await this.db.insert(liveSubscriptionPayments).values({
                  subscriptionId: newSub.id,
                  amount: String(monthlyPrice),
                  method: 'bkash_pgw',
                  status: 'completed',
                  paidAt: now,
                });
              }
            }
          }
        }
      }
    } catch (err) {
      this.logger.error(`Post-payment side-effect failed for paymentID ${paymentID}`, err as Error);
    }

    return { alreadyPaid: !claimed, liveCourseId: enrollment.liveCourseId, courseSlug };
  }

  /** Promote a GUEST buyer to STUDENT once their live enrollment is paid. No-op
   *  for guests with no linked account or for users already past GUEST. */
  private async promoteToStudent(userId: number | null) {
    if (!userId) return;
    await this.db
      .update(users)
      .set({ role: 'STUDENT' })
      .where(and(eq(users.id, userId), eq(users.role, 'GUEST')));
  }

  /**
   * If a concurrent/earlier callback already completed this enrollment, return
   * the success result (so a racing duplicate callback never shows a failure
   * page). Re-reads a few times because the other hit may still be committing
   * its verify→claim when this one arrives. Returns null if never completed.
   */
  private async completedResultIfPaid(enrollment: { id: number; userId: number | null; liveCourseId: number }) {
    for (let attempt = 0; attempt < 3; attempt++) {
      const [fresh] = await this.db
        .select({ status: liveEnrollments.status })
        .from(liveEnrollments)
        .where(eq(liveEnrollments.id, enrollment.id))
        .limit(1);
      if (fresh?.status === 'completed') {
        await this.promoteToStudent(enrollment.userId);
        const course = await this.findById(enrollment.liveCourseId);
        return { alreadyPaid: true, liveCourseId: enrollment.liveCourseId, courseSlug: course.slug };
      }
      if (attempt < 2) await new Promise((r) => setTimeout(r, 800));
    }
    return null;
  }

  // ── Admin: list published recorded courses (for bundle picker) ────────────

  async listPublishedRecordedCourses() {
    return this.db
      .select({ id: courses.id, title: courses.title, slug: courses.slug, price: courses.price, thumbnail: courses.thumbnail })
      .from(courses)
      .where(eq(courses.status, 'published'))
      .orderBy(courses.title);
  }

  async trackLiveCourseInterest(userId: number, liveCourseId: number): Promise<void> {
    try {
      const now = new Date();
      await this.db
        .insert(userCourseInterests)
        .values({ userId, courseId: null, liveCourseId, firstSeenAt: now, lastSeenAt: now, visitCount: 1 })
        .onConflictDoUpdate({
          target: [userCourseInterests.userId, userCourseInterests.liveCourseId],
          targetWhere: sql`${userCourseInterests.liveCourseId} IS NOT NULL`,
          set: {
            lastSeenAt: now,
            visitCount: sql`${userCourseInterests.visitCount} + 1`,
          },
        });
    } catch { /* intentionally swallowed */ }
  }
}
