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
import { WishlistService } from './wishlist.service';

@Controller('wishlist')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('STUDENT', 'GUEST')
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get()
  @Message('Wishlist fetched')
  getWishlist(@CurrentUser() user: RequestUser) {
    return this.wishlistService.getWishlist(user.userId);
  }

  @Post(':courseId')
  @Message('Added to wishlist')
  add(
    @CurrentUser() user: RequestUser,
    @Param('courseId', ParseIntPipe) courseId: number,
  ) {
    return this.wishlistService.add(user.userId, courseId);
  }

  @Delete(':courseId')
  @Message('Removed from wishlist')
  remove(
    @CurrentUser() user: RequestUser,
    @Param('courseId', ParseIntPipe) courseId: number,
  ) {
    return this.wishlistService.remove(user.userId, courseId);
  }
}
