/**
 * Minimal API response envelope structure
 * 
 * All API responses follow this standardized format:
 * - success: boolean indicating if the request succeeded
 * - data: the actual response payload (only present on success)
 * - error: error details (only present on failure)
 */

export type ApiError = {
  code: string;
  message: string;
};

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: ApiError;
};
