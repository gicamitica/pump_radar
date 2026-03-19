/**
 * AuthRepository - HTTP abstraction layer for auth API calls
 * 
 * This repository encapsulates all HTTP communication with the auth API.
 * It extends BaseRepository which provides:
 * - Automatic response unwrapping
 * - Consistent error handling
 * - HTTP method helpers
 * 
 * To switch from MSW to real API:
 * 1. Update API_BASE_URL in config
 * 2. Disable MSW (VITE_USE_MSW=false)
 * 3. No code changes needed here!
 */

import { injectable, inject } from 'inversify';
import { CORE_SYMBOLS } from '@/core/di/symbols';
import type { IHttpClient } from '@/shared/infrastructure/http/HttpClient';
import { BaseRepository } from '@/shared/infrastructure/repositories';
import type {
  LoginDTO,
  LoginResponse,
  RegisterDTO,
  RegisterResponse,
  ForgotPasswordDTO,
  ForgotPasswordResponse,
  ResetPasswordDTO,
  ResetPasswordResponse,
  VerifyEmailDTO,
  VerifyEmailResponse,
  MfaSetupDTO,
  MfaSetupResponse,
  MfaVerifyDTO,
  MfaVerifyResponse,
  RefreshTokenDTO,
  RefreshTokenResponse,
  LogoutResponse,
  MeResponse,
} from '@/modules/auth/domain/models/AuthModels';

export interface IAuthRepository {
  login(dto: LoginDTO): Promise<LoginResponse>;
  register(dto: RegisterDTO): Promise<RegisterResponse>;
  forgotPassword(dto: ForgotPasswordDTO): Promise<ForgotPasswordResponse>;
  resetPassword(dto: ResetPasswordDTO): Promise<ResetPasswordResponse>;
  verifyEmail(dto: VerifyEmailDTO): Promise<VerifyEmailResponse>;
  setupMfa(dto: MfaSetupDTO): Promise<MfaSetupResponse>;
  verifyMfa(dto: MfaVerifyDTO): Promise<MfaVerifyResponse>;
  refreshToken(dto: RefreshTokenDTO): Promise<RefreshTokenResponse>;
  logout(): Promise<LogoutResponse>;
  getCurrentUser(): Promise<MeResponse>;
}

@injectable()
export class AuthRepository extends BaseRepository implements IAuthRepository {
  private readonly baseUrl = '/api/auth';

  constructor(@inject(CORE_SYMBOLS.IHttpClient) http: IHttpClient) {
    super(http);
  }

  async login(dto: LoginDTO): Promise<LoginResponse> {
    return this.post<LoginResponse, LoginDTO>(
      `${this.baseUrl}/login`,
      dto,
      'Login failed'
    );
  }

  async register(dto: RegisterDTO): Promise<RegisterResponse> {
    return this.post<RegisterResponse, RegisterDTO>(
      `${this.baseUrl}/register`,
      dto,
      'Registration failed'
    );
  }

  async forgotPassword(dto: ForgotPasswordDTO): Promise<ForgotPasswordResponse> {
    return this.post<ForgotPasswordResponse, ForgotPasswordDTO>(
      `${this.baseUrl}/forgot-password`,
      dto,
      'Forgot password request failed'
    );
  }

  async resetPassword(dto: ResetPasswordDTO): Promise<ResetPasswordResponse> {
    return this.post<ResetPasswordResponse, ResetPasswordDTO>(
      `${this.baseUrl}/reset-password`,
      dto,
      'Password reset failed'
    );
  }

  async verifyEmail(dto: VerifyEmailDTO): Promise<VerifyEmailResponse> {
    return this.post<VerifyEmailResponse, VerifyEmailDTO>(
      `${this.baseUrl}/verify-email`,
      dto,
      'Email verification failed'
    );
  }

  async setupMfa(dto: MfaSetupDTO): Promise<MfaSetupResponse> {
    return this.post<MfaSetupResponse, MfaSetupDTO>(
      `${this.baseUrl}/mfa/setup`,
      dto,
      'MFA setup failed'
    );
  }

  async verifyMfa(dto: MfaVerifyDTO): Promise<MfaVerifyResponse> {
    return this.post<MfaVerifyResponse, MfaVerifyDTO>(
      `${this.baseUrl}/mfa/verify`,
      dto,
      'MFA verification failed'
    );
  }

  async refreshToken(dto: RefreshTokenDTO): Promise<RefreshTokenResponse> {
    return this.post<RefreshTokenResponse, RefreshTokenDTO>(
      `${this.baseUrl}/refresh`,
      dto,
      'Token refresh failed'
    );
  }

  async logout(): Promise<LogoutResponse> {
    return this.post<LogoutResponse>(
      `${this.baseUrl}/logout`,
      undefined,
      'Logout failed'
    );
  }

  async getCurrentUser(): Promise<MeResponse> {
    return this.get<MeResponse>(
      `${this.baseUrl}/me`,
      'Failed to get current user'
    );
  }
}
