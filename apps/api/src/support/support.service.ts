import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import type { DB } from 'src/db';
import { eq, desc, sql, and, isNull, inArray, gte } from 'drizzle-orm';
import * as schema from '../db/schema';
import { DB_TOKEN } from '../db/db.module';
import { NotificationsService } from '../notifications/notifications.service';
import { AdminNotificationsService } from '../notifications/admin-notifications.service';
import { SmsTemplatesService } from '../sms/sms-templates.service';
import { EmailTemplatesService } from '../email-templates/email-templates.service';
import { PushService } from '../push/push.service';
import { UploadService } from '../upload/upload.service';
import {
  buildTableQuery,
  formatPaginatedResponse,
  type TableQueryInput,
} from '../common/utils/table-query.util';
import { DashboardEventsService } from '../events/dashboard-events.service';

const { supportTickets, supportMessages, users, adminUsers, cannedResponses } = schema;

const ADMIN_ROLES = new Set(['SUPER_ADMIN', 'INSTRUCTOR']);
const isAdminRole = (role: string) => ADMIN_ROLES.has(role);

const frontendUrl = () => process.env.FRONTEND_URL ?? 'https://skillkoro.com';

const CATEGORY_LABELS: Record<string, string> = {
  billing: 'Billing & Payment', technical: 'Technical Issue',
  course_content: 'Course Content', certificate: 'Certificate',
  refund: 'Refund Request', other: 'Other',
};

const STATUS_LABELS: Record<string, string> = {
  open: 'Open', in_progress: 'In Progress', resolved: 'Resolved', closed: 'Closed',
};

@Injectable()
export class SupportService {
  constructor(
    @Inject(DB_TOKEN) private db: DB,
    private notifications: NotificationsService,
    private adminNotifications: AdminNotificationsService,
    private smsTemplates: SmsTemplatesService,
    private emailTemplates: EmailTemplatesService,
    private push: PushService,
    private uploadService: UploadService,
    private readonly dashboardEvents: DashboardEventsService,
  ) {}

  // ── Student: create ticket ───────────────────────────────────────────────────

  async createTicket(
    userId: number,
    subject: string,
    message: string,
    category: 'billing' | 'technical' | 'course_content' | 'certificate' | 'refund' | 'other' = 'other',
    priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium',
  ) {
    const now = new Date();
    const [ticket] = await this.db
      .insert(supportTickets)
      .values({ userId, subject, category, priority, updatedAt: now, lastStudentReadAt: now })
      .returning();

    this.dashboardEvents.emit({ type: 'support_ticket_created', meta: { ticketId: ticket.id } });

    await this.db.insert(supportMessages).values({ ticketId: ticket.id, userId, message, isInternal: false });

    await this.adminNotifications.notifyAdmins(
      'support_ticket', 'New support ticket',
      `[${category.replace('_', ' ')}] ${subject}`, '/admin/support',
    );

    const [student] = await this.db
      .select({ email: users.email, firstName: users.firstName })
      .from(users).where(eq(users.id, userId)).limit(1);

    if (student?.email) {
      this.emailTemplates.send('support_ticket_created', student.email, {
        student_name: student.firstName ?? 'there',
        ticket_id: String(ticket.id), subject,
        category: CATEGORY_LABELS[category] ?? category,
        ticket_url: `${frontendUrl()}/student/support`,
      });
    }
    return ticket;
  }

  // ── Student: list own tickets ────────────────────────────────────────────────

  async myTickets(userId: number) {
    return this.db
      .select({
        id: supportTickets.id, subject: supportTickets.subject,
        category: supportTickets.category, status: supportTickets.status,
        priority: supportTickets.priority,
        createdAt: supportTickets.createdAt, updatedAt: supportTickets.updatedAt,
        unread: sql<boolean>`${supportTickets.updatedAt} > COALESCE(${supportTickets.lastStudentReadAt}, to_timestamp(0))`,
      })
      .from(supportTickets).where(eq(supportTickets.userId, userId))
      .orderBy(desc(supportTickets.updatedAt));
  }

