import { Module } from '@nestjs/common';
import { ShopProductsService } from './shop-products.service';
import { ShopProductsController, ShopProductsPublicController } from './shop-products.controller';

@Module({
  controllers: [ShopProductsPublicController, ShopProductsController],
  providers: [ShopProductsService],
  exports: [ShopProductsService],
})
export class ShopProductsModule {}
