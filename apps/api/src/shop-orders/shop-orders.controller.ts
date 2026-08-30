import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from 'src/auth/optional-jwt-auth.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { RequirePermissions } from 'src/common/decorators/require-permissions.decorator';
import { CurrentUser, type RequestUser } from 'src/common/decorators/current-user.decorator';
import { Message } from 'src/common/decorators/message.decorator';
import { Public } from 'src/common/decorators/public.decorator';
import { ShopOrdersService } from './shop-orders.service';
import { PaymentConfirmationsService } from 'src/orders/payment-confirmations.service';

@Controller('shop/orders')
@UseGuards(OptionalJwtAuthGuard)
export class ShopOrdersController {
  constructor(private readonly shopOrdersService: ShopOrdersService) {}

  @Post()
  @Message('Shop order created')
  createOrder(
    @CurrentUser() user: RequestUser | null,
    @Body() body: {
      productIds: { productId: number; quantity: number }[];
      name: string;
      email: string;
      phone: string;
      address?: string;
      couponCode?: string;
      sessionId?: string;
    },
  ) {
    return this.shopOrdersService.createOrder({
      ...body,
      userId: user?.userId,
    });
  }

  @Post('validate-coupon')
  @Message('Coupon valid')
  validateCoupon(@Body() body: { code: string; subtotal: number }) {
    return this.shopOrdersService.validateCoupon(body.code, body.subtotal);
  }

  @Post(':orderId/pay/bkash')
  @Message('bKash payment recorded')
  confirmBkash(
    @Param('orderId', ParseIntPipe) orderId: number,
    @Body() body: { bkashTrxId: string },
  ) {
    return this.shopOrdersService.confirmBkashPayment(orderId, body.bkashTrxId);
  }

  @Post(':orderId/pay/paystation')
  @Message('PayStation payment initiated')
  initiatePaystation(
    @Param('orderId', ParseIntPipe) orderId: number,
    @Body() body: { callbackUrl: string },
  ) {
    return this.shopOrdersService.initiatePaystationPayment(orderId, body.callbackUrl);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @Message('My shop orders fetched')
  getMyOrders(@CurrentUser() user: RequestUser) {
    return this.shopOrdersService.getMyOrders(user.userId);
  }

  @Get(':orderId')
  @Message('Order fetched')
  getOrder(@Param('orderId', ParseIntPipe) orderId: number) {
    return this.shopOrdersService.getOrderById(orderId);
  }
}

// ─── Admin shop orders management ─────────────────────────────────────────────
@Controller('admin/shop/orders')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions('view_shop_orders')
export class ShopAdminOrdersController {
  constructor(private readonly shopOrdersService: ShopOrdersService) {}

  @Get()
  @Message('Shop orders fetched')
  findAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.shopOrdersService.findAllAdmin(Number(page ?? 1), Number(limit ?? 20));
  }

  @Get(':orderId')
  @Message('Order fetched')
  findOne(@Param('orderId', ParseIntPipe) orderId: number) {
    return this.shopOrdersService.getOrderById(orderId);
  }

  @RequirePermissions('update_shop_orders')
  @Patch(':orderId/fulfillment')
  @Message('Fulfillment status updated')
  updateFulfillment(
    @Param('orderId', ParseIntPipe) orderId: number,
    @Body() body: { fulfillmentStatus: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'; notes?: string },
  ) {
    return this.shopOrdersService.updateFulfillment(orderId, body.fulfillmentStatus, body.notes);
  }
}

// ─── PayStation callback for shop orders (SHOP- prefix) ───────────────────────
@Controller('paystation')
export class ShopPaystationCallbackController {
  constructor(
    private readonly shopOrdersService: ShopOrdersService,
    private readonly confirmations: PaymentConfirmationsService,
  ) {}

  @Public()
  @Get('shop-callback')
  async shopCallback(
    @Query('status') status: string,
    @Query('invoice_number') invoiceNumber: string,
    @Query('trx_id') trxId: string,
    @Res() res: Response,
  ) {
    const frontendBase = process.env.FRONTEND_URL ?? 'http://localhost:3001';
    const successUrl = async (path: string, params: Record<string, string>) =>
      `${frontendBase}${path}?t=${await this.confirmations.mint(params)}`;

    try {
      const result = await this.shopOrdersService.verifyPaystationPayment(
        invoiceNumber,
        status,
        trxId,
      );
      return res.redirect(
        await successUrl('/shop/checkout/success', {
          status: result.alreadyPaid ? 'already_paid' : 'paid',
          orderId: String(result.orderId),
        }),
      );
    } catch {
      return res.redirect(
        await successUrl('/shop/checkout/success', {
          status: 'failed',
          invoice: invoiceNumber ?? '',
        }),
      );
    }
  }
}

// ─── bKash callback for shop orders ────────────────────────────────────────────
@Controller('bkash')
export class ShopBkashCallbackController {
  constructor(
    private readonly shopOrdersService: ShopOrdersService,
    private readonly confirmations: PaymentConfirmationsService,
  ) {}

  @Public()
  @Get('callback/shop')
  async shopCallback(
    @Query('paymentID') paymentID: string,
    @Query('status') status: string,
    @Res() res: Response,
  ) {
    const frontendBase = process.env.FRONTEND_URL ?? 'http://localhost:3001';
    const successUrl = async (path: string, params: Record<string, string>) =>
      `${frontendBase}${path}?t=${await this.confirmations.mint(params)}`;

    try {
      const result = await this.shopOrdersService.verifyBkashPayment(paymentID, status);
      return res.redirect(
        await successUrl('/shop/checkout/success', {
          status: result.alreadyPaid ? 'already_paid' : 'paid',
          orderId: String(result.orderId),
        }),
      );
    } catch {
      return res.redirect(
        await successUrl('/shop/checkout/success', {
          status: 'failed',
          invoice: paymentID ?? '',
        }),
      );
    }
  }
}
