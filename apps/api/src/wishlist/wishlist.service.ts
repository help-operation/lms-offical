import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import type { DB } from 'src/db';
import { DB_TOKEN } from 'src/db/db.module';
import { adminUsers, courses, users, wishlists } from 'src/db/schema';

@Injectable()
export class WishlistService {
  constructor(@Inject(DB_TOKEN) private readonly db: DB) {}

  async getWishlist(userId: number) {
    return this.db
      .select({
        id: wishlists.id,
        addedAt: wishlists.addedAt,
        courseId: courses.id,
        courseTitle: courses.title,
        courseSlug: courses.slug,
        courseThumbnail: courses.thumbnail,
        courseLevel: courses.level,
        price: courses.price,
        discountPrice: courses.discountPrice,
        instructorFirstName: adminUsers.firstName,
        instructorLastName: adminUsers.lastName,
      })
      .from(wishlists)
      .innerJoin(courses, eq(wishlists.courseId, courses.id))
      .innerJoin(adminUsers, eq(courses.instructorId, adminUsers.id))
      .where(eq(wishlists.userId, userId));
  }

  async add(userId: number, courseId: number) {
    const [course] = await this.db
      .select({ id: courses.id })
      .from(courses)
      .where(and(eq(courses.id, courseId), eq(courses.status, 'published')))
      .limit(1);

    if (!course) throw new NotFoundException('Course not found');

    const [existing] = await this.db
      .select({ id: wishlists.id })
      .from(wishlists)
      .where(and(eq(wishlists.userId, userId), eq(wishlists.courseId, courseId)))
      .limit(1);

    if (existing) throw new ConflictException('Already in wishlist');

    const [item] = await this.db
      .insert(wishlists)
      .values({ userId, courseId })
      .returning();

    return item;
  }

  async remove(userId: number, courseId: number) {
    await this.db
      .delete(wishlists)
      .where(and(eq(wishlists.userId, userId), eq(wishlists.courseId, courseId)));

    return { removed: true };
  }
}
