import { getPublicSuccessStories } from "@/features/cms/api/success-stories";
import SuccessStoriesClient from "./SuccessStoriesClient";

export type SuccessStoriesContent = {
  title_prefix?:    string;
  title_highlight?: string;
  subtitle?:        string;
  see_more_label?:  string;
  see_more_link?:   string;
};

type Props = { content?: SuccessStoriesContent };

const FALLBACK_STORIES = [
  { id: 1, name: "Sahed Mohammad", batch: "CCC 2505", category: "capcut",     image: "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=600&h=360&fit=crop", videoUrl: null },
  { id: 2, name: "Sanjida Islam",  batch: "CCC 2504", category: "video",      image: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=600&h=360&fit=crop", videoUrl: null },
  { id: 3, name: "Asraful Hoque",  batch: "CCC 2503", category: "capcut",     image: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=600&h=360&fit=crop", videoUrl: null },
  { id: 4, name: "Rumana Akter",   batch: "EXL 2502", category: "excel",      image: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=600&h=360&fit=crop", videoUrl: null },
  { id: 5, name: "Tanvir Ahmed",   batch: "CC 2501",  category: "callcenter", image: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=600&h=360&fit=crop", videoUrl: null },
  { id: 6, name: "Farhana Yasmin", batch: "CCC 2502", category: "video",      image: "https://images.unsplash.com/photo-1494790108755-2616b332906c?w=600&h=360&fit=crop", videoUrl: null },
];

const SuccessStoriesSection = async ({ content = {} }: Props) => {
  const title_prefix    = content.title_prefix    ?? "Success";
  const title_highlight = content.title_highlight ?? "Stories";
  const subtitle        = content.subtitle        ?? "Take a look at the success stories of our students.";
  const see_more_label  = content.see_more_label  ?? "See more";
  const see_more_link   = content.see_more_link   ?? "/courses";

  const liveStories = await getPublicSuccessStories();
  const stories = liveStories.length > 0 ? liveStories : FALLBACK_STORIES;

  // Build filter tabs from unique categories in the actual stories
  const uniqueCategories = Array.from(new Set(stories.map((s) => s.category)));
  const filters = [
    { key: "all", label: "All" },
    ...uniqueCategories.map((cat) => ({
      key: cat,
      label: cat.charAt(0).toUpperCase() + cat.slice(1).replace(/-/g, " "),
    })),
  ];

  return (
    <SuccessStoriesClient
      titlePrefix={title_prefix}
      titleHighlight={title_highlight}
      subtitle={subtitle}
      seeMoreLabel={see_more_label}
      seeMoreLink={see_more_link}
      filters={filters}
      stories={stories}
    />
  );
};

export default SuccessStoriesSection;
