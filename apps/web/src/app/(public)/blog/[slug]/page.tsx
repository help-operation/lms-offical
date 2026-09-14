import { Suspense } from "react";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Clock } from "lucide-react";
import { blogApi, getCachedBlogPost } from "@/features/blog/api";
import { authApi } from "@/features/auth/api";
import { BlogLikeButton } from "@/features/blog/BlogLikeButton";
import { BlogShare } from "@/features/blog/BlogShare";
import { BlogComments } from "@/features/blog/BlogComments";
import { BlogSidebar } from "@/features/blog/BlogSidebar";
import { RelatedPosts } from "@/features/blog/RelatedPosts";
import { BlogDetailsSkeleton } from "@/features/blog/BlogDetailsSkeleton";
import { ContentContext } from "@/shared/components/ContentContext";
import { ScrollDepthTracker } from "@/shared/components/ScrollDepthTracker";
import { sanitizeBlogContent } from "@/lib/sanitize";
import type { MeResponse } from "@repo/validators";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getCachedBlogPost(slug).catch(() => null);
  if (!post) return { title: "Post not found" };
  const title = post.metaTitle || post.title;
  const description = post.metaDescription || post.excerpt || undefined;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: post.ogImage ? [post.ogImage] : post.thumbnail ? [post.thumbnail] : undefined,
    },
    twitter: {
      title,
      description,
      images: post.ogImage ? [post.ogImage] : post.thumbnail ? [post.thumbnail] : undefined,
    },
  };
}

// ── Data-fetching component ───────────────────────────────────────────────────
async function BlogPost({
  params,
  user,
}: {
  params: Promise<{ slug: string }>;
  user: MeResponse | null;
}) {
  const { slug } = await params;

  const post = await getCachedBlogPost(slug).catch(() => null);
  if (!post) notFound();

  // Parallel: likes, my-like, comments, categories, all posts (for sidebar + related)
  const [likesRes, myLikeRes, commentsRes, categoriesRes, allPostsRes] = await Promise.all([
    blogApi.getLikes(post.id).catch(() => null),
    blogApi.getMyLike(post.id).catch(() => null),
    blogApi.getComments(post.id).catch(() => null),
    blogApi.categories().catch(() => null),
    blogApi.list().catch(() => null),
  ]);

  const likeCount    = likesRes?.data?.count ?? 0;
  const initialLiked = myLikeRes?.data?.liked ?? false;
  const comments     = commentsRes?.data ?? [];
  const isLoggedIn   = !!user;
  const categories   = categoriesRes?.data ?? [];
  const allPosts     = allPostsRes?.data ?? [];

  // Popular posts: sorted by likeCount desc, exclude current, limit 5
  const popularPosts = allPosts
    .filter((p) => p.id !== post.id)
    .sort((a, b) => (b.likeCount ?? 0) - (a.likeCount ?? 0))
    .slice(0, 5);

  // Related posts: same category, exclude current, limit 3
  const relatedPosts = post.categoryId
    ? allPosts
        .filter((p) => p.id !== post.id && p.categoryId === post.categoryId)
        .slice(0, 3)
    : allPosts.filter((p) => p.id !== post.id).slice(0, 3);

  return (
    <div className="animate-content-in">
      <ContentContext
        type="blog_post"
        category={post.categoryName}
        author={[post.authorFirstName, post.authorLastName].filter(Boolean).join(" ") || null}
      />
      <ScrollDepthTracker />

      {/* ── Hero banner (full-width) ── */}
      {post.thumbnail && (
        <div className="relative h-64 sm:h-96 w-full overflow-hidden bg-gradient-to-br from-brand-700 to-indigo-800">
          <Image src={post.thumbnail} alt={post.title} fill priority className="object-contain" />
        </div>
      )}

      {/* ── Two-column layout ── */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">

          {/* ── Left: Main content ── */}
          <article className="flex-1 min-w-0 max-w-3xl">
            {/* Header */}
            <header className="mb-6 space-y-3">
              {post.categoryName && (
                <span className="inline-block rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700 dark:bg-brand-500/15 dark:text-brand-400">
                  {post.categoryName}
                </span>
              )}
              <h1 className="text-3xl sm:text-4xl font-bold leading-tight text-gray-900 dark:text-white">
                {post.title}
              </h1>
            </header>

            {/* Meta */}
            <div className="mb-6 flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              {post.readingTime && (
                <span className="flex items-center gap-1.5 font-semibold text-amber-500 dark:text-amber-400">
                  <Clock className="h-4 w-4" />
                  {post.readingTime} min read
                </span>
              )}
              {post.publishedAt && (
                <span>
                  {new Date(post.publishedAt).toLocaleDateString("en-GB", {
                    day: "numeric", month: "long", year: "numeric",
                  })}
                </span>
              )}
              <span>By {post.authorFirstName} {post.authorLastName}</span>
            </div>

            {post.excerpt && (
              <p className="mb-6 text-base text-gray-500 italic border-l-4 border-brand-200 pl-4 dark:border-brand-500/40 dark:text-gray-400">
                {post.excerpt}
              </p>
            )}

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="mb-6 flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 dark:bg-brand-500/15 dark:text-brand-400"
                  >
                    #{tag.name}
                  </span>
                ))}
              </div>
            )}

            {/* Content */}
            <div
              className="prose prose-gray dark:prose-invert max-w-none text-gray-700 leading-relaxed dark:text-gray-300 [&_iframe]:h-auto [&_iframe]:w-full [&_iframe]:aspect-video [&_iframe]:rounded-xl [&_iframe]:border-0"
              dangerouslySetInnerHTML={{ __html: sanitizeBlogContent(post.content) }}
            />

            {/* ── Engagement bar ── */}
            <div className="flex flex-wrap items-center justify-between gap-4 py-6 mt-10 border-t border-b border-gray-100 dark:border-gray-800">
              <BlogLikeButton
                postId={post.id}
                initialCount={likeCount}
                initialLiked={initialLiked}
                isLoggedIn={isLoggedIn}
              />
              <BlogShare title={post.title} slug={post.slug} postId={post.id} />
            </div>

            {/* ── Related Posts ── */}
            <RelatedPosts posts={relatedPosts} />

            {/* ── Comments (full-width within article) ── */}
            <BlogComments
              postId={post.id}
              initialComments={comments}
              isLoggedIn={isLoggedIn}
              currentUserId={user?.id ?? null}
              currentUserFirstName={user?.firstName ?? null}
              currentUserAvatar={user?.avatar ?? null}
            />
          </article>

          {/* ── Right: Sidebar (hidden on mobile, visible lg+) ── */}
          <div className="hidden lg:block w-80 shrink-0">
            <div className="sticky top-24">
              <BlogSidebar
                post={post}
                categories={categories}
                popularPosts={popularPosts}
              />
            </div>
          </div>
        </div>

        {/* ── Mobile sidebar (visible below lg breakpoint) ── */}
        <div className="lg:hidden mt-10">
          <BlogSidebar
            post={post}
            categories={categories}
            popularPosts={popularPosts}
          />
        </div>
      </div>
    </div>
  );
}

// ── Page shell ────────────────────────────────────────────────────────────────
export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const userRes = await authApi.me().catch(() => null);
  const user = userRes?.data ?? null;

  return (
    <Suspense fallback={<BlogDetailsSkeleton />}>
      <BlogPost params={params} user={user} />
    </Suspense>
  );
}
