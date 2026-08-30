import { Injectable } from '@nestjs/common';
import { PaymentGatewayConfigsService } from 'src/payment-gateways/payment-gateway-configs.service';

export type GatewayName = 'paystation' | 'bkash';

@Injectable()
export class PaymentGatewayService {
  constructor(private readonly gatewayConfigs: PaymentGatewayConfigsService) {}

  /**
   * Throws if no gateway is currently active/enabled in Admin → Settings →
   * Payments, so checkout surfaces a clear configuration error instead of
   * silently guessing a default.
   */
  async getActiveGateway(): Promise<GatewayName> {
    const gateway = await this.gatewayConfigs.getActiveGateway();
    return gateway === 'bkash' ? 'bkash' : 'paystation';
  }
}
