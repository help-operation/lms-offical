import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { BlogService } from './blog.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser, type RequestUser } from '../common/decorators/current-user.decorator';
import type { TableQueryInput } from '../common/utils/table-query.util';

@Controller('blog')
export class BlogController {
  constructor(private svc: BlogService) {}

  @Get()
  @Public()
  list(
    @Query('search') search?: string,
    @Query('categoryId') categoryId?: string,
  ) {
    return this.svc.listPublished(search, categoryId ? parseInt(categoryId, 10) : undefined);
  }

  @Get('categories')
  @Public()
  categories() {
    return this.svc.categories();
  }

  @Post('categories')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('create_blog_categories')
  createCategory(@Body() body: { name: string }) {
    return this.svc.createCategory(body.name);
  }

  @Put('categories/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('update_blog_categories')
  updateCategory(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { name: string },
  ) {
    return this.svc.updateCategory(id, body.name);
  }

  @Delete('categories/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('delete_blog_categories')
  deleteCategory(@Param('id', ParseIntPipe) id: number) {
    return this.svc.deleteCategory(id);
  }

  @Get('admin/posts')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('view_blog')
  listAll(@Query() query: TableQueryInput) {
    return this.svc.listAll(query);
  }

  @Get('admin/comments')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('view_blog_comments')
  listAllComments(@Query('search') search?: string) {
    return this.svc.listAllComments(search);
  }

  @Delete('admin/comments/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('delete_blog_comments')
  deleteCommentAdmin(@Param('id', ParseIntPipe) id: number) {
    return this.svc.deleteCommentAdmin(id);
  }

  @Get('admin/posts/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('view_blog')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.svc.findByIdAdmin(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('create_blog')
  create(
    @CurrentUser() user: RequestUser,
    @Body() body: { title: string; excerpt?: string; content?: string; thumbnail?: string; categoryId?: number; publish?: boolean },
  ) {
    return this.svc.create(user.userId, body);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('update_blog')
  update(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { title?: string; slug?: string; excerpt?: string; content?: string; thumbnail?: string; categoryId?: number | null; publish?: boolean },
  ) {
    return this.svc.update(id, user.userId, user.role, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('delete_blog')
  remove(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.svc.remove(id, user.userId, user.role);
  }

  // ── Shares ───────────────────────────────────────────────────────────────────

  @Post(':id/share')
  @Public()
  trackShare(@Param('id', ParseIntPipe) id: number) {
    return this.svc.trackShare(id);
  }

  // ── Likes ────────────────────────────────────────────────────────────────────

  @Get(':postId/likes')
  @Public()
  getLikes(@Param('postId', ParseIntPipe) postId: number) {
    return this.svc.getLikeStatus(postId);
  }

  @Get(':postId/my-like')
  @UseGuards(JwtAuthGuard)
  getMyLike(
    @Param('postId', ParseIntPipe) postId: number,
    @CurrentUser() user: RequestUser,
  ) {
    return this.svc.getMyLike(postId, user.userId);
  }

  @Post(':postId/like')
  @UseGuards(JwtAuthGuard)
  toggleLike(
    @Param('postId', ParseIntPipe) postId: number,
    @CurrentUser() user: RequestUser,
  ) {
    return this.svc.toggleLike(postId, user.userId);
  }

  // ── Comments ─────────────────────────────────────────────────────────────────

  @Get(':postId/comments')
  @Public()
  getComments(@Param('postId', ParseIntPipe) postId: number) {
    return this.svc.getComments(postId);
  }

  @Post(':postId/comments')
  @UseGuards(JwtAuthGuard)
  createComment(
    @Param('postId', ParseIntPipe) postId: number,
    @CurrentUser() user: RequestUser,
    @Body() body: { content: string; parentId?: number },
  ) {
    return this.svc.createComment(postId, user.userId, body);
  }

  @Delete(':postId/comments/:commentId')
  @UseGuards(JwtAuthGuard)
  deleteComment(
    @Param('postId', ParseIntPipe) postId: number,
    @Param('commentId', ParseIntPipe) commentId: number,
    @CurrentUser() user: RequestUser,
  ) {
    return this.svc.deleteComment(commentId, user.userId, user.role);
  }

  // ── Public slug (keep last — single-segment wildcard) ────────────────────────

  @Get(':slug')
  @Public()
  getBySlug(@Param('slug') slug: string) {
    return this.svc.findBySlug(slug);
  }
}
