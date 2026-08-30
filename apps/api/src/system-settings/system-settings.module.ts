import { Module } from '@nestjs/common';
import { SystemSettingsService } from './system-settings.service';
import { SystemSettingsController } from './system-settings.controller';
import { SystemSettingsPermissionGuard } from './system-settings-permission.guard';

@Module({
  controllers: [SystemSettingsController],
  providers: [SystemSettingsService, SystemSettingsPermissionGuard],
  exports: [SystemSettingsService],
})
export class SystemSettingsModule {}
