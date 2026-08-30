import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { and, desc, eq, gte, ilike, inArray, isNull, lte, ne, or, sql } from 'drizzle-orm';
import type { DB } from 'src/db';
import { DB_TOKEN } from 'src/db/db.module';
import {
  courses,
  leads,
  liveCourses,
  liveEnrollments,
  orderItems,
  orders,
  payments,
  users,
} from 'src/db/schema';
import { PaystationService } from 'src/orders/paystation.service';
import { BkashService } from 'src/payments/bkash.service';
import { PaymentGatewayService } from 'src/payments/payment-gateway.service';
import { AdminNotificationsService } from 'src/notifications/admin-notifications.service';
import { SmsTemplatesService } from 'src/sms/sms-templates.service';
import { InvoiceNumberService } from 'src/common/invoice-number/invoice-number.service';
import type {
  CreateLeadDto,
  UpdateLeadDto,
  CreateInterestLeadDto,
  CreateCallbackLeadDto,
} from './dto/lead.dto';

@Injectable()
export class LeadsService {
  private readonly logger = new Logger(LeadsService.name);

  constructor(
    @Inject(DB_TOKEN) private readonly db: DB,
    private readonly paystationService: PaystationService,
    private readonly bkashService: BkashService,
    private readonly paymentGateway: PaymentGatewayService,
    private readonly adminNotifications: AdminNotificationsService,
    private readonly smsTemplates: SmsTemplatesService,
    private readonly invoiceNumbers: InvoiceNumberService,
  ) {}

  /**
   * Public — called from the guest checkout when "Complete Payment" is
   * clicked. Always succeeds (lead is captured even if the user never
   * completes payment). Returns the inserted lead row.
   */
  async create(dto: CreateLeadDto) {
    const phone = dto.phone.trim();

    // Reuse a still-pending checkout lead for the same phone + cart made
    // recently, instead of inserting a new row on every "Complete Payment"
    // click/retry — duplicate rows each independently qualify for the hourly
    // abandoned-checkout reminder, spamming the guest with repeat SMS.
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const [existing] = await this.db
      .select({ id: leads.id })
      .from(leads)
      .where(
        and(
          eq(leads.phone, phone),
          eq(leads.source, 'checkout'),
          eq(leads.status, 'pending'),
          isNull(leads.orderId),
          gte(leads.createdAt, oneHourAgo),
          sql`${leads.courseIds}::jsonb = ${JSON.stringify(dto.courseIds)}::jsonb`,
        ),
      )
      .limit(1);

    if (existing) {
      const [row] = await this.db
        .update(leads)
        .set({
          name: dto.name.trim(),
          email: dto.email.trim().toLowerCase(),
          couponCode: dto.couponCode ?? null,
          subtotal: String(dto.subtotal ?? 0),
          discountAmount: String(dto.discountAmount ?? 0),
          finalAmount: String(dto.finalAmount ?? 0),
          paymentMethod: dto.paymentMethod ?? null,
          updatedAt: new Date(),
        })
        .where(eq(leads.id, existing.id))
        .returning();
      return row;
    }

    const [row] = await this.db
      .insert(leads)
      .values({
        name: dto.name.trim(),
        email: dto.email.trim().toLowerCase(),
        phone,
        source: 'checkout',
        courseIds: dto.courseIds,
        couponCode: dto.couponCode ?? null,
        subtotal: String(dto.subtotal ?? 0),
        discountAmount: String(dto.discountAmount ?? 0),
        finalAmount: String(dto.finalAmount ?? 0),
        paymentMethod: dto.paymentMethod ?? null,
        status: 'pending',
      })
      .returning();

    await this.adminNotifications.notifyAdmins(
      'lead',
      'New checkout lead',
      `${row.name} • ${row.phone}`,
      '/admin/leads',
    );

    await this.smsTemplates.send('lead_callback_ack', row.phone, {
      name: row.name ?? 'there',
    });

    return row;
  }

