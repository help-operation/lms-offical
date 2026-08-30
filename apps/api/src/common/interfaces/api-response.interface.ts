export interface ApiResponse<T = unknown> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T | null;
  errors: unknown | null;
  timestamp: string;
  path: string;
}