  // ── Student/Admin: view ticket detail ────────────────────────────────────────

  async getTicket(userId: number, ticketId: number, role: string) {
    const [ticket] = await this.db
      .select({
        id: supportTickets.id, subject: supportTickets.subject,
        category: supportTickets.category, status: supportTickets.status,
        priority: supportTickets.priority, assignedTo: supportTickets.assignedTo,
        assignedAdminFirstName: adminUsers.firstName, assignedAdminLastName: adminUsers.lastName,
        userId: supportTickets.userId,
        createdAt: supportTickets.createdAt, updatedAt: supportTickets.updatedAt,
        lastStudentReadAt: supportTickets.lastStudentReadAt, lastAdminReadAt: supportTickets.lastAdminReadAt,
      })
      .from(supportTickets)
      .leftJoin(adminUsers, eq(supportTickets.assignedTo, adminUsers.id))
      .where(eq(supportTickets.id, ticketId));

    if (!ticket) throw new NotFoundException('Ticket not found');
    if (!isAdminRole(role) && ticket.userId !== userId) throw new ForbiddenException();

    const now = new Date();
    await this.db.update(supportTickets)
      .set(isAdminRole(role) ? { lastAdminReadAt: now } : { lastStudentReadAt: now })
      .where(eq(supportTickets.id, ticketId));

    const messages = await this.db
      .select({
        id: supportMessages.id, message: supportMessages.message,
        isInternal: supportMessages.isInternal, attachments: supportMessages.attachments,
        createdAt: supportMessages.createdAt, userId: supportMessages.userId,
        userFirstName: users.firstName, userLastName: users.lastName,
      })
      .from(supportMessages)
      .innerJoin(users, eq(supportMessages.userId, users.id))
      .where(
        isAdminRole(role)
          ? eq(supportMessages.ticketId, ticketId)
          : and(eq(supportMessages.ticketId, ticketId), eq(supportMessages.isInternal, false)),
      )
      .orderBy(supportMessages.createdAt);

    return { ...ticket, messages };
  }

  // ── Student/Admin: reply ─────────────────────────────────────────────────────

  async reply(
    userId: number, ticketId: number, message: string, role: string,
    isInternal = false, attachments?: { url: string; name: string }[],
  ) {
    const [ticket] = await this.db.select().from(supportTickets).where(eq(supportTickets.id, ticketId));
    if (!ticket) throw new NotFoundException('Ticket not found');
    if (!isAdminRole(role) && ticket.userId !== userId) throw new ForbiddenException();
    if (!isAdminRole(role) && isInternal) throw new ForbiddenException();

    const fromAdmin = isAdminRole(role);
    const now = new Date();

    const [msg] = await this.db
      .insert(supportMessages)
      .values({ ticketId, userId, message, isInternal: fromAdmin ? isInternal : false, attachments })
      .returning();

    if (!isInternal) {
      await this.db.update(supportTickets).set({
        updatedAt: now, slaBreach: false,
        ...(fromAdmin ? { lastAdminReadAt: now } : { lastStudentReadAt: now }),
        ...(ticket.status === 'open' ? { status: 'in_progress' as const } : {}),
      }).where(eq(supportTickets.id, ticketId));

      if (fromAdmin) {
        await this.notifications.create(
          ticket.userId, 'support_reply', `New reply on "${ticket.subject}"`,
          message.slice(0, 140), '/student/support',
        ).catch(() => {});

        const [student] = await this.db
          .select({ phone: users.phone, firstName: users.firstName, email: users.email })
          .from(users).where(eq(users.id, ticket.userId)).limit(1);

        await this.smsTemplates.send('support_reply', student?.phone, {
          name: student?.firstName ?? 'there', subject: ticket.subject,
        });

        if (student?.email) {
          this.emailTemplates.send('support_ticket_reply', student.email, {
            student_name: student.firstName ?? 'there', ticket_id: String(ticketId),
            subject: ticket.subject,
            reply_preview: message.slice(0, 200) + (message.length > 200 ? '…' : ''),
            ticket_url: `${frontendUrl()}/student/support`,
          });
        }

        this.push.sendToUser(ticket.userId, {
          title: `Support reply — "${ticket.subject}"`,
          body: message.slice(0, 100), url: '/student/support',
      }).catch(() => {});
    }

    this.dashboardEvents.emit({ type: 'support_ticket_resolved', meta: { ticketId, status } });

    return ticket;
  }
    return msg;
  }

