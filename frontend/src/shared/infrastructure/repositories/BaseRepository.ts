/**
 * BaseRepository - Abstract base class for all HTTP repositories
 * 
 * Provides common functionality:
 * - HTTP method helpers (get, post, put, patch, delete)
 * - Response unwrapping with error handling
 * - Query string building utilities
 * 
 * All repositories should extend this class to ensure consistent
 * API response handling and reduce code duplication.
 */

import { injectable, inject } from 'inversify';
import { CORE_SYMBOLS } from '@/core/di/symbols';
import type { IHttpClient } from '@/shared/infrastructure/http/HttpClient';
import type { ApiResponse } from '@/shared/infrastructure/models/api';

@injectable()
export abstract class BaseRepository {
  constructor(
    @inject(CORE_SYMBOLS.IHttpClient) protected readonly http: IHttpClient
  ) {}

  /**
   * Unwrap an API response, throwing an error if unsuccessful
   * @param promise - The promise returning an ApiResponse
   * @param errorMessage - Default error message if none provided by API
   * @returns The unwrapped data of type T
   */
  protected async unwrap<T>(
    promise: Promise<ApiResponse<T>>,
    errorMessage: string
  ): Promise<T> {
    const response = await promise;
    if (!response.success || response.data === undefined) {
      throw new Error(response.error?.message || errorMessage);
    }
    return response.data;
  }

  /**
   * Perform a GET request and unwrap the response
   */
  protected async get<T>(url: string, errorMessage: string): Promise<T> {
    return this.unwrap(this.http.get<T>(url), errorMessage);
  }

  /**
   * Perform a POST request and unwrap the response
   */
  protected async post<T, D = unknown>(
    url: string,
    data?: D,
    errorMessage: string = 'Request failed'
  ): Promise<T> {
    return this.unwrap(this.http.post<T, D>(url, data), errorMessage);
  }

  /**
   * Perform a PUT request and unwrap the response
   */
  protected async put<T, D = unknown>(
    url: string,
    data?: D,
    errorMessage: string = 'Request failed'
  ): Promise<T> {
    return this.unwrap(this.http.put<T, D>(url, data), errorMessage);
  }

  /**
   * Perform a PATCH request and unwrap the response
   */
  protected async patch<T, D = unknown>(
    url: string,
    data?: D,
    errorMessage: string = 'Request failed'
  ): Promise<T> {
    return this.unwrap(this.http.patch<T, D>(url, data), errorMessage);
  }

  /**
   * Perform a DELETE request and unwrap the response
   */
  protected async delete<T = void>(
    url: string,
    errorMessage: string = 'Request failed'
  ): Promise<T> {
    return this.unwrap(this.http.delete<T>(url), errorMessage);
  }

  /**
   * Build a query string from a params object
   * Filters out undefined/null values
   */
  protected buildQueryString(params: Record<string, string | number | boolean | undefined | null>): string {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.set(key, String(value));
      }
    }
    return searchParams.toString();
  }

  /**
   * Append query string to URL if not empty
   */
  protected appendQuery(baseUrl: string, queryString: string): string {
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
  }
}
