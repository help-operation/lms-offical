import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { Request } from 'express';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from 'src/auth/optional-jwt-auth.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { RequirePermissions } from 'src/common/decorators/require-permissions.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Message } from 'src/common/decorators/message.decorator';
import { LiveSubscriptionsService } from './live-subscriptions.service';

@Controller('live-subscriptions')
export class LiveSubscriptionsController {
  constructor(private readonly subscriptions: LiveSubscriptionsService) {}

  // ── Admin: List all subscriptions ────────────────────────────────────────────

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('view_live')
  @Message('Subscriptions fetched')
  async listAll(
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.subscriptions.listAllSubscriptions({
      status,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
  }

  // ── Admin: Get subscription details ──────────────────────────────────────────

  @Get('admin/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('view_live')
  @Message('Subscription details fetched')
 async getDetails(@Param('id') id: string) {
    return this.subscriptions.getSubscriptionDetails(Number(id));
  }

  // ── Admin: Cancel subscription ─────────────────────────────────────────────

  @Post('admin/:id/cancel')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('delete_live')
  @HttpCode(HttpStatus.OK)
  @Message('Subscription cancelled')
  async adminCancel(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.subscriptions.cancelSubscription(Number(id), undefined, user.userId);
  }

  // ── Admin: Pause subscription ─────────────────────────────────────────────

  @Post('admin/:id/pause')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('edit_live')
  @HttpCode(HttpStatus.OK)
  @Message('Subscription paused')
  async adminPause(@Param('id') id: string) {
    return this.subscriptions.pauseSubscription(Number(id));
  }

  // ── Admin: Resume subscription ────────────────────────────────────────────

  @Post('admin/:id/resume')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('edit_live')
  @HttpCode(HttpStatus.OK)
  @Message('Subscription resumed')
  async adminResume(@Param('id') id: string) {
    return this.subscriptions.resumeSubscription(Number(id));
  }

  // ── Initiate subscription checkout ──────────────────────────────────────────

  @Post(':id/initiate-subscription')
  @UseGuards(OptionalJwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Message('Subscription initiated')
  async initiate(
    @Param('id') id: string,
    @Body()
    body: {
      name: string;
      phone: string;
      email: string;
      callbackUrl: string;
      batchId?: number;
    },
    @CurrentUser() user?: any,
  ) {
    return this.subscriptions.initiateSubscription(Number(id), {
      ...body,
      userId: user?.id,
    });
  }

  // ── Cancel subscription ─────────────────────────────────────────────────────

  @Post(':id/cancel-subscription')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Message('Subscription cancelled')
  async cancel(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() body: { subscriptionId: number },
  ) {
    return this.subscriptions.cancelSubscription(body.subscriptionId, user.userId);
  }

  // ── Renew subscription (initiate payment) ──────────────────────────────────

  @Post(':id/renew-subscription')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Message('Subscription renewal initiated')
  async renew(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() body: { subscriptionId: number },
  ) {
    const apiBase = process.env.API_URL ?? 'http://localhost:3000';
    return this.subscriptions.renewSubscription(
      body.subscriptionId,
      apiBase,
      Number(id),
    );
  }

  // ── Get subscription status ─────────────────────────────────────────────────

  @Get(':id/subscription-status')
  @UseGuards(OptionalJwtAuthGuard)
  @Message('Subscription status fetched')
  async status(@Param('id') id: string, @CurrentUser() user?: any) {
    // :id is courseId — service resolves enrollment from courseId + userId
    const status = await this.subscriptions.getSubscriptionStatusByCourse(Number(id), user?.userId);
    return { enrolled: !!status, subscription: status };
  }

  // ── bKash agreement callback ────────────────────────────────────────────────

  @Get(':id/subscription-callback/bkash')
  async bkashCallback(
    @Param('id') id: string,
    @Query('paymentID') paymentID: string,
    @Query('sub') subId: string,
    @Res() res: Response,
  ) {
    const frontendBase = process.env.FRONTEND_URL ?? 'http://localhost:3001';
    try {
      const subscriptionId = subId ? Number(subId) : undefined;
      await this.subscriptions.verifyBkashSubscriptionPayment(paymentID, subscriptionId);
      return res.redirect(`${frontendBase}/c/${id}/success?subscription=success`);
    } catch {
      return res.redirect(`${frontendBase}/c/${id}/success?subscription=failed`);
    }
  }

  // ── PayStation subscription callback ────────────────────────────────────────

  @Get(':id/subscription-callback/paystation')
  async paystationCallback(
    @Param('id') id: string,
    @Query('invoice_number') invoiceNumber: string,
    @Query('sub') subId: string,
    @Res() res: Response,
  ) {
    const frontendBase = process.env.FRONTEND_URL ?? 'http://localhost:3001';
    try {
      const subscriptionId = subId ? Number(subId) : undefined;
      await this.subscriptions.verifyPayStationSubscriptionPayment(invoiceNumber, subscriptionId);
      return res.redirect(`${frontendBase}/c/${id}/success?subscription=success`);
    } catch {
      return res.redirect(`${frontendBase}/c/${id}/success?subscription=failed`);
    }
  }

  // ── Get subscription payment history ────────────────────────────────────────

  @Get(':subscriptionId/subscription-payments')
  @UseGuards(JwtAuthGuard)
  @Message('Payment history fetched')
  async paymentHistory(@Param('subscriptionId') subscriptionId: string) {
    return this.subscriptions.getPaymentHistory(Number(subscriptionId));
  }
}