  /**
   * Public — Phase 5 — global "Request a Callback" floating widget capture.
   * Collects full contact info but no course context — admin treats these
   * as warm-but-undirected leads. Inserted as `source='callback_widget'`.
   */
  async createCallbackLead(dto: CreateCallbackLeadDto) {
    const phone = dto.phone.trim();

    // Reuse a still-pending callback request from the same phone made
    // recently, instead of inserting a new row (and re-sending the ack SMS)
    // on every retry of the widget submit.
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const [existing] = await this.db
      .select({ id: leads.id })
      .from(leads)
      .where(
        and(
          eq(leads.phone, phone),
          eq(leads.source, 'callback_widget'),
          eq(leads.status, 'pending'),
          gte(leads.createdAt, oneHourAgo),
        ),
      )
      .limit(1);

    if (existing) {
      const [row] = await this.db
        .update(leads)
        .set({ name: dto.name.trim(), email: dto.email.trim().toLowerCase(), updatedAt: new Date() })
        .where(eq(leads.id, existing.id))
        .returning();
      return row;
    }

    const [row] = await this.db
      .insert(leads)
      .values({
        name: dto.name.trim(),
        email: dto.email.trim().toLowerCase(),
        phone,
        source: 'callback_widget',
        courseIds: [],
        status: 'pending',
      })
      .returning();

    await this.adminNotifications.notifyAdmins(
      'lead',
      'New callback request',
      `${row.name} • ${row.phone}`,
      '/admin/leads',
    );

    await this.smsTemplates.send('lead_callback_ack', row.phone, {
      name: row.name ?? 'there',
    });

    return row;
  }

  /**
   * Public — Phase 4 — soft capture from the course detail page sidebar.
   * Only collects phone + courseId; admin follows up to gather name/email
   * and pitch the course. Inserted as `source='interest_box'` so the admin
   * Leads list can filter these separately from checkout leads.
   */
  async createInterestLead(dto: CreateInterestLeadDto) {
    const phone = dto.phone.trim();

    // Reuse a still-pending interest capture for the same phone + course made
    // recently, instead of inserting a new row (and re-sending the ack SMS)
    // on every retry of the sidebar submit.
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const [existing] = await this.db
      .select()
      .from(leads)
      .where(
        and(
          eq(leads.phone, phone),
          eq(leads.source, 'interest_box'),
          eq(leads.status, 'pending'),
          gte(leads.createdAt, oneHourAgo),
          sql`${leads.courseIds}::jsonb = ${JSON.stringify([dto.courseId])}::jsonb`,
        ),
      )
      .limit(1);

    if (existing) return existing;

    const [row] = await this.db
      .insert(leads)
      .values({
        name: null,
        email: null,
        phone,
        source: 'interest_box',
        courseIds: [dto.courseId],
        status: 'pending',
      })
      .returning();

    await this.adminNotifications.notifyAdmins(
      'lead',
      'New course interest',
      `Phone ${row.phone} • course #${dto.courseId}`,
      '/admin/leads',
    );

    await this.smsTemplates.send('lead_callback_ack', row.phone, { name: 'there' });

    return row;
  }

