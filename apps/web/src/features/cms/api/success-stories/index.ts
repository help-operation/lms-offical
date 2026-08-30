import { publicApiRequest } from "@/lib/api-client";

export type PublicSuccessStory = {
  id: number;
  name: string;
  batch: string;
  category: string;
  image: string;
  videoUrl: string | null;
};

export async function getPublicSuccessStories(): Promise<PublicSuccessStory[]> {
  const res = await publicApiRequest<PublicSuccessStory[]>("/success-stories", {
    next: { revalidate: 3600, tags: ["success-stories"] },
  }).catch(() => null);
  return res?.data ?? [];
}
