import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { and, desc, eq, gte, isNull, sql } from 'drizzle-orm';
import type { DB } from 'src/db';
import { DB_TOKEN } from 'src/db/db.module';
import {
  shopOrders,
  shopOrderItems,
  shopProducts,
  shopCoupons,
  shopCouponUsages,
  shopCartItems,
} from 'src/db/schema';
import { PaystationService } from 'src/orders/paystation.service';
import { BkashService } from 'src/payments/bkash.service';
import { PaymentGatewayService } from 'src/payments/payment-gateway.service';
import { AdminNotificationsService } from 'src/notifications/admin-notifications.service';
import { SmsTemplatesService } from 'src/sms/sms-templates.service';
import { InvoiceNumberService } from 'src/common/invoice-number/invoice-number.service';

export interface CreateShopOrderDto {
  productIds: { productId: number; quantity: number }[];
  name: string;
  email: string;
  phone: string;
  address?: string;
  couponCode?: string;
  /** Authenticated user id — null for guest checkout */
  userId?: number;
  /** Guest session id — used to clear the cart after order */
  sessionId?: string;
}

@Injectable()
export class ShopOrdersService {
  private readonly logger = new Logger(ShopOrdersService.name);

  constructor(
    @Inject(DB_TOKEN) private readonly db: DB,
    private readonly paystationService: PaystationService,
    private readonly bkashService: BkashService,
    private readonly paymentGateway: PaymentGatewayService,
    private readonly adminNotifications: AdminNotificationsService,
    private readonly smsTemplates: SmsTemplatesService,
    private readonly invoiceNumbers: InvoiceNumberService,
  ) {}