  /**
   * Public — Phase 2 — initiate PayStation hosted checkout for a guest lead.
   *
   * Lifecycle:
   *   1. Resolve the courses referenced by this lead (snapshot prices)
   *   2. Create an `orders` row with userId=null (guest order)
   *   3. Insert order_items rows for each course
   *   4. Link lead.orderId to the new order
   *   5. Create a pending `payments` row with the PayStation invoice number
   *   6. Call PayStation to get the hosted-checkout URL
   *   7. Return paymentUrl — caller redirects the browser to it
   *
   * On payment success/failure, the PayStation callback hits
   * /paystation/callback which dispatches LEAD-* invoices to
   * `verifyLeadPayment()` below.
   */
  async initiatePayment(leadId: number, callbackUrl: string) {
    const [lead] = await this.db.select().from(leads).where(eq(leads.id, leadId)).limit(1);
    if (!lead) throw new NotFoundException('Lead not found');
    if (lead.status === 'complete') throw new BadRequestException('This lead is already complete');

    let order: typeof orders.$inferSelect | undefined;
    if (lead.orderId) {
      const [existingOrder] = await this.db
        .select()
        .from(orders)
        .where(eq(orders.id, lead.orderId))
        .limit(1);
      if (existingOrder?.status === 'paid') {
        throw new ConflictException('This lead has already been paid');
      }
      // Reuse the still-pending order from a previous "send payment link"
      // attempt instead of creating a new one each time — otherwise the old
      // and new order can both get paid independently, each firing its own
      // enrollment/payment SMS.
      if (existingOrder?.status === 'pending') {
        order = existingOrder;
      }
    }

    const courseIdList = Array.isArray(lead.courseIds) ? lead.courseIds : [];
    if (courseIdList.length === 0) {
      throw new BadRequestException('Lead has no courses to purchase');
    }

    const courseRows = await this.db
      .select({
        id: courses.id,
        title: courses.title,
        price: courses.price,
        discountPrice: courses.discountPrice,
      })
      .from(courses)
      .where(inArray(courses.id, courseIdList));

    if (courseRows.length === 0) {
      throw new NotFoundException('Courses referenced by lead were not found');
    }

    if (!order) {
      // 1. Create the guest order (userId = null)
      [order] = await this.db
        .insert(orders)
        .values({
          userId: null,
          totalAmount: lead.subtotal,
          discountAmount: lead.discountAmount,
          finalAmount: lead.finalAmount,
          status: 'pending',
        })
        .returning();

      // 2. Insert order_items snapshot
      await this.db.insert(orderItems).values(
        courseRows.map((c) => ({
          orderId: order!.id,
          courseId: c.id,
          price: c.discountPrice ?? c.price,
        })),
      );

      // 3. Link the lead to its newly-created order
      await this.db
        .update(leads)
        .set({ orderId: order.id, updatedAt: new Date() })
        .where(eq(leads.id, lead.id));
    }

    const amount = parseFloat(lead.finalAmount);
    const gateway = await this.paymentGateway.getActiveGateway();

    if (gateway === 'bkash') {
      const apiBase = process.env.API_URL ?? 'http://localhost:3000';
      const invoiceNumber = this.bkashService.generateLeadInvoiceNumber(lead.id);

      const result = await this.bkashService.createPayment({
        invoiceNumber,
        amount,
        callbackUrl: `${apiBase}/bkash/callback/lead`,
        payerReference: lead.phone ?? undefined,
      });

      await this.db.insert(payments).values({
        orderId: order.id,
        userId: null,
        amount: lead.finalAmount,
        method: 'bkash_pgw',
        bkashInvoiceNumber: invoiceNumber,
        bkashPaymentId: result.paymentID,
        status: 'pending',
        displayInvoiceNumber: await this.invoiceNumbers.generate(),
      });

      return {
        leadId: lead.id,
        orderId: order.id,
        paymentUrl: result.paymentUrl,
        invoiceNumber,
      };
    }

    // 4. Initiate PayStation with a LEAD- invoice so the callback can route it
    const invoiceNumber = this.paystationService.generateLeadInvoiceNumber(lead.id);

    const result = await this.paystationService.initiatePayment({
      invoiceNumber,
      amount,
      custName: lead.name || 'Customer',
      custPhone: lead.phone || '01700000000',
      custEmail: lead.email || 'noreply@skillkoro.com',
      callbackUrl,
      reference: `Lead #${lead.id}`,
      checkoutItems: courseRows.map((c) => c.title).join(', '),
    });

    // 5. Pending payment row (userId stays null until lead is converted)
    await this.db.insert(payments).values({
      orderId: order.id,
      userId: null,
      amount: lead.finalAmount,
      method: 'paystation',
      paystationInvoiceId: result.invoiceNumber,
      status: 'pending',
      displayInvoiceNumber: await this.invoiceNumbers.generate(),
    });

    return {
      leadId: lead.id,
      orderId: order.id,
      paymentUrl: result.paymentUrl,
      invoiceNumber: result.invoiceNumber,
    };
  }

