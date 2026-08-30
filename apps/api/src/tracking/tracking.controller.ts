import { Body, Controller, Param, ParseIntPipe, Post, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { Message } from 'src/common/decorators/message.decorator';
import { TrackingService } from './tracking.service';
import { CreateVisitDto, UpdateVisitDurationDto } from './dto/tracking.dto';

// Public — hit by the pageview beacon on every navigation in the web app.
// No auth guard (mirrors LeadsPublicController); throttled generously since a
// normal session fires a handful of these per minute, not to gate real users.
@Controller('tracking')
export class TrackingController {
  constructor(private readonly svc: TrackingService) {}

  @Post('visit')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @Message('Visit recorded')
  recordVisit(@Body() dto: CreateVisitDto, @Req() req: Request) {
    return this.svc.recordVisit(dto, req.headers['user-agent'], req.ip);
  }

  // POST, not PATCH: navigator.sendBeacon can only ever issue POST requests,
  // and that's the delivery mechanism the frontend relies on for this to fire
  // reliably during page unload.
  @Post('visit/:id/duration')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @Message('Duration recorded')
  updateDuration(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateVisitDurationDto) {
    return this.svc.updateDuration(id, dto);
  }
}
