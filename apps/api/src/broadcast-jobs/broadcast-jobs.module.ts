import { Module } from '@nestjs/common';
import { BroadcastJobsService } from './broadcast-jobs.service';
import { BroadcastJobsController } from './broadcast-jobs.controller';
import { DbModule } from 'src/db/db.module';

@Module({
  imports: [DbModule],
  controllers: [BroadcastJobsController],
  providers: [BroadcastJobsService],
  exports: [BroadcastJobsService],
})
export class BroadcastJobsModule {}
