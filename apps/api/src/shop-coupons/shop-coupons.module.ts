import { Module } from '@nestjs/common';
import { ShopCouponsService } from './shop-coupons.service';
import { ShopCouponsController } from './shop-coupons.controller';

@Module({
  controllers: [ShopCouponsController],
  providers: [ShopCouponsService],
  exports: [ShopCouponsService],
})
export class ShopCouponsModule {}
