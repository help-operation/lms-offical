// Browser-safe API client for use in Client Components ("use client").
// Sends credentials (cookies) automatically via the browser — no next/headers.

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
    public readonly code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  code?: string;
  data: T | null;
  errors: unknown | null;
}

export async function apiRequestBrowser<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<ApiResult<T>> {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    credentials: "include",
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
      json.code,
    );
  }

  return { data: json.data as T, message: json.message };
}
