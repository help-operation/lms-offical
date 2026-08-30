import { forwardRef, Module } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { LeadsAdminController, LeadsPublicController } from './leads.controller';
import { OrdersModule } from 'src/orders/orders.module';
import { ActivityLogsModule } from 'src/activity-logs/activity-logs.module';

@Module({
  // OrdersModule exports PaystationService — needed for initiate + verify.
  // forwardRef breaks the cycle (OrdersModule also imports LeadsModule for
  // the PayStation callback dispatch).
  imports: [forwardRef(() => OrdersModule), ActivityLogsModule],
  controllers: [LeadsPublicController, LeadsAdminController],
  providers: [LeadsService],
  exports: [LeadsService],
})
export class LeadsModule {}
