import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { asc, eq } from 'drizzle-orm';
import type { DB } from 'src/db';
import { DB_TOKEN } from 'src/db/db.module';
import { codeSnippets } from 'src/db/schema';
import { RevalidationService } from 'src/common/revalidation/revalidation.service';
import { CacheTag } from 'src/common/revalidation/cache-tags';

export type CreateSnippetDto = {
  name: string;
  code: string;
  location?: 'head' | 'body_start' | 'body_end';
  scope?: 'global' | 'specific';
  pages?: string[];
  isEnabled?: boolean;
  order?: number;
};

export type UpdateSnippetDto = Partial<CreateSnippetDto>;

@Injectable()
export class CodeSnippetsService {
  constructor(
    @Inject(DB_TOKEN) private db: DB,
    private readonly revalidation: RevalidationService,
  ) {}

  /** All snippets ordered by `order` – admin use */
  async findAll() {
    return this.db.select().from(codeSnippets).orderBy(asc(codeSnippets.order));
  }

  /** Only enabled snippets – public web use */
  async findEnabled() {
    return this.db
      .select()
      .from(codeSnippets)
      .where(eq(codeSnippets.isEnabled, true))
      .orderBy(asc(codeSnippets.order));
  }

  async create(dto: CreateSnippetDto) {
    const [row] = await this.db
      .insert(codeSnippets)
      .values({
        name:      dto.name,
        code:      dto.code ?? '',
        location:  dto.location ?? 'head',
        scope:     dto.scope ?? 'global',
        pages:     dto.pages ?? [],
        isEnabled: dto.isEnabled ?? true,
        order:     dto.order ?? 0,
      })
      .returning();
    this.revalidation.revalidate([CacheTag.codeSnippets]);
    return row;
  }

  async update(id: number, dto: UpdateSnippetDto) {
    const patch: Record<string, unknown> = { updatedAt: new Date() };
    if (dto.name      !== undefined) patch.name      = dto.name;
    if (dto.code      !== undefined) patch.code      = dto.code;
    if (dto.location  !== undefined) patch.location  = dto.location;
    if (dto.scope     !== undefined) patch.scope     = dto.scope;
    if (dto.pages     !== undefined) patch.pages     = dto.pages;
    if (dto.isEnabled !== undefined) patch.isEnabled = dto.isEnabled;
    if (dto.order     !== undefined) patch.order     = dto.order;

    const [updated] = await this.db
      .update(codeSnippets)
      .set(patch)
      .where(eq(codeSnippets.id, id))
      .returning();

    if (!updated) throw new NotFoundException(`Snippet ${id} not found`);
    this.revalidation.revalidate([CacheTag.codeSnippets]);
    return updated;
  }

  async remove(id: number) {
    const [deleted] = await this.db
      .delete(codeSnippets)
      .where(eq(codeSnippets.id, id))
      .returning();
    if (!deleted) throw new NotFoundException(`Snippet ${id} not found`);
    this.revalidation.revalidate([CacheTag.codeSnippets]);
    return { success: true };
  }
}
