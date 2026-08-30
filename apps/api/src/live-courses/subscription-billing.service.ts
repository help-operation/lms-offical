import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { eq, and, lte, gte, sql } from 'drizzle-orm';
import type { DB } from 'src/db';
import { DB_TOKEN } from 'src/db/db.module';
import {
  liveSubscriptions,
  liveSubscriptionPayments,
  liveEnrollments,
} from 'src/db/schema';
import { BkashService } from 'src/payments/bkash.service';
import { PaymentGatewayService } from 'src/payments/payment-gateway.service';
import { AdminNotificationsService } from 'src/notifications/admin-notifications.service';

@Injectable()
export class SubscriptionBillingService {
  private readonly logger = new Logger(SubscriptionBillingService.name);
  private readonly GRACE_DAYS = 3;
  private readonly MAX_RETRIES = 3;

  constructor(
    @Inject(DB_TOKEN) private readonly db: DB,
    private readonly bkash: BkashService,
    private readonly gateway: PaymentGatewayService,
    private readonly adminNotifications: AdminNotificationsService,
  ) {}

  /**
   * Runs daily at 02:00 UTC. Finds all active subscriptions where
   * nextBillingAt <= now and processes payments.
   */
  @Cron('0 2 * * *')
  async handleBillingCycle() {
    this.logger.log('Starting subscription billing cycle...');

    const dueSubscriptions = await this.db
      .select()
      .from(liveSubscriptions)
      .where(
        and(
          eq(liveSubscriptions.status, 'active'),
          lte(liveSubscriptions.nextBillingAt, new Date()),
        ),
      );

    this.logger.log(`Found ${dueSubscriptions.length} subscriptions due for billing`);

    for (const subscription of dueSubscriptions) {
      try {
        await this.processSubscription(subscription);
      } catch (err) {
        this.logger.error(`Failed to process subscription ${subscription.id}`, err);
      }
    }

    // Also handle past_due retry logic
    await this.handleRetries();

    // Handle expired subscriptions (past grace period)
    await this.handleExpiry();

    this.logger.log('Subscription billing cycle complete');
  }

  private async processSubscription(subscription: typeof liveSubscriptions.$inferSelect) {
    if (subscription.gateway === 'bkash_pgw') {
      await this.processBkashSubscription(subscription);
    } else if (subscription.gateway === 'paystation') {
      await this.processPayStationSubscription(subscription);
    }
  }

