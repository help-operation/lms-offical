import { Injectable, Inject, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import type { DB } from 'src/db';
import { eq, desc, asc, and, ilike, sql, SQL } from 'drizzle-orm';
import * as schema from '../db/schema';
import { DB_TOKEN } from '../db/db.module';
import { toSlug } from '../common/utils/slug.util';
import {
  buildTableQuery,
  formatPaginatedResponse,
  type TableQueryInput,
} from '../common/utils/table-query.util';
import { RevalidationService } from '../common/revalidation/revalidation.service';
import { CacheTag, blogTags } from '../common/revalidation/cache-tags';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';

const { blogPosts, blogCategories, blogPostLikes, blogPostComments, users, adminUsers } = schema;

@Injectable()
export class BlogService {
  constructor(
    @Inject(DB_TOKEN) private db: DB,
    private readonly revalidation: RevalidationService,
    private readonly activityLogs: ActivityLogsService,
  ) {}

  async listPublished(search?: string, categoryId?: number) {
    const conditions: SQL[] = [eq(blogPosts.status, 'published')];
    if (search) conditions.push(ilike(blogPosts.title, `%${search}%`));
    if (categoryId) conditions.push(eq(blogPosts.categoryId, categoryId));

    return this.db
      .select({
        id: blogPosts.id,
        title: blogPosts.title,
        slug: blogPosts.slug,
        excerpt: blogPosts.excerpt,
        thumbnail: blogPosts.thumbnail,
        publishedAt: blogPosts.publishedAt,
        authorFirstName: adminUsers.firstName,
        authorLastName: adminUsers.lastName,
        categoryId: blogPosts.categoryId,
        categoryName: blogCategories.name,
        categorySlug: blogCategories.slug,
        likeCount:    sql<number>`(SELECT COUNT(*) FROM ${blogPostLikes} WHERE ${blogPostLikes.postId} = ${blogPosts.id})`.mapWith(Number),
        commentCount: sql<number>`(SELECT COUNT(*) FROM ${blogPostComments} WHERE ${blogPostComments.postId} = ${blogPosts.id})`.mapWith(Number),
        shareCount:   blogPosts.shareCount,
      })
      .from(blogPosts)
      .innerJoin(adminUsers, eq(blogPosts.authorId, adminUsers.id))
      .leftJoin(blogCategories, eq(blogPosts.categoryId, blogCategories.id))
      .where(and(...conditions))
      .orderBy(desc(blogPosts.publishedAt));
  }

  async findBySlug(slug: string) {
    const [post] = await this.db
      .select({
        id: blogPosts.id,
        title: blogPosts.title,
        slug: blogPosts.slug,
        content: blogPosts.content,
        thumbnail: blogPosts.thumbnail,
        status: blogPosts.status,
        publishedAt: blogPosts.publishedAt,
        createdAt: blogPosts.createdAt,
        authorId: blogPosts.authorId,
        categoryId: blogPosts.categoryId,
        authorFirstName: adminUsers.firstName,
        authorLastName: adminUsers.lastName,
      })
      .from(blogPosts)
      .innerJoin(adminUsers, eq(blogPosts.authorId, adminUsers.id))
      .where(and(eq(blogPosts.slug, slug), eq(blogPosts.status, 'published')));

    if (!post) throw new NotFoundException('Post not found');
    return post;
  }

  async listAll(params: TableQueryInput = {}) {
    const q = buildTableQuery(params, {
      searchable:  [blogPosts.title, blogPosts.slug],
      sortable:    { createdAt: blogPosts.createdAt, title: blogPosts.title, publishedAt: blogPosts.publishedAt },
      filterable:  { status: (v) => eq(blogPosts.status, v as 'draft' | 'published') },
      dateColumn:  blogPosts.createdAt,
      defaultSort: desc(blogPosts.createdAt),
    });

    const [rows, [countRow]] = await Promise.all([
      this.db
        .select({
          id:              blogPosts.id,
          title:           blogPosts.title,
          slug:            blogPosts.slug,
          excerpt:         blogPosts.excerpt,
          content:         blogPosts.content,
          thumbnail:       blogPosts.thumbnail,
          status:          blogPosts.status,
          publishedAt:     blogPosts.publishedAt,
          createdAt:       blogPosts.createdAt,
          authorId:        blogPosts.authorId,
          categoryId:      blogPosts.categoryId,
          authorFirstName: adminUsers.firstName,
          authorLastName:  adminUsers.lastName,
          likeCount:    sql<number>`(SELECT COUNT(*) FROM ${blogPostLikes} WHERE ${blogPostLikes.postId} = ${blogPosts.id})`.mapWith(Number),
          commentCount: sql<number>`(SELECT COUNT(*) FROM ${blogPostComments} WHERE ${blogPostComments.postId} = ${blogPosts.id})`.mapWith(Number),
          shareCount:   blogPosts.shareCount,
        })
        .from(blogPosts)
        .innerJoin(adminUsers, eq(blogPosts.authorId, adminUsers.id))
        .where(q.where)
        .orderBy(q.orderBy)
        .limit(q.limit)
        .offset(q.offset),
      this.db
        .select({ count: sql<number>`COUNT(*)`.mapWith(Number) })
        .from(blogPosts)
        .innerJoin(adminUsers, eq(blogPosts.authorId, adminUsers.id))
        .where(q.where),
    ]);

    return formatPaginatedResponse(rows, countRow?.count ?? 0, q.page, q.perPage);
  }

  async findByIdAdmin(id: number) {
    const [post] = await this.db
      .select({
        id:              blogPosts.id,
        title:           blogPosts.title,
        slug:            blogPosts.slug,
        excerpt:         blogPosts.excerpt,
        content:         blogPosts.content,
        thumbnail:       blogPosts.thumbnail,
        status:          blogPosts.status,
        categoryId:      blogPosts.categoryId,
        publishedAt:     blogPosts.publishedAt,
        createdAt:       blogPosts.createdAt,
        authorId:        blogPosts.authorId,
        authorFirstName: adminUsers.firstName,
        authorLastName:  adminUsers.lastName,
      })
      .from(blogPosts)
      .innerJoin(adminUsers, eq(blogPosts.authorId, adminUsers.id))
      .where(eq(blogPosts.id, id));

    if (!post) throw new NotFoundException('Post not found');
    return post;
  }

  async create(
    authorId: number,
    data: { title: string; excerpt?: string; content?: string; thumbnail?: string; categoryId?: number; publish?: boolean },
  ) {
    const slug = await this.uniqueSlug(data.title);
    const [post] = await this.db
      .insert(blogPosts)
      .values({
        authorId,
        title:      data.title,
        slug,
        excerpt:    data.excerpt,
        content:    data.content,
        thumbnail:  data.thumbnail,
        categoryId: data.categoryId,
        status:     data.publish ? 'published' : 'draft',
        publishedAt: data.publish ? new Date() : undefined,
      })
      .returning();
    this.revalidation.revalidate(blogTags(post.slug));
    void this.activityLogs.log({ adminUserId: authorId, action: 'blog_post_created', entity: 'blog_post', entityId: post.id, meta: { title: data.title } });
    return post;
  }

  async update(
    id: number,
    userId: number,
    role: string,
    data: { title?: string; slug?: string; excerpt?: string; content?: string; thumbnail?: string; categoryId?: number | null; publish?: boolean },
  ) {
    const [post] = await this.db.select().from(blogPosts).where(eq(blogPosts.id, id));
    if (!post) throw new NotFoundException('Post not found');
    if (role !== 'SUPER_ADMIN' && post.authorId !== userId) throw new ForbiddenException();

    // If a custom slug is provided, ensure uniqueness (unless unchanged)
    let resolvedSlug: string | undefined;
    if (data.slug && data.slug !== post.slug) {
      resolvedSlug = await this.uniqueSlug(data.slug);
    }

    const [updated] = await this.db
      .update(blogPosts)
      .set({
        ...(data.title     && { title: data.title }),
        ...(resolvedSlug   && { slug: resolvedSlug }),
        ...(data.excerpt   !== undefined && { excerpt: data.excerpt }),
        ...(data.content   !== undefined && { content: data.content }),
        ...(data.thumbnail !== undefined && { thumbnail: data.thumbnail }),
        ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
        ...(data.publish   !== undefined && {
          status:      data.publish ? 'published' : 'draft',
          publishedAt: data.publish ? new Date() : null,
        }),
        updatedAt: new Date(),
      })
      .where(eq(blogPosts.id, id))
      .returning();
    this.revalidation.revalidate(blogTags(updated.slug));
    void this.activityLogs.log({ adminUserId: userId, action: 'blog_post_updated', entity: 'blog_post', entityId: id });
    return updated;
  }

  async remove(id: number, userId: number, role: string) {
    const [post] = await this.db.select().from(blogPosts).where(eq(blogPosts.id, id));
    if (!post) throw new NotFoundException('Post not found');
    if (role !== 'SUPER_ADMIN' && post.authorId !== userId) throw new ForbiddenException();
    await this.db.delete(blogPosts).where(eq(blogPosts.id, id));
    this.revalidation.revalidate(blogTags(post.slug));
    void this.activityLogs.log({ adminUserId: userId, action: 'blog_post_deleted', entity: 'blog_post', entityId: id });
    return { success: true };
  }

  // ── Likes ────────────────────────────────────────────────────────────────────

  async getLikeStatus(postId: number): Promise<{ count: number }> {
    const [row] = await this.db
      .select({ count: sql<number>`COUNT(*)`.mapWith(Number) })
      .from(blogPostLikes)
      .where(eq(blogPostLikes.postId, postId));
    return { count: row?.count ?? 0 };
  }

  async getMyLike(postId: number, userId: number): Promise<{ liked: boolean }> {
    const [row] = await this.db
      .select({ id: blogPostLikes.id })
      .from(blogPostLikes)
      .where(and(eq(blogPostLikes.postId, postId), eq(blogPostLikes.userId, userId)));
    return { liked: !!row };
  }

  async toggleLike(postId: number, userId: number): Promise<{ count: number; liked: boolean }> {
    const [existing] = await this.db
      .select({ id: blogPostLikes.id })
      .from(blogPostLikes)
      .where(and(eq(blogPostLikes.postId, postId), eq(blogPostLikes.userId, userId)));

    if (existing) {
      await this.db.delete(blogPostLikes)
        .where(and(eq(blogPostLikes.postId, postId), eq(blogPostLikes.userId, userId)));
    } else {
      await this.db.insert(blogPostLikes).values({ postId, userId });
    }

    const { count } = await this.getLikeStatus(postId);
    return { count, liked: !existing };
  }

  // ── Comments ─────────────────────────────────────────────────────────────────

  async getComments(postId: number) {
    return this.db
      .select({
        id:              blogPostComments.id,
        postId:          blogPostComments.postId,
        parentId:        blogPostComments.parentId,
        content:         blogPostComments.content,
        createdAt:       blogPostComments.createdAt,
        updatedAt:       blogPostComments.updatedAt,
        userId:          blogPostComments.userId,
        authorFirstName: users.firstName,
        authorLastName:  users.lastName,
        authorAvatar:    users.avatar,
      })
      .from(blogPostComments)
      .innerJoin(users, eq(blogPostComments.userId, users.id))
      .where(eq(blogPostComments.postId, postId))
      .orderBy(asc(blogPostComments.createdAt));
  }

  async createComment(
    postId: number,
    userId: number,
    data: { content: string; parentId?: number },
  ) {
    if (data.parentId) {
      const [parent] = await this.db
        .select({ id: blogPostComments.id, parentId: blogPostComments.parentId, postId: blogPostComments.postId })
        .from(blogPostComments)
        .where(eq(blogPostComments.id, data.parentId));

      if (!parent || parent.postId !== postId)
        throw new NotFoundException('Parent comment not found');
      if (parent.parentId !== null)
        throw new BadRequestException('Cannot reply to a reply');
    }

    const [inserted] = await this.db
      .insert(blogPostComments)
      .values({ postId, userId, content: data.content, parentId: data.parentId ?? null })
      .returning({ id: blogPostComments.id });

    const [comment] = await this.db
      .select({
        id:              blogPostComments.id,
        postId:          blogPostComments.postId,
        parentId:        blogPostComments.parentId,
        content:         blogPostComments.content,
        createdAt:       blogPostComments.createdAt,
        updatedAt:       blogPostComments.updatedAt,
        userId:          blogPostComments.userId,
        authorFirstName: users.firstName,
        authorLastName:  users.lastName,
        authorAvatar:    users.avatar,
      })
      .from(blogPostComments)
      .innerJoin(users, eq(blogPostComments.userId, users.id))
      .where(eq(blogPostComments.id, inserted.id));

    return comment;
  }

  async deleteComment(commentId: number, userId: number, role: string) {
    const [comment] = await this.db
      .select({ id: blogPostComments.id, userId: blogPostComments.userId })
      .from(blogPostComments)
      .where(eq(blogPostComments.id, commentId));

    if (!comment) throw new NotFoundException('Comment not found');
    if (role !== 'SUPER_ADMIN' && comment.userId !== userId) throw new ForbiddenException();

    // Replies are cascade-deleted by the DB FK
    await this.db.delete(blogPostComments).where(eq(blogPostComments.id, commentId));
    return { success: true };
  }

  async trackShare(postId: number) {
    await this.db
      .update(blogPosts)
      .set({ shareCount: sql`${blogPosts.shareCount} + 1` })
      .where(eq(blogPosts.id, postId));
    return { success: true };
  }

  /** Admin — all comments across all posts with post title + user info */
  async listAllComments(search?: string) {
    const rows = await this.db
      .select({
        id:          blogPostComments.id,
        postId:      blogPostComments.postId,
        postTitle:   blogPosts.title,
        postSlug:    blogPosts.slug,
        parentId:    blogPostComments.parentId,
        content:     blogPostComments.content,
        createdAt:   blogPostComments.createdAt,
        userId:      users.id,
        userFirstName: users.firstName,
        userLastName:  users.lastName,
        userAvatar:    users.avatar,
      })
      .from(blogPostComments)
      .innerJoin(users,     eq(blogPostComments.userId, users.id))
      .innerJoin(blogPosts, eq(blogPostComments.postId, blogPosts.id))
      .orderBy(desc(blogPostComments.createdAt));

    if (search) {
      const q = search.toLowerCase();
      return rows.filter(
        (r) =>
          r.content.toLowerCase().includes(q) ||
          (r.userFirstName ?? '').toLowerCase().includes(q) ||
          (r.userLastName  ?? '').toLowerCase().includes(q) ||
          r.postTitle.toLowerCase().includes(q),
      );
    }
    return rows;
  }

  async deleteCommentAdmin(id: number) {
    await this.db.delete(blogPostComments).where(eq(blogPostComments.id, id));
    return { success: true };
  }

  async categories() {
    return this.db.select().from(blogCategories).orderBy(blogCategories.name);
  }

  async createCategory(name: string) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const [row] = await this.db.insert(blogCategories).values({ name, slug }).returning();
    this.revalidation.revalidate([CacheTag.blog]);
    return row;
  }

  async updateCategory(id: number, name: string) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const [row] = await this.db.update(blogCategories).set({ name, slug }).where(eq(blogCategories.id, id)).returning();
    this.revalidation.revalidate([CacheTag.blog]);
    return row;
  }

  async deleteCategory(id: number) {
    await this.db.delete(blogCategories).where(eq(blogCategories.id, id));
    this.revalidation.revalidate([CacheTag.blog]);
    return { success: true };
  }

  private async uniqueSlug(title: string): Promise<string> {
    const base = toSlug(title);

    // Pull `base` and any `base-N` variants, then pick the first free slug.
    const rows = await this.db
      .select({ slug: blogPosts.slug })
      .from(blogPosts)
      .where(ilike(blogPosts.slug, `${base}%`));
    const taken = new Set(rows.map((r) => r.slug));

    if (!taken.has(base)) return base;

    let n = 2;
    while (taken.has(`${base}-${n}`)) n++;
    return `${base}-${n}`;
  }
}