  // ── Admin: assign ─────────────────────────────────────────────────────────────

  async assignTicket(ticketId: number, adminId: number | null) {
    const [ticket] = await this.db
      .update(supportTickets).set({ assignedTo: adminId, updatedAt: new Date() })
      .where(eq(supportTickets.id, ticketId)).returning();
    if (!ticket) throw new NotFoundException('Ticket not found');
    return ticket;
  }

  // ── Admin: list all tickets ───────────────────────────────────────────────────

  async allTickets(params: TableQueryInput = {}) {
    const assigned = adminUsers;
    const q = buildTableQuery(params, {
      searchable: [supportTickets.subject, users.firstName, users.lastName],
      sortable: { createdAt: supportTickets.createdAt, updatedAt: supportTickets.updatedAt },
      filterable: {
        status:      supportTickets.status,
        category:    supportTickets.category,
        slaBreach:   (val) => eq(supportTickets.slaBreach, val === 'true'),
        unassigned:  (val) => val === 'true' ? isNull(supportTickets.assignedTo) as any : sql`TRUE`,
        assignedTo:  (val) => eq(supportTickets.assignedTo, Number(val)),
      },
      dateColumn:  supportTickets.createdAt,
      defaultSort: desc(supportTickets.updatedAt),
    });

    const [rows, [countRow]] = await Promise.all([
      this.db.select({
        id: supportTickets.id, subject: supportTickets.subject,
        category: supportTickets.category, status: supportTickets.status,
        priority: supportTickets.priority, slaBreach: supportTickets.slaBreach,
        assignedTo: supportTickets.assignedTo,
        assignedAdminFirstName: assigned.firstName, assignedAdminLastName: assigned.lastName,
        createdAt: supportTickets.createdAt, updatedAt: supportTickets.updatedAt,
        userId: supportTickets.userId, userFirstName: users.firstName, userLastName: users.lastName,
        unread: sql<boolean>`${supportTickets.updatedAt} > COALESCE(${supportTickets.lastAdminReadAt}, to_timestamp(0))`,
      })
        .from(supportTickets)
        .innerJoin(users, eq(supportTickets.userId, users.id))
        .leftJoin(assigned, eq(supportTickets.assignedTo, assigned.id))
        .where(q.where).orderBy(q.orderBy).limit(q.limit).offset(q.offset),
      this.db.select({ count: sql<number>`count(*)`.mapWith(Number) })
        .from(supportTickets).innerJoin(users, eq(supportTickets.userId, users.id)).where(q.where),
    ]);

    return formatPaginatedResponse(rows, countRow.count, q.page, q.perPage);
  }

  // ── Admin: update status ──────────────────────────────────────────────────────

