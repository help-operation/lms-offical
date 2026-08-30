import { BadRequestException, ConflictException, ForbiddenException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { eq, and, gte, lte, sql } from 'drizzle-orm';
import type { DB } from 'src/db';
import { DB_TOKEN } from 'src/db/db.module';
import {
  liveCourses,
  liveEnrollments,
  liveSubscriptions,
  liveSubscriptionPayments,
  liveCourseBatches,
} from 'src/db/schema';
import { BkashService } from 'src/payments/bkash.service';
import { PaystationService } from 'src/orders/paystation.service';
import { PaymentGatewayService } from 'src/payments/payment-gateway.service';
import { AdminNotificationsService } from 'src/notifications/admin-notifications.service';

@Injectable()
export class LiveSubscriptionsService {
  private readonly logger = new Logger(LiveSubscriptionsService.name);

  constructor(
    @Inject(DB_TOKEN) private readonly db: DB,
    private readonly bkash: BkashService,
    private readonly paystation: PaystationService,
    private readonly gateway: PaymentGatewayService,
    private readonly adminNotifications: AdminNotificationsService,
  ) {}

  // ── Create subscription + initiate first payment ────────────────────────────

  async initiateSubscription(
    liveCourseId: number,
    dto: {
      name: string;
      phone: string;
      email: string;
      callbackUrl: string;
      batchId?: number;
      userId?: number;
    },
  ) {
    const raw = await this.db
      .select()
      .from(liveCourses)
      .where(eq(liveCourses.id, liveCourseId))
      .limit(1);
    const course = raw[0];
    if (!course) throw new NotFoundException('Course not found');
    if (course.status !== 'published')
      throw new BadRequestException('This course is not available for enrollment');
    if (!course.hasSubscription)
      throw new BadRequestException('This course does not offer subscription payments');

    const monthlyPrice = parseFloat(String(course.monthlyPrice ?? 0));
    if (monthlyPrice <= 0)
      throw new BadRequestException('Subscription price not configured');

    if (!dto.userId && (await this.guestAlreadyEnrolled(liveCourseId, dto.email, dto.phone))) {
      throw new ConflictException('You are already enrolled in this course. Please log in to access it.');
    }

    // Reuse pending enrollment from last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const [existingPending] = await this.db
      .select()
      .from(liveEnrollments)
      .where(
        and(
          eq(liveEnrollments.liveCourseId, liveCourseId),
          eq(liveEnrollments.status, 'pending'),
          eq(liveEnrollments.paymentMode, 'subscription'),
          gte(liveEnrollments.createdAt, oneHourAgo),
          dto.userId
            ? eq(liveEnrollments.userId, dto.userId)
            : and(eq(liveEnrollments.phone, dto.phone), eq(liveEnrollments.email, dto.email)),
        ),
      )
      .limit(1);

    let enrollment: typeof liveEnrollments.$inferSelect;
    let subscription: typeof liveSubscriptions.$inferSelect;

    if (existingPending) {
      enrollment = existingPending;
      // Find the existing pending subscription
      const [existingSub] = await this.db
        .select()
        .from(liveSubscriptions)
        .where(
          and(
            eq(liveSubscriptions.enrollmentId, existingPending.id),
            eq(liveSubscriptions.status, 'pending'),
          ),
        )
        .limit(1);
      subscription = existingSub!;
    } else {
      // Create enrollment
      const [newEnrollment] = await this.db
        .insert(liveEnrollments)
        .values({
          liveCourseId,
          batchId: dto.batchId ?? null,
          userId: dto.userId ?? null,
          name: dto.name,
          phone: dto.phone,
          email: dto.email,
          amount: String(monthlyPrice),
          status: 'pending',
          paymentMode: 'subscription',
        })
        .returning();
      enrollment = newEnrollment;

      // Create subscription
      const now = new Date();
      const nextBilling = new Date(now);
      nextBilling.setDate(nextBilling.getDate() + 30);

      const [newSub] = await this.db
        .insert(liveSubscriptions)
        .values({
          liveCourseId,
          enrollmentId: enrollment.id,
          userId: dto.userId ?? null,
          batchId: dto.batchId ?? null,
          gateway: '', // set below based on active gateway
          monthlyPrice: String(monthlyPrice),
          status: 'pending',
          currentPeriodStart: now,
          nextBillingAt: nextBilling,
        })
        .returning();
      subscription = newSub;

      // Increment seats
      if (dto.batchId) {
        await this.db
          .update(liveCourseBatches)
          .set({ seatsFilled: sql`COALESCE(${liveCourseBatches.seatsFilled}, 0) + 1` })
          .where(eq(liveCourseBatches.id, dto.batchId));
      }
    }

    // Determine gateway and initiate payment
    const activeGateway = await this.gateway.getActiveGateway();
    const invoiceNumber = `${activeGateway === 'bkash' ? 'BKLCS' : 'PSLCS'}-${subscription.id}-${Date.now()}`;

    // Update subscription gateway
    await this.db
      .update(liveSubscriptions)
      .set({ gateway: activeGateway })
      .where(eq(liveSubscriptions.id, subscription.id));

    if (activeGateway === 'bkash') {
      const result = await this.bkash.createAgreement({
        invoiceNumber,
        amount: monthlyPrice,
        callbackUrl: `${dto.callbackUrl}?gateway=bkash`,
        payerReference: dto.phone || dto.email,
      });
      return { paymentUrl: result.bkashURL, subscriptionId: subscription.id, gateway: 'bkash' };
    } else {
      const result = await this.paystation.initiatePayment({
        invoiceNumber,
        amount: monthlyPrice,
        custName: dto.name,
        custPhone: dto.phone,
        custEmail: dto.email,
        callbackUrl: `${dto.callbackUrl}?gateway=paystation`,
        reference: `Subscription for course ${liveCourseId}`,
      });
      return { paymentUrl: result.paymentUrl, subscriptionId: subscription.id, gateway: 'paystation' };
    }
  }

  // ── Verify bKash subscription payment (agreement callback) ──────────────────

  async verifyBkashSubscriptionPayment(paymentID: string, subscriptionId?: number) {
    const executeResult = await this.bkash.executePayment(paymentID);
    if (executeResult.transactionStatus !== 'Completed') {
      this.logger.warn(`bKash payment execution failed: ${JSON.stringify(executeResult)}`);
      throw new BadRequestException('Payment verification failed');
    }

    if (subscriptionId) {
      // Renewal — update existing subscription
      const [subscription] = await this.db
        .select()
        .from(liveSubscriptions)
        .where(eq(liveSubscriptions.id, subscriptionId))
        .limit(1);
      if (!subscription) throw new NotFoundException('Subscription not found');

      await this.activateSubscription(subscriptionId, {
        gatewayTransactionId: executeResult.trxID,
        gatewayInvoiceId: paymentID,
      });
      return { subscriptionId, status: 'active' };
    }

    // Initial setup — find the most recent pending subscription
    const [subscription] = await this.db
      .select()
      .from(liveSubscriptions)
      .where(eq(liveSubscriptions.status, 'pending'))
      .orderBy(sql`${liveSubscriptions.createdAt} DESC`)
      .limit(1);

    if (!subscription) throw new NotFoundException('Pending subscription not found');

    await this.activateSubscription(subscription.id, {
      gatewayTransactionId: executeResult.trxID,
      gatewayInvoiceId: paymentID,
    });

    return { subscriptionId: subscription.id, status: 'active' };
  }

  // ── Verify PayStation subscription payment ──────────────────────────────────

  async verifyPayStationSubscriptionPayment(invoiceNumber: string, subscriptionId?: number) {
    const trxResponse = await this.paystation.verifyByInvoice(invoiceNumber);
    if (trxResponse.status_code !== '200' || trxResponse.data?.trx_status !== 'success') {
      this.logger.warn(`PayStation verification failed: ${JSON.stringify(trxResponse)}`);
      throw new BadRequestException('Payment verification failed');
    }

    if (subscriptionId) {
      // Renewal — update existing subscription
      const [subscription] = await this.db
        .select()
        .from(liveSubscriptions)
        .where(eq(liveSubscriptions.id, subscriptionId))
        .limit(1);
      if (!subscription) throw new NotFoundException('Subscription not found');

      await this.activateSubscription(subscriptionId, {
        gatewayTransactionId: trxResponse.data?.trx_id,
        gatewayInvoiceId: invoiceNumber,
      });
      return { subscriptionId, status: 'active' };
    }

    // Initial setup — find the most recent pending subscription
    const [subscription] = await this.db
      .select()
      .from(liveSubscriptions)
      .where(eq(liveSubscriptions.status, 'pending'))
      .orderBy(sql`${liveSubscriptions.createdAt} DESC`)
      .limit(1);

    if (!subscription) throw new NotFoundException('Pending subscription not found');

    await this.activateSubscription(subscription.id, {
      gatewayTransactionId: trxResponse.data?.trx_id,
      gatewayInvoiceId: invoiceNumber,
    });

    return { subscriptionId: subscription.id, status: 'active' };
  }

  // ── Activate subscription ───────────────────────────────────────────────────

  private async activateSubscription(
    subscriptionId: number,
    paymentData: {
      gatewaySubscriptionId?: string;
      gatewayTransactionId?: string;
      gatewayInvoiceId?: string;
    },
  ) {
    const now = new Date();
    const nextBilling = new Date(now);
    nextBilling.setDate(nextBilling.getDate() + 30);

    await this.db.transaction(async (tx) => {
      // Update subscription
      await tx
        .update(liveSubscriptions)
        .set({
          status: 'active',
          gatewaySubscriptionId: paymentData.gatewaySubscriptionId ?? undefined,
          lastPaymentAt: now,
          nextBillingAt: nextBilling,
          updatedAt: now,
        })
        .where(eq(liveSubscriptions.id, subscriptionId));

      // Get subscription to find enrollment
      const [sub] = await tx
        .select()
        .from(liveSubscriptions)
        .where(eq(liveSubscriptions.id, subscriptionId))
        .limit(1);

      // Activate enrollment
      await tx
        .update(liveEnrollments)
        .set({ status: 'completed', paidAt: now })
        .where(eq(liveEnrollments.id, sub.enrollmentId));

      // Record payment
      await tx.insert(liveSubscriptionPayments).values({
        subscriptionId,
        amount: sub.monthlyPrice,
        method: sub.gateway === 'bkash' ? 'bkash_pgw' : 'paystation',
        gatewayInvoiceId: paymentData.gatewayInvoiceId,
        gatewayTransactionId: paymentData.gatewayTransactionId,
        status: 'completed',
        paidAt: now,
      });
    });

    this.logger.log(`Subscription ${subscriptionId} activated`);

    // Notify admin
    void this.adminNotifications.notifyAdmins(
      'subscription_activated',
      'New subscription activated',
      `Subscription #${subscriptionId} — first payment received`,
      '/admin/subscriptions',
    );
  }

  // ── Cancel subscription ─────────────────────────────────────────────────────

  async cancelSubscription(subscriptionId: number, userId?: number, adminUserId?: number) {
    const [subscription] = await this.db
      .select()
      .from(liveSubscriptions)
      .where(eq(liveSubscriptions.id, subscriptionId))
      .limit(1);

    if (!subscription) throw new NotFoundException('Subscription not found');
    if (subscription.status === 'cancelled' || subscription.status === 'expired') {
      throw new BadRequestException('Subscription is already cancelled or expired');
    }
    if (userId && subscription.userId !== userId) {
      throw new ForbiddenException('You can only cancel your own subscription');
    }

    // Cancel bKash agreement if applicable
    if (subscription.gateway === 'bkash_pgw' && subscription.gatewaySubscriptionId) {
      await this.bkash.cancelAgreement(subscription.gatewaySubscriptionId);
    }

    await this.db
      .update(liveSubscriptions)
      .set({
        status: 'cancelled',
        cancelledAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(liveSubscriptions.id, subscriptionId));

    this.logger.log(`Subscription ${subscriptionId} cancelled`);

    // Notify admin
    void this.adminNotifications.notifyAdmins(
      'subscription_cancelled',
      'Subscription cancelled',
      `Subscription #${subscriptionId} — cancelled by ${adminUserId ? 'admin' : 'user'}`,
      '/admin/subscriptions',
    );

    return { success: true };
  }

  // ── Pause subscription (admin) ─────────────────────────────────────────────

  async pauseSubscription(subscriptionId: number) {
    const [subscription] = await this.db
      .select()
      .from(liveSubscriptions)
      .where(eq(liveSubscriptions.id, subscriptionId))
      .limit(1);

    if (!subscription) throw new NotFoundException('Subscription not found');
    if (subscription.status !== 'active') {
      throw new BadRequestException('Only active subscriptions can be paused');
    }

    await this.db.transaction(async (tx) => {
      await tx
        .update(liveSubscriptions)
        .set({ status: 'paused', updatedAt: new Date() })
        .where(eq(liveSubscriptions.id, subscriptionId));

      await tx
        .update(liveEnrollments)
        .set({ status: 'suspended' })
        .where(eq(liveEnrollments.id, subscription.enrollmentId));
    });

    this.logger.log(`Subscription ${subscriptionId} paused`);
    return { success: true };
  }

  // ── Resume subscription (admin) ────────────────────────────────────────────

  async resumeSubscription(subscriptionId: number) {
    const [subscription] = await this.db
      .select()
      .from(liveSubscriptions)
      .where(eq(liveSubscriptions.id, subscriptionId))
      .limit(1);

    if (!subscription) throw new NotFoundException('Subscription not found');
    if (subscription.status !== 'paused') {
      throw new BadRequestException('Only paused subscriptions can be resumed');
    }

    // Recalculate next billing: now + remaining days from original period
    const now = new Date();
    const originalNextBilling = new Date(subscription.nextBillingAt);
    const originalPeriodStart = new Date(subscription.currentPeriodStart);
    const totalPeriodDays = Math.ceil((originalNextBilling.getTime() - originalPeriodStart.getTime()) / (1000 * 60 * 60 * 24));
    const elapsedDays = Math.ceil((now.getTime() - originalPeriodStart.getTime()) / (1000 * 60 * 60 * 24));
    const remainingDays = Math.max(1, totalPeriodDays - elapsedDays);
    const newNextBilling = new Date(now);
    newNextBilling.setDate(newNextBilling.getDate() + remainingDays);

    await this.db.transaction(async (tx) => {
      await tx
        .update(liveSubscriptions)
        .set({
          status: 'active',
          nextBillingAt: newNextBilling,
          currentPeriodStart: now,
          updatedAt: now,
        })
        .where(eq(liveSubscriptions.id, subscriptionId));

      await tx
        .update(liveEnrollments)
        .set({ status: 'completed' })
        .where(eq(liveEnrollments.id, subscription.enrollmentId));
    });

    this.logger.log(`Subscription ${subscriptionId} resumed`);
    return { success: true };
  }

  // ── Renew subscription (initiate payment) ──────────────────────────────────

  async renewSubscription(subscriptionId: number, apiBase: string, courseId: number) {
    const [subscription] = await this.db
      .select()
      .from(liveSubscriptions)
      .where(eq(liveSubscriptions.id, subscriptionId))
      .limit(1);

    if (!subscription) throw new NotFoundException('Subscription not found');
    if (subscription.status === 'cancelled')
      throw new BadRequestException('Cannot renew a cancelled subscription');

    const monthlyPrice = parseFloat(String(subscription.monthlyPrice));
    if (monthlyPrice <= 0)
      throw new BadRequestException('Invalid subscription price');

    // Use the currently active gateway (not the stored one)
    const activeGateway = await this.gateway.getActiveGateway();
    const invoiceNumber = `${activeGateway === 'bkash' ? 'BKLCS' : 'PSLCS'}-R-${subscription.id}-${Date.now()}`;

    if (activeGateway === 'bkash') {
      const callbackUrl = `${apiBase}/live-subscriptions/${courseId}/subscription-callback/bkash?sub=${subscriptionId}`;
      const result = await this.bkash.createPayment({
        invoiceNumber,
        amount: monthlyPrice,
        callbackUrl,
        payerReference: String(subscription.userId),
      });
      await this.db
        .update(liveSubscriptions)
        .set({ gateway: 'bkash_pgw', updatedAt: new Date() })
        .where(eq(liveSubscriptions.id, subscriptionId));
      return { paymentUrl: result.paymentUrl, gateway: 'bkash_pgw' };
    }

    // PayStation
    const callbackUrl = `${apiBase}/live-subscriptions/${courseId}/subscription-callback/paystation?sub=${subscriptionId}`;
    const result = await this.paystation.initiatePayment({
      invoiceNumber,
      amount: monthlyPrice,
      custName: 'Student',
      custPhone: '',
      custEmail: '',
      callbackUrl,
      reference: `Subscription renewal #${subscription.id}`,
    });
    // Update stored gateway to match active
    await this.db
      .update(liveSubscriptions)
      .set({ gateway: 'paystation', updatedAt: new Date() })
      .where(eq(liveSubscriptions.id, subscriptionId));
    return { paymentUrl: result.paymentUrl, gateway: 'paystation' };
  }

  // ── Get subscription status ─────────────────────────────────────────────────

  async getSubscriptionStatus(enrollmentId: number) {
    const [subscription] = await this.db
      .select()
      .from(liveSubscriptions)
      .where(eq(liveSubscriptions.enrollmentId, enrollmentId))
      .orderBy(sql`${liveSubscriptions.createdAt} DESC`)
      .limit(1);

    if (!subscription) return null;

    const now = new Date();
    const canCancel = subscription.status === 'active';
    const canRenew = subscription.status === 'past_due' || subscription.status === 'expired';

    return {
      id: subscription.id,
      status: subscription.status,
      monthlyPrice: subscription.monthlyPrice,
      nextBillingDate: subscription.nextBillingAt,
      gateway: subscription.gateway,
      lastPaymentAt: subscription.lastPaymentAt,
      cancelledAt: subscription.cancelledAt,
      canCancel,
      canRenew,
    };
  }

  /** Resolve subscription by courseId + userId (enrollment lookup first). */
  async getSubscriptionStatusByCourse(courseId: number, userId?: number) {
    if (!userId) return null;
    const [enrollment] = await this.db
      .select({ id: liveEnrollments.id })
      .from(liveEnrollments)
      .where(
        and(
          eq(liveEnrollments.liveCourseId, courseId),
          eq(liveEnrollments.userId, userId),
        ),
      )
      .limit(1);
    if (!enrollment) return null;
    return this.getSubscriptionStatus(enrollment.id);
  }

  // ── Get subscription payment history ────────────────────────────────────────

  async getPaymentHistory(subscriptionId: number) {
    return this.db
      .select()
      .from(liveSubscriptionPayments)
      .where(eq(liveSubscriptionPayments.subscriptionId, subscriptionId))
      .orderBy(sql`${liveSubscriptionPayments.createdAt} DESC`);
  }

  // ── Admin: List all subscriptions ──────────────────────────────────────────

  async listAllSubscriptions(opts: { status?: string; page: number; limit: number }) {
    const { status, page, limit } = opts;
    const offset = (page - 1) * limit;

    const whereClause = status
      ? sql`${liveSubscriptions.status} = ${status}`
      : undefined;

    const [countResult] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(liveSubscriptions)
      .where(whereClause);

    const total = countResult?.count ?? 0;

    const subscriptions = await this.db
      .select({
        id: liveSubscriptions.id,
        enrollmentId: liveSubscriptions.enrollmentId,
        status: liveSubscriptions.status,
        amount: liveSubscriptions.monthlyPrice,
        nextBillingAt: liveSubscriptions.nextBillingAt,
        lastPaymentAt: liveSubscriptions.lastPaymentAt,
        cancelledAt: liveSubscriptions.cancelledAt,
        createdAt: liveSubscriptions.createdAt,
        // Joined fields
        courseTitle: liveCourses.title,
        courseSlug: liveCourses.slug,
        userName: liveEnrollments.name,
        userPhone: liveEnrollments.phone,
        userEmail: liveEnrollments.email,
      })
      .from(liveSubscriptions)
      .innerJoin(liveEnrollments, eq(liveSubscriptions.enrollmentId, liveEnrollments.id))
      .innerJoin(liveCourses, eq(liveEnrollments.liveCourseId, liveCourses.id))
      .where(whereClause)
      .orderBy(sql`${liveSubscriptions.createdAt} DESC`)
      .limit(limit)
      .offset(offset);

    return {
      data: subscriptions,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ── Admin: Get subscription details ────────────────────────────────────────

  async getSubscriptionDetails(subscriptionId: number) {
    const [subscription] = await this.db
      .select({
        id: liveSubscriptions.id,
        enrollmentId: liveSubscriptions.enrollmentId,
        status: liveSubscriptions.status,
        amount: liveSubscriptions.monthlyPrice,
        gateway: liveSubscriptions.gateway,
        gatewaySubscriptionId: liveSubscriptions.gatewaySubscriptionId,
        nextBillingAt: liveSubscriptions.nextBillingAt,
        lastPaymentAt: liveSubscriptions.lastPaymentAt,
        cancelledAt: liveSubscriptions.cancelledAt,
        createdAt: liveSubscriptions.createdAt,
        // Joined fields
        courseTitle: liveCourses.title,
        courseSlug: liveCourses.slug,
        courseMonthlyPrice: liveCourses.monthlyPrice,
        userName: liveEnrollments.name,
        userPhone: liveEnrollments.phone,
        userEmail: liveEnrollments.email,
        enrollmentStatus: liveEnrollments.status,
      })
      .from(liveSubscriptions)
      .innerJoin(liveEnrollments, eq(liveSubscriptions.enrollmentId, liveEnrollments.id))
      .innerJoin(liveCourses, eq(liveEnrollments.liveCourseId, liveCourses.id))
      .where(eq(liveSubscriptions.id, subscriptionId))
      .limit(1);

    if (!subscription) throw new NotFoundException('Subscription not found');

    // Get payment history
    const payments = await this.db
      .select()
      .from(liveSubscriptionPayments)
      .where(eq(liveSubscriptionPayments.subscriptionId, subscriptionId))
      .orderBy(sql`${liveSubscriptionPayments.createdAt} DESC`);

    return {
      ...subscription,
      payments,
    };
  }

  // ── Helper: check if guest already enrolled ─────────────────────────────────

  private async guestAlreadyEnrolled(liveCourseId: number, email: string, phone: string): Promise<boolean> {
    const [existing] = await this.db
      .select({ id: liveEnrollments.id })
      .from(liveEnrollments)
      .where(
        and(
          eq(liveEnrollments.liveCourseId, liveCourseId),
          eq(liveEnrollments.email, email),
          eq(liveEnrollments.phone, phone),
        ),
      )
      .limit(1);
    return !!existing;
  }
}
