import { Module } from '@nestjs/common';
import { DbModule } from 'src/db/db.module';
import { TrackingController } from './tracking.controller';
import { TrackingService } from './tracking.service';

@Module({
  imports: [DbModule],
  controllers: [TrackingController],
  providers: [TrackingService],
})
export class TrackingModule {}
