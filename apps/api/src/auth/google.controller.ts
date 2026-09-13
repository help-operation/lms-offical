import {
  Controller,
  Get,
  Injectable,
  Logger,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { ExecutionContext } from '@nestjs/common';
import type { IAuthModuleOptions } from '@nestjs/passport';
import type { Request, Response } from 'express';
import { AccountAuthService } from './account-auth.service';
import { OtpService } from './otp.service';
import { Public } from 'src/common/decorators/public.decorator';

/**
 * Google auth guard that requests account selection on the consent screen.
 * Uses `prompt=select_account` so users with multiple Google accounts
 * can choose which account to authenticate with.
 */
@Injectable()
export class GoogleSelectAccountGuard extends AuthGuard('google') {
  getAuthenticateOptions(context: ExecutionContext): IAuthModuleOptions | undefined {
    return { prompt: 'select_account' };
  }
}

const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN || undefined;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3001';

const ACCESS_TOKEN_COOKIE = {
  httpOnly: true,
  secure: IS_PRODUCTION,
  sameSite: 'lax' as const,
  path: '/',
  domain: COOKIE_DOMAIN,
  maxAge: 15 * 60 * 1000,
};
const REFRESH_TOKEN_COOKIE = {
  httpOnly: true,
  secure: IS_PRODUCTION,
  sameSite: 'lax' as const,
  path: '/',
  domain: COOKIE_DOMAIN,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

// Path matches GOOGLE_CALLBACK_URL (.env): /api/auth/callback/google
// (the API has no global /api prefix, so it's spelled out here)
@Public()
@Controller('api/auth')
export class GoogleController {
  private readonly logger = new Logger(GoogleController.name);
  constructor(
    private accountAuthService: AccountAuthService,
    private otpService: OtpService,
  ) {}

  @Get('google')
  @UseGuards(GoogleSelectAccountGuard)
  // Passport redirects to Google — no body needed
  googleStart() {
    return null;
  }

  @Get('callback/google')
  @UseGuards(AuthGuard('google'))
  async googleCallback(
    @Req() req: Request,
    @Res() res: Response,
  ) {
    this.logger.log('[GOOGLE] callback entered');

    const profile = req.user as {
      email: string;
      firstName: string;
      lastName: string;
      avatar: string | null;
    };

    this.logger.log(`[GOOGLE] Google profile received: email=${profile?.email}, firstName=${profile?.firstName}, lastName=${profile?.lastName}, avatar=${profile?.avatar}`);

    if (!profile?.email) {
      this.logger.warn('[GOOGLE] no email in profile, redirecting to login');
      return res.redirect(`${FRONTEND_URL}/login?error=google`);
    }

    try {
      this.logger.log(`[GOOGLE] before findOrCreateGoogleUser for ${profile.email}`);
      const { access_token, refresh_token, emailVerified } =
        await this.accountAuthService.findOrCreateGoogleUser(profile, {
          awaitSideEffects: true,
        });
      this.logger.log(`[GOOGLE] after findOrCreateGoogleUser`);
      this.logger.log(`[GOOGLE] user id=${(req as any).user?.id}, email=${profile.email}, emailVerified=${emailVerified}`);

      this.logger.log('[GOOGLE] before access token cookie');
      res.cookie('access_token', access_token, ACCESS_TOKEN_COOKIE);
      this.logger.log('[GOOGLE] after access token cookie');

      this.logger.log('[GOOGLE] before refresh token cookie');
      res.cookie('refresh_token', refresh_token, REFRESH_TOKEN_COOKIE);
      this.logger.log('[GOOGLE] after refresh token cookie');

      if (!emailVerified) {
        this.logger.log(`[GOOGLE] before OTP for ${profile.email}`);
        try {
          await this.otpService.sendOtpTo(profile.email);
          this.logger.log('[GOOGLE] after OTP');
        } catch (otpErr) {
          this.logger.error(`[GOOGLE ERROR] name: ${(otpErr as any).name}`);
          this.logger.error(`[GOOGLE ERROR] message: ${(otpErr as Error).message}`);
          this.logger.error(`[GOOGLE ERROR] stack: ${(otpErr as Error).stack}`);
          this.logger.error(`[GOOGLE ERROR] response: ${JSON.stringify((otpErr as any).response)}`);
          this.logger.error(`[GOOGLE ERROR] cause: ${(otpErr as any).cause}`);
          throw otpErr;
        }
        const verifyEmailUrl = `${FRONTEND_URL}/verify-email?email=${encodeURIComponent(profile.email)}`;
        this.logger.log(`[GOOGLE] redirect URL = ${verifyEmailUrl}`);
        this.logger.log(`[GOOGLE] FRONTEND_URL = ${FRONTEND_URL}`);
        this.logger.log(`[GOOGLE] res.headersSent = ${res.headersSent}`);
        const redirectResult = res.redirect(verifyEmailUrl);
        this.logger.log('[GOOGLE] redirect completed');
        return redirectResult;
      }

      this.logger.log('[GOOGLE] before redirect to dashboard');
      return res.redirect(`${FRONTEND_URL}/guest/dashboard`);
    } catch (err) {
      this.logger.error(`[GOOGLE ERROR] name: ${(err as any).name}`);
      this.logger.error(`[GOOGLE ERROR] message: ${(err as Error).message}`);
      this.logger.error(`[GOOGLE ERROR] stack: ${(err as Error).stack}`);
      this.logger.error(`[GOOGLE ERROR] response: ${JSON.stringify((err as any).response)}`);
      this.logger.error(`[GOOGLE ERROR] cause: ${(err as any).cause}`);
      return res.redirect(`${FRONTEND_URL}/login?error=google`);
    }
  }
}