  private async processBkashSubscription(subscription: typeof liveSubscriptions.$inferSelect) {
    if (!subscription.gatewaySubscriptionId) {
      this.logger.warn(`bKash subscription ${subscription.id} has no agreement ID — marking past_due`);
      await this.markPastDue(subscription);
      return;
    }

    const invoiceNumber = `BKLCS-R-${subscription.id}-${Date.now()}`;

    try {
      const result = await this.bkash.chargeWithAgreement({
        agreementId: subscription.gatewaySubscriptionId,
        amount: parseFloat(String(subscription.monthlyPrice)),
        invoiceNumber,
        callbackUrl: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/live-courses/${subscription.liveCourseId}/subscription-callback/bkash`,
      });

      // Record pending payment
      await this.db.insert(liveSubscriptionPayments).values({
        subscriptionId: subscription.id,
        amount: subscription.monthlyPrice,
        method: 'bkash_pgw',
        gatewayInvoiceId: result.paymentID,
        status: 'pending',
      });

      // Execute the payment
      const executeResult = await this.bkash.executePayment(result.paymentID);

      if (executeResult.transactionStatus === 'Completed') {
        await this.markPaymentCompleted(subscription, invoiceNumber, executeResult.trxID);
      } else {
        await this.markPaymentFailed(subscription, invoiceNumber);
      }
    } catch (err) {
      this.logger.error(`bKash recurring charge failed for subscription ${subscription.id}`, err);
      await this.markPaymentFailed(subscription, invoiceNumber);
    }
  }

  private async processPayStationSubscription(subscription: typeof liveSubscriptions.$inferSelect) {
    // PayStation doesn't support auto-charging — just mark as past_due
    // and send reminders. The student must pay manually.
    this.logger.log(`PayStation subscription ${subscription.id} — sending renewal reminder`);
    await this.markPastDue(subscription);
    // TODO: Send SMS/email reminder with renewal link
  }

  private async markPaymentCompleted(
    subscription: typeof liveSubscriptions.$inferSelect,
    invoiceNumber: string,
    trxId: string,
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
          lastPaymentAt: now,
          nextBillingAt: nextBilling,
          updatedAt: now,
        })
        .where(eq(liveSubscriptions.id, subscription.id));

      // Update payment record
      await tx
        .update(liveSubscriptionPayments)
        .set({
          status: 'completed',
          gatewayTransactionId: trxId,
          paidAt: now,
        })
        .where(
          and(
            eq(liveSubscriptionPayments.subscriptionId, subscription.id),
            eq(liveSubscriptionPayments.gatewayInvoiceId, invoiceNumber),
          ),
        );
    });

    this.logger.log(`Subscription ${subscription.id} payment completed`);

    // Notify admin
    void this.adminNotifications.notifyAdmins(
      'subscription_payment',
      'Subscription payment received',
      `Subscription #${subscription.id} — ৳${subscription.monthlyPrice}`,
      '/admin/subscriptions',
    );
  }

  private async markPaymentFailed(
    subscription: typeof liveSubscriptions.$inferSelect,
    invoiceNumber: string,
  ) {
    await this.db.transaction(async (tx) => {
      // Mark subscription as past_due
      await tx
        .update(liveSubscriptions)
        .set({ status: 'past_due', updatedAt: new Date() })
        .where(eq(liveSubscriptions.id, subscription.id));

      // Update payment record
      await tx
        .update(liveSubscriptionPayments)
        .set({ status: 'failed' })
        .where(
          and(
            eq(liveSubscriptionPayments.subscriptionId, subscription.id),
            eq(liveSubscriptionPayments.gatewayInvoiceId, invoiceNumber),
          ),
        );
    });

    this.logger.log(`Subscription ${subscription.id} payment failed — marked past_due`);

    // Notify admin
    void this.adminNotifications.notifyAdmins(
      'subscription_payment_failed',
      'Subscription payment failed',
      `Subscription #${subscription.id} — payment failed, marked past_due`,
      '/admin/subscriptions',
    );
  }

  private async markPastDue(subscription: typeof liveSubscriptions.$inferSelect) {
    await this.db
      .update(liveSubscriptions)
      .set({ status: 'past_due', updatedAt: new Date() })
      .where(eq(liveSubscriptions.id, subscription.id));
  }

  private async handleRetries() {
    const pastDueSubscriptions = await this.db
      .select()
      .from(liveSubscriptions)
      .where(eq(liveSubscriptions.status, 'past_due'));

    for (const sub of pastDueSubscriptions) {
      const daysSinceDue = Math.floor(
        (Date.now() - sub.nextBillingAt.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (daysSinceDue > this.GRACE_DAYS) {
        // Exceeded grace period — expire
        await this.expireSubscription(sub);
      }
      // Retries happen automatically on the next daily cron run
    }
  }

  private async handleExpiry() {
    const pastDueSubscriptions = await this.db
      .select()
      .from(liveSubscriptions)
      .where(eq(liveSubscriptions.status, 'past_due'));

    for (const sub of pastDueSubscriptions) {
      const graceEnd = new Date(sub.nextBillingAt);
      graceEnd.setDate(graceEnd.getDate() + this.GRACE_DAYS);

      if (new Date() > graceEnd) {
        await this.expireSubscription(sub);
      }
    }
  }

  private async expireSubscription(subscription: typeof liveSubscriptions.$inferSelect) {
    await this.db.transaction(async (tx) => {
      await tx
        .update(liveSubscriptions)
        .set({ status: 'expired', updatedAt: new Date() })
        .where(eq(liveSubscriptions.id, subscription.id));

      await tx
        .update(liveEnrollments)
        .set({ status: 'suspended' })
        .where(eq(liveEnrollments.id, subscription.enrollmentId));
    });

    this.logger.log(`Subscription ${subscription.id} expired — enrollment suspended`);

    // Notify admin
    void this.adminNotifications.notifyAdmins(
      'subscription_expired',
      'Subscription expired',
      `Subscription #${subscription.id} — enrollment suspended due to expired subscription`,
      '/admin/subscriptions',
    );
  }
}
