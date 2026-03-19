import type { ModuleRoute } from '@/core/router/types';
import { AUTH_PATHS } from './paths';
import { lazy } from 'react';

// Variation Minimal
const LoginMinimal = lazy(() => import('@/modules/auth/ui/pages/minimal/LoginMinimal'));
const RegisterMinimal = lazy(() => import('@/modules/auth/ui/pages/minimal/RegisterMinimal'));
const ForgotMinimal = lazy(() => import('@/modules/auth/ui/pages/minimal/ForgotMinimal'));
const ResetMinimal = lazy(() => import('@/modules/auth/ui/pages/minimal/ResetMinimal'));
const VerifyMinimal = lazy(() => import('@/modules/auth/ui/pages/minimal/VerifyMinimal'));
const MfaSetupMinimal = lazy(() => import('@/modules/auth/ui/pages/minimal/MfaSetupMinimal'));
const MfaVerifyMinimal = lazy(() => import('@/modules/auth/ui/pages/minimal/MfaVerifyMinimal'));

// Variation Split-Screen Hero
const LoginHero = lazy(() => import('@/modules/auth/ui/pages/hero/LoginHero'));
const RegisterHero = lazy(() => import('@/modules/auth/ui/pages/hero/RegisterHero'));
const ForgotHero = lazy(() => import('@/modules/auth/ui/pages/hero/ForgotHero'));
const ResetHero = lazy(() => import('@/modules/auth/ui/pages/hero/ResetHero'));
const VerifyHero = lazy(() => import('@/modules/auth/ui/pages/hero/VerifyHero'));
const MfaSetupHero = lazy(() => import('@/modules/auth/ui/pages/hero/MfaSetupHero'));
const MfaVerifyHero = lazy(() => import('@/modules/auth/ui/pages/hero/MfaVerifyHero'));

// Custom pages
const VerifyEmailPage = lazy(() => import('@/modules/auth/ui/pages/VerifyEmailPage'));

export const AUTH_ROUTES: ModuleRoute[] = [
  // Minimal
  { path: AUTH_PATHS.LOGIN, module: 'auth', layout: 'auth', title: 'Login', component: LoginMinimal },
  { path: AUTH_PATHS.REGISTER, module: 'auth', layout: 'auth', title: 'Register', component: RegisterMinimal },
  { path: AUTH_PATHS.FORGOT_PASSWORD, module: 'auth', layout: 'auth', title: 'Forgot Password', component: ForgotMinimal },
  { path: AUTH_PATHS.RESET_PASSWORD, module: 'auth', layout: 'auth', title: 'Reset Password', component: ResetMinimal },
  { path: AUTH_PATHS.VERIFY_EMAIL, module: 'auth', layout: 'auth', title: 'Verify Email', component: VerifyEmailPage },
  { path: AUTH_PATHS.MFA_SETUP, module: 'auth', layout: 'auth', title: 'MFA Setup', component: MfaSetupMinimal },
  { path: AUTH_PATHS.MFA_VERIFY, module: 'auth', layout: 'auth', title: 'MFA Verify', component: MfaVerifyMinimal },
  
  // Hero
  { path: AUTH_PATHS.LOGIN_HERO, module: 'auth', layout: 'auth', title: 'Login', component: LoginHero },
  { path: AUTH_PATHS.REGISTER_HERO, module: 'auth', layout: 'auth', title: 'Register', component: RegisterHero },
  { path: AUTH_PATHS.FORGOT_PASSWORD_HERO, module: 'auth', layout: 'auth', title: 'Forgot Password', component: ForgotHero },
  { path: AUTH_PATHS.RESET_PASSWORD_HERO, module: 'auth', layout: 'auth', title: 'Reset Password', component: ResetHero },
  { path: AUTH_PATHS.VERIFY_EMAIL_HERO, module: 'auth', layout: 'auth', title: 'Verify Email', component: VerifyHero },
  { path: AUTH_PATHS.MFA_SETUP_HERO, module: 'auth', layout: 'auth', title: 'MFA Setup', component: MfaSetupHero },
  { path: AUTH_PATHS.MFA_VERIFY_HERO, module: 'auth', layout: 'auth', title: 'MFA Verify', component: MfaVerifyHero },
];

export const getAuthRoutes = (): ModuleRoute[] => AUTH_ROUTES;

export { AUTH_PATHS } from './paths';
