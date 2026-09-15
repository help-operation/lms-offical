import {
  Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Query,
  UseGuards, BadRequestException,
} from '@nestjs/common';
import { BackupService } from './backup.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { RequirePermissions } from 'src/common/decorators/require-permissions.decorator';
import { Message } from 'src/common/decorators/message.decorator';
import type { ConflictStrategy } from './backup-categories';

@Controller('admin/backup')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class BackupController {
  constructor(private readonly backupService: BackupService) {}

  // ─── List ──────────────────────────────────────────────────────────────────

  @Get()
  @RequirePermissions('view_settings_configaction')
  @Message('Backup history fetched')
  list(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.backupService.listBackups(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  // ─── Categories ────────────────────────────────────────────────────────────

  @Get('categories')
  @RequirePermissions('view_settings_configaction')
  @Message('Backup categories fetched')
  listCategories() {
    return this.backupService.listCategories();
  }

  // ─── Tables ────────────────────────────────────────────────────────────────

  @Get('tables')
  @RequirePermissions('view_settings_configaction')
  @Message('Tables fetched')
  listTables() {
    return this.backupService.listTables();
  }

  // ─── Single job ────────────────────────────────────────────────────────────

  @Get(':id')
  @RequirePermissions('view_settings_configaction')
  @Message('Backup job fetched')
  getOne(@Param('id', ParseIntPipe) id: number) {
    return this.backupService.getBackup(id);
  }

  // ─── Trigger full backup ───────────────────────────────────────────────────

  @Post('full')
  @RequirePermissions('update_settings_configaction')
  @Message('Full backup started')
  triggerFull() {
    return this.backupService.triggerFullBackup(null);
  }

  // ─── Trigger category backup ───────────────────────────────────────────────

  @Post('category')
  @RequirePermissions('update_settings_configaction')
  @Message('Category backup started')
  triggerCategory(@Body('categoryId') categoryId: unknown) {
    if (typeof categoryId !== 'string' || !categoryId) {
      throw new BadRequestException('categoryId must be a non-empty string');
    }
    return this.backupService.triggerCategoryBackup(categoryId, null);
  }

  // ─── Trigger selective backup ──────────────────────────────────────────────

  @Post('selective')
  @RequirePermissions('update_settings_configaction')
  @Message('Selective backup started')
  triggerSelective(@Body('tables') tables: unknown) {
    if (!Array.isArray(tables) || tables.length === 0 || !tables.every((t) => typeof t === 'string')) {
      throw new BadRequestException('tables must be a non-empty array of strings');
    }
    return this.backupService.triggerSelectiveBackup(tables as string[], null);
  }

  // ─── Import: dry-run preview ───────────────────────────────────────────────

  @Post(':id/dry-run')
  @RequirePermissions('update_settings_configaction')
  @Message('Dry-run preview generated')
  dryRun(@Param('id', ParseIntPipe) id: number) {
    return this.backupService.dryRunImport(id);
  }

  // ─── Import: execute restore ───────────────────────────────────────────────

  @Post(':id/import')
  @RequirePermissions('update_settings_configaction')
  @Message('Import started')
  importBackup(
    @Param('id', ParseIntPipe) id: number,
    @Body('conflictStrategy') strategy: unknown,
  ) {
    if (!strategy || !['skip', 'overwrite', 'merge'].includes(strategy as string)) {
      throw new BadRequestException('conflictStrategy must be skip, overwrite, or merge');
    }
    return this.backupService.importBackup(id, strategy as ConflictStrategy, null);
  }

  // ─── Delete ────────────────────────────────────────────────────────────────

  @Delete(':id')
  @RequirePermissions('update_settings_configaction')
  @Message('Backup deleted')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.backupService.deleteBackup(id);
  }
}
