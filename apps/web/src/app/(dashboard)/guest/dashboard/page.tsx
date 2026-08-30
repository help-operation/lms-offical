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
  CalendarDays,
  CheckCircle2,
  Compass,
  Filter,
  Heart,
  PlayCircle,
  Sparkles,
  UserRoundCheck,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { authApi } from "@/features/auth/api";
import { cartApi } from "@/features/cart/api";
import { coursesApi } from "@/features/courses/api";

export default async function GuestDashboardPage() {
  const user = await authApi.me().catch(() => null);

  if (!user) {
    redirect("/");
  }

  if (user.data.role === "STUDENT") {
    redirect("/student/dashboard");
  }

  const [coursesRes, cartRes] = await Promise.all([
    coursesApi.list({ featured: true, limit: 3 }).catch(() => null),
    cartApi.getCart().catch(() => null),
  ]);

  // Fall back to newest courses if no featured ones are configured.
  let recommendedCourses = coursesRes?.data ?? [];
  if (recommendedCourses.length === 0) {
    const latest = await coursesApi.list({ limit: 3 }).catch(() => null);
    recommendedCourses = latest?.data ?? [];
  }

  const savedCount = cartRes?.data?.length ?? 0;

  // Setup steps derived from real signals.
  const profileComplete = Boolean(
    user.data.firstName && user.data.lastName && user.data.email,
  );
  const hasSavedCourse = savedCount > 0;
  const setupSteps = [
    { label: "Complete learner profile", done: profileComplete },
    { label: "Save a course to your cart", done: hasSavedCourse },
    { label: "Enroll in your first course", done: false },
  ];
  const completedSteps = setupSteps.filter((s) => s.done).length;
  const setupProgress = Math.round((completedSteps / setupSteps.length) * 100);

  const initials =
    `${user.data.firstName.slice(0, 1)}${user.data.lastName.slice(0, 1)}`.toUpperCase();

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
      <div className="space-y-5">
        <Card className="border-0 bg-white shadow-sm dark:bg-slate-900">
          <CardHeader className="flex-row items-center justify-between gap-4 space-y-0">
            <div>
              <CardTitle className="text-lg">Learner Details</CardTitle>
              <CardDescription>Guest account overview</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
              <Avatar className="h-20 w-20">
                <AvatarImage src="https://github.com/shadcn.png" />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="grid min-w-0 flex-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <MetricTile
                icon={<Heart className="h-4 w-4" />}
                label="Saved Courses"
                value={String(savedCount)}
                tone="sky"
              />
              <MetricTile
                icon={<BookOpen className="h-4 w-4" />}
                label="Enrolled"
                value="0"
                tone="lime"
              />
              <MetricTile
                icon={<Sparkles className="h-4 w-4" />}
                label="Setup Progress"
                value={`${setupProgress}%`}
                tone="amber"
              />
              <MetricTile
                icon={<UserRoundCheck className="h-4 w-4" />}
                label="Account Role"
                value="Guest"
                tone="rose"
              />
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-5 lg:grid-cols-[1fr_1.35fr]">
          <Card className="border-0 bg-white shadow-sm dark:bg-slate-900">
            <CardHeader>
              <CardTitle className="text-lg">Guest Setup</CardTitle>
              <CardDescription>Finish these steps to unlock more value.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Progress</p>
                  <p className="text-5xl font-light text-slate-950 dark:text-slate-100">
                    {setupProgress}%
                  </p>
                </div>
                <Badge className="bg-brand-50 text-brand hover:bg-brand-50">
                  {completedSteps}/{setupSteps.length}
                </Badge>
              </div>
              <Progress value={setupProgress} className="h-2" />
              <div className="space-y-3">
                {setupSteps.map((step, index) => (
                  <div key={step.label} className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400">
                      {step.done ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        index + 1
                      )}
                    </span>
                    <span className="text-sm text-slate-600 dark:text-slate-300">{step.label}</span>
                  </div>
                ))}
              </div>
              <Button asChild className="w-full rounded-full bg-brand-solid text-white hover:bg-brand-hover">
                <Link href="/dashboard/profile">Complete Profile</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white shadow-sm dark:bg-slate-900">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-lg">Recommended Courses</CardTitle>
                <CardDescription>Preview your first learning track.</CardDescription>
              </div>
              <Button variant="outline" size="sm" className="rounded-full" asChild>
                <Link href="/courses">
                  <Filter className="mr-2 h-4 w-4" />
                  All
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {recommendedCourses.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-400 dark:text-slate-500">
                  No courses available yet. Check back soon!
                </p>
              ) : (
                recommendedCourses.map((course, index) => (
                  <div
                    key={course.id}
                    className="grid grid-cols-[32px_1fr_auto] items-center gap-3 rounded-lg bg-slate-50 dark:bg-slate-800 p-3"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-xs font-semibold text-brand dark:bg-slate-800">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {course.title}
                      </p>
                      <p className="text-xs capitalize text-slate-500 dark:text-slate-400">
                        {course.categoryName ?? "General"} / {course.level.replace(/_/g, " ")}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" className="rounded-full" asChild>
                      <Link href={`/courses/${course.slug}`}>
                        <PlayCircle className="mr-2 h-4 w-4" />
                        Preview
                      </Link>
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <aside className="space-y-5">
        <Card className="border-0 bg-white shadow-sm dark:bg-slate-900">
          <CardHeader>
            <CardTitle className="text-lg">Summary - {user.data.firstName}</CardTitle>
            <CardDescription>Guest activity snapshot</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <SummaryBlock value="00" label="Courses" tone="bg-brand-600" />
              <SummaryBlock value={String(setupProgress)} label="Setup" tone="bg-brand-500" />
              <SummaryBlock value={String(savedCount).padStart(2, "0")} label="Saved" tone="bg-brand-400" />
              <SummaryBlock value="00" label="Certificates" tone="bg-brand-700" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-white shadow-sm dark:bg-slate-900">
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
            <CardDescription>Useful places to start.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild className="w-full justify-start rounded-lg bg-brand-solid text-white hover:bg-brand-hover">
              <Link href="/courses">
                <Compass className="mr-2 h-4 w-4" />
                Browse course catalog
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start rounded-lg">
              <Link href="/cart">
                <CalendarDays className="mr-2 h-4 w-4" />
                Review saved courses
              </Link>
            </Button>
          </CardContent>
        </Card>
      </aside>
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
