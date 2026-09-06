import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";
import { Progress } from "@repo/ui/progress";
import {
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  PlayCircle,
  TrendingUp,
  AlertTriangle,
  Radio,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { authApi } from "@/features/auth/api";
import { certificatesApi } from "@/features/courses/api/certificates";
import { enrollmentsApi } from "@/features/courses/api/enrollments";
import { myPaymentsApi } from "@/features/payments/api";
import { liveClassesApi } from "@/features/live-classes/api";
import { DuePaymentBanner } from "@/features/courses/DuePaymentBanner";

function progressOf(e: { totalLessons: number; completedLessons: number }) {
  return e.totalLessons > 0
    ? Math.round((e.completedLessons / e.totalLessons) * 100)
    : 0;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

function fmtBDT(v: number) {
  return "\u09F3" + v.toLocaleString("en-BD");
}

export default async function StudentDashboardPage() {
  const user = await authApi.me().catch(() => null);

  if (!user) redirect("/");
  if (user.data.role !== "STUDENT") redirect("/guest/dashboard");

  const [enrollmentsRes, certificatesRes, paymentsRes, classesRes] = await Promise.all([
    enrollmentsApi.myEnrollments().catch(() => null),
    certificatesApi.mine().catch(() => null),
    myPaymentsApi.list().catch(() => null),
    liveClassesApi.upcoming().catch(() => null),
  ]);

  const enrollments = enrollmentsRes?.data ?? [];
  const certificates = certificatesRes?.data ?? [];
  const payments = paymentsRes?.data ?? [];
  const classes = classesRes?.data ?? [];

  const withProgress = enrollments.map((e) => ({ ...e, progress: progressOf(e) }));

  const totalCourses = withProgress.length;
  const activeCourses = withProgress.filter((e) => e.progress > 0 && e.progress < 100).length;
  const completedCourses = withProgress.filter((e) => e.progress >= 100).length;
  const completedLessons = withProgress.reduce((sum, e) => sum + e.completedLessons, 0);
  const avgProgress =
    totalCourses > 0
      ? Math.round(withProgress.reduce((sum, e) => sum + e.progress, 0) / totalCourses)
      : 0;
  const notStarted = withProgress.filter((e) => e.progress === 0).length;
  const inProgress = withProgress.filter((e) => e.progress > 0 && e.progress < 100).length;

  // Payment summary
  const totalPaid = enrollments.reduce((sum, e) => sum + Number(e.totalPaid ?? 0), 0);
  const totalDue = enrollments.reduce((sum, e) => sum + Number(e.dueAmount ?? 0), 0);

  // Upcoming classes (next 3)
  const upcomingClasses = classes
    .filter((c) => c.status === "scheduled")
    .slice(0, 3);

  // Continue learning
  const continueLearning = [...withProgress]
    .filter((e) => e.progress < 100 && e.progress > 0)
    .sort((a, b) => b.progress - a.progress)
    .slice(0, 3);

  // Courses preview
  const coursesPreview = [...withProgress].slice(0, 5);

  // Recent payments (last 3)
  const recentPayments = payments.slice(0, 3);

  return (
    <div className="space-y-5">
      <DuePaymentBanner enrollments={enrollments} />

      {/* Greeting */}
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              {getGreeting()}, {user.data.firstName}! {"\uD83D\uDC4B"}
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {totalCourses === 0
                ? "Ready to start your learning journey?"
                : activeCourses > 0
                  ? `You have ${activeCourses} course${activeCourses > 1 ? "s" : ""} in progress. Keep going!`
                  : completedCourses > 0
                    ? "All your courses are complete! Well done!"
                    : "Ready to continue learning today?"}
            </p>
          </div>
          {continueLearning[0] && (
            <Button asChild className="rounded-full bg-brand text-white hover:bg-brand-hover">
              <Link href={continueLearning[0].courseType === "live" ? `/${continueLearning[0].courseSlug}` : `/learn/${continueLearning[0].courseSlug}`}>
                <PlayCircle className="mr-2 h-4 w-4" />
                Resume Learning
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <KPICard icon={<BookOpen className="h-5 w-5" />} label="Total Courses" value={String(totalCourses)} color="bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400" />
        <KPICard icon={<Clock className="h-5 w-5" />} label="Active Courses" value={String(activeCourses)} color="bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400" />
        <KPICard icon={<CheckCircle2 className="h-5 w-5" />} label="Completed" value={String(completedCourses)} color="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400" />
        <KPICard icon={<TrendingUp className="h-5 w-5" />} label="Avg. Progress" value={`${avgProgress}%`} color="bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400" />
        <KPICard icon={<CheckCircle2 className="h-5 w-5" />} label="Lessons Done" value={String(completedLessons)} color="bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-400" />
        <KPICard icon={<Award className="h-5 w-5" />} label="Certificates" value={String(certificates.length)} color="bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400" />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_420px]">
        <div className="min-w-0 space-y-5">
          {/* Overall Progress */}
          <Card className="border-0 bg-white shadow-sm dark:bg-slate-900">
            <CardHeader>
              <CardTitle className="text-lg">Overall Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {totalCourses === 0 ? (
                <EmptyState icon={<TrendingUp className="h-7 w-7" />} title="No progress yet" description="Enroll in a course to start tracking your progress." actionLabel="Explore Courses" actionHref="/courses" />
              ) : (
                <>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Average Completion</p>
                      <p className="text-4xl font-light text-slate-950 dark:text-slate-100">{avgProgress}%</p>
                    </div>
                    <Badge className="bg-brand-50 text-brand hover:bg-brand-50">{completedCourses} done</Badge>
                  </div>
                  <Progress value={avgProgress} className="h-2.5" />
                  <div className="grid grid-cols-3 gap-3">
                    <RatePill label="Not started" value={String(notStarted)} color="bg-slate-500" />
                    <RatePill label="In progress" value={String(inProgress)} color="bg-brand" />
                    <RatePill label="Completed" value={String(completedCourses)} color="bg-emerald-500" />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Continue Learning */}
          <Card className="border-0 bg-white shadow-sm dark:bg-slate-900">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-lg">Continue Learning</CardTitle>
              {totalCourses > 0 && (
                <Button variant="outline" size="sm" className="rounded-full" asChild>
                  <Link href="/student/courses">View All</Link>
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              {continueLearning.length === 0 ? (
                <EmptyState icon={<PlayCircle className="h-7 w-7" />} title={totalCourses === 0 ? "No courses yet" : "All caught up!"} description={totalCourses === 0 ? "You haven't enrolled in any courses yet." : "Every course is complete. Great job!"} actionLabel={totalCourses === 0 ? "Browse Courses" : "View Courses"} actionHref={totalCourses === 0 ? "/courses" : "/student/courses"} />
              ) : (
                continueLearning.map((item) => (
                  <div key={`${item.courseType}-${item.id}`} className="rounded-xl bg-slate-50 p-4 transition-colors hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700/60">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{item.courseTitle}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {item.courseType === "live" ? "Live course" : `${item.completedLessons}/${item.totalLessons} lessons completed`}
                        </p>
                      </div>
                      <Button size="sm" variant="outline" className="shrink-0 rounded-full" asChild>
                        <Link href={item.courseType === "live" ? `/${item.courseSlug}` : `/learn/${item.courseSlug}`}>
                          <PlayCircle className="mr-2 h-4 w-4" /> {item.courseType === "live" ? "Open" : "Resume"}
                        </Link>
                      </Button>
                    </div>
                    {item.courseType !== "live" && (
                      <div className="flex items-center gap-3">
                        <Progress value={item.progress} className="h-2 flex-1" />
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{item.progress}%</span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <aside className="space-y-5">
          {/* Quick Summary */}
          <Card className="border-0 bg-white shadow-sm dark:bg-slate-900">
            <CardHeader>
              <CardTitle className="text-lg">Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <SummaryTile value={String(totalCourses)} label="Courses" color="bg-brand" />
                <SummaryTile value={`${avgProgress}%`} label="Progress" color="bg-brand-500" />
                <SummaryTile value={String(completedLessons)} label="Lessons" color="bg-brand-400" />
                <SummaryTile value={String(certificates.length)} label="Awards" color="bg-brand-700" />
              </div>
            </CardContent>
          </Card>

          {/* Payment Summary */}
          <Card className="border-0 bg-white shadow-sm dark:bg-slate-900">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-lg">Payments</CardTitle>
              <Link href="/student/payment-history" className="text-xs font-medium text-brand hover:underline">View all</Link>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-emerald-50 p-3 text-center dark:bg-emerald-500/10">
                  <p className="text-lg font-semibold text-emerald-700 dark:text-emerald-400">{fmtBDT(totalPaid)}</p>
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-500">Paid</p>
                </div>
                <div className={`rounded-xl p-3 text-center ${totalDue > 0 ? "bg-amber-50 dark:bg-amber-500/10" : "bg-slate-50 dark:bg-slate-800"}`}>
                  <p className={`text-lg font-semibold ${totalDue > 0 ? "text-amber-700 dark:text-amber-400" : "text-slate-500 dark:text-slate-400"}`}>{fmtBDT(totalDue)}</p>
                  <p className={`text-[10px] ${totalDue > 0 ? "text-amber-600 dark:text-amber-500" : "text-slate-400 dark:text-slate-500"}`}>Due</p>
                </div>
              </div>
              {totalDue > 0 && (
                <Link href="/student/payment-history" className="flex items-center gap-2 rounded-lg bg-amber-50 p-3 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:hover:bg-amber-500/20">
                  <AlertTriangle className="h-3.5 w-3.5" /> You have pending payments
                </Link>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Classes */}
          {upcomingClasses.length > 0 && (
            <Card className="border-0 bg-white shadow-sm dark:bg-slate-900">
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle className="text-lg">Upcoming Classes</CardTitle>
                <Link href="/student/classes" className="text-xs font-medium text-brand hover:underline">View all</Link>
              </CardHeader>
              <CardContent className="space-y-2">
                {upcomingClasses.map((cls) => (
                  <div key={cls.id} className="flex items-center gap-3 rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
                    <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg bg-brand-50 text-brand dark:bg-brand-500/10">
                      <span className="text-[9px] font-bold uppercase">{new Date(cls.scheduledAt).toLocaleDateString("en-US", { month: "short" })}</span>
                      <span className="text-sm font-bold leading-none">{new Date(cls.scheduledAt).getDate()}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-slate-900 dark:text-slate-100">{cls.title}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        {new Date(cls.scheduledAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* My Courses Preview */}
          <Card className="border-0 bg-white shadow-sm dark:bg-slate-900">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-lg">My Courses</CardTitle>
              {totalCourses > 0 && (
                <Link href="/student/courses" className="text-xs font-medium text-brand hover:underline">View all</Link>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              {coursesPreview.length === 0 ? (
                <EmptyState icon={<BookOpen className="h-7 w-7" />} title="No courses yet" description="You haven't enrolled in any courses." actionLabel="Explore Courses" actionHref="/courses" compact />
              ) : (
                coursesPreview.map((course, index) => (
                  <div key={`${course.courseType}-${course.id}`} className="grid grid-cols-[36px_1fr_64px] items-center gap-3">
                    <span className="text-sm font-semibold text-slate-400 dark:text-slate-500">{String(index + 1).padStart(2, "0")}</span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{course.courseTitle}</p>
                      <Progress value={course.progress} className="mt-1.5 h-1.5" />
                    </div>
                    <span className="text-right text-sm font-medium text-slate-600 dark:text-slate-300">{course.progress}%</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Certificates */}
          <Card className="border-0 bg-white shadow-sm dark:bg-slate-900">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-lg">Certificates</CardTitle>
              {certificates.length > 0 && (
                <Link href="/student/certificates" className="text-xs font-medium text-brand hover:underline">View all</Link>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              {certificates.length === 0 ? (
                <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-4 dark:bg-slate-800">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand"><Award className="h-4 w-4" /></span>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Complete a course to earn your first certificate.</p>
                </div>
              ) : (
                certificates.slice(0, 3).map((cert) => (
                  <Link key={cert.id} href={`/certificate/${cert.certificateCode}`} className="flex items-center gap-3 rounded-lg bg-slate-50 p-4 transition-colors hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand"><Award className="h-4 w-4" /></span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{cert.courseTitle}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{cert.issuedAt ? new Date(cert.issuedAt).toLocaleDateString() : "Issued"}</p>
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

function KPICard({ icon, label, value, color }: { icon: ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>{icon}</div>
      <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{value}</p>
      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  );
}

function RatePill({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className={`rounded-xl p-3 text-white ${color}`}>
      <p className="text-[11px] opacity-90">{label}</p>
      <p className="text-xl font-semibold">{value}</p>
    </div>
  );
}

function SummaryTile({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3 text-center dark:bg-slate-800">
      <p className="mb-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">{value}</p>
      <div className={`flex h-16 flex-col items-center justify-end rounded-lg p-3 text-white ${color}`}>
        <p className="text-xs font-medium">{label}</p>
      </div>
    </div>
  );
}

function EmptyState({ icon, title, description, actionLabel, actionHref, compact = false }: { icon: ReactNode; title: string; description: string; actionLabel: string; actionHref: string; compact?: boolean }) {
  return (
    <div className={`text-center ${compact ? "py-4" : "py-6"}`}>
      <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">{icon}</div>
      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{title}</p>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{description}</p>
      <Button asChild size="sm" className="mt-4 rounded-full bg-brand text-white hover:bg-brand-hover">
        <Link href={actionHref}>{actionLabel}</Link>
      </Button>
    </div>
  );
}
