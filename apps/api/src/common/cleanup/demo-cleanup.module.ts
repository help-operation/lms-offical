import { Module } from '@nestjs/common';
import { DbModule } from 'src/db/db.module';
import { DemoDataCleanupService } from './demo-cleanup.service';

@Module({
  imports: [DbModule],
  providers: [DemoDataCleanupService],
})
export class DemoDataCleanupModule {}