  /**
   * Public — Phase 2 — called by PaystationCallbackController when a
   * LEAD- prefixed invoice comes back from the gateway.
   *
   * Same shape as OrdersService.verifyPaystationPayment, but:
   *   • does NOT create enrollments (no user exists yet)
   *   • flips lead.status to 'paid'
   *   • leaves payments.userId / orders.userId null until Phase 3 conversion
   */
  async verifyLeadPayment(invoiceNumber: string, callbackStatus: string, txId?: string) {
    const [payment] = await this.db
      .select()
      .from(payments)
      .where(eq(payments.paystationInvoiceId, invoiceNumber))
      .limit(1);
    if (!payment) throw new NotFoundException('Payment record not found');

    const [order] = await this.db
      .select()
      .from(orders)
      .where(eq(orders.id, payment.orderId))
      .limit(1);
    if (!order) throw new NotFoundException('Order not found');

    const [lead] = await this.db
      .select()
      .from(leads)
      .where(eq(leads.orderId, order.id))
      .limit(1);
    if (!lead) throw new NotFoundException('Lead not found for this order');

    if (order.status === 'paid') {
      return { alreadyPaid: true, leadId: lead.id, orderId: order.id };
    }

    if (callbackStatus !== 'Successful') {
      await this.db
        .update(payments)
        .set({ status: 'failed' })
        .where(eq(payments.id, payment.id));
      throw new BadRequestException(`Payment ${callbackStatus.toLowerCase()}`);
    }

    // Verify with PayStation API
    const verification = await this.paystationService.verifyByInvoice(invoiceNumber);
    const codeOk = String(verification.status_code) === '200';
    const statusOk = verification.status?.toLowerCase() === 'success';
    const trxOk = ['success', 'successful'].includes(
      verification.data?.trx_status?.toLowerCase() ?? '',
    );

    if (!codeOk || !statusOk || !trxOk) {
      await this.db
        .update(payments)
        .set({ status: 'failed' })
        .where(eq(payments.id, payment.id));
      throw new BadRequestException(
        `Payment verification failed — code:${verification.status_code} status:${verification.status} trx:${verification.data?.trx_status}`,
      );
    }

    const trxData = verification.data!;

    // Atomically claim the order's paid transition first, so only the first of
    // any racing/duplicate callbacks finalizes this lead. A second concurrent
    // callback that already passed the status==='paid' fast-path above gets no
    // row back here and returns without re-touching payment/lead state.
    const [claimedOrder] = await this.db
      .update(orders)
      .set({ status: 'paid', updatedAt: new Date() })
      .where(and(eq(orders.id, order.id), ne(orders.status, 'paid')))
      .returning({ id: orders.id });

    if (!claimedOrder) {
      return { alreadyPaid: true, leadId: lead.id, orderId: order.id };
    }

    // Mark payment completed + lead transitions to 'paid'.
    await this.db
      .update(payments)
      .set({
        status: 'completed',
        paystationTrxId: trxData.trx_id || txId || null,
        paystationMethod: trxData.payment_method || null,
        paidAt: new Date(),
      })
      .where(eq(payments.id, payment.id));

    // The lead stays `pending` (workflow not done) — the paid state now lives on
    // the order. We only record the payment method for display. Admin fulfils it
    // via the unified "Enroll a Student" flow, which flips the lead to complete.
    await this.db
      .update(leads)
      .set({
        paymentMethod: trxData.payment_method || lead.paymentMethod,
        updatedAt: new Date(),
      })
      .where(eq(leads.id, lead.id));

    return { paid: true, leadId: lead.id, orderId: order.id };
  }

  /**
   * bKash Tokenized Checkout verify/capture for guest leads — mirrors
   * verifyLeadPayment above but looks the payment up by `bkashPaymentId` and
   * captures via bKash's execute-payment API.
   */
  async verifyBkashLeadPayment(paymentID: string, status: string) {
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

    const [lead] = await this.db
      .select()
      .from(leads)
      .where(eq(leads.orderId, order.id))
      .limit(1);
    if (!lead) throw new NotFoundException('Lead not found for this order');

    if (order.status === 'paid') {
      return { alreadyPaid: true, leadId: lead.id, orderId: order.id };
    }

    if (status !== 'success') {
      await this.db
        .update(payments)
        .set({ status: 'failed' })
        .where(eq(payments.id, payment.id));
      throw new BadRequestException(`Payment ${status}`);
    }

    const execution = await this.bkashService.executePayment(paymentID);
    const succeeded = execution.transactionStatus?.toLowerCase() === 'completed';

    if (!succeeded) {
      await this.db
        .update(payments)
        .set({ status: 'failed', bkashPgwStatus: execution.transactionStatus })
        .where(eq(payments.id, payment.id));
      throw new BadRequestException(
        `bKash payment verification failed — status:${execution.transactionStatus}`,
      );
    }

    const [claimedOrder] = await this.db
      .update(orders)
      .set({ status: 'paid', updatedAt: new Date() })
      .where(and(eq(orders.id, order.id), ne(orders.status, 'paid')))
      .returning({ id: orders.id });

    if (!claimedOrder) {
      return { alreadyPaid: true, leadId: lead.id, orderId: order.id };
    }

    await this.db
      .update(payments)
      .set({
        status: 'completed',
        bkashPgwTrxId: execution.trxID,
        bkashPgwStatus: execution.transactionStatus,
        paidAt: new Date(),
      })
      .where(eq(payments.id, payment.id));

    await this.db
      .update(leads)
      .set({
        paymentMethod: 'bKash',
        updatedAt: new Date(),
      })
      .where(eq(leads.id, lead.id));

    return { paid: true, leadId: lead.id, orderId: order.id };
  }

