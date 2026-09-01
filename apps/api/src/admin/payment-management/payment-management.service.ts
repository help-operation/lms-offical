import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, gte, lte, sql, ilike, or, type SQL } from 'drizzle-orm';
import { unionAll } from 'drizzle-orm/pg-core';
import type { DB } from 'src/db';
import { DB_TOKEN } from 'src/db/db.module';
import {
  payments,
  orders,
  orderItems,
  users,
  courses,
  enrollments,
  liveEnrollments,
  liveCourses,
  livePayments,
  shopOrders,
  shopOrderItems,
} from 'src/db/schema';

export interface PaymentListQuery {
  page?: number;
  per_page?: number;
  search?: string;
  status?: string;
  method?: string;
  course_id?: number;
  date_from?: string;
  date_to?: string;
  amount_min?: number;
  amount_max?: number;
  sort_field?: string;
  sort_direction?: 'asc' | 'desc';
}

@Injectable()
export class PaymentManagementService {
  constructor(@Inject(DB_TOKEN) private readonly db: DB) {}

  // ─── KPI Stats ──────────────────────────────────────────────────────────

  async getStats() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [
      [totalRev],
      [monthRev],
      [todayRev],
      pendingCount,
      failedCount,
      refundedCount,
      [dueAmount],
      courseList,
      methodList,
    ] = await Promise.all([
      this.db.select({ total: sql<string>`COALESCE(SUM(${payments.amount}), 0)` })
        .from(payments).where(eq(payments.status, 'completed')),
      this.db.select({ total: sql<string>`COALESCE(SUM(${payments.amount}), 0)` })
        .from(payments).where(and(eq(payments.status, 'completed'), gte(payments.paidAt, startOfMonth))),
      this.db.select({ total: sql<string>`COALESCE(SUM(${payments.amount}), 0)` })
        .from(payments).where(and(eq(payments.status, 'completed'), gte(payments.paidAt, startOfDay))),
      this.db.select({ count: sql<number>`COUNT(*)`.mapWith(Number) })
        .from(payments).where(eq(payments.status, 'pending')),
      this.db.select({ count: sql<number>`COUNT(*)`.mapWith(Number) })
        .from(payments).where(eq(payments.status, 'failed')),
      this.db.select({ count: sql<number>`COUNT(*)`.mapWith(Number) })
        .from(payments).where(eq(payments.status, 'refunded')),
      this.db.select({ total: sql<string>`COALESCE(SUM(GREATEST(${orders.finalAmount} - (
        SELECT COALESCE(SUM(p2.amount), 0) FROM ${payments} p2
        WHERE p2.order_id = ${orders.id} AND p2.status = 'completed'
      ), 0)), 0)` })
        .from(orders).innerJoin(enrollments, eq(enrollments.orderId, orders.id)),
      this.db.select({
        courseId: courses.id,
        title: courses.title,
        revenue: sql<string>`COALESCE(SUM(${payments.amount}), 0)`,
        count: sql<number>`COUNT(*)`.mapWith(Number),
      }).from(payments)
        .innerJoin(orders, eq(payments.orderId, orders.id))
        .innerJoin(orderItems, eq(orderItems.orderId, orders.id))
        .innerJoin(courses, eq(courses.id, orderItems.courseId))
        .where(eq(payments.status, 'completed'))
        .groupBy(courses.id, courses.title)
        .orderBy(desc(sql`SUM(${payments.amount})`))
        .limit(10),
      this.db.select({
        method: sql<string>`COALESCE(${payments.paystationMethod}, ${payments.method}::text)`,
        total: sql<string>`COALESCE(SUM(${payments.amount}), 0)`,
        count: sql<number>`COUNT(*)`.mapWith(Number),
      }).from(payments)
        .where(eq(payments.status, 'completed'))
        .groupBy(sql`COALESCE(${payments.paystationMethod}, ${payments.method}::text)`)
        .orderBy(desc(sql`SUM(${payments.amount})`)),
    ]);

