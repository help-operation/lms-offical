import {
  Body, Controller, Delete, Get, HttpCode,
  HttpStatus, Param, ParseIntPipe, Patch, Post, Query, UseGuards,
} from '@nestjs/common';
import { ContactMessagesService } from './contact-messages.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { RequirePermissions } from 'src/common/decorators/require-permissions.decorator';
import { Message } from 'src/common/decorators/message.decorator';
import type { TableQueryInput } from 'src/common/utils/table-query.util';

@Controller('contact-messages')
export class ContactMessagesController {
  constructor(private readonly svc: ContactMessagesService) {}

  // ─── Public ─────────────────────────────────────────────────────────────────

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Message('Message sent successfully')
  create(@Body() body: { name: string; email: string; subject?: string; message: string }) {
    return this.svc.create(body);
  }

  // ─── Admin ──────────────────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('view_messages')
  @Get('admin')
  @Message('Messages fetched')
  getAll(@Query() query: TableQueryInput) {
    return this.svc.getAll(query);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('update_messages')
  @Patch('admin/:id/read')
  @Message('Marked as read')
  markRead(@Param('id', ParseIntPipe) id: number) {
    return this.svc.markRead(id);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('delete_messages')
  @Delete('admin/:id')
  @HttpCode(HttpStatus.OK)
  @Message('Message deleted')
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.svc.delete(id);
    return { success: true };
  }
}
