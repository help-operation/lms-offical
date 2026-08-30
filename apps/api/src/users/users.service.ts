import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import type { DB } from 'src/db';
import { DB_TOKEN } from 'src/db/db.module';
import { users, type NewUser, type User } from 'src/db/schema';
import { verifyPassword } from 'src/auth/password.util';

const SALT_ROUNDS = 10;

type PublicUser = Omit<User, 'password'> & { hasPassword: boolean };

export type ContactType = 'email' | 'phone';

/**
 * Normalise + validate a contact value the same way the OTP/auth flow does, so
 * the value used to send the OTP matches the value stored on the account.
 */
export function normalizeContact(type: ContactType, raw: string): string {
  const v = (raw ?? '').trim();
  if (type === 'email') {
    const email = v.toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new BadRequestException('Invalid email address');
    }
    return email;
  }
  const phone = v.replace(/[\s-]/g, '');
  if (!/^\+?[0-9]{10,15}$/.test(phone)) {
    throw new BadRequestException('Invalid phone number');
  }
  return phone;
}

@Injectable()
export class UsersService {
  constructor(@Inject(DB_TOKEN) private readonly db: DB) {}

  async findById(id: number): Promise<PublicUser | undefined> {
    const result = await this.db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!result[0]) return undefined;
    const { password, ...rest } = result[0];
    return { ...rest, hasPassword: password != null };
  }

  async create(data: NewUser): Promise<User> {
    if (data.email) {
      const [existingEmail] = await this.db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, data.email))
        .limit(1);
      if (existingEmail) throw new ConflictException('Email already registered');
    }

    const result = await this.db.insert(users).values(data).returning();
    return result[0];
  }

  async updateProfile(
    id: number,
    data: Pick<NewUser, 'firstName' | 'lastName'> & Partial<Pick<NewUser, 'gender'>>,
  ): Promise<PublicUser | undefined> {
    const result = await this.db
      .update(users)
      .set({
        firstName: data.firstName,
        lastName: data.lastName,
        ...(data.gender !== undefined && { gender: data.gender }),
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();

    if (!result[0]) return undefined;
    const { password, ...rest } = result[0];
    return { ...rest, hasPassword: password != null };
  }

  async updateAvatar(id: number, avatar: string): Promise<PublicUser | undefined> {
    const result = await this.db
      .update(users)
      .set({ avatar, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();

    if (!result[0]) return undefined;
    const { password, ...rest } = result[0];
    return { ...rest, hasPassword: password != null };
  }

  /** Toggle the transactional-email master switch. */
  async updateNotificationPref(
    id: number,
    emailNotifications: boolean,
  ): Promise<PublicUser | undefined> {
    const result = await this.db
      .update(users)
      .set({ emailNotifications, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();

    if (!result[0]) return undefined;
    const { password, ...rest } = result[0];
    return { ...rest, hasPassword: password != null };
  }

  /**
   * Ensure a contact (email/phone) can be added to this account: the slot must
   * be empty (add-only) and the value must not already belong to another user.
   * Throws otherwise. Used both before sending the OTP and before saving.
   */
  async assertContactAvailable(
    id: number,
    type: ContactType,
    value: string,
  ): Promise<void> {
    const [me] = await this.db
      .select({ email: users.email, phone: users.phone })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!me) throw new BadRequestException('User not found');

    if (type === 'email' && me.email) {
      throw new ConflictException('You already have an email on your account');
    }
    if (type === 'phone' && me.phone) {
      throw new ConflictException('You already have a phone on your account');
    }

    const col = type === 'email' ? users.email : users.phone;
    const [taken] = await this.db
      .select({ id: users.id })
      .from(users)
      .where(eq(col, value))
      .limit(1);

    if (taken && taken.id !== id) {
      throw new ConflictException(
        type === 'email'
          ? 'This email is already in use by another account'
          : 'This phone number is already in use by another account',
      );
    }
  }

  /** Add a verified email/phone to the account (add-only, with uniqueness). */
  async setContact(
    id: number,
    type: ContactType,
    value: string,
  ): Promise<PublicUser | undefined> {
    await this.assertContactAvailable(id, type, value);

    const patch = type === 'email' ? { email: value } : { phone: value };
    const result = await this.db
      .update(users)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();

    if (!result[0]) return undefined;
    const { password, ...rest } = result[0];
    return { ...rest, hasPassword: password != null };
  }

  /**
   * Change (or, for OTP-only users, set for the first time) the account
   * password. When a password already exists, the current one must match.
   */
  async changePassword(
    id: number,
    currentPassword: string | undefined,
    newPassword: string,
  ): Promise<void> {
    if (!newPassword || newPassword.length < 6) {
      throw new BadRequestException(
        'New password must be at least 6 characters',
      );
    }

    const [user] = await this.db
      .select({ password: users.password })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!user) throw new BadRequestException('User not found');

    // If a password is already set, the current one must be provided & valid.
    if (user.password) {
      const ok =
        !!currentPassword &&
        (await verifyPassword(currentPassword, user.password));
      if (!ok) throw new UnauthorizedException('Current password is incorrect');
    }

    const hashed = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await this.db
      .update(users)
      .set({ password: hashed, updatedAt: new Date() })
      .where(eq(users.id, id));
  }
}
