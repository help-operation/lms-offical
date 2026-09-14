import Link from "next/link";
import Image from "next/image";
import { TrendingUp, Folder } from "lucide-react";
import { blogApi, type BlogPost, type BlogCategory } from "@/features/blog/api";
import { NewsletterBox } from "./NewsletterBox";

// ── Author Bio ───────────────────────────────────────────────────────────────
function AuthorBio({ firstName, lastName }: { firstName: string; lastName: string }) {
  const initial = `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase();
  const fullName = [firstName, lastName].filter(Boolean).join(" ") || "Author";

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-4">
        About the Author
      </h3>
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-brand-500 to-pink-400 flex items-center justify-center text-white text-sm font-bold shrink-0">
          {initial}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{fullName}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Content Creator</p>
        </div>
      </div>
    </div>
  );
}

// ── Popular Posts ─────────────────────────────────────────────────────────────
function PopularPosts({ posts }: { posts: BlogPost[] }) {
  if (posts.length === 0) return null;

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
      <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-4">
        <TrendingUp className="h-3.5 w-3.5" />
        Popular Posts
      </h3>
      <div className="space-y-4">
        {posts.map((post) => (
          <Link
            key={post.id}
            href={`/blog/${post.slug}`}
            className="group flex gap-3"
          >
            {post.thumbnail && (
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
                <Image
                  src={post.thumbnail}
                  alt={post.title}
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                  sizes="64px"
                />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-900 line-clamp-2 group-hover:text-brand-600 transition-colors dark:text-white dark:group-hover:text-brand-400">
                {post.title}
              </p>
              <div className="mt-1 flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
                {post.readingTime && <span>{post.readingTime} min</span>}
                {post.likeCount !== undefined && <span>{post.likeCount} likes</span>}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ── Categories ───────────────────────────────────────────────────────────────
function CategoryList({ categories }: { categories: BlogCategory[] }) {
  if (categories.length === 0) return null;

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
      <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-4">
        <Folder className="h-3.5 w-3.5" />
        Categories
      </h3>
      <div className="space-y-1.5">
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/blog?category=${cat.slug}`}
            className="group flex items-center justify-between rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-brand-50 hover:text-brand-600 transition-colors dark:text-gray-300 dark:hover:bg-brand-500/10 dark:hover:text-brand-400"
          >
            <span>{cat.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ── Main Sidebar ─────────────────────────────────────────────────────────────
interface SidebarProps {
  post: { authorFirstName: string; authorLastName: string };
  categories: BlogCategory[];
  popularPosts: BlogPost[];
}

export async function BlogSidebar({ post, categories, popularPosts }: SidebarProps) {
  return (
    <aside className="space-y-5">
      <AuthorBio firstName={post.authorFirstName} lastName={post.authorLastName} />
      <PopularPosts posts={popularPosts} />
      <CategoryList categories={categories} />
      <NewsletterBox />
    </aside>
  );
}
