import type {
  AuthUser,
  AuthTokens,
  Role,
  LoginDTO,
  RegisterDTO,
  ForgotPasswordDTO,
  ResetPasswordDTO,
  VerifyEmailDTO,
  MfaSetupDTO,
  MfaVerifyDTO,
  RefreshTokenDTO,
} from '@/modules/auth/domain/models/AuthModels';

// Re-export for backward compatibility
export type { AuthUser, Role, LoginDTO };

export interface IAuthService {
  // Authentication
  login(dto: LoginDTO): Promise<AuthUser>;
  completeLogin(user: AuthUser, tokens: AuthTokens, remember?: boolean): Promise<AuthUser>;
  register(dto: RegisterDTO): Promise<void>;
  logout(): Promise<void>;
  
  // Password Management
  forgotPassword(dto: ForgotPasswordDTO): Promise<void>;
  resetPassword(dto: ResetPasswordDTO): Promise<void>;
  
  // Email Verification
  verifyEmail(dto: VerifyEmailDTO): Promise<void>;
  
  // MFA
  setupMfa(dto: MfaSetupDTO): Promise<{ secret: string; qrCode: string }>;
  verifyMfa(dto: MfaVerifyDTO): Promise<void>;
  
  // Token Management
  refreshToken(dto: RefreshTokenDTO): Promise<void>;
  
  // User State
  getCurrentUser(): AuthUser | null;
  isAuthenticated(): boolean;
  hasAnyRole(roles: Role[]): boolean;
  hasAllRoles(roles: Role[]): boolean;
  
  // Session Management
  clearSession(): void;
}
