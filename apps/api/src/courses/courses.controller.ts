import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Message } from 'src/common/decorators/message.decorator';
import { RequirePermissions } from 'src/common/decorators/require-permissions.decorator';
import { CurrentUser, type RequestUser } from 'src/common/decorators/current-user.decorator';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { CoursesService } from './courses.service';
import { CreateCourseDto, UpdateCourseDto } from './dto/course.dto';

const isAdmin = (user: RequestUser) => user.role === 'SUPER_ADMIN';

// ─── Public ───────────────────────────────────────────────────────────────────

@Controller('courses')
export class PublicCoursesController {
  constructor(private readonly svc: CoursesService) {}

  @Get()
  @Message('Courses fetched successfully')
  findAll(
    @Query('categoryId') categoryId?: string,
    @Query('level') level?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('featured') featured?: string,
    @Query('pricing') pricing?: string,
    @Query('type') type?: string,
  ) {
    return this.svc.findAllPublished({
      categoryId: categoryId ? parseInt(categoryId) : undefined,
      level,
      search,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 12,
      featured: featured === 'true' || featured === '1' ? true : undefined,
      pricing: pricing === 'free' || pricing === 'paid' ? pricing : undefined,
      type: type === 'live' || type === 'recorded' ? type : undefined,
    });
  }

  @Get('search')
  @Message('Search results fetched')
  search(@Query('q') q: string) {
    return this.svc.findAllPublished({ search: q });
  }

  @Get('all-mixed')
  @Message('Mixed courses fetched successfully')
  findAllMixed(
    @Query('limit') limit?: string,
    @Query('sort_order') sortOrder?: string,
  ) {
    return this.svc.findAllMixed(
      limit ? Math.min(Math.max(parseInt(limit), 4), 100) : 8,
      sortOrder ?? 'newest',
    );
  }

  @Get(':slug')
  @Message('Course fetched successfully')
  findOne(@Param('slug') slug: string) {
    return this.svc.findBySlugPublic(slug);
  }

  @Get(':id/curriculum')
  @Message('Curriculum fetched successfully')
  curriculum(@Param('id', ParseIntPipe) id: number) {
    return this.svc.getCurriculum(id);
  }

  @Get('reviews/featured')
  @Message('Featured reviews fetched successfully')
  featuredReviews() {
    return this.svc.getFeaturedReviews();
  }

  @Get(':id/reviews')
  @Message('Reviews fetched successfully')
  reviews(@Param('id', ParseIntPipe) id: number) {
    return this.svc.getReviews(id);
  }

  @Post(':id/reviews')
  @UseGuards(JwtAuthGuard)
  @Message('Review submitted successfully')
  submitReview(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: RequestUser,
    @Body() body: { rating: number; comment?: string },
  ) {
    return this.svc.submitReview(user.userId, id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/interest')
  @Message('Interest tracked')
  async trackInterest(
    @Param('id', ParseIntPipe) courseId: number,
    @CurrentUser() user: RequestUser,
  ) {
    await this.svc.trackCourseInterest(user.userId, courseId);
    return { tracked: true };
  }
}

@Controller('stats')
export class StatsController {
  constructor(private readonly svc: CoursesService) {}

  @Get()
  @Message('Stats fetched successfully')
  getStats() {
    return this.svc.getStats();
  }
}

@Controller('instructors')
export class InstructorsController {
  constructor(private readonly svc: CoursesService) {}

  @Get()
  @Message('Instructors fetched successfully')
  findAll() {
    return this.svc.findInstructors();
  }

  @Get(':id')
  @Message('Instructor fetched successfully')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.svc.findInstructorById(id);
  }
}

// ─── Instructor ───────────────────────────────────────────────────────────────

@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions('update_courses')
@Controller('course-builder')
export class InstructorCoursesController {
  constructor(private readonly svc: CoursesService) {}

  @Get()
  @RequirePermissions('view_courses')
  @Message('Your courses fetched successfully')
  findMyCourses(@CurrentUser() user: RequestUser) {
    return this.svc.findInstructorCourses(user.userId);
  }

  @Get('stats')
  @RequirePermissions('view_courses')
  @Message('Instructor stats fetched')
  getStats(@CurrentUser() user: RequestUser) {
    return this.svc.getInstructorStats(user.userId);
  }

  @Post()
  @RequirePermissions('create_courses')
  @Message('Course created successfully')
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateCourseDto) {
    return this.svc.create(user.userId, dto);
  }

  @Get('profile/me')
  @RequirePermissions('view_courses')
  @Message('Profile fetched successfully')
  getProfile(@CurrentUser() user: RequestUser) {
    return this.svc.getInstructorProfile(user.userId);
  }

  @Patch('profile/me')
  @Message('Profile updated successfully')
  updateProfile(
    @CurrentUser() user: RequestUser,
    @Body() body: { bio?: string; expertise?: string; displayName?: string | null; displayAvatar?: string | null },
  ) {
    return this.svc.updateInstructorProfile(user.userId, body);
  }

