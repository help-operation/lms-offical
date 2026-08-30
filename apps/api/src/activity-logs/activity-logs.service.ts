import { Inject, Injectable } from '@nestjs/common';
import { desc, eq, ilike, or, sql } from 'drizzle-orm';
import type { DB } from 'src/db';
import { DB_TOKEN } from 'src/db/db.module';
import { activityLogs, adminUsers, users } from 'src/db/schema';
import {
  formatPaginatedResponse,
  type TableQueryInput,
} from 'src/common/utils/table-query.util';

export interface LogActionInput {
  adminUserId?: number;
  userId?:      number;
  action:       string;
  entity?:      string;
  entityId?:    number;
  meta?:        Record<string, unknown>;
}

@Injectable()
export class ActivityLogsService {
  constructor(@Inject(DB_TOKEN) private readonly db: DB) {}

  // ─── Write a log entry ───────────────────────────────────────────────────

  async log(input: LogActionInput) {
    await this.db.insert(activityLogs).values({
      adminUserId: input.adminUserId,
      userId:      input.userId,
      action:      input.action,
      entity:      input.entity,
      entityId:    input.entityId,
      meta:        input.meta,
    });
  }

  // ─── Admin: List all logs ────────────────────────────────────────────────

  async listAll(params: TableQueryInput) {
    const page    = Math.max(1, Number(params.page)      || 1);
    const perPage = Math.min(100, Number(params.per_page) || 30);
    const offset  = (page - 1) * perPage;
    const search  = (params.search as string | undefined)?.trim() ?? '';
    const actor   = (params.actor  as string | undefined)?.trim() ?? ''; // 'admin' | 'user' | ''

    // WHERE: filter by actor type
    const actorFilter =
      actor === 'admin' ? sql`${activityLogs.adminUserId} IS NOT NULL`
      : actor === 'user' ? sql`${activityLogs.userId} IS NOT NULL`
      : undefined;

    // WHERE: search across action, entity, actor names
    const searchFilter = search
      ? or(
          ilike(activityLogs.action, `%${search}%`),
          ilike(activityLogs.entity, `%${search}%`),
          ilike(adminUsers.firstName, `%${search}%`),
          ilike(adminUsers.lastName,  `%${search}%`),
          ilike(users.firstName, `%${search}%`),
          ilike(users.lastName,  `%${search}%`),
        )
      : undefined;

    const where =
      actorFilter && searchFilter ? sql`${actorFilter} AND (${searchFilter})`
      : actorFilter               ? actorFilter
      : searchFilter              ? searchFilter
      : undefined;

    const adminUsersAlias = adminUsers;
    const usersAlias      = users;

    const [rows, [countRow]] = await Promise.all([
      this.db
        .select({
          id:              activityLogs.id,
          action:          activityLogs.action,
          entity:          activityLogs.entity,
          entityId:        activityLogs.entityId,
          meta:            activityLogs.meta,
          createdAt:       activityLogs.createdAt,
          // Admin actor
          adminUserId:     activityLogs.adminUserId,
          adminFirstName:  adminUsersAlias.firstName,
          adminLastName:   adminUsersAlias.lastName,
          adminEmail:      adminUsersAlias.email,
          adminRole:       adminUsersAlias.role,
          adminAvatar:     adminUsersAlias.avatar,
          // User actor
          userId:          activityLogs.userId,
          userFirstName:   usersAlias.firstName,
          userLastName:    usersAlias.lastName,
          userEmail:       usersAlias.email,
          userAvatar:      usersAlias.avatar,
        })
        .from(activityLogs)
        .leftJoin(adminUsersAlias, eq(activityLogs.adminUserId, adminUsersAlias.id))
        .leftJoin(usersAlias,      eq(activityLogs.userId,      usersAlias.id))
        .where(where)
        .orderBy(desc(activityLogs.createdAt))
        .limit(perPage)
        .offset(offset),

      this.db
        .select({ count: sql<number>`COUNT(*)`.mapWith(Number) })
        .from(activityLogs)
        .leftJoin(adminUsersAlias, eq(activityLogs.adminUserId, adminUsersAlias.id))
        .leftJoin(usersAlias,      eq(activityLogs.userId,      usersAlias.id))
        .where(where),
    ]);

    // Stats
    const [[totalRow], [adminActionsRow], [userActionsRow]] = await Promise.all([
      this.db.select({ count: sql<number>`COUNT(*)`.mapWith(Number) }).from(activityLogs),
      this.db.select({ count: sql<number>`COUNT(*)`.mapWith(Number) }).from(activityLogs)
        .where(sql`${activityLogs.adminUserId} IS NOT NULL`),
      this.db.select({ count: sql<number>`COUNT(*)`.mapWith(Number) }).from(activityLogs)
        .where(sql`${activityLogs.userId} IS NOT NULL`),
    ]);

    return {
      ...formatPaginatedResponse(rows, countRow?.count ?? 0, page, perPage),
      stats: {
        total:        totalRow?.count       ?? 0,
        adminActions: adminActionsRow?.count ?? 0,
        userActions:  userActionsRow?.count  ?? 0,
      },
    };
  }
}