  /**
   * Public — used by the PayStation callback's failure branch to build the
   * "Try again" retry link (`/checkout/[slug]`) for a guest lead whose
   * payment failed. Cart is login-gated, so the retry link must go straight
   * back to the guest-accessible checkout page instead.
   */
  async getRetryCourseSlug(leadId: number): Promise<string | null> {
    const [lead] = await this.db
      .select({ courseIds: leads.courseIds })
      .from(leads)
      .where(eq(leads.id, leadId))
      .limit(1);
    const firstCourseId = Array.isArray(lead?.courseIds) ? lead.courseIds[0] : undefined;
    if (!firstCourseId) return null;

    const [course] = await this.db
      .select({ slug: courses.slug })
      .from(courses)
      .where(eq(courses.id, firstCourseId))
      .limit(1);
    return course?.slug ?? null;
  }

  /**
   * Admin — paginated list with optional status filter + free-text search
   * across name/email/phone. Returns leads + the course rows referenced
   * by each lead's courseIds so the admin UI can show course titles
   * without N+1 calls.
   */
  async listForAdmin(opts: {
    status?: string;
    source?: string;
    search?: string;
    page?: number;
    limit?: number;
    date_from?: string;
    date_to?: string;
  }) {
    const page = opts.page && opts.page > 0 ? opts.page : 1;
    const limit = opts.limit && opts.limit > 0 ? Math.min(opts.limit, 100) : 25;

    const conditions = [] as any[];
    if (opts.status && opts.status !== 'all') {
      conditions.push(eq(leads.status, opts.status as any));
    }
    if (opts.source && opts.source !== 'all') {
      // Use explicit cast to avoid Neon HTTP prepared-statement cache rejecting
      // enum values added after the initial connection (e.g. 'failed_payment').
      conditions.push(sql`${leads.source} = ${opts.source}::lead_source`);
    }
    if (opts.search) {
      const q = `%${opts.search}%`;
      conditions.push(
        or(ilike(leads.name, q), ilike(leads.email, q), ilike(leads.phone, q)),
      );
    }
    if (opts.date_from) conditions.push(gte(leads.createdAt, new Date(opts.date_from)));
    if (opts.date_to)   conditions.push(lte(leads.createdAt, new Date(opts.date_to + 'T23:59:59')));

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const rows = await this.db
      .select()
      .from(leads)
      .where(where)
      .orderBy(desc(leads.createdAt))
      .limit(limit)
      .offset((page - 1) * limit);

    // Resolve all course titles referenced by any lead in this page
    const allCourseIds = Array.from(
      new Set(rows.flatMap((r) => (Array.isArray(r.courseIds) ? r.courseIds : []))),
    );
    const courseRows = allCourseIds.length
      ? await this.db
          .select({ id: courses.id, title: courses.title, slug: courses.slug })
          .from(courses)
          .where(inArray(courses.id, allCourseIds))
      : [];
    const courseMap = new Map(courseRows.map((c) => [c.id, c]));

    // Live-course/bundle leads have no courseIds — resolve their single
    // liveCourseId separately so the same "courses" list in the UI shows it.
    const liveCourseIds = Array.from(
      new Set(rows.map((r) => r.liveCourseId).filter((x): x is number => x != null)),
    );
    const liveCourseRows = liveCourseIds.length
      ? await this.db
          .select({ id: liveCourses.id, title: liveCourses.title })
          .from(liveCourses)
          .where(inArray(liveCourses.id, liveCourseIds))
      : [];
    const liveCourseMap = new Map(liveCourseRows.map((c) => [c.id, c]));

    // Which of these leads' linked orders are paid (drives the "Paid" badge).
    const orderIds = rows
      .map((r) => r.orderId)
      .filter((x): x is number => x != null);
    const paidOrders = orderIds.length
      ? await this.db
          .select({ id: orders.id })
          .from(orders)
          .where(and(inArray(orders.id, orderIds), eq(orders.status, 'paid')))
      : [];
    const paidSet = new Set(paidOrders.map((o) => o.id));

    // Same "paid" check for live/bundle leads — their payment lives on the
    // live_enrollments row (status='completed'), not on an orders row.
    const liveEnrollmentIds = rows
      .map((r) => r.liveEnrollmentId)
      .filter((x): x is number => x != null);
    const completedLiveEnrollments = liveEnrollmentIds.length
      ? await this.db
          .select({ id: liveEnrollments.id })
          .from(liveEnrollments)
          .where(and(inArray(liveEnrollments.id, liveEnrollmentIds), eq(liveEnrollments.status, 'completed')))
      : [];
    const livePaidSet = new Set(completedLiveEnrollments.map((e) => e.id));

    const [{ count }] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(leads)
      .where(where);

    return {
      data: rows.map((r) => ({
        ...r,
        orderPaid:
          (r.orderId != null && paidSet.has(r.orderId)) ||
          (r.liveEnrollmentId != null && livePaidSet.has(r.liveEnrollmentId)),
        courses:
          r.liveCourseId != null
            ? [liveCourseMap.get(r.liveCourseId) ?? { id: r.liveCourseId, title: `Live course #${r.liveCourseId}` }].map(
                (c) => ({ ...c, slug: '' }),
              )
            : (Array.isArray(r.courseIds) ? r.courseIds : []).map(
                (id) => courseMap.get(id) ?? { id, title: `Course #${id}`, slug: '' },
              ),
      })),
      pagination: {
        page,
        limit,
        total: Number(count ?? 0),
        totalPages: Math.max(1, Math.ceil(Number(count ?? 0) / limit)),
      },
    };
  }

