import {
  Controller,
  Get,
  Logger,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';
import { AccountAuthService } from './account-auth.service';
import { Public } from 'src/common/decorators/public.decorator';

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
  constructor(private accountAuthService: AccountAuthService) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
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
      const { access_token, refresh_token } =
        await this.accountAuthService.findOrCreateGoogleUser(profile, {
          awaitSideEffects: true,
        });
      res.cookie('access_token', access_token, ACCESS_TOKEN_COOKIE);
      res.cookie('refresh_token', refresh_token, REFRESH_TOKEN_COOKIE);
      this.logger.log(`Google login successful for ${profile.email}, redirecting to dashboard`);
      return res.redirect(`${FRONTEND_URL}/student/dashboard`);
    } catch (err) {
      this.logger.error(`Google OAuth callback failed for ${profile.email}: ${(err as Error).message}`, (err as Error).stack);
      return res.redirect(`${FRONTEND_URL}/login?error=google`);
    }
  }
}
