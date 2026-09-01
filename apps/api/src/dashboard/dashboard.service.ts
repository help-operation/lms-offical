import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, gte, inArray, lte, sql, type SQL } from 'drizzle-orm';
import type { DB } from 'src/db';
import { DB_TOKEN } from 'src/db/db.module';
import {
  adminUsers,
  certificates,
  courses,
  enrollments,
  leads,
  liveCertificates,
  liveCourses,
  liveEnrollments,
  orderItems,
  payments,
  siteVisits,
  supportMessages,
  supportTickets,
  users,
} from 'src/db/schema';
import type { DashboardQueryInput } from './dto/dashboard-query.dto';

interface Window {
  from: Date;
  to: Date;
}

/** Resolved course/instructor/package filter — see resolveRecordedCourseIds/resolveLiveCourseIds. */
interface CourseScope {
  recordedCourseIds: number[] | undefined;
  liveCourseIds: number[] | undefined;
  anyCourseScope: boolean;
}

@Injectable()
export class DashboardService {
  constructor(@Inject(DB_TOKEN) private readonly db: DB) {}

  // getOverview fans out into ~80 concurrent Neon queries (see below) — cheap
  // per query, but expensive in aggregate, and the neon-http driver has no
  // connection pooling, so that many simultaneous requests can queue/time out
  // under load. Most dashboard views hit the same period filter repeatedly
  // (page revisits, multiple staff, polling), so a short-TTL cache keyed by
  // the resolved query params avoids re-running the whole fan-out every time.
  private readonly overviewCache = new Map<string, { data: unknown; expiresAt: number }>();
  private static readonly OVERVIEW_CACHE_TTL_MS = 30_000;

  // ─── Date window helpers ────────────────────────────────────────────────────

