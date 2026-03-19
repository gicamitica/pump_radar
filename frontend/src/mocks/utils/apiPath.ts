/**
 * Centralized API path configuration for MSW handlers.
 * 
 * This module provides a consistent way to define API paths across all MSW handlers.
 * The prefix is configured once here, making it easy to change globally.
 * 
 * Usage in handlers:
 *   import { api } from '@/mocks/utils/apiPath';
 *   http.get(api('/users'), ...)  // Results in '/api/users'
 */

/**
 * The API prefix used for all endpoints.
 * Change this value to update all MSW handler paths at once.
 */
export const API_PREFIX = '/api';

/**
 * Creates a full API path by prepending the API prefix.
 * 
 * @param path - The endpoint path (e.g., '/users', '/auth/login')
 * @returns The full API path with prefix (e.g., '/api/users', '/api/auth/login')
 * 
 * @example
 * api('/users')           // '/api/users'
 * api('/auth/login')      // '/api/auth/login'
 * api('/settings/profile') // '/api/settings/profile'
 */
export function api(path: string): string {
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_PREFIX}${normalizedPath}`;
}

/**
 * Creates a full API path with a dynamic parameter placeholder.
 * This is useful for routes with path parameters.
 * 
 * @param path - The endpoint path with :param placeholders
 * @returns The full API path with prefix
 * 
 * @example
 * api('/users/:id')              // '/api/users/:id'
 * api('/teams/:teamId/members')  // '/api/teams/:teamId/members'
 */
export { api as apiPath };
