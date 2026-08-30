import { type NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
const FRONTEND_BASE = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3001";

/**
 * GET /c/[id]/pay?name=...&phone=...&email=...
 *
 * 1. Resolve the course by id (confirms it exists + gets its slug for back-links)
 * 2. POST to NestJS to initiate a PayStation payment
 * 3. Redirect the user to the PayStation checkout URL
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const courseId = Number(id);
  const { searchParams } = request.nextUrl;

  const name    = searchParams.get("name")    ?? "";
  const phone   = searchParams.get("phone")   ?? "";
  const email   = searchParams.get("email")   ?? "";
  const batchId = searchParams.get("batchId") ? Number(searchParams.get("batchId")) : undefined;
  const paymentMode = searchParams.get("paymentMode") ?? "one_time";

  try {
    // 1. Resolve the course by id (for back-link slug + existence check)
    const courseRes = await fetch(`${API_BASE}/live-courses/by-id/${courseId}`, { cache: "no-store" });
    const courseJson = await courseRes.json();

    if (!courseJson.success || !courseJson.data?.id) {
      return NextResponse.redirect(`${FRONTEND_BASE}/courses?error=not_found`);
    }

    const back = `${FRONTEND_BASE}/${courseJson.data.slug}`;

    if (!name || !phone || !email) {
      return NextResponse.redirect(`${back}?error=missing_fields#enroll`);
    }

    // 2. Initiate payment. Forward the logged-in student's token (if
    // any) so the backend links the enrollment to their account; guests have no
    // token → treated as an anonymous lead.
    const isSubscription = paymentMode === 'subscription';
    const successUrl = `${FRONTEND_BASE}/c/${courseId}/success`;
    const callbackUrl = isSubscription
      ? `${API_BASE}/live-subscriptions/${courseId}/subscription-callback/paystation`
      : `${API_BASE}/paystation/callback`;
    const accessToken = (await cookies()).get("access_token")?.value;

    const endpoint = isSubscription
      ? `${API_BASE}/live-subscriptions/${courseId}/initiate-subscription`
      : `${API_BASE}/live-courses/${courseId}/initiate-payment`;

    const payRes = await fetch(
      endpoint,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ name, phone, email, callbackUrl, ...(batchId ? { batchId } : {}) }),
        cache: "no-store",
      },
    );

    const payJson = await payRes.json();

    if (!payJson.success || !payJson.data?.paymentUrl) {
      const errorCode = payRes.status === 409 ? "already_enrolled" : "payment_init_failed";
      return NextResponse.redirect(`${back}?error=${errorCode}#enroll`);
    }

    // Store subscription info for the success page
    if (isSubscription && payJson.data.subscriptionId) {
      const cookieStore = await cookies();
      cookieStore.set(`sub_pending_${courseId}`, String(payJson.data.subscriptionId), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 600, // 10 minutes
      });
    }

    // 3. Redirect to gateway
    return NextResponse.redirect(payJson.data.paymentUrl);
  } catch (err) {
    console.error("[c/pay] error:", err);
    return NextResponse.redirect(`${FRONTEND_BASE}/courses?error=server_error`);
  }
}
