import Link from "next/link";
import Image from "next/image";
import { Clock, Heart, MessageSquare } from "lucide-react";
import type { BlogPost } from "@/features/blog/api";

interface Props {
  posts: BlogPost[];
}

export function RelatedPosts({ posts }: Props) {
  if (posts.length === 0) return null;

  return (
    <section className="mt-12 pt-8 border-t border-gray-100 dark:border-gray-800">
      <h2 className="text-xl font-bold text-gray-900 mb-6 dark:text-white">
        Related Posts
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {posts.map((post) => (
          <Link
            key={post.id}
            href={`/blog/${post.slug}`}
            className="group overflow-hidden rounded-2xl border border-gray-100 bg-white transition-all hover:shadow-md hover:border-brand-100 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-brand-500/20"
          >
            {post.thumbnail && (
              <div className="relative h-44 w-full overflow-hidden bg-gray-100 dark:bg-gray-800">
                <Image
                  src={post.thumbnail}
                  alt={post.title}
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
                {post.isFeatured && (
                  <span className="absolute top-3 left-3 rounded-full bg-brand-600 px-2.5 py-0.5 text-[10px] font-bold uppercase text-white shadow-sm">
                    Featured
                  </span>
                )}
              </div>
            )}
            <div className="p-4">
              {post.categoryName && (
                <span className="inline-block rounded-full bg-brand-50 px-2.5 py-0.5 text-[10px] font-bold text-brand-700 dark:bg-brand-500/15 dark:text-brand-400 mb-2">
                  {post.categoryName}
                </span>
              )}
              <h3 className="text-sm font-bold text-gray-900 line-clamp-2 group-hover:text-brand-600 transition-colors dark:text-white dark:group-hover:text-brand-400">
                {post.title}
              </h3>
              <div className="mt-3 flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
                {post.readingTime && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {post.readingTime} min
                  </span>
                )}
                {post.likeCount !== undefined && (
                  <span className="flex items-center gap-1">
                    <Heart className="h-3 w-3" />
                    {post.likeCount}
                  </span>
                )}
                {post.commentCount !== undefined && (
                  <span className="flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" />
                    {post.commentCount}
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
