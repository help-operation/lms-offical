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
import { Public } from 'src/common/decorators/public.decorator';
import { Message } from 'src/common/decorators/message.decorator';
import { ShopProductsService } from './shop-products.service';
import type { CreateShopProductDto, UpdateShopProductDto } from './shop-products.service';
import type { TableQueryInput } from 'src/common/utils/table-query.util';

/** Public product endpoints (no auth required) */
@Controller('shop/products')
export class ShopProductsPublicController {
  constructor(private readonly shopProductsService: ShopProductsService) {}

  @Public()
  @Get()
  @Message('Products fetched')
  findAll() {
    return this.shopProductsService.findAllPublic();
  }

  @Public()
  @Get(':slug')
  @Message('Product fetched')
  findOne(@Param('slug') slug: string) {
    return this.shopProductsService.findBySlugPublic(slug);
  }
}

/** Admin product management endpoints */
@Controller('admin/shop/products')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions('view_shop_products')
export class ShopProductsController {
  constructor(private readonly shopProductsService: ShopProductsService) {}

  @Get()
  @Message('Products fetched')
  findAll(@Query() query: TableQueryInput) {
    return this.shopProductsService.findAll(query);
  }

  @Get(':id')
  @Message('Product fetched')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.shopProductsService.findOne(id);
  }

  @RequirePermissions('create_shop_products')
  @Post()
  @Message('Product created')
  create(@Body() dto: CreateShopProductDto) {
    return this.shopProductsService.create(dto);
  }

  @RequirePermissions('update_shop_products')
  @Patch(':id')
  @Message('Product updated')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateShopProductDto) {
    return this.shopProductsService.update(id, dto);
  }

  @RequirePermissions('delete_shop_products')
  @Delete(':id')
  @Message('Product deleted')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.shopProductsService.remove(id);
  }

  @RequirePermissions('update_shop_products')
  @Post(':id/toggle')
  @Message('Product status toggled')
  toggle(@Param('id', ParseIntPipe) id: number) {
    return this.shopProductsService.toggle(id);
  }
}
