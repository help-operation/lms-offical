import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { desc, eq, sql, ilike, or, and, inArray, gte, lte, isNotNull, type SQL } from 'drizzle-orm';
import { unionAll } from 'drizzle-orm/pg-core';
import { randomBytes } from 'node:crypto';
import * as bcrypt from 'bcrypt';
import type { DB } from 'src/db';
import { DB_TOKEN } from 'src/db/db.module';
import {
  adminUsers,
  courses,
  enrollments,
  instructorProfiles,
  leads,
  lessonProgress,
  liveEnrollments,
  liveCourses,
  liveCourseBatches,
  liveCourseRecordedBundles,
  livePayments,
  orderItems,
  orders,
  payments,
  roles,
  shopOrders,
  shopOrderItems,
  studentProfiles,
  userCourseInterests,
  users,
} from 'src/db/schema';
import {
  buildTableQuery,
  formatPaginatedResponse,
  type TableQueryInput,
} from 'src/common/utils/table-query.util';
import { RevalidationService } from 'src/common/revalidation/revalidation.service';
import { CacheTag } from 'src/common/revalidation/cache-tags';
import { EmailTemplatesService } from 'src/email-templates/email-templates.service';
import { SmsTemplatesService } from 'src/sms/sms-templates.service';
import { InvoiceNumberService } from 'src/common/invoice-number/invoice-number.service';
import { computeEnrollmentExpiry } from 'src/common/utils/access-expiry.util';
import {
  paymentSummaryFrom,
  studentDueAmountExpr,
  studentPaymentStatusExpr,
  studentPaymentStatusFilter,
} from 'src/common/utils/payment-summary.util';
import type { ManualEnrollmentInput } from '@repo/validators';

@Injectable()
export class AdminService {
  constructor(
    @Inject(DB_TOKEN) private readonly db: DB,
    private readonly revalidation: RevalidationService,
    private readonly emailTemplates: EmailTemplatesService,
    private readonly smsTemplates: SmsTemplatesService,
    private readonly invoiceNumbers: InvoiceNumberService,
  ) {}

  // ─── Platform Stats ───────────────────────────────────────────────────────

  async getPlatformStats() {
    const [
      [totalUsers],
      [totalCourses],
      [totalEnrollments],
      revenueRow,
      [totalLiveCourses],
      [totalLiveEnrollments],
      liveRevenueRow,
      [recordedStudents],
      [liveStudents],
    ] = await Promise.all([
      this.db.select({ count: sql<number>`COUNT(*)`.mapWith(Number) }).from(users),
      this.db.select({ count: sql<number>`COUNT(*)`.mapWith(Number) }).from(courses),
      this.db.select({ count: sql<number>`COUNT(*)`.mapWith(Number) }).from(enrollments),
      this.db
        .select({ total: sql<string>`COALESCE(SUM(amount), 0)` })
        .from(payments)
        .where(eq(payments.status, 'completed')),
      this.db.select({ count: sql<number>`COUNT(*)`.mapWith(Number) }).from(liveCourses),
      this.db.select({ count: sql<number>`COUNT(*)`.mapWith(Number) }).from(liveEnrollments),
      this.db
        .select({ total: sql<string>`COALESCE(SUM(amount), 0)` })
        .from(liveEnrollments)
        .where(eq(liveEnrollments.status, 'completed')),
      this.db
        .select({ count: sql<number>`COUNT(DISTINCT ${enrollments.userId})`.mapWith(Number) })
        .from(enrollments),
      this.db
        .select({ count: sql<number>`COUNT(DISTINCT ${liveEnrollments.userId})`.mapWith(Number) })
        .from(liveEnrollments)
        .where(sql`${liveEnrollments.userId} IS NOT NULL`),
    ]);

    const [[students], [instructors], [publishedCourses]] = await Promise.all([
      this.db
        .select({ count: sql<number>`COUNT(*)`.mapWith(Number) })
        .from(users)
        .where(eq(users.role, 'STUDENT')),
      this.db
        .select({ count: sql<number>`COUNT(*)`.mapWith(Number) })
        .from(adminUsers),
      this.db
        .select({ count: sql<number>`COUNT(*)`.mapWith(Number) })
        .from(courses)
        .where(eq(courses.status, 'published')),
    ]);

    return {
      totalUsers: totalUsers?.count ?? 0,
      totalStudents: students?.count ?? 0,
      totalInstructors: instructors?.count ?? 0,
      totalCourses: totalCourses?.count ?? 0,
      publishedCourses: publishedCourses?.count ?? 0,
      totalEnrollments: totalEnrollments?.count ?? 0,
      totalRevenue: revenueRow?.[0]?.total ?? '0',
      recorded: {
        students: recordedStudents?.count ?? 0,
        courses:  totalCourses?.count ?? 0,
        enrollments: totalEnrollments?.count ?? 0,
        revenue: revenueRow?.[0]?.total ?? '0',
      },
      live: {
        students: liveStudents?.count ?? 0,
        courses:  totalLiveCourses?.count ?? 0,
        enrollments: totalLiveEnrollments?.count ?? 0,
        revenue: liveRevenueRow?.[0]?.total ?? '0',
      },
    };
  }

  // ─── User Management ──────────────────────────────────────────────────────

