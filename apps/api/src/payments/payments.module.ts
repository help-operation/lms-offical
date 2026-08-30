import { Module } from '@nestjs/common';
import { PaystationService } from 'src/orders/paystation.service';
import { BkashService } from './bkash.service';
import { PaymentGatewayService } from './payment-gateway.service';
import { PaymentGatewayConfigsModule } from 'src/payment-gateways/payment-gateway-configs.module';

// Leaf module — provides both gateway clients + the active-gateway resolver
// to every checkout flow (orders, shop-orders, leads, live-courses) without
// each of them needing to know about the other gateway's setup. Credentials
// and the active-gateway flag are DB-backed via PaymentGatewayConfigsModule
// — nothing here reads .env or system_settings for gateway config anymore.
@Module({
  imports: [PaymentGatewayConfigsModule],
  providers: [PaystationService, BkashService, PaymentGatewayService],
  exports: [PaystationService, BkashService, PaymentGatewayService],
})
export class PaymentsModule {}
