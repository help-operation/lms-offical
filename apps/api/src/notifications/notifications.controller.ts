import { Controller, Get, Patch, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  CurrentUser,
  type RequestUser,
} from '../common/decorators/current-user.decorator';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private svc: NotificationsService) {}

  @Get()
  findAll(@CurrentUser() user: RequestUser) {
    return this.svc.findAll(user.userId);
  }

  @Get('unread-count')
  unreadCount(@CurrentUser() user: RequestUser) {
    return this.svc.unreadCount(user.userId);
  }

  @Patch(':id/read')
  markRead(@CurrentUser() user: RequestUser, @Param('id', ParseIntPipe) id: number) {
    return this.svc.markRead(user.userId, id);
  }

  @Patch('read-all')
  markAllRead(@CurrentUser() user: RequestUser) {
    return this.svc.markAllRead(user.userId);
  }
}
