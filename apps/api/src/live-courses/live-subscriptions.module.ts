import { Module } from '@nestjs/common';
import { LiveSubscriptionsService } from './live-subscriptions.service';
import { LiveSubscriptionsController } from './live-subscriptions.controller';
import { PaymentsModule } from 'src/payments/payments.module';

@Module({
  imports: [PaymentsModule],
  controllers: [LiveSubscriptionsController],
  providers: [LiveSubscriptionsService],
  exports: [LiveSubscriptionsService],
})
export class LiveSubscriptionsModule {}