  async listUsers(params: TableQueryInput = {}) {
    const q = buildTableQuery(params, {
      searchable: [users.firstName, users.lastName, users.email, users.phone],
      sortable:   { createdAt: users.createdAt, email: users.email, firstName: users.firstName },
      filterable: { role: users.role, status: users.status },
      dateColumn:  users.createdAt,
      defaultSort: desc(users.createdAt),
    });

    const [rows, [countRow]] = await Promise.all([
      this.db
        .select({
          id:        users.id,
          firstName: users.firstName,
          lastName:  users.lastName,
          email:     users.email,
          phone:     users.phone,
          role:      users.role,
          status:    users.status,
          avatar:    users.avatar,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(q.where)
        .orderBy(q.orderBy)
        .limit(q.limit)
        .offset(q.offset),
      this.db
        .select({ count: sql<number>`COUNT(*)`.mapWith(Number) })
        .from(users)
        .where(q.where),
    ]);

    return formatPaginatedResponse(rows, countRow?.count ?? 0, q.page, q.perPage);
  }

  async exportUsers(params: TableQueryInput = {}) {
    const q = buildTableQuery(params, {
      searchable:  [users.firstName, users.lastName, users.email, users.phone],
      sortable:    { createdAt: users.createdAt, email: users.email, firstName: users.firstName },
      filterable:  { role: users.role, status: users.status },
      dateColumn:  users.createdAt,
      defaultSort: desc(users.createdAt),
      maxPerPage:  100_000,
    });

    return this.db
      .select({
        id:        users.id,
        firstName: users.firstName,
        lastName:  users.lastName,
        email:     users.email,
        phone:     users.phone,
        role:      users.role,
        status:    users.status,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(q.where)
      .orderBy(q.orderBy)
      .limit(q.limit)
      .offset(0);
  }

  async suspendUser(id: number) {
    const [user] = await this.db
      .select({ id: users.id, role: users.role })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!user) throw new NotFoundException('User not found');

    const [updated] = await this.db
      .update(users)
      .set({ status: 'suspended', tokensValidFrom: new Date() })
      .where(eq(users.id, id))
      .returning({ id: users.id, status: users.status });

    return updated;
  }

  async activateUser(id: number) {
    const [updated] = await this.db
      .update(users)
      .set({ status: 'active' })
      .where(eq(users.id, id))
      .returning({ id: users.id, status: users.status });

    if (!updated) throw new NotFoundException('User not found');
    return updated;
  }

  async changeUserRole(id: number, role: string) {
    const allowedRoles = ['GUEST', 'STUDENT'] as const;
    if (!allowedRoles.includes(role as any)) {
      throw new NotFoundException(`Role '${role}' is not valid for web users. INSTRUCTOR and SUPER_ADMIN belong to admin_users table.`);
    }

    const [user] = await this.db
      .select({ id: users.id, role: users.role })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!user) throw new NotFoundException('User not found');

    const [updated] = await this.db
      .update(users)
      .set({ role: role as any })
      .where(eq(users.id, id))
      .returning({ id: users.id, role: users.role });

    return updated;
  }

  async getUser(id: number) {
    const cols = {
      id:        users.id,
      firstName: users.firstName,
      lastName:  users.lastName,
      email:     users.email,
      phone:     users.phone,
      role:      users.role,
      status:    users.status,
      avatar:    users.avatar,
      createdAt: users.createdAt,
    };
    const [user] = await this.db.select(cols).from(users).where(eq(users.id, id)).limit(1);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async createUser(dto: { firstName: string; lastName: string; email?: string; phone?: string; password: string; role?: string }) {
    if (!dto.email && !dto.phone) {
      throw new BadRequestException('Email or phone is required');
    }

    if (dto.email) {
      const [existing] = await this.db.select({ id: users.id }).from(users).where(eq(users.email, dto.email)).limit(1);
      if (existing) throw new ConflictException('A user with this email already exists');
    }
    if (dto.phone) {
      const [existing] = await this.db.select({ id: users.id }).from(users).where(eq(users.phone, dto.phone)).limit(1);
      if (existing) throw new ConflictException('A user with this phone number already exists');
    }

    const hash = await bcrypt.hash(dto.password, 10);
    const validRoles = ['GUEST', 'STUDENT', 'INSTRUCTOR', 'SUPER_ADMIN', 'EDITOR', 'MARKETING_OFFICER', 'ACCOUNTANT'];
    const role = validRoles.includes(dto.role ?? '') ? dto.role! : 'GUEST';

    const [created] = await this.db
      .insert(users)
      .values({
        firstName: dto.firstName,
        lastName:  dto.lastName,
        email:     dto.email || null,
        phone:     dto.phone || null,
        password:  hash,
        role:      role as any,
        status:    'active',
      })
      .returning({
        id:        users.id,
        firstName: users.firstName,
        lastName:  users.lastName,
        email:     users.email,
        phone:     users.phone,
        role:      users.role,
        status:    users.status,
        avatar:    users.avatar,
        createdAt: users.createdAt,
      });

    return created;
  }

  async updateUser(
    id: number,
    dto: { firstName?: string; lastName?: string; email?: string | null; phone?: string | null },
  ) {
    const [exists] = await this.db.select({ id: users.id }).from(users).where(eq(users.id, id)).limit(1);
    if (!exists) throw new NotFoundException('User not found');

    const [updated] = await this.db
      .update(users)
      .set({
        ...(dto.firstName !== undefined && { firstName: dto.firstName }),
        ...(dto.lastName  !== undefined && { lastName:  dto.lastName  }),
        ...(dto.email     !== undefined && { email:     dto.email     }),
        ...(dto.phone     !== undefined && { phone:     dto.phone     }),
      })
      .where(eq(users.id, id))
      .returning({
        id:        users.id,
        firstName: users.firstName,
        lastName:  users.lastName,
        email:     users.email,
        phone:     users.phone,
        role:      users.role,
        status:    users.status,
        avatar:    users.avatar,
        createdAt: users.createdAt,
      });
    return updated;
  }

  async resetUserPassword(id: number, password: string) {
    const [exists] = await this.db.select({ id: users.id }).from(users).where(eq(users.id, id)).limit(1);
    if (!exists) throw new NotFoundException('User not found');
    const hash = await bcrypt.hash(password, 10);
    await this.db.update(users).set({ password: hash }).where(eq(users.id, id));
    return { id };
  }

  async deleteUser(id: number) {
    const [exists] = await this.db.select({ id: users.id }).from(users).where(eq(users.id, id)).limit(1);
    if (!exists) throw new NotFoundException('User not found');
    await this.db.delete(users).where(eq(users.id, id));
    return { id };
  }

  // ─── Enrollments ─────────────────────────────────────────────────────────

  async listEnrollments(params: TableQueryInput = {}) {
    const page    = Math.max(1, Number(params.page)      || 1);
    const perPage = Math.min(100, Number(params.per_page) || 20);
    const offset  = (page - 1) * perPage;
    const search   = (params.search    as string | undefined)?.trim() ?? '';
    const status   = (params.status   as string | undefined)?.trim() ?? '';
    const dateFrom = (params.date_from as string | undefined)?.trim() ?? '';
    const dateTo   = (params.date_to   as string | undefined)?.trim() ?? '';
    // 'recorded' | 'live' | 'all' (default)
    const type    = (params.type as string | undefined)?.trim() ?? 'all';

    // A single course an enrolled student has joined — shown inside the row popup.
    type StudentCourse = {
      id: number;
      courseType: 'recorded' | 'live';
      courseTitle: string;
      status: string;
      enrolledAt: string | null;
      completedAt: string | null;
      amount: string | null;
      paymentMethod: string | null;
    };

    // One row per student, aggregated from their recorded + live enrollments.
    type StudentEnrollmentRow = {
      key: string;
      userId: number | null;
      userFirstName: string;
      userLastName: string;
      userEmail: string | null;
      userPhone: string | null;
      userAvatar: string | null;
      lastEnrolledAt: string | null;
      courseCount: number;
      courses: StudentCourse[];
    };

    const includeRec  = type !== 'live';
    const includeLive = type !== 'recorded';
    const term = `%${search}%`;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // ── Per-source filters (search + status), applied in SQL ──────────────────
    const recConds: SQL[] = [];
    if (search) {
      recConds.push(
        or(
          ilike(users.firstName, term),
          ilike(users.lastName, term),
          ilike(users.email, term),
          ilike(courses.title, term),
        ) as SQL,
      );
    }
    if (status)   recConds.push(sql`${enrollments.status} = ${status}`);
    if (dateFrom) recConds.push(gte(enrollments.enrolledAt, new Date(dateFrom)) as SQL);
    if (dateTo)   recConds.push(lte(enrollments.enrolledAt, new Date(dateTo + 'T23:59:59')) as SQL);
    const recWhere = recConds.length ? and(...recConds) : undefined;

    const liveConds: SQL[] = [];
    if (search) {
      liveConds.push(
        or(
          ilike(liveEnrollments.name, term),
          ilike(liveEnrollments.email, term),
          ilike(liveCourses.title, term),
        ) as SQL,
      );
    }
    // live status filter
    if (status === 'completed')   liveConds.push(sql`${liveEnrollments.status} = 'completed'`);
    else if (status === 'active') liveConds.push(sql`${liveEnrollments.status} NOT IN ('completed','suspended')`);
    else if (status === 'suspended') liveConds.push(sql`${liveEnrollments.status} = 'suspended'`);
    if (dateFrom) liveConds.push(gte(liveEnrollments.createdAt, new Date(dateFrom)) as SQL);
    if (dateTo)   liveConds.push(lte(liveEnrollments.createdAt, new Date(dateTo + 'T23:59:59')) as SQL);
    const liveWhere = liveConds.length ? and(...liveConds) : undefined;

    // ── Fetch every matching enrollment (both sources), then group by student ──
    const [recRows, liveRows] = await Promise.all([
      includeRec
        ? this.db
            .select({
              id:            enrollments.id,
              status:        enrollments.status,
              enrolledAt:    enrollments.enrolledAt,
              completedAt:   enrollments.completedAt,
              courseTitle:   courses.title,
              amount:        payments.amount,
              paymentMethod: payments.method,
              userId:        users.id,
              userFirstName: users.firstName,
              userLastName:  users.lastName,
              userEmail:     users.email,
              userPhone:     users.phone,
              userAvatar:    users.avatar,
            })
            .from(enrollments)
            .innerJoin(users,   eq(enrollments.userId,   users.id))
            .innerJoin(courses, eq(enrollments.courseId, courses.id))
            .leftJoin(orders,   eq(enrollments.orderId,  orders.id))
            .leftJoin(payments, eq(orders.id,            payments.orderId))
            .where(recWhere)
        : Promise.resolve([]),
      includeLive
        ? this.db
            .select({
              id:               liveEnrollments.id,
              status:           liveEnrollments.status,
              enrolledAt:       liveEnrollments.paidAt,
              courseTitle:      liveCourses.title,
              amount:           liveEnrollments.amount,
              paystationMethod: liveEnrollments.paystationMethod,
              name:             liveEnrollments.name,
              email:            liveEnrollments.email,
              phone:            liveEnrollments.phone,
              userId:           liveEnrollments.userId,
              userFirstName:    users.firstName,
              userLastName:     users.lastName,
              userEmail:        users.email,
              userPhone:        users.phone,
              userAvatar:       users.avatar,
            })
            .from(liveEnrollments)
            .innerJoin(liveCourses, eq(liveEnrollments.liveCourseId, liveCourses.id))
            .leftJoin(users,        eq(liveEnrollments.userId,       users.id))
            .where(liveWhere)
        : Promise.resolve([]),
    ]);

    const studentByKey = new Map<string, StudentEnrollmentRow>();

    function addCourse(
      key: string,
      userId: number | null,
      firstName: string,
      lastName: string,
      email: string | null,
      phone: string | null,
      avatar: string | null,
      course: StudentCourse,
    ) {
      let student = studentByKey.get(key);
      if (!student) {
        student = {
          key, userId,
          userFirstName: firstName, userLastName: lastName,
          userEmail: email, userPhone: phone, userAvatar: avatar,
          lastEnrolledAt: null, courseCount: 0, courses: [],
        };
        studentByKey.set(key, student);
      }
      student.courses.push(course);
      student.courseCount += 1;
      if (course.enrolledAt && (!student.lastEnrolledAt || course.enrolledAt > student.lastEnrolledAt)) {
        student.lastEnrolledAt = course.enrolledAt;
      }
    }

    for (const r of recRows) {
      addCourse(
        `u:${r.userId}`, r.userId, r.userFirstName, r.userLastName, r.userEmail, r.userPhone, r.userAvatar,
        {
          id: r.id,
          courseType: 'recorded',
          courseTitle: r.courseTitle,
          status: r.status,
          enrolledAt: r.enrolledAt?.toISOString() ?? null,
          completedAt: r.completedAt?.toISOString() ?? null,
          amount: r.amount,
          paymentMethod: r.paymentMethod,
        },
      );
    }
    for (const r of liveRows) {
      const nameParts = r.name.trim().split(/\s+/);
      const key = r.userId ? `u:${r.userId}` : `g:${(r.email ?? r.phone ?? r.name).toLowerCase()}`;
      addCourse(
        key, r.userId,
        r.userFirstName ?? nameParts[0] ?? r.name,
        r.userLastName  ?? nameParts.slice(1).join(' '),
        r.userEmail ?? r.email,
        r.userPhone ?? r.phone ?? null,
        r.userAvatar ?? null,
        {
          id: r.id,
          courseType: 'live',
          courseTitle: r.courseTitle,
          status: r.status === 'completed' ? 'completed' : r.status === 'suspended' ? 'suspended' : 'active',
          enrolledAt: r.enrolledAt?.toISOString() ?? null,
          completedAt: null,
          amount: r.amount,
          paymentMethod: r.paystationMethod ?? (r.status === 'completed' ? 'paystation' : null),
        },
      );
    }

    const allStudents = Array.from(studentByKey.values())
      .sort((a, b) => (b.lastEnrolledAt ?? '').localeCompare(a.lastEnrolledAt ?? ''));
    const total = allStudents.length;
    const data = allStudents.slice(offset, offset + perPage);

    // ── Stats over the FILTERED set (search + status + type), via aggregates ──
    const emptyStat = { total: 0, active: 0, completed: 0, thisMonth: 0 };
    const [recStats, liveStats] = await Promise.all([
      includeRec
        ? this.db
            .select({
              total:     sql<number>`count(*)`.mapWith(Number),
              active:    sql<number>`count(*) filter (where ${enrollments.status} = 'active')`.mapWith(Number),
              completed: sql<number>`count(*) filter (where ${enrollments.status} = 'completed')`.mapWith(Number),
              thisMonth: sql<number>`count(*) filter (where ${enrollments.enrolledAt} >= ${startOfMonth})`.mapWith(Number),
            })
            .from(enrollments)
            .innerJoin(users, eq(enrollments.userId, users.id))
            .innerJoin(courses, eq(enrollments.courseId, courses.id))
            .where(recWhere)
            .then((r) => r[0] ?? emptyStat)
        : Promise.resolve(emptyStat),
      includeLive
        ? this.db
            .select({
              total:     sql<number>`count(*)`.mapWith(Number),
              active:    sql<number>`count(*) filter (where ${liveEnrollments.status} <> 'completed')`.mapWith(Number),
              completed: sql<number>`count(*) filter (where ${liveEnrollments.status} = 'completed')`.mapWith(Number),
              thisMonth: sql<number>`count(*) filter (where ${liveEnrollments.paidAt} >= ${startOfMonth})`.mapWith(Number),
            })
            .from(liveEnrollments)
            .innerJoin(liveCourses, eq(liveEnrollments.liveCourseId, liveCourses.id))
            .where(liveWhere)
            .then((r) => r[0] ?? emptyStat)
        : Promise.resolve(emptyStat),
    ]);

    const stats = {
      total:     recStats.total + liveStats.total,
      active:    recStats.active + liveStats.active,
      completed: recStats.completed + liveStats.completed,
      thisMonth: recStats.thisMonth + liveStats.thisMonth,
    };

    const lastPage = Math.max(1, Math.ceil(total / perPage));
    return {
      data,
      pagination: {
        total,
        per_page:     perPage,
        current_page: page,
        last_page:    lastPage,
        from:         total === 0 ? 0 : offset + 1,
        to:           Math.min(offset + perPage, total),
      },
      stats,
    };
  }

  // ─── Manual enrollment (admin) ─────────────────────────────────────────────

  /**
   * Admin manually enrolls a person into a recorded or live course.
   * Three user states are handled: brand-new (create), existing guest (reuse +
   * promote), existing student (reuse). Free = enrollment only (no invoice);
   * Paid (offline bKash) = order/invoice + payment + enrollment for recorded,
   * or a completed live_enrollment for live. Sequential writes (no DB
   * transaction) to match the rest of the codebase on the Neon HTTP driver.
   */
  async createManualEnrollment(dto: ManualEnrollmentInput) {
    const { user, tempPassword, alreadyExisted } = await this.resolveEnrollmentUser(dto);

    let result: Record<string, unknown>;
    if (dto.accountOnly) {
      result = { success: true, userId: user.id, accountOnly: true, alreadyExisted: alreadyExisted ?? false };
    } else if (dto.fulfillOrder) {
      const [lead] = await this.db
        .select({ orderId: leads.orderId, liveEnrollmentId: leads.liveEnrollmentId })
        .from(leads)
        .where(eq(leads.id, dto.leadId!))
        .limit(1);
      if (!lead) throw new NotFoundException('Lead not found');
      result = lead.liveEnrollmentId
        ? await this.fulfillLeadLiveEnrollment(user, dto)
        : await this.fulfillLeadOrder(user, dto);
    } else if (dto.courseType === 'live') {
      result = await this.enrollLive(user, dto);
    } else {
      result = await this.enrollRecorded(user, dto);
    }

    // If this came from a lead, link + close it.
    if (dto.leadId) {
      await this.db
        .update(leads)
        .set({ status: 'complete', convertedUserId: user.id, updatedAt: new Date() })
        .where(eq(leads.id, dto.leadId));
    }

    // Brand-new account: email the login credentials (the admin also gets the
    // temp password back in the response to relay directly). Existing users
    // keep their own password, so nothing is sent for them.
    if (tempPassword) {
      const name = `${user.firstName} ${user.lastName}`.trim() || 'there';
      if (dto.notifyEmail && user.email) {
        const frontendBase = process.env.FRONTEND_URL ?? 'http://localhost:3001';
        await this.emailTemplates
          .send('account_credentials', user.email, {
            student_name:  name,
            login_id:      user.email ?? user.phone ?? '',
            temp_password: tempPassword,
            login_url:     `${frontendBase}/login`,
          })
          .catch(() => {});
      }
      if (dto.notifySms && user.phone) {
        await this.smsTemplates.send('manual_account_credentials', user.phone, {
          name,
          phone:    user.phone,
          password: tempPassword,
        });
      }
    }

    return { ...result, tempPassword: tempPassword ?? null };
  }

  /** 8–10 char alphanumeric temp password — readable enough to relay over chat. */
  private generateTempPassword(): string {
    return randomBytes(8).toString('base64url').replace(/[^a-zA-Z0-9]/g, '').slice(0, 10);
  }

  private async resolveEnrollmentUser(dto: ManualEnrollmentInput) {
    const cols = {
      id:        users.id,
      firstName: users.firstName,
      lastName:  users.lastName,
      email:     users.email,
      phone:     users.phone,
      role:      users.role,
    };

    if (dto.userId) {
      const [u] = await this.db.select(cols).from(users).where(eq(users.id, dto.userId)).limit(1);
      if (!u) throw new NotFoundException('Selected user not found');
      return { user: u, tempPassword: null as string | null, alreadyExisted: false };
    }

    const nu = dto.newUser;
    if (!nu) throw new BadRequestException('No user specified');

    // Reuse an existing account if the phone or email already exists (unique).
    const matchers: SQL[] = [];
    if (nu.email) matchers.push(eq(users.email, nu.email));
    if (nu.phone) matchers.push(eq(users.phone, nu.phone));
    if (matchers.length > 0) {
      const [existing] = await this.db
        .select(cols)
        .from(users)
        .where(matchers.length === 1 ? matchers[0]! : or(...matchers))
        .limit(1);
      if (existing) return { user: existing, tempPassword: null as string | null, alreadyExisted: true };
    }

    // New account: set a temp password so the person can actually log in
    // (all student login is password-based). Returned to the admin + emailed.
    const tempPassword = this.generateTempPassword();
    const passwordHash = await bcrypt.hash(tempPassword, 10);
    const [created] = await this.db
      .insert(users)
      .values({
        firstName: nu.firstName,
        lastName:  nu.lastName?.trim() || '',
        email:     nu.email ?? null,
        phone:     nu.phone ?? null,
        password:  passwordHash,
        role:      'GUEST',
      })
      .returning(cols);
    return { user: created!, tempPassword, alreadyExisted: false };
  }

  /** Promote a GUEST to STUDENT once they have any enrollment. No-op otherwise. */
  private async ensureStudentRole(userId: number) {
    await this.db
      .update(users)
      .set({ role: 'STUDENT' })
      .where(and(eq(users.id, userId), eq(users.role, 'GUEST')));
  }

  private async enrollRecorded(
    user: { id: number; firstName: string; lastName: string; email: string | null; phone: string | null },
    dto: ManualEnrollmentInput,
  ) {
    const [course] = await this.db
      .select({ id: courses.id, title: courses.title, slug: courses.slug })
      .from(courses)
      .where(eq(courses.id, dto.courseId!))
      .limit(1);
    if (!course) throw new NotFoundException('Course not found');

    const [already] = await this.db
      .select({ id: enrollments.id })
      .from(enrollments)
      .where(and(eq(enrollments.userId, user.id), eq(enrollments.courseId, course.id)))
      .limit(1);
    if (already) throw new ConflictException('This user is already enrolled in this course');

    let orderId: number | null = null;
    if (dto.paid) {
      const fee = String(dto.feeAmount);
      const received = dto.amountReceived ?? 0;
      const [order] = await this.db
        .insert(orders)
        .values({
          userId:         user.id,
          totalAmount:    fee,
          discountAmount: '0',
          finalAmount:    fee,
          // 'paid' only once the received amount actually covers the fee —
          // otherwise it stays 'pending' whether nothing or only part was paid.
          status:         received > 0 && received >= dto.feeAmount! ? 'paid' : 'pending',
        })
        .returning({ id: orders.id });
      orderId = order!.id;
      await this.db.insert(orderItems).values({ orderId, courseId: course.id, price: fee });
      // Due (0 received) gets an order but no payment row yet — nothing has
      // actually been paid. A completed row is only recorded once money moves.
      if (received > 0) {
        await this.db.insert(payments).values({
          orderId,
          userId:     user.id,
          amount:     String(received),
          method:     'bkash',
          bkashTrxId: dto.bkashTrxId ?? null,
          payerPhone: dto.payerPhone ?? null,
          status:     'completed',
          paidAt:     new Date(),
          displayInvoiceNumber: await this.invoiceNumbers.generate(),
        });
      }
    }

    // Atomic insert: the unique (user_id, course_id) constraint means only the
    // first of any concurrent/duplicate requests creates a row and returns it.
    // We gate the confirmation email/SMS on this so they can't fire twice.
    const [enr] = await this.db
      .insert(enrollments)
      .values({ userId: user.id, courseId: course.id, orderId, status: 'active', expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null })
      .onConflictDoNothing()
      .returning({ id: enrollments.id });

    if (!enr) {
      throw new ConflictException('This user is already enrolled in this course');
    }

    await this.ensureStudentRole(user.id);

    {
      const name = `${user.firstName} ${user.lastName}`.trim();
      if (dto.notifyEmail && user.email) {
        const frontendBase = process.env.FRONTEND_URL ?? 'http://localhost:3001';
        await this.emailTemplates
          .send('enrollment_confirmation', user.email, {
            student_name: name,
            course_title: course.title,
            course_url:   `${frontendBase}/courses/${course.slug}`,
          })
          .catch(() => {});
      }
      if (dto.notifySms && user.phone) {
        await this.smsTemplates.send('enrollment_confirmation', user.phone, {
          name:         name || 'there',
          course_title: course.title,
        });
      }
    }

    return {
      success: true,
      userId: user.id,
      courseType: 'recorded' as const,
      courseId: course.id,
      orderId,
      paid: dto.paid,
    };
  }

  private async enrollLive(
    user: { id: number; firstName: string; lastName: string; email: string | null; phone: string | null },
    dto: ManualEnrollmentInput,
  ) {
    if (!user.email) {
      throw new BadRequestException('Live course enrollment requires the user to have an email');
    }

    const [course] = await this.db
      .select({ id: liveCourses.id, title: liveCourses.title, courseType: liveCourses.courseType })
      .from(liveCourses)
      .where(eq(liveCourses.id, dto.liveCourseId!))
      .limit(1);
    if (!course) throw new NotFoundException('Live course not found');

    let batch:
      | { id: number; batchName: string; startDate: string | null; schedule: string | null }
      | undefined;
    if (dto.batchId) {
      [batch] = await this.db
        .select({
          id:        liveCourseBatches.id,
          batchName: liveCourseBatches.batchName,
          startDate: liveCourseBatches.startDate,
          schedule:  liveCourseBatches.schedule,
        })
        .from(liveCourseBatches)
        .where(and(eq(liveCourseBatches.id, dto.batchId), eq(liveCourseBatches.liveCourseId, course.id)))
        .limit(1);
      if (!batch) throw new BadRequestException('Selected batch does not belong to this course');
    }

    const [already] = await this.db
      .select({ id: liveEnrollments.id })
      .from(liveEnrollments)
      .where(
        and(
          eq(liveEnrollments.liveCourseId, course.id),
          or(eq(liveEnrollments.userId, user.id), eq(liveEnrollments.email, user.email)),
        ),
      )
      .limit(1);
    if (already) throw new ConflictException('This user is already enrolled in this live course');

    // `amount` is the course fee (invoiced amount), not what was actually
    // received — that's tracked per-payment in `live_payments` below.
    const fee = dto.paid ? String(dto.feeAmount) : '0';
    const received = dto.paid ? (dto.amountReceived ?? 0) : 0;
    const [enr] = await this.db
      .insert(liveEnrollments)
      .values({
        liveCourseId:     course.id,
        batchId:          dto.batchId ?? null,
        userId:           user.id,
        name:             `${user.firstName} ${user.lastName}`.trim() || user.email,
        phone:            user.phone ?? dto.payerPhone ?? null,
        email:            user.email,
        amount:           fee,
        // Live access is gated on status === 'completed' (free or paid) — always
        // granted regardless of payment status; only financial records differ.
        status:           'completed',
        paidAt:           new Date(),
        expiresAt:        dto.expiresAt ? new Date(dto.expiresAt) : null,
        paystationMethod: received > 0 ? 'bKash (manual)' : null,
        paystationTrxId:  received > 0 ? (dto.bkashTrxId ?? null) : null,
        payerPhone:       received > 0 ? (dto.payerPhone ?? null) : null,
        displayInvoiceNumber: await this.invoiceNumbers.generate(),
      })
      .returning({ id: liveEnrollments.id });

    if (received > 0) {
      await this.db.insert(livePayments).values({
        liveEnrollmentId: enr!.id,
        userId:     user.id,
        amount:     String(received),
        method:     'bkash',
        bkashTrxId: dto.bkashTrxId ?? null,
        payerPhone: dto.payerPhone ?? null,
        status:     'completed',
        paidAt:     new Date(),
        displayInvoiceNumber: await this.invoiceNumbers.generate(),
      });
    }

    if (dto.batchId) {
      await this.db
        .update(liveCourseBatches)
        .set({ seatsFilled: sql`${liveCourseBatches.seatsFilled} + 1` })
        .where(eq(liveCourseBatches.id, dto.batchId));
    }

    await this.ensureStudentRole(user.id);

    // For bundles: enroll the user in each included recorded course
    if (course.courseType === 'bundle') {
      const bundledCourses = await this.db
        .select({ id: courses.id, hasLifetimeAccess: courses.hasLifetimeAccess, accessDurationDays: courses.accessDurationDays })
        .from(liveCourseRecordedBundles)
        .innerJoin(courses, eq(courses.id, liveCourseRecordedBundles.courseId))
        .where(eq(liveCourseRecordedBundles.liveCourseId, course.id))
        .orderBy(liveCourseRecordedBundles.order);

      for (const bc of bundledCourses) {
        await this.db
          .insert(enrollments)
          .values({ userId: user.id, courseId: bc.id, orderId: null, status: 'active', expiresAt: computeEnrollmentExpiry(bc) })
          .onConflictDoNothing();
      }
    }

    {
      const name = `${user.firstName} ${user.lastName}`.trim();
      if (dto.notifyEmail && user.email) {
        await this.emailTemplates
          .send('live_enrollment_confirmation', user.email, {
            student_name:     name,
            course_title:     course.title,
            batch_name:       batch?.batchName ?? '—',
            batch_start_date: batch?.startDate ?? '—',
            batch_schedule:   batch?.schedule ?? '—',
          })
          .catch(() => {});
      }
      if (dto.notifySms && user.phone) {
        await this.smsTemplates.send('live_enrollment_confirmation', user.phone, {
          name:       name || 'there',
          batch_name: batch?.batchName ?? course.title,
        });
      }
    }

    return {
      success: true,
      userId: user.id,
      courseType: 'live' as const,
      liveCourseId: course.id,
      enrollmentId: enr!.id,
      paid: dto.paid,
    };
  }

  /**
   * Fulfil a paid checkout lead: reuse its existing order (no new invoice),
   * backfill userId on the order + payments, and enroll the user into every
   * recorded course on that order. Idempotent.
   */
  private async fulfillLeadOrder(
    user: { id: number; firstName: string; lastName: string; email: string | null; phone: string | null },
    dto: ManualEnrollmentInput,
  ) {
    const [lead] = await this.db
      .select({ id: leads.id, orderId: leads.orderId })
      .from(leads)
      .where(eq(leads.id, dto.leadId!))
      .limit(1);
    if (!lead) throw new NotFoundException('Lead not found');
    if (!lead.orderId) throw new BadRequestException('This lead has no order to fulfil');

    const [order] = await this.db
      .select({ id: orders.id })
      .from(orders)
      .where(eq(orders.id, lead.orderId))
      .limit(1);
    if (!order) throw new BadRequestException('Order not found for this lead');

    // Backfill the buyer onto the order + payments (was a guest order).
    await this.db.update(orders).set({ userId: user.id, updatedAt: new Date() }).where(eq(orders.id, order.id));
    await this.db.update(payments).set({ userId: user.id }).where(eq(payments.orderId, order.id));

    const items = await this.db
      .select({
        courseId: orderItems.courseId,
        hasLifetimeAccess: courses.hasLifetimeAccess,
        accessDurationDays: courses.accessDurationDays,
      })
      .from(orderItems)
      .innerJoin(courses, eq(orderItems.courseId, courses.id))
      .where(eq(orderItems.orderId, order.id));

    const newlyEnrolled: { title: string; slug: string }[] = [];
    for (const item of items) {
      const inserted = await this.db
        .insert(enrollments)
        .values({ userId: user.id, courseId: item.courseId, orderId: order.id, status: 'active', expiresAt: computeEnrollmentExpiry(item) })
        .onConflictDoNothing()
        .returning({ id: enrollments.id });
      if (inserted.length > 0) {
        const [c] = await this.db
          .select({ title: courses.title, slug: courses.slug })
          .from(courses)
          .where(eq(courses.id, item.courseId))
          .limit(1);
        if (c) newlyEnrolled.push(c);
      }
    }

    await this.ensureStudentRole(user.id);

    {
      const name = `${user.firstName} ${user.lastName}`.trim();
      const frontendBase = process.env.FRONTEND_URL ?? 'http://localhost:3001';
      for (const c of newlyEnrolled) {
        if (dto.notifyEmail && user.email) {
          await this.emailTemplates
            .send('enrollment_confirmation', user.email, {
              student_name: name,
              course_title: c.title,
              course_url:   `${frontendBase}/courses/${c.slug}`,
            })
            .catch(() => {});
        }
        if (dto.notifySms && user.phone) {
          await this.smsTemplates.send('enrollment_confirmation', user.phone, {
            name:         name || 'there',
            course_title: c.title,
          });
        }
      }
    }

    return {
      success: true,
      userId: user.id,
      orderId: order.id,
      enrolledCourses: newlyEnrolled.length,
      fulfilled: true,
    };
  }

  /**
   * Fulfil a paid/free live-course or bundle checkout lead: backfill userId
   * onto the existing live_enrollments row (no new invoice), and — for
   * bundles — enroll the user into every recorded course inside it.
   * Idempotent (onConflictDoNothing on the per-course enrollment inserts).
   */
  private async fulfillLeadLiveEnrollment(
    user: { id: number; firstName: string; lastName: string; email: string | null; phone: string | null },
    dto: ManualEnrollmentInput,
  ) {
    const [lead] = await this.db
      .select({ id: leads.id, liveEnrollmentId: leads.liveEnrollmentId })
      .from(leads)
      .where(eq(leads.id, dto.leadId!))
      .limit(1);
    if (!lead) throw new NotFoundException('Lead not found');
    if (!lead.liveEnrollmentId) throw new BadRequestException('This lead has no live enrollment to fulfil');

    const [enr] = await this.db
      .select({ id: liveEnrollments.id, liveCourseId: liveEnrollments.liveCourseId, batchId: liveEnrollments.batchId, userId: liveEnrollments.userId })
      .from(liveEnrollments)
      .where(eq(liveEnrollments.id, lead.liveEnrollmentId))
      .limit(1);
    if (!enr) throw new BadRequestException('Live enrollment not found for this lead');

    // Already backfilled by a previous click — re-running must not re-send
    // the confirmation SMS to the student.
    const alreadyFulfilled = enr.userId != null;

    const [course] = await this.db
      .select({ id: liveCourses.id, title: liveCourses.title, courseType: liveCourses.courseType })
      .from(liveCourses)
      .where(eq(liveCourses.id, enr.liveCourseId))
      .limit(1);
    if (!course) throw new NotFoundException('Live course not found');

    // Backfill the buyer onto the enrollment (was a guest purchase).
    await this.db
      .update(liveEnrollments)
      .set({ userId: user.id })
      .where(eq(liveEnrollments.id, enr.id));

    const newlyEnrolled: { title: string }[] = [];
    if (course.courseType === 'bundle') {
      const bundledCourses = await this.db
        .select({ id: courses.id, title: courses.title, hasLifetimeAccess: courses.hasLifetimeAccess, accessDurationDays: courses.accessDurationDays })
        .from(liveCourseRecordedBundles)
        .innerJoin(courses, eq(courses.id, liveCourseRecordedBundles.courseId))
        .where(eq(liveCourseRecordedBundles.liveCourseId, course.id))
        .orderBy(liveCourseRecordedBundles.order);

      for (const bc of bundledCourses) {
        const inserted = await this.db
          .insert(enrollments)
          .values({ userId: user.id, courseId: bc.id, orderId: null, status: 'active', expiresAt: computeEnrollmentExpiry(bc) })
          .onConflictDoNothing()
          .returning({ id: enrollments.id });
        if (inserted.length > 0) newlyEnrolled.push({ title: bc.title });
      }
    }

    await this.ensureStudentRole(user.id);

    if (!alreadyFulfilled) {
      const name = `${user.firstName} ${user.lastName}`.trim();
      if (dto.notifyEmail && user.email) {
        await this.emailTemplates
          .send('live_enrollment_confirmation', user.email, {
            student_name:     name,
            course_title:     course.title,
            batch_name:       '—',
            batch_start_date: '—',
            batch_schedule:   '—',
          })
          .catch(() => {});
      }
      if (dto.notifySms && user.phone) {
        await this.smsTemplates.send('live_enrollment_confirmation', user.phone, {
          name: name || 'there',
          batch_name: course.title,
        });
      }
    }

    return {
      success: true,
      userId: user.id,
      liveCourseId: course.id,
      enrolledCourses: newlyEnrolled.length,
      fulfilled: true,
    };
  }

  // Pickers for the manual-enrollment modal (gated by create_enrollments).

  async searchEnrollableUsers(search?: string) {
    const term = search?.trim();
    const where = term
      ? or(
          ilike(users.firstName, `%${term}%`),
          ilike(users.lastName, `%${term}%`),
          ilike(users.email, `%${term}%`),
          ilike(users.phone, `%${term}%`),
        )
      : undefined;
    return this.db
      .select({
        id:        users.id,
        firstName: users.firstName,
        lastName:  users.lastName,
        email:     users.email,
        phone:     users.phone,
        role:      users.role,
      })
      .from(users)
      .where(where)
      .orderBy(desc(users.createdAt))
      .limit(20);
  }

  async pickerRecordedCourses() {
    return this.db
      .select({
        id:            courses.id,
        title:         courses.title,
        price:         courses.price,
        discountPrice: courses.discountPrice,
      })
      .from(courses)
      .orderBy(courses.title);
  }

  async pickerLiveCourses() {
    return this.db
      .select({ id: liveCourses.id, title: liveCourses.title, price: liveCourses.price })
      .from(liveCourses)
      .orderBy(liveCourses.title);
  }

  async pickerLiveBatches(liveCourseId: number) {
    return this.db
      .select({
        id:        liveCourseBatches.id,
        batchName: liveCourseBatches.batchName,
        startDate: liveCourseBatches.startDate,
        schedule:  liveCourseBatches.schedule,
        status:    liveCourseBatches.status,
      })
      .from(liveCourseBatches)
      .where(eq(liveCourseBatches.liveCourseId, liveCourseId))
      .orderBy(desc(liveCourseBatches.id));
  }

  // ─── Enrollment Management (remove / suspend / expiry / payments) ────────

  async getStudentEnrollments(userId: number) {
    const [student] = await this.db
      .select({ id: users.id, firstName: users.firstName, lastName: users.lastName, email: users.email, phone: users.phone })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    if (!student) throw new NotFoundException('User not found');

    const paidSums = this.db
      .select({
        orderId: payments.orderId,
        paid: sql<string>`COALESCE(SUM(${payments.amount}), 0)`.as('paid'),
      })
      .from(payments)
      .where(eq(payments.status, 'completed'))
      .groupBy(payments.orderId)
      .as('paid_sums');

    const livePaidSums = this.db
      .select({
        liveEnrollmentId: livePayments.liveEnrollmentId,
        paid: sql<string>`COALESCE(SUM(${livePayments.amount}), 0)`.as('paid'),
      })
      .from(livePayments)
      .where(eq(livePayments.status, 'completed'))
      .groupBy(livePayments.liveEnrollmentId)
      .as('live_paid_sums');

    const recorded = await this.db
      .select({
        id:          enrollments.id,
        courseType:  sql<'recorded'>`'recorded'`,
        status:      enrollments.status,
        statusReason: enrollments.statusReason,
        enrolledAt:  enrollments.enrolledAt,
        expiresAt:   enrollments.expiresAt,
        courseId:    courses.id,
        courseTitle: courses.title,
        courseSlug:  courses.slug,
        feeAmount:   orders.finalAmount,
        paidAmount:  paidSums.paid,
      })
      .from(enrollments)
      .innerJoin(courses, eq(enrollments.courseId, courses.id))
      .leftJoin(orders, eq(enrollments.orderId, orders.id))
      .leftJoin(paidSums, eq(paidSums.orderId, orders.id))
      .where(eq(enrollments.userId, userId));

    const live = await this.db
      .select({
        id:          liveEnrollments.id,
        courseType:  sql<'live'>`'live'`,
        status:      liveEnrollments.status,
        statusReason: liveEnrollments.statusReason,
        enrolledAt:  liveEnrollments.paidAt,
        expiresAt:   liveEnrollments.expiresAt,
        courseId:    liveCourses.id,
        courseTitle: liveCourses.title,
        courseSlug:  liveCourses.slug,
        feeAmount:   liveEnrollments.amount,
        paidAmount:  livePaidSums.paid,
      })
      .from(liveEnrollments)
      .innerJoin(liveCourses, eq(liveEnrollments.liveCourseId, liveCourses.id))
      .leftJoin(livePaidSums, eq(livePaidSums.liveEnrollmentId, liveEnrollments.id))
      .where(eq(liveEnrollments.userId, userId));

    return {
      student,
      enrollments: [
        ...recorded.map(({ feeAmount, paidAmount, ...r }) => ({
          ...r,
          enrolledAt: r.enrolledAt?.toISOString() ?? null,
          expiresAt: r.expiresAt?.toISOString() ?? null,
          ...paymentSummaryFrom(feeAmount, paidAmount, false),
        })),
        ...live.map(({ feeAmount, paidAmount, ...r }) => ({
          ...r,
          enrolledAt: r.enrolledAt?.toISOString() ?? null,
          expiresAt: r.expiresAt?.toISOString() ?? null,
          ...paymentSummaryFrom(feeAmount, paidAmount, r.status === 'completed'),
        })),
      ].sort((a, b) => (b.enrolledAt ?? '').localeCompare(a.enrolledAt ?? '')),
    };
  }

  /** Fee + total paid + due + status + full payment history for one enrollment. */
  async getEnrollmentPayments(courseType: 'recorded' | 'live', id: number) {
    if (courseType === 'recorded') {
      const [enr] = await this.db
        .select({ orderId: enrollments.orderId })
        .from(enrollments)
        .where(eq(enrollments.id, id))
        .limit(1);
      if (!enr) throw new NotFoundException('Enrollment not found');

      if (!enr.orderId) {
        return { feeAmount: null, totalPaid: '0', dueAmount: '0', paymentStatus: null, payments: [] };
      }

      const [order] = await this.db
        .select({ finalAmount: orders.finalAmount })
        .from(orders)
        .where(eq(orders.id, enr.orderId))
        .limit(1);

      const rows = await this.db
        .select({
          id: payments.id,
          amount: payments.amount,
          method: payments.method,
          status: payments.status,
          paidAt: payments.paidAt,
          createdAt: payments.createdAt,
          displayInvoiceNumber: payments.displayInvoiceNumber,
        })
        .from(payments)
        .where(eq(payments.orderId, enr.orderId))
        .orderBy(desc(payments.createdAt));

      const totalPaid = rows
        .filter((r) => r.status === 'completed')
        .reduce((sum, r) => sum + Number(r.amount), 0);

      return {
        ...paymentSummaryFrom(order?.finalAmount ?? null, String(totalPaid), false),
        payments: rows.map((r) => ({
          ...r,
          paidAt: r.paidAt?.toISOString() ?? null,
          createdAt: r.createdAt?.toISOString() ?? null,
        })),
      };
    }

    const [enr] = await this.db
      .select({ amount: liveEnrollments.amount, status: liveEnrollments.status })
      .from(liveEnrollments)
      .where(eq(liveEnrollments.id, id))
      .limit(1);
    if (!enr) throw new NotFoundException('Live enrollment not found');

    const rows = await this.db
      .select({
        id: livePayments.id,
        amount: livePayments.amount,
        method: livePayments.method,
        status: livePayments.status,
        paidAt: livePayments.paidAt,
        createdAt: livePayments.createdAt,
        displayInvoiceNumber: livePayments.displayInvoiceNumber,
      })
      .from(livePayments)
      .where(eq(livePayments.liveEnrollmentId, id))
      .orderBy(desc(livePayments.createdAt));

    const totalPaid = rows
      .filter((r) => r.status === 'completed')
      .reduce((sum, r) => sum + Number(r.amount), 0);

    return {
      ...paymentSummaryFrom(enr.amount, String(totalPaid), rows.length === 0 && enr.status === 'completed'),
      payments: rows.map((r) => ({
        ...r,
        paidAt: r.paidAt?.toISOString() ?? null,
        createdAt: r.createdAt?.toISOString() ?? null,
      })),
    };
  }

  /** Records a new installment payment against an existing enrollment. */
  async recordEnrollmentPayment(
    courseType: 'recorded' | 'live',
    id: number,
    body: { amount: number; method?: 'bkash' | 'nagad' | 'rocket' | 'upay' | 'card'; bkashTrxId?: string; payerPhone?: string },
  ) {
    const method = body.method ?? 'bkash';

    if (courseType === 'recorded') {
      const [enr] = await this.db
        .select({ id: enrollments.id, orderId: enrollments.orderId, courseId: enrollments.courseId, userId: enrollments.userId })
        .from(enrollments)
        .where(eq(enrollments.id, id))
        .limit(1);
      if (!enr) throw new NotFoundException('Enrollment not found');

      let orderId = enr.orderId;
      if (!orderId) {
        // Was a free enrollment — open an order now so a payment has somewhere to attach.
        const [course] = await this.db
          .select({ price: courses.price, discountPrice: courses.discountPrice })
          .from(courses)
          .where(eq(courses.id, enr.courseId))
          .limit(1);
        if (!course) throw new NotFoundException('Course not found');
        const fee = course.discountPrice && Number(course.discountPrice) > 0 ? course.discountPrice : course.price;
        const [order] = await this.db
          .insert(orders)
          .values({ userId: enr.userId, totalAmount: fee, discountAmount: '0', finalAmount: fee, status: 'pending' })
          .returning({ id: orders.id });
        orderId = order!.id;
        await this.db.insert(orderItems).values({ orderId, courseId: enr.courseId, price: fee });
        await this.db.update(enrollments).set({ orderId }).where(eq(enrollments.id, id));
      }

      await this.db.insert(payments).values({
        orderId,
        userId:     enr.userId,
        amount:     String(body.amount),
        method,
        bkashTrxId: body.bkashTrxId ?? null,
        payerPhone: body.payerPhone ?? null,
        status:     'completed',
        paidAt:     new Date(),
        displayInvoiceNumber: await this.invoiceNumbers.generate(),
      });

      const [order] = await this.db.select({ finalAmount: orders.finalAmount }).from(orders).where(eq(orders.id, orderId)).limit(1);
      const [{ paid }] = await this.db
        .select({ paid: sql<string>`COALESCE(SUM(${payments.amount}), 0)` })
        .from(payments)
        .where(and(eq(payments.orderId, orderId), eq(payments.status, 'completed')));
      if (Number(paid) >= Number(order!.finalAmount)) {
        await this.db.update(orders).set({ status: 'paid', updatedAt: new Date() }).where(eq(orders.id, orderId));
      }

      return paymentSummaryFrom(order!.finalAmount, paid, false);
    }

    const [enr] = await this.db
      .select({ id: liveEnrollments.id, amount: liveEnrollments.amount, userId: liveEnrollments.userId, status: liveEnrollments.status })
      .from(liveEnrollments)
      .where(eq(liveEnrollments.id, id))
      .limit(1);
    if (!enr) throw new NotFoundException('Live enrollment not found');

    await this.db.insert(livePayments).values({
      liveEnrollmentId: id,
      userId:     enr.userId,
      amount:     String(body.amount),
      method,
      bkashTrxId: body.bkashTrxId ?? null,
      payerPhone: body.payerPhone ?? null,
      status:     'completed',
      paidAt:     new Date(),
      displayInvoiceNumber: await this.invoiceNumbers.generate(),
    });

    const [{ paid }] = await this.db
      .select({ paid: sql<string>`COALESCE(SUM(${livePayments.amount}), 0)` })
      .from(livePayments)
      .where(and(eq(livePayments.liveEnrollmentId, id), eq(livePayments.status, 'completed')));

    return paymentSummaryFrom(enr.amount, paid, false);
  }

  async removeRecordedEnrollment(id: number) {
    const [row] = await this.db
      .delete(enrollments)
      .where(eq(enrollments.id, id))
      .returning({ id: enrollments.id });
    if (!row) throw new NotFoundException('Enrollment not found');
    return { id: row.id };
  }

  async removeLiveEnrollment(id: number) {
    const [row] = await this.db
      .delete(liveEnrollments)
      .where(eq(liveEnrollments.id, id))
      .returning({ id: liveEnrollments.id });
    if (!row) throw new NotFoundException('Live enrollment not found');
    return { id: row.id };
  }

  async toggleRecordedSuspend(id: number, reason?: string) {
    const [current] = await this.db
      .select({ id: enrollments.id, status: enrollments.status })
      .from(enrollments)
      .where(eq(enrollments.id, id))
      .limit(1);
    if (!current) throw new NotFoundException('Enrollment not found');

    const newStatus = current.status === 'suspended' ? 'active' : 'suspended';
    const [updated] = await this.db
      .update(enrollments)
      .set({
        status: newStatus as any,
        // Reason is only meaningful while suspended — cleared on unsuspend.
        statusReason: newStatus === 'suspended' ? (reason?.trim() || null) : null,
      })
      .where(eq(enrollments.id, id))
      .returning({ id: enrollments.id, status: enrollments.status });
    return updated;
  }

  async toggleLiveSuspend(id: number, reason?: string) {
    const [current] = await this.db
      .select({ id: liveEnrollments.id, status: liveEnrollments.status })
      .from(liveEnrollments)
      .where(eq(liveEnrollments.id, id))
      .limit(1);
    if (!current) throw new NotFoundException('Live enrollment not found');

    const newStatus = current.status === 'suspended' ? 'completed' : 'suspended';
    const [updated] = await this.db
      .update(liveEnrollments)
      .set({
        status: newStatus,
        statusReason: newStatus === 'suspended' ? (reason?.trim() || null) : null,
      })
      .where(eq(liveEnrollments.id, id))
      .returning({ id: liveEnrollments.id, status: liveEnrollments.status });
    return updated;
  }

  async setRecordedExpiry(id: number, expiresAt: Date | null) {
    const [updated] = await this.db
      .update(enrollments)
      .set({ expiresAt })
      .where(eq(enrollments.id, id))
      .returning({ id: enrollments.id, expiresAt: enrollments.expiresAt });
    if (!updated) throw new NotFoundException('Enrollment not found');
    return { id: updated.id, expiresAt: updated.expiresAt?.toISOString() ?? null };
  }

  async setLiveExpiry(id: number, expiresAt: Date | null) {
    const [updated] = await this.db
      .update(liveEnrollments)
      .set({ expiresAt })
      .where(eq(liveEnrollments.id, id))
      .returning({ id: liveEnrollments.id, expiresAt: liveEnrollments.expiresAt });
    if (!updated) throw new NotFoundException('Live enrollment not found');
    return { id: updated.id, expiresAt: updated.expiresAt?.toISOString() ?? null };
  }

  // ─── Student Progress ─────────────────────────────────────────────────────

  async listProgress(params: TableQueryInput = {}) {
    const page    = Math.max(1, Number(params.page)      || 1);
    const perPage = Math.min(100, Number(params.per_page) || 20);
    const offset  = (page - 1) * perPage;
    const search  = (params.search as string | undefined)?.trim() ?? '';
    const status  = (params.status as string | undefined)?.trim() ?? '';

    const conditions: ReturnType<typeof ilike>[] = [];
    if (search) {
      conditions.push(
        ilike(users.firstName, `%${search}%`),
        ilike(users.lastName,  `%${search}%`),
        ilike(users.email,     `%${search}%`),
        ilike(courses.title,   `%${search}%`),
      );
    }

    const baseWhere = search
      ? or(...conditions as [ReturnType<typeof ilike>, ...ReturnType<typeof ilike>[]])
      : undefined;

    const statusFilter = status ? eq(enrollments.status, status as any) : undefined;

    const where =
      baseWhere && statusFilter ? and(baseWhere, statusFilter)
      : baseWhere              ? baseWhere
      : statusFilter           ? statusFilter
      : undefined;

    const [rows, [countRow]] = await Promise.all([
      this.db
        .select({
          enrollmentId:     enrollments.id,
          enrollmentStatus: enrollments.status,
          enrolledAt:       enrollments.enrolledAt,
          completedAt:      enrollments.completedAt,
          userId:           users.id,
          userFirstName:    users.firstName,
          userLastName:     users.lastName,
          userEmail:        users.email,
          userAvatar:       users.avatar,
          courseId:         courses.id,
          courseTitle:      courses.title,
          courseSlug:       courses.slug,
          totalLessons: sql<number>`(
            SELECT COUNT(*)::int FROM "lessons"
            INNER JOIN "course_modules" ON "lessons"."module_id" = "course_modules"."id"
            WHERE "course_modules"."course_id" = ${courses.id}
          )`.mapWith(Number),
          completedLessons: sql<number>`
            COALESCE((
              SELECT COUNT(*)
              FROM lesson_progress lp
              WHERE lp.user_id  = ${enrollments.userId}
                AND lp.course_id = ${enrollments.courseId}
                AND lp.completed_at IS NOT NULL
            ), 0)`.mapWith(Number),
          lastActivity: sql<string | null>`
            (
              SELECT MAX(lp.updated_at)
              FROM lesson_progress lp
              WHERE lp.user_id  = ${enrollments.userId}
                AND lp.course_id = ${enrollments.courseId}
            )`,
        })
        .from(enrollments)
        .innerJoin(users,   eq(enrollments.userId,   users.id))
        .innerJoin(courses, eq(enrollments.courseId, courses.id))
        .where(where)
        .orderBy(desc(enrollments.enrolledAt))
        .limit(perPage)
        .offset(offset),

      this.db
        .select({ count: sql<number>`COUNT(*)`.mapWith(Number) })
        .from(enrollments)
        .innerJoin(users,   eq(enrollments.userId,   users.id))
        .innerJoin(courses, eq(enrollments.courseId, courses.id))
        .where(where),
    ]);

    // Stats
    const [[totalActive], [totalCompleted], [atRiskRow]] = await Promise.all([
      this.db.select({ count: sql<number>`COUNT(*)`.mapWith(Number) })
        .from(enrollments).where(eq(enrollments.status, 'active')),
      this.db.select({ count: sql<number>`COUNT(*)`.mapWith(Number) })
        .from(enrollments).where(eq(enrollments.status, 'completed')),
      // At-risk: active, enrolled > 7 days ago, zero completed lessons
      this.db.select({ count: sql<number>`COUNT(*)`.mapWith(Number) })
        .from(enrollments)
        .where(and(
          eq(enrollments.status, 'active'),
          sql`${enrollments.enrolledAt} < NOW() - INTERVAL '7 days'`,
          sql`NOT EXISTS (
            SELECT 1 FROM lesson_progress lp
            WHERE lp.user_id  = ${enrollments.userId}
              AND lp.course_id = ${enrollments.courseId}
              AND lp.completed_at IS NOT NULL
          )`,
        )),
    ]);

    return {
      data: rows,
      pagination: formatPaginatedResponse(rows, countRow?.count ?? 0, page, perPage).pagination,
      stats: {
        active:    totalActive?.count    ?? 0,
        completed: totalCompleted?.count ?? 0,
        atRisk:    atRiskRow?.count      ?? 0,
      },
    };
  }

  // ─── Invoices ─────────────────────────────────────────────────────────────

  async getInvoices(params: TableQueryInput = {}) {
    const page    = Math.max(1, Number(params.page)      || 1);
    const perPage = Math.min(100, Number(params.per_page) || 20);
    const offset  = (page - 1) * perPage;
    const search   = (params.search    as string | undefined)?.trim() ?? '';
    const status   = (params.status   as string | undefined)?.trim() ?? '';
    const dateFrom = (params.date_from as string | undefined)?.trim() ?? '';
    const dateTo   = (params.date_to   as string | undefined)?.trim() ?? '';
    const term    = `%${search}%`;

    // Shop orders use `order_status` ('pending'|'paid'|'cancelled') instead of
    // `payment_status` ('pending'|'completed'|'failed') — map the incoming
    // filter value onto the shop-side equivalent.
    const shopStatus = status === 'completed' ? 'paid' : status === 'failed' ? 'cancelled' : status;

    // ── Per-source filters (search + status), applied in SQL ──────────────────
    const regConds: SQL[] = [];
    const liveConds: SQL[] = [];
    const shopConds: SQL[] = [];
    if (status) {
      regConds.push(sql`${payments.status} = ${status}`);
      liveConds.push(sql`${liveEnrollments.status} = ${status}`);
      shopConds.push(sql`${shopOrders.status} = ${shopStatus}`);
    }
    if (dateFrom) {
      regConds.push(gte(orders.createdAt, new Date(dateFrom)) as SQL);
      liveConds.push(gte(liveEnrollments.createdAt, new Date(dateFrom)) as SQL);
      shopConds.push(gte(shopOrders.createdAt, new Date(dateFrom)) as SQL);
    }
    if (dateTo) {
      const end = new Date(dateTo + 'T23:59:59');
      regConds.push(lte(orders.createdAt, end) as SQL);
      liveConds.push(lte(liveEnrollments.createdAt, end) as SQL);
      shopConds.push(lte(shopOrders.createdAt, end) as SQL);
    }
    if (search) {
      regConds.push(
        or(
          ilike(users.firstName, term),
          ilike(users.lastName, term),
          ilike(users.email, term),
          ilike(payments.paystationInvoiceId, term),
          ilike(payments.displayInvoiceNumber, term),
          sql`('INV-' || lpad(${payments.id}::text, 6, '0')) ILIKE ${term}`,
          sql`EXISTS (SELECT 1 FROM ${orderItems} oi JOIN ${courses} c ON c.id = oi.course_id WHERE oi.order_id = ${orders.id} AND c.title ILIKE ${term})`,
        ) as SQL,
      );
      liveConds.push(
        or(
          ilike(liveEnrollments.name, term),
          ilike(liveEnrollments.email, term),
          ilike(liveCourses.title, term),
          ilike(liveEnrollments.paystationInvoiceId, term),
          ilike(liveEnrollments.displayInvoiceNumber, term),
          sql`('INV-' || lpad(${liveEnrollments.id}::text, 6, '0')) ILIKE ${term}`,
        ) as SQL,
      );
      shopConds.push(
        or(
          ilike(shopOrders.name, term),
          ilike(shopOrders.email, term),
          ilike(shopOrders.paystationInvoiceId, term),
          ilike(shopOrders.displayInvoiceNumber, term),
          sql`('INV-' || lpad(${shopOrders.id}::text, 6, '0')) ILIKE ${term}`,
          sql`EXISTS (SELECT 1 FROM ${shopOrderItems} soi WHERE soi.order_id = ${shopOrders.id} AND soi.title ILIKE ${term})`,
        ) as SQL,
      );
    }
    const regWhere  = regConds.length  ? and(...regConds)  : undefined;
    const liveWhere = liveConds.length ? and(...liveConds) : undefined;
    const shopWhere = shopConds.length ? and(...shopConds) : undefined;

    // ── Page index: UNION ALL of (source, id, createdAt) → order + paginate ────
    // Fresh builders each use; the same builder can't be reused across unions.
    const regIdx = () =>
      this.db
        .select({ source: sql<string>`'regular'`.as('source'), id: payments.id, createdAt: payments.createdAt })
        .from(payments)
        .innerJoin(orders, eq(payments.orderId, orders.id))
        .innerJoin(users, eq(payments.userId, users.id))
        .where(regWhere);
    const liveIdx = () =>
      this.db
        .select({ source: sql<string>`'live'`.as('source'), id: liveEnrollments.id, createdAt: liveEnrollments.createdAt })
        .from(liveEnrollments)
        .innerJoin(liveCourses, eq(liveEnrollments.liveCourseId, liveCourses.id))
        .where(liveWhere);
    const shopIdx = () =>
      this.db
        .select({ source: sql<string>`'shop'`.as('source'), id: shopOrders.id, createdAt: shopOrders.createdAt })
        .from(shopOrders)
        .where(shopWhere);

    const [pageRows, [{ total }]] = await Promise.all([
      unionAll(regIdx(), liveIdx(), shopIdx())
        .orderBy(sql`created_at DESC NULLS LAST`)
        .limit(perPage)
        .offset(offset),
      this.db
        .select({ total: sql<number>`count(*)`.mapWith(Number) })
        .from(unionAll(regIdx(), liveIdx(), shopIdx()).as('inv_union')),
    ]);

    const regPageIds  = pageRows.filter((r) => r.source === 'regular').map((r) => r.id);
    const livePageIds = pageRows.filter((r) => r.source === 'live').map((r) => r.id);
    const shopPageIds = pageRows.filter((r) => r.source === 'shop').map((r) => r.id);

    // ── Hydrate only this page's rows ─────────────────────────────────────────
    const regularRows = regPageIds.length
      ? await this.db
          .select({
            paymentId:           payments.id,
            amount:              payments.amount,
            method:              payments.method,
            status:              payments.status,
            paystationInvoiceId: payments.paystationInvoiceId,
            displayInvoiceNumber: payments.displayInvoiceNumber,
            paystationTrxId:     payments.paystationTrxId,
            paystationMethod:    payments.paystationMethod,
            bkashTrxId:          payments.bkashTrxId,
            paidAt:              payments.paidAt,
            createdAt:           payments.createdAt,
            orderId:             orders.id,
            totalAmount:         orders.totalAmount,
            discountAmount:      orders.discountAmount,
            finalAmount:         orders.finalAmount,
            orderStatus:         orders.status,
            userId:              users.id,
            firstName:           users.firstName,
            lastName:            users.lastName,
            email:               users.email,
            phone:               users.phone,
          })
          .from(payments)
          .innerJoin(orders, eq(payments.orderId, orders.id))
          .innerJoin(users,  eq(payments.userId,  users.id))
          .where(inArray(payments.id, regPageIds))
      : [];

    const orderIds = regularRows.map((r) => r.orderId);
    const allItems = orderIds.length
      ? await this.db
          .select({
            orderId:     orderItems.orderId,
            courseId:    courses.id,
            courseTitle: courses.title,
            courseSlug:  courses.slug,
            price:       orderItems.price,
          })
          .from(orderItems)
          .innerJoin(courses, eq(orderItems.courseId, courses.id))
          .where(inArray(orderItems.orderId, orderIds))
      : [];
    const itemsByOrder = new Map<number, { courseId: number; courseTitle: string; courseSlug: string; price: string }[]>();
    for (const it of allItems) {
      const list = itemsByOrder.get(it.orderId) ?? [];
      list.push({ courseId: it.courseId, courseTitle: it.courseTitle, courseSlug: it.courseSlug, price: it.price });
      itemsByOrder.set(it.orderId, list);
    }
    const regByPaymentId = new Map<number, Record<string, unknown>>();
    for (const row of regularRows) {
      regByPaymentId.set(row.paymentId, { type: 'regular' as const, ...row, items: itemsByOrder.get(row.orderId) ?? [] });
    }

    const liveRows = livePageIds.length
      ? await this.db
          .select({
            enrollmentId:        liveEnrollments.id,
            amount:              liveEnrollments.amount,
            status:              liveEnrollments.status,
            paystationInvoiceId: liveEnrollments.paystationInvoiceId,
            displayInvoiceNumber: liveEnrollments.displayInvoiceNumber,
            paystationTrxId:     liveEnrollments.paystationTrxId,
            paystationMethod:    liveEnrollments.paystationMethod,
            paidAt:              liveEnrollments.paidAt,
            createdAt:           liveEnrollments.createdAt,
            name:                liveEnrollments.name,
            phone:               liveEnrollments.phone,
            email:               liveEnrollments.email,
            liveCourseId:        liveCourses.id,
            liveCourseTitle:     liveCourses.title,
            liveCourseSlug:      liveCourses.slug,
          })
          .from(liveEnrollments)
          .innerJoin(liveCourses, eq(liveEnrollments.liveCourseId, liveCourses.id))
          .where(inArray(liveEnrollments.id, livePageIds))
      : [];
    const liveByEnrollmentId = new Map<number, Record<string, unknown>>();
    for (const row of liveRows) {
      liveByEnrollmentId.set(row.enrollmentId, {
        type:                'live' as const,
        paymentId:           row.enrollmentId,
        amount:              row.amount,
        method:              'paystation' as const,
        status:              row.status as 'pending' | 'completed' | 'failed',
        paystationInvoiceId: row.paystationInvoiceId,
        displayInvoiceNumber: row.displayInvoiceNumber,
        paystationTrxId:     row.paystationTrxId,
        paystationMethod:    row.paystationMethod,
        bkashTrxId:          null,
        paidAt:              row.paidAt ? row.paidAt.toISOString() : null,
        createdAt:           row.createdAt ? row.createdAt.toISOString() : null,
        orderId:             null,
        totalAmount:         row.amount,
        discountAmount:      '0',
        finalAmount:         row.amount,
        orderStatus:         row.status,
        userId:              null,
        firstName:           row.name,
        lastName:            '',
        email:               row.email,
        phone:               row.phone,
        items: [{ courseId: row.liveCourseId, courseTitle: row.liveCourseTitle, courseSlug: row.liveCourseSlug, price: row.amount }],
      });
    }

    const shopRows = shopPageIds.length
      ? await this.db
          .select({
            orderId:             shopOrders.id,
            amount:              shopOrders.finalAmount,
            totalAmount:         shopOrders.totalAmount,
            discountAmount:      shopOrders.discountAmount,
            status:              shopOrders.status,
            paymentMethod:       shopOrders.paymentMethod,
            paystationInvoiceId: shopOrders.paystationInvoiceId,
            displayInvoiceNumber: shopOrders.displayInvoiceNumber,
            paystationTrxId:     shopOrders.paystationTrxId,
            paystationMethod:    shopOrders.paystationMethod,
            bkashTrxId:          shopOrders.bkashTrxId,
            paidAt:              shopOrders.paidAt,
            createdAt:           shopOrders.createdAt,
            name:                shopOrders.name,
            email:               shopOrders.email,
            phone:               shopOrders.phone,
          })
          .from(shopOrders)
          .where(inArray(shopOrders.id, shopPageIds))
      : [];

    const shopOrderIds = shopRows.map((r) => r.orderId);
    const shopItemRows = shopOrderIds.length
      ? await this.db
          .select({
            orderId:  shopOrderItems.orderId,
            productId: shopOrderItems.productId,
            title:    shopOrderItems.title,
            price:    shopOrderItems.price,
            quantity: shopOrderItems.quantity,
          })
          .from(shopOrderItems)
          .where(inArray(shopOrderItems.orderId, shopOrderIds))
      : [];
    const itemsByShopOrder = new Map<number, { courseId: number; courseTitle: string; courseSlug: string; price: string; quantity: number }[]>();
    for (const it of shopItemRows) {
      const list = itemsByShopOrder.get(it.orderId) ?? [];
      list.push({ courseId: it.productId, courseTitle: it.title, courseSlug: '', price: it.price, quantity: it.quantity });
      itemsByShopOrder.set(it.orderId, list);
    }

    // Shop's order_status ('pending'|'paid'|'cancelled') mapped onto the same
    // 'pending'|'completed'|'failed' vocabulary the other two sources use.
    const shopStatusLabel = (s: string): 'pending' | 'completed' | 'failed' =>
      s === 'paid' ? 'completed' : s === 'cancelled' ? 'failed' : 'pending';

    const shopByOrderId = new Map<number, Record<string, unknown>>();
    for (const row of shopRows) {
      shopByOrderId.set(row.orderId, {
        type:                'shop' as const,
        paymentId:           row.orderId,
        amount:              row.amount,
        method:              (row.paymentMethod ?? 'paystation') as 'bkash' | 'paystation' | 'free' | 'ssl',
        status:              shopStatusLabel(row.status),
        paystationInvoiceId: row.paystationInvoiceId,
        displayInvoiceNumber: row.displayInvoiceNumber,
        paystationTrxId:     row.paystationTrxId,
        paystationMethod:    row.paystationMethod,
        bkashTrxId:          row.bkashTrxId,
        paidAt:              row.paidAt ? row.paidAt.toISOString() : null,
        createdAt:           row.createdAt ? row.createdAt.toISOString() : null,
        orderId:             row.orderId,
        totalAmount:         row.totalAmount,
        discountAmount:      row.discountAmount,
        finalAmount:         row.amount,
        orderStatus:         row.status,
        userId:              null,
        firstName:           row.name,
        lastName:            '',
        email:               row.email,
        phone:               row.phone,
        items: itemsByShopOrder.get(row.orderId) ?? [],
      });
    }

    // Assemble in the global paginated order produced by the union.
    const data = pageRows
      .map((r) =>
        r.source === 'regular' ? regByPaymentId.get(r.id)
        : r.source === 'live'  ? liveByEnrollmentId.get(r.id)
        : shopByOrderId.get(r.id),
      )
      .filter(Boolean);

    // ── Stats over the FULL set (independent of search/status), via aggregates ─
    const [[regStats], [liveStats]] = await Promise.all([
      this.db
        .select({
          total:   sql<number>`count(*)`.mapWith(Number),
          paid:    sql<number>`count(*) filter (where ${payments.status} = 'completed')`.mapWith(Number),
          pending: sql<number>`count(*) filter (where ${payments.status} = 'pending')`.mapWith(Number),
          revenue: sql<number>`coalesce(sum(${orders.finalAmount}) filter (where ${payments.status} = 'completed'), 0)`.mapWith(Number),
        })
        .from(payments)
        .innerJoin(orders, eq(payments.orderId, orders.id))
        .innerJoin(users, eq(payments.userId, users.id)),
      this.db
        .select({
          total:   sql<number>`count(*)`.mapWith(Number),
          paid:    sql<number>`count(*) filter (where ${liveEnrollments.status} = 'completed')`.mapWith(Number),
          pending: sql<number>`count(*) filter (where ${liveEnrollments.status} = 'pending')`.mapWith(Number),
          revenue: sql<number>`coalesce(sum(${liveEnrollments.amount}) filter (where ${liveEnrollments.status} = 'completed'), 0)`.mapWith(Number),
        })
        .from(liveEnrollments)
        .innerJoin(liveCourses, eq(liveEnrollments.liveCourseId, liveCourses.id)),
    ]);
    const [shopStats] = await this.db
      .select({
        total:   sql<number>`count(*)`.mapWith(Number),
        paid:    sql<number>`count(*) filter (where ${shopOrders.status} = 'paid')`.mapWith(Number),
        pending: sql<number>`count(*) filter (where ${shopOrders.status} = 'pending')`.mapWith(Number),
        revenue: sql<number>`coalesce(sum(${shopOrders.finalAmount}) filter (where ${shopOrders.status} = 'paid'), 0)`.mapWith(Number),
      })
      .from(shopOrders);

    const stats = {
      total:   regStats.total + liveStats.total + shopStats!.total,
      paid:    regStats.paid + liveStats.paid + shopStats!.paid,
      pending: regStats.pending + liveStats.pending + shopStats!.pending,
      revenue: regStats.revenue + liveStats.revenue + shopStats!.revenue,
    };

    const lastPage = Math.max(1, Math.ceil(total / perPage));
    return {
      data,
      pagination: {
        total,
        per_page:     perPage,
        current_page: page,
        last_page:    lastPage,
        from:         total === 0 ? 0 : offset + 1,
        to:           Math.min(offset + perPage, total),
      },
      stats,
    };
  }

  // ─── Admin Users (Roles & Permissions) ───────────────────────────────────

  async listAdminUsers(params: TableQueryInput = {}) {
    const q = buildTableQuery(params, {
      searchable: [adminUsers.firstName, adminUsers.lastName, adminUsers.email],
      sortable:   { createdAt: adminUsers.createdAt, email: adminUsers.email, firstName: adminUsers.firstName },
      filterable: { role: adminUsers.role, status: adminUsers.status },
      dateColumn:  adminUsers.createdAt,
      defaultSort: desc(adminUsers.createdAt),
    });

    const [rows, [countRow]] = await Promise.all([
      this.db
        .select({
          id:        adminUsers.id,
          firstName: adminUsers.firstName,
          lastName:  adminUsers.lastName,
          email:     adminUsers.email,
          role:      adminUsers.role,
          roleId:    adminUsers.roleId,
          roleName:  roles.name,
          status:    adminUsers.status,
          avatar:    adminUsers.avatar,
          createdAt: adminUsers.createdAt,
        })
        .from(adminUsers)
        .leftJoin(roles, eq(roles.id, adminUsers.roleId))
        .where(q.where)
        .orderBy(q.orderBy)
        .limit(q.limit)
        .offset(q.offset),
      this.db
        .select({ count: sql<number>`COUNT(*)`.mapWith(Number) })
        .from(adminUsers)
        .where(q.where),
    ]);

    // Stats
    const [[totalRow], [superAdminRow], [instructorRow]] = await Promise.all([
      this.db.select({ count: sql<number>`COUNT(*)`.mapWith(Number) }).from(adminUsers),
      this.db.select({ count: sql<number>`COUNT(*)`.mapWith(Number) }).from(adminUsers).where(eq(adminUsers.role, 'SUPER_ADMIN')),
      this.db.select({ count: sql<number>`COUNT(*)`.mapWith(Number) }).from(adminUsers).where(eq(adminUsers.role, 'INSTRUCTOR')),
    ]);

    return {
      ...formatPaginatedResponse(rows, countRow?.count ?? 0, q.page, q.perPage),
      stats: {
        total:       totalRow?.count      ?? 0,
        superAdmins: superAdminRow?.count ?? 0,
        instructors: instructorRow?.count ?? 0,
      },
    };
  }

  async createAdminUser(dto: {
    firstName: string;
    lastName:  string;
    email:     string;
    password:  string;
    roleId:    number;
  }) {
    const [existing] = await this.db
      .select({ id: adminUsers.id })
      .from(adminUsers)
      .where(eq(adminUsers.email, dto.email))
      .limit(1);

    if (existing) throw new ConflictException('Email already in use');

    const { roleId, enumRole } = await this.resolveRole(dto.roleId);
    const hashed = await bcrypt.hash(dto.password, 10);

    const [created] = await this.db
      .insert(adminUsers)
      .values({
        firstName: dto.firstName,
        lastName:  dto.lastName,
        email:     dto.email,
        password:  hashed,
        role:      enumRole,
        roleId,
      })
      .returning({
        id:        adminUsers.id,
        firstName: adminUsers.firstName,
        lastName:  adminUsers.lastName,
        email:     adminUsers.email,
        role:      adminUsers.role,
        roleId:    adminUsers.roleId,
        status:    adminUsers.status,
        createdAt: adminUsers.createdAt,
      });

    return created;
  }

  /**
   * Resolve a dynamic role and derive the legacy admin enum from it. The enum is
   * the identity used for the Super Admin all-access short-circuit, so the
   * super-admin system role maps to SUPER_ADMIN and every other role to the
   * generic INSTRUCTOR value (real access comes from the role's permissions).
   */
  private async resolveRole(
    roleId: number,
  ): Promise<{ roleId: number; enumRole: 'SUPER_ADMIN' | 'INSTRUCTOR' }> {
    const [role] = await this.db
      .select({ id: roles.id, slug: roles.slug })
      .from(roles)
      .where(eq(roles.id, roleId))
      .limit(1);

    if (!role) throw new BadRequestException('Invalid role');

    return {
      roleId: role.id,
      enumRole: role.slug === 'super-admin' ? 'SUPER_ADMIN' : 'INSTRUCTOR',
    };
  }

  async updateAdminRole(id: number, newRoleId: number) {
    const [existing] = await this.db
      .select({ id: adminUsers.id })
      .from(adminUsers)
      .where(eq(adminUsers.id, id))
      .limit(1);

    if (!existing) throw new NotFoundException('Admin user not found');

    const { roleId, enumRole } = await this.resolveRole(newRoleId);

    const [updated] = await this.db
      .update(adminUsers)
      .set({ role: enumRole, roleId })
      .where(eq(adminUsers.id, id))
      .returning({
        id: adminUsers.id,
        role: adminUsers.role,
        roleId: adminUsers.roleId,
      });

    return updated;
  }

  /** Update an admin user's profile details (name / email). */
  async updateAdminUser(
    id: number,
    dto: { firstName?: string; lastName?: string; email?: string },
  ) {
    const [existing] = await this.db
      .select({ id: adminUsers.id })
      .from(adminUsers)
      .where(eq(adminUsers.id, id))
      .limit(1);

    if (!existing) throw new NotFoundException('Admin user not found');

    if (dto.email) {
      const [clash] = await this.db
        .select({ id: adminUsers.id })
        .from(adminUsers)
        .where(eq(adminUsers.email, dto.email))
        .limit(1);
      if (clash && clash.id !== id)
        throw new ConflictException('Email already in use');
    }

    const patch: Partial<{ firstName: string; lastName: string; email: string }> =
      {};
    if (dto.firstName !== undefined) patch.firstName = dto.firstName;
    if (dto.lastName !== undefined) patch.lastName = dto.lastName;
    if (dto.email !== undefined) patch.email = dto.email;

    const [updated] = await this.db
      .update(adminUsers)
      .set(patch)
      .where(eq(adminUsers.id, id))
      .returning({
        id: adminUsers.id,
        firstName: adminUsers.firstName,
        lastName: adminUsers.lastName,
        email: adminUsers.email,
        role: adminUsers.role,
        roleId: adminUsers.roleId,
        status: adminUsers.status,
      });

    return updated;
  }

  /** Set a new password for an admin user (super-admin/`update_admins` only). */
  async resetAdminPassword(id: number, password: string) {
    if (!password || password.length < 6)
      throw new BadRequestException('Password must be at least 6 characters');

    const [existing] = await this.db
      .select({ id: adminUsers.id })
      .from(adminUsers)
      .where(eq(adminUsers.id, id))
      .limit(1);

    if (!existing) throw new NotFoundException('Admin user not found');

    const hashed = await bcrypt.hash(password, 10);
    await this.db
      .update(adminUsers)
      .set({ password: hashed })
      .where(eq(adminUsers.id, id));

    return { success: true };
  }

  async toggleAdminStatus(id: number) {
    const [existing] = await this.db
      .select({ id: adminUsers.id, status: adminUsers.status })
      .from(adminUsers)
      .where(eq(adminUsers.id, id))
      .limit(1);

    if (!existing) throw new NotFoundException('Admin user not found');

    const newStatus = existing.status === 'active' ? 'suspended' : 'active';

    const [updated] = await this.db
      .update(adminUsers)
      .set({ status: newStatus as 'active' | 'suspended' })
      .where(eq(adminUsers.id, id))
      .returning({ id: adminUsers.id, status: adminUsers.status });

    return updated;
  }

  async deleteAdminUser(id: number) {
    const [existing] = await this.db
      .select({ id: adminUsers.id })
      .from(adminUsers)
      .where(eq(adminUsers.id, id))
      .limit(1);

    if (!existing) throw new NotFoundException('Admin user not found');

    await this.db.delete(adminUsers).where(eq(adminUsers.id, id));
    return { success: true };
  }

  // ─── Revenue Reports ──────────────────────────────────────────────────────

  async getRevenueReport() {
    return this.db
      .select({
        id: orders.id,
        status: orders.status,
        finalAmount: orders.finalAmount,
        createdAt: orders.createdAt,
        userId: users.id,
        userFirstName: users.firstName,
        userLastName: users.lastName,
        userEmail: users.email,
      })
      .from(orders)
      .innerJoin(users, eq(orders.userId, users.id))
      .orderBy(desc(orders.createdAt));
  }

  async getLiveRevenueReport() {
    return this.db
      .select({
        id:            liveEnrollments.id,
        status:        sql<string>`CASE WHEN ${liveEnrollments.status} = 'completed' THEN 'paid' ELSE ${liveEnrollments.status} END`,
        finalAmount:   liveEnrollments.amount,
        createdAt:     liveEnrollments.createdAt,
        userFirstName: liveEnrollments.name,
        userLastName:  sql<string>`''`,
        userEmail:     liveEnrollments.email,
      })
      .from(liveEnrollments)
      .orderBy(desc(liveEnrollments.createdAt));
  }

  // ─── Teacher Management ───────────────────────────────────────────────────

  async getTeacher(id: number) {
    const [teacher] = await this.db
      .select({
        id:            adminUsers.id,
        firstName:     adminUsers.firstName,
        lastName:      adminUsers.lastName,
        email:         adminUsers.email,
        status:        adminUsers.status,
        avatar:        adminUsers.avatar,
        createdAt:     adminUsers.createdAt,
        bio:           instructorProfiles.bio,
        expertise:     instructorProfiles.expertise,
        displayName:   instructorProfiles.displayName,
        displayAvatar: instructorProfiles.displayAvatar,
        socialLinks:   instructorProfiles.socialLinks,
        payoutInfo:    instructorProfiles.payoutInfo,
        totalStudents: sql<number>`COALESCE(${instructorProfiles.totalStudents}, 0)`,
        totalCourses:  sql<number>`COALESCE(${instructorProfiles.totalCourses}, 0)`,
        rating:        instructorProfiles.rating,
      })
      .from(adminUsers)
      .leftJoin(instructorProfiles, eq(instructorProfiles.userId, adminUsers.id))
      .where(and(eq(adminUsers.id, id), eq(adminUsers.role, 'INSTRUCTOR')))
      .limit(1);

    if (!teacher) throw new NotFoundException('Teacher not found');

    const teacherCourses = await this.db
      .select({
        id:        courses.id,
        title:     courses.title,
        slug:      courses.slug,
        status:    courses.status,
        thumbnail: courses.thumbnail,
        price:     courses.price,
        totalStudents: sql<number>`(
          SELECT COUNT(*)::int FROM ${enrollments}
          WHERE ${enrollments.courseId} = ${courses.id} AND ${enrollments.status} = 'active'
        )`,
        rating:    courses.rating,
        createdAt: courses.createdAt,
      })
      .from(courses)
      .where(eq(courses.instructorId, id))
      .orderBy(desc(courses.createdAt));

    return { ...teacher, courses: teacherCourses };
  }

  async listTeachers(params: TableQueryInput = {}) {
    const q = buildTableQuery(params, {
      searchable: [adminUsers.firstName, adminUsers.lastName, adminUsers.email],
      sortable:   { createdAt: adminUsers.createdAt, firstName: adminUsers.firstName, email: adminUsers.email },
      filterable: { status: adminUsers.status },
      dateColumn:  adminUsers.createdAt,
      defaultSort: desc(adminUsers.createdAt),
    });

    const instructorWhere = eq(adminUsers.role, 'INSTRUCTOR');
    const combinedWhere = q.where ? and(instructorWhere, q.where) : instructorWhere;

    const [rows, [countRow]] = await Promise.all([
      this.db
        .select({
          id:            adminUsers.id,
          firstName:     adminUsers.firstName,
          lastName:      adminUsers.lastName,
          email:         adminUsers.email,
          status:        adminUsers.status,
          avatar:        adminUsers.avatar,
          createdAt:     adminUsers.createdAt,
          bio:           instructorProfiles.bio,
          expertise:     instructorProfiles.expertise,
          displayName:   instructorProfiles.displayName,
          displayAvatar: instructorProfiles.displayAvatar,
          totalStudents: sql<number>`COALESCE(${instructorProfiles.totalStudents}, 0)`,
          totalCourses:  sql<number>`COALESCE(${instructorProfiles.totalCourses}, 0)`,
          rating:        instructorProfiles.rating,
        })
        .from(adminUsers)
        .leftJoin(instructorProfiles, eq(instructorProfiles.userId, adminUsers.id))
        .where(combinedWhere)
        .orderBy(q.orderBy)
        .limit(q.limit)
        .offset(q.offset),
      this.db
        .select({ count: sql<number>`COUNT(*)`.mapWith(Number) })
        .from(adminUsers)
        .where(combinedWhere),
    ]);

    return formatPaginatedResponse(rows, countRow?.count ?? 0, q.page, q.perPage);
  }

  async updateTeacher(id: number, dto: { firstName?: string; lastName?: string; email?: string }) {
    const [existing] = await this.db
      .select({ id: adminUsers.id })
      .from(adminUsers)
      .where(and(eq(adminUsers.id, id), eq(adminUsers.role, 'INSTRUCTOR')))
      .limit(1);

    if (!existing) throw new NotFoundException('Teacher not found');

    const [updated] = await this.db
      .update(adminUsers)
      .set({ ...dto, updatedAt: new Date() })
      .where(eq(adminUsers.id, id))
      .returning({
        id:        adminUsers.id,
        firstName: adminUsers.firstName,
        lastName:  adminUsers.lastName,
        email:     adminUsers.email,
        status:    adminUsers.status,
        avatar:    adminUsers.avatar,
      });

    this.revalidation.revalidate([CacheTag.instructors]);
    return updated;
  }

  async toggleTeacherStatus(id: number) {
    const [existing] = await this.db
      .select({ id: adminUsers.id, status: adminUsers.status })
      .from(adminUsers)
      .where(and(eq(adminUsers.id, id), eq(adminUsers.role, 'INSTRUCTOR')))
      .limit(1);

    if (!existing) throw new NotFoundException('Teacher not found');

    const newStatus = existing.status === 'active' ? 'suspended' : 'active';

    const [updated] = await this.db
      .update(adminUsers)
      .set({ status: newStatus as 'active' | 'suspended' })
      .where(eq(adminUsers.id, id))
      .returning({ id: adminUsers.id, status: adminUsers.status });

    return updated;
  }

  async deleteTeacher(id: number) {
    const [existing] = await this.db
      .select({ id: adminUsers.id })
      .from(adminUsers)
      .where(and(eq(adminUsers.id, id), eq(adminUsers.role, 'INSTRUCTOR')))
      .limit(1);

    if (!existing) throw new NotFoundException('Teacher not found');

    await this.db.delete(adminUsers).where(eq(adminUsers.id, id));
    this.revalidation.revalidate([CacheTag.instructors]);
    return { success: true };
  }

  // ─── Student Management ───────────────────────────────────────────────────

  async getStudentStats() {
    const studentWhere = eq(users.role, 'STUDENT');

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalRow, activeRow, suspendedRow, newThisMonthRow, onlineNowRow] = await Promise.all([
      this.db.select({ count: sql<number>`COUNT(*)`.mapWith(Number) }).from(users).where(studentWhere),
      this.db.select({ count: sql<number>`COUNT(*)`.mapWith(Number) }).from(users).where(and(studentWhere, eq(users.status, 'active'))),
      this.db.select({ count: sql<number>`COUNT(*)`.mapWith(Number) }).from(users).where(and(studentWhere, eq(users.status, 'suspended'))),
      this.db.select({ count: sql<number>`COUNT(*)`.mapWith(Number) }).from(users).where(and(studentWhere, gte(users.createdAt, startOfMonth))),
      this.db.select({ count: sql<number>`COUNT(*)`.mapWith(Number) }).from(users).where(and(studentWhere, eq(users.status, 'active'), isNotNull(users.lastLoginAt), gte(users.lastLoginAt, new Date(Date.now() - 5 * 60 * 1000)))),
    ]);

    return {
      total:        totalRow?.count ?? 0,
      active:       activeRow?.count ?? 0,
      suspended:    suspendedRow?.count ?? 0,
      newThisMonth: newThisMonthRow?.count ?? 0,
      onlineNow:    onlineNowRow?.count ?? 0,
    };
  }

  async listStudents(params: TableQueryInput = {}) {
    const q = buildTableQuery(params, {
      searchable: [users.firstName, users.lastName, users.email, users.phone],
      sortable:   { createdAt: users.createdAt, firstName: users.firstName, email: users.email, lastLoginAt: users.lastLoginAt },
      filterable: {
        status: users.status,
        paymentStatus: studentPaymentStatusFilter,
        lastLoginFrom: (value: string) => gte(users.lastLoginAt, new Date(value)) as SQL,
        lastLoginTo: (value: string) => {
          const endOfDay = new Date(value);
          endOfDay.setUTCHours(23, 59, 59, 999);
          return lte(users.lastLoginAt, endOfDay) as SQL;
        },
      },
      dateColumn:  users.createdAt,
      defaultSort: desc(users.createdAt),
    });

    const studentWhere = eq(users.role, 'STUDENT');
    const combinedWhere = q.where ? and(studentWhere, q.where) : studentWhere;

    const [rows, [countRow]] = await Promise.all([
      this.db
        .select({
          id:            users.id,
          firstName:     users.firstName,
          lastName:      users.lastName,
          email:         users.email,
          phone:         users.phone,
          status:        users.status,
          avatar:        users.avatar,
          createdAt:     users.createdAt,
          lastLoginAt:   users.lastLoginAt,
          bio:           studentProfiles.bio,
          profession:    studentProfiles.profession,
          paymentStatus: studentPaymentStatusExpr,
          dueAmount:     studentDueAmountExpr,
        })
        .from(users)
        .leftJoin(studentProfiles, eq(studentProfiles.userId, users.id))
        .where(combinedWhere)
        .orderBy(q.orderBy)
        .limit(q.limit)
        .offset(q.offset),
      this.db
        .select({ count: sql<number>`COUNT(*)`.mapWith(Number) })
        .from(users)
        .where(combinedWhere),
    ]);

    return formatPaginatedResponse(rows, countRow?.count ?? 0, q.page, q.perPage);
  }

  async getStudent(id: number) {
    const [student] = await this.db
      .select({
        id:          users.id,
        firstName:   users.firstName,
        lastName:    users.lastName,
        email:       users.email,
        phone:       users.phone,
        status:      users.status,
        avatar:      users.avatar,
        createdAt:   users.createdAt,
        bio:         studentProfiles.bio,
        profession:  studentProfiles.profession,
        socialLinks: studentProfiles.socialLinks,
      })
      .from(users)
      .leftJoin(studentProfiles, eq(studentProfiles.userId, users.id))
      .where(and(eq(users.id, id), eq(users.role, 'STUDENT')))
      .limit(1);

    if (!student) throw new NotFoundException('Student not found');

    // Step 1: fetch enrollments + course data (no correlated subquery)
    const rawEnrollments = await this.db
      .select({
        id:              enrollments.id,
        status:          enrollments.status,
        enrolledAt:      enrollments.enrolledAt,
        completedAt:     enrollments.completedAt,
        courseId:        courses.id,
        courseTitle:     courses.title,
        courseSlug:      courses.slug,
        courseThumbnail: courses.thumbnail,
        totalLessons: sql<number>`(
          SELECT COUNT(*)::int FROM "lessons"
          INNER JOIN "course_modules" ON "lessons"."module_id" = "course_modules"."id"
          WHERE "course_modules"."course_id" = ${courses.id}
        )`.mapWith(Number),
      })
      .from(enrollments)
      .innerJoin(courses, eq(courses.id, enrollments.courseId))
      .where(eq(enrollments.userId, id))
      .orderBy(desc(enrollments.enrolledAt));

    // Step 2: count completed lessons per course for this student in one query
    const courseIds = rawEnrollments.map((e) => e.courseId);
    let completedByCourse: Record<number, number> = {};

    if (courseIds.length > 0) {
      const completedRows = await this.db
        .select({
          courseId: lessonProgress.courseId,
          count:    sql<number>`COUNT(*)`.mapWith(Number),
        })
        .from(lessonProgress)
        .where(
          and(
            eq(lessonProgress.userId, id),
            sql`${lessonProgress.courseId} = ANY(ARRAY[${sql.raw(courseIds.join(','))}]::int[])`,
            sql`${lessonProgress.completedAt} IS NOT NULL`,
          ),
        )
        .groupBy(lessonProgress.courseId);

      completedByCourse = Object.fromEntries(completedRows.map((r) => [r.courseId, r.count]));
    }

    const studentEnrollments = rawEnrollments.map((e) => ({
      ...e,
      completedLessons: completedByCourse[e.courseId] ?? 0,
    }));

    return { ...student, enrollments: studentEnrollments };
  }

  /**
   * Most-recent enrollment (recorded or live) per student, for the
   * Notifications student-filter list — picks whichever of the student's
   * recorded/live enrollments happened last, since a student can have several.
   */
  async getStudentsEnrollmentSummary(studentIds: number[]) {
    if (studentIds.length === 0) return [];

    const paymentAndLoginRows = await this.db
      .select({
        userId: users.id,
        lastLoginAt: users.lastLoginAt,
        paymentStatus: studentPaymentStatusExpr,
        dueAmount: studentDueAmountExpr,
      })
      .from(users)
      .where(inArray(users.id, studentIds));
    const paymentAndLoginByUser = new Map(paymentAndLoginRows.map((r) => [r.userId, r]));

    const [recorded, live] = await Promise.all([
      this.db
        .select({
          userId: enrollments.userId,
          courseName: courses.title,
          enrollmentStatus: enrollments.status,
          at: enrollments.enrolledAt,
        })
        .from(enrollments)
        .innerJoin(courses, eq(courses.id, enrollments.courseId))
        .where(inArray(enrollments.userId, studentIds)),
      this.db
        .select({
          userId: liveEnrollments.userId,
          courseName: liveCourses.title,
          batchName: liveCourseBatches.batchName,
          enrollmentStatus: liveEnrollments.status,
          at: sql<Date>`COALESCE(${liveEnrollments.paidAt}, ${liveEnrollments.createdAt})`,
        })
        .from(liveEnrollments)
        .innerJoin(liveCourses, eq(liveCourses.id, liveEnrollments.liveCourseId))
        .leftJoin(liveCourseBatches, eq(liveCourseBatches.id, liveEnrollments.batchId))
        .where(
          and(
            inArray(liveEnrollments.userId, studentIds),
            sql`${liveEnrollments.userId} IS NOT NULL`,
          ),
        ),
    ]);

    type Row = {
      userId: number;
      courseType: 'live' | 'recorded';
      courseName: string;
      batchName: string | null;
      enrollmentStatus: string;
      at: Date | null;
    };

    const latestByUser = new Map<number, Row>();
    const consider = (row: Row) => {
      const existing = latestByUser.get(row.userId);
      const rowTime = row.at ? new Date(row.at).getTime() : 0;
      const existingTime = existing?.at ? new Date(existing.at).getTime() : -1;
      if (!existing || rowTime > existingTime) latestByUser.set(row.userId, row);
    };

    for (const r of recorded) {
      if (r.userId == null) continue;
      consider({ userId: r.userId, courseType: 'recorded', courseName: r.courseName, batchName: null, enrollmentStatus: r.enrollmentStatus, at: r.at });
    }
    for (const r of live) {
      if (r.userId == null) continue;
      consider({ userId: r.userId, courseType: 'live', courseName: r.courseName, batchName: r.batchName, enrollmentStatus: r.enrollmentStatus, at: r.at });
    }

    return Array.from(latestByUser.values()).map(({ at: _at, ...rest }) => {
      const paymentAndLogin = paymentAndLoginByUser.get(rest.userId);
      return {
        ...rest,
        lastLoginAt: paymentAndLogin?.lastLoginAt?.toISOString() ?? null,
        paymentStatus: paymentAndLogin?.paymentStatus ?? null,
        dueAmount: paymentAndLogin?.dueAmount ?? 0,
      };
    });
  }

  async updateStudent(id: number, dto: { firstName?: string; lastName?: string; email?: string; phone?: string }) {
    const [existing] = await this.db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.id, id), eq(users.role, 'STUDENT')))
      .limit(1);

