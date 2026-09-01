import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { and, desc, eq, gte, inArray, isNull, ne, sql } from 'drizzle-orm';
import type { DB } from 'src/db';
import { DB_TOKEN } from 'src/db/db.module';
import {
  cartItems,
  courseBundleItems,
  couponUsages,
  couponRecordedCourses,
  couponLiveCourses,
  coupons,
  courses,
  enrollments,
  orderItems,
  orders,
  payments,
  users,
} from 'src/db/schema';
import { PaystationService } from './paystation.service';
import { BkashService } from 'src/payments/bkash.service';
import { PaymentGatewayService } from 'src/payments/payment-gateway.service';
import { EmailTemplatesService } from 'src/email-templates/email-templates.service';
import { AdminNotificationsService } from 'src/notifications/admin-notifications.service';
import { SmsTemplatesService } from 'src/sms/sms-templates.service';
import { ActivityLogsService } from 'src/activity-logs/activity-logs.service';
import { InvoiceNumberService } from 'src/common/invoice-number/invoice-number.service';
import { computeEnrollmentExpiry } from 'src/common/utils/access-expiry.util';
import { MetaCapiService } from 'src/integrations/meta-capi/meta-capi.service';
import { RevenueEventsService } from 'src/events/revenue-events.service';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @Inject(DB_TOKEN) private readonly db: DB,
    private readonly paystationService: PaystationService,
    private readonly bkashService: BkashService,
    private readonly paymentGateway: PaymentGatewayService,
    private readonly emailTemplates: EmailTemplatesService,
    private readonly adminNotifications: AdminNotificationsService,
    private readonly smsTemplates: SmsTemplatesService,
    private readonly activityLogs: ActivityLogsService,
    private readonly invoiceNumbers: InvoiceNumberService,
    private readonly metaCapi: MetaCapiService,
    private readonly revenueEvents: RevenueEventsService,
  ) {}

  /**
   * Fires the server-side Meta Purchase event for a paid order. `eventId`
   * must match the id the frontend passes to fbq('track','Purchase',...,
   * {eventID}) for the same order (convention: `order-${orderId}`) so Meta
   * dedupes the browser Pixel and this server event instead of double-
   * counting the conversion.
   */
  private async trackPurchase(orderId: number, userId: number, amount: string) {
    const [user] = await this.db
      .select({ email: users.email, phone: users.phone })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const frontendBase = process.env.FRONTEND_URL ?? 'http://localhost:3001';
    void this.metaCapi.sendEvent({
      eventName: 'Purchase',
      eventId: `order-${orderId}`,
      eventSourceUrl: `${frontendBase}/checkout/success`,
      value: parseFloat(amount),
      currency: 'BDT',
      user: { email: user?.email, phone: user?.phone },
    });
  }

  /**
   * Notify staff + the student of a completed paid enrollment. Best-effort;
   * one per order. Sends enrollment_confirmation (+ payment_received when paid).
   */
  private async notifyEnrollment(
    userId: number,
    orderId: number,
    method: string,
    amount: string,
  ) {
    // Atomically claim the confirmation for this order. The conditional UPDATE
    // returns a row only for the first caller; any racing/duplicate payment
    // callback gets nothing back and bails out — so the SMS + admin
    // notification fire exactly once per order, even without DB transactions.
    const [claimed] = await this.db
      .update(orders)
      .set({ confirmationSmsSentAt: new Date() })
      .where(and(eq(orders.id, orderId), isNull(orders.confirmationSmsSentAt)))
      .returning({ id: orders.id });
    if (!claimed) return;

    const [u] = await this.db
      .select({ firstName: users.firstName, lastName: users.lastName, phone: users.phone })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    const name = u ? `${u.firstName} ${u.lastName}`.trim() : `User #${userId}`;

    await this.adminNotifications.notifyAdmins(
      'enrollment',
      'New enrollment',
      `${name} enrolled (${method})`,
      '/admin/enrollments',
    );

    // First course title on the order (best effort) for the student SMS.
    const [ci] = await this.db
      .select({ title: courses.title })
      .from(orderItems)
      .innerJoin(courses, eq(orderItems.courseId, courses.id))
      .where(eq(orderItems.orderId, orderId))
      .limit(1);
    const courseTitle = ci?.title ?? 'your course';

    await this.smsTemplates.send('enrollment_confirmation', u?.phone, {
      name: u?.firstName ?? 'there',
      course_title: courseTitle,
    });
    if (amount && Number(amount) > 0) {
      await this.smsTemplates.send('payment_received', u?.phone, {
        name: u?.firstName ?? 'there',
        amount: `৳${amount}`,
      });
    }
  }

  /** Promote a GUEST to STUDENT once they have any enrollment. No-op otherwise. */
  private async ensureStudentRole(userId: number) {
    await this.db
      .update(users)
      .set({ role: 'STUDENT' })
      .where(and(eq(users.id, userId), eq(users.role, 'GUEST')));
  }

  /** Expand bundle courseIds into bundle itself + constituents (Mastery bundles). */
  private async expandBundleCourseIds(courseIds: number[]): Promise<number[]> {
    if (courseIds.length === 0) return [];
    const bundleRows = await this.db
      .select({ bundleId: courseBundleItems.bundleCourseId, bundledId: courseBundleItems.bundledCourseId })
      .from(courseBundleItems)
      .where(inArray(courseBundleItems.bundleCourseId, courseIds));
    if (bundleRows.length === 0) return courseIds;
    const bundled = bundleRows.map((r) => r.bundledId);
    // Keep bundle id itself + bundled ids (deduped)
    return [...new Set([...courseIds, ...bundled])];
  }

  private async getBundleEnrollTargets(courseIds: number[]): Promise<Array<{ courseId: number; hasLifetimeAccess: boolean; accessDurationDays: number | null }>> {
    const expanded = await this.expandBundleCourseIds(courseIds);
    if (expanded.length === 0) return [];
    const rows = await this.db
      .select({ courseId: courses.id, hasLifetimeAccess: courses.hasLifetimeAccess, accessDurationDays: courses.accessDurationDays })
      .from(courses)
      .where(inArray(courses.id, expanded));
    return rows;
  }

  /**
   * Validate a coupon code and compute the discount amount.
   *
   * @param code          - Coupon code (case-insensitive)
   * @param courseIds     - Recorded-course IDs in the cart (from `courses` table)
   * @param liveCourseIds - Live-course IDs in the cart (from `live_courses` table)
   * @param userId        - Optional: when supplied, blocks reuse of a single-use coupon by the same user
   */
  async validateCoupon(
    code: string,
    courseIds: number[],
    liveCourseIds: number[] = [],
    userId?: number,
  ) {
    const [coupon] = await this.db
      .select()
      .from(coupons)
      .where(and(eq(coupons.code, code.toUpperCase()), eq(coupons.isActive, true)))
      .limit(1);

    if (!coupon) throw new NotFoundException('Invalid coupon code');

    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      throw new BadRequestException('Coupon has expired');
    }

    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
      throw new BadRequestException('Coupon usage limit reached');
    }

    // Bug fix: per-user reuse check
    if (userId) {
      const [alreadyUsed] = await this.db
        .select({ id: couponUsages.id })
        .from(couponUsages)
        .where(and(eq(couponUsages.couponId, coupon.id), eq(couponUsages.userId, userId)))
        .limit(1);
      if (alreadyUsed) throw new BadRequestException('You have already used this coupon');
    }

    // Fetch prices for all cart items from DB (never trust client-supplied amounts) — use original ids only (bundle price itself)
    const recordedRows = courseIds.length > 0
      ? await this.db
          .select({ id: courses.id, price: courses.price, discountPrice: courses.discountPrice })
          .from(courses)
          .where(inArray(courses.id, courseIds))
      : [];

    // Expand bundles for scope checks so SAVE20 for a bundled course also applies to the bundle
    const expandedCourseIds = await this.expandBundleCourseIds(courseIds);
    const expandedSet = new Set(expandedCourseIds);

    // Build a price map: courseId → effective price
    const recordedPriceMap = new Map(
      recordedRows.map((c) => [
        c.id,
        c.discountPrice ? parseFloat(c.discountPrice) : parseFloat(c.price),
      ]),
    );

    // For live courses we'd need live_courses prices — placeholder (live checkout is separate today)
    // Compute subtotal for scope-matched items
    const recordedSubtotal = [...recordedPriceMap.values()].reduce((s, p) => s + p, 0);
    // Live course subtotal would be summed similarly when live-course checkout is integrated
    const liveSubtotal = 0; // extend when live courses go through createOrder

    let applicableSubtotal: number;

    switch (coupon.scope) {
      case 'all':
        applicableSubtotal = recordedSubtotal + liveSubtotal;
        break;

      case 'all_recorded':
        applicableSubtotal = recordedSubtotal;
        if (applicableSubtotal === 0)
          throw new BadRequestException('This coupon applies to recorded courses only');
        break;

      case 'specific_recorded': {
        const allowed = await this.db
          .select({ courseId: couponRecordedCourses.courseId })
          .from(couponRecordedCourses)
          .where(eq(couponRecordedCourses.couponId, coupon.id));
        const allowedSet = new Set(allowed.map((r) => r.courseId));
        // Direct match on original ids
        let directSubtotal = [...recordedPriceMap.entries()]
          .filter(([id]) => allowedSet.has(id))
          .reduce((s, [, p]) => s + p, 0);
        if (directSubtotal > 0) {
          applicableSubtotal = directSubtotal;
        } else {
          // For Mastery bundles: if any bundled course is in allowedSet, the bundle itself is applicable
          const hasBundledMatch = [...expandedSet].some((id) => allowedSet.has(id));
          if (!hasBundledMatch)
            throw new BadRequestException('This coupon is not applicable to the selected courses');
          // Bundle price itself (recordedSubtotal) is the applicable amount
          applicableSubtotal = recordedSubtotal;
        }
        break;
      }

      case 'all_live':
        applicableSubtotal = liveSubtotal;
        if (applicableSubtotal === 0)
          throw new BadRequestException('This coupon applies to live courses only');
        break;

      case 'specific_live': {
        if (liveCourseIds.length === 0)
          throw new BadRequestException('This coupon is not applicable to the selected courses');
        const allowed = await this.db
          .select({ liveCourseId: couponLiveCourses.liveCourseId })
          .from(couponLiveCourses)
          .where(eq(couponLiveCourses.couponId, coupon.id));
        const allowedSet = new Set(allowed.map((r) => r.liveCourseId));
        const matched = liveCourseIds.filter((id) => allowedSet.has(id));
        if (matched.length === 0)
          throw new BadRequestException('This coupon is not applicable to the selected courses');
        applicableSubtotal = liveSubtotal; // full live subtotal when live checkout is integrated
        break;
      }

      default:
        applicableSubtotal = recordedSubtotal + liveSubtotal;
    }

    const discountAmount =
      coupon.type === 'percentage'
        ? (applicableSubtotal * parseFloat(coupon.value)) / 100
        : Math.min(parseFloat(coupon.value), applicableSubtotal);

    return {
      coupon,
      discountAmount:    Math.round(discountAmount * 100) / 100,
      applicableSubtotal: Math.round(applicableSubtotal * 100) / 100,
    };
  }

  async createOrder(
    userId: number,
    courseIds: number[],
    couponCode?: string,
  ) {
    if (courseIds.length === 0) throw new BadRequestException('No courses provided');

    // Fetch course prices + titles
    const courseRows = await this.db
      .select({ id: courses.id, title: courses.title, slug: courses.slug, price: courses.price, discountPrice: courses.discountPrice, status: courses.status, hasLifetimeAccess: courses.hasLifetimeAccess, accessDurationDays: courses.accessDurationDays })
      .from(courses)
      .where(sql`${courses.id} = ANY(ARRAY[${sql.join(courseIds.map(id => sql`${id}`), sql`, `)}]::int[])`);

    if (courseRows.length !== courseIds.length) {
      throw new NotFoundException('One or more courses not found');
    }

    const unpublished = courseRows.find(c => c.status !== 'published');
    if (unpublished) throw new BadRequestException('Course is not available');

    // Check not already enrolled
    for (const courseId of courseIds) {
      const [existing] = await this.db
        .select({ id: enrollments.id })
        .from(enrollments)
        .where(and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId)))
        .limit(1);
      if (existing) throw new ConflictException(`Already enrolled in course ${courseId}`);
    }

    const totalAmount = courseRows.reduce((sum, c) => {
      const effectivePrice = c.discountPrice ? parseFloat(c.discountPrice) : parseFloat(c.price);
      return sum + effectivePrice;
    }, 0);

    let couponId: number | undefined;
    let discountAmount = 0;

    if (couponCode) {
      // Pass courseIds + userId so validateCoupon can scope-check and per-user-reuse-check
      const { coupon, discountAmount: disc } = await this.validateCoupon(couponCode, courseIds, [], userId);
      couponId = coupon.id;
      discountAmount = disc;
    }

    const finalAmount = Math.max(0, totalAmount - discountAmount);
    const isFree = finalAmount === 0;

    // Reuse a still-pending order for the same user + exact cart + coupon made
    // recently, instead of inserting a new one on every retry (double-click
    // "Buy", reload, re-submit after a failed payment). Two independent
    // orders for the same cart can each get paid and each fire its own
    // enrollment/payment SMS — this collapses retries onto one order.
    let reusedOrder: typeof orders.$inferSelect | null = null;
    if (!isFree) {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const wantIds = [...courseIds].sort((a, b) => a - b);
      const candidates = await this.db
        .select()
        .from(orders)
        .where(
          and(
            eq(orders.userId, userId),
            eq(orders.status, 'pending'),
            gte(orders.createdAt, oneHourAgo),
            couponId ? eq(orders.couponId, couponId) : isNull(orders.couponId),
          ),
        );

      for (const cand of candidates) {
        const items = await this.db
          .select({ courseId: orderItems.courseId })
          .from(orderItems)
          .where(eq(orderItems.orderId, cand.id));
        const candIds = items.map((i) => i.courseId).sort((a, b) => a - b);
        if (candIds.length === wantIds.length && candIds.every((v, i) => v === wantIds[i])) {
          reusedOrder = cand;
          break;
        }
      }
    }

    let order: typeof orders.$inferSelect;
    if (reusedOrder) {
      order = reusedOrder;
    } else {
      // Create order
      [order] = await this.db
        .insert(orders)
        .values({
          userId,
          totalAmount:    String(totalAmount),
          discountAmount: String(discountAmount),
          finalAmount:    String(finalAmount),
          couponId:       couponId ?? null,
          status:         isFree ? 'paid' : 'pending',
          updatedAt:      new Date(),
        })
        .returning();

      // Create order items
      await this.db.insert(orderItems).values(
        courseRows.map((c) => ({
          orderId:  order.id,
          courseId: c.id,
          price:    c.discountPrice ?? c.price,
        })),
      );
    }

    // Track coupon usage — atomic increment guards against race conditions.
    // The UPDATE only proceeds if the usage limit has not been exceeded; if
    // another request sneaked in between our earlier check and this point and
    // exhausted the coupon, the WHERE clause returns 0 rows and we roll back.
    // Skipped when reusing an existing order — its usage was already recorded
    // the first time this order was created.
    if (couponId && !reusedOrder) {
      const [incremented] = await this.db
        .update(coupons)
        .set({ usedCount: sql`${coupons.usedCount} + 1` })
        .where(
          and(
            eq(coupons.id, couponId),
            sql`(${coupons.maxUses} IS NULL OR ${coupons.usedCount} < ${coupons.maxUses})`,
          ),
        )
        .returning({ id: coupons.id });

      if (!incremented) {
        // Concurrent request exhausted the coupon — clean up the order we just created
        await this.db.delete(orders).where(eq(orders.id, order.id));
        throw new BadRequestException('Coupon usage limit reached — please try without a coupon');
      }

      await this.db.insert(couponUsages).values({ couponId, userId, orderId: order.id });
    }

    // If free, auto-enroll and clear cart
    if (isFree) {
      await this.db.insert(payments).values({
        orderId: order.id,
        userId,
        amount: '0',
        method: 'free',
        status: 'completed',
        paidAt: new Date(),
        displayInvoiceNumber: await this.invoiceNumbers.generate(),
      });

      const bundleTargets = await this.getBundleEnrollTargets(courseIds);
      const enrollTargets = bundleTargets.length > 0
        ? bundleTargets
        : courseRows.map(c => ({ courseId: c.id, hasLifetimeAccess: c.hasLifetimeAccess, accessDurationDays: c.accessDurationDays }));
      await Promise.all(
        enrollTargets.map(t => {
          const expiresAt = computeEnrollmentExpiry(t);
          return this.db
            .insert(enrollments)
            .values({ userId, courseId: t.courseId, orderId: order.id, status: 'active', expiresAt })
            .onConflictDoNothing();
        }),
      );
      await this.ensureStudentRole(userId);
      await this.notifyEnrollment(userId, order.id, 'free', '0');
      void this.trackPurchase(order.id, userId, '0');

      await this.db.delete(cartItems).where(eq(cartItems.userId, userId));

      // Send enrollment confirmation email for each free course
      const [userInfo] = await this.db
        .select({ firstName: users.firstName, lastName: users.lastName, email: users.email })
        .from(users).where(eq(users.id, userId)).limit(1);

      if (userInfo?.email) {
        const frontendBase = process.env.FRONTEND_URL ?? 'http://localhost:3001';
        for (const courseRow of courseRows) {
          this.emailTemplates.send('enrollment_confirmation', userInfo.email, {
            student_name: `${userInfo.firstName} ${userInfo.lastName}`.trim(),
            course_title: courseRow.title,
            course_url:   `${frontendBase}/courses/${courseRow.slug}`,
          }).catch((e) => this.logger.error('Free enroll confirmation email failed', e));
        }
      }
    }

    void this.activityLogs.log({ userId, action: 'order_created', entity: 'order', entityId: order.id, meta: { finalAmount: order.finalAmount, courseIds, couponCode } });

    this.revenueEvents.emit({
      type: 'order_created',
      source: 'recorded',
      payload: {
        id: order.id,
        status: order.status,
        finalAmount: order.finalAmount,
        createdAt: order.createdAt?.toISOString?.() ?? String(order.createdAt),
        userId,
        userFirstName: '',
        userLastName: '',
        userEmail: null,
      },
    });

    return order;
  }

  async confirmBkashPayment(userId: number, orderId: number, bkashTrxId: string) {
    const [order] = await this.db
      .select()
      .from(orders)
      .where(and(eq(orders.id, orderId), eq(orders.userId, userId)))
      .limit(1);

    if (!order) throw new NotFoundException('Order not found');
    if (order.status === 'paid') throw new ConflictException('Order already paid');
    if (order.status === 'cancelled') throw new BadRequestException('Order has been cancelled');

    // Record payment
    await this.db.insert(payments).values({
      orderId,
      userId,
      amount: order.finalAmount,
      method: 'bkash',
      bkashTrxId,
      status: 'completed',
      paidAt: new Date(),
      displayInvoiceNumber: await this.invoiceNumbers.generate(),
    });

    // Mark order paid
    await this.db
      .update(orders)
      .set({ status: 'paid', updatedAt: new Date() })
      .where(eq(orders.id, orderId));

    // Enroll in all purchased courses (expand Mastery bundles)
    const items = await this.db
      .select({
        courseId: orderItems.courseId,
        hasLifetimeAccess: courses.hasLifetimeAccess,
        accessDurationDays: courses.accessDurationDays,
      })
      .from(orderItems)
      .innerJoin(courses, eq(orderItems.courseId, courses.id))
      .where(eq(orderItems.orderId, orderId));

    const expandedForBkash = await this.getBundleEnrollTargets(items.map((i) => i.courseId));
    // build lookup for expiry: if expanded came from bundle, expiry derived from bundled course itself; fallback to original items
    const toEnrollBkash = expandedForBkash.length > 0 && expandedForBkash.length !== items.length
      ? expandedForBkash
      : items;
    await Promise.all(
      toEnrollBkash.map((item) =>
        this.db
          .insert(enrollments)
          .values({ userId, courseId: (item as any).courseId, orderId, status: 'active', expiresAt: computeEnrollmentExpiry(item as any) })
          .onConflictDoNothing(),
      ),
    );
    await this.ensureStudentRole(userId);
    await this.notifyEnrollment(userId, orderId, 'bkash', order.finalAmount);
    void this.trackPurchase(orderId, userId, order.finalAmount);

    // Clear cart
    await this.db.delete(cartItems).where(eq(cartItems.userId, userId));

    void this.activityLogs.log({ userId, action: 'payment_confirmed_bkash', entity: 'order', entityId: orderId, meta: { bkashTrxId, amount: order.finalAmount } });

    void this.emitOrderPaid(order, String(order.finalAmount));

    return { paid: true, orderId };
  }

  async getMyPayments(userId: number) {
    const rows = await this.db
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
      })
      .from(payments)
      .innerJoin(orders, eq(payments.orderId, orders.id))
      .where(eq(payments.userId, userId))
      .orderBy(desc(payments.createdAt));

    // Fetch all items for these orders in ONE query, then group by order
    // (avoids a per-payment round-trip / N+1).
    const orderIds = rows.map((r) => r.orderId);
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

    return rows.map((row) => ({ ...row, items: itemsByOrder.get(row.orderId) ?? [] }));
  }

  async getMyOrders(userId: number) {
    const orderRows = await this.db
      .select({
        id: orders.id,
        status: orders.status,
        totalAmount: orders.totalAmount,
        discountAmount: orders.discountAmount,
        finalAmount: orders.finalAmount,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt));

    return orderRows;
  }

  /** Lifetime paid-order count/value for the tracking layer's hashed user-context push (never exposes raw PII). */
  async getMyOrderStats(userId: number) {
    const [row] = await this.db
      .select({
        count: sql<number>`count(*)::int`,
        totalValue: sql<string>`coalesce(sum(${orders.finalAmount}), 0)`,
      })
      .from(orders)
      .where(and(eq(orders.userId, userId), eq(orders.status, 'paid')));

    return { count: row?.count ?? 0, totalValue: parseFloat(row?.totalValue ?? '0') };
  }

  // ─── Checkout (PayStation / bKash) ─────────────────────────────────────────

  async initiatePaystationPayment(
    userId: number,
    orderId: number,
    callbackUrl: string,
  ) {
    // Load order + user info
    const [order] = await this.db
      .select()
      .from(orders)
      .where(and(eq(orders.id, orderId), eq(orders.userId, userId)))
      .limit(1);

    if (!order) throw new NotFoundException('Order not found');
    if (order.status === 'paid') throw new ConflictException('Order already paid');
    if (order.status === 'cancelled') throw new BadRequestException('Order has been cancelled');

    const [user] = await this.db
      .select({ firstName: users.firstName, lastName: users.lastName, phone: users.phone, email: users.email })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) throw new NotFoundException('User not found');

    // Get course titles for checkout_items
    const items = await this.db
      .select({ title: courses.title })
      .from(orderItems)
      .innerJoin(courses, eq(orderItems.courseId, courses.id))
      .where(eq(orderItems.orderId, orderId));

    const amount = parseFloat(order.finalAmount);
    const gateway = await this.paymentGateway.getActiveGateway();

    if (gateway === 'bkash') {
      const apiBase = process.env.API_URL ?? 'http://localhost:3000';
      const invoiceNumber = this.bkashService.generateInvoiceNumber(orderId);

      const result = await this.bkashService.createPayment({
        invoiceNumber,
        amount,
        callbackUrl: `${apiBase}/bkash/callback/order`,
        payerReference: user.phone ?? undefined,
      });

      await this.db.insert(payments).values({
        orderId,
        userId,
        amount: order.finalAmount,
        method:               'bkash_pgw',
        bkashInvoiceNumber:   invoiceNumber,
        bkashPaymentId:       result.paymentID,
        status:               'pending',
        displayInvoiceNumber: await this.invoiceNumbers.generate(),
      });

      return { paymentUrl: result.paymentUrl, invoiceNumber };
    }

    const invoiceNumber = this.paystationService.generateInvoiceNumber(orderId);

    const result = await this.paystationService.initiatePayment({
      invoiceNumber,
      amount,
      custName:      `${user.firstName} ${user.lastName}`.trim() || 'Customer',
      custPhone:     user.phone ?? '01700000000',
      custEmail:     user.email ?? 'noreply@skillkoro.com',
      callbackUrl,
      reference:     `Order #${orderId}`,
      checkoutItems: items.map(i => i.title).join(', '),
    });

    // Store a pending payment record with the PayStation invoice ID
    await this.db.insert(payments).values({
      orderId,
      userId,
      amount: order.finalAmount,
      method:                 'paystation',
      paystationInvoiceId:    result.invoiceNumber,
      status:                 'pending',
      displayInvoiceNumber:   await this.invoiceNumbers.generate(),
    });

    return { paymentUrl: result.paymentUrl, invoiceNumber: result.invoiceNumber };
  }

  async verifyPaystationPayment(
    invoiceNumber: string,
    callbackStatus: string,
    txId?: string,
  ) {
    // Find payment by invoice ID
    const [payment] = await this.db
      .select()
      .from(payments)
      .where(eq(payments.paystationInvoiceId, invoiceNumber))
      .limit(1);

    if (!payment) throw new NotFoundException('Payment record not found');

    const order = await this.db
      .select()
      .from(orders)
      .where(eq(orders.id, payment.orderId))
      .limit(1)
      .then(r => r[0]);

    if (!order) throw new NotFoundException('Order not found');
    if (order.status === 'paid') {
      return { alreadyPaid: true, orderId: order.id, firstCourseSlug: null as string | null };
    }

    // Callback status not successful → mark failed
    if (callbackStatus !== 'Successful') {
      await this.db
        .update(payments)
        .set({ status: 'failed' })
        .where(eq(payments.id, payment.id));
      throw new BadRequestException(`Payment ${callbackStatus.toLowerCase()}`);
    }

    // Verify with PayStation API
    const verification = await this.paystationService.verifyByInvoice(invoiceNumber);

    const codeOk  = String(verification.status_code) === '200';
    const statusOk = verification.status?.toLowerCase() === 'success';
    const trxOk    = ['success', 'successful'].includes(verification.data?.trx_status?.toLowerCase() ?? '');

    if (!codeOk || !statusOk || !trxOk) {
      // Atomically claim the failure transition so repeated failed callbacks
      // don't re-text the buyer — only the first one to flip the payment to
      // 'failed' gets a row back and sends the SMS.
      const [claimedFailure] = await this.db
        .update(payments)
        .set({ status: 'failed' })
        .where(and(eq(payments.id, payment.id), ne(payments.status, 'failed')))
        .returning({ id: payments.id });

      // Best-effort failure SMS to the buyer (when it's a known user).
      if (claimedFailure && order.userId) {
        const [u] = await this.db
          .select({ firstName: users.firstName, phone: users.phone })
          .from(users)
          .where(eq(users.id, order.userId))
          .limit(1);
        await this.smsTemplates.send('payment_failed', u?.phone, {
          name: u?.firstName ?? 'there',
          amount: `৳${payment.amount}`,
        });
      }

      throw new BadRequestException(
        `Payment verification failed — code:${verification.status_code} status:${verification.status} trx:${verification.data?.trx_status}`,
      );
    }

    const trxData = verification.data!;

    // Mark payment completed
    await this.db
      .update(payments)
      .set({
        status:              'completed',
        paystationTrxId:     trxData.trx_id || txId || null,
        paystationMethod:    trxData.payment_method || null,
        paidAt:              new Date(),
      })
      .where(eq(payments.id, payment.id));

    return this.finalizePaidOrder(order, payment, 'paystation');
  }

  /**
   * bKash Tokenized Checkout verify/capture — called by BkashCallbackController
   * when the customer returns from bKash's hosted page with `status=success`.
   * Mirrors verifyPaystationPayment above but looks the payment up by
   * `bkashPaymentId` and captures via bKash's execute-payment API instead of
   * PayStation's transaction-status API.
   */
  async verifyBkashPayment(paymentID: string, callbackStatus: string) {
    const [payment] = await this.db
      .select()
      .from(payments)
      .where(eq(payments.bkashPaymentId, paymentID))
      .limit(1);

    if (!payment) throw new NotFoundException('Payment record not found');

    const [order] = await this.db
      .select()
      .from(orders)
      .where(eq(orders.id, payment.orderId))
      .limit(1);

    if (!order) throw new NotFoundException('Order not found');
    if (order.status === 'paid') {
      return { alreadyPaid: true, orderId: order.id, firstCourseSlug: null as string | null };
    }

    if (callbackStatus !== 'success') {
      const [claimedFailure] = await this.db
        .update(payments)
        .set({ status: 'failed' })
        .where(and(eq(payments.id, payment.id), ne(payments.status, 'failed')))
        .returning({ id: payments.id });

      if (claimedFailure && order.userId) {
        const [u] = await this.db
          .select({ firstName: users.firstName, phone: users.phone })
          .from(users)
          .where(eq(users.id, order.userId))
          .limit(1);
        await this.smsTemplates.send('payment_failed', u?.phone, {
          name: u?.firstName ?? 'there',
          amount: `৳${payment.amount}`,
        });
      }

      throw new BadRequestException(`Payment ${callbackStatus}`);
    }

    const execution = await this.bkashService.executePayment(paymentID);
    const succeeded = execution.transactionStatus?.toLowerCase() === 'completed';

    if (!succeeded) {
      await this.db
        .update(payments)
        .set({ status: 'failed', bkashPgwStatus: execution.transactionStatus })
        .where(and(eq(payments.id, payment.id), ne(payments.status, 'failed')));
      throw new BadRequestException(
        `bKash payment verification failed — status:${execution.transactionStatus}`,
      );
    }

    await this.db
      .update(payments)
      .set({
        status:          'completed',
        bkashPgwTrxId:   execution.trxID,
        bkashPgwStatus:  execution.transactionStatus,
        paidAt:          new Date(),
      })
      .where(eq(payments.id, payment.id));

    return this.finalizePaidOrder(order, payment, 'bkash');
  }

  /**
   * Shared tail for both gateways: atomically claim the order's paid
   * transition (so only the first of any racing/duplicate callbacks proceeds),
   * enroll the buyer in the purchased courses, promote GUEST→STUDENT, notify,
   * track the Meta Purchase event, clear the cart, and send enrollment emails.
   */
  private async finalizePaidOrder(
    order: typeof orders.$inferSelect,
    payment: typeof payments.$inferSelect,
    gatewayLabel: string,
  ) {
    const [claimedOrder] = await this.db
      .update(orders)
      .set({ status: 'paid', updatedAt: new Date() })
      .where(and(eq(orders.id, order.id), ne(orders.status, 'paid')))
      .returning({ id: orders.id });

    if (!claimedOrder) {
      return { alreadyPaid: true, orderId: order.id, firstCourseSlug: null as string | null };
    }

    // Enroll in all purchased courses (only when we have a user — guest
    // orders flowing through verifyLeadPayment have userId=null and are
    // enrolled later when the admin converts the lead in Phase 3).
    const items = await this.db
      .select({
        courseId: orderItems.courseId,
        hasLifetimeAccess: courses.hasLifetimeAccess,
        accessDurationDays: courses.accessDurationDays,
      })
      .from(orderItems)
      .innerJoin(courses, eq(orderItems.courseId, courses.id))
      .where(eq(orderItems.orderId, order.id));

    if (order.userId) {
      const orderUserId = order.userId;
      const expanded = await this.getBundleEnrollTargets(items.map((i) => i.courseId));
      const toEnroll = expanded.length > 0 && expanded.length !== items.length ? expanded : items;
      await Promise.all(
        toEnroll.map((item) =>
          this.db
            .insert(enrollments)
            .values({ userId: orderUserId, courseId: (item as any).courseId, orderId: order.id, status: 'active', expiresAt: computeEnrollmentExpiry(item as any) })
            .onConflictDoNothing(),
        ),
      );
      await this.ensureStudentRole(orderUserId);
      await this.notifyEnrollment(orderUserId, order.id, gatewayLabel, payment.amount);
      void this.trackPurchase(order.id, orderUserId, payment.amount);

      // Clear cart
      await this.db.delete(cartItems).where(eq(cartItems.userId, orderUserId));
    }

    // Get course slugs to redirect to + send enrollment emails
    const courses_ = await this.db
      .select({ slug: courses.slug, title: courses.title })
      .from(orderItems)
      .innerJoin(courses, eq(orderItems.courseId, courses.id))
      .where(eq(orderItems.orderId, order.id));

    if (order.userId) {
      const [userInfo] = await this.db
        .select({ firstName: users.firstName, lastName: users.lastName, email: users.email })
        .from(users).where(eq(users.id, order.userId)).limit(1);

      if (userInfo?.email) {
        const frontendBase = process.env.FRONTEND_URL ?? 'http://localhost:3001';
        for (const c of courses_) {
          this.emailTemplates.send('enrollment_confirmation', userInfo.email, {
            student_name: `${userInfo.firstName} ${userInfo.lastName}`.trim(),
            course_title: c.title,
            course_url:   `${frontendBase}/courses/${c.slug}`,
          }).catch((e) => this.logger.error(`${gatewayLabel} enroll confirmation email failed`, e));
        }
      }
    }

    void this.emitOrderPaid(order, payment.amount);

    return {
      paid: true,
      orderId: order.id,
      firstCourseSlug: courses_[0]?.slug ?? null,
    };
  }

  private async emitOrderPaid(order: typeof orders.$inferSelect, amount: string) {
    let userFirstName = '';
    let userLastName = '';
    let userEmail: string | null = null;

    if (order.userId) {
      const [userRow] = await this.db
        .select({ firstName: users.firstName, lastName: users.lastName, email: users.email })
        .from(users)
        .where(eq(users.id, order.userId))
        .limit(1);
      userFirstName = userRow?.firstName ?? '';
      userLastName = userRow?.lastName ?? '';
      userEmail = userRow?.email ?? null;
    }

    this.revenueEvents.emit({
      type: 'order_paid',
      source: 'recorded',
      payload: {
        id: order.id,
        status: 'paid',
        finalAmount: amount,
        createdAt: order.createdAt?.toISOString?.() ?? String(order.createdAt),
        userId: order.userId,
        userFirstName,
        userLastName,
        userEmail,
      },
    });
  }

  async getOrderById(userId: number, orderId: number) {
    const [order] = await this.db
      .select()
      .from(orders)
      .where(and(eq(orders.id, orderId), eq(orders.userId, userId)))
      .limit(1);

    if (!order) throw new NotFoundException('Order not found');

    const items = await this.db
      .select({
        id: orderItems.id,
        price: orderItems.price,
        courseId: courses.id,
        courseTitle: courses.title,
        courseSlug: courses.slug,
      })
      .from(orderItems)
      .innerJoin(courses, eq(orderItems.courseId, courses.id))
      .where(eq(orderItems.orderId, orderId));

    const [payment] = await this.db
      .select()
      .from(payments)
      .where(eq(payments.orderId, orderId))
      .limit(1);

    return { ...order, items, payment: payment ?? null };
  }
}
