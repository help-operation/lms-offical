import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, desc, eq, sql } from 'drizzle-orm';
import type { DB } from 'src/db';
import { DB_TOKEN } from 'src/db/db.module';
import { shopCoupons } from 'src/db/schema';

export interface CreateShopCouponDto {
  code: string;
  type: 'percentage' | 'fixed';
  value: string;
  maxUses?: number | null;
  expiresAt?: string | null;
  isActive?: boolean;
}

export type UpdateShopCouponDto = Partial<CreateShopCouponDto>;

@Injectable()
export class ShopCouponsService {
  constructor(@Inject(DB_TOKEN) private readonly db: DB) {}

  async findAll(page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const [rows, [{ count }]] = await Promise.all([
      this.db.select().from(shopCoupons).orderBy(desc(shopCoupons.createdAt)).limit(limit).offset(offset),
      this.db.select({ count: sql<number>`count(*)` }).from(shopCoupons),
    ]);
    return { coupons: rows, total: Number(count), page, limit };
  }

  async findOne(id: number) {
    const [coupon] = await this.db.select().from(shopCoupons).where(eq(shopCoupons.id, id)).limit(1);
    if (!coupon) throw new NotFoundException('Coupon not found');
    return coupon;
  }

  async create(dto: CreateShopCouponDto) {
    const code = dto.code.toUpperCase();
    const [existing] = await this.db
      .select({ id: shopCoupons.id })
      .from(shopCoupons)
      .where(eq(shopCoupons.code, code))
      .limit(1);
    if (existing) throw new BadRequestException('Coupon code already exists');

    const [coupon] = await this.db
      .insert(shopCoupons)
      .values({
        ...dto,
        code,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      })
      .returning();
    return coupon;
  }

  async update(id: number, dto: UpdateShopCouponDto) {
    await this.findOne(id);
    const updates: Record<string, unknown> = { ...dto };
    if (dto.code) updates.code = dto.code.toUpperCase();
    if (dto.expiresAt !== undefined) updates.expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : null;

    const [updated] = await this.db
      .update(shopCoupons)
      .set(updates)
      .where(eq(shopCoupons.id, id))
      .returning();
    return updated;
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.db.delete(shopCoupons).where(eq(shopCoupons.id, id));
    return { id };
  }

  async toggle(id: number) {
    const coupon = await this.findOne(id);
    const [updated] = await this.db
      .update(shopCoupons)
      .set({ isActive: !coupon.isActive })
      .where(eq(shopCoupons.id, id))
      .returning();
    return updated;
  }
}
