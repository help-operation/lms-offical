import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

/**
 * Cross-app cache invalidation. The API calls this after publishing or editing
 * content so the public site's `"use cache"` tags (e.g. `blog`, `blog:<slug>`)
 * refresh on the next request instead of waiting for their TTL.
 *
 * Uses `revalidateTag` (not `updateTag`): `updateTag` is only valid inside a Server
 * Action — calling it from a Route Handler throws. `revalidateTag` marks the tagged
 * cache entries stale so the next visitor triggers a fresh fetch.
 *
 * Protected by a shared secret (`REVALIDATE_SECRET`); when unset the endpoint
 * is disabled so it can't be triggered anonymously.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret || req.headers.get("x-revalidate-secret") !== secret) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 },
    );
  }

  let tags: string[] = [];
  try {
    const body = (await req.json()) as { tags?: unknown };
    if (Array.isArray(body.tags)) {
      tags = body.tags.filter((t): t is string => typeof t === "string");
    }
  } catch {
    // No / invalid JSON body — nothing to revalidate.
  }

  for (const tag of tags) revalidateTag(tag, "max");

  return NextResponse.json({ success: true, revalidated: tags });
}
