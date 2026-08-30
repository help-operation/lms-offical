import { Module } from '@nestjs/common';
import { BlogController } from './blog.controller';
import { BlogService } from './blog.service';
import { ActivityLogsModule } from 'src/activity-logs/activity-logs.module';

@Module({
  imports: [ActivityLogsModule],
  controllers: [BlogController],
  providers: [BlogService],
})
export class BlogModule {}
