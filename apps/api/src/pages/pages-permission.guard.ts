import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import type { DB } from 'src/db';
import { DB_TOKEN } from 'src/db/db.module';
import {
  assertAllPermissions,
  isSuperAdmin,
} from 'src/common/rbac/permission-check';
import type { RequestUser } from 'src/common/decorators/current-user.decorator';

/** Legal-page slug → update permission. */
const SLUG_UPDATE: Record<string, string> = {
  'privacy-policy': 'update_page_privacy',
  'return-policy': 'update_page_return',
  'terms-conditions': 'update_page_terms',
};

interface GuardedRequest {
  params: Record<string, string>;
  user?: RequestUser;
}

/** Enforces the per-slug `update_page_*` permission on legal-page edits. */
@Injectable()
export class PagesPermissionGuard implements CanActivate {
  constructor(@Inject(DB_TOKEN) private readonly db: DB) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<GuardedRequest>();
    if (isSuperAdmin(req.user)) return true;

    const slug = SLUG_UPDATE[req.params.slug];
    if (!slug) throw new ForbiddenException('Unknown page');
    await assertAllPermissions(this.db, req.user, [slug]);
    return true;
  }
}
