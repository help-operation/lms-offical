import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import type { DB } from 'src/db';
import { DB_TOKEN } from 'src/db/db.module';
import { adminUsers, cartItems, courses, enrollments, users } from 'src/db/schema';

@Injectable()
export class CartService {
  constructor(@Inject(DB_TOKEN) private readonly db: DB) {}

  async getCart(userId: number) {
    const rows = await this.db
      .select({
        id: cartItems.id,
        addedAt: cartItems.addedAt,
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
      .from(cartItems)
      .innerJoin(courses, eq(cartItems.courseId, courses.id))
      .innerJoin(adminUsers, eq(courses.instructorId, adminUsers.id))
      .where(eq(cartItems.userId, userId));

    return rows;
  }

  async addToCart(userId: number, courseId: number) {
    const [course] = await this.db
      .select({ id: courses.id, status: courses.status })
      .from(courses)
      .where(eq(courses.id, courseId))
      .limit(1);

    if (!course || course.status !== 'published') {
      throw new NotFoundException('Course not found');
    }

    const [alreadyInCart] = await this.db
      .select({ id: cartItems.id })
      .from(cartItems)
      .where(and(eq(cartItems.userId, userId), eq(cartItems.courseId, courseId)))
      .limit(1);

    if (alreadyInCart) throw new ConflictException('Course already in cart');

    const [enrolled] = await this.db
      .select({ id: enrollments.id })
      .from(enrollments)
      .where(and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId)))
      .limit(1);

    if (enrolled) throw new ConflictException('Already enrolled in this course');

    const [item] = await this.db
      .insert(cartItems)
      .values({ userId, courseId })
      .returning();

    return item;
  }

  async removeFromCart(userId: number, courseId: number) {
    await this.db
      .delete(cartItems)
      .where(and(eq(cartItems.userId, userId), eq(cartItems.courseId, courseId)));

    return { removed: true };
  }

  async clearCart(userId: number) {
    await this.db.delete(cartItems).where(eq(cartItems.userId, userId));
    return { cleared: true };
  }
}
