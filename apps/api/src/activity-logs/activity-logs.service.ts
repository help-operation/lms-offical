import { Inject, Injectable } from '@nestjs/common';
import { desc, asc, eq, ilike, or, sql, and, gte, lte, type SQL } from 'drizzle-orm';
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
    const actor   = (params.actor  as string | undefined)?.trim() ?? '';
    const sortField = (params.sort_field as string | undefined)?.trim() ?? 'createdAt';
    const sortDir = (params.sort_direction as string | undefined)?.trim()?.toLowerCase() === 'asc' ? 'asc' : 'desc';
    const dateFrom = (params.date_from as string | undefined)?.trim() ?? '';
    const dateTo   = (params.date_to as string | undefined)?.trim() ?? '';

    const conditions: SQL[] = [];

    // Actor filter
    if (actor === 'admin') {
      conditions.push(sql`${activityLogs.adminUserId} IS NOT NULL`);
    } else if (actor === 'user') {
      conditions.push(sql`${activityLogs.userId} IS NOT NULL`);
    }

    // Date range filter
    if (dateFrom) {
      conditions.push(gte(activityLogs.createdAt, new Date(dateFrom)));
    }
    if (dateTo) {
      conditions.push(lte(activityLogs.createdAt, new Date(dateTo + 'T23:59:59')));
    }

    // Search filter
    if (search) {
      const term = `%${search}%`;
      conditions.push(or(
        ilike(activityLogs.action, term),
        ilike(activityLogs.entity, term),
        ilike(adminUsers.firstName, term),
        ilike(adminUsers.lastName,  term),
        ilike(users.firstName, term),
        ilike(users.lastName,  term),
      ) as SQL);
    }

    const where = conditions.length ? and(...conditions) : undefined;

    const orderCol = sortField === 'action' ? activityLogs.action
      : activityLogs.createdAt;

    const [rows, [countRow]] = await Promise.all([
      this.db
        .select({
          id:              activityLogs.id,
          action:          activityLogs.action,
          entity:          activityLogs.entity,
          entityId:        activityLogs.entityId,
          meta:            activityLogs.meta,
          createdAt:       activityLogs.createdAt,
          adminUserId:     activityLogs.adminUserId,
          adminFirstName:  adminUsers.firstName,
          adminLastName:   adminUsers.lastName,
          adminEmail:      adminUsers.email,
          adminRole:       adminUsers.role,
          adminAvatar:     adminUsers.avatar,
          userId:          activityLogs.userId,
          userFirstName:   users.firstName,
          userLastName:    users.lastName,
          userEmail:       users.email,
          userAvatar:      users.avatar,
        })
        .from(activityLogs)
        .leftJoin(adminUsers, eq(activityLogs.adminUserId, adminUsers.id))
        .leftJoin(users,      eq(activityLogs.userId,      users.id))
        .where(where)
        .orderBy(sortDir === 'asc' ? asc(orderCol) : desc(orderCol))
        .limit(perPage)
        .offset(offset),

      this.db
        .select({ count: sql<number>`COUNT(*)`.mapWith(Number) })
        .from(activityLogs)
        .leftJoin(adminUsers, eq(activityLogs.adminUserId, adminUsers.id))
        .leftJoin(users,      eq(activityLogs.userId,      users.id))
        .where(where),
    ]);

    return {
      ...formatPaginatedResponse(rows, countRow?.count ?? 0, page, perPage),
      stats: await this.getStats(),
    };
  }

  // ─── Stats (cached per-request via sequential call) ──────────────────────

  private async getStats() {
    const [[totalRow], [adminActionsRow], [userActionsRow]] = await Promise.all([
      this.db.select({ count: sql<number>`COUNT(*)`.mapWith(Number) }).from(activityLogs),
      this.db.select({ count: sql<number>`COUNT(*)`.mapWith(Number) }).from(activityLogs)
        .where(sql`${activityLogs.adminUserId} IS NOT NULL`),
      this.db.select({ count: sql<number>`COUNT(*)`.mapWith(Number) }).from(activityLogs)
        .where(sql`${activityLogs.userId} IS NOT NULL`),
    ]);

    return {
      total:        totalRow?.count       ?? 0,
      adminActions: adminActionsRow?.count ?? 0,
      userActions:  userActionsRow?.count  ?? 0,
    };
  }
}
