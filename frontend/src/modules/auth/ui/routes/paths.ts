// Auth Module Route Path Constants
export const AUTH_PATHS_MINIMAL = {
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',
  VERIFY_EMAIL: '/auth/verify-email',
  MFA_SETUP: '/auth/mfa-setup',
  MFA_VERIFY: '/auth/mfa-verify',
} as const;

export const AUTH_PATHS_HERO = {
  LOGIN_HERO: '/auth/hero/login',
  REGISTER_HERO: '/auth/hero/register',
  FORGOT_PASSWORD_HERO: '/auth/hero/forgot-password',
  RESET_PASSWORD_HERO: '/auth/hero/reset-password',
  VERIFY_EMAIL_HERO: '/auth/hero/verify-email',
  MFA_SETUP_HERO: '/auth/hero/mfa-setup',
  MFA_VERIFY_HERO: '/auth/hero/mfa-verify',
} as const;

export const AUTH_PATHS = {
  ...AUTH_PATHS_MINIMAL,
  ...AUTH_PATHS_HERO,
} as const;

export type AuthPaths = typeof AUTH_PATHS;
