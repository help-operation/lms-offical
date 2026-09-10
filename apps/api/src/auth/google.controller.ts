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
    const profile = req.user as {
      email: string;
      firstName: string;
      lastName: string;
      avatar: string | null;
    };

    this.logger.log(`Google callback profile: email=${profile?.email}, firstName=${profile?.firstName}, lastName=${profile?.lastName}`);

    if (!profile?.email) {
      this.logger.warn('Google callback: no email in profile, redirecting to login');
      return res.redirect(`${FRONTEND_URL}/login?error=google`);
    }

    try {
      const { access_token, refresh_token, emailVerified } =
        await this.accountAuthService.findOrCreateGoogleUser(profile, {
          awaitSideEffects: true,
        });
      res.cookie('access_token', access_token, ACCESS_TOKEN_COOKIE);
      res.cookie('refresh_token', refresh_token, REFRESH_TOKEN_COOKIE);

      if (!emailVerified) {
        this.logger.log(`Google login for unverified email ${profile.email}, sending OTP and redirecting to verification`);
        // Send email OTP using the existing OTP infrastructure
        await this.otpService.sendOtpTo(profile.email);
        return res.redirect(`${FRONTEND_URL}/verify-email?email=${encodeURIComponent(profile.email)}`);
      }

      this.logger.log(`Google login successful for ${profile.email}, redirecting to dashboard`);
      return res.redirect(`${FRONTEND_URL}/guest/dashboard`);
    } catch (err) {
      this.logger.error(`Google OAuth callback failed for ${profile.email}: ${(err as Error).message}`, (err as Error).stack);
      return res.redirect(`${FRONTEND_URL}/login?error=google`);
    }
  }
}
