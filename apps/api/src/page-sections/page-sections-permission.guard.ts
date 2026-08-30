import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
} from '@nestjs/common';
import { eq, inArray } from 'drizzle-orm';
import type { DB } from 'src/db';
import { DB_TOKEN } from 'src/db/db.module';
import { pageSections } from 'src/db/schema';
import {
  assertAllPermissions,
  isSuperAdmin,
} from 'src/common/rbac/permission-check';
import type { RequestUser } from 'src/common/decorators/current-user.decorator';

/** DB `page` value → permission group suffix. */
const PAGE_GROUP: Record<string, string> = {
  home: 'section_landing',
  'home-v1': 'section_landing',
  footer: 'section_footer',
  contact: 'section_contact',
  about: 'section_about',
  faq: 'section_faq',
  'our-instructor': 'section_mentors',
  'success-stories': 'section_success',
  'live-classes': 'section_live_classes',
  'free-courses': 'section_free_courses',
  courses: 'section_courses',
  blog: 'section_blog',
  'join-as-instructor': 'section_join_instructor',
  login: 'section_login',
  signup: 'section_signup',
};

const updateSlug = (page?: string | null): string | null =>
  page && PAGE_GROUP[page] ? `update_${PAGE_GROUP[page]}` : null;
const viewSlug = (page?: string | null): string | null =>
  page && PAGE_GROUP[page] ? `view_${PAGE_GROUP[page]}` : null;

interface GuardedRequest {
  method: string;
  params: Record<string, string>;
  body: { page?: string; items?: { id: number }[] } & Record<string, unknown>;
  user?: RequestUser;
}

/**
 * Per-section permission guard. Resolves which Website-Section page a request
 * touches (from the route param, the create body, or the section row's `page`)
 * and enforces the matching `view_section_*` / `update_section_*` permission.
 */
@Injectable()
export class PageSectionsPermissionGuard implements CanActivate {
  constructor(@Inject(DB_TOKEN) private readonly db: DB) { }

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<GuardedRequest>();
    if (isSuperAdmin(req.user)) return true;
    await assertAllPermissions(this.db, req.user, await this.required(req));
    return true;
  }

  private async required(req: GuardedRequest): Promise<string[]> {
    // GET admin/:page — read a page's sections.
    if (req.method === 'GET') {
      const slug = viewSlug(req.params.page);
      return slug ? [slug] : [];
    }
    // POST — create a section on the page named in the body.
    if (req.method === 'POST') {
      const slug = updateSlug(req.body?.page);
      return slug ? [slug] : [];
    }
    // PUT /reorder — items reference section ids across (usually one) page.
    if (Array.isArray(req.body?.items)) {
      const ids = req.body.items
        .map((i) => i.id)
        .filter((n): n is number => Number.isFinite(n));
      const pages = await this.pagesForIds(ids);
      return [...new Set(pages.map(updateSlug).filter(Boolean))] as string[];
    }
    // PUT/PATCH/DELETE /:id — resolve the section's page.
    const slug = updateSlug(await this.pageForId(Number(req.params.id)));
    return slug ? [slug] : [];
  }

  private async pageForId(id: number): Promise<string | null> {
    if (!Number.isFinite(id)) return null;
    const [row] = await this.db
      .select({ page: pageSections.page })
      .from(pageSections)
      .where(eq(pageSections.id, id))
      .limit(1);
    return row?.page ?? null;
  }

  private async pagesForIds(ids: number[]): Promise<string[]> {
    if (ids.length === 0) return [];
    const rows = await this.db
      .select({ page: pageSections.page })
      .from(pageSections)
      .where(inArray(pageSections.id, ids));
    return rows.map((r) => r.page);
  }
}
