import { Module } from '@nestjs/common';
import { PaymentGatewayConfigsService } from './payment-gateway-configs.service';
import { PaymentGatewayConfigsController } from './payment-gateway-configs.controller';
import { CredentialEncryptionService } from 'src/common/crypto/credential-encryption.service';

// Leaf module — DB-backed source of truth for every gateway's credentials
// and which one is active. Imported by PaymentsModule so PaystationService/
// BkashService/PaymentGatewayService can read from it.
@Module({
  controllers: [PaymentGatewayConfigsController],
  providers: [PaymentGatewayConfigsService, CredentialEncryptionService],
  exports: [PaymentGatewayConfigsService],
})
export class PaymentGatewayConfigsModule {}
