import { Module } from '@nestjs/common';
import { BunnyStreamService } from './bunny-stream.service';
import { StorageConfigModule } from 'src/storage-config/storage-config.module';

@Module({
  imports: [StorageConfigModule],
  providers: [BunnyStreamService],
  exports: [BunnyStreamService],
})
export class BunnyStreamModule {}
