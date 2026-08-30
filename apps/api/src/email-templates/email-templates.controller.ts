import { Body, Controller, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { RequirePermissions } from 'src/common/decorators/require-permissions.decorator';
import { Message } from 'src/common/decorators/message.decorator';
import { EmailTemplatesService } from './email-templates.service';

@Controller('admin/email-templates')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions('view_email_templates')
export class EmailTemplatesController {
  constructor(private readonly svc: EmailTemplatesService) {}

  @Get()
  @Message('Email templates fetched')
  findAll() {
    return this.svc.findAll();
  }

  @Get(':eventType')
  @Message('Email template fetched')
  findOne(@Param('eventType') eventType: string) {
    return this.svc.findByEvent(eventType);
  }

  @RequirePermissions('update_email_templates')
  @Put(':eventType')
  @Message('Email template updated')
  update(
    @Param('eventType') eventType: string,
    @Body() body: { subject?: string; htmlBody?: string },
  ) {
    return this.svc.update(eventType, body);
  }

  @RequirePermissions('update_email_templates')
  @Post(':eventType/toggle')
  @Message('Email template toggled')
  toggle(@Param('eventType') eventType: string) {
    return this.svc.toggle(eventType);
  }

  @RequirePermissions('send_test_email')
  @Post(':eventType/test')
  @Message('Test email sent')
  sendTest(
    @Param('eventType') eventType: string,
    @Body() body: { email: string },
  ) {
    return this.svc.sendTest(eventType, body.email);
  }
}