  /** Admin — single lead with course titles resolved. */
  async getById(id: number) {
    const [row] = await this.db.select().from(leads).where(eq(leads.id, id)).limit(1);
    if (!row) throw new NotFoundException('Lead not found');

    const ids = Array.isArray(row.courseIds) ? row.courseIds : [];
    const courseRows = ids.length
      ? await this.db
          .select({ id: courses.id, title: courses.title, slug: courses.slug })
          .from(courses)
          .where(inArray(courses.id, ids))
      : [];
    const courseMap = new Map(courseRows.map((c) => [c.id, c]));

    let orderPaid = false;
    if (row.orderId != null) {
      const [o] = await this.db
        .select({ status: orders.status })
        .from(orders)
        .where(eq(orders.id, row.orderId))
        .limit(1);
      orderPaid = o?.status === 'paid';
    }
    if (row.liveEnrollmentId != null) {
      const [e] = await this.db
        .select({ status: liveEnrollments.status })
        .from(liveEnrollments)
        .where(eq(liveEnrollments.id, row.liveEnrollmentId))
        .limit(1);
      orderPaid = orderPaid || e?.status === 'completed';
    }

    let liveCourseTitle: string | null = null;
    if (row.liveCourseId != null) {
      const [lc] = await this.db
        .select({ title: liveCourses.title })
        .from(liveCourses)
        .where(eq(liveCourses.id, row.liveCourseId))
        .limit(1);
      liveCourseTitle = lc?.title ?? null;
    }

    return {
      ...row,
      orderPaid,
      courses:
        row.liveCourseId != null
          ? [{ id: row.liveCourseId, title: liveCourseTitle ?? `Live course #${row.liveCourseId}`, slug: '' }]
          : ids.map((cid) => courseMap.get(cid) ?? { id: cid, title: `Course #${cid}`, slug: '' }),
    };
  }

  /** Admin — update notes / status / etc. */
  async update(id: number, dto: UpdateLeadDto) {
    // Throws if missing
    await this.getById(id);

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (dto.status !== undefined) updates.status = dto.status;
    if (dto.notes !== undefined) updates.notes = dto.notes;
    if (dto.paymentMethod !== undefined) updates.paymentMethod = dto.paymentMethod;
    if (dto.convertedUserId !== undefined) updates.convertedUserId = dto.convertedUserId;
    if (dto.orderId !== undefined) updates.orderId = dto.orderId;

    const [row] = await this.db
      .update(leads)
      .set(updates)
      .where(eq(leads.id, id))
      .returning();
    return row;
  }

  /** Admin — delete a lead (rarely used; mostly admin will use status='cancelled'). */
  async delete(id: number) {
    await this.getById(id);
    await this.db.delete(leads).where(eq(leads.id, id));
    return { deleted: true };
  }

