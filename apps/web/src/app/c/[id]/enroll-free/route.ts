import { type NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_BASE      = process.env.NEXT_PUBLIC_API_URL  || "http://localhost:3000";
const FRONTEND_BASE = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3001";

/**
 * GET /c/[id]/enroll-free?name=...&phone=...&email=...&batchId=...
 *
 * Server-side handler for free live course enrollment. Calls the API with
 * the student's auth token (if any) then redirects to a success page.
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

  try {
    // Resolve slug for redirect back-links
    const courseRes  = await fetch(`${API_BASE}/live-courses/by-id/${courseId}`, { cache: "no-store" });
    const courseJson = await courseRes.json();

    if (!courseJson.success || !courseJson.data?.id) {
      return NextResponse.redirect(`${FRONTEND_BASE}/courses?error=not_found`);
    }

    const courseSlug = courseJson.data.slug as string;
    const back       = `${FRONTEND_BASE}/${courseSlug}`;

    if (!name || !email) {
      return NextResponse.redirect(`${back}?error=missing_fields#enroll`);
    }

    const accessToken = (await cookies()).get("access_token")?.value;

    const enrollRes = await fetch(
      `${API_BASE}/live-courses/${courseId}/enroll-free`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ name, phone, email, ...(batchId ? { batchId } : {}) }),
        cache: "no-store",
      },
    );

    const enrollJson = await enrollRes.json();

    if (!enrollJson.success) {
      const errorCode = enrollRes.status === 409 ? "already_enrolled" : "enroll_failed";
      return NextResponse.redirect(`${back}?error=${errorCode}#enroll`);
    }

    return NextResponse.redirect(`${FRONTEND_BASE}/${courseSlug}?enrolled=1#enroll`);
  } catch (err) {
    console.error("[c/enroll-free] error:", err);
    return NextResponse.redirect(`${FRONTEND_BASE}/courses?error=server_error`);
  }
}
