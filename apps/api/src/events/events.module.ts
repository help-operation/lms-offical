import { Global, Module } from '@nestjs/common';
import { RevenueEventsService } from './revenue-events.service';

@Global()
@Module({
  providers: [RevenueEventsService],
  exports: [RevenueEventsService],
})
export class EventsModule {}
