import { Module } from '@nestjs/common';
import { DbModule } from 'src/db/db.module';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [DbModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
