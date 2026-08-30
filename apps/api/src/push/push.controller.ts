import { Body, Controller, Delete, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, type RequestUser } from '../common/decorators/current-user.decorator';
import { PushService } from './push.service';

class SubscribeDto {
  endpoint: string;
  p256dh: string;
  auth: string;
}

@Controller('push')
@UseGuards(JwtAuthGuard)
export class PushController {
  constructor(private readonly push: PushService) {}

  @Get('vapid-public-key')
  getVapidKey() {
    return { key: this.push.vapidPublicKey };
  }

  @Post('subscribe')
  subscribe(@CurrentUser() user: RequestUser, @Body() body: SubscribeDto) {
    return this.push.subscribe(user.userId, body);
  }

  @Delete('unsubscribe')
  unsubscribe(@Body() body: { endpoint: string }) {
    return this.push.unsubscribe(body.endpoint);
  }
}
