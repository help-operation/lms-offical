import { apiRequest, publicApiRequest } from "@/lib/api-client";

export interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  thumbnail: string | null;
  publishedAt: string | null;
  authorFirstName: string;
  authorLastName: string;
  categoryId: number | null;
  categoryName: string | null;
  categorySlug: string | null;
  likeCount?: number;
  commentCount?: number;
}

export interface BlogPostDetail extends BlogPost {
  content: string | null;
  excerpt: string | null;
  createdAt: string | null;
  authorId: number;
}

export interface BlogCategory {
  id: number;
  name: string;
  slug: string;
}

export interface BlogLikeStatus {
  count: number;
}

export interface BlogMyLike {
  liked: boolean;
}

export interface BlogLikeToggle {
  count: number;
  liked: boolean;
}

export interface BlogComment {
  id: number;
  postId: number;
  parentId: number | null;
  content: string;
  createdAt: string;
  updatedAt: string;
  userId: number;
  authorFirstName: string;
  authorLastName: string;
  authorAvatar: string | null;
}

export const blogApi = {
  list: (search?: string, categoryId?: string) => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (categoryId) params.set("categoryId", categoryId);
    const q = params.toString() ? `?${params.toString()}` : "";
    return apiRequest<BlogPost[]>(`/blog${q}`);
  },
  detail: (slug: string) => apiRequest<BlogPostDetail>(`/blog/${slug}`),
  categories: () => apiRequest<BlogCategory[]>("/blog/categories"),

  // Likes
  getLikes: (postId: number) =>
    apiRequest<BlogLikeStatus>(`/blog/${postId}/likes`),
  getMyLike: (postId: number) =>
    apiRequest<BlogMyLike>(`/blog/${postId}/my-like`),

  // Comments
  getComments: (postId: number) =>
    apiRequest<BlogComment[]>(`/blog/${postId}/comments`),
};

/**
 * Cached public fetch for the blog index. Posts change occasionally → cache for
 * hours; tagged so publishing can invalidate it via `updateTag('blog')`.
 */
export async function getCachedBlogList(): Promise<BlogPost[]> {
  const res = await publicApiRequest<BlogPost[]>(`/blog`, {
    next: { revalidate: 3600, tags: ["blog"] },
  }).catch(() => null);
  return res?.data ?? [];
}

/**
 * Cached public fetch for a single blog post. Tagged per-slug so an edit can
 * invalidate just that post via `updateTag('blog:<slug>')`. Throws (rather than
 * swallowing to null) on a missing post or unreachable API — callers must
 * catch — so a transient failure never gets memoized as a permanent 404.
 */
export async function getCachedBlogPost(
  slug: string,
): Promise<BlogPostDetail> {
  const res = await publicApiRequest<BlogPostDetail>(`/blog/${slug}`, {
    next: { revalidate: 3600, tags: ["blog", `blog:${slug}`] },
  });
  return res.data;
}
