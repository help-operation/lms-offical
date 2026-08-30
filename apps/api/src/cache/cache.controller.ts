import {
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { RequirePermissions } from 'src/common/decorators/require-permissions.decorator';
import { Message } from 'src/common/decorators/message.decorator';
import { RevalidationService } from 'src/common/revalidation/revalidation.service';

/**
 * Manual cache controls for the admin dashboard — the "Purge All" button.
 * Gated behind the general-settings update permission (SUPER_ADMIN bypasses).
 */
@Controller('cache')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions('update_settings_general')
export class CacheController {
  constructor(private readonly revalidation: RevalidationService) {}

  @Post('purge-all')
  @HttpCode(HttpStatus.OK)
  @Message('Cache purge requested')
  async purgeAll() {
    return this.revalidation.purgeAll();
  }
}
