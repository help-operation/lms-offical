export type ApplicationStatus = 'pending' | 'approved' | 'rejected';

export interface InstructorApplication {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  expertise: string;
  experience: string;
  motivation: string;
  portfolioUrl: string | null;
  status: ApplicationStatus;
  adminNotes: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}
