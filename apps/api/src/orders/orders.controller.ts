import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Public } from 'src/common/decorators/public.decorator';
import { CurrentUser, type RequestUser } from 'src/common/decorators/current-user.decorator';
import { Message } from 'src/common/decorators/message.decorator';
import { OrdersService } from './orders.service';
import { PaymentConfirmationsService } from './payment-confirmations.service';
import { LiveCoursesService } from 'src/live-courses/live-courses.service';
import { LeadsService } from 'src/leads/leads.service';

@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('STUDENT', 'GUEST', 'SUPER_ADMIN', 'INSTRUCTOR')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Message('Order created')
  createOrder(
    @CurrentUser() user: RequestUser,
    @Body() body: { courseIds: number[]; couponCode?: string },
  ) {
    return this.ordersService.createOrder(user.userId, body.courseIds, body.couponCode);
  }

  @Post(':orderId/pay/bkash')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Message('Payment recorded')
  confirmBkash(
    @CurrentUser() user: RequestUser,
    @Param('orderId', ParseIntPipe) orderId: number,
    @Body() body: { bkashTrxId: string },
  ) {
    return this.ordersService.confirmBkashPayment(user.userId, orderId, body.bkashTrxId);
  }

  @Post(':orderId/pay/paystation')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Message('PayStation payment initiated')
  initiatePaystation(
    @CurrentUser() user: RequestUser,
    @Param('orderId', ParseIntPipe) orderId: number,
    @Body() body: { callbackUrl: string },
  ) {
    return this.ordersService.initiatePaystationPayment(
      user.userId,
      orderId,
      body.callbackUrl,
    );
  }


  @Post('validate-coupon')
  @Public()
  @Message('Coupon valid')
  validateCoupon(
    @CurrentUser() user: RequestUser | null,
    @Body() body: { code: string; courseIds?: number[]; liveCourseIds?: number[] },
  ) {
    return this.ordersService.validateCoupon(
      body.code,
      body.courseIds     ?? [],
      body.liveCourseIds ?? [],
      user?.userId,
    );
  }

  @Get()
  @Message('Orders fetched')
  getMyOrders(@CurrentUser() user: RequestUser) {
    return this.ordersService.getMyOrders(user.userId);
  }

  @Get('my-payments')
  @Message('Payment history fetched')
  getMyPayments(@CurrentUser() user: RequestUser) {
    return this.ordersService.getMyPayments(user.userId);
  }

  /** Lifetime paid-order count/value — consumed only by the tracking layer's hashed user-context push. */
  @Get('my-stats')
  @Message('Order stats fetched')
  getMyOrderStats(@CurrentUser() user: RequestUser) {
    return this.ordersService.getMyOrderStats(user.userId);
  }

  @Get(':orderId')
  @Message('Order fetched')
  getOrder(
    @CurrentUser() user: RequestUser,
    @Param('orderId', ParseIntPipe) orderId: number,
  ) {
    return this.ordersService.getOrderById(user.userId, orderId);
  }
}

// ─── Public PayStation callback (no auth) ────────────────────────────────────
// PayStation redirects the user's browser here after payment with query params:
//   ?status=Successful&invoice_number=XXX&tx_id=TXID
// We verify server-side then redirect the browser to the frontend success page.

@Controller('paystation')
export class PaystationCallbackController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly liveCoursesService: LiveCoursesService,
    private readonly leadsService: LeadsService,
    private readonly confirmations: PaymentConfirmationsService,
  ) {}

  @Get('callback')
  async callback(
    @Query('status') status: string,
    @Query('invoice_number') invoiceNumber: string,
    @Query('trx_id') trxId: string,
    @Res() res: Response,
  ) {
    const frontendBase = process.env.FRONTEND_URL ?? 'http://localhost:3001';

    // Mint a one-time token holding the result page's display params, then
    // redirect with only `?t=<token>`. The page exchanges (and consumes) it —
    // so the result is verified (only this callback can mint) and one-time.
    const successUrl = async (path: string, params: Record<string, string>) =>
      `${frontendBase}${path}?t=${await this.confirmations.mint(params)}`;

    // ── Guest lead payment (LEAD- prefix) ─────────────────────────────────────
    if (invoiceNumber?.startsWith('LEAD-')) {
      try {
        const result = await this.leadsService.verifyLeadPayment(
          invoiceNumber,
          status,
          trxId,
        );
        return res.redirect(
          await successUrl('/checkout/success', {
            status: result.alreadyPaid ? 'already_paid' : 'paid',
            leadId: String(result.leadId),
          }),
        );
      } catch {
        // invoiceNumber format is `LEAD-{leadId}-{timestamp}` — pull the id out
        // so the failed page's "Try again" can send the guest back to
        // /checkout/[slug] instead of the login-gated /cart.
        const leadIdMatch = invoiceNumber?.match(/^LEAD-(\d+)-/);
        const leadId = leadIdMatch ? Number(leadIdMatch[1]) : null;
        const slug = leadId
          ? await this.leadsService.getRetryCourseSlug(leadId).catch(() => null)
          : null;

        return res.redirect(
          await successUrl('/checkout/success', {
            status: 'failed',
            invoice: invoiceNumber ?? '',
            ...(leadId ? { leadId: String(leadId) } : {}),
            ...(slug ? { slug } : {}),
          }),
        );
      }
    }

    // ── Live course enrollment payment (LCE- prefix) ──────────────────────────
    if (invoiceNumber?.startsWith('LCE-')) {
      try {
        const result = await this.liveCoursesService.verifyLivePayment(invoiceNumber);
        return res.redirect(
          await successUrl(`/c/${result.liveCourseId}/success`, {
            status: result.alreadyPaid ? 'already_paid' : 'paid',
            courseId: String(result.liveCourseId),
            slug: result.courseSlug ?? '',
          }),
        );
      } catch {
        return res.redirect(
          `${frontendBase}/courses?error=payment_failed&invoice=${encodeURIComponent(invoiceNumber ?? '')}`,
        );
      }
    }

    // ── Regular course order payment ───────────────────────────────────────────
    try {
      const result = await this.ordersService.verifyPaystationPayment(
        invoiceNumber,
        status,
        trxId,
      );

      return res.redirect(
        await successUrl('/checkout/success', {
          status: result.alreadyPaid ? 'already_paid' : 'paid',
          orderId: String(result.orderId),
          ...(result.firstCourseSlug ? { slug: result.firstCourseSlug } : {}),
        }),
      );
    } catch {
      // Fire-and-forget: capture a lead so admin can follow up with the user
      void this.leadsService.captureFailedOrderLead(invoiceNumber ?? '');

      return res.redirect(
        await successUrl('/checkout/success', {
          status: 'failed',
          invoice: invoiceNumber ?? '',
        }),
      );
    }
  }
}

