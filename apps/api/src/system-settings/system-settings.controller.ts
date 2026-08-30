import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SystemSettingsService } from './system-settings.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { SystemSettingsPermissionGuard } from './system-settings-permission.guard';
import { Message } from 'src/common/decorators/message.decorator';

@Controller('system-settings')
export class SystemSettingsController {
  constructor(private readonly service: SystemSettingsService) {}

  // Public — fetch specific keys (e.g. footer settings for web frontend)
  @Get('public')
  @Message('Settings fetched successfully')
  async getPublic(@Query('keys') keys: string) {
    const keyList = keys ? keys.split(',').map((k) => k.trim()) : [];
    return this.service.getByKeys(keyList);
  }

  // Admin — get all settings (any settings-tab view permission)
  @UseGuards(JwtAuthGuard, SystemSettingsPermissionGuard)
  @Get()
  @Message('Settings fetched successfully')
  async getAll() {
    return this.service.getAll();
  }

  // Admin — update a single setting (per-tab via key prefix)
  @UseGuards(JwtAuthGuard, SystemSettingsPermissionGuard)
  @Put(':key')
  @HttpCode(HttpStatus.OK)
  @Message('Setting updated successfully')
  async updateOne(
    @Param('key') key: string,
    @Body('value') value: string,
  ) {
    await this.service.set(key, value);
    return { key, value };
  }

  // Admin — bulk update (for form saves; per-tab via the keys present)
  @UseGuards(JwtAuthGuard, SystemSettingsPermissionGuard)
  @Put()
  @HttpCode(HttpStatus.OK)
  @Message('Settings updated successfully')
  async updateMany(@Body() body: Record<string, string>) {
    await this.service.setMany(body);
    return body;
  }
}
