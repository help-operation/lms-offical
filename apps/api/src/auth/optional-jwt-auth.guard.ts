import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Like JwtAuthGuard, but never rejects the request. If a valid token is
 * present, `req.user` is populated (and readable via @CurrentUser()); if the
 * token is missing/invalid/expired, the request still proceeds with no user.
 *
 * Use on public endpoints that behave differently for logged-in users — e.g.
 * live-course enrollment, where a guest creates an anonymous lead but a
 * logged-in student should have the enrollment linked to their account.
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  // Override the default behaviour of throwing on a missing/invalid token.
  handleRequest<TUser = unknown>(_err: unknown, user: TUser): TUser {
    return user || (undefined as TUser);
  }
}
