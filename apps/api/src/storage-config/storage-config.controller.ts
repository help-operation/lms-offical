import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { RequirePermissions } from 'src/common/decorators/require-permissions.decorator';
import { Message } from 'src/common/decorators/message.decorator';
import { StorageConfigService } from './storage-config.service';

@Controller('admin/storage-config')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class StorageConfigController {
  constructor(private readonly configs: StorageConfigService) {}

  @Get()
  @RequirePermissions('view_settings_configaction')
  @Message('Storage provider config fetched')
  list() {
    return this.configs.listForAdmin();
  }

  @Put(':provider')
  @RequirePermissions('update_settings_configaction')
  @Message('Storage provider config updated')
  async update(
    @Param('provider') provider: string,
    @Body() body: { credentials?: Record<string, string> },
  ) {
    if (body.credentials) {
      await this.configs.updateCredentials(provider, body.credentials);
    }
    return this.configs.listForAdmin();
  }
}
