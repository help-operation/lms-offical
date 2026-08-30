import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { RequirePermissions } from 'src/common/decorators/require-permissions.decorator';
import { Message } from 'src/common/decorators/message.decorator';
import { RolesService, type RoleInput } from './roles.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get('roles')
  @RequirePermissions('view_roles')
  @Message('Roles fetched')
  listRoles() {
    return this.rolesService.list();
  }

  @Get('permissions')
  @RequirePermissions('view_roles')
  @Message('Permissions fetched')
  listPermissions() {
    return this.rolesService.getPermissionsGrouped();
  }

  @Get('roles/course-options')
  @RequirePermissions('view_roles')
  @Message('Course options fetched')
  getCourseOptions() {
    return this.rolesService.getCourseOptions();
  }

  @Get('roles/:id')
  @RequirePermissions('view_roles')
  @Message('Role fetched')
  getRole(@Param('id', ParseIntPipe) id: number) {
    return this.rolesService.findOne(id);
  }

  @Post('roles')
  @RequirePermissions('create_roles')
  @Message('Role created')
  createRole(@Body() body: RoleInput) {
    return this.rolesService.create(body);
  }

  @Put('roles/:id')
  @RequirePermissions('update_roles')
  @Message('Role updated')
  updateRole(@Param('id', ParseIntPipe) id: number, @Body() body: RoleInput) {
    return this.rolesService.update(id, body);
  }

  @Delete('roles/:id')
  @RequirePermissions('delete_roles')
  @Message('Role deleted')
  deleteRole(@Param('id', ParseIntPipe) id: number) {
    return this.rolesService.remove(id);
  }
}
