import React from 'react';
import { Outlet } from 'react-router-dom';

/**
 * AuthLayout - Shared layout for all authentication pages
 * Provides consistent structure for login, register, forgot password, etc.
 */
const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-gray-50 dark:bg-neutral-950">
      <div className="w-full">
        <Outlet />
      </div>
    </div>
  );
};

export default AuthLayout;
