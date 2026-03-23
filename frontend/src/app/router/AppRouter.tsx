/**
 * @file AppRouter.tsx - Refactored
 * 
 * Improved routing architecture with:
 * - Layout-based route organization (none/auth/app)
 * - Outlet pattern to prevent layout re-renders
 * - Clear separation of public/auth/protected routes
 * - RBAC-ready guard system
 * - Google OAuth callback handling
 * 
 * @author pg@5Studios.net
 * @since 2025-12-22
 * @version 2.1.0
 */
import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { moduleRegistry } from '@/core/di/container';
import { NavigationProvider } from '@/app/providers/NavigationProvider';
import { LayoutProvider } from '@/shared/ui/layouts/app';
import { AppLayout } from '@/shared/ui/layouts';
import AuthLayout from '@/shared/ui/layouts/app/AuthLayout';
import ProtectedRoute from './ProtectedRoute';
import ErrorBoundary from '@/app/providers/ErrorBoundary';
import type { ModuleRoute } from '@/core/router/types';
import { NAVIGATION_PATHS } from '@/core/router/paths';
import { RouteTracker } from './RouteTracker';

// Lazy load AuthCallback for OAuth
const AuthCallback = lazy(() => import('@/modules/auth/ui/pages/AuthCallback'));
const Error404Page = lazy(() => import('@/modules/pages/errors/ui/pages/Error404Page'));

// Loading fallback with skeleton
const LoadingFallback = () => (
  <div className="flex justify-center items-center h-64">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    <span className="ml-2 text-muted-foreground">Loading...</span>
  </div>
);

// Error pages
const UnauthorizedPage: React.FC = () => (
  <div className="text-center py-12">
    <h1 className="text-2xl font-bold text-red-600 mb-4">Unauthorized</h1>
    <p className="text-gray-600 dark:text-gray-400">You don't have permission to access this page.</p>
  </div>
);

const NotFoundPage: React.FC = () => (
  <Suspense fallback={<LoadingFallback />}>
    <Error404Page />
  </Suspense>
);

/**
 * Renders a single route with proper component wrapping
 */
const renderRouteElement = (route: ModuleRoute): React.ReactElement => {
  const Component = route.component;
  if (!Component) {
    return <div>No component defined for {route.path}</div>;
  }

  // Wrap lazy components in Suspense
  const isLazy = Component && typeof Component === 'function' && !Component.prototype?.render;
  
  return isLazy ? (
    <Suspense fallback={<LoadingFallback />}>
      <Component />
    </Suspense>
  ) : (
    <Component />
  );
};

/**
 * Recursively renders routes and their children
 */
const renderRoutes = (routes: ModuleRoute[]): React.ReactElement[] => {
  return routes.map((route) => {
    const element = renderRouteElement(route);
    
    // If route has children, render them nested
    if (route.children && route.children.length > 0) {
      return (
        <Route key={route.path} path={route.path} element={element}>
          {renderRoutes(route.children)}
        </Route>
      );
    }

    return (
      <Route
        key={route.path}
        path={route.path}
        element={element}
        index={route.index}
      />
    );
  });
};

/**
 * Groups routes by layout type
 */
const groupRoutesByLayout = (routes: ModuleRoute[]) => {
  const grouped = {
    none: [] as ModuleRoute[],
    auth: [] as ModuleRoute[],
    app: [] as ModuleRoute[],
  };

  routes.forEach((route) => {
    grouped[route.layout].push(route);
  });

  return grouped;
};

/**
 * Inner router component that checks for OAuth callback
 * CRITICAL: Check session_id synchronously during render to prevent race conditions
 * REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
 */
const InnerRouter: React.FC = () => {
  const location = useLocation();
  const allRoutes = moduleRegistry.getAllRoutes();
  const { 
    none: publicRoutes, 
    auth: authRoutes, 
    app: appRoutes,
  } = groupRoutesByLayout(allRoutes);

  // Check URL fragment for OAuth session_id - do this SYNCHRONOUSLY before any other routing
  if (location.pathname === '/auth/callback' || location.hash?.includes('session_id=') || location.search?.includes('session_id=')) {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <AuthCallback />
      </Suspense>
    );
  }

  return (
    <Routes>
      {/* Public routes - No layout */}
      {renderRoutes(publicRoutes)}

      {/* Auth routes - AuthLayout wrapper with error boundary */}
      <Route element={
        <ErrorBoundary name="Auth">
          <AuthLayout />
        </ErrorBoundary>
      }>
        {renderRoutes(authRoutes)}
      </Route>

      {/* Protected routes - ProtectedRoute guard + AppLayout wrapper with error boundary */}
      <Route element={
        <ErrorBoundary name="App">
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        </ErrorBoundary>
      }>
        {renderRoutes(appRoutes)}
      </Route>

      {/* Static error routes */}
      <Route path={NAVIGATION_PATHS.UNAUTHORIZED} element={<UnauthorizedPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <RouteTracker />
      <LayoutProvider>
        <NavigationProvider>
          <InnerRouter />
        </NavigationProvider>
      </LayoutProvider>
    </BrowserRouter>
  );
};

export default AppRouter;
