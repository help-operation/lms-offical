import { ArticlesV2, type ArticlesContent } from "@repo/ui/home-v1-articles";
import { getCachedBlogList } from "@/features/blog/api";

export type { ArticlesContent };

type Props = { content?: ArticlesContent };

export default async function ArticlesSection({ content = {} }: Props) {
  const posts = await getCachedBlogList().catch(() => []);

  return <ArticlesV2 content={content} posts={posts} />;
}
