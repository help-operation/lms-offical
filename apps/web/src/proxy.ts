import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

// ── Maintenance status (best-effort, 30 s in-process cache) ──────────────────
// Keeps the proxy fast on busy servers; acceptable staleness for a flag that
// changes infrequently. Failures default to "not in maintenance" so a dead API
// never bricks the site.
let cache: { enabled: boolean; at: number } | null = null;
const TTL = 30_000; // 30 seconds

async function getMaintenanceStatus(): Promise<{ enabled: boolean }> {
  const now = Date.now();
  if (cache && now - cache.at < TTL) return cache;

  try {
    const res = await fetch(
      `${API_BASE_URL}/system-settings/public?keys=maintenance_enabled`,
      { cache: "no-store" },
    );
    if (!res.ok) return { enabled: false };
    const json = await res.json();
    const data: Record<string, string> = json.data ?? {};
    cache = { enabled: data.maintenance_enabled === "true", at: now };
    return cache;
  } catch {
    // API unreachable — don't block traffic
    return { enabled: false };
  }
}

// ── JWT helpers ──────────────────────────────────────────────────────────────
function decodeJwtPayload(token: string): { exp?: number; userType?: string } | null {
  try {
    const parts = token.split(".");
    const payloadPart = parts[1];
    if (parts.length !== 3 || !payloadPart) return null;
    const base64 = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64)) as { exp?: number; userType?: string };
  } catch {
    return null;
  }
}

function isExpiredOrNearExpiry(token: string): boolean {
  try {
    const parts = token.split(".");
    const payloadPart = parts[1];
    if (parts.length !== 3 || !payloadPart) return true;
    const base64 = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(base64)) as { exp?: number };
    if (typeof payload.exp !== "number") return true;
    return Date.now() / 1000 >= payload.exp - 10;
  } catch {
    return true;
  }
}

function parseSetCookieHeader(setCookieHeader: string) {
  return setCookieHeader
    .split(/,(?=\s*[^;,\s]+=)/g)
    .map((cookie) => cookie.trim())
    .filter(Boolean);
}

function parseCookieNameValue(cookieStr: string): { name: string; value: string } | null {
  const [nameValue] = cookieStr.split(";");
  if (!nameValue) return null;
  const eqIdx = nameValue.indexOf("=");
  if (eqIdx === -1) return null;
  return {
    name: nameValue.slice(0, eqIdx).trim(),
    value: nameValue.slice(eqIdx + 1).trim(),
  };
}

// ── Access-token refresh ─────────────────────────────────────────────────────
// Refreshes the student/guest access token via the 7-day refresh token when the
// access token is missing or about to expire, so users aren't logged out after
// the short access-token lifetime.
async function handleTokenRefresh(req: NextRequest): Promise<NextResponse> {
  const accessToken = req.cookies.get("access_token")?.value;
  const refreshToken = req.cookies.get("refresh_token")?.value;

  // Security: an admin token has no business on the web app — clear it.
  if (accessToken) {
    const payload = decodeJwtPayload(accessToken);
    if (payload?.userType === "admin") {
      const res = NextResponse.next();
      res.cookies.delete("access_token");
      res.cookies.delete("refresh_token");
      return res;
    }
  }

  const shouldRefresh =
    Boolean(refreshToken) && (!accessToken || isExpiredOrNearExpiry(accessToken));

  if (!shouldRefresh) return NextResponse.next();

  const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: { Cookie: `refresh_token=${refreshToken}` },
  }).catch(() => null);

  if (!refreshRes || !refreshRes.ok) {
    const res = NextResponse.next();
    res.cookies.delete("access_token");
    res.cookies.delete("refresh_token");
    return res;
  }

  const setCookie = refreshRes.headers.get("set-cookie");
  if (!setCookie) return NextResponse.next();

  const cookieHeaders = parseSetCookieHeader(setCookie);
  const requestHeaders = new Headers(req.headers);
  const mergedCookies = new Map<string, string>();

  const existingCookieHeader = req.headers.get("cookie") || "";
  for (const part of existingCookieHeader.split(";")) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    mergedCookies.set(trimmed.slice(0, eqIdx), trimmed.slice(eqIdx + 1));
  }

  for (const cookieStr of cookieHeaders) {
    const parsed = parseCookieNameValue(cookieStr);
    if (!parsed) continue;
    mergedCookies.set(parsed.name, parsed.value);
  }

  const mergedCookieHeader = Array.from(mergedCookies.entries())
    .map(([name, value]) => `${name}=${value}`)
    .join("; ");
  requestHeaders.set("cookie", mergedCookieHeader);

  const res = NextResponse.next({ request: { headers: requestHeaders } });
  for (const cookieStr of cookieHeaders) {
    res.headers.append("set-cookie", cookieStr);
  }

  return res;
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Always let Next internals, API routes, and static files through untouched.
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".") // static files (favicon, images, etc.)
  ) {
    return NextResponse.next();
  }

  // Maintenance mode takes priority — redirect everything except /maintenance.
  if (!pathname.startsWith("/maintenance")) {
    const { enabled } = await getMaintenanceStatus();
    if (enabled) {
      const url = req.nextUrl.clone();
      url.pathname = "/maintenance";
      return NextResponse.redirect(url);
    }
  }

  // Otherwise keep the session alive by refreshing the access token as needed.
  return handleTokenRefresh(req);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
