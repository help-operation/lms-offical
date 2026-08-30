import { Suspense } from "react";
import { instructorCoursesApi, categoriesApi } from "@/features/courses/api";
import { NewCourseModal } from "@/features/courses/NewCourseModal";
import { CourseRowActions } from "@/features/courses/CourseRowActions";
import { InstructorProfileModal } from "@/features/instructor/InstructorProfileModal";

export const metadata = { title: "My Courses" };

export default async function CourseBuilderPage() {
  const [coursesRes, categoriesRes] = await Promise.all([
    instructorCoursesApi.list().catch(() => null),
    categoriesApi.list().catch(() => null),
  ]);

  const courses = coursesRes?.data ?? [];
  const categories = categoriesRes?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Courses</h1>
          <p className="text-gray-500 mt-1">
            {courses.length} course{courses.length !== 1 ? "s" : ""} total
          </p>
        </div>
        <div className="flex items-center gap-2">
          <InstructorProfileModal />
          <Suspense fallback={null}>
            <NewCourseModal categories={categories} />
          </Suspense>
        </div>
      </div>

      {courses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-dashed border-gray-300">
          <div className="text-4xl mb-3">📚</div>
          <h3 className="text-lg font-semibold text-gray-700 mb-1">No courses yet</h3>
          <p className="text-gray-400 text-sm mb-5">Create your first course and start teaching</p>
          <Suspense fallback={null}>
            <NewCourseModal categories={categories} autoOpen={false} />
          </Suspense>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left">
                <th className="px-6 py-3 font-medium text-gray-500">Course</th>
                <th className="px-6 py-3 font-medium text-gray-500 hidden sm:table-cell">Level</th>
                <th className="px-6 py-3 font-medium text-gray-500 hidden md:table-cell">Students</th>
                <th className="px-6 py-3 font-medium text-gray-500 hidden lg:table-cell">Price</th>
                <th className="px-6 py-3 font-medium text-gray-500">Status</th>
                <th className="px-6 py-3 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {courses.map((course) => {
                const price = parseFloat(course.price);
                const discount = course.discountPrice ? parseFloat(course.discountPrice) : null;
                return (
                  <tr key={course.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900 line-clamp-1">{course.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {course.totalLessons} lessons · {Math.round(course.totalDuration / 3600)}h
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden sm:table-cell">
                      <span className="capitalize text-gray-600">{course.level}</span>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell text-gray-600">
                      {course.totalStudents.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      {discount ? (
                        <span>
                          <span className="font-medium">৳{discount.toLocaleString()}</span>
                          <span className="text-gray-400 line-through ml-1 text-xs">
                            ৳{price.toLocaleString()}
                          </span>
                        </span>
                      ) : (
                        <span className="font-medium">
                          {price === 0 ? "Free" : `৳${price.toLocaleString()}`}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={course.status} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <CourseRowActions course={course} categories={categories} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    published: "bg-green-100 text-green-700",
    draft:     "bg-gray-100 text-gray-600",
    archived:  "bg-red-100 text-red-600",
  };
  return (
    <span
      className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${
        map[status] ?? "bg-gray-100 text-gray-600"
      }`}
    >
      {status}
    </span>
  );
}
