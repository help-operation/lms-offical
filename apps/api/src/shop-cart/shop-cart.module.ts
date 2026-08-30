import { Module } from '@nestjs/common';
import { ShopCartService } from './shop-cart.service';
import { ShopCartController } from './shop-cart.controller';

@Module({
  controllers: [ShopCartController],
  providers: [ShopCartService],
  exports: [ShopCartService],
})
export class ShopCartModule {}