// ─── Public bKash callback (no auth) ──────────────────────────────────────────
// bKash redirects the user's browser here after payment with query params:
//   ?paymentID=XXX&status=success|failure|cancel
// Unlike PayStation there's no invoice-number prefix to dispatch on, so each
// checkout flow gets its own explicit route instead of one shared route.

@Controller('bkash')
export class BkashCallbackController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly liveCoursesService: LiveCoursesService,
    private readonly leadsService: LeadsService,
    private readonly confirmations: PaymentConfirmationsService,
  ) {}

  private frontendBase() {
    return process.env.FRONTEND_URL ?? 'http://localhost:3001';
  }

  private async successUrl(path: string, params: Record<string, string>) {
    return `${this.frontendBase()}${path}?t=${await this.confirmations.mint(params)}`;
  }

  @Get('callback/order')
  async orderCallback(
    @Query('paymentID') paymentID: string,
    @Query('status') status: string,
    @Res() res: Response,
  ) {
    try {
      const result = await this.ordersService.verifyBkashPayment(paymentID, status);
      return res.redirect(
        await this.successUrl('/checkout/success', {
          status: result.alreadyPaid ? 'already_paid' : 'paid',
          orderId: String(result.orderId),
          ...(result.firstCourseSlug ? { slug: result.firstCourseSlug } : {}),
        }),
      );
    } catch {
      void this.leadsService.captureFailedOrderLead(paymentID ?? '');
      return res.redirect(
        await this.successUrl('/checkout/success', {
          status: 'failed',
          invoice: paymentID ?? '',
        }),
      );
    }
  }

  @Get('callback/lead')
  async leadCallback(
    @Query('paymentID') paymentID: string,
    @Query('status') status: string,
    @Res() res: Response,
  ) {
    try {
      const result = await this.leadsService.verifyBkashLeadPayment(paymentID, status);
      return res.redirect(
        await this.successUrl('/checkout/success', {
          status: result.alreadyPaid ? 'already_paid' : 'paid',
          leadId: String(result.leadId),
        }),
      );
    } catch {
      return res.redirect(
        await this.successUrl('/checkout/success', {
          status: 'failed',
          invoice: paymentID ?? '',
        }),
      );
    }
  }

  @Get('callback/live')
  async liveCallback(
    @Query('paymentID') paymentID: string,
    @Query('status') status: string,
    @Res() res: Response,
  ) {
    try {
      const result = await this.liveCoursesService.verifyBkashLivePayment(paymentID, status);
      return res.redirect(
        await this.successUrl(`/c/${result.liveCourseId}/success`, {
          status: result.alreadyPaid ? 'already_paid' : 'paid',
          courseId: String(result.liveCourseId),
          slug: result.courseSlug ?? '',
        }),
      );
    } catch {
      return res.redirect(
        `${this.frontendBase()}/courses?error=payment_failed&invoice=${encodeURIComponent(paymentID ?? '')}`,
      );
    }
  }
}

// ─── Public one-time confirmation token exchange (no auth) ────────────────────
// The result page POSTs the `?t=` token here. We atomically consume it and
// return the stored display params; a second call (refresh/back) returns null.
@Controller('payment-confirmations')
export class PaymentConfirmationsController {
  constructor(private readonly confirmations: PaymentConfirmationsService) {}

  @Post('consume')
  @Message('Confirmation consumed')
  async consume(@Body() body: { token?: string }) {
    return this.confirmations.consume(body.token ?? '');
  }
}
