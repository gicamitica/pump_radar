// Global Route Registry - Centralized route path constants
import { AUTH_PATHS } from '@/modules/auth/ui/routes/paths';

// Core application paths (login is handled by auth module at root)
export const CORE_PATHS = {
  HOME: '/',
  NOT_FOUND: '/not-found',
  UNAUTHORIZED: '/unauthorized',
  ERROR: '/error',
} as const;

// Re-export all module paths for centralized access
export const NAVIGATION_PATHS = {
  // Core routes
  ...CORE_PATHS,
  
  // Auth module routes
  AUTH: AUTH_PATHS,
} as const;

// Type definitions for route paths
export type CorePaths = typeof CORE_PATHS;
export type AllRoutes = typeof NAVIGATION_PATHS;

// Helper functions for route navigation
export const getLoginPath = () => NAVIGATION_PATHS.AUTH.LOGIN;
export const getHomePath = () => NAVIGATION_PATHS.HOME; // NAVIGATION_PATHS.AUTH.LOGIN; // Home is now login page

// Route validation helpers
export const isAuthRoute = (path: string): boolean => {
  return Object.values(NAVIGATION_PATHS.AUTH).some(authPath => authPath === path);
};

export const isProtectedRoute = (path: string): boolean => {
  return !isAuthRoute(path);
};
