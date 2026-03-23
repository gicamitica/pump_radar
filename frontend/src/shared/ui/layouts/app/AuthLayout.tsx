import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useService } from '@/app/providers/useDI';
import { AUTH_SYMBOLS } from '@/modules/auth/di/symbols';
import type { IAuthService } from '@/modules/auth/application/ports/IAuthService';

/**
 * AuthLayout - Shared layout for all authentication pages
 * Provides consistent structure for login, register, forgot password, etc.
 */
const AuthLayout: React.FC = () => {
  const auth = useService<IAuthService>(AUTH_SYMBOLS.IAuthService);
  const currentUser = auth.getCurrentUser();

  if (auth.isAuthenticated() && currentUser) {
    const targetPath = currentUser.subscription === 'free' ? '/subscription' : '/dashboard';
    return <Navigate to={targetPath} replace />;
  }

  return (
    <div className="min-h-dvh flex items-center justify-center bg-gray-50 dark:bg-neutral-950">
      <div className="w-full">
        <Outlet />
      </div>
    </div>
  );
};

export default AuthLayout;
