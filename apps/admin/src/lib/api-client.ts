import { cookies } from "next/headers";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

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

function buildCookieHeader(
  cookieStore: Awaited<ReturnType<typeof cookies>>,
): string {
  const parts: string[] = [];
  const access  = cookieStore.get("admin_access_token")?.value;
  const refresh = cookieStore.get("admin_refresh_token")?.value;
  if (access)  parts.push(`admin_access_token=${access}`);
  if (refresh) parts.push(`admin_refresh_token=${refresh}`);
  return parts.join("; ");
}

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
      case "httponly":   options.httpOnly = true; break;
      case "secure":     options.secure = true; break;
      case "samesite":   options.sameSite = val?.toLowerCase() ?? "lax"; break;
      case "path":       options.path = val ?? "/"; break;
      case "max-age":    if (val) options.maxAge = parseInt(val, 10); break;
      case "domain":     if (val) options.domain = val; break;
    }
  }

  return { name, value, options };
}

async function forwardSetCookies(
  response: Response,
  cookieStore: Awaited<ReturnType<typeof cookies>>,
) {
  const setCookies: string[] =
    typeof (response.headers as any).getSetCookie === "function"
      ? (response.headers as any).getSetCookie()
      : response.headers.get("set-cookie")
        ? [response.headers.get("set-cookie")!]
        : [];

  for (const str of setCookies) {
    const parsed = parseSetCookieHeader(str);
    if (parsed) cookieStore.set(parsed.name, parsed.value, parsed.options as any);
  }
}

// Without this, a stalled backend call hangs the fetch forever — and since
// every dashboard page's layout awaits apiRequest() before rendering anything,
// one stuck request cascades into every page looking permanently "loading".
const REQUEST_TIMEOUT_MS = 15_000;

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  timeoutMs: number = REQUEST_TIMEOUT_MS,
): Promise<ApiResult<T>> {
  const cookieStore = await cookies();
  const cookieHeader = buildCookieHeader(cookieStore);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      cache: "no-store",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
        ...options.headers,
      },
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new ApiError(504, "The server took too long to respond. Please try again.");
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }

  await forwardSetCookies(res, cookieStore);

  const json: ApiResponse<T> = await res.json();

  if (!json.success) {
    throw new ApiError(json.statusCode, json.message, json.errors as FieldError[] | null);
  }

  return { data: json.data as T, message: json.message };
}
