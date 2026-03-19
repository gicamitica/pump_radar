import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useService } from '@/app/providers/useDI';
import type { IConfig } from '@/shared/infrastructure/config/Config';
import type { IAuthService, Role } from '@/modules/auth/application/ports/IAuthService';
import { AUTH_SYMBOLS } from '@/modules/auth/di/symbols';
import { CORE_SYMBOLS } from '@/core/di/symbols';
import { NAVIGATION_PATHS } from '@/core/router/paths';

interface Props { 
  roles?: Role[]; 
  permissions?: string[];
  children?: React.ReactNode;
}

/**
 * ProtectedRoute - Guards routes that require authentication
 * 
 * Can be used in two ways:
 * 1. As a wrapper with children: <ProtectedRoute><AppLayout /></ProtectedRoute>
 * 2. As a route element: <Route element={<ProtectedRoute />} />
 * 
 * Supports RBAC via roles and permissions props
 */
const ProtectedRoute: React.FC<Props> = ({ roles, children }) => {
  const auth = useService<IAuthService>(AUTH_SYMBOLS.IAuthService);
  const config = useService<IConfig>(CORE_SYMBOLS.IConfig);
  const location = useLocation();

  // Check authentication
  if (!auth.isAuthenticated()) {
    // Store the intended destination to redirect back after login
    return <Navigate to={config.auth.loginPath} state={{ from: location.pathname }} replace />;
  }

  // Check role-based access
  if (roles && !auth.hasAnyRole(roles)) {
    return <Navigate to={NAVIGATION_PATHS.UNAUTHORIZED} replace />;
  }

  // TODO: Check permissions when RBAC is fully implemented
  // if (permissions && !auth.hasAnyPermission(permissions)) {
  //   return <Navigate to={'/unauthorized'} replace />;
  // }

  // Render children if provided, otherwise render Outlet for nested routes
  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;
