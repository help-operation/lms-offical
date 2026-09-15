import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common';
import { BackupService } from './backup.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { RequirePermissions } from 'src/common/decorators/require-permissions.decorator';
import { Message } from 'src/common/decorators/message.decorator';

@Controller('admin/backup')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class BackupController {
  constructor(private readonly backupService: BackupService) {}

  @Get()
  @RequirePermissions('view_settings_configaction')
  @Message('Backup history fetched')
  list(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.backupService.listBackups(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Get('tables')
  @RequirePermissions('view_settings_configaction')
  @Message('Tables fetched')
  listTables() {
    return this.backupService.listTables();
  }

  @Get(':id')
  @RequirePermissions('view_settings_configaction')
  @Message('Backup job fetched')
  getOne(@Param('id', ParseIntPipe) id: number) {
    return this.backupService.getBackup(id);
  }

  @Post('full')
  @RequirePermissions('update_settings_configaction')
  @Message('Full backup started')
  triggerFull() {
    // createdBy will be set from JWT in a real implementation
    return this.backupService.triggerFullBackup(null);
  }

  @Post('selective')
  @RequirePermissions('update_settings_configaction')
  @Message('Selective backup started')
  triggerSelective(@Body() body: { tables: string[] }) {
    return this.backupService.triggerSelectiveBackup(body.tables ?? [], null);
  }

  @Delete(':id')
  @RequirePermissions('update_settings_configaction')
  @Message('Backup deleted')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.backupService.deleteBackup(id);
  }
}
