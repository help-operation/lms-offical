import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
} from '@nestjs/common';
import type { DB } from 'src/db';
import { DB_TOKEN } from 'src/db/db.module';
import {
  assertAllPermissions,
  assertAnyPermission,
  isSuperAdmin,
} from 'src/common/rbac/permission-check';
import type { RequestUser } from 'src/common/decorators/current-user.decorator';

/** All settings-tab view permissions — any one grants read of the shared store. */
const VIEW_SLUGS = [
  'view_settings_general',
  'view_settings_payment',
  'view_settings_social',
  'view_settings_maintenance',
  'view_invoice_settings',
];

/** Map a setting key to its tab's update permission (by key prefix). */
function updateSlugForKey(key: string): string {
  if (key.startsWith('payment_')) return 'update_settings_payment';
  if (key.startsWith('social_')) return 'update_settings_social';
  if (key.startsWith('maintenance_')) return 'update_settings_maintenance';
  if (key.startsWith('invoice_')) return 'update_invoice_settings';
  return 'update_settings_general';
}

interface GuardedRequest {
  method: string;
  params: Record<string, string>;
  body: Record<string, unknown>;
  user?: RequestUser;
}

/**
 * Per-tab permission guard for the shared system-settings key-value store.
 * Reads require any settings view permission; writes require the update
 * permission of every tab whose keys are being changed (derived from the key
 * prefix: payment_ / social_ / maintenance_ / else general).
 */
@Injectable()
export class SystemSettingsPermissionGuard implements CanActivate {
  constructor(@Inject(DB_TOKEN) private readonly db: DB) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<GuardedRequest>();
    if (isSuperAdmin(req.user)) return true;

    if (req.method === 'GET') {
      await assertAnyPermission(this.db, req.user, VIEW_SLUGS);
      return true;
    }

    // PUT /:key updates a single key; PUT / bulk-updates many (keys = body keys).
    const keys = req.params.key ? [req.params.key] : Object.keys(req.body ?? {});
    const required = [...new Set(keys.map(updateSlugForKey))];
    await assertAllPermissions(this.db, req.user, required);
    return true;
  }
}
