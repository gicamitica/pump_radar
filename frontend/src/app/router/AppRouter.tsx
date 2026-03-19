/**
 * @file AppRouter.tsx - Refactored
 * 
 * Improved routing architecture with:
 * - Layout-based route organization (none/auth/app)
 * - Outlet pattern to prevent layout re-renders
 * - Clear separation of public/auth/protected routes
 * - RBAC-ready guard system
 * 
 * @author pg@5Studios.net
 * @since 2025-12-22
 * @version 2.0.0
 */
import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { moduleRegistry } from '@/core/di/container';
import { NavigationProvider } from '@/app/providers/NavigationProvider';
import { LayoutProvider } from '@/shared/ui/layouts/app';
import { AppLayout } from '@/shared/ui/layouts';
import AuthLayout from '@/shared/ui/layouts/app/AuthLayout';
import ProtectedRoute from './ProtectedRoute';
import ErrorBoundary from '@/app/providers/ErrorBoundary';
import type { ModuleRoute } from '@/core/router/types';
import { NAVIGATION_PATHS } from '@/core/router/paths';
import Error404Page from '@/modules/pages/errors/ui/pages/Error404Page';
import { RouteTracker } from './RouteTracker';

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

const NotFoundPage: React.FC = () => <Error404Page />;

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

const AppRouter: React.FC = () => {
  const allRoutes = moduleRegistry.getAllRoutes();
  const { 
    none: publicRoutes, 
    auth: authRoutes, 
    app: appRoutes,
  } = groupRoutesByLayout(allRoutes);

  return (
    <BrowserRouter>
      <RouteTracker />
      <LayoutProvider>
        <NavigationProvider>
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
        </NavigationProvider>
      </LayoutProvider>
    </BrowserRouter>
  );
};

export default AppRouter;