  private startOfDay(d: Date) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }
  private startOfWeek(d: Date) {
    const day = this.startOfDay(d);
    const dow = (day.getDay() + 6) % 7; // Monday = 0
    day.setDate(day.getDate() - dow);
    return day;
  }
  private startOfMonth(d: Date) {
    return new Date(d.getFullYear(), d.getMonth(), 1);
  }
  private startOfYear(d: Date) {
    return new Date(d.getFullYear(), 0, 1);
  }

  /** Resolves the page-level filter window. No period given = all-time. */
  private resolveWindow(q: DashboardQueryInput): Window {
    const now = new Date();
    switch (q.period) {
      case 'today':  return { from: this.startOfDay(now), to: now };
      case 'week':   return { from: this.startOfWeek(now), to: now };
      case 'month':  return { from: this.startOfMonth(now), to: now };
      case 'year':   return { from: this.startOfYear(now), to: now };
      case 'custom':
        return {
          from: q.date_from ? new Date(q.date_from) : this.startOfMonth(now),
          to:   q.date_to ? new Date(`${q.date_to}T23:59:59`) : now,
        };
      default:
        return { from: new Date(0), to: now };
    }
  }

  /** Same-length window immediately preceding `w`, for %-change comparisons. */
  private prevWindow(w: Window): Window {
    const span = w.to.getTime() - w.from.getTime();
    return { from: new Date(w.from.getTime() - span), to: new Date(w.from.getTime()) };
  }

  private pctChange(current: number, previous: number): number | null {
    if (previous === 0) return current > 0 ? 100 : null;
    return Math.round(((current - previous) / previous) * 1000) / 10;
  }

  // ─── Course / Instructor / Package scope resolution ─────────────────────────
  // `course_id` (paired with `course_type`), `instructor_id` (recorded courses
  // only — liveCourses has no instructor column), and `package_id` (a bundle-type
  // liveCourses row) all narrow the same underlying "which courses" question, so
  // they're resolved once per request into concrete id lists that Student
  // Overview / Revenue / Payment Methods then scope their queries to.

  /** Recorded course ids matching course_id/instructor_id. `undefined` = no recorded-course scope requested. */
  private async resolveRecordedCourseIds(q: DashboardQueryInput): Promise<number[] | undefined> {
    const conds: SQL[] = [];
    if (q.course_id && q.course_type === 'recorded') conds.push(eq(courses.id, Number(q.course_id)) as SQL);
    if (q.instructor_id) conds.push(eq(courses.instructorId, Number(q.instructor_id)) as SQL);
    if (conds.length === 0) return undefined;

    const rows = await this.db.select({ id: courses.id }).from(courses).where(and(...conds));
    return rows.map((r) => r.id);
  }

  /** Live/bundle course ids matching course_id (live) or package_id. `undefined` = no live-course scope requested. */
  private resolveLiveCourseIds(q: DashboardQueryInput): number[] | undefined {
    const ids: number[] = [];
    if (q.package_id) ids.push(Number(q.package_id));
    if (q.course_id && q.course_type === 'live') ids.push(Number(q.course_id));
    return ids.length > 0 ? ids : undefined;
  }

  // ─── Overview (combined payload) ────────────────────────────────────────────

  async getOverview(q: DashboardQueryInput) {
    const cacheKey = JSON.stringify(q);
    const cached = this.overviewCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) return cached.data;

    const result = await this.computeOverview(q);

    this.overviewCache.set(cacheKey, {
      data: result,
      expiresAt: Date.now() + DashboardService.OVERVIEW_CACHE_TTL_MS,
    });
    return result;
  }

  private async computeOverview(q: DashboardQueryInput) {
    const window = this.resolveWindow(q);
    const anyCourseScope = Boolean(q.course_id || q.instructor_id || q.package_id);
    const [recordedCourseIds, liveCourseIds] = await Promise.all([
      this.resolveRecordedCourseIds(q),
      Promise.resolve(this.resolveLiveCourseIds(q)),
    ]);
    const courseScope = { recordedCourseIds, liveCourseIds, anyCourseScope };

    const [
      topStats,
      studentOverview,
      courseCount,
      visitorSource,
      leadOverview,
      revenueOverview,
      visitorActivity,
      supportOverview,
      paymentMethods,
      paymentStatus,
      location,
      devices,
      gender,
    ] = await Promise.all([
      this.getTopStats(window),
      this.getStudentOverview(q, courseScope),
      this.getCourseCount(),
      this.getVisitorSource(window, q),
      this.getLeadOverview(window),
      this.getRevenueOverview(window, courseScope),
      this.getVisitorActivity(window, q),
      this.getSupportOverview(window),
      this.getPaymentMethods(window, courseScope),
      this.getPaymentStatusOverview(window),
      this.getLocation(window, q),
      this.getDevices(window, q),
      this.getGender(),
    ]);

    return {
      topStats,
      studentOverview,
      courseCount,
      visitorSource,
      leadOverview,
      revenueOverview,
      // No partial-payment/installment concept exists in this schema today —
      // Receivable always equals Revenue and Due is always 0. Kept as its own
      // response key (not deduplicated) so a future installment feature only
      // has to change this one block.
      receivableOverview: { ...revenueOverview, due: 0 },
      visitorActivity,
      supportOverview,
      paymentMethods,
      paymentStatus,
      location,
      devices,
      gender,
    };
  }

  // ─── Top stat strip ──────────────────────────────────────────────────────────

  // All 11 window/prev-window counts below hit the same `users` table with no
  // per-window filtering beyond the date range, so a single query with one
  // COUNT(*) FILTER (WHERE ...) column per window replaces 11 round trips
  // with 1 — this was the single largest contributor to computeOverview()'s
  // query fan-out (see the comment on `overviewCache` above).
  private async getTopStats(filterWindow: Window) {
    const now = new Date();
    const windows = {
      today: { from: this.startOfDay(now), to: now },
      week:  { from: this.startOfWeek(now), to: now },
      month: { from: this.startOfMonth(now), to: now },
      year:  { from: this.startOfYear(now), to: now },
    };
    const totalWindow = { from: new Date(0), to: now };
    const prevToday = this.prevWindow(windows.today);
    const prevWeek = this.prevWindow(windows.week);
    const prevMonth = this.prevWindow(windows.month);
    const prevYear = this.prevWindow(windows.year);
    const prevFiltered = this.prevWindow(filterWindow);

    const dateBetween = (w: Window) => sql`${users.createdAt} BETWEEN ${w.from} AND ${w.to}`;

    const [row] = await this.db
      .select({
        today:        sql<number>`COUNT(*) FILTER (WHERE ${dateBetween(windows.today)})`.mapWith(Number),
        week:         sql<number>`COUNT(*) FILTER (WHERE ${dateBetween(windows.week)})`.mapWith(Number),
        month:        sql<number>`COUNT(*) FILTER (WHERE ${dateBetween(windows.month)})`.mapWith(Number),
        year:         sql<number>`COUNT(*) FILTER (WHERE ${dateBetween(windows.year)})`.mapWith(Number),
        total:        sql<number>`COUNT(*) FILTER (WHERE ${dateBetween(totalWindow)})`.mapWith(Number),
        filtered:     sql<number>`COUNT(*) FILTER (WHERE ${dateBetween(filterWindow)})`.mapWith(Number),
        todayPrev:    sql<number>`COUNT(*) FILTER (WHERE ${dateBetween(prevToday)})`.mapWith(Number),
        weekPrev:     sql<number>`COUNT(*) FILTER (WHERE ${dateBetween(prevWeek)})`.mapWith(Number),
        monthPrev:    sql<number>`COUNT(*) FILTER (WHERE ${dateBetween(prevMonth)})`.mapWith(Number),
        yearPrev:     sql<number>`COUNT(*) FILTER (WHERE ${dateBetween(prevYear)})`.mapWith(Number),
        filteredPrev: sql<number>`COUNT(*) FILTER (WHERE ${dateBetween(prevFiltered)})`.mapWith(Number),
      })
      .from(users)
      .where(eq(users.role, 'STUDENT'));

    return {
      today: { count: row.today, change: this.pctChange(row.today, row.todayPrev) },
      week:  { count: row.week, change: this.pctChange(row.week, row.weekPrev) },
      month: { count: row.month, change: this.pctChange(row.month, row.monthPrev) },
      year:  { count: row.year, change: this.pctChange(row.year, row.yearPrev) },
      // All-time has no meaningful "previous period" to compare against.
      total: { count: row.total, change: null },
      // Matches the page-level period/custom-range filter — lets the frontend
      // show a single card driven by whichever period tab is selected.
      filtered: { count: row.filtered, change: this.pctChange(row.filtered, row.filteredPrev) },
    };
  }

  // ─── Student Overview ────────────────────────────────────────────────────────

  private async getStudentOverview(q: DashboardQueryInput, scope: CourseScope) {
    const genderCond = q.gender && q.gender !== 'all' ? eq(users.gender, q.gender) : undefined;
    const studentWhere = genderCond ? and(eq(users.role, 'STUDENT'), genderCond) : eq(users.role, 'STUDENT');
    const { recordedCourseIds, liveCourseIds, anyCourseScope } = scope;

    /** Runs `scoped` when a recorded/live course scope resolved to specific ids, `zero` when it resolved to none, or `unscoped` when no course/instructor/package filter is active at all. */
    const scopedCount = <T>(ids: number[] | undefined, scoped: (ids: number[]) => Promise<T>, unscoped: () => Promise<T>, zero: T): Promise<T> => {
      if (ids !== undefined) return ids.length > 0 ? scoped(ids) : Promise.resolve(zero);
      return anyCourseScope ? Promise.resolve(zero) : unscoped();
    };
    const scopedCountNum = (ids: number[] | undefined, scoped: (ids: number[]) => Promise<number>, unscoped: () => Promise<number>) =>
      scopedCount(ids, scoped, unscoped, 0);

    // Enrolled and dropout counts both hit `enrollments` under the same course
    // scope, differing only by an extra NOT IN filter — merged into one query
    // per branch (was two) via COUNT(...) FILTER instead of a second round trip.
    const dropoutCondition = sql`
      ${enrollments.userId} NOT IN (
        SELECT user_id FROM lesson_progress
        WHERE updated_at >= NOW() - INTERVAL '90 days'
      )
    `;
    const recordedEnrollAndDropout = scopedCount(
      recordedCourseIds,
      async (ids) => {
        const [row] = await this.db
          .select({
            enrolled: sql<number>`COUNT(DISTINCT ${enrollments.userId})`.mapWith(Number),
            dropout: sql<number>`COUNT(DISTINCT ${enrollments.userId}) FILTER (WHERE ${dropoutCondition})`.mapWith(Number),
          })
          .from(enrollments)
          .where(inArray(enrollments.courseId, ids));
        return row ?? { enrolled: 0, dropout: 0 };
      },
      async () => {
        const [row] = await this.db
          .select({
            enrolled: sql<number>`COUNT(DISTINCT ${enrollments.userId})`.mapWith(Number),
            dropout: sql<number>`COUNT(DISTINCT ${enrollments.userId}) FILTER (WHERE ${dropoutCondition})`.mapWith(Number),
          })
          .from(enrollments);
        return row ?? { enrolled: 0, dropout: 0 };
      },
      { enrolled: 0, dropout: 0 },
    );

    const [
      totalActiveRow,
      recCertCount, liveCertCount,
      { enrolled: recStudentsCount, dropout: dropoutCount }, liveStudentsCount,
      freeStudentsCount,
    ] = await Promise.all([
      // `total` needs no extra condition (the base WHERE already scopes to studentWhere);
      // `active` adds one more via FILTER — one query instead of two.
      this.db
        .select({
          total: sql<number>`COUNT(*)`.mapWith(Number),
          active: sql<number>`COUNT(*) FILTER (WHERE ${users.status} = 'active')`.mapWith(Number),
        })
        .from(users).where(studentWhere).then((r) => r[0] ?? { total: 0, active: 0 }),
      scopedCountNum(recordedCourseIds,
        (ids) => this.db.select({ count: sql<number>`COUNT(DISTINCT ${certificates.userId})`.mapWith(Number) })
          .from(certificates).where(inArray(certificates.courseId, ids)).then((r) => r[0]?.count ?? 0),
        () => this.db.select({ count: sql<number>`COUNT(DISTINCT ${certificates.userId})`.mapWith(Number) })
          .from(certificates).then((r) => r[0]?.count ?? 0)),
      scopedCountNum(liveCourseIds,
        (ids) => this.db.select({ count: sql<number>`COUNT(DISTINCT ${liveCertificates.userId})`.mapWith(Number) })
          .from(liveCertificates).where(inArray(liveCertificates.liveCourseId, ids)).then((r) => r[0]?.count ?? 0),
        () => this.db.select({ count: sql<number>`COUNT(DISTINCT ${liveCertificates.userId})`.mapWith(Number) })
          .from(liveCertificates).then((r) => r[0]?.count ?? 0)),
      // Dropout: enrolled but never made lesson progress, or last progress > 90 days ago.
      // No live-course dropout concept exists in this schema, so a live/package-only
      // scope (recordedCourseIds undefined) yields 0 via scopedCount's anyCourseScope branch.
      recordedEnrollAndDropout,
      scopedCountNum(liveCourseIds,
        (ids) => this.db.select({ count: sql<number>`COUNT(DISTINCT ${liveEnrollments.userId})`.mapWith(Number) })
          .from(liveEnrollments).where(and(inArray(liveEnrollments.liveCourseId, ids), sql`${liveEnrollments.userId} IS NOT NULL`))
          .then((r) => r[0]?.count ?? 0),
        () => this.db.select({ count: sql<number>`COUNT(DISTINCT ${liveEnrollments.userId})`.mapWith(Number) })
          .from(liveEnrollments).where(sql`${liveEnrollments.userId} IS NOT NULL`).then((r) => r[0]?.count ?? 0)),
      this.countFreeCourseStudents(recordedCourseIds, liveCourseIds, anyCourseScope),
    ]);

    return {
      totalStudents: totalActiveRow.total,
      activeStudents: totalActiveRow.active,
      totalCertified: recCertCount + liveCertCount,
      liveCourseStudents: liveStudentsCount,
      recordedCourseStudents: recStudentsCount,
      freeCourseStudents: freeStudentsCount,
      dropoutStudents: dropoutCount,
    };
  }

  /** Free-course (price = 0) student count, optionally scoped to specific recorded/live course ids. */
  private async countFreeCourseStudents(
    recordedCourseIds: number[] | undefined,
    liveCourseIds: number[] | undefined,
    anyCourseScope: boolean,
  ): Promise<number> {
    if (!anyCourseScope) {
      // Unscoped path: distinct users across recorded+live combined via UNION so a
      // student free-enrolled in both isn't double-counted.
      const result = await this.db.execute(sql`
        SELECT COUNT(DISTINCT uid) AS count FROM (
          SELECT e.user_id AS uid FROM enrollments e
            JOIN courses c ON c.id = e.course_id WHERE c.price = 0
          UNION
          SELECT le.user_id AS uid FROM live_enrollments le
            JOIN live_courses lc ON lc.id = le.live_course_id
            WHERE lc.price = 0 AND le.user_id IS NOT NULL
        ) t
      `);
      return Number((result as unknown as { rows: { count: string }[] }).rows?.[0]?.count ?? 0);
    }

    // Scoped path: sum recorded + live counts within the selected scope. A student
    // free-enrolled in both a scoped recorded AND scoped live course would be
    // counted twice — an acceptable simplification since a course/instructor/
    // package filter scopes to one specific course type in practice.
    let recordedCount = 0;
    if (recordedCourseIds && recordedCourseIds.length > 0) {
      const [row] = await this.db
        .select({ count: sql<number>`COUNT(DISTINCT ${enrollments.userId})`.mapWith(Number) })
        .from(enrollments)
        .innerJoin(courses, eq(courses.id, enrollments.courseId))
        .where(and(sql`${courses.price} = 0`, inArray(enrollments.courseId, recordedCourseIds)));
      recordedCount = row?.count ?? 0;
    }

    let liveCount = 0;
    if (liveCourseIds && liveCourseIds.length > 0) {
      const [row] = await this.db
        .select({ count: sql<number>`COUNT(DISTINCT ${liveEnrollments.userId})`.mapWith(Number) })
        .from(liveEnrollments)
        .innerJoin(liveCourses, eq(liveCourses.id, liveEnrollments.liveCourseId))
        .where(and(sql`${liveCourses.price} = 0`, inArray(liveEnrollments.liveCourseId, liveCourseIds), sql`${liveEnrollments.userId} IS NOT NULL`));
      liveCount = row?.count ?? 0;
    }

    return recordedCount + liveCount;
  }

  // ─── Course Count ────────────────────────────────────────────────────────────

  private async getCourseCount() {
    // Free is its own mutually-exclusive bucket (matches the reference dashboard's
    // 3-way Live/Recorded/Free split) rather than a subset of Live/Recorded, so
    // a paid recorded course counts under "Recorded" and a $0 one counts under
    // "Free" only — never both.
    const [[recordedRow], [liveRow]] = await Promise.all([
      this.db.select({
        paid: sql<number>`COUNT(*) FILTER (WHERE ${courses.price} > 0)`.mapWith(Number),
        free: sql<number>`COUNT(*) FILTER (WHERE ${courses.price} = 0)`.mapWith(Number),
      }).from(courses),
      this.db.select({
        paid: sql<number>`COUNT(*) FILTER (WHERE ${liveCourses.price} > 0)`.mapWith(Number),
        free: sql<number>`COUNT(*) FILTER (WHERE ${liveCourses.price} = 0)`.mapWith(Number),
      }).from(liveCourses).where(eq(liveCourses.courseType, 'live')),
    ]);

    const recorded = recordedRow?.paid ?? 0;
    const live = liveRow?.paid ?? 0;
    const free = (recordedRow?.free ?? 0) + (liveRow?.free ?? 0);

    return { recorded, live, free, total: recorded + live + free };
  }

  // ─── Per-course student list (separate endpoint) ────────────────────────────

  async getPerCourseStudents() {
    const [recorded, live] = await Promise.all([
      this.db
        .select({ id: courses.id, title: courses.title, type: sql<'recorded'>`'recorded'`, students: courses.totalStudents })
        .from(courses),
      this.db
        .select({
          id: liveCourses.id,
          title: liveCourses.title,
          type: sql<'live'>`'live'`,
          students: sql<number>`COUNT(${liveEnrollments.id})`.mapWith(Number),
        })
        .from(liveCourses)
        .leftJoin(liveEnrollments, eq(liveEnrollments.liveCourseId, liveCourses.id))
        .groupBy(liveCourses.id, liveCourses.title),
    ]);

    return [...recorded, ...live].sort((a, b) => b.students - a.students);
  }

  // ─── Visitor Source ──────────────────────────────────────────────────────────

  private siteVisitConds(window: Window, q: DashboardQueryInput): SQL[] {
    const conds: SQL[] = [gte(siteVisits.createdAt, window.from) as SQL, lte(siteVisits.createdAt, window.to) as SQL];
    if (q.location) conds.push(sql`${siteVisits.country} ILIKE ${'%' + q.location + '%'}` as SQL);
    if (q.device && q.device !== 'all') conds.push(eq(siteVisits.device, q.device) as unknown as SQL);
    if (q.source) conds.push(eq(siteVisits.source, q.source as never) as unknown as SQL);
    return conds;
  }

  private async getVisitorSource(window: Window, q: DashboardQueryInput) {
    const rows = await this.db
      .select({ source: siteVisits.source, count: sql<number>`COUNT(*)`.mapWith(Number) })
      .from(siteVisits)
      .where(and(...this.siteVisitConds(window, q)))
      .groupBy(siteVisits.source);

    const bySource = Object.fromEntries(rows.map((r) => [r.source, r.count]));
    const total = rows.reduce((sum, r) => sum + r.count, 0);
    return { bySource, total };
  }

  // ─── Lead Overview ───────────────────────────────────────────────────────────

  private async getLeadOverview(window: Window) {
    const now = new Date();
    const windows = {
      today: { from: this.startOfDay(now), to: now },
      week:  { from: this.startOfWeek(now), to: now },
      month: { from: this.startOfMonth(now), to: now },
      year:  { from: this.startOfYear(now), to: now },
    };

    const [row] = await this.db
      .select({
        today: sql<number>`COUNT(*) FILTER (WHERE ${leads.createdAt} BETWEEN ${windows.today.from} AND ${windows.today.to})`.mapWith(Number),
        week:  sql<number>`COUNT(*) FILTER (WHERE ${leads.createdAt} BETWEEN ${windows.week.from} AND ${windows.week.to})`.mapWith(Number),
        month: sql<number>`COUNT(*) FILTER (WHERE ${leads.createdAt} BETWEEN ${windows.month.from} AND ${windows.month.to})`.mapWith(Number),
        year:  sql<number>`COUNT(*) FILTER (WHERE ${leads.createdAt} BETWEEN ${windows.year.from} AND ${windows.year.to})`.mapWith(Number),
        total: sql<number>`COUNT(*)`.mapWith(Number),
        filtered: sql<number>`COUNT(*) FILTER (WHERE ${leads.createdAt} BETWEEN ${window.from} AND ${window.to})`.mapWith(Number),
      })
      .from(leads);

    return row;
  }

  // ─── Revenue / Receivable Overview ──────────────────────────────────────────

  /** Shared window shape for the 6 sum columns every revenue/support/payment-status query below uses. */
  private revenueWindows(window: Window) {
    const now = new Date();
    return {
      today: { from: this.startOfDay(now), to: now },
      week:  { from: this.startOfWeek(now), to: now },
      month: { from: this.startOfMonth(now), to: now },
      year:  { from: this.startOfYear(now), to: now },
      total: { from: new Date(0), to: now },
      filtered: window,
    };
  }

  private async getRevenueOverview(window: Window, scope: CourseScope) {
    const { recordedCourseIds, liveCourseIds, anyCourseScope } = scope;
    const w = this.revenueWindows(window);
    const zero = { today: 0, week: 0, month: 0, year: 0, total: 0, filtered: 0 };

    // Was up to 12 queries (recordedSum/liveSum called once per window, 6 windows
    // each) — now 1 query per side (recorded/live) with a SUM(...) FILTER column
    // per window, regardless of scope.
    const recordedTotals = async () => {
      if (recordedCourseIds === undefined) {
        if (anyCourseScope) return zero; // scope is live/package-only
        const [row] = await this.db
          .select({
            today:    sql<string>`COALESCE(SUM(amount) FILTER (WHERE ${payments.paidAt} BETWEEN ${w.today.from} AND ${w.today.to}), 0)`,
            week:     sql<string>`COALESCE(SUM(amount) FILTER (WHERE ${payments.paidAt} BETWEEN ${w.week.from} AND ${w.week.to}), 0)`,
            month:    sql<string>`COALESCE(SUM(amount) FILTER (WHERE ${payments.paidAt} BETWEEN ${w.month.from} AND ${w.month.to}), 0)`,
            year:     sql<string>`COALESCE(SUM(amount) FILTER (WHERE ${payments.paidAt} BETWEEN ${w.year.from} AND ${w.year.to}), 0)`,
            total:    sql<string>`COALESCE(SUM(amount) FILTER (WHERE ${payments.paidAt} BETWEEN ${w.total.from} AND ${w.total.to}), 0)`,
            filtered: sql<string>`COALESCE(SUM(amount) FILTER (WHERE ${payments.paidAt} BETWEEN ${w.filtered.from} AND ${w.filtered.to}), 0)`,
          })
          .from(payments)
          .where(eq(payments.status, 'completed'));
        return row
          ? { today: Number(row.today), week: Number(row.week), month: Number(row.month), year: Number(row.year), total: Number(row.total), filtered: Number(row.filtered) }
          : zero;
      }
      if (recordedCourseIds.length === 0) return zero;
      // Sum each order item's own price (not the whole order's amount) so an order
      // spanning multiple courses only attributes the scoped course's own share.
      const [row] = await this.db
        .select({
          today:    sql<string>`COALESCE(SUM(${orderItems.price}) FILTER (WHERE ${payments.paidAt} BETWEEN ${w.today.from} AND ${w.today.to}), 0)`,
          week:     sql<string>`COALESCE(SUM(${orderItems.price}) FILTER (WHERE ${payments.paidAt} BETWEEN ${w.week.from} AND ${w.week.to}), 0)`,
          month:    sql<string>`COALESCE(SUM(${orderItems.price}) FILTER (WHERE ${payments.paidAt} BETWEEN ${w.month.from} AND ${w.month.to}), 0)`,
          year:     sql<string>`COALESCE(SUM(${orderItems.price}) FILTER (WHERE ${payments.paidAt} BETWEEN ${w.year.from} AND ${w.year.to}), 0)`,
          total:    sql<string>`COALESCE(SUM(${orderItems.price}) FILTER (WHERE ${payments.paidAt} BETWEEN ${w.total.from} AND ${w.total.to}), 0)`,
          filtered: sql<string>`COALESCE(SUM(${orderItems.price}) FILTER (WHERE ${payments.paidAt} BETWEEN ${w.filtered.from} AND ${w.filtered.to}), 0)`,
        })
        .from(orderItems)
        .innerJoin(payments, eq(payments.orderId, orderItems.orderId))
        .where(and(eq(payments.status, 'completed'), inArray(orderItems.courseId, recordedCourseIds)));
      return row
        ? { today: Number(row.today), week: Number(row.week), month: Number(row.month), year: Number(row.year), total: Number(row.total), filtered: Number(row.filtered) }
        : zero;
    };

    const liveTotals = async () => {
      if (liveCourseIds === undefined) {
        if (anyCourseScope) return zero; // scope is recorded-only
        const [row] = await this.db
          .select({
            today:    sql<string>`COALESCE(SUM(amount) FILTER (WHERE ${liveEnrollments.paidAt} BETWEEN ${w.today.from} AND ${w.today.to}), 0)`,
            week:     sql<string>`COALESCE(SUM(amount) FILTER (WHERE ${liveEnrollments.paidAt} BETWEEN ${w.week.from} AND ${w.week.to}), 0)`,
            month:    sql<string>`COALESCE(SUM(amount) FILTER (WHERE ${liveEnrollments.paidAt} BETWEEN ${w.month.from} AND ${w.month.to}), 0)`,
            year:     sql<string>`COALESCE(SUM(amount) FILTER (WHERE ${liveEnrollments.paidAt} BETWEEN ${w.year.from} AND ${w.year.to}), 0)`,
            total:    sql<string>`COALESCE(SUM(amount) FILTER (WHERE ${liveEnrollments.paidAt} BETWEEN ${w.total.from} AND ${w.total.to}), 0)`,
            filtered: sql<string>`COALESCE(SUM(amount) FILTER (WHERE ${liveEnrollments.paidAt} BETWEEN ${w.filtered.from} AND ${w.filtered.to}), 0)`,
          })
          .from(liveEnrollments)
          .where(eq(liveEnrollments.status, 'completed'));
        return row
          ? { today: Number(row.today), week: Number(row.week), month: Number(row.month), year: Number(row.year), total: Number(row.total), filtered: Number(row.filtered) }
          : zero;
      }
      if (liveCourseIds.length === 0) return zero;
      const [row] = await this.db
        .select({
          today:    sql<string>`COALESCE(SUM(amount) FILTER (WHERE ${liveEnrollments.paidAt} BETWEEN ${w.today.from} AND ${w.today.to}), 0)`,
          week:     sql<string>`COALESCE(SUM(amount) FILTER (WHERE ${liveEnrollments.paidAt} BETWEEN ${w.week.from} AND ${w.week.to}), 0)`,
          month:    sql<string>`COALESCE(SUM(amount) FILTER (WHERE ${liveEnrollments.paidAt} BETWEEN ${w.month.from} AND ${w.month.to}), 0)`,
          year:     sql<string>`COALESCE(SUM(amount) FILTER (WHERE ${liveEnrollments.paidAt} BETWEEN ${w.year.from} AND ${w.year.to}), 0)`,
          total:    sql<string>`COALESCE(SUM(amount) FILTER (WHERE ${liveEnrollments.paidAt} BETWEEN ${w.total.from} AND ${w.total.to}), 0)`,
          filtered: sql<string>`COALESCE(SUM(amount) FILTER (WHERE ${liveEnrollments.paidAt} BETWEEN ${w.filtered.from} AND ${w.filtered.to}), 0)`,
        })
        .from(liveEnrollments)
        .where(and(eq(liveEnrollments.status, 'completed'), inArray(liveEnrollments.liveCourseId, liveCourseIds)));
      return row
        ? { today: Number(row.today), week: Number(row.week), month: Number(row.month), year: Number(row.year), total: Number(row.total), filtered: Number(row.filtered) }
        : zero;
    };

    const [rec, live] = await Promise.all([recordedTotals(), liveTotals()]);
    return {
      today: rec.today + live.today,
      week: rec.week + live.week,
      month: rec.month + live.month,
      year: rec.year + live.year,
      total: rec.total + live.total,
      filtered: rec.filtered + live.filtered,
    };
  }

  // ─── Visitor Activity ────────────────────────────────────────────────────────

  private async getVisitorActivity(window: Window, q: DashboardQueryInput) {
    const conds = this.siteVisitConds(window, q);
    // pageViews/uniqueVisitors/avgStay all query siteVisits under the same WHERE —
    // AVG() already ignores NULLs on its own, so the explicit "IS NOT NULL" filter
    // the original had was redundant and can be dropped when merging into 1 query.
    const [[visitsRow], [messagesRow]] = await Promise.all([
      this.db.select({
        pageViews: sql<number>`COUNT(*)`.mapWith(Number),
        uniqueVisitors: sql<number>`COUNT(DISTINCT ${siteVisits.sessionId})`.mapWith(Number),
        avgStaySeconds: sql<string>`COALESCE(AVG(${siteVisits.durationSeconds}), 0)`,
      }).from(siteVisits).where(and(...conds)),
      this.db.select({ count: sql<number>`COUNT(*)`.mapWith(Number) }).from(supportMessages)
        .where(and(gte(supportMessages.createdAt, window.from), lte(supportMessages.createdAt, window.to))),
    ]);

    return {
      pageViews: visitsRow?.pageViews ?? 0,
      uniqueVisitors: visitsRow?.uniqueVisitors ?? 0,
      avgStaySeconds: Math.round(Number(visitsRow?.avgStaySeconds ?? 0)),
      liveChatMessages: messagesRow?.count ?? 0,
    };
  }

  // ─── Support Overview ────────────────────────────────────────────────────────

  private async getSupportOverview(window: Window) {
    const w = this.revenueWindows(window);

    const [[countsRow], [avgRow]] = await Promise.all([
      this.db.select({
        today:    sql<number>`COUNT(*) FILTER (WHERE ${supportTickets.createdAt} BETWEEN ${w.today.from} AND ${w.today.to})`.mapWith(Number),
        week:     sql<number>`COUNT(*) FILTER (WHERE ${supportTickets.createdAt} BETWEEN ${w.week.from} AND ${w.week.to})`.mapWith(Number),
        month:    sql<number>`COUNT(*) FILTER (WHERE ${supportTickets.createdAt} BETWEEN ${w.month.from} AND ${w.month.to})`.mapWith(Number),
        year:     sql<number>`COUNT(*) FILTER (WHERE ${supportTickets.createdAt} BETWEEN ${w.year.from} AND ${w.year.to})`.mapWith(Number),
        total:    sql<number>`COUNT(*)`.mapWith(Number),
        filtered: sql<number>`COUNT(*) FILTER (WHERE ${supportTickets.createdAt} BETWEEN ${w.filtered.from} AND ${w.filtered.to})`.mapWith(Number),
      }).from(supportTickets),
      // AVG() ignores NULL resolved_at rows on its own; no separate filter needed.
      this.db.select({ avgSeconds: sql<string>`COALESCE(AVG(EXTRACT(EPOCH FROM (resolved_at - created_at))), 0)` })
        .from(supportTickets),
    ]);

    return {
      today: countsRow?.today ?? 0,
      week: countsRow?.week ?? 0,
      month: countsRow?.month ?? 0,
      year: countsRow?.year ?? 0,
      total: countsRow?.total ?? 0,
      filtered: countsRow?.filtered ?? 0,
      avgSolutionSeconds: Math.round(Number(avgRow?.avgSeconds ?? 0)),
    };
  }

  // ─── Payment Methods ─────────────────────────────────────────────────────────

  /** Collapses PayStation's routed sub-methods back into the same real-world rail as direct payments. */
  private normalizeMethod(method: string | null | undefined): string {
    const m = (method ?? '').toLowerCase();
    if (m.includes('bkash')) return 'bkash';
    if (m.includes('nagad')) return 'nagad';
    if (m.includes('rocket')) return 'rocket';
    if (m.includes('upay')) return 'upay';
    if (m.includes('visa') || m.includes('master') || m.includes('card')) return 'card';
    if (m === 'free') return 'free';
    if (!m) return 'other';
    return 'other';
  }

  private async getPaymentMethods(window: Window, scope: CourseScope) {
    const { recordedCourseIds, liveCourseIds, anyCourseScope } = scope;

    const recRows = async (): Promise<{ method: string | null; paystationMethod: string | null; total: string }[]> => {
      if (recordedCourseIds === undefined) {
        if (anyCourseScope) return [];
        return this.db
          .select({ method: payments.method, paystationMethod: payments.paystationMethod, total: sql<string>`COALESCE(SUM(amount), 0)` })
          .from(payments)
          .where(and(eq(payments.status, 'completed'), gte(payments.paidAt, window.from), lte(payments.paidAt, window.to)))
          .groupBy(payments.method, payments.paystationMethod);
      }
      if (recordedCourseIds.length === 0) return [];
      // Sum each order item's own price so an order spanning multiple courses
      // only attributes the scoped course's own share (same reasoning as Revenue).
      return this.db
        .select({ method: payments.method, paystationMethod: payments.paystationMethod, total: sql<string>`COALESCE(SUM(${orderItems.price}), 0)` })
        .from(orderItems)
        .innerJoin(payments, eq(payments.orderId, orderItems.orderId))
        .where(and(
          eq(payments.status, 'completed'),
          gte(payments.paidAt, window.from), lte(payments.paidAt, window.to),
          inArray(orderItems.courseId, recordedCourseIds),
        ))
        .groupBy(payments.method, payments.paystationMethod);
    };

    const liveRows = async (): Promise<{ paystationMethod: string | null; total: string }[]> => {
      if (liveCourseIds === undefined) {
        if (anyCourseScope) return [];
        return this.db
          .select({ paystationMethod: liveEnrollments.paystationMethod, total: sql<string>`COALESCE(SUM(amount), 0)` })
          .from(liveEnrollments)
          .where(and(eq(liveEnrollments.status, 'completed'), gte(liveEnrollments.paidAt, window.from), lte(liveEnrollments.paidAt, window.to)))
          .groupBy(liveEnrollments.paystationMethod);
      }
      if (liveCourseIds.length === 0) return [];
      return this.db
        .select({ paystationMethod: liveEnrollments.paystationMethod, total: sql<string>`COALESCE(SUM(amount), 0)` })
        .from(liveEnrollments)
        .where(and(
          eq(liveEnrollments.status, 'completed'),
          gte(liveEnrollments.paidAt, window.from), lte(liveEnrollments.paidAt, window.to),
          inArray(liveEnrollments.liveCourseId, liveCourseIds),
        ))
        .groupBy(liveEnrollments.paystationMethod);
    };

    const [recRowsResult, liveRowsResult] = await Promise.all([recRows(), liveRows()]);

    const combined = new Map<string, number>();
    for (const r of recRowsResult) {
      const key = this.normalizeMethod(r.paystationMethod ?? r.method);
      combined.set(key, (combined.get(key) ?? 0) + Number(r.total));
    }
    for (const r of liveRowsResult) {
      const key = this.normalizeMethod(r.paystationMethod);
      combined.set(key, (combined.get(key) ?? 0) + Number(r.total));
    }

    return Object.fromEntries(combined);
  }

  // ─── Payment Status (Completed vs Failed) ───────────────────────────────────

  /**
   * Counts payment attempts by status across both recorded (`payments`) and live
   * (`liveEnrollments`) tables, one query per table per status (was 12 queries per
   * status — one per window per table — now 2). Completed rows are windowed by
   * `paidAt` (when they actually succeeded); failed rows have no `paidAt`, so
   * they're windowed by `createdAt` (when the attempt happened).
   */
  private async countPaymentsByStatusTotals(status: 'completed' | 'failed', window: Window) {
    const w = this.revenueWindows(window);
    const recDateCol = status === 'completed' ? payments.paidAt : payments.createdAt;
    const liveDateCol = status === 'completed' ? liveEnrollments.paidAt : liveEnrollments.createdAt;

    const [[recRow], [liveRow]] = await Promise.all([
      this.db.select({
        today:    sql<number>`COUNT(*) FILTER (WHERE ${recDateCol} BETWEEN ${w.today.from} AND ${w.today.to})`.mapWith(Number),
        week:     sql<number>`COUNT(*) FILTER (WHERE ${recDateCol} BETWEEN ${w.week.from} AND ${w.week.to})`.mapWith(Number),
        month:    sql<number>`COUNT(*) FILTER (WHERE ${recDateCol} BETWEEN ${w.month.from} AND ${w.month.to})`.mapWith(Number),
        year:     sql<number>`COUNT(*) FILTER (WHERE ${recDateCol} BETWEEN ${w.year.from} AND ${w.year.to})`.mapWith(Number),
        total:    sql<number>`COUNT(*) FILTER (WHERE ${recDateCol} BETWEEN ${w.total.from} AND ${w.total.to})`.mapWith(Number),
        filtered: sql<number>`COUNT(*) FILTER (WHERE ${recDateCol} BETWEEN ${w.filtered.from} AND ${w.filtered.to})`.mapWith(Number),
      }).from(payments).where(eq(payments.status, status)),
      this.db.select({
        today:    sql<number>`COUNT(*) FILTER (WHERE ${liveDateCol} BETWEEN ${w.today.from} AND ${w.today.to})`.mapWith(Number),
        week:     sql<number>`COUNT(*) FILTER (WHERE ${liveDateCol} BETWEEN ${w.week.from} AND ${w.week.to})`.mapWith(Number),
        month:    sql<number>`COUNT(*) FILTER (WHERE ${liveDateCol} BETWEEN ${w.month.from} AND ${w.month.to})`.mapWith(Number),
        year:     sql<number>`COUNT(*) FILTER (WHERE ${liveDateCol} BETWEEN ${w.year.from} AND ${w.year.to})`.mapWith(Number),
        total:    sql<number>`COUNT(*) FILTER (WHERE ${liveDateCol} BETWEEN ${w.total.from} AND ${w.total.to})`.mapWith(Number),
        filtered: sql<number>`COUNT(*) FILTER (WHERE ${liveDateCol} BETWEEN ${w.filtered.from} AND ${w.filtered.to})`.mapWith(Number),
      }).from(liveEnrollments).where(eq(liveEnrollments.status, status)),
    ]);

    return {
      today: (recRow?.today ?? 0) + (liveRow?.today ?? 0),
      week: (recRow?.week ?? 0) + (liveRow?.week ?? 0),
      month: (recRow?.month ?? 0) + (liveRow?.month ?? 0),
      year: (recRow?.year ?? 0) + (liveRow?.year ?? 0),
      total: (recRow?.total ?? 0) + (liveRow?.total ?? 0),
      filtered: (recRow?.filtered ?? 0) + (liveRow?.filtered ?? 0),
    };
  }

  private async getPaymentStatusOverview(window: Window) {
    const [completed, failed] = await Promise.all([
      this.countPaymentsByStatusTotals('completed', window),
      this.countPaymentsByStatusTotals('failed', window),
    ]);
    return { completed, failed };
  }

  // ─── Location ────────────────────────────────────────────────────────────────

  private async getLocation(window: Window, q: DashboardQueryInput) {
    const conds = this.siteVisitConds(window, q);
    const [countries, cities] = await Promise.all([
      this.db
        .select({ country: siteVisits.country, count: sql<number>`COUNT(DISTINCT ${siteVisits.sessionId})`.mapWith(Number) })
        .from(siteVisits)
        .where(and(...conds, sql`${siteVisits.country} IS NOT NULL`))
        .groupBy(siteVisits.country)
        .orderBy(desc(sql`COUNT(DISTINCT ${siteVisits.sessionId})`))
        .limit(5),
      this.db
        .select({ city: siteVisits.city, count: sql<number>`COUNT(DISTINCT ${siteVisits.sessionId})`.mapWith(Number) })
        .from(siteVisits)
        .where(and(...conds, eq(siteVisits.country, 'Bangladesh'), sql`${siteVisits.city} IS NOT NULL`))
        .groupBy(siteVisits.city)
        .orderBy(desc(sql`COUNT(DISTINCT ${siteVisits.sessionId})`))
        .limit(5),
    ]);

    return { topCountries: countries, topBangladeshCities: cities };
  }

  // ─── Devices ─────────────────────────────────────────────────────────────────

  private async getDevices(window: Window, q: DashboardQueryInput) {
    const conds = this.siteVisitConds(window, q);
    const rows = await this.db
      .select({ device: siteVisits.device, count: sql<number>`COUNT(*)`.mapWith(Number) })
      .from(siteVisits)
      .where(and(...conds))
      .groupBy(siteVisits.device);

    return Object.fromEntries(rows.map((r) => [r.device, r.count]));
  }

  // ─── Gender ──────────────────────────────────────────────────────────────────

  private async getGender() {
    const rows = await this.db
      .select({ gender: users.gender, count: sql<number>`COUNT(*)`.mapWith(Number) })
      .from(users)
      .where(eq(users.role, 'STUDENT'))
      .groupBy(users.gender);

    const result: Record<string, number> = { male: 0, female: 0, other: 0, not_specified: 0 };
    for (const r of rows) result[r.gender ?? 'not_specified'] = r.count;
    return result;
  }

  // ─── Filter dropdown lookups ─────────────────────────────────────────────────

  async getFilters() {
    const [recordedCourses, liveCourseRows, instructors, packages, locations] = await Promise.all([
      this.db.select({ id: courses.id, title: courses.title }).from(courses).orderBy(courses.title),
      this.db.select({ id: liveCourses.id, title: liveCourses.title }).from(liveCourses)
        .where(eq(liveCourses.courseType, 'live')).orderBy(liveCourses.title),
      this.db.select({ id: adminUsers.id, firstName: adminUsers.firstName, lastName: adminUsers.lastName })
        .from(adminUsers).where(eq(adminUsers.role, 'INSTRUCTOR')).orderBy(adminUsers.firstName),
      this.db.select({ id: liveCourses.id, title: liveCourses.title }).from(liveCourses)
        .where(eq(liveCourses.courseType, 'bundle')).orderBy(liveCourses.title),
      this.db.selectDistinct({ country: siteVisits.country }).from(siteVisits)
        .where(sql`${siteVisits.country} IS NOT NULL`),
    ]);

    return {
      courses: [
        ...recordedCourses.map((c) => ({ ...c, type: 'recorded' as const })),
        ...liveCourseRows.map((c) => ({ ...c, type: 'live' as const })),
      ],
      instructors,
      packages,
      locations: locations.map((l) => l.country).filter((c): c is string => Boolean(c)),
      devices: ['mobile', 'tablet', 'desktop'],
      genders: ['male', 'female', 'other'],
      sources: ['facebook', 'youtube', 'website', 'linkedin', 'twitter', 'instagram', 'direct', 'other'],
    };
  }

  // ─── System Health (separate, pollable endpoint) ────────────────────────────

  async getSystemHealth() {
    const start = Date.now();
    await this.db.execute(sql`SELECT 1`);
    const pingMs = Date.now() - start;

    let storageBytes = 0;
    try {
      const result = await this.db.execute(sql`SELECT pg_database_size(current_database()) AS size`);
      storageBytes = Number((result as unknown as { rows: { size: string }[] }).rows?.[0]?.size ?? 0);
    } catch {
      // Not fatal — some managed Postgres providers restrict this function.
      storageBytes = 0;
    }

    const uptimeSeconds = Math.round(process.uptime());
    const days = Math.floor(uptimeSeconds / 86_400);
    const hours = Math.floor((uptimeSeconds % 86_400) / 3600);

    return {
      apiPingMs: pingMs,
      storageBytes,
      storageGb: Math.round((storageBytes / 1e9) * 100) / 100,
      uptime: `${days}d ${hours}h`,
      status: pingMs < 500 ? 'healthy' : 'degraded',
    };
  }

  // ─── Enrollment Trend (filtered by date range) ──────────────────────────────

  async getEnrollmentTrend(q: DashboardQueryInput) {
    const window = this.resolveWindow(q);
    const daysDiff = Math.ceil((window.to.getTime() - window.from.getTime()) / 86400000);

    let groupByExpr: SQL;
    let labelExpr: SQL;

    if (daysDiff <= 31) {
      // Daily grouping
      groupByExpr = sql`DATE(${enrollments.enrolledAt})`;
      labelExpr = sql`TO_CHAR(${enrollments.enrolledAt}, 'Mon DD')`;
    } else if (daysDiff <= 365) {
      // Weekly grouping
      groupByExpr = sql`DATE_TRUNC('week', ${enrollments.enrolledAt})`;
      labelExpr = sql`TO_CHAR(DATE_TRUNC('week', ${enrollments.enrolledAt}), 'Mon DD')`;
    } else {
      // Monthly grouping
      groupByExpr = sql`DATE_TRUNC('month', ${enrollments.enrolledAt})`;
      labelExpr = sql`TO_CHAR(DATE_TRUNC('month', ${enrollments.enrolledAt}), 'Mon YYYY')`;
    }

    const recordedEnrollments = await this.db
      .select({
        label: labelExpr,
        group: groupByExpr,
        count: sql<number>`COUNT(*)`.mapWith(Number),
      })
      .from(enrollments)
      .where(and(gte(enrollments.enrolledAt, window.from), lte(enrollments.enrolledAt, window.to)))
      .groupBy(groupByExpr, labelExpr)
      .orderBy(groupByExpr);

    const liveEnrollData = await this.db
      .select({
        label: sql`TO_CHAR(${liveEnrollments.createdAt}, 'Mon DD')`,
        count: sql<number>`COUNT(*)`.mapWith(Number),
      })
      .from(liveEnrollments)
      .where(and(
        gte(liveEnrollments.createdAt, window.from),
        lte(liveEnrollments.createdAt, window.to),
        sql`${liveEnrollments.userId} IS NOT NULL`,
      ))
      .groupBy(sql`TO_CHAR(${liveEnrollments.createdAt}, 'Mon DD')`)
      .orderBy(sql`MIN(${liveEnrollments.createdAt})`);

    // Merge recorded and live by label
    const merged = new Map<string, { label: string; recorded: number; live: number; total: number }>();
    for (const row of recordedEnrollments) {
      const key = String(row.label);
      const existing = merged.get(key) ?? { label: key, recorded: 0, live: 0, total: 0 };
      existing.recorded = row.count;
      existing.total = existing.recorded + existing.live;
      merged.set(key, existing);
    }
    for (const row of liveEnrollData) {
      const key = String(row.label);
      const existing = merged.get(key) ?? { label: key, recorded: 0, live: 0, total: 0 };
      existing.live = row.count;
      existing.total = existing.recorded + existing.live;
      merged.set(key, existing);
    }

    return Array.from(merged.values());
  }

  // ─── Revenue by Course (filtered by date range) ─────────────────────────────

  async getRevenueByCourse(q: DashboardQueryInput) {
    const window = this.resolveWindow(q);

    // Recorded course revenue
    const recordedRevenue = await this.db
      .select({
        courseTitle: courses.title,
        revenue: sql<string>`COALESCE(SUM(${orderItems.price}), 0)`,
      })
      .from(orderItems)
      .innerJoin(payments, eq(payments.orderId, orderItems.orderId))
      .innerJoin(courses, eq(courses.id, orderItems.courseId))
      .where(and(
        eq(payments.status, 'completed'),
        gte(payments.paidAt, window.from),
        lte(payments.paidAt, window.to),
      ))
      .groupBy(courses.title)
      .orderBy(sql`SUM(${orderItems.price}) DESC`);

    // Live course revenue
    const liveRevenue = await this.db
      .select({
        courseTitle: liveCourses.title,
        revenue: sql<string>`COALESCE(SUM(${liveEnrollments.amount}), 0)`,
      })
      .from(liveEnrollments)
      .innerJoin(liveCourses, eq(liveCourses.id, liveEnrollments.liveCourseId))
      .where(and(
        eq(liveEnrollments.status, 'completed'),
        gte(liveEnrollments.paidAt, window.from),
        lte(liveEnrollments.paidAt, window.to),
      ))
      .groupBy(liveCourses.title)
      .orderBy(sql`SUM(${liveEnrollments.amount}) DESC`);

    // Merge and sort
    const merged = new Map<string, { course: string; revenue: number }>();
    for (const row of recordedRevenue) {
      const key = row.courseTitle;
      const existing = merged.get(key) ?? { course: key, revenue: 0 };
      existing.revenue += Number(row.revenue);
      merged.set(key, existing);
    }
    for (const row of liveRevenue) {
      const key = row.courseTitle;
      const existing = merged.get(key) ?? { course: key, revenue: 0 };
      existing.revenue += Number(row.revenue);
      merged.set(key, existing);
    }

    return Array.from(merged.values()).sort((a, b) => b.revenue - a.revenue);
  }
}
