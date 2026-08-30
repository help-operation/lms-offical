export interface LandingCourse {
  id: number;
  title: string;
  slug: string;
  image: string;
  type: "live" | "recorded";
  lessons: number;
  hours: number;
  rating: number;
  reviews: number;
  students: number;
  price: number;
  oldPrice: number;
  /** "seats" → limited seats; "register" → register now */
  status: "seats" | "register";
  showBadge: boolean;
};

export interface LandingBatch {
  id: number;
  title: string;
  image: string;
  batch: string;
  lessons: number;
  hours: number;
  students: number;
  reviews: number;
  price: number;
  oldPrice: number;
}

export interface LandingReview {
  id: number;
  name: string;
  batch: string;
  rating: number;
  text: string;
}

/** Icon is resolved on the client from this key (components can't cross the RSC boundary). */
export type CategoryIconKey = "ai" | "marketing" | "graphic" | "content" | "soft";

export interface LandingCategory {
  key: string;
  name: string;
  iconKey: CategoryIconKey;
  courses: LandingCourse[];
}
