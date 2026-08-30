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
import { OptionalJwtAuthGuard } from 'src/auth/optional-jwt-auth.guard';
import { CurrentUser, type RequestUser } from 'src/common/decorators/current-user.decorator';
import { Message } from 'src/common/decorators/message.decorator';
import { ShopCartService } from './shop-cart.service';

@Controller('shop/cart')
@UseGuards(OptionalJwtAuthGuard)
export class ShopCartController {
  constructor(private readonly shopCartService: ShopCartService) {}

  @Get()
  @Message('Cart fetched')
  getCart(@CurrentUser() user: RequestUser | null, @Query('sessionId') sessionId?: string) {
    return this.shopCartService.getCart(user?.userId, sessionId);
  }

  @Post()
  @Message('Item added to cart')
  addToCart(
    @CurrentUser() user: RequestUser | null,
    @Query('sessionId') sessionId: string | undefined,
    @Body() body: { productId: number; quantity?: number },
  ) {
    return this.shopCartService.addToCart(
      body.productId,
      body.quantity ?? 1,
      user?.userId,
      sessionId,
    );
  }

  @Patch(':id')
  @Message('Cart updated')
  updateQuantity(
    @CurrentUser() user: RequestUser | null,
    @Query('sessionId') sessionId: string | undefined,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { quantity: number },
  ) {
    return this.shopCartService.updateQuantity(id, body.quantity, user?.userId, sessionId);
  }

  @Delete(':id')
  @Message('Item removed from cart')
  removeFromCart(
    @CurrentUser() user: RequestUser | null,
    @Query('sessionId') sessionId: string | undefined,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.shopCartService.removeFromCart(id, user?.userId, sessionId);
  }

  @Delete()
  @Message('Cart cleared')
  clearCart(@CurrentUser() user: RequestUser | null, @Query('sessionId') sessionId?: string) {
    return this.shopCartService.clearCart(user?.userId, sessionId);
  }

  @Post('merge')
  @UseGuards(JwtAuthGuard)
  @Message('Cart merged')
  mergeCart(@CurrentUser() user: RequestUser, @Body() body: { sessionId: string }) {
    return this.shopCartService.mergeGuestCart(body.sessionId, user.userId);
  }
}
