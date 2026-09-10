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
  Trophy,
  Target,
  Zap,
  ArrowRight,
  Bell,
  FileText,
  GraduationCap,
  ClipboardCheck,
  Video,
  Users,
  Timer,
  CalendarDays,
  Flame,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { authApi } from "@/features/auth/api";
import { certificatesApi } from "@/features/courses/api/certificates";
import { enrollmentsApi } from "@/features/courses/api/enrollments";
import { myPaymentsApi } from "@/features/payments/api";
import { liveClassesApi } from "@/features/live-classes/api";
import { notificationsServerApi } from "@/features/notifications/api/server";
import { DuePaymentBanner } from "@/features/courses/DuePaymentBanner";
import { progressOf } from "@/lib/utils";
import { LearningHeatmapCalendar } from "@/features/dashboard/LearningHeatmapCalendar";
import { LearningActivityGraph } from "@/features/dashboard/LearningActivityGraph";
import { MostActiveTime } from "@/features/dashboard/MostActiveTime";
import { SessionTimer } from "@/features/dashboard/SessionTimer";

function fmtBDT(v: number) {
  return "\u09F3" + v.toLocaleString("en-BD");
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function fmtTime(d: string) {
  return new Date(d).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

function timeAgo(d: string | null) {
  if (!d) return "";
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return fmtDate(d);
}

function daysSince(dateStr: string | null): number {
  if (!dateStr) return 0;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
}

function fmtFullDate(d: string | null) {
  if (!d) return "N/A";
  return new Date(d).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export default async function StudentDashboardPage() {
  const user = await authApi.me().catch(() => null);

  if (!user) redirect("/");
  if (user.data.role !== "STUDENT") redirect("/guest/dashboard");

  // Verification enforcement: prevent unverified users from accessing dashboard
  // Email/Google accounts: require emailVerified. Phone-only accounts: require phoneVerified.
  if (user.data.email !== null && !user.data.emailVerified) {
    redirect(`/verify-email?email=${encodeURIComponent(user.data.email)}`);
  }
  if (user.data.email === null && !user.data.phoneVerified) {
    redirect("/");
  }

  const [enrollmentsRes, certificatesRes, paymentsRes, classesRes, notificationsRes] =
    await Promise.all([
      enrollmentsApi.myEnrollments().catch(() => null),
      certificatesApi.mine().catch(() => null),
      myPaymentsApi.list().catch(() => null),
      liveClassesApi.upcoming().catch(() => null),
      notificationsServerApi.list().catch(() => null),
    ]);

  const enrollments = enrollmentsRes?.data ?? [];
  const certificates = certificatesRes?.data ?? [];
  const payments = paymentsRes?.data ?? [];
  const classes = classesRes?.data ?? [];
  const notifications = notificationsRes?.data ?? [];

  const withProgress = enrollments.map((e) => ({ ...e, progress: progressOf(e) }));

  const totalCourses = withProgress.length;
  const activeCourses = withProgress.filter((e) => e.progress > 0 && e.progress < 100).length;
  const completedCourses = withProgress.filter((e) => e.progress >= 100).length;
  const completedLessons = withProgress.reduce((sum, e) => sum + e.completedLessons, 0);
  const totalLessons = withProgress.reduce((sum, e) => sum + e.totalLessons, 0);
  const avgProgress =
    totalCourses > 0
      ? Math.round(withProgress.reduce((sum, e) => sum + e.progress, 0) / totalCourses)
      : 0;

  const learningHours = Math.round(completedLessons * 12 / 60 * 10) / 10;
  const joinDate = user.data.createdAt;
  const daysActive = daysSince(joinDate);

  const upcomingClasses = classes
    .filter((c) => c.status === "scheduled")
    .slice(0, 3);

  const continueLearning = [...withProgress]
    .filter((e) => e.progress < 100 && e.progress > 0)
    .sort((a, b) => b.progress - a.progress)
    .slice(0, 2);

  const recentPayments = payments.slice(0, 3);
  const recentNotifications = notifications.slice(0, 5);
  const unreadNotifications = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-5">
      <DuePaymentBanner enrollments={enrollments} />

      {/* Quick Actions — top right row */}
      <div className="flex flex-wrap items-center justify-end gap-2">
        <QuickAction href="/student/courses" icon={<BookOpen className="h-4 w-4" />} label="My Courses" color="bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400" />
        <QuickAction href={continueLearning[0] ? (continueLearning[0].courseType === "live" ? `/${continueLearning[0].courseSlug}` : `/learn/${continueLearning[0].courseSlug}`) : "/courses"} icon={<PlayCircle className="h-4 w-4" />} label="Continue" color="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400" />
        <QuickAction href="/student/classes" icon={<Video className="h-4 w-4" />} label="Live Classes" color="bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400" />
        <QuickAction href="/student/assignments" icon={<ClipboardCheck className="h-4 w-4" />} label="Assignments" color="bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400" />
        <QuickAction href="/student/progress" icon={<GraduationCap className="h-4 w-4" />} label="Progress" color="bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400" />
        <QuickAction href="/student/certificates" icon={<Award className="h-4 w-4" />} label="Certificates" color="bg-pink-50 text-pink-600 dark:bg-pink-500/10 dark:text-pink-400" />
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        <StatCard
          icon={<BookOpen className="h-4 w-4" />}
          label="Enrolled"
          value={String(totalCourses)}
          iconBg="bg-gradient-to-br from-blue-500 to-blue-600"
          cardBg="bg-gradient-to-br from-blue-50/80 to-white dark:from-blue-500/10 dark:to-slate-900"
          border="border-blue-100 dark:border-blue-500/20"
        />
        <StatCard
          icon={<Timer className="h-4 w-4" />}
          label="Session Time"
          value={<SessionTimer />}
          iconBg="bg-gradient-to-br from-emerald-500 to-emerald-600"
          cardBg="bg-gradient-to-br from-emerald-50/80 to-white dark:from-emerald-500/10 dark:to-slate-900"
          border="border-emerald-100 dark:border-emerald-500/20"
          live
        />
        <StatCard
          icon={<CheckCircle2 className="h-4 w-4" />}
          label="Completed"
          value={String(completedCourses)}
          iconBg="bg-gradient-to-br from-violet-500 to-violet-600"
          cardBg="bg-gradient-to-br from-violet-50/80 to-white dark:from-violet-500/10 dark:to-slate-900"
          border="border-violet-100 dark:border-violet-500/20"
        />
        <StatCard
          icon={<CalendarDays className="h-4 w-4" />}
          label="Days Active"
          value={String(daysActive)}
          iconBg="bg-gradient-to-br from-amber-500 to-amber-600"
          cardBg="bg-gradient-to-br from-amber-50/80 to-white dark:from-amber-500/10 dark:to-slate-900"
          border="border-amber-100 dark:border-amber-500/20"
        />
        <StatCard
          icon={<Flame className="h-4 w-4" />}
          label="Progress"
          value={`${avgProgress}%`}
          iconBg="bg-gradient-to-br from-rose-500 to-rose-600"
          cardBg="bg-gradient-to-br from-rose-50/80 to-white dark:from-rose-500/10 dark:to-slate-900"
          border="border-rose-100 dark:border-rose-500/20"
        />
        <StatCard
          icon={<GraduationCap className="h-4 w-4" />}
          label="Total Lessons"
          value={`${completedLessons}/${totalLessons}`}
          iconBg="bg-gradient-to-br from-cyan-500 to-cyan-600"
          cardBg="bg-gradient-to-br from-cyan-50/80 to-white dark:from-cyan-500/10 dark:to-slate-900"
          border="border-cyan-100 dark:border-cyan-500/20"
        />
      </div>

      {/* Charts Row: Activity Graph + Most Active Time */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">
        <LearningActivityGraph enrollments={withProgress} />
        <MostActiveTime enrollments={withProgress} />
      </div>

      {/* Heatmap Calendar */}
      <LearningHeatmapCalendar enrollments={withProgress} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_380px]">
        {/* Left Column */}
        <div className="min-w-0 space-y-5">
          {/* Continue Learning */}
          <Card className="border-0 bg-white shadow-sm dark:bg-slate-900">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-lg">Continue Learning</CardTitle>
              {totalCourses > 0 && (
                <Button variant="ghost" size="sm" className="text-brand hover:text-brand-hover" asChild>
                  <Link href="/student/courses">
                    View All <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </Link>
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {continueLearning.length === 0 ? (
                <EmptyState
                  icon={<PlayCircle className="h-7 w-7" />}
                  title={totalCourses === 0 ? "No courses yet" : "All caught up!"}
                  description={totalCourses === 0 ? "You haven't enrolled in any courses yet." : "Every course is complete. Great job!"}
                  actionLabel={totalCourses === 0 ? "Explore Courses" : "View Courses"}
                  actionHref={totalCourses === 0 ? "/courses" : "/student/courses"}
                />
              ) : (
                <div className="space-y-3">
                  {continueLearning.map((item) => (
                    <div key={`${item.courseType}-${item.id}`} className="rounded-xl border border-slate-100 bg-slate-50 p-4 transition-colors hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800/50 dark:hover:bg-slate-800">
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{item.courseTitle}</p>
                          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                            {item.courseType === "live" ? "Live course" : `${item.completedLessons} of ${item.totalLessons} lessons completed`}
                          </p>
                        </div>
                        <Button size="sm" className="shrink-0 rounded-full bg-brand text-white hover:bg-brand-hover" asChild>
                          <Link href={item.courseType === "live" ? `/${item.courseSlug}` : `/learn/${item.courseSlug}`}>
                            <PlayCircle className="mr-1.5 h-3.5 w-3.5" /> Continue
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
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Payments */}
          {recentPayments.length > 0 && (
            <Card className="border-0 bg-white shadow-sm dark:bg-slate-900">
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle className="text-lg">Recent Payments</CardTitle>
                <Button variant="ghost" size="sm" className="text-brand hover:text-brand-hover" asChild>
                  <Link href="/student/payment-history">
                    View History <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className="space-y-2">
                {recentPayments.map((p) => (
                  <div key={p.paymentId} className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                      <CreditCard className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                        {p.items?.[0]?.courseTitle ?? `Order #${p.orderId}`}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {p.paidAt ? fmtDate(p.paidAt) : "Pending"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{fmtBDT(Number(p.amount))}</p>
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${
                          p.status === "completed"
                            ? "border-emerald-200 text-emerald-600 dark:border-emerald-800 dark:text-emerald-400"
                            : p.status === "pending"
                              ? "border-amber-200 text-amber-600 dark:border-amber-800 dark:text-amber-400"
                              : "border-red-200 text-red-600 dark:border-red-800 dark:text-red-400"
                        }`}
                      >
                        {p.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column */}
        <aside className="space-y-5">
          {/* Upcoming Classes */}
          <Card className="border-0 bg-white shadow-sm dark:bg-slate-900">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-lg">Upcoming Classes</CardTitle>
              {upcomingClasses.length > 0 && (
                <Button variant="ghost" size="sm" className="text-brand hover:text-brand-hover" asChild>
                  <Link href="/student/classes">
                    View All <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </Link>
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-2">
              {upcomingClasses.length === 0 ? (
                <div className="py-4 text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">No upcoming classes</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Check your schedule for future classes.</p>
                  <Button variant="outline" size="sm" className="mt-3 rounded-full" asChild>
                    <Link href="/student/classes">View Schedule</Link>
                  </Button>
                </div>
              ) : (
                upcomingClasses.map((cls) => {
                  const d = new Date(cls.scheduledAt);
                  const isToday = new Date().toDateString() === d.toDateString();
                  return (
                    <div key={cls.id} className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50">
                      <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl bg-brand-50 text-brand dark:bg-brand-500/10">
                        <span className="text-[9px] font-bold uppercase leading-none">
                          {isToday ? "TODAY" : d.toLocaleDateString("en-US", { month: "short" })}
                        </span>
                        <span className="text-sm font-bold leading-none">{d.getDate()}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-slate-900 dark:text-slate-100">{cls.title}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                          {fmtTime(cls.scheduledAt)}
                          {cls.instructorFirstName && ` \u00B7 ${cls.instructorFirstName}`}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card className="border-0 bg-white shadow-sm dark:bg-slate-900">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">Notifications</CardTitle>
                {unreadNotifications > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1.5 text-[10px] font-bold text-white">
                    {unreadNotifications}
                  </span>
                )}
              </div>
              <Button variant="ghost" size="sm" className="text-brand hover:text-brand-hover" asChild>
                <Link href="/student/notifications">
                  View All <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {recentNotifications.length === 0 ? (
                <div className="py-4 text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                    <Bell className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">No new notifications</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">You&apos;re all caught up!</p>
                </div>
              ) : (
                recentNotifications.map((n) => (
                  <Link
                    key={n.id}
                    href={n.link ?? "/student/notifications"}
                    className={`flex items-start gap-3 rounded-xl p-2.5 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 ${!n.isRead ? "bg-brand-50/50 dark:bg-brand-500/5" : ""}`}
                  >
                    <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                      n.type === "class_scheduled"
                        ? "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
                        : n.type === "assignment"
                          ? "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"
                          : n.type === "certificate"
                            ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                            : n.type === "payment"
                              ? "bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400"
                              : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                    }`}>
                      <Bell className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-xs font-medium ${!n.isRead ? "text-slate-900 dark:text-slate-100" : "text-slate-600 dark:text-slate-300"}`}>
                        {n.title}
                      </p>
                      {n.body && (
                        <p className="mt-0.5 line-clamp-1 text-[11px] text-slate-500 dark:text-slate-400">{n.body}</p>
                      )}
                    </div>
                    <span className="shrink-0 text-[10px] text-slate-400 dark:text-slate-500">{timeAgo(n.createdAt)}</span>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>

          {/* Achievements */}
          <Card className="border-0 bg-white shadow-sm dark:bg-slate-900">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-lg">Achievements</CardTitle>
              {certificates.length > 0 && (
                <Button variant="ghost" size="sm" className="text-brand hover:text-brand-hover" asChild>
                  <Link href="/student/certificates">
                    View All <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </Link>
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {certificates.length === 0 && completedCourses === 0 ? (
                <div className="py-4 text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                    <Trophy className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">No achievements yet</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Complete a course to earn your first certificate.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <AchievementTile
                    icon={<Award className="h-5 w-5" />}
                    value={String(certificates.length)}
                    label="Certificates"
                    color="bg-brand-50 text-brand dark:bg-brand-500/10 dark:text-brand"
                  />
                  <AchievementTile
                    icon={<Target className="h-5 w-5" />}
                    value={String(completedCourses)}
                    label="Courses Done"
                    color="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                  />
                  <AchievementTile
                    icon={<Zap className="h-5 w-5" />}
                    value={String(completedLessons)}
                    label="Lessons Done"
                    color="bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"
                  />
                  <AchievementTile
                    icon={<TrendingUp className="h-5 w-5" />}
                    value={`${avgProgress}%`}
                    label="Avg Progress"
                    color="bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

/* ─── Helper Components ────────────────────────────────────────────────────── */

function QuickAction({ href, icon, label, color }: { href: string; icon: ReactNode; label: string; color: string }) {
  return (
    <Link
      href={href}
      className="group inline-flex h-9 items-center gap-2 rounded-md border border-slate-100 bg-white px-3 text-sm font-medium shadow-sm transition-all hover:border-brand-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-brand-500/30"
    >
      <span className={`flex h-6 w-6 items-center justify-center rounded-md ${color} transition-transform group-hover:scale-110`}>
        {icon}
      </span>
      <span className="text-slate-600 dark:text-slate-400">{label}</span>
    </Link>
  );
}

function StatCard({ icon, label, value, iconBg, cardBg, border, live }: { icon: ReactNode; label: string; value: ReactNode; iconBg: string; cardBg: string; border: string; live?: boolean }) {
  return (
    <div className={`group rounded-xl ${cardBg} ${border} border p-3 shadow-sm transition-all duration-200 hover:shadow-md dark:hover:shadow-slate-800/50`}>
      <div className={`mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg ${iconBg}`}>
        <span className="text-white">{icon}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <p className="text-lg font-bold text-gray-900 dark:text-white leading-tight">{value}</p>
        {live && <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" /></span>}
      </div>
      <p className="text-[11px] font-medium text-gray-500 dark:text-slate-400">{label}</p>
    </div>
  );
}

function AchievementTile({ icon, value, label, color }: { icon: ReactNode; value: string; label: string; color: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${color}`}>{icon}</div>
      <div>
        <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{value}</p>
        <p className="text-[10px] text-slate-500 dark:text-slate-400">{label}</p>
      </div>
    </div>
  );
}

function EmptyState({ icon, title, description, actionLabel, actionHref }: { icon: ReactNode; title: string; description: string; actionLabel: string; actionHref: string }) {
  return (
    <div className="py-6 text-center">
      <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">{icon}</div>
      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{title}</p>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{description}</p>
      <Button asChild size="sm" className="mt-4 rounded-full bg-brand text-white hover:bg-brand-hover">
        <Link href={actionHref}>{actionLabel}</Link>
      </Button>
    </div>
  );
}
