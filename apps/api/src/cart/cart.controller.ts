import {
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CurrentUser, type RequestUser } from 'src/common/decorators/current-user.decorator';
import { Message } from 'src/common/decorators/message.decorator';
import { CartService } from './cart.service';

@Controller('cart')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('STUDENT', 'GUEST')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @Message('Cart fetched')
  getCart(@CurrentUser() user: RequestUser) {
    return this.cartService.getCart(user.userId);
  }

  @Post(':courseId')
  @Message('Added to cart')
  addToCart(
    @CurrentUser() user: RequestUser,
    @Param('courseId', ParseIntPipe) courseId: number,
  ) {
    return this.cartService.addToCart(user.userId, courseId);
  }

  @Delete(':courseId')
  @Message('Removed from cart')
  removeFromCart(
    @CurrentUser() user: RequestUser,
    @Param('courseId', ParseIntPipe) courseId: number,
  ) {
    return this.cartService.removeFromCart(user.userId, courseId);
  }

  @Delete()
  @Message('Cart cleared')
  clearCart(@CurrentUser() user: RequestUser) {
    return this.cartService.clearCart(user.userId);
  }
}
