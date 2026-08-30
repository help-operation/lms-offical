import { Module } from '@nestjs/common';
import { LessonsService } from './lessons.service';
import {
  LessonsController,
  LessonsPlaybackController,
  PublicLessonsController,
} from './lessons.controller';
import { BunnyStreamModule } from 'src/bunny-stream/bunny-stream.module';

@Module({
  imports: [BunnyStreamModule],
  controllers: [
    LessonsController,
    LessonsPlaybackController,
    PublicLessonsController,
  ],
  providers: [LessonsService],
  exports: [LessonsService],
})
export class LessonsModule {}
