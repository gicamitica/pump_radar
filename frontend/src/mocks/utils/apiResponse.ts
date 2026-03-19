import { HttpResponse } from 'msw';
import type { ApiError, ApiResponse } from '@/shared/infrastructure/models/api';

/**
 * Helper to create a successful API response with the standard envelope
 * 
 * @param data - The response data payload
 * @param status - HTTP status code (default: 200)
 * @returns MSW HttpResponse with envelope structure
 */
export function ok<T>(data: T, status = 200) {
  const body: ApiResponse<T> = {
    success: true,
    data,
  };

  return HttpResponse.json(body, { status });
}

/**
 * Helper to create a failed API response with the standard envelope
 * 
 * @param code - Error code in SCREAMING_SNAKE_CASE (e.g., 'AUTH_INVALID_CREDENTIALS')
 * @param message - Human-readable error message
 * @param status - HTTP status code (default: 400)
 * @returns MSW HttpResponse with envelope structure
 */
export function fail(
  code: string,
  message: string,
  status = 400
) {
  const error: ApiError = { code, message };

  const body: ApiResponse<never> = {
    success: false,
    error,
  };

  return HttpResponse.json(body, { status });
}
