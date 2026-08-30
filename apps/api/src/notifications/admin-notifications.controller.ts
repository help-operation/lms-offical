import {
  Controller,
  Get,
  Patch,
  Param,
  ParseIntPipe,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { AdminNotificationsService } from './admin-notifications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  CurrentUser,
  type RequestUser,
} from '../common/decorators/current-user.decorator';

@Controller('admin/notifications')
@UseGuards(JwtAuthGuard)
export class AdminNotificationsController {
  constructor(private svc: AdminNotificationsService) {}

  /** Any authenticated admin account may read its own notifications. */
  private assertAdmin(user: RequestUser) {
    if (user.userType !== 'admin') throw new ForbiddenException('Access denied');
  }

  @Get()
  findAll(@CurrentUser() user: RequestUser) {
    this.assertAdmin(user);
    return this.svc.findAll(user.userId);
  }

  @Get('unread-count')
  unreadCount(@CurrentUser() user: RequestUser) {
    this.assertAdmin(user);
    return this.svc.unreadCount(user.userId);
  }

  @Patch(':id/read')
  markRead(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    this.assertAdmin(user);
    return this.svc.markRead(user.userId, id);
  }

  @Patch('read-all')
  markAllRead(@CurrentUser() user: RequestUser) {
    this.assertAdmin(user);
    return this.svc.markAllRead(user.userId);
  }
}
