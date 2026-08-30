import { Suspense } from "react";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Clock } from "lucide-react";
import { blogApi, getCachedBlogPost } from "@/features/blog/api";
import { authApi } from "@/features/auth/api";
import { BlogLikeButton } from "@/features/blog/BlogLikeButton";
import { BlogShare } from "@/features/blog/BlogShare";
import { BlogComments } from "@/features/blog/BlogComments";
import { BlogDetailsSkeleton } from "@/features/blog/BlogDetailsSkeleton";
import { ContentContext } from "@/shared/components/ContentContext";
import { ScrollDepthTracker } from "@/shared/components/ScrollDepthTracker";
import type { MeResponse } from "@repo/validators";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getCachedBlogPost(slug).catch(() => null);
  if (!post) return { title: "Post not found" };
  return {
    title: post.title,
    description: post.excerpt ?? undefined,
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

  // Parallel: likes count, my-like status (fails for guests → null), comments
  const [likesRes, myLikeRes, commentsRes] = await Promise.all([
    blogApi.getLikes(post.id).catch(() => null),
    blogApi.getMyLike(post.id).catch(() => null),
    blogApi.getComments(post.id).catch(() => null),
  ]);

  const likeCount     = likesRes?.data?.count ?? 0;
  const initialLiked  = myLikeRes?.data?.liked ?? false;
  const comments      = commentsRes?.data ?? [];
  const isLoggedIn    = !!user;

  return (
    <div className="animate-content-in">
      <ContentContext
        type="blog_post"
        category={post.categoryName}
        author={[post.authorFirstName, post.authorLastName].filter(Boolean).join(" ") || null}
      />
      <ScrollDepthTracker />
      {/* Hero banner — shown uncropped since these thumbnails are often
          marketing posters with their own baked-in text; cropping (object-cover)
          or overlaying our own title on top of them reads as broken/duplicated. */}
      {post.thumbnail && (
        <div className="relative h-64 sm:h-96 w-full overflow-hidden bg-gradient-to-br from-brand-700 to-indigo-800">
          <Image src={post.thumbnail} alt={post.title} fill priority className="object-contain" />
        </div>
      )}

      <article className="max-w-3xl mx-auto px-4 py-10">
        {/* Header */}
        <header className="mb-8 space-y-3">
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
        <div className="mb-8 flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
          {post.publishedAt && (
            <span className="flex items-center gap-1.5 font-semibold text-amber-500 dark:text-amber-400">
              <Clock className="h-4 w-4" />
              {new Date(post.publishedAt).toLocaleDateString("en-GB", {
                day: "numeric", month: "long", year: "numeric",
              })}
            </span>
          )}
          <span>By {post.authorFirstName} {post.authorLastName}</span>
        </div>

        {post.excerpt && (
          <p className="mb-8 text-base text-gray-500 italic border-l-4 border-brand-200 pl-4 dark:border-brand-500/40 dark:text-gray-400">
            {post.excerpt}
          </p>
        )}

        {/* Content */}
        <div
          className="prose prose-gray dark:prose-invert max-w-none text-gray-700 leading-relaxed mb-10 dark:text-gray-300"
          dangerouslySetInnerHTML={{ __html: post.content ?? "" }}
        />

        {/* ── Engagement bar ── */}
        <div className="flex flex-wrap items-center justify-between gap-4 py-6 border-t border-b border-gray-100 dark:border-gray-800">
          <BlogLikeButton
            postId={post.id}
            initialCount={likeCount}
            initialLiked={initialLiked}
            isLoggedIn={isLoggedIn}
          />
          <BlogShare title={post.title} slug={post.slug} postId={post.id} />
        </div>

        {/* ── Comments ── */}
        <BlogComments
          postId={post.id}
          initialComments={comments}
          isLoggedIn={isLoggedIn}
          currentUserId={user?.id ?? null}
          currentUserFirstName={user?.firstName ?? null}
          currentUserAvatar={user?.avatar ?? null}
        />
      </article>
    </div>
  );
}

// ── Page shell ────────────────────────────────────────────────────────────────
// Auth is fetched HERE (outside Suspense) so cookies() is always called
// in the request context, never inside a deferred streaming boundary.
export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const userRes = await authApi.me().catch(() => null);
  const user = userRes?.data ?? null;

  return (
    <Suspense fallback={<BlogDetailsSkeleton />}>
      <BlogPost params={params} user={user} />
    </Suspense>
  );
}
