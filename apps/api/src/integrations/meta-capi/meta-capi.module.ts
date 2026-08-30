import { Module } from '@nestjs/common';
import { MetaCapiService } from './meta-capi.service';

@Module({
  providers: [MetaCapiService],
  exports: [MetaCapiService],
})
export class MetaCapiModule {}
