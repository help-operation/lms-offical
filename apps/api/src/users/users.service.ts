import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { eq, and, asc } from 'drizzle-orm';
import type { DB } from 'src/db';
import { DB_TOKEN } from 'src/db/db.module';
import {
  users,
  userEducation,
  userExperience,
  userSkills,
  type NewUser,
  type User,
} from 'src/db/schema';
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

  // ── Address ────────────────────────────────────────────────────────────────

  async updateAddress(
    id: number,
    data: Record<string, string | boolean | undefined>,
  ): Promise<PublicUser | undefined> {
    const set: Record<string, unknown> = { updatedAt: new Date() };
    const fieldMap: Record<string, string> = {
      permanentCountry: 'country',
      permanentDivision: 'division',
      permanentDistrict: 'district',
      permanentThana: 'thana',
      permanentUnion: 'unionName',
      permanentPostCode: 'postCode',
      permanentAddress: 'permanentAddress',
      sameAsPermanent: 'sameAsPermanent',
      presentCountry: 'presentCountry',
      presentDivision: 'presentDivision',
      presentDistrict: 'presentDistrict',
      presentThana: 'presentThana',
      presentUnion: 'presentUnion',
      presentPostCode: 'presentPostCode',
      presentAddress: 'presentAddress',
    };
    for (const [key, value] of Object.entries(data)) {
      const col = fieldMap[key];
      if (col && value !== undefined) set[col] = value;
    }
    const result = await this.db
      .update(users)
      .set(set)
      .where(eq(users.id, id))
      .returning();

    if (!result[0]) return undefined;
    const { password, ...rest } = result[0];
    return { ...rest, hasPassword: password != null };
  }

  async getAddress(id: number) {
    const [user] = await this.db
      .select({
        permanentCountry: users.country,
        permanentDivision: users.division,
        permanentDistrict: users.district,
        permanentThana: users.thana,
        permanentUnion: users.unionName,
        permanentPostCode: users.postCode,
        permanentAddress: users.permanentAddress,
        sameAsPermanent: users.sameAsPermanent,
        presentCountry: users.presentCountry,
        presentDivision: users.presentDivision,
        presentDistrict: users.presentDistrict,
        presentThana: users.presentThana,
        presentUnion: users.presentUnion,
        presentPostCode: users.presentPostCode,
        presentAddress: users.presentAddress,
      })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    return user ?? null;
  }

  // ── Emergency Contact ──────────────────────────────────────────────────────

  async updateEmergencyContact(
    id: number,
    data: {
      emergencyContactName: string;
      emergencyContactPhone: string;
      emergencyContactRelationship?: string;
    },
  ): Promise<PublicUser | undefined> {
    const result = await this.db
      .update(users)
      .set({
        emergencyContactName: data.emergencyContactName,
        emergencyContactPhone: data.emergencyContactPhone,
        emergencyContactRelationship: data.emergencyContactRelationship ?? null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();

    if (!result[0]) return undefined;
    const { password, ...rest } = result[0];
    return { ...rest, hasPassword: password != null };
  }

  async getEmergencyContact(id: number) {
    const [user] = await this.db
      .select({
        emergencyContactName: users.emergencyContactName,
        emergencyContactPhone: users.emergencyContactPhone,
        emergencyContactRelationship: users.emergencyContactRelationship,
      })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    return user ?? null;
  }

  // ── Education ──────────────────────────────────────────────────────────────

  async listEducation(userId: number) {
    return this.db
      .select()
      .from(userEducation)
      .where(eq(userEducation.userId, userId))
      .orderBy(asc(userEducation.order), asc(userEducation.id));
  }

  async createEducation(
    userId: number,
    data: {
      degree?: string;
      institution?: string;
      subject?: string;
      passingYear?: number;
      result?: string;
      order?: number;
    },
  ) {
    const [result] = await this.db
      .insert(userEducation)
      .values({ userId, ...data })
      .returning();
    return result;
  }

  async updateEducation(
    userId: number,
    id: number,
    data: Record<string, unknown>,
  ) {
    const [existing] = await this.db
      .select({ id: userEducation.id })
      .from(userEducation)
      .where(and(eq(userEducation.id, id), eq(userEducation.userId, userId)))
      .limit(1);
    if (!existing) throw new NotFoundException('Education record not found');

    const [result] = await this.db
      .update(userEducation)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(userEducation.id, id))
      .returning();
    return result;
  }

  async deleteEducation(userId: number, id: number) {
    const [existing] = await this.db
      .select({ id: userEducation.id })
      .from(userEducation)
      .where(and(eq(userEducation.id, id), eq(userEducation.userId, userId)))
      .limit(1);
    if (!existing) throw new NotFoundException('Education record not found');

    await this.db.delete(userEducation).where(eq(userEducation.id, id));
  }

  // ── Experience ─────────────────────────────────────────────────────────────

  async listExperience(userId: number) {
    return this.db
      .select()
      .from(userExperience)
      .where(eq(userExperience.userId, userId))
      .orderBy(asc(userExperience.order), asc(userExperience.id));
  }

  async createExperience(
    userId: number,
    data: Record<string, unknown>,
  ) {
    const [result] = await this.db
      .insert(userExperience)
      .values({ userId, ...data } as any)
      .returning();
    return result;
  }

  async updateExperience(
    userId: number,
    id: number,
    data: Record<string, unknown>,
  ) {
    const [existing] = await this.db
      .select({ id: userExperience.id })
      .from(userExperience)
      .where(and(eq(userExperience.id, id), eq(userExperience.userId, userId)))
      .limit(1);
    if (!existing) throw new NotFoundException('Experience record not found');

    const [result] = await this.db
      .update(userExperience)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(userExperience.id, id))
      .returning();
    return result;
  }

  async deleteExperience(userId: number, id: number) {
    const [existing] = await this.db
      .select({ id: userExperience.id })
      .from(userExperience)
      .where(and(eq(userExperience.id, id), eq(userExperience.userId, userId)))
      .limit(1);
    if (!existing) throw new NotFoundException('Experience record not found');

    await this.db.delete(userExperience).where(eq(userExperience.id, id));
  }

  // ── Skills ─────────────────────────────────────────────────────────────────

  async listSkills(userId: number) {
    return this.db
      .select()
      .from(userSkills)
      .where(eq(userSkills.userId, userId))
      .orderBy(asc(userSkills.order), asc(userSkills.id));
  }

  async addSkill(
    userId: number,
    data: { skillName: string; level?: string },
  ) {
    const [result] = await this.db
      .insert(userSkills)
      .values({ userId, skillName: data.skillName, level: data.level ?? 'intermediate' })
      .returning();
    return result;
  }

  async removeSkill(userId: number, id: number) {
    const [existing] = await this.db
      .select({ id: userSkills.id })
      .from(userSkills)
      .where(and(eq(userSkills.id, id), eq(userSkills.userId, userId)))
      .limit(1);
    if (!existing) throw new NotFoundException('Skill not found');

    await this.db.delete(userSkills).where(eq(userSkills.id, id));
  }
}