  /**
   * Silent capture — fired when a guest pauses on the checkout form with all
   * 3 fields filled but hasn't clicked "Complete Payment" yet. Never throws.
   */
  async captureAbandonedCheckout(dto: {
    name: string;
    email: string;
    phone: string;
    courseIds: number[];
    subtotal?: number;
    discountAmount?: number;
    finalAmount?: number;
  }): Promise<void> {
    try {
      const phone = dto.phone.trim();
      // This fires on every pause on the checkout form (debounced), so the
      // same guest can trigger it many times in one sitting. Reuse the recent
      // pending capture instead of inserting a new row each time — otherwise
      // every one of those rows independently qualifies for the hourly
      // abandoned-checkout reminder cron and the guest gets spammed with SMS.
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const [existing] = await this.db
        .select({ id: leads.id })
        .from(leads)
        .where(
          and(
            eq(leads.phone, phone),
            eq(leads.source, 'abandoned_checkout'),
            eq(leads.status, 'pending'),
            gte(leads.createdAt, oneHourAgo),
            sql`${leads.courseIds}::jsonb = ${JSON.stringify(dto.courseIds)}::jsonb`,
          ),
        )
        .limit(1);

      if (existing) {
        await this.db
          .update(leads)
          .set({
            name: dto.name.trim(),
            email: dto.email.trim().toLowerCase(),
            subtotal: String(dto.subtotal ?? 0),
            discountAmount: String(dto.discountAmount ?? 0),
            finalAmount: String(dto.finalAmount ?? 0),
            updatedAt: new Date(),
          })
          .where(eq(leads.id, existing.id));
        return;
      }

      await this.db.insert(leads).values({
        name: dto.name.trim(),
        email: dto.email.trim().toLowerCase(),
        phone,
        source: 'abandoned_checkout',
        courseIds: dto.courseIds,
        subtotal: String(dto.subtotal ?? 0),
        discountAmount: String(dto.discountAmount ?? 0),
        finalAmount: String(dto.finalAmount ?? 0),
        status: 'pending',
      });
      // No SMS/notification to avoid spam from every keystroke pause
    } catch (err) {
      this.logger.error('[captureAbandonedCheckout] error', err);
    }
  }

