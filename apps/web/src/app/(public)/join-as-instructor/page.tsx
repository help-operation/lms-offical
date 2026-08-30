import { JoinAsInstructorClient } from "./JoinAsInstructorClient";
import { getPublicPageSections } from "@/features/cms/api/page-sections";

export const metadata = {
  title: "Become an Instructor",
  description: "Apply to become an instructor and share your knowledge with thousands of learners.",
};

export default async function JoinAsInstructorPage() {
  const sections = await getPublicPageSections("join-as-instructor");
  const hero = sections.find((s) => s.type === "simple_hero");
  const title = (hero?.content?.title as string) || "Become an Instructor";
  const subtitle = (hero?.content?.subtitle as string) ||
    "Share your expertise with thousands of learners. Fill out the form below and we'll be in touch.";

  return <JoinAsInstructorClient title={title} subtitle={subtitle} />;
}
