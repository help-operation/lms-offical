
export type ArticlesContent = {
  eyebrow?: string;
  title?: string;
  limit?: number;
};

export type ArticleGridItem = {
  id: string | number;
  slug: string;
  title: string;
  thumbnail?: string | null;
  categoryName?: string | null;
  publishedAt?: string | null;
};

type Props = {
  content?: ArticlesContent;
  posts: ArticleGridItem[];
};

const DEFAULTS: Required<ArticlesContent> = {
  eyebrow: "Our Blog",
  title: "Our New Articles",
  limit: 4,
};

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function ArticlesV2({ content = {}, posts }: Props) {
  const d = { ...DEFAULTS, ...content } as Required<ArticlesContent>;

  if (posts.length === 0) return null;
  const shown = posts.slice(0, d.limit);

  return (
    <section className="bg-white py-16 transition-colors duration-300 dark:bg-gray-900 lg:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-400">{d.eyebrow}</p>
          <h2 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{d.title}</h2>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {shown.map((post) => (
            <a
              key={post.id}
              href={`/blog/${post.slug}`}
              className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg dark:border-gray-700 dark:bg-gray-800"
            >
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-gray-100 dark:bg-gray-700">
                {post.thumbnail ? (
                  <img
                    src={post.thumbnail}
                    alt={post.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-3xl">📝</div>
                )}
                {post.categoryName && (
                  <span className="absolute left-3 top-3 rounded-full bg-brand-500 px-2.5 py-1 text-[10px] font-bold text-white">
                    {post.categoryName}
                  </span>
                )}
              </div>
              <div className="p-4">
                <h3 className="line-clamp-2 text-sm font-bold text-gray-900 group-hover:text-brand-700 dark:text-white dark:group-hover:text-brand-400">{post.title}</h3>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{formatDate(post.publishedAt)}</p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

export default ArticlesV2;