  async validateCoupon(code: string, subtotal: number, userId?: number, phone?: string) {
    const [coupon] = await this.db
      .select()
      .from(shopCoupons)
      .where(and(eq(shopCoupons.code, code.toUpperCase()), eq(shopCoupons.isActive, true)))
      .limit(1);

    if (!coupon) throw new NotFoundException('Invalid coupon code');
    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      throw new BadRequestException('Coupon has expired');
    }
    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
      throw new BadRequestException('Coupon usage limit reached');
    }

    if (userId || phone) {
      const [existingUsage] = await this.db
        .select({ id: shopCouponUsages.id })
        .from(shopCouponUsages)
        .where(
          and(
            eq(shopCouponUsages.couponId, coupon.id),
            userId ? eq(shopCouponUsages.userId, userId) : eq(shopCouponUsages.userId, -1),
          ),
        )
        .limit(1);
      if (existingUsage) throw new BadRequestException('You have already used this coupon');
    }

    const discountAmount =
      coupon.type === 'percentage'
        ? (subtotal * parseFloat(coupon.value)) / 100
        : Math.min(parseFloat(coupon.value), subtotal);

    return {
      coupon,
      discountAmount: Math.round(discountAmount * 100) / 100,
    };
  }

  async createOrder(dto: CreateShopOrderDto) {
    if (!dto.productIds.length) throw new BadRequestException('No products provided');

    const ids = dto.productIds.map((p) => p.productId);
    const productRows = await this.db
      .select()
      .from(shopProducts)
      .where(sql`${shopProducts.id} = ANY(ARRAY[${sql.join(ids.map((id) => sql`${id}`), sql`, `)}]::int[])`);

    if (productRows.length !== ids.length) throw new NotFoundException('One or more products not found');

    const unavailable = productRows.find((p) => !p.isActive);
    if (unavailable) throw new BadRequestException(`Product "${unavailable.title}" is not available`);

    // Check stock
    for (const item of dto.productIds) {
      const product = productRows.find((p) => p.id === item.productId)!;
      if (product.stock !== null && product.stock < item.quantity) {
        throw new BadRequestException(`Insufficient stock for "${product.title}"`);
      }
    }

    const totalAmount = dto.productIds.reduce((sum, item) => {
      const product = productRows.find((p) => p.id === item.productId)!;
      const price = product.discountPrice
        ? parseFloat(product.discountPrice)
        : parseFloat(product.price);
      return sum + price * item.quantity;
    }, 0);

    let couponId: number | undefined;
    let discountAmount = 0;

    if (dto.couponCode) {
      const { coupon, discountAmount: d } = await this.validateCoupon(
        dto.couponCode, totalAmount, dto.userId, dto.phone,
      );
      couponId = coupon.id;
      discountAmount = d;
    }

    const finalAmount = Math.max(0, totalAmount - discountAmount);

    // Reuse a still-pending order for the same buyer + exact cart + coupon
    // made recently, instead of inserting a new one on every retry
    // (double-click "Place order", reload, re-submit after a failed
    // payment). Two independent orders for the same cart can each get paid
    // and each fire its own shop_order_confirmation SMS.
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const wantItems = [...dto.productIds]
      .map((i) => `${i.productId}:${i.quantity}`)
      .sort();

    const candidates = await this.db
      .select()
      .from(shopOrders)
      .where(
        and(
          dto.userId ? eq(shopOrders.userId, dto.userId) : eq(shopOrders.phone, dto.phone),
          eq(shopOrders.status, 'pending'),
          gte(shopOrders.createdAt, oneHourAgo),
          couponId ? eq(shopOrders.couponId, couponId) : isNull(shopOrders.couponId),
        ),
      );

    let reusedOrder: typeof shopOrders.$inferSelect | null = null;
    for (const cand of candidates) {
      const items = await this.db
        .select({ productId: shopOrderItems.productId, quantity: shopOrderItems.quantity })
        .from(shopOrderItems)
        .where(eq(shopOrderItems.orderId, cand.id));
      const candItems = items.map((i) => `${i.productId}:${i.quantity}`).sort();
      if (candItems.length === wantItems.length && candItems.every((v, i) => v === wantItems[i])) {
        reusedOrder = cand;
        break;
      }
    }

    let order: typeof shopOrders.$inferSelect = reusedOrder!;
    if (reusedOrder) {
      order = reusedOrder;
    } else {
      // ── Atomic stock check & decrement inside a transaction ──────────────
      await this.db.transaction(async (tx) => {
        for (const item of dto.productIds) {
          if (item.quantity <= 0) continue;
          const result = await tx.execute<{stock: number | null}>(
            sql`SELECT stock FROM shop_products WHERE id = ${item.productId} FOR UPDATE`,
          );
          const row = (result as any).rows?.[0] as {stock: number | null} | undefined;
          if (!row) throw new NotFoundException(`Product ${item.productId} not found`);
          if (row.stock !== null && row.stock < item.quantity) {
            throw new BadRequestException(`Insufficient stock for product ${item.productId}`);
          }
          if (row.stock !== null) {
            await tx.execute(
              sql`UPDATE shop_products SET stock = stock - ${item.quantity} WHERE id = ${item.productId}`,
            );
          }
        }

        const [inserted] = await tx
          .insert(shopOrders)
          .values({
            userId: dto.userId ?? null,
            name: dto.name,
            email: dto.email,
            phone: dto.phone,
            address: dto.address,
            totalAmount: String(totalAmount),
            discountAmount: String(discountAmount),
            finalAmount: String(finalAmount),
            couponId: couponId ?? null,
            status: 'pending',
          })
          .returning();

        await tx.insert(shopOrderItems).values(
          dto.productIds.map((item) => {
            const product = productRows.find((p) => p.id === item.productId)!;
            const price = product.discountPrice
              ? parseFloat(product.discountPrice)
              : parseFloat(product.price);
            return {
              orderId: inserted.id,
              productId: item.productId,
              quantity: item.quantity,
              price: String(price),
              title: product.title,
            };
          }),
        );

        if (couponId) {
          await tx.insert(shopCouponUsages).values({
            couponId,
            userId: dto.userId ?? null,
            orderId: inserted.id,
          });
          await tx
            .update(shopCoupons)
            .set({ usedCount: sql`${shopCoupons.usedCount} + 1` })
            .where(eq(shopCoupons.id, couponId));
        }

        order = inserted;
      });
    }

    // Clear user / guest cart
    if (dto.userId) {
      await this.db.delete(shopCartItems).where(eq(shopCartItems.userId, dto.userId));
    } else if (dto.sessionId) {
      await this.db.delete(shopCartItems).where(eq(shopCartItems.sessionId, dto.sessionId));
    }

    return { order, items: dto.productIds };
  }

  async initiatePaystationPayment(orderId: number, callbackUrl: string, ownerPhone: string, userId?: number) {
    const [order] = await this.db
      .select()
      .from(shopOrders)
      .where(eq(shopOrders.id, orderId))
      .limit(1);
    if (!order) throw new NotFoundException('Order not found');
    if (order.status !== 'pending') throw new BadRequestException('Order already processed');

    if (userId) {
      if (order.userId !== userId) throw new BadRequestException('Unauthorized');
    } else {
      if (order.phone !== ownerPhone) throw new BadRequestException('Unauthorized');
    }

    const amount = parseFloat(order.finalAmount);
    const gateway = await this.paymentGateway.getActiveGateway();

    if (gateway === 'bkash') {
      const apiBase = process.env.API_URL ?? 'http://localhost:3000';
      const invoiceNumber = this.bkashService.generateShopInvoiceNumber(orderId);

      const result = await this.bkashService.createPayment({
        invoiceNumber,
        amount,
        callbackUrl: `${apiBase}/bkash/callback/shop`,
        payerReference: order.phone,
      });

      await this.db
        .update(shopOrders)
        .set({ bkashInvoiceNumber: invoiceNumber, bkashPaymentId: result.paymentID })
        .where(eq(shopOrders.id, orderId));

      return { paymentUrl: result.paymentUrl, invoiceNumber };
    }

    const invoiceNumber = `SHOP-${orderId}-${Date.now()}`;
    const result = await this.paystationService.initiatePayment({
      invoiceNumber,
      amount,
      custName: order.name,
      custPhone: order.phone,
      custEmail: order.email,
      callbackUrl,
      reference: `Shop Order #${orderId}`,
    });

    await this.db
      .update(shopOrders)
      .set({ paystationInvoiceId: result.invoiceNumber })
      .where(eq(shopOrders.id, orderId));

    return result;
  }

  async confirmBkashPayment(orderId: number, bkashTrxId: string, ownerPhone: string, userId?: number) {
    const [order] = await this.db
      .select()
      .from(shopOrders)
      .where(eq(shopOrders.id, orderId))
      .limit(1);
    if (!order) throw new NotFoundException('Order not found');
    if (order.status !== 'pending') throw new BadRequestException('Order already processed');

    if (userId) {
      if (order.userId !== userId) throw new BadRequestException('Unauthorized');
    } else {
      if (order.phone !== ownerPhone) throw new BadRequestException('Unauthorized');
    }

    await this.db
      .update(shopOrders)
      .set({
        status: 'paid',
        bkashTrxId,
        paymentMethod: 'bkash',
        paidAt: new Date(),
        updatedAt: new Date(),
        displayInvoiceNumber: await this.invoiceNumbers.generate(),
      })
      .where(eq(shopOrders.id, orderId));

    await this.notifyOrder(orderId, order.name, order.phone, 'bKash', order.finalAmount);
    return { orderId, status: 'paid' };
  }

  async verifyPaystationPayment(invoiceNumber: string, status: string, trxId: string) {
    const rawOrderId = invoiceNumber.replace(/^SHOP-/, '').split('-')[0];
    const orderId = parseInt(rawOrderId, 10);
    if (isNaN(orderId)) throw new BadRequestException('Invalid invoice number');

    const [order] = await this.db
      .select()
      .from(shopOrders)
      .where(eq(shopOrders.id, orderId))
      .limit(1);
    if (!order) throw new NotFoundException('Order not found');

    const alreadyPaid = order.status === 'paid';
    if (alreadyPaid) return { orderId, alreadyPaid: true };

    const trxData = await this.paystationService.verifyByInvoice(invoiceNumber);
    const succeeded =
      status === 'Successful' ||
      trxData.data?.trx_status === 'success' ||
      trxData.data?.trx_status === 'successful';

    if (!succeeded) throw new BadRequestException('Payment not confirmed');

    const paidAmount = parseFloat(trxData.data?.payment_amount ?? '0');
    if (paidAmount > 0 && Math.abs(paidAmount - parseFloat(order.finalAmount)) > 1) {
      throw new BadRequestException(`Payment amount mismatch: expected ${order.finalAmount}, got ${paidAmount}`);
    }

    await this.db
      .update(shopOrders)
      .set({
        status: 'paid',
        paystationTrxId: trxId,
        paystationMethod: trxData.data?.payment_method,
        payerPhone: trxData.data?.payer_mobile_no,
        paymentMethod: 'paystation',
        paidAt: new Date(),
        updatedAt: new Date(),
        displayInvoiceNumber: await this.invoiceNumbers.generate(),
      })
      .where(eq(shopOrders.id, orderId));

    await this.notifyOrder(orderId, order.name, order.phone, trxData.data?.payment_method ?? 'PayStation', order.finalAmount);
    return { orderId, alreadyPaid: false };
  }

  /**
   * bKash Tokenized Checkout verify/capture for shop orders — mirrors
   * verifyPaystationPayment above but looks the order up by `bkashPaymentId`
   * and captures via bKash's execute-payment API.
   */
  async verifyBkashPayment(paymentID: string, status: string) {
    const [order] = await this.db
      .select()
      .from(shopOrders)
      .where(eq(shopOrders.bkashPaymentId, paymentID))
      .limit(1);
    if (!order) throw new NotFoundException('Order not found');

    const alreadyPaid = order.status === 'paid';
    if (alreadyPaid) return { orderId: order.id, alreadyPaid: true };

    if (status !== 'success') throw new BadRequestException('Payment not confirmed');

    const execution = await this.bkashService.executePayment(paymentID);
    const succeeded = execution.transactionStatus?.toLowerCase() === 'completed';
    if (!succeeded) throw new BadRequestException('Payment not confirmed');

    await this.db
      .update(shopOrders)
      .set({
        status: 'paid',
        bkashPgwTrxId: execution.trxID,
        bkashPgwStatus: execution.transactionStatus,
        paymentMethod: 'bkash_pgw',
        paidAt: new Date(),
        updatedAt: new Date(),
        displayInvoiceNumber: await this.invoiceNumbers.generate(),
      })
      .where(eq(shopOrders.id, order.id));

    await this.notifyOrder(order.id, order.name, order.phone, 'bKash', order.finalAmount);
    return { orderId: order.id, alreadyPaid: false };
  }

  private async notifyOrder(orderId: number, name: string, phone: string, method: string, amount: string) {
    const [claimed] = await this.db
      .update(shopOrders)
      .set({ confirmationSmsSentAt: new Date() })
      .where(and(eq(shopOrders.id, orderId), isNull(shopOrders.confirmationSmsSentAt)))
      .returning({ id: shopOrders.id });
    if (!claimed) return;

    await this.adminNotifications.notifyAdmins(
      'shop_order',
      'New shop order',
      `${name} placed an order (${method}) — ৳${amount}`,
      '/admin/shop/orders',
    );

    await this.smsTemplates.send('shop_order_confirmation', phone, {
      name: name.split(' ')[0],
      amount: `৳${amount}`,
      order_id: String(orderId),
    });
  }

  async getOrderById(orderId: number) {
    const [order] = await this.db
      .select()
      .from(shopOrders)
      .where(eq(shopOrders.id, orderId))
      .limit(1);
    if (!order) throw new NotFoundException('Order not found');

    const items = await this.db
      .select()
      .from(shopOrderItems)
      .where(eq(shopOrderItems.orderId, orderId));

    return { ...order, items };
  }

  async getMyOrders(userId: number) {
    const orders = await this.db
      .select()
      .from(shopOrders)
      .where(eq(shopOrders.userId, userId))
      .orderBy(desc(shopOrders.createdAt));

    return orders;
  }

  /** Admin: paginated order list */
  async findAllAdmin(page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const [orders, [{ count }]] = await Promise.all([
      this.db
        .select()
        .from(shopOrders)
        .orderBy(desc(shopOrders.createdAt))
        .limit(limit)
        .offset(offset),
      this.db.select({ count: sql<number>`count(*)` }).from(shopOrders),
    ]);
    return { orders, total: Number(count), page, limit };
  }

  /** Admin: update fulfillment status */
  async updateFulfillment(
    orderId: number,
    fulfillmentStatus: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled',
    notes?: string,
  ) {
    const [updated] = await this.db
      .update(shopOrders)
      .set({ fulfillmentStatus, notes: notes ?? undefined, updatedAt: new Date() })
      .where(eq(shopOrders.id, orderId))
      .returning();
    if (!updated) throw new NotFoundException('Order not found');
    return updated;
  }
}
