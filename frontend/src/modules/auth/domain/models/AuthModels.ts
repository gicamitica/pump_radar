/**
 * Auth Domain Models
 * 
 * Core domain entities and value objects for authentication
 */

// ============================================================================
// Entities
// ============================================================================

export type Role = 'admin' | 'editor' | 'viewer';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  roles: Role[];
  avatar?: string;
  emailVerified?: boolean;
  subscription?: string;
  subscriptionExpiry?: string | null;
  createdAt?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn?: number; // seconds
}

// ============================================================================
// DTOs (Data Transfer Objects)
// ============================================================================

export interface LoginDTO {
  email: string;
  password: string;
  remember?: boolean;
}

export interface RegisterDTO {
  email: string;
  password: string;
  name: string;
  confirmPassword?: string;
}

export interface ForgotPasswordDTO {
  email: string;
}

export interface ResetPasswordDTO {
  token: string;
  password: string;
  confirmPassword?: string;
}

export interface VerifyEmailDTO {
  token: string;
}

export interface MfaSetupDTO {
  userId: string;
}

export interface MfaVerifyDTO {
  code: string;
  userId?: string;
}

export interface RefreshTokenDTO {
  refreshToken: string;
}

export interface ChangePasswordDTO {
  currentPassword: string;
  newPassword: string;
  confirmPassword?: string;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface LoginResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
  expiresIn?: number;
}

export interface RegisterResponse {
  user: AuthUser;
  message?: string;
}

export interface ForgotPasswordResponse {
  message: string;
  resetToken?: string; // Only in dev/test
}

export interface ResetPasswordResponse {
  message: string;
}

export interface VerifyEmailResponse {
  message: string;
  user?: AuthUser;
  accessToken?: string;
  refreshToken?: string;
}

export interface MfaSetupResponse {
  secret: string;
  qrCode: string;
  backupCodes?: string[];
}

export interface MfaVerifyResponse {
  message: string;
  accessToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn?: number;
}

export interface LogoutResponse {
  message: string;
}

export interface MeResponse {
  user: AuthUser;
}

// ============================================================================
// Error Types
// ============================================================================

export interface AuthError {
  error: string;
  message: string;
  statusCode?: number;
  field?: string;
}

// ============================================================================
// Auth State
// ============================================================================

export interface AuthState {
  user: AuthUser | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: AuthError | null;
}
