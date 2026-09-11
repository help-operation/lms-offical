import { Injectable, Inject, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import type { DB } from 'src/db';
import { eq, desc, asc, and, or, ilike, sql, SQL, lte } from 'drizzle-orm';
import * as schema from '../db/schema';
import { DB_TOKEN } from '../db/db.module';
import { toSlug } from '../common/utils/slug.util';
import { validateEmbedUrlsInContent } from '../common/utils/embed-validation.util';
import {
  buildTableQuery,
  formatPaginatedResponse,
  type TableQueryInput,
} from '../common/utils/table-query.util';
import { RevalidationService } from '../common/revalidation/revalidation.service';
import { CacheTag, blogTags } from '../common/revalidation/cache-tags';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';

const { blogPosts, blogCategories, blogPostLikes, blogPostComments, blogTagsTable, blogPostTags, users, adminUsers, roles, rolePermissions, permissions } = schema;

@Injectable()
export class BlogService {
  constructor(
    @Inject(DB_TOKEN) private db: DB,
    private readonly revalidation: RevalidationService,
    private readonly activityLogs: ActivityLogsService,
  ) {}

  async listPublished(search?: string, categoryId?: number) {
    const now = new Date();
    const conditions: SQL[] = [
      or(
        eq(blogPosts.status, 'published'),
        and(eq(blogPosts.status, 'scheduled'), lte(blogPosts.publishAt, now))!,
      )!,
    ];
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
        isFeatured: blogPosts.isFeatured,
        authorFirstName: adminUsers.firstName,
        authorLastName: adminUsers.lastName,
        categoryId: blogPosts.categoryId,
        categoryName: blogCategories.name,
        categorySlug: blogCategories.slug,
        likeCount:    sql<number>`(SELECT COUNT(*) FROM ${blogPostLikes} WHERE ${blogPostLikes.postId} = ${blogPosts.id})`.mapWith(Number),
        commentCount: sql<number>`(SELECT COUNT(*) FROM ${blogPostComments} WHERE ${blogPostComments.postId} = ${blogPosts.id})`.mapWith(Number),
        shareCount:   blogPosts.shareCount,
        readingTime: sql<number>`GREATEST(1, CEIL(LENGTH(REGEXP_REPLACE(COALESCE(${blogPosts.content}, ''), '<[^>]*>', ' ', 'g')) / 8.0 / 200.0))`.mapWith(Number),
        tags: sql<string[]>`COALESCE((SELECT array_agg(json_build_object('id', bt.id, 'name', bt.name, 'slug', bt.slug) ORDER BY bt.name) FROM ${blogPostTags} bpt INNER JOIN ${blogTagsTable} bt ON bt.id = bpt.tag_id WHERE bpt.post_id = ${blogPosts.id}), '{}')`.mapWith(JSON.parse),
      })
      .from(blogPosts)
      .innerJoin(adminUsers, eq(blogPosts.authorId, adminUsers.id))
      .leftJoin(blogCategories, eq(blogPosts.categoryId, blogCategories.id))
      .where(and(...conditions))
      .orderBy(desc(blogPosts.isFeatured), desc(blogPosts.publishedAt));
  }

  async findBySlug(slug: string) {
    const now = new Date();
    const [post] = await this.db
      .select({
        id: blogPosts.id,
        title: blogPosts.title,
        slug: blogPosts.slug,
        excerpt: blogPosts.excerpt,
        content: blogPosts.content,
        thumbnail: blogPosts.thumbnail,
        status: blogPosts.status,
        publishedAt: blogPosts.publishedAt,
        createdAt: blogPosts.createdAt,
        authorId: blogPosts.authorId,
        categoryId: blogPosts.categoryId,
        authorFirstName: adminUsers.firstName,
        authorLastName: adminUsers.lastName,
        metaTitle: blogPosts.metaTitle,
        metaDescription: blogPosts.metaDescription,
        ogImage: blogPosts.ogImage,
        isFeatured: blogPosts.isFeatured,
        readingTime: sql<number>`GREATEST(1, CEIL(LENGTH(REGEXP_REPLACE(COALESCE(${blogPosts.content}, ''), '<[^>]*>', ' ', 'g')) / 8.0 / 200.0))`.mapWith(Number),
        tags: sql<string[]>`COALESCE((SELECT array_agg(json_build_object('id', bt.id, 'name', bt.name, 'slug', bt.slug) ORDER BY bt.name) FROM ${blogPostTags} bpt INNER JOIN ${blogTagsTable} bt ON bt.id = bpt.tag_id WHERE bpt.post_id = ${blogPosts.id}), '{}')`.mapWith(JSON.parse),
      })
      .from(blogPosts)
      .innerJoin(adminUsers, eq(blogPosts.authorId, adminUsers.id))
      .where(and(
        eq(blogPosts.slug, slug),
        or(
          eq(blogPosts.status, 'published'),
          and(eq(blogPosts.status, 'scheduled'), lte(blogPosts.publishAt, now))!,
        )!,
      ));

    if (!post) throw new NotFoundException('Post not found');
    return post;
  }

  async listAll(params: TableQueryInput = {}) {
    const q = buildTableQuery(params, {
      searchable:  [blogPosts.title, blogPosts.slug],
      sortable:    { createdAt: blogPosts.createdAt, title: blogPosts.title, publishedAt: blogPosts.publishedAt, publishAt: blogPosts.publishAt },
      filterable:  {
        status: (v) => eq(blogPosts.status, v as 'draft' | 'scheduled' | 'published'),
        isFeatured: (v) => eq(blogPosts.isFeatured, v === 'true'),
        categoryId: (v) => eq(blogPosts.categoryId, parseInt(v, 10)),
        authorId: (v) => eq(blogPosts.authorId, parseInt(v, 10)),
      },
      dateColumn:  blogPosts.createdAt,
      defaultSort: desc(blogPosts.createdAt),
    });

    const readingTimeExpr = sql<number>`GREATEST(1, CEIL(LENGTH(REGEXP_REPLACE(COALESCE(${blogPosts.content}, ''), '<[^>]*>', ' ', 'g')) / 8.0 / 200.0))`.mapWith(Number);

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
          publishAt:       blogPosts.publishAt,
          isFeatured:      blogPosts.isFeatured,
          createdAt:       blogPosts.createdAt,
          authorId:        blogPosts.authorId,
          categoryId:      blogPosts.categoryId,
          authorFirstName: adminUsers.firstName,
          authorLastName:  adminUsers.lastName,
          readingTime:     readingTimeExpr,
          likeCount:    sql<number>`(SELECT COUNT(*) FROM ${blogPostLikes} WHERE ${blogPostLikes.postId} = ${blogPosts.id})`.mapWith(Number),
          commentCount: sql<number>`(SELECT COUNT(*) FROM ${blogPostComments} WHERE ${blogPostComments.postId} = ${blogPosts.id})`.mapWith(Number),
          shareCount:   blogPosts.shareCount,
          metaTitle: blogPosts.metaTitle,
          metaDescription: blogPosts.metaDescription,
          ogImage: blogPosts.ogImage,
          tags: sql<string[]>`COALESCE((SELECT array_agg(json_build_object('id', bt.id, 'name', bt.name, 'slug', bt.slug) ORDER BY bt.name) FROM ${blogPostTags} bpt INNER JOIN ${blogTagsTable} bt ON bt.id = bpt.tag_id WHERE bpt.post_id = ${blogPosts.id}), '{}')`.mapWith(JSON.parse),
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
    const readingTimeExpr = sql<number>`GREATEST(1, CEIL(LENGTH(REGEXP_REPLACE(COALESCE(${blogPosts.content}, ''), '<[^>]*>', ' ', 'g')) / 8.0 / 200.0))`.mapWith(Number);

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
        publishAt:       blogPosts.publishAt,
        isFeatured:      blogPosts.isFeatured,
        createdAt:       blogPosts.createdAt,
        authorId:        blogPosts.authorId,
        authorFirstName: adminUsers.firstName,
        authorLastName:  adminUsers.lastName,
        readingTime:     readingTimeExpr,
        metaTitle: blogPosts.metaTitle,
        metaDescription: blogPosts.metaDescription,
        ogImage: blogPosts.ogImage,
        tags: sql<string[]>`COALESCE((SELECT array_agg(json_build_object('id', bt.id, 'name', bt.name, 'slug', bt.slug) ORDER BY bt.name) FROM ${blogPostTags} bpt INNER JOIN ${blogTagsTable} bt ON bt.id = bpt.tag_id WHERE bpt.post_id = ${blogPosts.id}), '{}')`.mapWith(JSON.parse),
      })
      .from(blogPosts)
      .innerJoin(adminUsers, eq(blogPosts.authorId, adminUsers.id))
      .where(eq(blogPosts.id, id));

    if (!post) throw new NotFoundException('Post not found');
    return post;
  }

  async create(
    authorId: number,
    data: { title: string; excerpt?: string; content?: string; thumbnail?: string; categoryId?: number; publish?: boolean; scheduleAt?: string; tags?: number[]; metaTitle?: string; metaDescription?: string; ogImage?: string; isFeatured?: boolean; authorId?: number },
  ) {
    if (data.content) validateEmbedUrlsInContent(data.content);
    const slug = await this.uniqueSlug(data.title);

    // Determine status and dates
    let status: 'draft' | 'scheduled' | 'published' = 'draft';
    let publishedAt: Date | undefined;
    let publishAt: Date | undefined;

    if (data.scheduleAt) {
      const scheduleDate = new Date(data.scheduleAt);
      if (scheduleDate <= new Date()) throw new BadRequestException('Schedule date must be in the future');
      status = 'scheduled';
      publishAt = scheduleDate;
    } else if (data.publish) {
      status = 'published';
      publishedAt = new Date();
    }

    // Validate and resolve author
    let resolvedAuthorId = authorId;
    if (data.authorId && data.authorId !== authorId) {
      const targetAuthor = await this.db.select().from(adminUsers).where(eq(adminUsers.id, data.authorId)).then((r) => r[0]);
      if (!targetAuthor) throw new BadRequestException('Selected author not found');
      resolvedAuthorId = data.authorId;
    }

    const [post] = await this.db
      .insert(blogPosts)
      .values({
        authorId: resolvedAuthorId,
        title:      data.title,
        slug,
        excerpt:    data.excerpt,
        content:    data.content,
        thumbnail:  data.thumbnail,
        categoryId: data.categoryId,
        status,
        publishedAt,
        publishAt,
        isFeatured: data.isFeatured ?? false,
        metaTitle: data.metaTitle,
        metaDescription: data.metaDescription,
        ogImage: data.ogImage,
      })
      .returning();

    if (data.tags?.length) {
      await this.db.insert(blogPostTags).values(
        data.tags.map((tagId) => ({ postId: post.id, tagId })),
      );
    }

    this.revalidation.revalidate(blogTags(post.slug));
    void this.activityLogs.log({ adminUserId: authorId, action: 'blog_post_created', entity: 'blog_post', entityId: post.id, meta: { title: data.title } });
    return post;
  }

  async update(
    id: number,
    userId: number,
    role: string,
    data: { title?: string; slug?: string; excerpt?: string; content?: string; thumbnail?: string; categoryId?: number | null; publish?: boolean; scheduleAt?: string | null; tags?: number[]; metaTitle?: string | null; metaDescription?: string | null; ogImage?: string | null; isFeatured?: boolean; authorId?: number },
  ) {
    const [post] = await this.db.select().from(blogPosts).where(eq(blogPosts.id, id));
    if (!post) throw new NotFoundException('Post not found');
    if (role !== 'SUPER_ADMIN' && post.authorId !== userId) throw new ForbiddenException();

    if (data.content) validateEmbedUrlsInContent(data.content);

    // If a custom slug is provided, ensure uniqueness (unless unchanged)
    let resolvedSlug: string | undefined;
    if (data.slug && data.slug !== post.slug) {
      resolvedSlug = await this.uniqueSlug(data.slug);
    }

    // Determine status/dates from the new publish model
    const setStatus: Partial<typeof blogPosts.$inferInsert> = {};
    if (data.scheduleAt !== undefined || data.publish !== undefined) {
      if (data.scheduleAt) {
        const scheduleDate = new Date(data.scheduleAt);
        if (scheduleDate <= new Date()) throw new BadRequestException('Schedule date must be in the future');
        setStatus.status = 'scheduled';
        setStatus.publishAt = scheduleDate;
        setStatus.publishedAt = null; // clear publishedAt when scheduling
      } else if (data.publish === true) {
        setStatus.status = 'published';
        setStatus.publishedAt = new Date();
        setStatus.publishAt = null;
      } else if (data.publish === false) {
        setStatus.status = 'draft';
        setStatus.publishedAt = null;
        setStatus.publishAt = null;
      }
    }

    // Validate and resolve author
    let resolvedAuthorId: number | undefined;
    if (data.authorId !== undefined && data.authorId !== post.authorId) {
      if (role !== 'SUPER_ADMIN') throw new ForbiddenException('Only Super Admin can change post author');
      const targetAuthor = await this.db.select().from(adminUsers).where(eq(adminUsers.id, data.authorId)).then((r) => r[0]);
      if (!targetAuthor) throw new BadRequestException('Selected author not found');
      resolvedAuthorId = data.authorId;
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
        ...(data.isFeatured !== undefined && { isFeatured: data.isFeatured }),
        ...(resolvedAuthorId !== undefined && { authorId: resolvedAuthorId }),
        ...setStatus,
        ...(data.metaTitle       !== undefined && { metaTitle: data.metaTitle }),
        ...(data.metaDescription !== undefined && { metaDescription: data.metaDescription }),
        ...(data.ogImage         !== undefined && { ogImage: data.ogImage }),
        updatedAt: new Date(),
      })
      .where(eq(blogPosts.id, id))
      .returning();

    if (data.tags) {
      await this.db.delete(blogPostTags).where(eq(blogPostTags.postId, id));
      if (data.tags.length) {
        await this.db.insert(blogPostTags).values(
          data.tags.map((tagId) => ({ postId: id, tagId })),
        );
      }
    }

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

  // ── Tags ─────────────────────────────────────────────────────────────────────

  async tags() {
    return this.db.select().from(blogTagsTable).orderBy(blogTagsTable.name);
  }

  async createTag(name: string) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const [row] = await this.db.insert(blogTagsTable).values({ name, slug }).returning();
    this.revalidation.revalidate([CacheTag.blog]);
    return row;
  }

  async deleteTag(id: number) {
    await this.db.delete(blogTagsTable).where(eq(blogTagsTable.id, id));
    this.revalidation.revalidate([CacheTag.blog]);
    return { success: true };
  }

  // ── Authors ──────────────────────────────────────────────────────────────────

  async listEligibleAuthors() {
    // Admin users with create_blog permission (via role_permissions join)
    return this.db
      .selectDistinct({
        id: adminUsers.id,
        firstName: adminUsers.firstName,
        lastName: adminUsers.lastName,
        email: adminUsers.email,
        avatar: adminUsers.avatar,
        role: adminUsers.role,
      })
      .from(adminUsers)
      .innerJoin(roles, eq(adminUsers.roleId, roles.id))
      .innerJoin(rolePermissions, eq(roles.id, rolePermissions.roleId))
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(permissions.slug, 'create_blog'))
      .orderBy(adminUsers.firstName);
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