  async updateStatus(
    ticketId: number,
    status: 'open' | 'in_progress' | 'resolved' | 'closed',
    priority?: 'low' | 'medium' | 'high' | 'urgent',
  ) {
    const [existing] = await this.db
      .select({ status: supportTickets.status, userId: supportTickets.userId, subject: supportTickets.subject })
      .from(supportTickets).where(eq(supportTickets.id, ticketId));
    if (!existing) throw new NotFoundException('Ticket not found');

    const closing = status === 'resolved' || status === 'closed';
    const [ticket] = await this.db
      .update(supportTickets)
      .set({
        status,
        ...(priority && { priority }),
        slaBreach: false,
        updatedAt: new Date(),
        ...(closing && existing.status !== status ? { resolvedAt: new Date() } : {}),
      })
      .where(eq(supportTickets.id, ticketId)).returning();

    if (existing.status !== status) {
      const [student] = await this.db
        .select({ email: users.email, firstName: users.firstName })
        .from(users).where(eq(users.id, existing.userId)).limit(1);

      if (student?.email) {
        this.emailTemplates.send('support_ticket_status_changed', student.email, {
          student_name: student.firstName ?? 'there', ticket_id: String(ticketId),
          subject: existing.subject,
          old_status: STATUS_LABELS[existing.status] ?? existing.status,
          new_status: STATUS_LABELS[status] ?? status,
          ticket_url: `${frontendUrl()}/student/support`,
        });
      }

      this.push.sendToUser(existing.userId, {
        title: `Ticket status: ${STATUS_LABELS[status] ?? status}`,
        body: `Your ticket "${existing.subject}" is now ${STATUS_LABELS[status]?.toLowerCase() ?? status}.`,
        url: '/student/support',
      }).catch(() => {});

      this.notifications.create(
        existing.userId, 'support_status',
        `Ticket "${existing.subject}" status updated`,
        `Status changed to ${STATUS_LABELS[status] ?? status}`, '/student/support',
      ).catch(() => {});
    }
    return ticket;
  }

  // ── Admin: bulk action ────────────────────────────────────────────────────────

  async bulkAction(
    ids: number[],
    action: 'close' | 'resolve' | 'assign' | 'set_priority',
    opts: { adminId?: number | null; priority?: string } = {},
  ) {
    if (!ids.length) return { updated: 0 };
    const now = new Date();
    let set: Record<string, unknown> = { updatedAt: now };

    if (action === 'close')          set = { ...set, status: 'closed',   slaBreach: false, resolvedAt: now };
    else if (action === 'resolve')   set = { ...set, status: 'resolved', slaBreach: false, resolvedAt: now };
    else if (action === 'assign')    set = { ...set, assignedTo: opts.adminId ?? null };
    else if (action === 'set_priority' && opts.priority) set = { ...set, priority: opts.priority };

    await this.db.update(supportTickets).set(set).where(inArray(supportTickets.id, ids));
    return { updated: ids.length };
  }

  // ── Admin: stats dashboard ────────────────────────────────────────────────────

  async getStats() {
    const [statusRows, [slaRow], [unassignedRow], byAgentRows] = await Promise.all([
      this.db.select({
        status: supportTickets.status,
        count:  sql<number>`count(*)`.mapWith(Number),
      }).from(supportTickets).groupBy(supportTickets.status),

      this.db.select({ count: sql<number>`count(*)`.mapWith(Number) })
        .from(supportTickets).where(eq(supportTickets.slaBreach, true)),

      this.db.select({ count: sql<number>`count(*)`.mapWith(Number) })
        .from(supportTickets)
        .where(and(
          isNull(supportTickets.assignedTo),
          inArray(supportTickets.status, ['open', 'in_progress']),
        )),

      this.db.select({
        id:    adminUsers.id,
        name:  sql<string>`concat(${adminUsers.firstName}, ' ', ${adminUsers.lastName})`,
        count: sql<number>`count(${supportTickets.id})`.mapWith(Number),
      })
        .from(supportTickets)
        .innerJoin(adminUsers, eq(supportTickets.assignedTo, adminUsers.id))
        .where(inArray(supportTickets.status, ['open', 'in_progress']))
        .groupBy(adminUsers.id, adminUsers.firstName, adminUsers.lastName)
        .orderBy(desc(sql`count(${supportTickets.id})`)),
    ]);

    const counts: Record<string, number> = {};
    for (const row of statusRows) counts[row.status] = row.count;

    return {
      open:        counts['open']        ?? 0,
      in_progress: counts['in_progress'] ?? 0,
      resolved:    counts['resolved']    ?? 0,
      closed:      counts['closed']      ?? 0,
      sla_breached: slaRow?.count        ?? 0,
      unassigned:  unassignedRow?.count  ?? 0,
      total: Object.values(counts).reduce((a, b) => a + b, 0),
      by_agent: byAgentRows,
    };
  }

