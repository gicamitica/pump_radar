import type { LayoutBehavior } from "@/shared/ui/layouts/behaviors";

/**
 * Layout Family - Top-level layout structure
 */
export type LayoutFamily = 'vertical' | 'horizontal';

/**
 * Layout Variant - Specific implementation within a family
 */
export type LayoutVariant = 'boxed' | 'double-sidebar' | 'edge' | 'centered';

/**
 * Route layout types:
 * - 'none': No layout wrapper (e.g., landing pages)
 * - 'auth': AuthLayout wrapper (e.g., login, register)
 * - 'app': AppLayout wrapper with auth guard (e.g., dashboard, settings)
 */
export type RouteLayout = 'none' | 'auth' | 'app';

export type ModuleRoute = {
  path: string;
  index?: boolean;
  module: string;
  
  // Layout & Security
  layout: RouteLayout;  // Determines which layout wrapper to use
  layoutBehavior?: LayoutBehavior;  // Scrolling behavior (default: 'default')
  requiresAuth?: boolean;  // Defaults to true for 'app' layout, false for others
  permissions?: string[];  // Fine-grained permissions for RBAC
  roles?: string[];  // Role-based access control
  
  // Metadata
  titleKey?: string; // i18n key preferred when provided; fallback to title
  title?: string;
  description?: string;
  
  // Component
  component?: React.ComponentType<Record<string, unknown>>; // Support for dynamic component loading
  lazy?: boolean; // Support for lazy loading
  
  // Nested routes
  children?: ModuleRoute[]; // Support for nested routes with Outlet
};

export interface ModuleRouteConfig {
  module: string;
  routes: ModuleRoute[];
  basePath?: string;
}
