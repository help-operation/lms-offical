import { getFeaturedReviews } from "@/features/cms/api/reviews";
import TestimonialCarousel from "./TestimonialCarousel";

export type TestimonialsContent = {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  items?: {
    name: string;
    role: string;
    image: string;
    rating: number;
    text: string;
    amount: string;
  }[];
};

type Props = { content?: TestimonialsContent };

const FALLBACK_ITEMS: TestimonialsContent["items"] = [
  {
    name: "Shamim Parvez Himel", role: "Tech Content Creator, AFR Technology",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&h=160&fit=crop&crop=face",
    rating: 5, amount: "",
    text: "When it comes to building technology-driven skills, this is a brilliant initiative. A platform like this is a beacon of hope for the young people of our country.",
  },
  {
    name: "Jessica Martinez", role: "Frontend Developer, Google",
    image: "https://images.unsplash.com/photo-1494790108755-2616b332906c?w=160&h=160&fit=crop&crop=face",
    rating: 5, amount: "",
    text: "The courses transformed my career. World-class content that is always up-to-date and genuinely practical for real jobs.",
  },
  {
    name: "David Kim", role: "UX Designer, Apple",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&h=160&fit=crop&crop=face",
    rating: 5, amount: "",
    text: "The masterclass was incredibly thorough. Within 3 months I built a portfolio strong enough to get hired. Best investment I have ever made.",
  },
];

const TestimonialSection = async ({ content = {} }: Props) => {
  const title    = content.title    ?? "What Our Students Say";
  const subtitle = content.subtitle ?? "Join thousands of successful learners who have transformed their careers with Skillkoro.";

  // Fetch live curated reviews; fall back to CMS content items, then hardcoded defaults
  const liveReviews = await getFeaturedReviews();

  const items =
    liveReviews.length > 0
      ? liveReviews.map((r) => ({
          name:   r.displayName  ?? "Anonymous",
          role:   r.displayRole  ?? "",
          image:  r.displayAvatar ?? "",
          rating: r.rating,
          text:   r.comment      ?? "",
          amount: "",
        }))
      : Array.isArray(content.items) && content.items.length > 0
        ? content.items
        : FALLBACK_ITEMS!;

  return <TestimonialCarousel title={title} subtitle={subtitle} items={items} />;
};

export default TestimonialSection;
