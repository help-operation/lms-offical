export type SuccessStory = {
  id: number;
  name: string;
  batch: string;
  category: string;
  image: string;
  videoUrl: string | null;
  isActive: boolean;
  order: number;
  createdAt: string | null;
  updatedAt: string | null;
};

export type CreateStoryPayload = {
  name: string;
  batch: string;
  category: string;
  image?: string;
  videoUrl?: string | null;
};

export type UpdateStoryPayload = Partial<CreateStoryPayload>;