  @Get(':id')
  @RequirePermissions('view_courses')
  @Message('Course fetched successfully')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: RequestUser,
  ) {
    return this.svc.findByIdForInstructor(id, user.userId, isAdmin(user));
  }

  @Get(':id/curriculum')
  @RequirePermissions('view_courses')
  @Message('Curriculum fetched successfully')
  getCurriculum(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: RequestUser,
  ) {
    return this.svc.getInstructorCurriculum(id, user.userId, isAdmin(user));
  }

  @Put(':id')
  @Message('Course updated successfully')
  update(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: RequestUser,
    @Body() dto: UpdateCourseDto,
  ) {
    return this.svc.update(id, user.userId, dto, isAdmin(user));
  }

  @Patch(':id')
  @Message('Course updated successfully')
  patch(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: RequestUser,
    @Body() dto: UpdateCourseDto,
  ) {
    return this.svc.update(id, user.userId, dto, isAdmin(user));
  }

  @Patch(':id/preview')
  @Message('Course preview updated successfully')
  updatePreview(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: RequestUser,
    @Body()
    body: {
      bunnyPreviewVideoId?: string;
      previewVideoSource?: 'bunny' | 'external';
      previewExternalUrl?: string;
    },
  ) {
    return this.svc.updateCoursePreview(id, user.userId, body, isAdmin(user));
  }

  @Delete(':id')
  @RequirePermissions('delete_courses')
  @Message('Course deleted successfully')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: RequestUser,
  ) {
    return this.svc.remove(id, user.userId, isAdmin(user));
  }

  @Post(':id/duplicate')
  @RequirePermissions('create_courses')
  @Message('Course duplicated successfully')
  duplicate(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: RequestUser,
    @Body() body: { includeCurriculum?: boolean },
  ) {
    return this.svc.duplicate(id, user.userId, body.includeCurriculum ?? false, isAdmin(user));
  }

  @Post(':id/publish')
  @RequirePermissions('publish_courses')
  @Message('Course published successfully')
  publish(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: RequestUser,
  ) {
    return this.svc.publish(id, user.userId, isAdmin(user));
  }

  @Post(':id/unpublish')
  @RequirePermissions('publish_courses')
  @Message('Course unpublished successfully')
  unpublish(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: RequestUser,
  ) {
    return this.svc.unpublish(id, user.userId, isAdmin(user));
  }

  @Post(':id/restore')
  @RequirePermissions('delete_courses')
  @Message('Course restored successfully')
  restore(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: RequestUser,
  ) {
    return this.svc.restore(id, user.userId, isAdmin(user));
  }

  @Delete(':id/purge')
  @RequirePermissions('delete_courses')
  @Message('Course permanently deleted')
  purge(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: RequestUser,
  ) {
    return this.svc.purge(id, user.userId, isAdmin(user));
  }

  @Post(':id/schedule')
  @RequirePermissions('publish_courses')
  @Message('Course scheduled successfully')
  schedule(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: RequestUser,
    @Body() body: { publishAt: string },
  ) {
    return this.svc.schedulePublish(id, user.userId, new Date(body.publishAt), isAdmin(user));
  }

  @Post(':id/unschedule')
  @RequirePermissions('publish_courses')
  @Message('Course unscheduled successfully')
  unschedule(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: RequestUser,
  ) {
    return this.svc.unschedule(id, user.userId, isAdmin(user));
  }
}

// ─── Admin ────────────────────────────────────────────────────────────────────

@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions('update_courses')
@Controller('admin/courses')
export class AdminCoursesController {
  constructor(private readonly svc: CoursesService) {}

  @Get()
  @RequirePermissions('view_courses')
  @Message('All courses fetched successfully')
  findAll(@Query() query: Record<string, string>, @CurrentUser() user: RequestUser) {
    return this.svc.findAllAdmin(query, user.userId, isAdmin(user));
  }

  @Post(':id/approve')
  @RequirePermissions('approve_courses')
  @Message('Course approved successfully')
  approve(@Param('id', ParseIntPipe) id: number) {
    return this.svc.adminUpdateStatus(id, 'published');
  }

  @Post(':id/reject')
  @RequirePermissions('approve_courses')
  @Message('Course rejected successfully')
  reject(@Param('id', ParseIntPipe) id: number) {
    return this.svc.adminUpdateStatus(id, 'inactive');
  }

  @Post(':id/feature')
  @RequirePermissions('approve_courses')
  @Message('Course feature status toggled')
  feature(@Param('id', ParseIntPipe) id: number) {
    return this.svc.toggleFeatured(id);
  }

  // ─── Reviews (per-course) ───────────────────────────────────────────────────

  @Get(':id/reviews')
  @RequirePermissions('view_courses')
  @Message('Reviews fetched')
  listReviews(@Param('id', ParseIntPipe) id: number) {
    return this.svc.listReviewsForAdmin(id);
  }

  @Post(':id/reviews')
  @Message('Curated review created')
  createReview(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: {
      rating: number;
      reviewType: 'text' | 'video';
      displayName: string;
      displayRole?: string | null;
      displayAvatar?: string | null;
      comment?: string | null;
      videoUrl?: string | null;
      videoThumbnail?: string | null;
    },
  ) {
    return this.svc.createCuratedReview(id, body);
  }

  @Patch('reviews/:reviewId')
  @Message('Review updated')
  updateReview(
    @Param('reviewId', ParseIntPipe) reviewId: number,
    @Body() body: Parameters<CoursesService['updateCuratedReview']>[1],
  ) {
    return this.svc.updateCuratedReview(reviewId, body);
  }

  @Delete('reviews/:reviewId')
  @Message('Review deleted')
  deleteReview(@Param('reviewId', ParseIntPipe) reviewId: number) {
    return this.svc.deleteReview(reviewId);
  }
}
