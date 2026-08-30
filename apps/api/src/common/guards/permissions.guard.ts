import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { eq } from 'drizzle-orm';
import type { DB } from 'src/db';
import { DB_TOKEN } from 'src/db/db.module';
import { adminUsers, permissions, rolePermissions } from 'src/db/schema';
import { PERMISSIONS_KEY } from '../decorators/require-permissions.decorator';
import type { RequestUser } from '../decorators/current-user.decorator';

/**
 * Enforces dynamic, role-based permissions for admin routes. Resolves the
 * caller's permission slugs from their assigned role on each request (so changes
 * to a role take effect immediately, without re-login). Super Admins bypass.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(DB_TOKEN) private readonly db: DB,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // No @RequirePermissions() — route is open to any authenticated user.
    if (!required || required.length === 0) return true;

    const request = context.switchToHttp().getRequest<{ user?: RequestUser }>();
    const user = request.user;
    if (!user) throw new ForbiddenException('Access denied');

    // Super Admin has unrestricted access (legacy enum is the identity).
    if (user.userType === 'admin' && user.role === 'SUPER_ADMIN') return true;

    // Only admin accounts carry permissions.
    if (user.userType !== 'admin')
      throw new ForbiddenException('Access denied');

    const granted = await this.getAdminPermissionSlugs(user.userId);
    const hasAll = required.every((perm) => granted.has(perm));
    if (!hasAll) {
      throw new ForbiddenException(
        `Missing required permission(s): ${required.join(', ')}`,
      );
    }
    return true;
  }

  private async getAdminPermissionSlugs(
    adminUserId: number,
  ): Promise<Set<string>> {
    const rows = await this.db
      .select({ slug: permissions.slug })
      .from(adminUsers)
      .innerJoin(rolePermissions, eq(rolePermissions.roleId, adminUsers.roleId))
      .innerJoin(permissions, eq(permissions.id, rolePermissions.permissionId))
      .where(eq(adminUsers.id, adminUserId));
    return new Set(rows.map((r) => r.slug));
  }
}
