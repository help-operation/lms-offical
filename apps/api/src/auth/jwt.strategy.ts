import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { eq } from 'drizzle-orm';
import { jwtConstants } from './constants';
import { Request } from 'express';
import type { DB } from 'src/db';
import { DB_TOKEN } from 'src/db/db.module';
import { adminUsers, users } from 'src/db/schema';

// Origins that belong to the admin app. Requests coming from these prefer the
// admin cookie; everything else (the student web app) prefers the web cookie.
// Defaults to the admin dev ports so local dev needs no extra config; in prod
// set ADMIN_ORIGINS=https://admin.yourdomain.com (comma-separated).
const ADMIN_ORIGINS = (
  process.env.ADMIN_ORIGINS ?? 'http://localhost:3003,http://localhost:3004'
)
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

/**
 * Pick the JWT based on which app the request came from, rather than a fixed
 * admin-first order. This matters because in production all cookies are scoped
 * to the shared parent domain (e.g. `.skillkoro.com`), so a browser logged into
 * both the admin and student apps sends BOTH `admin_access_token` and
 * `access_token` to the API. Selecting by Origin ensures a student checkout uses
 * the student token even when an admin cookie is also present.
 */
function extractJwt(req: Request): string | null {
  const adminToken = req?.cookies?.admin_access_token ?? null;
  const webToken = req?.cookies?.access_token ?? null;
  const bearer = ExtractJwt.fromAuthHeaderAsBearerToken()(req);

  // Origin header on cross-origin browser calls; fall back to Referer's origin.
  let origin = (req?.headers?.origin as string) ?? '';
  if (!origin && typeof req?.headers?.referer === 'string') {
    try {
      origin = new URL(req.headers.referer).origin;
    } catch {
      origin = '';
    }
  }

  // Admin app → admin token wins. Anything else (student web app, or
  // server-to-server forwarded calls that carry only one cookie) → web token
  // wins. Bearer sits in the middle so API clients still work either way.
  if (origin && ADMIN_ORIGINS.includes(origin)) {
    return adminToken ?? bearer ?? webToken;
  }
  return webToken ?? bearer ?? adminToken;
}

@Injectable()
export class JWTStrategy extends PassportStrategy(Strategy) {
  constructor(@Inject(DB_TOKEN) private readonly db: DB) {
    super({
      jwtFromRequest: extractJwt,
      ignoreExpiration: false,
      secretOrKey: jwtConstants.secret,
    });
  }

  async validate(payload: any) {
    const userType: 'user' | 'admin' = payload.userType ?? 'user';

    // Token revocation: reject tokens issued before the account's
    // `tokensValidFrom` watermark (set on logout / password change).
    const validFrom = await this.getTokensValidFrom(userType, payload.sub);
    if (
      validFrom &&
      payload.iat &&
      payload.iat < Math.floor(validFrom.getTime() / 1000)
    ) {
      throw new UnauthorizedException('Token has been revoked');
    }

    return {
      userId: payload.sub,
      username: payload.username,
      role: payload.role ?? 'GUEST',
      userType,
    };
  }

  private async getTokensValidFrom(
    userType: 'user' | 'admin',
    userId: number,
  ): Promise<Date | null> {
    if (userType === 'admin') {
      const [a] = await this.db
        .select({ v: adminUsers.tokensValidFrom })
        .from(adminUsers)
        .where(eq(adminUsers.id, userId))
        .limit(1);
      return a?.v ?? null;
    }
    const [u] = await this.db
      .select({ v: users.tokensValidFrom })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    return u?.v ?? null;
  }
}
