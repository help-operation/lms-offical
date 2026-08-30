import { Global, Module } from '@nestjs/common';
import { InvoiceNumberService } from './invoice-number.service';

@Global()
@Module({
  providers: [InvoiceNumberService],
  exports: [InvoiceNumberService],
})
export class InvoiceNumberModule {}
