import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, XCircle, AlertCircle, BookOpen, Home, MessageCircle, Phone } from "lucide-react";
import { ordersApi } from "@/features/payments/api/orders";
import { confirmPayment } from "@/features/payments/api/confirm";
import { authApi } from "@/features/auth/api";
import { SessionRefresher } from "@/features/auth/SessionRefresher";
import { getPublicContactSettings } from "@/features/cms/api/settings";
import { PurchaseTracker } from "@/shared/components/PurchaseTracker";

export const metadata = { title: "Payment Result" };

interface SuccessPageProps {
  // The page is now reached only with a one-time `?t=` token minted by the
  // payment callback; the real status/orderId/leadId/… live behind it.
  searchParams: Promise<{ t?: string }>;
}

export default function CheckoutSuccessPage({ searchParams }: SuccessPageProps) {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-pink-50 flex items-center justify-center p-4 dark:from-gray-950 dark:via-[#160f2e] dark:to-gray-900">
          <div className="w-full max-w-lg bg-white rounded-3xl border border-gray-100 shadow-2xl p-10 text-center dark:border-gray-700 dark:bg-gray-800 text-gray-400">
            Loading payment result…
          </div>
        </main>
      }
    >
      <CheckoutSuccessContent searchParams={searchParams} />
    </Suspense>
  );
}

