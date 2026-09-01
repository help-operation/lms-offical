import { forwardRef, Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import {
  OrdersController,
  PaystationCallbackController,
  BkashCallbackController,
  PaymentConfirmationsController,
} from './orders.controller';
import { PaymentConfirmationsService } from './payment-confirmations.service';
import { PaymentsModule } from 'src/payments/payments.module';
import { LiveCoursesModule } from 'src/live-courses/live-courses.module';
import { LeadsModule } from 'src/leads/leads.module';
import { EmailTemplatesModule } from 'src/email-templates/email-templates.module';
import { SystemSettingsModule } from 'src/system-settings/system-settings.module';
import { ActivityLogsModule } from 'src/activity-logs/activity-logs.module';
import { MetaCapiModule } from 'src/integrations/meta-capi/meta-capi.module';
import { EventsModule } from 'src/events/events.module';

@Module({
  // forwardRef breaks the OrdersModule ↔ LeadsModule cycle: OrdersModule
  // needs LeadsService for the PayStation/bKash callback dispatch; LeadsModule
  // needs PaystationService/BkashService for initiating guest payments.
  imports: [
    PaymentsModule, // provides PaystationService, BkashService, PaymentGatewayService
    LiveCoursesModule,
    forwardRef(() => LeadsModule),
    EmailTemplatesModule,
    SystemSettingsModule,
    ActivityLogsModule,
    MetaCapiModule,
    EventsModule,
  ],
  controllers: [
    OrdersController,
    PaystationCallbackController,
    BkashCallbackController,
    PaymentConfirmationsController,
  ],
  providers: [OrdersService, PaymentConfirmationsService],
  // Re-export PaymentsModule so ShopOrdersModule/LeadsModule/etc keep getting
  // PaystationService/BkashService/PaymentGatewayService through OrdersModule,
  // exactly as they got PaystationService before this module was introduced.
  exports: [PaymentsModule, OrdersService, PaymentConfirmationsService],
})
export class OrdersModule {}
