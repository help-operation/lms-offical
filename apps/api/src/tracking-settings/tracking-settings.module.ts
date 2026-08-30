import { Module } from '@nestjs/common';
import { TrackingSettingsController } from './tracking-settings.controller';
import { TrackingSettingsService } from './tracking-settings.service';
import { TrackingItemsController } from './tracking-items.controller';
import { TrackingItemsService } from './tracking-items.service';

@Module({
  controllers: [TrackingSettingsController, TrackingItemsController],
  providers:   [TrackingSettingsService, TrackingItemsService],
  exports:     [TrackingSettingsService, TrackingItemsService],
})
export class TrackingSettingsModule {}
