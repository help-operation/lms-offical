import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { RequirePermissions } from 'src/common/decorators/require-permissions.decorator';
import { Message } from 'src/common/decorators/message.decorator';
import { ActivityLogsService } from './activity-logs.service';
import type { TableQueryInput } from 'src/common/utils/table-query.util';

@Controller('admin/activity-logs')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions('view_activity_log')
export class ActivityLogsController {
  constructor(private readonly activityLogsService: ActivityLogsService) {}

  @Get()
  @Message('Activity logs fetched')
  listAll(@Query() query: TableQueryInput) {
    return this.activityLogsService.listAll(query);
  }
}
