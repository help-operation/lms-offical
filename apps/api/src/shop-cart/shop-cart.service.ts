import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';
import type { DB } from 'src/db';
import { DB_TOKEN } from 'src/db/db.module';
import { shopCartItems, shopProducts } from 'src/db/schema';

@Injectable()
export class ShopCartService {
  constructor(@Inject(DB_TOKEN) private readonly db: DB) {}

  private buildFilter(userId?: number, sessionId?: string) {
    if (userId) return eq(shopCartItems.userId, userId);
    if (sessionId) return eq(shopCartItems.sessionId, sessionId);
    throw new BadRequestException('Must supply userId or sessionId');
  }

  async getCart(userId?: number, sessionId?: string) {
    const filter = this.buildFilter(userId, sessionId);
    const rows = await this.db
      .select({
        id: shopCartItems.id,
        quantity: shopCartItems.quantity,
        addedAt: shopCartItems.addedAt,
        product: {
          id: shopProducts.id,
          title: shopProducts.title,
          slug: shopProducts.slug,
          type: shopProducts.type,
          price: shopProducts.price,
          discountPrice: shopProducts.discountPrice,
          images: shopProducts.images,
          stock: shopProducts.stock,
          isActive: shopProducts.isActive,
        },
      })
      .from(shopCartItems)
      .innerJoin(shopProducts, eq(shopCartItems.productId, shopProducts.id))
      .where(filter);

    return rows.filter((r) => r.product.isActive);
  }

  async addToCart(productId: number, quantity: number, userId?: number, sessionId?: string) {
    const filter = this.buildFilter(userId, sessionId);

    const [product] = await this.db
      .select({ id: shopProducts.id, stock: shopProducts.stock, isActive: shopProducts.isActive })
      .from(shopProducts)
      .where(eq(shopProducts.id, productId))
      .limit(1);

    if (!product || !product.isActive) throw new BadRequestException('Product not available');
    if (product.stock !== null && product.stock < quantity) {
      throw new BadRequestException('Insufficient stock');
    }

    const [existing] = await this.db
      .select({ id: shopCartItems.id, quantity: shopCartItems.quantity })
      .from(shopCartItems)
      .where(and(filter, eq(shopCartItems.productId, productId)))
      .limit(1);

    if (existing) {
      const newQty = existing.quantity + quantity;
      if (product.stock !== null && product.stock < newQty) {
        throw new BadRequestException('Insufficient stock');
      }
      await this.db
        .update(shopCartItems)
        .set({ quantity: newQty })
        .where(eq(shopCartItems.id, existing.id));
    } else {
      await this.db.insert(shopCartItems).values({
        productId,
        quantity,
        userId: userId ?? null,
        sessionId: sessionId ?? null,
      });
    }

    return this.getCart(userId, sessionId);
  }

  async updateQuantity(cartItemId: number, quantity: number, userId?: number, sessionId?: string) {
    if (quantity < 1) return this.removeFromCart(cartItemId, userId, sessionId);
    const filter = this.buildFilter(userId, sessionId);
    await this.db
      .update(shopCartItems)
      .set({ quantity })
      .where(and(eq(shopCartItems.id, cartItemId), filter));
    return this.getCart(userId, sessionId);
  }

  async removeFromCart(cartItemId: number, userId?: number, sessionId?: string) {
    const filter = this.buildFilter(userId, sessionId);
    await this.db
      .delete(shopCartItems)
      .where(and(eq(shopCartItems.id, cartItemId), filter));
    return this.getCart(userId, sessionId);
  }

  async clearCart(userId?: number, sessionId?: string) {
    const filter = this.buildFilter(userId, sessionId);
    await this.db.delete(shopCartItems).where(filter);
  }

  /** Migrate a guest session cart to a logged-in user (called on login) */
  async mergeGuestCart(sessionId: string, userId: number) {
    const guestItems = await this.db
      .select()
      .from(shopCartItems)
      .where(eq(shopCartItems.sessionId, sessionId));

    for (const item of guestItems) {
      const [existing] = await this.db
        .select({ id: shopCartItems.id, quantity: shopCartItems.quantity })
        .from(shopCartItems)
        .where(and(eq(shopCartItems.userId, userId), eq(shopCartItems.productId, item.productId)))
        .limit(1);

      if (existing) {
        await this.db
          .update(shopCartItems)
          .set({ quantity: existing.quantity + item.quantity })
          .where(eq(shopCartItems.id, existing.id));
        await this.db.delete(shopCartItems).where(eq(shopCartItems.id, item.id));
      } else {
        await this.db
          .update(shopCartItems)
          .set({ userId, sessionId: null })
          .where(eq(shopCartItems.id, item.id));
      }
    }
  }
}
