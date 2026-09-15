import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, type Profile } from 'passport-google-oauth20';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly logger = new Logger(GoogleStrategy.name);

  constructor(config: ConfigService) {
    const isProd = config.get<string>('NODE_ENV') === 'production';
    const clientId = config.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = config.get<string>('GOOGLE_CLIENT_SECRET');
    const callbackURL = config.get<string>('GOOGLE_CALLBACK_URL');

    if (!clientId || !clientSecret) {
      const msg = 'GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set. Google login is disabled.';
      if (isProd) {
        console.error('');
        console.error('═══════════════════════════════════════════════════════════════');
        console.error('  GOOGLE OAUTH DISABLED — MISSING CREDENTIALS');
        console.error('═══════════════════════════════════════════════════════════════');
        console.error(`  ${msg}`);
        console.error('═══════════════════════════════════════════════════════════════');
        console.error('');
      } else {
        console.warn(`[GoogleStrategy] ${msg}`);
      }
    }

    if (isProd && callbackURL && callbackURL.includes('localhost')) {
      console.error('');
      console.error('═══════════════════════════════════════════════════════════════');
      console.error('  GOOGLE OAUTH MISCONFIGURED — CALLBACK URL IS LOCALHOST');
      console.error('═══════════════════════════════════════════════════════════════');
      console.error(`  GOOGLE_CALLBACK_URL=${callbackURL}`);
      console.error('  Set GOOGLE_CALLBACK_URL=https://api.leerney.com/api/auth/callback/google');
      console.error('═══════════════════════════════════════════════════════════════');
      console.error('');
    }

    if (isProd && !callbackURL) {
      console.error('');
      console.error('═══════════════════════════════════════════════════════════════');
      console.error('  GOOGLE OAUTH MISCONFIGURED — MISSING CALLBACK URL');
      console.error('═══════════════════════════════════════════════════════════════');
      console.error('  GOOGLE_CALLBACK_URL is not set. Defaults to http://localhost:3000');
      console.error('  Set GOOGLE_CALLBACK_URL=https://api.leerney.com/api/auth/callback/google');
      console.error('═══════════════════════════════════════════════════════════════');
      console.error('');
    }

    super({
      clientID: clientId || 'missing',
      clientSecret: clientSecret || 'missing',
      callbackURL: callbackURL || 'http://localhost:3000/api/auth/callback/google',
      scope: ['email', 'profile'],
    });
  }

  validate(_accessToken: string, _refreshToken: string, profile: Profile) {
    const email = profile.emails?.[0]?.value ?? '';
    return {
      email,
      firstName: profile.name?.givenName ?? '',
      lastName: profile.name?.familyName ?? '',
      avatar: profile.photos?.[0]?.value ?? null,
    };
  }
}
