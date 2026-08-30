import { Body, Controller, Get, Param, Put, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { RequirePermissions } from 'src/common/decorators/require-permissions.decorator';
import { Message } from 'src/common/decorators/message.decorator';
import { PaymentGatewayConfigsService } from './payment-gateway-configs.service';

@Controller('admin/payment-gateways')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PaymentGatewayConfigsController {
  constructor(private readonly configs: PaymentGatewayConfigsService) {}

  @Get()
  @RequirePermissions('view_settings_payment')
  @Message('Payment gateways fetched')
  list() {
    return this.configs.listForAdmin();
  }

  @Put(':gateway')
  @RequirePermissions('update_settings_payment')
  @Message('Payment gateway updated')
  async update(
    @Param('gateway') gateway: string,
    @Body() body: { enabled?: boolean; credentials?: Record<string, string> },
  ) {
    if (body.credentials) {
      await this.configs.updateCredentials(gateway, body.credentials);
    }
    if (typeof body.enabled === 'boolean') {
      await this.configs.setEnabled(gateway, body.enabled);
    }
    return this.configs.listForAdmin();
  }

  @Post(':gateway/activate')
  @RequirePermissions('update_settings_payment')
  @Message('Active payment gateway updated')
  async activate(@Param('gateway') gateway: string) {
    await this.configs.setActiveGateway(gateway);
    return this.configs.listForAdmin();
  }
}
