import Image from "next/image";
import { Users, BookOpen, Star } from "lucide-react";

export function CourseInstructorCard({
  firstName,
  lastName,
  avatar,
  bio,
  expertise,
  totalStudents,
  totalCourses,
  rating,
}: {
  firstName: string;
  lastName: string;
  avatar: string | null;
  bio: string | null;
  expertise: string | null;
  totalStudents: number;
  totalCourses: number;
  rating: string | null;
}) {
  const initials = `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();
  const ratingNum = rating ? parseFloat(rating) : 0;

  return (
    <>
      <h2 className="mb-5 text-2xl font-bold text-gray-900 dark:text-white">Your Instructor</h2>
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-start gap-4">
          {avatar ? (
            <Image
              src={avatar}
              alt={`${firstName} ${lastName}`}
              width={72}
              height={72}
              className="rounded-2xl object-cover shrink-0"
            />
          ) : (
            <div className="h-[72px] w-[72px] rounded-2xl bg-gradient-to-br from-brand-from to-brand-to flex items-center justify-center text-white text-xl font-bold shrink-0">
              {initials}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {firstName} {lastName}
            </h3>
            {expertise && (
              <p className="text-sm text-brand-600 font-medium mt-0.5">{expertise}</p>
            )}

            <div className="flex flex-wrap gap-4 mt-3">
              {ratingNum > 0 && (
                <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  <span className="font-semibold">{ratingNum.toFixed(1)}</span>
                  <span className="text-gray-400">Instructor Rating</span>
                </div>
              )}
              <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                <Users className="h-4 w-4 text-brand-500" />
                <span className="font-semibold">{totalStudents.toLocaleString()}</span>
                <span className="text-gray-400">Students</span>
              </div>
              <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                <BookOpen className="h-4 w-4 text-brand-500" />
                <span className="font-semibold">{totalCourses}</span>
                <span className="text-gray-400">Courses</span>
              </div>
            </div>
          </div>
        </div>
        {bio && (
          <p className="mt-4 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-4 dark:text-gray-400 dark:border-gray-700">
            {bio}
          </p>
        )}
      </div>
    </>
  );
}
