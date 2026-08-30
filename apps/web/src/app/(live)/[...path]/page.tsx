import { notFound } from "next/navigation";
import { liveCoursesApi } from "@/features/live-courses/api";
import { liveCurriculumApi } from "@/features/live-courses/api/curriculum";
import { authApi } from "@/features/auth/api";
import { getPublicSiteSettings } from "@/features/cms/api/settings";
import { LiveCourseTemplate, LiveCourseTemplate2, LiveCourseTemplate3, LiveCourseTemplate4, LiveCourseTemplate5, LiveCourseTemplate6, type EnrollmentUser } from "@/features/live-courses/LiveCourseTemplate";
import { CourseInterestTracker } from "@/features/courses/CourseInterestTracker";
import { CourseViewTracker } from "@/features/courses/CourseViewTracker";

// Root catch-all: resolves an admin-defined custom course path (single- or
// multi-segment, e.g. /course1 or /course1/bac) to its live course landing.
// More specific routes (every real page) win over this catch-all, so it only
// handles paths no other route claims.
// Lives in its own (live) route group (see ../(live)/layout.tsx) so the
// site's main header is replaced by each template's own LiveCoursePromoBar.
interface Props {
  params: Promise<{ path: string[] }>;
  searchParams: Promise<{ enrolled?: string; error?: string }>;
}

const CHECKOUT_ERROR_MESSAGES: Record<string, string> = {
  already_enrolled: "আপনি ইতিমধ্যে এই কোর্সে এনরোল করেছেন। অ্যাক্সেস করতে লগইন করুন।",
  missing_fields: "সব তথ্য পূরণ করুন এবং আবার চেষ্টা করুন।",
  payment_init_failed: "পেমেন্ট শুরু করা যায়নি। আবার চেষ্টা করুন।",
  enroll_failed: "এনরোলমেন্ট সম্পন্ন করা যায়নি। আবার চেষ্টা করুন।",
  not_found: "কোর্সটি খুঁজে পাওয়া যায়নি।",
  server_error: "একটি সমস্যা হয়েছে। আবার চেষ্টা করুন।",
};

export async function generateMetadata({ params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const slug = path.join("/");
  try {
    const res = await liveCoursesApi.getBySlug(slug);
    if (!res.data) return { title: "Not Found" };
    return {
      title: res.data.title,
      description: res.data.hero?.subtitle ?? res.data.title,
    };
  } catch {
    return { title: "Not Found" };
  }
}

export default async function CustomPathCoursePage({ params, searchParams }: Props) {
  const { path } = await params;
  const { enrolled: enrolledParam, error: errorParam } = await searchParams;
  const slug = path.join("/");
  const checkoutError = errorParam ? (CHECKOUT_ERROR_MESSAGES[errorParam] ?? null) : null;

  const res = await liveCoursesApi.getBySlug(slug).catch(() => null);
  if (!res?.data) notFound();

  const course = res.data;
  const batchId = course.activeBatch?.id ?? null;

  const [me, siteSettings] = await Promise.all([
    authApi.me().then((r) => r.data).catch(() => null),
    getPublicSiteSettings(),
  ]);
  const user: EnrollmentUser | null =
    me && (me.role === "GUEST" || me.role === "STUDENT")
      ? {
          name: `${me.firstName} ${me.lastName}`.trim(),
          email: me.email ?? "",
          phone: me.phone ?? "",
        }
      : null;

  // Already-enrolled students see an "already enrolled" panel instead of the
  // pay form. The ?enrolled=1 param covers guests who just completed free enrollment.
  const enrolled =
    enrolledParam === "1" ||
    (user
      ? await liveCurriculumApi
          .enrollmentStatus(course.id)
          .then((r) => r.data.enrolled)
          .catch(() => false)
      : false);

  const tracker = user && !enrolled ? <CourseInterestTracker liveCourseId={course.id} /> : null;
  // GTM dataLayer — view_item for the ecommerce funnel
  const viewTracker = <CourseViewTracker courseId={course.id} title={course.title} price={parseFloat(course.price)} />;

  const logoUrl = siteSettings.logo_url || "/Skillkoro-logo.png";
  const logoAlt = siteSettings.site_name || "Skillkoro";

  if (course.template === "2") return <>{tracker}{viewTracker}<LiveCourseTemplate2 course={{ ...course, batchId }} user={user} enrolled={enrolled} checkoutError={checkoutError} logoUrl={logoUrl} logoAlt={logoAlt} /></>;
  if (course.template === "3") return <>{tracker}{viewTracker}<LiveCourseTemplate3 course={{ ...course, batchId }} user={user} enrolled={enrolled} checkoutError={checkoutError} logoUrl={logoUrl} logoAlt={logoAlt} /></>;
  if (course.template === "4") return <>{tracker}{viewTracker}<LiveCourseTemplate4 course={{ ...course, batchId }} user={user} enrolled={enrolled} checkoutError={checkoutError} logoUrl={logoUrl} logoAlt={logoAlt} /></>;
  if (course.template === "5") return <>{tracker}{viewTracker}<LiveCourseTemplate5 course={{ ...course, batchId }} user={user} enrolled={enrolled} checkoutError={checkoutError} logoUrl={logoUrl} logoAlt={logoAlt} /></>;
  if (course.template === "6") return <>{tracker}{viewTracker}<LiveCourseTemplate6 course={{ ...course, batchId }} user={user} enrolled={enrolled} checkoutError={checkoutError} logoUrl={logoUrl} logoAlt={logoAlt} /></>;
  return <>{tracker}{viewTracker}<LiveCourseTemplate course={{ ...course, batchId }} user={user} enrolled={enrolled} checkoutError={checkoutError} logoUrl={logoUrl} logoAlt={logoAlt} /></>;
}
