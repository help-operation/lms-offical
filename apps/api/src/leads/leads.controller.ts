import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { RequirePermissions } from 'src/common/decorators/require-permissions.decorator';
import { Message } from 'src/common/decorators/message.decorator';
import { CurrentUser, type RequestUser } from 'src/common/decorators/current-user.decorator';
import { LeadsService } from './leads.service';
import {
  CreateLeadDto,
  UpdateLeadDto,
  CreateInterestLeadDto,
  CreateCallbackLeadDto,
  CreateAbandonedCheckoutLeadDto,
  CreateCheckoutVisitLeadDto,
} from './dto/lead.dto';
import { ActivityLogsService } from 'src/activity-logs/activity-logs.service';

// ─── Public (guest checkout submit) ──────────────────────────────────────────

@Controller('leads')
export class LeadsPublicController {
  constructor(private readonly svc: LeadsService) {}

  @Post()
  @Message('Lead captured')
  create(@Body() dto: CreateLeadDto) {
    return this.svc.create(dto);
  }

  @Post('interest')
  @Message('Interest captured')
  createInterest(@Body() dto: CreateInterestLeadDto) {
    return this.svc.createInterestLead(dto);
  }

  @Post('callback')
  @Message('Callback request received')
  createCallback(@Body() dto: CreateCallbackLeadDto) {
    return this.svc.createCallbackLead(dto);
  }

  @Post('silent/abandoned-checkout')
  @Message('Abandonment captured')
  async silentAbandonedCheckout(@Body() dto: CreateAbandonedCheckoutLeadDto) {
    await this.svc.captureAbandonedCheckout(dto);
    return { tracked: true };
  }

  @UseGuards(JwtAuthGuard)
  @Post('silent/checkout-visit')
  @Message('Visit captured')
  async silentCheckoutVisit(
    @CurrentUser() user: RequestUser,
    @Body() dto: CreateCheckoutVisitLeadDto,
  ) {
    await this.svc.captureCheckoutVisit(user.userId, dto.courseIds);
    return { tracked: true };
  }

  @Post(':id/initiate-payment')
  @Message('Payment initiated')
  initiatePayment(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { callbackUrl: string },
  ) {
    return this.svc.initiatePayment(id, body.callbackUrl);
  }
}

// ─── Admin ────────────────────────────────────────────────────────────────────

@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions('view_leads')
@Controller('admin/leads')
export class LeadsAdminController {
  constructor(
    private readonly svc: LeadsService,
    private readonly activityLogs: ActivityLogsService,
  ) {}

  @Get('counts')
  @Message('Lead counts fetched')
  counts() {
    return this.svc.getCounts();
  }

  @Get()
  @Message('Leads fetched')
  list(
    @Query('status') status?: string,
    @Query('source') source?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('date_from') date_from?: string,
    @Query('date_to') date_to?: string,
  ) {
    return this.svc.listForAdmin({
      status,
      source,
      search,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 25,
      date_from,
      date_to,
    });
  }

  @Get(':id')
  @Message('Lead fetched')
  get(@Param('id', ParseIntPipe) id: number) {
    return this.svc.getById(id);
  }

  @RequirePermissions('update_leads')
  @Patch(':id')
  @Message('Lead updated')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateLeadDto,
    @CurrentUser() actor: RequestUser,
  ) {
    const result = await this.svc.update(id, dto);
    void this.activityLogs.log({ adminUserId: actor.userId, action: 'lead_updated', entity: 'lead', entityId: id, meta: { status: dto.status } });
    return result;
  }

  @RequirePermissions('delete_leads')
  @Delete(':id')
  @Message('Lead deleted')
  async delete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() actor: RequestUser,
  ) {
    const result = await this.svc.delete(id);
    void this.activityLogs.log({ adminUserId: actor.userId, action: 'lead_deleted', entity: 'lead', entityId: id });
    return result;
  }
}
