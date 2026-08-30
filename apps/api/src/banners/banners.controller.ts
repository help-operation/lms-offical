import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { BannersService } from './banners.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { RequirePermissions } from 'src/common/decorators/require-permissions.decorator';

@Controller('banners')
export class BannersController {
  constructor(private readonly svc: BannersService) {}

  // ─── Public ─────────────────────────────────────────────────────────────────

  @Get()
  getPublic() {
    return this.svc.getPublicGrouped();
  }

  // ─── Admin ──────────────────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('view_banners')
  @Get('admin')
  getAdmin() {
    return this.svc.getAdminGrouped();
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('create_banners')
  @Post()
  create(@Body() body: any) {
    return this.svc.create(body);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('update_banners')
  @Put('reorder')
  async reorder(@Body() body: { items: { id: number; order: number }[] }) {
    await this.svc.reorder(body.items);
    return { success: true };
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('update_banners')
  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.svc.update(id, body);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('update_banners')
  @Patch(':id/toggle')
  toggle(@Param('id', ParseIntPipe) id: number) {
    return this.svc.toggle(id);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('delete_banners')
  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.svc.delete(id);
    return { success: true };
  }
}
