import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import type { DB } from 'src/db';
import { eq, desc, gte, and } from 'drizzle-orm';
import * as schema from '../db/schema';
import { DB_TOKEN } from '../db/db.module';

const { liveClasses, liveClassAttendees, users, adminUsers } = schema;

@Injectable()
export class LiveClassesService {
  constructor(@Inject(DB_TOKEN) private db: DB) {}

  async listUpcoming() {
    return this.db
      .select({
        id: liveClasses.id,
        title: liveClasses.title,
        description: liveClasses.description,
        scheduledAt: liveClasses.scheduledAt,
        status: liveClasses.status,
        courseId: liveClasses.courseId,
        instructorId: liveClasses.instructorId,
        instructorFirstName: adminUsers.firstName,
        instructorLastName: adminUsers.lastName,
      })
      .from(liveClasses)
      .innerJoin(adminUsers, eq(liveClasses.instructorId, adminUsers.id))
      .where(gte(liveClasses.scheduledAt, new Date()))
      .orderBy(liveClasses.scheduledAt);
  }

  async listByInstructor(instructorId: number) {
    return this.db
      .select()
      .from(liveClasses)
      .where(eq(liveClasses.instructorId, instructorId))
      .orderBy(desc(liveClasses.scheduledAt));
  }

  async create(
    instructorId: number,
    data: {
      title: string;
      description?: string;
      scheduledAt: string;
      meetingUrl?: string;
      courseId?: number;
    },
  ) {
    const [cls] = await this.db
      .insert(liveClasses)
      .values({
        instructorId,
        title: data.title,
        description: data.description,
        scheduledAt: new Date(data.scheduledAt),
        meetingUrl: data.meetingUrl,
        courseId: data.courseId,
      })
      .returning();
    return cls;
  }

  async update(
    id: number,
    instructorId: number,
    data: {
      title?: string;
      description?: string;
      scheduledAt?: string;
      meetingUrl?: string;
      status?: 'scheduled' | 'live' | 'ended' | 'cancelled';
    },
  ) {
    const [cls] = await this.db.select().from(liveClasses).where(eq(liveClasses.id, id));
    if (!cls) throw new NotFoundException('Live class not found');
    if (cls.instructorId !== instructorId) throw new ForbiddenException();

    const [updated] = await this.db
      .update(liveClasses)
      .set({
        ...(data.title && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.scheduledAt && { scheduledAt: new Date(data.scheduledAt) }),
        ...(data.meetingUrl !== undefined && { meetingUrl: data.meetingUrl }),
        ...(data.status && { status: data.status }),
        updatedAt: new Date(),
      })
      .where(eq(liveClasses.id, id))
      .returning();
    return updated;
  }

  async rsvp(userId: number, liveClassId: number) {
    const [cls] = await this.db.select().from(liveClasses).where(eq(liveClasses.id, liveClassId));
    if (!cls) throw new NotFoundException('Live class not found');

    const existing = await this.db
      .select()
      .from(liveClassAttendees)
      .where(
        and(
          eq(liveClassAttendees.liveClassId, liveClassId),
          eq(liveClassAttendees.userId, userId),
        ),
      );

    if (existing.length > 0) return { registered: true };

    await this.db.insert(liveClassAttendees).values({ liveClassId, userId });
    return { registered: true };
  }

  async attendees(id: number) {
    return this.db
      .select({
        userId: liveClassAttendees.userId,
        joinedAt: liveClassAttendees.joinedAt,
        firstName: users.firstName,
        lastName: users.lastName,
      })
      .from(liveClassAttendees)
      .innerJoin(users, eq(liveClassAttendees.userId, users.id))
      .where(eq(liveClassAttendees.liveClassId, id));
  }
}
