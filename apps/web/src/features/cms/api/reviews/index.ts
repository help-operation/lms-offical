import { publicApiRequest } from "@/lib/api-client";

export type FeaturedReview = {
  id: number;
  rating: number;
  comment: string | null;
  displayName: string | null;
  displayRole: string | null;
  displayAvatar: string | null;
};

export async function getFeaturedReviews(): Promise<FeaturedReview[]> {
  const res = await publicApiRequest<FeaturedReview[]>("/courses/reviews/featured", {
    next: { revalidate: 3600, tags: ["featured-reviews"] },
  }).catch(() => null);
  return res?.data ?? [];
}
