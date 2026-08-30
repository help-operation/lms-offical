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
import { MenusService } from './menus.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { RequirePermissions } from 'src/common/decorators/require-permissions.decorator';

@Controller('menus')
export class MenusController {
  constructor(private readonly svc: MenusService) {}

  // ─── Public ─────────────────────────────────────────────────────────────────

  @Get()
  async getPublic() {
    return this.svc.getPublicGrouped();
  }

  // ─── Admin ──────────────────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('view_menus')
  @Get('admin')
  async getAdmin() {
    return this.svc.getAdminGrouped();
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('create_menus')
  @Post()
  async create(
    @Body()
    body: {
      menu: string;
      label: string;
      url: string;
      isExternal?: boolean;
      openInNewTab?: boolean;
    },
  ) {
    return this.svc.create(body);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('update_menus')
  @Put('reorder')
  async reorder(@Body() body: { items: { id: number; order: number }[] }) {
    await this.svc.reorder(body.items);
    return { success: true };
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('update_menus')
  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    body: {
      label?: string;
      url?: string;
      isExternal?: boolean;
      openInNewTab?: boolean;
    },
  ) {
    return this.svc.update(id, body);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('update_menus')
  @Patch(':id/toggle')
  async toggle(@Param('id', ParseIntPipe) id: number) {
    return this.svc.toggle(id);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('delete_menus')
  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.svc.delete(id);
    return { success: true };
  }
}