async function CheckoutSuccessContent({ searchParams }: SuccessPageProps) {
  const { t } = await searchParams;

  const [confirmation, me, contact] = await Promise.all([
    confirmPayment(t),
    authApi.me().then((r) => r.data).catch(() => null),
    getPublicContactSettings(),
  ]);

  const supportPhone   = contact.general_contact_phone  || "16910";
  const whatsappUrl    = contact.general_support_whatsapp;
  if (!confirmation) {
    redirect(me?.role === "STUDENT" ? "/student/courses" : "/courses");
  }

  const { status, orderId, leadId, slug, invoice } = confirmation;

  // ── Guest lead payment success ────────────────────────────────────────────
  // No user account yet — admin will set up access after confirmation.
  if ((status === "paid" || status === "already_paid") && leadId && !orderId) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-brand-50 flex items-center justify-center p-4 dark:from-gray-950 dark:via-[#160f2e] dark:to-gray-900">
        <div className="w-full max-w-lg bg-white rounded-3xl border border-gray-100 shadow-2xl p-10 text-center dark:border-gray-700 dark:bg-gray-800 space-y-6">
          <div className="flex justify-center">
            <div className="h-24 w-24 rounded-full bg-green-50 flex items-center justify-center ring-8 ring-green-100 dark:bg-green-500/10 dark:ring-green-500/10">
              <CheckCircle2 className="h-12 w-12 text-green-500 dark:text-green-400" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2 dark:text-white">
              {status === "already_paid" ? "Already received 👋" : "Payment received! 🎉"}
            </h1>
            <p className="text-gray-500 text-sm dark:text-gray-400">
              Thanks — your payment is confirmed. Our support team will contact you within{" "}
              <span className="font-semibold text-gray-700 dark:text-gray-300">24 hours</span> to set up your
              account and unlock course access on the phone number you provided.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 rounded-2xl border border-brand-100 bg-brand-50/50 px-4 py-3 text-sm text-brand-800 dark:border-brand-500/20 dark:bg-brand-500/10 dark:text-brand-300">
            <MessageCircle className="h-4 w-4 shrink-0" />
            We&rsquo;ll reach out shortly. Keep an eye on your phone &amp; email.
          </div>

          {/* Proactive contact cards — if the guest doesn't want to wait, they
              can reach us directly to confirm the course. */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <a
              href={`tel:${supportPhone}`}
              className="group flex items-center gap-3 rounded-2xl border border-brand-200 bg-white px-4 py-3 text-left transition-colors hover:bg-brand-50 dark:border-brand-500/20 dark:bg-gray-800 dark:hover:bg-gray-700"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700 group-hover:bg-brand-200 dark:bg-brand-500/15 dark:text-brand-400 dark:group-hover:bg-brand-500/25">
                <Phone className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[11px] font-semibold uppercase tracking-wider text-brand-600">
                  Hotline
                </span>
                <span className="block truncate text-sm font-bold text-gray-900 dark:text-white">
                  {supportPhone}
                </span>
                <span className="block text-[11px] text-gray-500 dark:text-gray-400">Call us</span>
              </span>
            </a>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 rounded-2xl border border-brand-200 bg-white px-4 py-3 text-left transition-colors hover:bg-brand-50 dark:border-brand-500/20 dark:bg-gray-800 dark:hover:bg-gray-700"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700 group-hover:bg-brand-200 dark:bg-brand-500/15 dark:text-brand-400 dark:group-hover:bg-brand-500/25">
                <MessageCircle className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[11px] font-semibold uppercase tracking-wider text-brand-600">
                  WhatsApp
                </span>
                <span className="block truncate text-sm font-bold text-gray-900 dark:text-white">
                  {supportPhone}
                </span>
                <span className="block text-[11px] text-gray-500 dark:text-gray-400">Chat now</span>
              </span>
            </a>
          </div>

          <Link
            href="/courses"
            className="inline-flex rounded-md bg-gradient-to-r from-brand-from to-brand-to px-7 py-3 text-sm font-bold text-white shadow-md transition-all hover:scale-105"
          >
            Browse more courses
          </Link>
          <p className="text-xs text-gray-300 dark:text-gray-500">Ref #{leadId}</p>
        </div>
      </main>
    );
  }

  // ── Paid / already_paid ────────────────────────────────────────────────────
  if (status === "paid" || status === "already_paid") {
    // Try to fetch order details for course slugs
    let courseItems: { courseId?: number; courseTitle: string; courseSlug: string }[] = [];
    let orderFinalAmount: string | null = null;
    if (orderId) {
      const order = await ordersApi
        .get(Number(orderId))
        .then((r) => r.data)
        .catch(() => null);
      if (order?.items) {
        courseItems = order.items.map((item: { courseId: number; courseTitle: string; courseSlug: string }) => ({
          courseId: item.courseId,
          courseTitle: item.courseTitle,
          courseSlug: item.courseSlug,
        }));
      }
      orderFinalAmount = order?.finalAmount ?? null;
    }

    // Fallback: use the slug from the query param if we couldn't load the order
    if (courseItems.length === 0 && slug) {
      courseItems = [{ courseTitle: "Your course", courseSlug: slug }];
    }

    return (
      <main className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-pink-50 flex items-center justify-center p-4 dark:from-gray-950 dark:via-[#160f2e] dark:to-gray-900">
        {/* Enrollment just succeeded → refresh token so GUEST→STUDENT applies */}
        <SessionRefresher />
        {status === "paid" && orderId && orderFinalAmount !== null && (
          <PurchaseTracker
            orderId={Number(orderId)}
            value={parseFloat(orderFinalAmount)}
            items={courseItems
              .filter((i): i is { courseId: number; courseTitle: string; courseSlug: string } => i.courseId != null)
              .map((i) => ({ courseId: i.courseId, courseTitle: i.courseTitle }))}
          />
        )}
        <div className="w-full max-w-lg bg-white rounded-3xl border border-gray-100 shadow-2xl p-10 text-center dark:border-gray-700 dark:bg-gray-800 space-y-6">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="h-24 w-24 rounded-full bg-green-50 flex items-center justify-center ring-8 ring-green-100 dark:bg-green-500/10 dark:ring-green-500/10">
              <CheckCircle2 className="h-12 w-12 text-green-500 dark:text-green-400" />
            </div>
          </div>

          {/* Heading */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2 dark:text-white">
              {status === "already_paid" ? "Already enrolled! 🎓" : "Payment successful! 🎉"}
            </h1>
            <p className="text-gray-500 text-sm dark:text-gray-400">
              {status === "already_paid"
                ? "This order was already processed. You can start learning below."
                : "Your payment has been confirmed. You're now enrolled and ready to learn!"}
            </p>
          </div>

          {/* Course buttons */}
          {courseItems.length > 0 ? (
            <div className="space-y-3 pt-1">
              {courseItems.map((item) => (
                <Link
                  key={item.courseSlug}
                  href={`/learn/${item.courseSlug}`}
                  className="flex items-center gap-3 bg-gradient-to-r from-brand-600 to-pink-500 hover:opacity-90 text-white font-semibold py-3.5 px-5 rounded-2xl transition-opacity"
                >
                  <BookOpen className="h-4 w-4 shrink-0" />
                  <span className="truncate">Start learning: {item.courseTitle}</span>
                </Link>
              ))}
            </div>
          ) : (
            <Link
              href="/student/courses"
              className="flex items-center justify-center gap-3 bg-gradient-to-r from-brand-600 to-pink-500 hover:opacity-90 text-white font-semibold py-3.5 px-5 rounded-2xl transition-opacity"
            >
              <BookOpen className="h-4 w-4" />
              Go to my courses
            </Link>
          )}

          <Link
            href="/student/courses"
            className="inline-block text-sm text-gray-400 hover:text-gray-600 underline dark:text-gray-500 dark:hover:text-gray-300"
          >
            View all my courses →
          </Link>

          {orderId && (
            <p className="text-xs text-gray-300 dark:text-gray-500">Order #{orderId}</p>
          )}
        </div>
      </main>
    );
  }

  // ── Failed ─────────────────────────────────────────────────────────────────
  if (status === "failed") {
    return (
      <main className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4 dark:from-gray-950 dark:via-[#2e0f0f] dark:to-gray-900">
        <div className="w-full max-w-lg bg-white rounded-3xl border border-gray-100 shadow-2xl p-10 text-center dark:border-gray-700 dark:bg-gray-800 space-y-6">
          <div className="flex justify-center">
            <div className="h-24 w-24 rounded-full bg-red-50 flex items-center justify-center ring-8 ring-red-100 dark:bg-red-500/10 dark:ring-red-500/10">
              <XCircle className="h-12 w-12 text-red-400 dark:text-red-400" />
            </div>
          </div>

          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2 dark:text-white">Payment failed</h1>
            <p className="text-gray-500 text-sm dark:text-gray-400">
              Your payment could not be completed. No charge has been made to your account.
              {invoice && (
                <span className="block mt-1 text-gray-400 text-xs dark:text-gray-500">Reference: {invoice}</span>
              )}
            </p>
          </div>

          <div className="space-y-3 pt-1">
            {/* Guest lead checkouts only ever go through /checkout/[slug] (cart
                is login-gated), so send them back there instead of /cart —
                otherwise a guest gets bounced to the login page. */}
            <Link
              href={leadId && slug ? `/checkout/${slug}` : "/cart"}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-brand-600 to-pink-500 hover:opacity-90 text-white font-semibold py-3.5 px-5 rounded-2xl transition-opacity"
            >
              Try again
            </Link>
            <Link
              href="/"
              className="flex items-center justify-center gap-2 border border-gray-200 hover:border-gray-300 text-gray-600 font-medium py-3 px-5 rounded-2xl transition-colors text-sm dark:border-gray-700 dark:hover:border-gray-600 dark:text-gray-300"
            >
              <Home className="h-4 w-4" />
              Back to home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // ── Cancelled / unknown ────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-orange-50 flex items-center justify-center p-4 dark:from-gray-950 dark:via-[#2e2a0f] dark:to-gray-900">
      <div className="w-full max-w-lg bg-white rounded-3xl border border-gray-100 shadow-2xl p-10 text-center dark:border-gray-700 dark:bg-gray-800 space-y-6">
        <div className="flex justify-center">
          <div className="h-24 w-24 rounded-full bg-yellow-50 flex items-center justify-center ring-8 ring-yellow-100 dark:bg-yellow-500/10 dark:ring-yellow-500/10">
            <AlertCircle className="h-12 w-12 text-yellow-400" />
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2 dark:text-white">Payment cancelled</h1>
          <p className="text-gray-500 text-sm dark:text-gray-400">
            You cancelled the payment. Your cart is still saved — you can complete your purchase any time.
          </p>
        </div>

        <div className="space-y-3 pt-1">
          <Link
            href="/cart"
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-brand-600 to-pink-500 hover:opacity-90 text-white font-semibold py-3.5 px-5 rounded-2xl transition-opacity"
          >
            Return to cart
          </Link>
          <Link
            href="/"
            className="flex items-center justify-center gap-2 border border-gray-200 hover:border-gray-300 text-gray-600 font-medium py-3 px-5 rounded-2xl transition-colors text-sm dark:border-gray-700 dark:hover:border-gray-600 dark:text-gray-300"
          >
            <Home className="h-4 w-4" />
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
