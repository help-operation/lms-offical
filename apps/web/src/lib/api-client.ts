import { cookies } from "next/headers";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

// Bounds every request so a slow/unreachable API fails fast instead of
// hanging — critical for calls made from a `'use cache'` function, where an
// indefinite hang gets killed by Next's own (longer, less clear) cache-fill
// timeout and takes the whole build down with it.
const API_REQUEST_TIMEOUT_MS = 8_000;

interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T | null;
  errors: unknown | null;
  timestamp: string;
  path: string;
}

export interface FieldError {
  field: string;
  message: string;
}

export interface ApiResult<T> {
  data: T;
  message: string;
}

export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly errors: FieldError[] | null = null,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// Build Cookie header string from the Next.js cookie store (auth cookies only)
function buildCookieHeader(
  cookieStore: Awaited<ReturnType<typeof cookies>>,
): string {
  const parts: string[] = [];
  const access = cookieStore.get("access_token")?.value;
  const refresh = cookieStore.get("refresh_token")?.value;
  if (access) parts.push(`access_token=${access}`);
  if (refresh) parts.push(`refresh_token=${refresh}`);
  return parts.join("; ");
}

// Parse a single Set-Cookie string into name, value, and options
function parseSetCookieHeader(str: string) {
  const [nameValue, ...attrs] = str.split(";").map((s) => s.trim());
  if (!nameValue) return null;

  const eqIdx = nameValue.indexOf("=");
  if (eqIdx === -1) return null;

  const name = nameValue.slice(0, eqIdx).trim();
  const value = decodeURIComponent(nameValue.slice(eqIdx + 1).trim());
  const options: Record<string, string | boolean | number> = {};

  for (const attr of attrs) {
    const [key, val] = attr.split("=").map((s) => s.trim());
    if (!key) continue;

    switch (key.toLowerCase()) {
      case "httponly":
        options.httpOnly = true;
        break;
      case "secure":
        options.secure = true;
        break;
      case "samesite":
        options.sameSite = val?.toLowerCase() ?? "lax";
        break;
      case "path":
        options.path = val ?? "/";
        break;
      case "max-age":
        if (val) options.maxAge = parseInt(val, 10);
        break;
    }
  }

  return { name, value, options };
}

// Forward Set-Cookie headers from an API response back to the browser
async function forwardSetCookies(
  response: Response,
  cookieStore: Awaited<ReturnType<typeof cookies>>,
) {
  // getSetCookie() returns one entry per Set-Cookie header (Node 18.14+)
  const setCookies: string[] =
    typeof (response.headers as any).getSetCookie === "function"
      ? (response.headers as any).getSetCookie()
      : (response.headers.get("set-cookie") ? [response.headers.get("set-cookie")!] : []);

  for (const str of setCookies) {
    const parsed = parseSetCookieHeader(str);
    if (parsed) {
      cookieStore.set(parsed.name, parsed.value, parsed.options as any);
    }
  }
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<ApiResult<T>> {
  const cookieStore = await cookies();

  const cookieHeader = buildCookieHeader(cookieStore);

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    cache: "no-store",
    signal: options.signal ?? AbortSignal.timeout(API_REQUEST_TIMEOUT_MS),
    headers: {
      "Content-Type": "application/json",
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      ...options.headers,
    },
  });

  // Forward any Set-Cookie the backend sends (e.g. after login/refresh)
  await forwardSetCookies(res, cookieStore);

  const json: ApiResponse<T> = await res.json();

  if (!json.success) {
    throw new ApiError(
      json.statusCode,
      json.message,
      json.errors as FieldError[] | null,
    );
  }

  return { data: json.data as T, message: json.message };
}

/**
 * Cookie-free GET for public, non-user-specific content.
 *
 * Unlike `apiRequest`, this never touches the Next.js cookie store, so it is
 * safe to call inside a `'use cache'` unit (reading cookies/headers inside a
 * cached function is forbidden — the entry is shared across users). Use this
 * for cacheable public data (courses, blog, CMS pages).
 */
export async function publicApiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<ApiResult<T>> {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    signal: options.signal ?? AbortSignal.timeout(API_REQUEST_TIMEOUT_MS),
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const json: ApiResponse<T> = await res.json();

  if (!json.success) {
    throw new ApiError(
      json.statusCode,
      json.message,
      json.errors as FieldError[] | null,
    );
  }

  return { data: json.data as T, message: json.message };
}
