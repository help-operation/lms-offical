import {
  Body, Controller, Delete, Get, HttpCode, HttpStatus,
  Param, ParseIntPipe, Patch, Post, UseGuards,
} from '@nestjs/common';
import { InstructorApplicationsService } from './instructor-applications.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { RequirePermissions } from 'src/common/decorators/require-permissions.decorator';
import { Message } from 'src/common/decorators/message.decorator';

@Controller('instructor-applications')
export class InstructorApplicationsController {
  constructor(private readonly svc: InstructorApplicationsService) {}

  // ─── Public ─────────────────────────────────────────────────────────────────

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Message('Application submitted successfully')
  create(@Body() body: any) {
    return this.svc.create(body);
  }

  // ─── Admin ──────────────────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('view_applications')
  @Get('admin')
  @Message('Applications fetched')
  getAll() {
    return this.svc.getAll();
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('approve_applications')
  @Patch('admin/:id/approve')
  @Message('Application approved — instructor account created')
  approve(@Param('id', ParseIntPipe) id: number) {
    return this.svc.approve(id);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('reject_applications')
  @Patch('admin/:id/reject')
  @Message('Application rejected')
  reject(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { notes?: string },
  ) {
    return this.svc.reject(id, body.notes);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('delete_applications')
  @Delete('admin/:id')
  @HttpCode(HttpStatus.OK)
  @Message('Application deleted')
  async delete(@Param('id', ParseIntPipe) id: number) {
    return this.svc.delete(id);
  }
}
