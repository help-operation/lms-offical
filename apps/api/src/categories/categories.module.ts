import { Module } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import {
  AdminCategoriesController,
  PublicCategoriesController,
} from './categories.controller';

import { ActivityLogsModule } from 'src/activity-logs/activity-logs.module';

@Module({
  imports: [ActivityLogsModule],
  controllers: [PublicCategoriesController, AdminCategoriesController],
  providers: [CategoriesService],
  exports: [CategoriesService],
})
export class CategoriesModule {}
