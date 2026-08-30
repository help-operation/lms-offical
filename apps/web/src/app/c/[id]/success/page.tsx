import { redirect } from "next/navigation";
import Link from "next/link";
import { CheckCircle, XCircle } from "lucide-react";
import { liveCoursesApi } from "@/features/live-courses/api";
import { liveCurriculumApi } from "@/features/live-courses/api/curriculum";
import { authApi } from "@/features/auth/api";
import { confirmPayment } from "@/features/payments/api/confirm";
import { PurchaseTracker } from "@/shared/components/PurchaseTracker";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ t?: string; subscription?: string }>;
}

export default async function LivePaymentSuccessPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { t, subscription } = await searchParams;

  // Course (best-effort, for the redirect target/title) + the logged-in viewer.
  const [course, me] = await Promise.all([
    liveCoursesApi.getById(Number(id)).then((r) => r.data).catch(() => null),
    authApi.me().then((r) => r.data).catch(() => null),
  ]);
  const courseHref       = course?.slug ? `/${course.slug}` : "/courses";
  const isStudentSession = !!me && me.role === "STUDENT";

  // ── Subscription success path ──────────────────────────────────────────
  if (subscription === "success") {
    // Fetch subscription status to display details
    const subStatus = await liveCurriculumApi
      .subscriptionStatus(Number(id))
      .then((r) => r.data)
      .catch(() => null);

    const sub = subStatus?.subscription;

    return (
      <div className="min-h-[70vh] bg-gray-50 flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center space-y-5">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-9 w-9 text-green-500" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">সাবস্ক্রিপশন সফল হয়েছে! 🎉</h1>

          {course?.title && (
            <div className="rounded-xl border border-green-100 bg-green-50 px-4 py-3">
              <p className="text-xs text-gray-500">কোর্স</p>
              <p className="text-base font-bold text-gray-900">{course.title}</p>
            </div>
          )}

          {sub && (
            <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-left space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">মাসিক বেতন</span>
                <span className="font-semibold text-gray-900">৳{Number(sub.monthlyPrice).toLocaleString()}/মাস</span>
              </div>
              {sub.nextBillingDate && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">পরবর্তী বিলিং</span>
                  <span className="font-semibold text-gray-900">
                    {new Date(sub.nextBillingDate).toLocaleDateString("en-BD")}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">পেমেন্ট গেটওয়ে</span>
                <span className="font-semibold text-gray-900 capitalize">{sub.gateway}</span>
              </div>
            </div>
          )}

          <p className="text-sm text-gray-500 leading-relaxed">
            আপনার সাবস্ক্রিপশন সফলভাবে সক্রিয় হয়েছে। প্রতি মাসে স্বয়ংক্রিয়ভাবে পেমেন্ট নেওয়া হবে।
          </p>

          <div className="flex flex-col gap-3 pt-1">
            <Link
              href="/student/courses"
              className="inline-block px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl text-sm transition-colors"
            >
              আমার কোর্স দেখুন
            </Link>
            <Link
              href={courseHref}
              className="inline-block text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
            >
              কোর্সে ফিরে যান
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Standard one-time payment path ─────────────────────────────────────

  // Verify + consume the one-time token. Missing / already-used (refresh, back
  // button) / expired → there is no legitimate result to show, so redirect
  // away: students to their dashboard, everyone else back to the course.
  const confirmation = await confirmPayment(t);
  if (!confirmation) {
    redirect(isStudentSession ? "/student/courses" : courseHref);
  }

  const isPaid    = confirmation.status === "paid" || confirmation.status === "already_paid";
  const isAlready = confirmation.status === "already_paid";

  const courseTitle = course?.title ?? null;
  // Logged-in students are enrolled directly → show a dashboard link; guests go
  // through the lead flow → keep the "we'll contact you" wording.
  const isLoggedIn  = !!me && (me.role === "STUDENT" || me.role === "GUEST");

  return (
    <div className="min-h-[70vh] bg-gray-50 flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center space-y-5">
        {isPaid ? (
          <>
            {!isAlready && course && (
              <PurchaseTracker
                orderId={Number(confirmation.orderId ?? confirmation.leadId ?? course.id)}
                value={parseFloat(course.price)}
                items={[{ courseId: course.id, courseTitle: course.title }]}
              />
            )}
            <div className="flex justify-center">
              <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-9 w-9 text-green-500" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isAlready ? "ইতিমধ্যে পেমেন্ট হয়েছে" : "পেমেন্ট সফল হয়েছে! 🎉"}
            </h1>

            {courseTitle && (
              <div className="rounded-xl border border-green-100 bg-green-50 px-4 py-3">
                <p className="text-xs text-gray-500">কোর্স</p>
                <p className="text-base font-bold text-gray-900">{courseTitle}</p>
              </div>
            )}

            {course?.courseType === "bundle" && course.bundledCourses && course.bundledCourses.length > 0 && (
              <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-left">
                <p className="text-sm font-semibold text-gray-800 mb-2">
                  আপনি এই {course.bundledCourses.length}টি কোর্সে এনরোল হয়েছেন:
                </p>
                <ul className="space-y-1">
                  {course.bundledCourses.map((bc) => (
                    <li key={bc.id} className="text-sm text-gray-600 flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">✓</span>
                      <span>{bc.title}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <p className="text-sm text-gray-500 leading-relaxed">
              {isLoggedIn
                ? "আপনার এনরোলমেন্ট সম্পন্ন হয়েছে। আপনার ড্যাশবোর্ড থেকে কোর্সটি দেখুন।"
                : isAlready
                  ? "আপনি এই কোর্সে আগেই এনরোল করেছেন।"
                  : "আপনার পেমেন্ট সফলভাবে সম্পন্ন হয়েছে। আমরা শীঘ্রই আপনার সাথে যোগাযোগ করব।"}
            </p>

            {isLoggedIn ? (
              <div className="flex flex-col gap-3 pt-1">
                <Link
                  href="/student/courses"
                  className="inline-block px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl text-sm transition-colors"
                >
                  আমার কোর্স দেখুন
                </Link>
                <Link
                  href={courseHref}
                  className="inline-block text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
                >
                  কোর্সে ফিরে যান
                </Link>
              </div>
            ) : (
              <Link
                href={courseHref}
                className="inline-block mt-2 px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl text-sm transition-colors"
              >
                কোর্সে ফিরে যান
              </Link>
            )}
          </>
        ) : (
          <>
            <div className="flex justify-center">
              <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
                <XCircle className="h-9 w-9 text-red-500" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">পেমেন্ট ব্যর্থ হয়েছে</h1>
            <p className="text-sm text-gray-500 leading-relaxed">
              দুঃখিত, আপনার পেমেন্ট প্রক্রিয়া করা সম্ভব হয়নি। আবার চেষ্টা করুন।
            </p>
            <Link
              href={`${courseHref}#enroll`}
              className="inline-block mt-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl text-sm transition-colors"
            >
              আবার চেষ্টা করুন
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
