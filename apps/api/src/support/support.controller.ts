import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { SupportService } from './support.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';
import {
  CurrentUser,
  type RequestUser,
} from '../common/decorators/current-user.decorator';
import type { TableQueryInput } from '../common/utils/table-query.util';

@Controller('support')
@UseGuards(JwtAuthGuard)
export class SupportController {
  constructor(private svc: SupportService) {}

  // ── Student endpoints ────────────────────────────────────────────────────────

  @Post('tickets')
  create(
    @CurrentUser() user: RequestUser,
    @Body() body: { subject: string; message: string; category?: string; priority?: string },
  ) {
    return this.svc.createTicket(
      user.userId, body.subject, body.message,
      (body.category as any) ?? 'other', (body.priority as any) ?? 'medium',
    );
  }

  @Get('tickets')
  myTickets(@CurrentUser() user: RequestUser) {
    return this.svc.myTickets(user.userId);
  }

  @Get('tickets/:id')
  getTicket(@CurrentUser() user: RequestUser, @Param('id', ParseIntPipe) id: number) {
    return this.svc.getTicket(user.userId, id, user.role);
  }

  @Post('tickets/:id/reply')
  reply(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { message: string; isInternal?: boolean; attachments?: { url: string; name: string }[] },
  ) {
    return this.svc.reply(user.userId, id, body.message, user.role, body.isInternal ?? false, body.attachments);
  }

  @Post('attachment-url')
  createAttachmentUploadUrl(@Body() body: { mimeType: string; fileName: string }) {
    return this.svc.createAttachmentUploadUrl(body.mimeType, body.fileName);
  }

  // ── Admin: tickets ───────────────────────────────────────────────────────────

  @Get('admin/tickets')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('view_support')
  allTickets(@Query() query: TableQueryInput) {
    return this.svc.allTickets(query);
  }

  @Get('admin/stats')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('view_support')
  getStats() {
    return this.svc.getStats();
  }

  @Get('admin/analytics')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('view_support')
  getAnalytics(@Query('days') days?: string) {
    return this.svc.getAnalytics(days ? Number(days) : 30);
  }

  @Get('admin/analytics/export')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('view_support')
  async exportCsv(@Query('days') days: string, @Res() res: Response) {
    const csv = await this.svc.exportTicketsCsv(days ? Number(days) : 30);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="support-tickets-${days ?? 30}d.csv"`);
    res.send(csv);
  }

  @Get('admin/agents')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('view_support')
  getAgents() {
    return this.svc.getAgents();
  }

  @Patch('admin/tickets/bulk')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('update_support')
  bulkAction(
    @Body() body: {
      ids: number[];
      action: 'close' | 'resolve' | 'assign' | 'set_priority';
      adminId?: number | null;
      priority?: string;
    },
  ) {
    return this.svc.bulkAction(body.ids, body.action, { adminId: body.adminId, priority: body.priority });
  }

  @Patch('admin/tickets/:id/status')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('update_support')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { status: 'open' | 'in_progress' | 'resolved' | 'closed'; priority?: 'low' | 'medium' | 'high' | 'urgent' },
  ) {
    return this.svc.updateStatus(id, body.status, body.priority);
  }

  @Patch('admin/tickets/:id/assign')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('update_support')
  assignTicket(@Param('id', ParseIntPipe) id: number, @Body() body: { adminId: number | null }) {
    return this.svc.assignTicket(id, body.adminId);
  }

  // ── Admin: canned responses ───────────────────────────────────────────────────

  @Get('admin/canned-responses')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('view_support')
  listCanned() {
    return this.svc.listCannedResponses();
  }

  @Post('admin/canned-responses')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('update_support')
  createCanned(@Body() body: { title: string; body: string; category?: string; sortOrder?: number }) {
    return this.svc.createCannedResponse(body);
  }

  @Patch('admin/canned-responses/:id')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('update_support')
  updateCanned(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { title?: string; body?: string; category?: string; sortOrder?: number },
  ) {
    return this.svc.updateCannedResponse(id, body);
  }

  @Delete('admin/canned-responses/:id')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('update_support')
  deleteCanned(@Param('id', ParseIntPipe) id: number) {
    return this.svc.deleteCannedResponse(id);
  }
}
