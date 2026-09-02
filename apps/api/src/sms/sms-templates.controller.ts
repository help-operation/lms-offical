import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { SmsTemplatesService } from './sms-templates.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { RequirePermissions } from 'src/common/decorators/require-permissions.decorator';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions('view_sms_templates')
@Controller('sms-templates')
export class SmsTemplatesController {
  constructor(private readonly svc: SmsTemplatesService) {}

  @Get()
  findAll() {
    return this.svc.findAll();
  }

  @RequirePermissions('create_sms_templates')
  @Post()
  create(
    @Body() body: {
      eventType: string;
      name: string;
      section: string;
      templateType?: string;
      body: string;
      variables?: { key: string; description: string }[];
    },
  ) {
    return this.svc.create(body);
  }

  @Get(':eventType')
  findOne(@Param('eventType') eventType: string) {
    return this.svc.findByEvent(eventType);
  }

  @RequirePermissions('update_sms_templates')
  @Put(':eventType')
  update(
    @Param('eventType') eventType: string,
    @Body() body: { body?: string; name?: string },
  ) {
    return this.svc.update(eventType, body);
  }

  @RequirePermissions('update_sms_templates')
  @Patch(':eventType/toggle')
  toggle(@Param('eventType') eventType: string) {
    return this.svc.toggle(eventType);
  }

  @RequirePermissions('delete_sms_templates')
  @Delete(':eventType')
  remove(@Param('eventType') eventType: string) {
    return this.svc.delete(eventType);
  }

  @RequirePermissions('send_test_sms')
  @Post(':eventType/test')
  async test(
    @Param('eventType') eventType: string,
    @Body() body: { phone: string },
  ) {
    const sent = await this.svc.sendTest(eventType, body.phone);
    return { sent };
  }
}