  // ── Admin: agents list ────────────────────────────────────────────────────────

  async getAgents() {
    return this.db.select({ id: adminUsers.id, firstName: adminUsers.firstName, lastName: adminUsers.lastName })
      .from(adminUsers).where(eq(adminUsers.status, 'active')).orderBy(adminUsers.firstName);
  }

  // ── Attachment upload URL ─────────────────────────────────────────────────────

  async createAttachmentUploadUrl(mimeType: string, fileName: string) {
    return this.uploadService.createMediaPresignUrl(mimeType, fileName);
  }

  // ── Canned responses CRUD ─────────────────────────────────────────────────────

  async listCannedResponses() {
    return this.db.select().from(cannedResponses).orderBy(cannedResponses.sortOrder, cannedResponses.title);
  }

  async createCannedResponse(data: { title: string; body: string; category?: string; sortOrder?: number }) {
    const [row] = await this.db.insert(cannedResponses).values({
      title: data.title, body: data.body,
      category:  data.category  ?? 'general',
      sortOrder: data.sortOrder ?? 0,
    }).returning();
    return row;
  }

  async updateCannedResponse(id: number, data: { title?: string; body?: string; category?: string; sortOrder?: number }) {
    const [row] = await this.db.update(cannedResponses)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(cannedResponses.id, id)).returning();
    if (!row) throw new NotFoundException('Canned response not found');
    return row;
  }

  async deleteCannedResponse(id: number) {
    await this.db.delete(cannedResponses).where(eq(cannedResponses.id, id));
    return { deleted: true };
  }

  // ── Analytics ─────────────────────────────────────────────────────────────────

  async getAnalytics(days = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const sinceSql = sql`NOW() - INTERVAL '${sql.raw(String(days))} days'`;

    const [
      statusRows,
      trendRows,
      categoryRows,
      priorityRows,
      [resolutionRow],
      [slaRow],
      agentRows,
    ] = await Promise.all([
      // Status breakdown (in period)
      this.db
        .select({ status: supportTickets.status, count: sql<number>`count(*)`.mapWith(Number) })
        .from(supportTickets)
        .where(gte(supportTickets.createdAt, since))
        .groupBy(supportTickets.status),

      // Daily creation trend
      this.db
        .select({
          date:    sql<string>`DATE(${supportTickets.createdAt})`,
          created: sql<number>`count(*)`.mapWith(Number),
        })
        .from(supportTickets)
        .where(gte(supportTickets.createdAt, since))
        .groupBy(sql`DATE(${supportTickets.createdAt})`)
        .orderBy(sql`DATE(${supportTickets.createdAt})`),

      // Category breakdown
      this.db
        .select({ category: supportTickets.category, count: sql<number>`count(*)`.mapWith(Number) })
        .from(supportTickets)
        .where(gte(supportTickets.createdAt, since))
        .groupBy(supportTickets.category)
        .orderBy(desc(sql`count(*)`)),

      // Priority breakdown
      this.db
        .select({ priority: supportTickets.priority, count: sql<number>`count(*)`.mapWith(Number) })
        .from(supportTickets)
        .where(gte(supportTickets.createdAt, since))
        .groupBy(supportTickets.priority)
        .orderBy(desc(sql`count(*)`)),

      // Avg resolution time for resolved/closed tickets
      this.db
        .select({
          avgHours: sql<number>`
            ROUND(AVG(EXTRACT(EPOCH FROM (${supportTickets.updatedAt} - ${supportTickets.createdAt})) / 3600)::numeric, 1)
          `.mapWith(Number),
        })
        .from(supportTickets)
        .where(and(
          gte(supportTickets.createdAt, since),
          inArray(supportTickets.status, ['resolved', 'closed']),
        )),

      // SLA compliance % for resolved/closed
      this.db
        .select({
          compliance: sql<number>`
            ROUND(
              COUNT(*) FILTER (WHERE ${supportTickets.slaBreach} = false)::numeric /
              NULLIF(COUNT(*), 0) * 100, 1
            )
          `.mapWith(Number),
          total: sql<number>`count(*)`.mapWith(Number),
        })
        .from(supportTickets)
        .where(and(
          gte(supportTickets.createdAt, since),
          inArray(supportTickets.status, ['resolved', 'closed']),
        )),

      // Agent performance
      this.db
        .select({
          id:   adminUsers.id,
          name: sql<string>`concat(${adminUsers.firstName}, ' ', ${adminUsers.lastName})`,
          openTickets:
            sql<number>`COUNT(${supportTickets.id}) FILTER (WHERE ${supportTickets.status} IN ('open','in_progress'))`.mapWith(Number),
          resolvedTickets:
            sql<number>`COUNT(${supportTickets.id}) FILTER (WHERE ${supportTickets.status} IN ('resolved','closed'))`.mapWith(Number),
          avgResolutionHours:
            sql<number>`
              ROUND(
                AVG(EXTRACT(EPOCH FROM (${supportTickets.updatedAt} - ${supportTickets.createdAt})) / 3600)
                FILTER (WHERE ${supportTickets.status} IN ('resolved','closed'))::numeric, 1
              )
            `.mapWith(Number),
        })
        .from(adminUsers)
        .leftJoin(supportTickets, and(
          eq(supportTickets.assignedTo, adminUsers.id),
          gte(supportTickets.createdAt, since),
        ))
        .groupBy(adminUsers.id, adminUsers.firstName, adminUsers.lastName)
        .having(sql`COUNT(${supportTickets.id}) > 0`)
        .orderBy(desc(sql`COUNT(${supportTickets.id}) FILTER (WHERE ${supportTickets.status} IN ('resolved','closed'))`)),
    ]);

    const counts: Record<string, number> = {};
    for (const r of statusRows) counts[r.status] = r.count;

    return {
      period: days,
      summary: {
        total:        Object.values(counts).reduce((a, b) => a + b, 0),
        open:         counts['open']        ?? 0,
        in_progress:  counts['in_progress'] ?? 0,
        resolved:     counts['resolved']    ?? 0,
        closed:       counts['closed']      ?? 0,
        avgResolutionHours: resolutionRow?.avgHours  ?? null,
        slaCompliancePct:   slaRow?.compliance       ?? 100,
        resolvedTotal:      slaRow?.total            ?? 0,
      },
      trend:            trendRows,
      byCategory:       categoryRows,
      byPriority:       priorityRows,
      agentPerformance: agentRows,
    };
  }

  async exportTicketsCsv(days = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const rows = await this.db
      .select({
        id:               supportTickets.id,
        subject:          supportTickets.subject,
        category:         supportTickets.category,
        status:           supportTickets.status,
        priority:         supportTickets.priority,
        slaBreach:        supportTickets.slaBreach,
        assignedAgent:    sql<string>`concat(${adminUsers.firstName}, ' ', ${adminUsers.lastName})`,
        studentFirstName: users.firstName,
        studentLastName:  users.lastName,
        createdAt:        supportTickets.createdAt,
        updatedAt:        supportTickets.updatedAt,
      })
      .from(supportTickets)
      .innerJoin(users,      eq(supportTickets.userId,     users.id))
      .leftJoin(adminUsers,  eq(supportTickets.assignedTo, adminUsers.id))
      .where(gte(supportTickets.createdAt, since))
      .orderBy(desc(supportTickets.createdAt));

    const esc = (v: string) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const header = ['ID','Subject','Category','Status','Priority','SLA Breach','Agent','Student','Created','Updated'];
    const lines  = rows.map((r) => [
      r.id,
      esc(r.subject),
      r.category,
      r.status,
      r.priority,
      r.slaBreach,
      r.assignedAgent?.trim() ? esc(r.assignedAgent) : 'Unassigned',
      esc(`${r.studentFirstName} ${r.studentLastName}`),
      r.createdAt?.toISOString() ?? '',
      r.updatedAt?.toISOString() ?? '',
    ].join(','));

    return [header.join(','), ...lines].join('\n');
  }
}