    if (!existing) throw new NotFoundException('Student not found');

    const [updated] = await this.db
      .update(users)
      .set({ ...dto, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning({
        id:        users.id,
        firstName: users.firstName,
        lastName:  users.lastName,
        email:     users.email,
        phone:     users.phone,
        status:    users.status,
        avatar:    users.avatar,
      });

    return updated;
  }

  async toggleStudentStatus(id: number) {
    const [existing] = await this.db
      .select({ id: users.id, status: users.status })
      .from(users)
      .where(and(eq(users.id, id), eq(users.role, 'STUDENT')))
      .limit(1);

    if (!existing) throw new NotFoundException('Student not found');

    const newStatus = existing.status === 'active' ? 'suspended' : 'active';

    const [updated] = await this.db
      .update(users)
      .set({ status: newStatus as 'active' | 'suspended' })
      .where(eq(users.id, id))
      .returning({ id: users.id, status: users.status });

    return updated;
  }

  async deleteStudent(id: number) {
    const [existing] = await this.db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.id, id), eq(users.role, 'STUDENT')))
      .limit(1);

    if (!existing) throw new NotFoundException('Student not found');

    await this.db.delete(users).where(eq(users.id, id));
    return { success: true };
  }

  // ─── Guest Management ────────────────────────────────────────────────────

  async getGuestStats() {
    const guestWhere = eq(users.role, 'GUEST');

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setUTCHours(0, 0, 0, 0);

    const [totalRow, activeRow, suspendedRow, newThisMonthRow, newThisWeekRow] = await Promise.all([
      this.db.select({ count: sql<number>`COUNT(*)`.mapWith(Number) }).from(users).where(guestWhere),
      this.db.select({ count: sql<number>`COUNT(*)`.mapWith(Number) }).from(users).where(and(guestWhere, eq(users.status, 'active'))),
      this.db.select({ count: sql<number>`COUNT(*)`.mapWith(Number) }).from(users).where(and(guestWhere, eq(users.status, 'suspended'))),
      this.db.select({ count: sql<number>`COUNT(*)`.mapWith(Number) }).from(users).where(and(guestWhere, gte(users.createdAt, startOfMonth))),
      this.db.select({ count: sql<number>`COUNT(*)`.mapWith(Number) }).from(users).where(and(guestWhere, gte(users.createdAt, startOfWeek))),
    ]);

    return {
      total:        totalRow?.count ?? 0,
      active:       activeRow?.count ?? 0,
      suspended:    suspendedRow?.count ?? 0,
      newThisMonth: newThisMonthRow?.count ?? 0,
      newThisWeek:  newThisWeekRow?.count ?? 0,
    };
  }

  async listGuests(params: TableQueryInput = {}) {
    const q = buildTableQuery(params, {
      searchable: [users.firstName, users.lastName, users.email, users.phone],
      sortable:   { createdAt: users.createdAt, firstName: users.firstName, email: users.email, lastLoginAt: users.lastLoginAt },
      filterable: {
        status: users.status,
        lastLoginFrom: (value: string) => gte(users.lastLoginAt, new Date(value)) as SQL,
        lastLoginTo: (value: string) => {
          const endOfDay = new Date(value);
          endOfDay.setUTCHours(23, 59, 59, 999);
          return lte(users.lastLoginAt, endOfDay) as SQL;
        },
      },
      dateColumn:  users.createdAt,
      defaultSort: desc(users.createdAt),
    });

    const guestWhere = eq(users.role, 'GUEST');
    const combinedWhere = q.where ? and(guestWhere, q.where) : guestWhere;

    const [rows, [countRow]] = await Promise.all([
      this.db
        .select({
          id:          users.id,
          firstName:   users.firstName,
          lastName:    users.lastName,
          email:       users.email,
          phone:       users.phone,
          status:      users.status,
          avatar:      users.avatar,
          createdAt:   users.createdAt,
          lastLoginAt: users.lastLoginAt,
        })
        .from(users)
        .where(combinedWhere)
        .orderBy(q.orderBy)
        .limit(q.limit)
        .offset(q.offset),
      this.db
        .select({ count: sql<number>`COUNT(*)`.mapWith(Number) })
        .from(users)
        .where(combinedWhere),
    ]);

    return formatPaginatedResponse(rows, countRow?.count ?? 0, q.page, q.perPage);
  }

  /** Admin — paginated course interest list, joinable across users + courses. */
  async listInterests(opts: {
    search?: string;
    courseId?: number;
    liveCourseId?: number;
    page?: number;
    limit?: number;
  }) {
    const page  = opts.page  && opts.page  > 0 ? opts.page  : 1;
    const limit = opts.limit && opts.limit > 0 ? Math.min(opts.limit, 100) : 25;

    const conditions: SQL[] = [];
    if (opts.courseId) {
      conditions.push(eq(userCourseInterests.courseId, opts.courseId));
    }
    if (opts.liveCourseId) {
      conditions.push(eq(userCourseInterests.liveCourseId, opts.liveCourseId));
    }
    if (opts.search) {
      const q = `%${opts.search}%`;
      conditions.push(
        or(
          ilike(users.firstName, q),
          ilike(users.lastName,  q),
          ilike(users.email,     q),
          ilike(users.phone,     q),
        ) as SQL,
      );
    }
    const where = conditions.length ? and(...conditions) : undefined;

    const rows = await this.db
      .select({
        id:           userCourseInterests.id,
        userId:       userCourseInterests.userId,
        courseId:     userCourseInterests.courseId,
        liveCourseId: userCourseInterests.liveCourseId,
        firstSeenAt:  userCourseInterests.firstSeenAt,
        lastSeenAt:   userCourseInterests.lastSeenAt,
        visitCount:   userCourseInterests.visitCount,
        userName:     sql<string>`concat(${users.firstName}, ' ', ${users.lastName})`,
        userEmail:    users.email,
        userPhone:    users.phone,
        courseTitle:  sql<string>`coalesce(${courses.title}, ${liveCourses.title})`,
        courseSlug:   sql<string>`coalesce(${courses.slug}, ${liveCourses.slug})`,
        courseType:   sql<'recorded' | 'live'>`case when ${userCourseInterests.courseId} is not null then 'recorded' else 'live' end`,
      })
      .from(userCourseInterests)
      .innerJoin(users,      eq(userCourseInterests.userId,        users.id))
      .leftJoin(courses,     eq(userCourseInterests.courseId,      courses.id))
      .leftJoin(liveCourses, eq(userCourseInterests.liveCourseId,  liveCourses.id))
      .where(where)
      .orderBy(desc(userCourseInterests.lastSeenAt))
      .limit(limit)
      .offset((page - 1) * limit);

    const [{ count }] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(userCourseInterests)
      .innerJoin(users,      eq(userCourseInterests.userId,       users.id))
      .leftJoin(courses,     eq(userCourseInterests.courseId,     courses.id))
      .leftJoin(liveCourses, eq(userCourseInterests.liveCourseId, liveCourses.id))
      .where(where);

    return {
      data: rows,
      pagination: {
        page,
        limit,
        total: Number(count ?? 0),
        totalPages: Math.max(1, Math.ceil(Number(count ?? 0) / limit)),
      },
    };
  }
}
