import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { EmailBroadcastService } from './email-broadcast.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { RequirePermissions } from 'src/common/decorators/require-permissions.decorator';
import { CurrentUser, type RequestUser } from 'src/common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('email-broadcast')
export class EmailBroadcastController {
  constructor(private readonly svc: EmailBroadcastService) {}

  @Post('students')
  @RequirePermissions('send_manual_email')
  sendToStudents(
    @Body() body: { studentIds: number[]; subject: string; message: string },
    @CurrentUser() user: RequestUser,
  ) {
    const adminId = user.userType === 'admin' ? user.userId : undefined;
    return this.svc.startBroadcastToStudents(body.studentIds, body.subject, body.message, adminId);
  }
}
