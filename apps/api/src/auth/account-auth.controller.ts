import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { AccountAuthService } from './account-auth.service';
import {
  AccountSendOtpDto,
  AccountLoginDto,
  AccountSignupDto,
  AccountResetDto,
} from './dto/account-auth.dto';
import { Public } from 'src/common/decorators/public.decorator';
import { Message } from 'src/common/decorators/message.decorator';

const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN || undefined;

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

@Public()
@Controller('auth/account')
export class AccountAuthController {
  constructor(private accountAuthService: AccountAuthService) {}

  // OTP sends hit email/SMS providers — cap tightly per IP.
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @Post('send-otp')
  @HttpCode(HttpStatus.OK)
  @Message('OTP sent successfully')
  async sendOtp(@Body() dto: AccountSendOtpDto) {
    await this.accountAuthService.sendOtp(dto.identifier, dto.purpose);
    return null;
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  @Message('Account created successfully')
  async signup(
    @Body() dto: AccountSignupDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { access_token, refresh_token } =
      await this.accountAuthService.signup(dto);
    res.cookie('access_token', access_token, ACCESS_TOKEN_COOKIE);
    res.cookie('refresh_token', refresh_token, REFRESH_TOKEN_COOKIE);
    return null;
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Message('Login successful')
  async login(
    @Body() dto: AccountLoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { access_token, refresh_token } =
      await this.accountAuthService.login(dto);
    res.cookie('access_token', access_token, ACCESS_TOKEN_COOKIE);
    res.cookie('refresh_token', refresh_token, REFRESH_TOKEN_COOKIE);
    return null;
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @Message('Password reset successfully')
  async forgotPassword(
    @Body() dto: AccountResetDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { access_token, refresh_token } =
      await this.accountAuthService.forgotPassword(dto);
    res.cookie('access_token', access_token, ACCESS_TOKEN_COOKIE);
    res.cookie('refresh_token', refresh_token, REFRESH_TOKEN_COOKIE);
    return null;
  }
}
