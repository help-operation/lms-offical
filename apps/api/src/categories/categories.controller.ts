import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Message } from 'src/common/decorators/message.decorator';
import { Public } from 'src/common/decorators/public.decorator';
import { RequirePermissions } from 'src/common/decorators/require-permissions.decorator';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { CurrentUser, type RequestUser } from 'src/common/decorators/current-user.decorator';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import type { TableQueryInput } from 'src/common/utils/table-query.util';
import { ActivityLogsService } from 'src/activity-logs/activity-logs.service';

// ─── Public ───────────────────────────────────────────────────────────────────

@Controller('categories')
export class PublicCategoriesController {
  constructor(private readonly svc: CategoriesService) {}

  @Get()
  @Public()
  @Message('Categories fetched successfully')
  findAll() {
    return this.svc.findAll();
  }
}

// ─── Admin ────────────────────────────────────────────────────────────────────

@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions('view_categories')
@Controller('admin/categories')
export class AdminCategoriesController {
  constructor(
    private readonly svc: CategoriesService,
    private readonly activityLogs: ActivityLogsService,
  ) {}

  @Get()
  @Message('All categories fetched successfully')
  findAll(@Query() query: TableQueryInput) {
    return this.svc.findAllAdmin(query);
  }

  @RequirePermissions('create_categories')
  @Post()
  @Message('Category created successfully')
  async create(
    @Body() dto: CreateCategoryDto,
    @CurrentUser() actor: RequestUser,
  ) {
    const result = await this.svc.create(dto);
    void this.activityLogs.log({ adminUserId: actor.userId, action: 'category_created', entity: 'category', entityId: (result as any)?.id, meta: { name: dto.name } });
    return result;
  }

  @RequirePermissions('update_categories')
  @Put(':id')
  @Message('Category updated successfully')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCategoryDto,
    @CurrentUser() actor: RequestUser,
  ) {
    const result = await this.svc.update(id, dto);
    void this.activityLogs.log({ adminUserId: actor.userId, action: 'category_updated', entity: 'category', entityId: id });
    return result;
  }

  @RequirePermissions('delete_categories')
  @Delete(':id')
  @Message('Category deleted successfully')
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() actor: RequestUser,
  ) {
    const result = await this.svc.remove(id);
    void this.activityLogs.log({ adminUserId: actor.userId, action: 'category_deleted', entity: 'category', entityId: id });
    return result;
  }

  @RequirePermissions('update_categories')
  @Post(':id/toggle')
  @Message('Category status toggled')
  async toggle(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() actor: RequestUser,
  ) {
    const result = await this.svc.toggleActive(id);
    void this.activityLogs.log({ adminUserId: actor.userId, action: 'category_toggled', entity: 'category', entityId: id });
    return result;
  }
}
