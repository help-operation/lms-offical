import { Module } from '@nestjs/common';
import { LiveClassesController } from './live-classes.controller';
import { LiveClassesService } from './live-classes.service';

@Module({
  controllers: [LiveClassesController],
  providers: [LiveClassesService],
})
export class LiveClassesModule {}
