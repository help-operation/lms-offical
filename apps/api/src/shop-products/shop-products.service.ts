import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, desc, eq, sql } from 'drizzle-orm';
import type { DB } from 'src/db';
import { DB_TOKEN } from 'src/db/db.module';
import { shopProducts } from 'src/db/schema';
import type { TableQueryInput } from 'src/common/utils/table-query.util';
import { buildTableQuery, formatPaginatedResponse } from 'src/common/utils/table-query.util';

export interface CreateShopProductDto {
  title: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  type: 'physical' | 'digital' | 'bundle' | 'tool';
  price: string;
  discountPrice?: string | null;
  images?: string[];
  stock?: number | null;
  downloadUrl?: string | null;
  courseId?: number | null;
  isActive?: boolean;
  isFeatured?: boolean;
  sortOrder?: number;
  metaTitle?: string | null;
  metaDescription?: string | null;
}

export type UpdateShopProductDto = Partial<CreateShopProductDto>;

@Injectable()
export class ShopProductsService {
  constructor(@Inject(DB_TOKEN) private readonly db: DB) {}

  /** Public listing — only active products */
  async findAllPublic() {
    return this.db
      .select()
      .from(shopProducts)
      .where(eq(shopProducts.isActive, true))
      .orderBy(asc(shopProducts.sortOrder), desc(shopProducts.createdAt));
  }

  /** Single active product by slug */
  async findBySlugPublic(slug: string) {
    const [product] = await this.db
      .select()
      .from(shopProducts)
      .where(and(eq(shopProducts.slug, slug), eq(shopProducts.isActive, true)))
      .limit(1);
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  /** Admin paginated listing */
  async findAll(query: TableQueryInput) {
    const { where, orderBy, limit, offset, page, perPage } = buildTableQuery(query, {
      searchable: [shopProducts.title, shopProducts.slug],
      sortable: { title: shopProducts.title, price: shopProducts.price, sortOrder: shopProducts.sortOrder, createdAt: shopProducts.createdAt },
      defaultSort: desc(shopProducts.createdAt),
    });

    const [rows, [{ count }]] = await Promise.all([
      this.db.select().from(shopProducts).where(where).orderBy(orderBy).limit(limit).offset(offset),
      this.db.select({ count: sql<number>`count(*)::int` }).from(shopProducts).where(where),
    ]);

    return formatPaginatedResponse(rows, count, page, perPage);
  }

  async findOne(id: number) {
    const [product] = await this.db
      .select()
      .from(shopProducts)
      .where(eq(shopProducts.id, id))
      .limit(1);
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async create(dto: CreateShopProductDto) {
    await this.assertSlugUnique(dto.slug);
    const [product] = await this.db
      .insert(shopProducts)
      .values({
        ...dto,
        images: dto.images ?? [],
      })
      .returning();
    return product;
  }

  async update(id: number, dto: UpdateShopProductDto) {
    await this.findOne(id);
    if (dto.slug) await this.assertSlugUnique(dto.slug, id);
    const [updated] = await this.db
      .update(shopProducts)
      .set({ ...dto, updatedAt: new Date() })
      .where(eq(shopProducts.id, id))
      .returning();
    return updated;
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.db.delete(shopProducts).where(eq(shopProducts.id, id));
    return { id };
  }

  async toggle(id: number) {
    const product = await this.findOne(id);
    const [updated] = await this.db
      .update(shopProducts)
      .set({ isActive: !product.isActive, updatedAt: new Date() })
      .where(eq(shopProducts.id, id))
      .returning();
    return updated;
  }

  private async assertSlugUnique(slug: string, excludeId?: number) {
    const existing = await this.db
      .select({ id: shopProducts.id })
      .from(shopProducts)
      .where(
        excludeId
          ? and(eq(shopProducts.slug, slug), sql`${shopProducts.id} != ${excludeId}`)
          : eq(shopProducts.slug, slug),
      )
      .limit(1);
    if (existing.length > 0) throw new BadRequestException('Slug already in use');
  }
}
