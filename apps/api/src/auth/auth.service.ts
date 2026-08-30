import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { eq, and, gt, isNull } from 'drizzle-orm';
import type { DB } from 'src/db';
import { DB_TOKEN } from 'src/db/db.module';
import { adminUsers, passwordResetTokens, users, type AdminRole } from 'src/db/schema';
import { SignupDto } from './dto/signup.dto';
import type { ResetPasswordDto } from './dto/password-reset.dto';
import { MailService } from './mail.service';
import { jwtConstants, securityConstants } from './constants';
import { verifyPassword, isLegacyHash, hashPassword } from './password.util';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { ActivityLogsService } from 'src/activity-logs/activity-logs.service';

// Admin reset links live for 15 minutes.
const RESET_TOKEN_TTL_MS = 15 * 60 * 1000;

const SALT_ROUNDS = 10;

export type AccountType = 'user' | 'admin';

@Injectable()
export class AuthService {
  constructor(
    @Inject(DB_TOKEN) private readonly db: DB,
    private jwtService: JwtService,
    private mailService: MailService,
    private activityLogs: ActivityLogsService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const [user] = await this.db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.email, email))
      .limit(1);

    // Unknown email → generic failure (LocalStrategy turns null into 401).
    if (!user) return null;

    // Reject early if the account is currently locked out.
    this.assertNotLocked(user.lockedUntil);

    const isMatch = await verifyPassword(pass, user.password);
    if (!isMatch) {
      await this.registerFailedLogin('admin', user.id, user.failedLoginAttempts);
      return null;
    }

    // Successful login clears any accumulated failures.
    await this.resetFailedLogin('admin', user.id);

    // Transparently upgrade a legacy WordPress hash to native bcrypt.
    if (isLegacyHash(user.password)) {
      const upgraded = await hashPassword(pass);
      await this.db
        .update(adminUsers)
        .set({ password: upgraded })
        .where(eq(adminUsers.id, user.id));
    }

    const { password, ...result } = user;
    return result;
  }

  // ── Account lockout helpers ───────────────────────────────────────────────

  /** Throws if `lockedUntil` is in the future. */
  assertNotLocked(lockedUntil: Date | null): void {
    if (lockedUntil && lockedUntil.getTime() > Date.now()) {
      const minutes = Math.ceil((lockedUntil.getTime() - Date.now()) / 60000);
      throw new ForbiddenException(
        `Account temporarily locked due to too many failed login attempts. Try again in ${minutes} minute(s).`,
      );
    }
  }

  /**
   * Increments the failed-login counter; once it reaches the threshold the
   * account is locked for the configured duration and the counter resets.
   */
  async registerFailedLogin(
    type: AccountType,
    userId: number,
    currentAttempts: number,
  ): Promise<void> {
    const attempts = (currentAttempts ?? 0) + 1;
    const shouldLock = attempts >= securityConstants.MAX_FAILED_LOGIN_ATTEMPTS;
    const patch = {
      failedLoginAttempts: shouldLock ? 0 : attempts,
      lockedUntil: shouldLock
        ? new Date(Date.now() + securityConstants.LOCK_DURATION_MS)
        : null,
    };
    if (type === 'admin') {
      await this.db.update(adminUsers).set(patch).where(eq(adminUsers.id, userId));
    } else {
      await this.db.update(users).set(patch).where(eq(users.id, userId));
    }
  }

  /** Clears the failed-login counter and any lock. */
  async resetFailedLogin(type: AccountType, userId: number): Promise<void> {
    const patch = { failedLoginAttempts: 0, lockedUntil: null };
    if (type === 'admin') {
      await this.db.update(adminUsers).set(patch).where(eq(adminUsers.id, userId));
    } else {
      await this.db.update(users).set(patch).where(eq(users.id, userId));
    }
  }

  // ── Token revocation helpers ──────────────────────────────────────────────

  /** Marks all tokens issued before now as revoked for the given account. */
  async revokeTokens(type: AccountType, userId: number): Promise<void> {
    const patch = { tokensValidFrom: new Date() };
    if (type === 'admin') {
      await this.db.update(adminUsers).set(patch).where(eq(adminUsers.id, userId));
    } else {
      await this.db.update(users).set(patch).where(eq(users.id, userId));
    }
  }

  /** Returns the `tokensValidFrom` watermark for an account (or null). */
  async getTokensValidFrom(
    type: AccountType,
    userId: number,
  ): Promise<Date | null> {
    if (type === 'admin') {
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

  /** True if a token with the given `iat` (seconds) was issued before revocation. */
  isTokenRevoked(iat: number | undefined, validFrom: Date | null): boolean {
    if (!validFrom || !iat) return false;
    return iat < Math.floor(validFrom.getTime() / 1000);
  }

  /**
   * Server-side logout: verifies the caller's own token (signature, ignoring
   * expiry) and revokes every token for that account. Signature verification
   * prevents a forged cookie from force-logging-out arbitrary users.
   */
  async revokeByToken(accessToken?: string, refreshToken?: string): Promise<void> {
    const verify = (token: string, secret: string) => {
      try {
        return this.jwtService.verify(token, { secret, ignoreExpiration: true });
      } catch {
        return null;
      }
    };

    let payload: any = accessToken
      ? verify(accessToken, jwtConstants.secret)
      : null;
    if (!payload && refreshToken) {
      payload = verify(refreshToken, jwtConstants.refreshSecret);
    }
    if (payload?.sub) {
      await this.revokeTokens(
        payload.userType === 'admin' ? 'admin' : 'user',
        payload.sub,
      );
    }
  }

  async login(user: any, userType: 'user' | 'admin' = 'user') {
    const tokens = await this.generateTokens(
      { id: user.id, email: user.email, role: user.role },
      userType,
    );
    if (userType === 'user') {
      void this.db
        .update(users)
        .set({ lastLoginAt: new Date() })
        .where(eq(users.id, user.id));
    }
    void this.activityLogs.log({
      ...(userType === 'admin' ? { adminUserId: user.id } : { userId: user.id }),
      action: 'login',
      entity: userType,
      entityId: user.id,
    });
    return tokens;
  }

  async refreshTokens(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: jwtConstants.refreshSecret,
      });

      const userType: AccountType = payload.userType ?? 'user';

      // Reject refresh tokens that were revoked (logout / password change).
      const validFrom = await this.getTokensValidFrom(userType, payload.sub);
      if (this.isTokenRevoked(payload.iat, validFrom)) {
        throw new UnauthorizedException('Refresh token has been revoked');
      }

      // Re-read the CURRENT role from the DB so role changes (e.g. GUEST →
      // STUDENT after enrollment) take effect on token refresh.
      let role: string = payload.role ?? 'GUEST';
      if (userType === 'admin') {
        const [a] = await this.db
          .select({ role: adminUsers.role })
          .from(adminUsers)
          .where(eq(adminUsers.id, payload.sub))
          .limit(1);
        if (a) role = a.role;
      } else {
        const [u] = await this.db
          .select({ role: users.role })
          .from(users)
          .where(eq(users.id, payload.sub))
          .limit(1);
        if (u) role = u.role;
      }

      return this.generateTokens(
        { id: payload.sub, email: payload.username, role },
        userType,
      );
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async signup(dto: SignupDto) {
    const hashedPassword = await bcrypt.hash(dto.password, SALT_ROUNDS);

    const [existing] = await this.db
      .select({ id: adminUsers.id })
      .from(adminUsers)
      .where(eq(adminUsers.email, dto.email))
      .limit(1);

    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const [user] = await this.db
      .insert(adminUsers)
      .values({
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        password: hashedPassword,
        role: 'INSTRUCTOR' as AdminRole,
      })
      .returning();

    return {
      id: user.id,
      fullName: `${user.firstName} ${user.lastName}`,
      email: user.email,
      role: user.role,
    };
  }

  // ── Admin password reset (link-based token) ───────────────────────────────

  /** SHA-256 hash of a raw token — only the hash is persisted. */
  private hashResetToken(rawToken: string): string {
    return crypto.createHash('sha256').update(rawToken).digest('hex');
  }

  /**
   * Generate a single-use reset link and email it to the super admin. Always
   * resolves without revealing whether a super-admin account exists (the
   * controller responds 200 either way) to avoid account enumeration.
   */
  async sendSuperAdminResetLink(): Promise<void> {
    const [admin] = await this.db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.role, 'SUPER_ADMIN'))
      .limit(1);

    // No super admin configured → silently no-op (don't leak existence).
    if (!admin?.email) return;

    // Invalidate any outstanding (unused) links for this admin first.
    await this.db
      .update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(
        and(
          eq(passwordResetTokens.adminUserId, admin.id),
          isNull(passwordResetTokens.usedAt),
        ),
      );

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashResetToken(rawToken);
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

    await this.db.insert(passwordResetTokens).values({
      adminUserId: admin.id,
      tokenHash,
      expiresAt,
    });

    const adminUrl =
      process.env.ADMIN_URL?.replace(/\/$/, '') ?? 'http://localhost:3003';
    const resetUrl = `${adminUrl}/reset-password/${rawToken}`;

    await this.mailService.sendPasswordResetEmail(
      admin.email,
      admin.firstName,
      resetUrl,
    );
  }

  /** True if the raw token maps to a valid, unused, unexpired reset row. */
  async verifyResetToken(rawToken: string): Promise<boolean> {
    if (!rawToken) return false;
    const [row] = await this.db
      .select({ id: passwordResetTokens.id })
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.tokenHash, this.hashResetToken(rawToken)),
          isNull(passwordResetTokens.usedAt),
          gt(passwordResetTokens.expiresAt, new Date()),
        ),
      )
      .limit(1);

    return Boolean(row);
  }

  /** Consume a valid reset token and set the admin's new password. */
  async resetPasswordWithToken(dto: ResetPasswordDto): Promise<void> {
    const [row] = await this.db
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.tokenHash, this.hashResetToken(dto.token)),
          isNull(passwordResetTokens.usedAt),
          gt(passwordResetTokens.expiresAt, new Date()),
        ),
      )
      .limit(1);

    if (!row) {
      throw new BadRequestException('This reset link is invalid or has expired.');
    }

    const hashedPassword = await bcrypt.hash(dto.password, SALT_ROUNDS);

    // Mark the token used and update the password. (Neon HTTP has no interactive
    // transactions; mark the token used first so a retry can't reuse it.)
    await this.db
      .update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(eq(passwordResetTokens.id, row.id));

    await this.db
      .update(adminUsers)
      .set({
        password: hashedPassword,
        updatedAt: new Date(),
        // Invalidate sessions issued before the reset and clear any lockout.
        tokensValidFrom: new Date(),
        failedLoginAttempts: 0,
        lockedUntil: null,
      })
      .where(eq(adminUsers.id, row.adminUserId));
  }

  private generateTokens(
    user: { id: number; email: string; role: string },
    userType: 'user' | 'admin' = 'user',
  ) {
    const payload = { username: user.email, sub: user.id, role: user.role, userType };
    return {
      access_token: this.jwtService.sign(payload, {
        secret: jwtConstants.secret,
        expiresIn: '15m',
      }),
      refresh_token: this.jwtService.sign(payload, {
        secret: jwtConstants.refreshSecret,
        expiresIn: '7d',
      }),
    };
  }
}
