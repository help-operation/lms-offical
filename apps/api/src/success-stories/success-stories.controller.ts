import {
  Body, Controller, Delete, Get, Param, ParseIntPipe,
  Patch, Post, Put, UseGuards,
} from '@nestjs/common';
import { SuccessStoriesService } from './success-stories.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { RequirePermissions } from 'src/common/decorators/require-permissions.decorator';
import { Message } from 'src/common/decorators/message.decorator';

@Controller('success-stories')
export class SuccessStoriesController {
  constructor(private readonly svc: SuccessStoriesService) {}

  // ─── Public ─────────────────────────────────────────────────────────────────

  @Get()
  @Message('Success stories fetched successfully')
  getPublic() {
    return this.svc.getPublic();
  }

  // ─── Admin ──────────────────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('view_success_stories')
  @Get('admin')
  @Message('Success stories fetched successfully')
  getAll() {
    return this.svc.getAll();
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('create_success_stories')
  @Post()
  @Message('Success story created')
  create(@Body() body: any) {
    return this.svc.create(body);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('update_success_stories')
  @Put('reorder')
  @Message('Reordered successfully')
  async reorder(@Body() body: { items: { id: number; order: number }[] }) {
    await this.svc.reorder(body.items);
    return { success: true };
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('update_success_stories')
  @Put(':id')
  @Message('Success story updated')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.svc.update(id, body);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('update_success_stories')
  @Patch(':id/toggle')
  @Message('Visibility toggled')
  toggle(@Param('id', ParseIntPipe) id: number) {
    return this.svc.toggle(id);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('delete_success_stories')
  @Delete(':id')
  @Message('Success story deleted')
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.svc.delete(id);
    return { success: true };
  }
}
