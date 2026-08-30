import { Module } from '@nestjs/common';
import { ShopOrdersService } from './shop-orders.service';
import {
  ShopOrdersController,
  ShopAdminOrdersController,
  ShopPaystationCallbackController,
  ShopBkashCallbackController,
} from './shop-orders.controller';
import { OrdersModule } from 'src/orders/orders.module';
import { SmsModule } from 'src/sms/sms.module';
import { NotificationsModule } from 'src/notifications/notifications.module';

@Module({
  imports: [
    OrdersModule, // provides PaystationService + BkashService + PaymentGatewayService + PaymentConfirmationsService
    SmsModule,
    NotificationsModule,
  ],
  controllers: [
    ShopOrdersController,
    ShopAdminOrdersController,
    ShopPaystationCallbackController,
    ShopBkashCallbackController,
  ],
  providers: [ShopOrdersService],
  exports: [ShopOrdersService],
})
export class ShopOrdersModule {}
