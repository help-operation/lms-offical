import {
  Body, Controller, Delete, Get, Param,
  ParseIntPipe, Patch, Post, UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { RequirePermissions } from 'src/common/decorators/require-permissions.decorator';
import { Message } from 'src/common/decorators/message.decorator';
import { LiveCourseBatchesService } from './live-course-batches.service';

@Controller('admin/live-courses/:courseId/batches')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions('update_live')
export class LiveCourseBatchesController {
  constructor(private readonly service: LiveCourseBatchesService) {}

  @Get()
  @RequirePermissions('view_live')
  @Message('Batches fetched')
  list(@Param('courseId', ParseIntPipe) courseId: number) {
    return this.service.listByCourse(courseId);
  }

  @Post()
  @Message('Batch created')
  create(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Body() body: {
      batchName: string;
      status?: 'upcoming' | 'active' | 'ended';
      startDate?: string;
      endDate?: string;
      schedule?: string;
      supportSchedule?: string;
      maxSeats?: number;
      countdownEnd?: string;
      notes?: string;
    },
  ) {
    return this.service.create(courseId, body);
  }

  @Patch(':batchId')
  @Message('Batch updated')
  update(
    @Param('batchId', ParseIntPipe) batchId: number,
    @Body() body: {
      batchName?: string;
      status?: 'upcoming' | 'active' | 'ended';
      startDate?: string | null;
      endDate?: string | null;
      schedule?: string | null;
      supportSchedule?: string | null;
      maxSeats?: number | null;
      countdownEnd?: string | null;
      notes?: string | null;
    },
  ) {
    return this.service.update(batchId, body);
  }

  @Delete(':batchId')
  @Message('Batch deleted')
  delete(@Param('batchId', ParseIntPipe) batchId: number) {
    return this.service.delete(batchId);
  }
}
