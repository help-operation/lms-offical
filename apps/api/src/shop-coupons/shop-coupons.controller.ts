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
import { ShopCouponsService } from './shop-coupons.service';
import type { CreateShopCouponDto, UpdateShopCouponDto } from './shop-coupons.service';

@Controller('admin/shop/coupons')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions('view_shop_coupons')
export class ShopCouponsController {
  constructor(private readonly shopCouponsService: ShopCouponsService) {}

  @Get()
  @Message('Shop coupons fetched')
  findAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.shopCouponsService.findAll(Number(page ?? 1), Number(limit ?? 20));
  }

  @Get(':id')
  @Message('Coupon fetched')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.shopCouponsService.findOne(id);
  }

  @RequirePermissions('create_shop_coupons')
  @Post()
  @Message('Coupon created')
  create(@Body() dto: CreateShopCouponDto) {
    return this.shopCouponsService.create(dto);
  }

  @RequirePermissions('update_shop_coupons')
  @Patch(':id')
  @Message('Coupon updated')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateShopCouponDto) {
    return this.shopCouponsService.update(id, dto);
  }

  @RequirePermissions('delete_shop_coupons')
  @Delete(':id')
  @Message('Coupon deleted')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.shopCouponsService.remove(id);
  }

  @RequirePermissions('update_shop_coupons')
  @Post(':id/toggle')
  @Message('Coupon status toggled')
  toggle(@Param('id', ParseIntPipe) id: number) {
    return this.shopCouponsService.toggle(id);
  }
}
