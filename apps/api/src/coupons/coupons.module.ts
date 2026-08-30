import { Module } from '@nestjs/common';
import { CouponsService } from './coupons.service';
import { CouponsController } from './coupons.controller';
import { ActivityLogsModule } from 'src/activity-logs/activity-logs.module';

@Module({
  imports: [ActivityLogsModule],
  controllers: [CouponsController],
  providers: [CouponsService],
})
export class CouponsModule {}
