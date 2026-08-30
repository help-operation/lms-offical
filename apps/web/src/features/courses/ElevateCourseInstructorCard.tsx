import Image from "next/image";
import { Users, BookOpen, Star } from "lucide-react";

export function ElevateCourseInstructorCard({
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
      <div className="overflow-hidden rounded-3xl border border-brand-100 bg-white shadow-sm transition-colors duration-300 dark:border-gray-800 dark:bg-gray-900">
        <div className="h-1.5 w-full bg-gradient-to-r from-brand-400 via-brand-600 to-brand-400" />
        <div className="bg-gradient-to-br from-brand-50/60 to-white p-6 dark:from-gray-900 dark:to-gray-900">
          <div className="flex items-start gap-4">
            {avatar ? (
              <Image
                src={avatar}
                alt={`${firstName} ${lastName}`}
                width={76}
                height={76}
                className="rounded-2xl object-cover shrink-0 shadow-md"
              />
            ) : (
              <div className="flex h-[76px] w-[76px] shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-xl font-bold text-white shadow-md">
                {initials}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {firstName} {lastName}
              </h3>
              {expertise && (
                <p className="mt-0.5 text-sm font-medium text-brand-600 dark:text-brand-400">{expertise}</p>
              )}

              <div className="mt-3 flex flex-wrap gap-2">
                {ratingNum > 0 && (
                  <div className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-sm text-gray-600 shadow-sm dark:bg-gray-800 dark:text-gray-300">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    <span className="font-semibold text-gray-900 dark:text-white">{ratingNum.toFixed(1)}</span>
                    <span className="text-gray-400 dark:text-gray-500">rating</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-sm text-gray-600 shadow-sm dark:bg-gray-800 dark:text-gray-300">
                  <Users className="h-3.5 w-3.5 text-brand-500 dark:text-brand-400" />
                  <span className="font-semibold text-gray-900 dark:text-white">{totalStudents.toLocaleString()}</span>
                  <span className="text-gray-400 dark:text-gray-500">students</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-sm text-gray-600 shadow-sm dark:bg-gray-800 dark:text-gray-300">
                  <BookOpen className="h-3.5 w-3.5 text-brand-500 dark:text-brand-400" />
                  <span className="font-semibold text-gray-900 dark:text-white">{totalCourses}</span>
                  <span className="text-gray-400 dark:text-gray-500">courses</span>
                </div>
              </div>
            </div>
          </div>
          {bio && (
            <p className="mt-4 border-t border-brand-100 pt-4 text-sm leading-relaxed text-gray-600 dark:border-gray-800 dark:text-gray-400">
              {bio}
            </p>
          )}
        </div>
      </div>
    </>
  );
}
