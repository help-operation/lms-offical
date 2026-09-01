import { Module } from '@nestjs/common';
import { PaymentManagementService } from './payment-management.service';
import { PaymentManagementController } from './payment-management.controller';

@Module({
  controllers: [PaymentManagementController],
  providers: [PaymentManagementService],
  exports: [PaymentManagementService],
})
export class PaymentManagementModule {}
