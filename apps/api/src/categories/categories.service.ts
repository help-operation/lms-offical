import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { asc, eq, sql } from 'drizzle-orm';
import type { DB } from 'src/db';
import { DB_TOKEN } from 'src/db/db.module';
import { categories } from 'src/db/schema';
import { toSlug } from 'src/common/utils/slug.util';
import type { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import {
  buildTableQuery,
  formatPaginatedResponse,
  type TableQueryInput,
} from 'src/common/utils/table-query.util';

@Injectable()
export class CategoriesService {
  constructor(@Inject(DB_TOKEN) private readonly db: DB) {}

  async findAll() {
    return this.db
      .select()
      .from(categories)
      .where(eq(categories.isActive, true))
      .orderBy(categories.name);
  }

  async findAllAdmin(params: TableQueryInput = {}) {
    const q = buildTableQuery(params, {
      searchable:  [categories.name, categories.slug],
      sortable:    { name: categories.name, createdAt: categories.createdAt },
      filterable:  {
        isActive: (v) => sql`${categories.isActive} = ${v === 'true'}`,
      },
      defaultSort: asc(categories.name),
    });

    const [rows, [countRow]] = await Promise.all([
      this.db
        .select()
        .from(categories)
        .where(q.where)
        .orderBy(q.orderBy)
        .limit(q.limit)
        .offset(q.offset),
      this.db
        .select({ count: sql<number>`COUNT(*)`.mapWith(Number) })
        .from(categories)
        .where(q.where),
    ]);

    return formatPaginatedResponse(rows, countRow?.count ?? 0, q.page, q.perPage);
  }

  async findById(id: number) {
    const [category] = await this.db
      .select()
      .from(categories)
      .where(eq(categories.id, id))
      .limit(1);
    return category;
  }

  async create(dto: CreateCategoryDto) {
    const slug = toSlug(dto.name);

    const [existing] = await this.db
      .select()
      .from(categories)
      .where(eq(categories.slug, slug))
      .limit(1);

    if (existing) throw new ConflictException('Category with this name already exists');

    const [category] = await this.db
      .insert(categories)
      .values({ name: dto.name, slug, description: dto.description, icon: dto.icon })
      .returning();

    return category;
  }

  async update(id: number, dto: UpdateCategoryDto) {
    const category = await this.findById(id);
    if (!category) throw new NotFoundException('Category not found');

    const updates: Partial<typeof categories.$inferInsert> = {};
    if (dto.name) {
      updates.name = dto.name;
      updates.slug = toSlug(dto.name);
    }
    if (dto.description !== undefined) updates.description = dto.description;
    if (dto.icon !== undefined) updates.icon = dto.icon;
    if (dto.isActive !== undefined) updates.isActive = dto.isActive;

    const [updated] = await this.db
      .update(categories)
      .set(updates)
      .where(eq(categories.id, id))
      .returning();

    return updated;
  }

  async remove(id: number) {
    const category = await this.findById(id);
    if (!category) throw new NotFoundException('Category not found');

    await this.db.delete(categories).where(eq(categories.id, id));
    return { deleted: true };
  }

  async toggleActive(id: number) {
    const category = await this.findById(id);
    if (!category) throw new NotFoundException('Category not found');

    const [updated] = await this.db
      .update(categories)
      .set({ isActive: !category.isActive })
      .where(eq(categories.id, id))
      .returning();

    return updated;
  }
}
