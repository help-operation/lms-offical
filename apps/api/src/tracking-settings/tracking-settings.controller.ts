import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { TrackingSettingsService } from './tracking-settings.service';
import type { TrackingSettingsDto } from './tracking-settings.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { RequirePermissions } from 'src/common/decorators/require-permissions.decorator';

@Controller('tracking-settings')
export class TrackingSettingsController {
  constructor(private readonly service: TrackingSettingsService) {}

  /** Public — web frontend fetches this to inject scripts */
  @Get()
  @HttpCode(HttpStatus.OK)
  getPublic() {
    return this.service.findOrCreatePublic();
  }

  /** Admin-only — includes secrets (CAPI access token) for the settings form */
  @Get('admin')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('update_settings_tracking')
  @HttpCode(HttpStatus.OK)
  getForAdmin() {
    return this.service.findOrCreate();
  }

  /** Admin-only — save tracking IDs */
  @Patch()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('update_settings_tracking')
  @HttpCode(HttpStatus.OK)
  update(@Body() dto: TrackingSettingsDto) {
    return this.service.update(dto);
  }
}
