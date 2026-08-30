import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  NotFoundException,
  Param,
  Post,
  Req,
  Res,
  Request,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { eq } from 'drizzle-orm';
import { UsersService } from 'src/users/users.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import type { Response, Request as ExpressRequest } from 'express';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './local-auth.guard';
import { SignupDto } from './dto/signup.dto';
import { ResetPasswordDto } from './dto/password-reset.dto';
import { Message } from 'src/common/decorators/message.decorator';
import type { DB } from 'src/db';
import { DB_TOKEN } from 'src/db/db.module';
import { adminUsers } from 'src/db/schema';
import { RbacService } from 'src/rbac/rbac.service';

const IS_PRODUCTION = process.env.NODE_ENV === 'production';
// In prod set COOKIE_DOMAIN=.jashoreithub.com so cookies are shared across
// lms-web / lms-admin / lms-api subdomains. Leave unset in local dev.
const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN || undefined;
const CLEAR_COOKIE_OPTS = { path: '/', domain: COOKIE_DOMAIN };

// Web app cookies (students/guests — phone auth)
const ACCESS_TOKEN_COOKIE = {
  httpOnly: true, secure: IS_PRODUCTION, sameSite: 'lax' as const, path: '/',
  domain: COOKIE_DOMAIN, maxAge: 15 * 60 * 1000,
};
const REFRESH_TOKEN_COOKIE = {
  httpOnly: true, secure: IS_PRODUCTION, sameSite: 'lax' as const, path: '/',
  domain: COOKIE_DOMAIN, maxAge: 7 * 24 * 60 * 60 * 1000,
};

// Admin app cookies (super_admin/instructor — email auth)
const ADMIN_ACCESS_TOKEN_COOKIE = {
  httpOnly: true, secure: IS_PRODUCTION, sameSite: 'lax' as const, path: '/',
  domain: COOKIE_DOMAIN, maxAge: 15 * 60 * 1000,
};
const ADMIN_REFRESH_TOKEN_COOKIE = {
  httpOnly: true, secure: IS_PRODUCTION, sameSite: 'lax' as const, path: '/',
  domain: COOKIE_DOMAIN, maxAge: 7 * 24 * 60 * 60 * 1000,
};

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
    private readonly rbacService: RbacService,
    @Inject(DB_TOKEN) private readonly db: DB,
  ) {}

  @Post('signup')
  @Message('Account created successfully')
  async signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto);
  }

  // ── Admin email login — sets admin_access_token / admin_refresh_token ────────

  // Brute-force guard: at most 5 login attempts per minute per IP.
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Message('Login successful')
  async login(
    @Request() req,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { access_token, refresh_token } = await this.authService.login(req.user, 'admin');
    res.cookie('admin_access_token',  access_token,  ADMIN_ACCESS_TOKEN_COOKIE);
    res.cookie('admin_refresh_token', refresh_token, ADMIN_REFRESH_TOKEN_COOKIE);
    return null;
  }

  // ── Admin password reset (link-based token) ──────────────────────────────────

  // Email sends are expensive and abusable — cap at 3/min per IP. Always responds
  // 200 so the client can't probe whether a super-admin account exists.
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @Message('If an account exists, a reset link has been sent.')
  async forgotPassword() {
    await this.authService.sendSuperAdminResetLink();
    return null;
  }

  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Get('reset-password/verify/:token')
  @HttpCode(HttpStatus.OK)
  @Message('Token checked')
  async verifyResetToken(@Param('token') token: string) {
    const valid = await this.authService.verifyResetToken(token);
    return { valid };
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @Message('Password reset successfully')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPasswordWithToken(dto);
    return null;
  }

  // ── Web token refresh (students/guests) ───────────────────────────────────────

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Message('Token refreshed successfully')
  async refresh(
    @Req() req: ExpressRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.refresh_token;
    if (!refreshToken) throw new UnauthorizedException('Refresh token required');

    const { access_token, refresh_token } = await this.authService.refreshTokens(refreshToken);
    res.cookie('access_token',  access_token,  ACCESS_TOKEN_COOKIE);
    res.cookie('refresh_token', refresh_token, REFRESH_TOKEN_COOKIE);
    return null;
  }

  // ── Admin token refresh ───────────────────────────────────────────────────────

  @Post('admin/refresh')
  @HttpCode(HttpStatus.OK)
  @Message('Token refreshed successfully')
  async adminRefresh(
    @Req() req: ExpressRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.admin_refresh_token;
    if (!refreshToken) throw new UnauthorizedException('Refresh token required');

    const { access_token, refresh_token } = await this.authService.refreshTokens(refreshToken);
    res.cookie('admin_access_token',  access_token,  ADMIN_ACCESS_TOKEN_COOKIE);
    res.cookie('admin_refresh_token', refresh_token, ADMIN_REFRESH_TOKEN_COOKIE);
    return null;
  }

  // ── Logout — clears both cookie sets ─────────────────────────────────────────

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @Message('Logged out successfully')
  async logout(
    @Req() req: ExpressRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    // Server-side revocation: invalidate every token for this account so a
    // copied/stolen token can't outlive the logout (cookies alone don't).
    const accessToken =
      req.cookies?.admin_access_token ?? req.cookies?.access_token;
    const refreshToken =
      req.cookies?.admin_refresh_token ?? req.cookies?.refresh_token;
    await this.authService.revokeByToken(accessToken, refreshToken);

    res.clearCookie('access_token',        CLEAR_COOKIE_OPTS);
    res.clearCookie('refresh_token',       CLEAR_COOKIE_OPTS);
    res.clearCookie('admin_access_token',  CLEAR_COOKIE_OPTS);
    res.clearCookie('admin_refresh_token', CLEAR_COOKIE_OPTS);
    return null;
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @Message('User fetched successfully')
  async me(@Request() req) {
    if (req.user.userType === 'admin') {
      const [adminUser] = await this.db
        .select({
          id: adminUsers.id,
          firstName: adminUsers.firstName,
          lastName: adminUsers.lastName,
          email: adminUsers.email,
          role: adminUsers.role,
          status: adminUsers.status,
          avatar: adminUsers.avatar,
          createdAt: adminUsers.createdAt,
          updatedAt: adminUsers.updatedAt,
        })
        .from(adminUsers)
        .where(eq(adminUsers.id, req.user.userId))
        .limit(1);

      if (!adminUser) throw new NotFoundException('Admin user not found');

      // Effective permission slugs so the admin UI can mirror backend access.
      const permissions = await this.rbacService.getEffectivePermissions(
        adminUser.id,
        adminUser.role,
      );
      return { ...adminUser, permissions };
    }

    const user = await this.usersService.findById(req.user.userId);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }
}
