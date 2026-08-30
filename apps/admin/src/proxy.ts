import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

// Without a timeout, a stalled refresh call blocks the underlying navigation
// outright (this runs before the page is served). 8s keeps that bounded.
const REFRESH_TIMEOUT_MS = 8_000;

// Keyed by refresh-token value (not a single shared promise, unlike the
// browser client) because this runs server-side and handles concurrent
// requests from many different admin sessions at once — a single shared
// promise would leak one user's refreshed cookies onto another user's
// request. Same-token concurrent requests (e.g. a burst of navigations from
// one tab) still share a single in-flight refresh.
const inFlightRefreshes = new Map<string, Promise<Response | null>>();

function refreshAccessToken(refreshToken: string): Promise<Response | null> {
  const existing = inFlightRefreshes.get(refreshToken);
  if (existing) return existing;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REFRESH_TIMEOUT_MS);

  const promise = fetch(`${API_BASE_URL}/auth/admin/refresh`, {
    method: "POST",
    headers: { Cookie: `admin_refresh_token=${refreshToken}` },
    signal: controller.signal,
  })
    .catch(() => null)
    .finally(() => {
      clearTimeout(timeout);
      inFlightRefreshes.delete(refreshToken);
    });

  inFlightRefreshes.set(refreshToken, promise);
  return promise;
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

export async function proxy(req: NextRequest) {
  const accessToken  = req.cookies.get("admin_access_token")?.value;
  const refreshToken = req.cookies.get("admin_refresh_token")?.value;

  const shouldRefresh =
    Boolean(refreshToken) && (!accessToken || isExpiredOrNearExpiry(accessToken));

  if (!shouldRefresh) return NextResponse.next();

  const refreshRes = await refreshAccessToken(refreshToken!);

  if (!refreshRes || !refreshRes.ok) {
    const res = NextResponse.next();
    res.cookies.delete("admin_access_token");
    res.cookies.delete("admin_refresh_token");
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

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
