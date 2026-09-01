import { Global, Module } from '@nestjs/common';
import { RevenueEventsService } from './revenue-events.service';
import { DashboardEventsService } from './dashboard-events.service';

@Global()
@Module({
  providers: [RevenueEventsService, DashboardEventsService],
  exports: [RevenueEventsService, DashboardEventsService],
})
export class EventsModule {}
