import { Body, Controller, Get, HttpCode, HttpStatus, Patch, UseGuards } from '@nestjs/common';
import { TrackingItemsService } from './tracking-items.service';
import { UpdateTrackingItemSchema, BulkUpdateTrackingItemsSchema } from '@repo/validators';
import { createZodDto } from 'nestjs-zod';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { RequirePermissions } from 'src/common/decorators/require-permissions.decorator';

class UpdateTrackingItemDto extends createZodDto(UpdateTrackingItemSchema) {}
class BulkUpdateTrackingItemsDto extends createZodDto(BulkUpdateTrackingItemsSchema) {}

@Controller('tracking-items')
export class TrackingItemsController {
  constructor(private readonly service: TrackingItemsService) {}

  /** Public — web frontend fetches this to decide which scripts/events to fire. */
  @Get()
  @HttpCode(HttpStatus.OK)
  getPublic() {
    return this.service.listPublic();
  }

  /** Admin-only — includes secret config fields (e.g. FB CAPI token) for the settings form. */
  @Get('admin')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('update_settings_tracking')
  @HttpCode(HttpStatus.OK)
  getForAdmin() {
    return this.service.list();
  }

  /** Admin-only — toggle/reconfigure a single registry item. */
  @Patch()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('update_settings_tracking')
  @HttpCode(HttpStatus.OK)
  update(@Body() dto: UpdateTrackingItemDto) {
    return this.service.update(dto);
  }

  /** Admin-only — toggle/reconfigure multiple registry items in one request (checkbox-grid save). */
  @Patch('bulk')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('update_settings_tracking')
  @HttpCode(HttpStatus.OK)
  bulkUpdate(@Body() dto: BulkUpdateTrackingItemsDto) {
    return this.service.bulkUpdate(dto.items);
  }
}
