import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/avatar";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/card";
import { Progress } from "@repo/ui/progress";
import {
  BookOpen,
  CheckCircle2,
  Filter,
  PlayCircle,
  Target,
  Trophy,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { authApi } from "@/features/auth/api";
import { certificatesApi } from "@/features/courses/api/certificates";
import { enrollmentsApi } from "@/features/courses/api/enrollments";
import { DuePaymentBanner } from "@/features/courses/DuePaymentBanner";

function progressOf(e: { totalLessons: number; completedLessons: number }) {
  return e.totalLessons > 0
    ? Math.round((e.completedLessons / e.totalLessons) * 100)
    : 0;
}

export default async function StudentDashboardPage() {
  const user = await authApi.me().catch(() => null);

  if (!user) {
    redirect("/");
  }

  if (user.data.role !== "STUDENT") {
    redirect("/guest/dashboard");
  }

  const [enrollmentsRes, certificatesRes] = await Promise.all([
    enrollmentsApi.myEnrollments().catch(() => null),
    certificatesApi.mine().catch(() => null),
  ]);

  const enrollments = enrollmentsRes?.data ?? [];
  const certificates = certificatesRes?.data ?? [];

  const withProgress = enrollments.map((e) => ({ ...e, progress: progressOf(e) }));

  const totalCourses = withProgress.length;
  const completedCourses = withProgress.filter((e) => e.progress >= 100).length;
  const completedLessons = withProgress.reduce((sum, e) => sum + e.completedLessons, 0);
  const avgProgress =
    totalCourses > 0
      ? Math.round(withProgress.reduce((sum, e) => sum + e.progress, 0) / totalCourses)
      : 0;

  const notStarted = withProgress.filter((e) => e.progress === 0).length;
  const inProgress = withProgress.filter((e) => e.progress > 0 && e.progress < 100).length;

  // Continue learning: in-progress courses first (closest to completion on top).
  const continueLearning = [...withProgress]
    .filter((e) => e.progress < 100)
    .sort((a, b) => b.progress - a.progress)
    .slice(0, 3);

  // Top courses by completion.
  const topCourses = [...withProgress]
    .sort((a, b) => b.progress - a.progress)
    .slice(0, 3);

  const initials =
    `${user.data.firstName.slice(0, 1)}${user.data.lastName.slice(0, 1)}`.toUpperCase();

  return (
    <div className="space-y-5">
      <DuePaymentBanner enrollments={enrollments} />
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_420px]">
        <div className="min-w-0 space-y-5">
          <Card className="border-0 bg-white shadow-sm dark:bg-slate-900">
            <CardHeader className="flex-row items-center justify-between gap-4 space-y-0">
              <div>
                <CardTitle className="text-lg">Student Details</CardTitle>
                <CardDescription>Learning account overview</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
                <Avatar className="h-20 w-20">
                  <AvatarImage src="https://github.com/shadcn.png" />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="grid min-w-0 flex-1 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="min-w-0">
                    <p className="text-xs text-slate-400 dark:text-slate-500">Name</p>
                    <p className="truncate text-sm font-semibold text-slate-950 dark:text-slate-100">
                      {user.data.firstName} {user.data.lastName}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-400 dark:text-slate-500">ID</p>
                    <p className="text-sm font-semibold text-slate-950 dark:text-slate-100">
                      SK-{String(user.data.id).padStart(5, "0")}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-400 dark:text-slate-500">Email</p>
                    <p className="truncate text-sm font-semibold text-slate-950 dark:text-slate-100">
                      {user.data.email}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-400 dark:text-slate-500">Role</p>
                    <Badge variant="outline">{user.data.role}</Badge>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <MetricTile
                  icon={<BookOpen className="h-4 w-4" />}
                  label="Enrolled Courses"
                  value={String(totalCourses)}
                  tone="sky"
                />
                <MetricTile
                  icon={<CheckCircle2 className="h-4 w-4" />}
                  label="Lessons Completed"
                  value={String(completedLessons)}
                  tone="lime"
                />
                <MetricTile
                  icon={<Target className="h-4 w-4" />}
                  label="Avg. Progress"
                  value={`${avgProgress}%`}
                  tone="amber"
                />
                <MetricTile
                  icon={<Trophy className="h-4 w-4" />}
                  label="Certificates"
                  value={String(certificates.length)}
                  tone="rose"
                />
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_1.35fr]">
            <Card className="border-0 bg-white shadow-sm dark:bg-slate-900">
              <CardHeader>
                <CardTitle className="text-lg">Overall Progress</CardTitle>
                <CardDescription>Across all enrolled courses.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                      Average Completion
                    </p>
                    <p className="text-5xl font-light text-slate-950 dark:text-slate-100">
                      {avgProgress}%
                    </p>
                  </div>
                  <Badge className="bg-brand-50 text-brand hover:bg-brand-50">
                    {completedCourses} done
                  </Badge>
                </div>
                <Progress value={avgProgress} className="h-2" />
                <div className="grid grid-cols-3 gap-3 pt-3">
                  <RatePill month="Not started" value={String(notStarted)} tone="bg-brand-600" />
                  <RatePill month="In progress" value={String(inProgress)} tone="bg-brand-400" />
                  <RatePill month="Completed" value={String(completedCourses)} tone="bg-brand-500" />
                </div>
                <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
                  Your average completion is calculated from lesson progress across
                  every course you are enrolled in.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 bg-white shadow-sm dark:bg-slate-900">
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="text-lg">Continue Learning</CardTitle>
                  <CardDescription>Pick up from recent lessons.</CardDescription>
                </div>
                <Button variant="outline" size="sm" className="rounded-full" asChild>
                  <Link href="/student/courses">
                    <Filter className="mr-2 h-4 w-4" />
                    All
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {continueLearning.length === 0 ? (
                  <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-6 text-center">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {totalCourses === 0
                        ? "You haven't enrolled in any courses yet."
                        : "All caught up — every course is complete! 🎉"}
                    </p>
                    <Button
                      asChild
                      size="sm"
                      className="mt-4 rounded-full bg-brand-solid text-white hover:bg-brand-hover"
                    >
                      <Link href="/courses">Browse courses</Link>
                    </Button>
                  </div>
                ) : (
                  continueLearning.map((item) => {
                    const isLive = item.courseType === "live";
                    return (
                      <div key={`${item.courseType}-${item.id}`} className="rounded-lg bg-slate-50 dark:bg-slate-800 p-4">
                        <div className="mb-3 flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                              {item.courseTitle}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {isLive
                                ? "Live course"
                                : `${item.completedLessons}/${item.totalLessons} lessons completed`}
                            </p>
                          </div>
                          <Button size="sm" variant="outline" className="rounded-full" asChild>
                            <Link href={isLive ? `/${item.courseSlug}` : `/learn/${item.courseSlug}`}>
                              <PlayCircle className="mr-2 h-4 w-4" />
                              {isLive ? "Open" : "Resume"}
                            </Link>
                          </Button>
                        </div>
                        {!isLive && <Progress value={item.progress} className="h-2" />}
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <aside className="space-y-5">
          <Card className="border-0 bg-white shadow-sm dark:bg-slate-900">
            <CardHeader>
              <CardTitle className="text-lg">Summary - {user.data.firstName}</CardTitle>
              <CardDescription>Student learning snapshot</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <SummaryBlock value={String(totalCourses)} label="Courses" tone="bg-brand-600" />
                <SummaryBlock value={`${avgProgress}`} label="Progress" tone="bg-brand-500" />
                <SummaryBlock value={String(completedLessons)} label="Lessons" tone="bg-brand-400" />
                <SummaryBlock value={String(certificates.length)} label="Awards" tone="bg-brand-700" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white shadow-sm dark:bg-slate-900">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-lg">Top Courses</CardTitle>
                <CardDescription>Highest completion.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {topCourses.length === 0 ? (
                <p className="py-4 text-center text-sm text-slate-400 dark:text-slate-500">
                  No courses yet.
                </p>
              ) : (
                topCourses.map((course, index) => (
                  <div
                    key={course.id}
                    className="grid grid-cols-[36px_1fr_64px] items-center gap-3"
                  >
                    <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {course.courseTitle}
                      </p>
                      <Progress value={course.progress} className="mt-2 h-1.5" />
                    </div>
                    <span className="text-right text-sm font-medium text-slate-600 dark:text-slate-300">
                      {course.progress}%
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="border-0 bg-white shadow-sm dark:bg-slate-900">
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-lg">Certificates</CardTitle>
                {certificates.length > 0 && (
                  <Link
                    href="/student/certificates"
                    className="text-xs font-medium text-brand hover:underline"
                  >
                    View all
                  </Link>
                )}
              </div>
              <CardDescription>Earned credentials.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {certificates.length === 0 ? (
                <div className="flex items-center gap-3 rounded-lg bg-slate-50 dark:bg-slate-800 p-4">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand">
                    <Trophy className="h-4 w-4" />
                  </span>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Complete a course to earn your first certificate.
                  </p>
                </div>
              ) : (
                certificates.slice(0, 3).map((cert) => (
                  <Link
                    key={cert.id}
                    href={`/certificate/${cert.certificateCode}`}
                    className="flex items-center gap-3 rounded-lg bg-slate-50 dark:bg-slate-800 p-4 transition-colors hover:bg-slate-100 dark:hover:bg-slate-700"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand">
                      <Trophy className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {cert.courseTitle}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {cert.issuedAt
                          ? new Date(cert.issuedAt).toLocaleDateString()
                          : "Issued"}
                      </p>
                    </div>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function MetricTile({
  icon,
  label,
  value,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  tone: "sky" | "lime" | "amber" | "rose";
}) {
  const tones = {
    sky: "bg-brand-50 text-brand-600",
    lime: "bg-brand-50 text-brand-500",
    amber: "bg-brand-100 text-brand-700",
    rose: "bg-brand-100 text-brand-800",
  };

  return (
    <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-4">
      <div className="flex items-center gap-3">
        <span className={`flex h-10 w-10 items-center justify-center rounded-full ${tones[tone]}`}>
          {icon}
        </span>
        <div>
          <p className="text-lg font-semibold text-slate-950 dark:text-slate-100">{value}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
        </div>
      </div>
    </div>
  );
}

function RatePill({
  month,
  value,
  tone,
}: {
  month: string;
  value: string;
  tone: string;
}) {
  return (
    <div className={`rounded-lg p-3 text-white ${tone}`}>
      <p className="text-xs">{month}</p>
      <p className="text-xl font-semibold">{value}</p>
    </div>
  );
}

function SummaryBlock({
  value,
  label,
  tone,
}: {
  value: string;
  label: string;
  tone: string;
}) {
  return (
    <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-3 text-center">
      <p className="mb-3 text-2xl font-semibold text-slate-950 dark:text-slate-100">{value}</p>
      <div className={`flex h-24 flex-col items-center justify-end rounded-lg p-3 text-white ${tone}`}>
        <p className="text-xs font-medium">{label}</p>
      </div>
    </div>
  );
}