    const [tabCountRow] = await this.db.select({
      all: sql<number>`COUNT(*)`.mapWith(Number),
      completed: sql<number>`COUNT(*) FILTER (WHERE ${payments.status} = 'completed')`.mapWith(Number),
      pending: sql<number>`COUNT(*) FILTER (WHERE ${payments.status} = 'pending')`.mapWith(Number),
      failed: sql<number>`COUNT(*) FILTER (WHERE ${payments.status} = 'failed')`.mapWith(Number),
      refunded: sql<number>`COUNT(*) FILTER (WHERE ${payments.status} = 'refunded')`.mapWith(Number),
    }).from(payments);

    return {
      totalRevenue: totalRev?.[0]?.total ?? '0',
      monthRevenue: monthRev?.[0]?.total ?? '0',
      todayRevenue: todayRev?.[0]?.total ?? '0',
      pendingPayments: pendingCount?.[0]?.count ?? 0,
      failedPayments: failedCount?.[0]?.count ?? 0,
      refundedPayments: refundedCount?.[0]?.count ?? 0,
      dueAmount: dueAmount?.[0]?.total ?? '0',
      tabCounts: tabCountRow ?? { all: 0, completed: 0, pending: 0, failed: 0, refunded: 0 },
      topCourses: courseList,
      methodBreakdown: methodList,
    };
  }

  // ─── Payment List (paginated, searchable, filterable) ────────────────────

  async getPayments(params: PaymentListQuery) {
    const page = Math.max(1, params.page ?? 1);
    const perPage = Math.min(100, params.per_page ?? 20);
    const offset = (page - 1) * perPage;
    const search = params.search?.trim();
    const term = search ? `%${search}%` : '';
    const sortField = params.sort_field ?? 'createdAt';
    const sortDir = params.sort_direction ?? 'desc';

    const conditions: SQL[] = [];

    if (params.status) {
      conditions.push(eq(payments.status, params.status as any));
    }
    if (params.method) {
      conditions.push(sql`COALESCE(${payments.paystationMethod}, ${payments.method}::text) = ${params.method}`);
    }
    if (params.date_from) {
      conditions.push(gte(payments.createdAt, new Date(params.date_from)));
    }
    if (params.date_to) {
      conditions.push(lte(payments.createdAt, new Date(params.date_to + 'T23:59:59')));
    }
    if (params.amount_min != null) {
      conditions.push(gte(payments.amount, String(params.amount_min)));
    }
    if (params.amount_max != null) {
      conditions.push(lte(payments.amount, String(params.amount_max)));
    }
    if (params.course_id) {
      conditions.push(sql`EXISTS (
        SELECT 1 FROM ${orderItems} oi WHERE oi.order_id = ${payments.orderId} AND oi.course_id = ${params.course_id}
      )`);
    }
    if (search) {
      conditions.push(or(
        ilike(users.firstName, term),
        ilike(users.lastName, term),
        ilike(users.email, term),
        ilike(users.phone, term),
        ilike(payments.displayInvoiceNumber, term),
        ilike(payments.paystationTrxId, term),
        ilike(payments.bkashTrxId, term),
        ilike(payments.payerPhone, term),
        sql`EXISTS (SELECT 1 FROM ${orderItems} oi JOIN ${courses} c ON c.id = oi.course_id WHERE oi.order_id = ${payments.orderId} AND c.title ILIKE ${term})`,
      ) as SQL);
    }

    const where = conditions.length ? and(...conditions) : undefined;

    const orderCol = sortField === 'amount' ? payments.amount
      : sortField === 'status' ? payments.status
      : payments.createdAt;

    const [[{ total }], rows] = await Promise.all([
      this.db.select({ total: sql<number>`COUNT(*)`.mapWith(Number) })
        .from(payments)
        .innerJoin(orders, eq(payments.orderId, orders.id))
        .innerJoin(users, eq(payments.userId, users.id))
        .where(where),
      this.db.select({
        id: payments.id,
        invoiceNumber: payments.displayInvoiceNumber,
        userId: users.id,
        userFirstName: users.firstName,
        userLastName: users.lastName,
        userEmail: users.email,
        userPhone: users.phone,
        courseTitles: sql<string>`(
          SELECT string_agg(c.title, ', ' ORDER BY c.title)
          FROM ${orderItems} oi JOIN ${courses} c ON c.id = oi.course_id
          WHERE oi.order_id = ${payments.orderId}
        )`,
        orderId: payments.orderId,
        amount: payments.amount,
        method: sql<string>`COALESCE(${payments.paystationMethod}, ${payments.method}::text)`,
        status: payments.status,
        paystationTrxId: payments.paystationTrxId,
        bkashTrxId: payments.bkashTrxId,
        payerPhone: payments.payerPhone,
        paidAt: payments.paidAt,
        createdAt: payments.createdAt,
        totalAmount: orders.totalAmount,
        finalAmount: orders.finalAmount,
      })
        .from(payments)
        .innerJoin(orders, eq(payments.orderId, orders.id))
        .innerJoin(users, eq(payments.userId, users.id))
        .where(where)
        .orderBy(sortDir === 'asc' ? (orderCol as any) : desc(orderCol as any))
        .limit(perPage)
        .offset(offset),
    ]);

    return {
      data: rows,
      pagination: {
        total,
        per_page: perPage,
        current_page: page,
        last_page: Math.ceil(total / perPage),
        from: offset + 1,
        to: Math.min(offset + perPage, total),
      },
    };
  }

  // ─── Payment Details ────────────────────────────────────────────────────

  async getPaymentDetails(paymentId: number) {
    const [payment] = await this.db
      .select({
        id: payments.id,
        invoiceNumber: payments.displayInvoiceNumber,
        userId: users.id,
        userFirstName: users.firstName,
        userLastName: users.lastName,
        userEmail: users.email,
        userPhone: users.phone,
        orderId: payments.orderId,
        amount: payments.amount,
        method: payments.method,
        paystationMethod: payments.paystationMethod,
        status: payments.status,
        paystationTrxId: payments.paystationTrxId,
        paystationInvoiceId: payments.paystationInvoiceId,
        bkashTrxId: payments.bkashTrxId,
        payerPhone: payments.payerPhone,
        paidAt: payments.paidAt,
        createdAt: payments.createdAt,
        totalAmount: orders.totalAmount,
        discountAmount: orders.discountAmount,
        finalAmount: orders.finalAmount,
      })
      .from(payments)
      .innerJoin(orders, eq(payments.orderId, orders.id))
      .innerJoin(users, eq(payments.userId, users.id))
      .where(eq(payments.id, paymentId))
      .limit(1);

    if (!payment) return null;

    const items = await this.db
      .select({
        courseId: orderItems.courseId,
        courseTitle: courses.title,
        courseSlug: courses.slug,
        price: orderItems.price,
      })
      .from(orderItems)
      .innerJoin(courses, eq(courses.id, orderItems.courseId))
      .where(eq(orderItems.orderId, payment.orderId));

    const allPayments = await this.db
      .select({
        id: payments.id,
        amount: payments.amount,
        method: sql<string>`COALESCE(${payments.paystationMethod}, ${payments.method}::text)`,
        status: payments.status,
        paidAt: payments.paidAt,
        displayInvoiceNumber: payments.displayInvoiceNumber,
      })
      .from(payments)
      .where(eq(payments.orderId, payment.orderId))
      .orderBy(desc(payments.createdAt));

    const totalPaid = allPayments
      .filter((p) => p.status === 'completed')
      .reduce((sum, p) => sum + parseFloat(p.amount), 0);
    const orderAmount = parseFloat(payment.finalAmount);
    const dueAmount = Math.max(0, orderAmount - totalPaid);

    return {
      ...payment,
      items,
      allPayments,
      totalPaid: String(totalPaid),
      dueAmount: String(dueAmount),
      paymentStatus: dueAmount <= 0 ? 'paid' : totalPaid > 0 ? 'partial' : 'due',
    };
  }

  // ─── Student Payment History ────────────────────────────────────────────

  async getStudentPaymentHistory(userId: number) {
    const [student] = await this.db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        phone: users.phone,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!student) return null;

    const studentEnrollments = await this.db
      .select({
        orderId: enrollments.orderId,
        courseId: courses.id,
        courseTitle: courses.title,
        enrolledAt: enrollments.enrolledAt,
        status: enrollments.status,
      })
      .from(enrollments)
      .innerJoin(courses, eq(courses.id, enrollments.courseId))
      .where(eq(enrollments.userId, userId))
      .orderBy(desc(enrollments.enrolledAt));

    const orderIds = [...new Set(studentEnrollments.map((e) => e.orderId).filter(Boolean))] as number[];

    const orderPayments = orderIds.length
      ? await this.db
          .select({
            orderId: payments.orderId,
            id: payments.id,
            amount: payments.amount,
            method: sql<string>`COALESCE(${payments.paystationMethod}, ${payments.method}::text)`,
            status: payments.status,
            paidAt: payments.paidAt,
            displayInvoiceNumber: payments.displayInvoiceNumber,
          })
          .from(payments)
          .where(sql`${payments.orderId} = ANY(${orderIds})`)
          .orderBy(desc(payments.createdAt))
      : [];

    const orderInfo = orderIds.length
      ? await this.db
          .select({
            id: orders.id,
            totalAmount: orders.totalAmount,
            finalAmount: orders.finalAmount,
            status: orders.status,
          })
          .from(orders)
          .where(sql`${orders.id} = ANY(${orderIds})`)
      : [];

    const liveEnrs = await this.db
      .select({
        id: liveEnrollments.id,
        courseTitle: liveCourses.title,
        amount: liveEnrollments.amount,
        status: liveEnrollments.status,
        paidAt: liveEnrollments.paidAt,
        createdAt: liveEnrollments.createdAt,
        displayInvoiceNumber: liveEnrollments.displayInvoiceNumber,
      })
      .from(liveEnrollments)
      .innerJoin(liveCourses, eq(liveCourses.id, liveEnrollments.liveCourseId))
      .where(eq(liveEnrollments.userId, userId))
      .orderBy(desc(liveEnrollments.createdAt));

    const totalCourseFees = orderInfo.reduce((s, o) => s + parseFloat(o.finalAmount), 0);
    const totalCoursePaid = orderPayments
      .filter((p) => p.status === 'completed')
      .reduce((s, p) => s + parseFloat(p.amount), 0);
    const totalLiveFees = liveEnrs.reduce((s, e) => s + parseFloat(e.amount), 0);
    const totalLivePaid = liveEnrs
      .filter((e) => e.status === 'completed')
      .reduce((s, e) => s + parseFloat(e.amount), 0);

    return {
      student,
      enrollments: studentEnrollments,
      orderPayments,
      orderInfo,
      liveEnrollments: liveEnrs,
      summary: {
        totalFees: String(totalCourseFees + totalLiveFees),
        totalPaid: String(totalCoursePaid + totalLivePaid),
        totalDue: String(Math.max(0, (totalCourseFees + totalLiveFees) - (totalCoursePaid + totalLivePaid))),
      },
    };
  }

  // ─── Refund ─────────────────────────────────────────────────────────────

  async refundPayment(paymentId: number) {
    const [payment] = await this.db
      .select()
      .from(payments)
      .where(eq(payments.id, paymentId))
      .limit(1);

    if (!payment) throw new Error('Payment not found');
    if (payment.status !== 'completed') throw new Error('Only completed payments can be refunded');

    await this.db
      .update(payments)
      .set({ status: 'refunded' as any })
      .where(eq(payments.id, paymentId));

    return { success: true, paymentId };
  }

  // ─── Reports ────────────────────────────────────────────────────────────

  async getDailyReport(date?: string) {
    const target = date ?? new Date().toISOString().slice(0, 10);
    const start = new Date(target);
    const end = new Date(target + 'T23:59:59');

    const rows = await this.db
      .select({
        id: payments.id,
        invoiceNumber: payments.displayInvoiceNumber,
        userFirstName: users.firstName,
        userLastName: users.lastName,
        amount: payments.amount,
        method: sql<string>`COALESCE(${payments.paystationMethod}, ${payments.method}::text)`,
        status: payments.status,
        paidAt: payments.paidAt,
      })
      .from(payments)
      .innerJoin(orders, eq(payments.orderId, orders.id))
      .innerJoin(users, eq(payments.userId, users.id))
      .where(and(gte(payments.createdAt, start), lte(payments.createdAt, end)))
      .orderBy(desc(payments.createdAt));

    const total = rows.reduce((s, r) => s + (r.status === 'completed' ? parseFloat(r.amount) : 0), 0);

    return { date: target, payments: rows, totalCollected: String(total), totalCount: rows.length };
  }

  async getMonthlyReport(year?: number, month?: number) {
    const y = year ?? new Date().getFullYear();
    const m = month ?? (new Date().getMonth() + 1);
    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 0, 23, 59, 59);

    const rows = await this.db
      .select({
        id: payments.id,
        invoiceNumber: payments.displayInvoiceNumber,
        userFirstName: users.firstName,
        userLastName: users.lastName,
        amount: payments.amount,
        method: sql<string>`COALESCE(${payments.paystationMethod}, ${payments.method}::text)`,
        status: payments.status,
        paidAt: payments.paidAt,
        courseTitles: sql<string>`(
          SELECT string_agg(c.title, ', ')
          FROM ${orderItems} oi JOIN ${courses} c ON c.id = oi.course_id
          WHERE oi.order_id = ${payments.orderId}
        )`,
      })
      .from(payments)
      .innerJoin(orders, eq(payments.orderId, orders.id))
      .innerJoin(users, eq(payments.userId, users.id))
      .where(and(gte(payments.createdAt, start), lte(payments.createdAt, end)))
      .orderBy(desc(payments.createdAt));

    const total = rows.filter((r) => r.status === 'completed').reduce((s, r) => s + parseFloat(r.amount), 0);

    return { year: y, month: m, payments: rows, totalCollected: String(total), totalCount: rows.length };
  }

  async getCourseRevenueReport() {
    return this.db
      .select({
        courseId: courses.id,
        courseTitle: courses.title,
        totalRevenue: sql<string>`COALESCE(SUM(${payments.amount}) FILTER (WHERE ${payments.status} = 'completed'), 0)`,
        totalPayments: sql<number>`COUNT(*)`.mapWith(Number),
        completedPayments: sql<number>`COUNT(*) FILTER (WHERE ${payments.status} = 'completed')`.mapWith(Number),
      })
      .from(payments)
      .innerJoin(orders, eq(payments.orderId, orders.id))
      .innerJoin(orderItems, eq(orderItems.orderId, orders.id))
      .innerJoin(courses, eq(courses.id, orderItems.courseId))
      .groupBy(courses.id, courses.title)
      .orderBy(desc(sql`COALESCE(SUM(${payments.amount}) FILTER (WHERE ${payments.status} = 'completed'), 0)`));
  }

  async getRevenueChart(period: '7d' | '30d' | '6m' | '1y') {
    let dateFormat: SQL;
    let interval: SQL;

    if (period === '7d') {
      dateFormat = sql`TO_CHAR(${payments.paidAt}, 'YYYY-MM-DD')`;
      interval = sql`NOW() - INTERVAL '7 days'`;
    } else if (period === '30d') {
      dateFormat = sql`TO_CHAR(${payments.paidAt}, 'YYYY-MM-DD')`;
      interval = sql`NOW() - INTERVAL '30 days'`;
    } else if (period === '6m') {
      dateFormat = sql`TO_CHAR(${payments.paidAt}, 'YYYY-MM')`;
      interval = sql`NOW() - INTERVAL '6 months'`;
    } else {
      dateFormat = sql`TO_CHAR(${payments.paidAt}, 'YYYY-MM')`;
      interval = sql`NOW() - INTERVAL '1 year'`;
    }

    return this.db
      .select({
        date: dateFormat.as('date'),
        revenue: sql<string>`COALESCE(SUM(${payments.amount}), 0)`,
        count: sql<number>`COUNT(*)`.mapWith(Number),
      })
      .from(payments)
      .where(and(eq(payments.status, 'completed'), gte(payments.paidAt, interval)))
      .groupBy(dateFormat)
      .orderBy(dateFormat);
  }

  // ─── Course list for filter dropdown ─────────────────────────────────────

  async getCourseList() {
    return this.db
      .select({ id: courses.id, title: courses.title })
      .from(courses)
      .orderBy(courses.title);
  }
}
