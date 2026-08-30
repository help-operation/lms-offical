export interface Teacher {
  id: number;
  firstName: string;
  lastName: string;
  email: string | null;
  status: string;
  avatar: string | null;
  createdAt: string | null;
  bio: string | null;
  expertise: string | null;
  displayName: string | null;
  displayAvatar: string | null;
  totalStudents: number;
  totalCourses: number;
  rating: string | null;
}

export interface TeacherCourse {
  id: number;
  title: string;
  slug: string;
  status: string;
  thumbnail: string | null;
  price: string;
  totalStudents: number;
  rating: string | null;
  createdAt: string | null;
}

export interface TeacherDetail extends Teacher {
  socialLinks: Record<string, string> | null;
  payoutInfo: Record<string, string> | null;
  courses: TeacherCourse[];
}