  /**
   * Silent capture — logged-in user visited the checkout page with courses but
   * left without paying. Looks up user contact info and inserts a lead.
   * Never throws.
   */
  async captureCheckoutVisit(userId: number, courseIds: number[]): Promise<void> {
    try {
      const [user] = await this.db
        .select({
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          phone: users.phone,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      if (!user) return;
      const name = [user.firstName, user.lastName].filter(Boolean).join(' ');

      // Same silent-repeat problem as captureAbandonedCheckout — a logged-in
      // user reloading/revisiting the checkout page fires this every time.
      // Reuse a recent pending capture instead of inserting a new one.
      if (user.phone) {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const [existing] = await this.db
          .select({ id: leads.id })
          .from(leads)
          .where(
            and(
              eq(leads.phone, user.phone),
              eq(leads.source, 'checkout_visit'),
              eq(leads.status, 'pending'),
              gte(leads.createdAt, oneHourAgo),
              sql`${leads.courseIds}::jsonb = ${JSON.stringify(courseIds)}::jsonb`,
            ),
          )
          .limit(1);
        if (existing) {
          await this.db.update(leads).set({ updatedAt: new Date() }).where(eq(leads.id, existing.id));
          return;
        }
      }

      await this.db.insert(leads).values({
        name,
        email: user.email ?? null,
        phone: user.phone ?? null,
        source: 'checkout_visit',
        courseIds,
        status: 'pending',
      });
    } catch (err) {
      this.logger.error('[captureCheckoutVisit] error', err);
    }
  }

  /**
   * Called silently from the PayStation callback when a regular (PS-) order
   * payment fails for a logged-in user. Creates a lead so the admin can
   * follow up. Never throws — failures are swallowed so the redirect still
   * happens.
   */
  async captureFailedOrderLead(invoiceNumber: string): Promise<void> {
    this.logger.log(`[captureFailedOrderLead] invoice=${invoiceNumber}`);
    try {
      // Find the payment row by invoice (PayStation) or paymentID (bKash) so
      // we can get the orderId.
      const [payment] = await this.db
        .select({ orderId: payments.orderId })
        .from(payments)
        .where(
          or(
            eq(payments.paystationInvoiceId, invoiceNumber),
            eq(payments.bkashPaymentId, invoiceNumber),
          ),
        )
        .limit(1);
      if (!payment) {
        this.logger.warn(`[captureFailedOrderLead] no payment row for invoice=${invoiceNumber}`);
        return;
      }

      // Load the order
      const [order] = await this.db
        .select({
          id: orders.id,
          userId: orders.userId,
          totalAmount: orders.totalAmount,
          discountAmount: orders.discountAmount,
          finalAmount: orders.finalAmount,
        })
        .from(orders)
        .where(eq(orders.id, payment.orderId))
        .limit(1);
      if (!order) {
        this.logger.warn(`[captureFailedOrderLead] order not found for orderId=${payment.orderId}`);
        return;
      }
      if (!order.userId) {
        this.logger.log(`[captureFailedOrderLead] guest order — skipping (orderId=${order.id})`);
        return;
      }

      // Get user contact info
      const [user] = await this.db
        .select({
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          phone: users.phone,
        })
        .from(users)
        .where(eq(users.id, order.userId))
        .limit(1);
      if (!user) {
        this.logger.warn(`[captureFailedOrderLead] user not found for userId=${order.userId}`);
        return;
      }

      // Get course IDs from order items
      const items = await this.db
        .select({ courseId: orderItems.courseId })
        .from(orderItems)
        .where(eq(orderItems.orderId, order.id));
      const courseIds = items.map((i) => i.courseId);

      const name = [user.firstName, user.lastName].filter(Boolean).join(' ');

      // The callback that leads here is hit more than once per attempt
      // (PayStation's server ping + the browser redirect race) — dedupe on
      // the order so a single failed attempt doesn't create two leads.
      const [existing] = await this.db
        .select({ id: leads.id })
        .from(leads)
        .where(and(eq(leads.orderId, order.id), eq(leads.source, 'failed_payment')))
        .limit(1);
      if (existing) return;

      await this.db.insert(leads).values({
        name,
        email: user.email ?? null,
        phone: user.phone ?? null,
        source: 'failed_payment',
        courseIds,
        orderId: order.id,
        subtotal: order.totalAmount,
        discountAmount: order.discountAmount,
        finalAmount: order.finalAmount,
        status: 'pending',
        notes: `Auto-captured from failed PayStation payment (invoice: ${invoiceNumber})`,
      });

      this.logger.log(`[captureFailedOrderLead] lead created for user=${order.userId} invoice=${invoiceNumber}`);

      await this.adminNotifications.notifyAdmins(
        'lead',
        'Failed payment — follow up',
        `${name} • ${user.phone ?? user.email ?? 'no contact'}`,
        '/admin/leads',
      );
    } catch (err) {
      this.logger.error(`[captureFailedOrderLead] error for invoice=${invoiceNumber}`, err);
    }
  }

  /**
   * Admin dashboard counts — total + per-status, for KPI cards.
   * Cheap one-query group-by.
   */
  async getCounts() {
    const rows = await this.db
      .select({
        status: leads.status,
        count: sql<number>`count(*)::int`,
      })
      .from(leads)
      .groupBy(leads.status);

    // Two-state model; fold any legacy rows in for display.
    const byStatus: Record<string, number> = { pending: 0, complete: 0 };
    let total = 0;
    for (const r of rows) {
      const key =
        r.status === 'pending' || r.status === 'paid' ? 'pending' : 'complete';
      byStatus[key] = (byStatus[key] ?? 0) + Number(r.count);
      total += Number(r.count);
    }

    // "Paid — awaiting fulfilment" = pending leads whose linked order (or, for
    // live/bundle leads, linked live_enrollment) is paid.
    const [orderPaidRows, livePaidRows] = await Promise.all([
      this.db
        .select({ count: sql<number>`count(*)::int` })
        .from(leads)
        .innerJoin(orders, eq(leads.orderId, orders.id))
        .where(and(eq(leads.status, 'pending'), eq(orders.status, 'paid'))),
      this.db
        .select({ count: sql<number>`count(*)::int` })
        .from(leads)
        .innerJoin(liveEnrollments, eq(leads.liveEnrollmentId, liveEnrollments.id))
        .where(and(eq(leads.status, 'pending'), eq(liveEnrollments.status, 'completed'))),
    ]);

    return {
      total,
      ...byStatus,
      paid: Number(orderPaidRows[0]?.count ?? 0) + Number(livePaidRows[0]?.count ?? 0),
    };
  }
}
