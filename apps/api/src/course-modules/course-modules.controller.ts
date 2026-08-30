import {
  Body,
  Controller,
  Delete,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Message } from 'src/common/decorators/message.decorator';
import { RequirePermissions } from 'src/common/decorators/require-permissions.decorator';
import { CurrentUser, type RequestUser } from 'src/common/decorators/current-user.decorator';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { CourseModulesService } from './course-modules.service';
import {
  CreateModuleDto,
  ReorderModulesDto,
  UpdateModuleDto,
} from './dto/module.dto';

const isAdmin = (user: RequestUser) => user.role === 'SUPER_ADMIN';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions('update_courses')
@Controller('course-builder')
export class CourseModulesController {
  constructor(private readonly svc: CourseModulesService) {}

  @Post('courses/:courseId/modules')
  @Message('Module created successfully')
  create(
    @Param('courseId', ParseIntPipe) courseId: number,
    @CurrentUser() user: RequestUser,
    @Body() dto: CreateModuleDto,
  ) {
    return this.svc.create(courseId, user.userId, dto, isAdmin(user));
  }

  @Put('modules/:id')
  @Message('Module updated successfully')
  update(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: RequestUser,
    @Body() dto: UpdateModuleDto,
  ) {
    return this.svc.update(id, user.userId, dto, isAdmin(user));
  }

  @Delete('modules/:id')
  @Message('Module deleted successfully')
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: RequestUser) {
    return this.svc.remove(id, user.userId, isAdmin(user));
  }

  @Patch('courses/:courseId/modules/reorder')
  @Message('Modules reordered successfully')
  reorder(
    @Param('courseId', ParseIntPipe) courseId: number,
    @CurrentUser() user: RequestUser,
    @Body() dto: ReorderModulesDto,
  ) {
    return this.svc.reorder(courseId, user.userId, dto, isAdmin(user));
  }
}
