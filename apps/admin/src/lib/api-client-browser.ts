// Browser-safe API client for Client Components ("use client") in the admin app.
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

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

interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T | null;
  errors: unknown | null;
}

// Without this, a stalled backend call hangs the fetch forever and the
// caller's loading state never resolves — mirrors api-client.ts's timeout.
const REQUEST_TIMEOUT_MS = 15_000;

// Access tokens are short-lived (15m). A single in-flight refresh is shared
// across concurrent 401s so a burst of requests doesn't hit /admin/refresh
// once per request.
let refreshPromise: Promise<boolean> | null = null;

async function refreshAdminToken(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = fetch(`${BASE_URL}/auth/admin/refresh`, {
      method: "POST",
      credentials: "include",
    })
      .then((res) => res.ok)
      .catch(() => false)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

export async function apiRequestBrowser<T>(
  endpoint: string,
  options: RequestInit = {},
  _isRetry = false,
): Promise<ApiResult<T>> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      credentials: "include",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
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

  const json: ApiResponse<T> = await res.json();

  if (!json.success) {
    // Expired access token: refresh once via the admin refresh cookie and
    // retry the original request before surfacing an error to the caller.
    if (res.status === 401 && !_isRetry) {
      const refreshed = await refreshAdminToken();
      if (refreshed) {
        return apiRequestBrowser<T>(endpoint, options, true);
      }
    }

    throw new ApiError(
      json.statusCode,
      json.message,
      json.errors as FieldError[] | null,
    );
  }

  return { data: json.data as T, message: json.message };
}
