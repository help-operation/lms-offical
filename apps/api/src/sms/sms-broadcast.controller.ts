import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { SmsBroadcastService, type Segment } from './sms-broadcast.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { RequirePermissions } from 'src/common/decorators/require-permissions.decorator';
import { CurrentUser, type RequestUser } from 'src/common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('sms-broadcast')
export class SmsBroadcastController {
  constructor(private readonly svc: SmsBroadcastService) {}

  @Get('counts')
  @RequirePermissions('send_sms_broadcast')
  counts() {
    return this.svc.counts();
  }

  @Post()
  @RequirePermissions('send_sms_broadcast')
  send(@Body() body: { segment: Segment; message: string }) {
    return this.svc.broadcast(body.segment, body.message);
  }

  @Post('students')
  @RequirePermissions('send_manual_sms')
  sendToStudents(@Body() body: { studentIds: number[]; message: string }, @CurrentUser() user: RequestUser) {
    const adminId = user.userType === 'admin' ? user.userId : undefined;
    return this.svc.startBroadcastToStudents(body.studentIds, body.message, adminId);
  }
}
