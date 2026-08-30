import { StudentStoriesV2, type StudentStoriesContent } from "@repo/ui/home-v1-student-stories";
import { getFeaturedReviews } from "@/features/cms/api/reviews";

export type { StudentStoriesContent };

type Props = { content?: StudentStoriesContent };

export default async function StudentStoriesSection({ content = {} }: Props) {
  const reviews = await getFeaturedReviews();

  return <StudentStoriesV2 content={content} reviews={reviews} />;
}
