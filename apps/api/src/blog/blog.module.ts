import { Module } from '@nestjs/common';
import { BlogController } from './blog.controller';
import { BlogService } from './blog.service';
import { BlogSchedulerService } from './blog-scheduler.service';
import { ActivityLogsModule } from 'src/activity-logs/activity-logs.module';

@Module({
  imports: [ActivityLogsModule],
  controllers: [BlogController],
  providers: [BlogService, BlogSchedulerService],
})
export class BlogModule {}
