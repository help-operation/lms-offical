import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { RequirePermissions } from 'src/common/decorators/require-permissions.decorator';
import { Message } from 'src/common/decorators/message.decorator';
import { CurrentUser, type RequestUser } from 'src/common/decorators/current-user.decorator';
import { CouponsService, CreateCouponDto, UpdateCouponDto } from './coupons.service';
import type { TableQueryInput } from 'src/common/utils/table-query.util';
import { ActivityLogsService } from 'src/activity-logs/activity-logs.service';

@Controller('admin/coupons')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions('view_coupons')
export class CouponsController {
  constructor(
    private readonly couponsService: CouponsService,
    private readonly activityLogs: ActivityLogsService,
  ) {}

  @Get()
  @Message('Coupons fetched')
  findAll(@Query() query: TableQueryInput) {
    return this.couponsService.findAll(query);
  }

  @Get('picker/courses')
  @Message('Picker courses fetched')
  pickerCourses() {
    return this.couponsService.pickerCourses();
  }

  @Get('picker/live-courses')
  @Message('Picker live courses fetched')
  pickerLiveCourses() {
    return this.couponsService.pickerLiveCourses();
  }

  @RequirePermissions('create_coupons')
  @Post()
  @Message('Coupon created')
  async create(
    @Body() dto: CreateCouponDto,
    @CurrentUser() actor: RequestUser,
  ) {
    const result = await this.couponsService.create(dto);
    void this.activityLogs.log({ adminUserId: actor.userId, action: 'coupon_created', entity: 'coupon', entityId: (result as any)?.id, meta: { code: dto.code } });
    return result;
  }

  @RequirePermissions('update_coupons')
  @Patch(':id')
  @Message('Coupon updated')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCouponDto,
    @CurrentUser() actor: RequestUser,
  ) {
    const result = await this.couponsService.update(id, dto);
    void this.activityLogs.log({ adminUserId: actor.userId, action: 'coupon_updated', entity: 'coupon', entityId: id });
    return result;
  }

  @RequirePermissions('delete_coupons')
  @Delete(':id')
  @Message('Coupon deleted')
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() actor: RequestUser,
  ) {
    const result = await this.couponsService.remove(id);
    void this.activityLogs.log({ adminUserId: actor.userId, action: 'coupon_deleted', entity: 'coupon', entityId: id });
    return result;
  }

  @RequirePermissions('update_coupons')
  @Post(':id/toggle')
  @Message('Coupon status toggled')
  async toggle(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() actor: RequestUser,
  ) {
    const result = await this.couponsService.toggle(id);
    void this.activityLogs.log({ adminUserId: actor.userId, action: 'coupon_toggled', entity: 'coupon', entityId: id });
    return result;
  }
}
