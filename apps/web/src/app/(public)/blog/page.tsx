import Link from "next/link";
import { ThumbsUp, MessageCircle, Clock, ArrowRight } from "lucide-react";
import { getCachedBlogList, type BlogPost } from "@/features/blog/api";
import TopCoursesSection from "@/features/landing/components/TopCoursesSection";
import { getPublicPageSections } from "@/features/cms/api/page-sections";
import { ContentContext } from "@/shared/components/ContentContext";

export const metadata = { title: "Blog" };

function formatDate(value: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function BlogCard({ post }: { post: BlogPost }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-gray-700 dark:bg-gray-800"
    >
      {/* Thumbnail */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100 dark:bg-gray-900">
        {post.thumbnail ? (
          <img
            src={post.thumbnail}
            alt={post.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-4xl">📝</div>
        )}
        {post.categoryName && (
          <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-brand-700 shadow-sm backdrop-blur-sm dark:bg-gray-900/80 dark:text-brand-400">
            {post.categoryName}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-5">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-500 dark:text-amber-400">
          <Clock className="h-3.5 w-3.5" />
          {formatDate(post.publishedAt)}
        </span>

        <h3 className="mt-2 line-clamp-2 min-h-[52px] text-lg font-bold leading-snug text-gray-900 transition-colors group-hover:text-brand-600 dark:text-white dark:group-hover:text-brand-400">
          {post.title}
        </h3>

        <div className="mt-auto flex items-center justify-between pt-5">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-900 px-4 py-2 text-xs font-bold text-white transition-colors group-hover:bg-brand-600 dark:bg-brand-600 dark:group-hover:bg-brand-500">
            Read More
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
          <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
            <span className="flex items-center gap-1">
              <ThumbsUp className="h-3.5 w-3.5" /> {post.likeCount ?? 0}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="h-3.5 w-3.5" /> {post.commentCount ?? 0}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default async function BlogPage() {
  const [posts, sections] = await Promise.all([
    getCachedBlogList().catch(() => []),
    getPublicPageSections("blog"),
  ]);

  const heroSection = sections.find((s) => s.type === "simple_hero");
  const heroTitle = (heroSection?.content?.title as string) || "Blogs";
  const heroSubtitle = (heroSection?.content?.subtitle as string) ||
    "A source of learning and inspiration for newcomers — our blogs.";

  return (
    <main className="min-h-screen bg-white transition-colors duration-300 animate-content-in dark:bg-gray-950">
      {/* This listing has no pagination or category filter, so page count == total count. */}
      <ContentContext type="blog_list" pageCount={posts.length} totalCount={posts.length} />
      {/* Hero banner */}
      <section className="relative overflow-hidden bg-gradient-to-b from-surface-hero to-white transition-colors duration-300 dark:bg-gradient-to-br dark:from-gray-950 dark:via-[#160f2e] dark:to-gray-900">
        <div className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-brand-tint/40 blur-3xl dark:bg-brand-600/25" />
        <div className="pointer-events-none absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-brand-tint/40 blur-3xl dark:bg-brand-600/25" />

        <div className="container relative mx-auto px-4 py-16 text-center">
          <h1 className="text-3xl md:text-[44px] font-bold text-accent">{heroTitle}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-ink-soft dark:text-gray-400 md:text-base">
            {heroSubtitle}
          </p>
          Testing 
        </div>
      </section>

      {/* Grid */}
      <div className="container mx-auto px-4 py-14">
        {posts.length === 0 ? (
          <div className="py-24 text-center text-gray-400 dark:text-gray-500">No articles found</div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {posts.map((post) => (
              <BlogCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>

      {/* Top courses */}
      <TopCoursesSection />
    </main>
  );
}
