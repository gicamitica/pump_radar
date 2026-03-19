/**
 * AuthService - Main authentication service
 * 
 * Orchestrates authentication flows using:
 * - AuthRepository for HTTP calls
 * - AuthEventHandler for event publishing
 * - StorageService for token/user persistence
 * 
 * This service is the single source of truth for auth state.
 */

import { injectable, inject } from 'inversify';
import type { IStorageService } from '@/shared/infrastructure/storage/StorageService';
import type { ILogger } from '@/shared/utils/Logger';
import type { IConfig } from '@/shared/infrastructure/config/Config';
import { CORE_SYMBOLS } from '@/core/di/symbols';
import { AUTH_SYMBOLS } from '@/modules/auth/di/symbols';
import type { IAuthService } from '@/modules/auth/application/ports/IAuthService';
import type { IAuthRepository } from '@/modules/auth/infrastructure/repositories/AuthRepository';
import type { AuthEventHandler } from '@/modules/auth/application/handlers/AuthEventHandler';
import type {
  AuthUser,
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

@injectable()
export class AuthService implements IAuthService {
  private currentUser: AuthUser | null = null;
  private readonly userStorageKey: string;
  private readonly tokenStorageKey: string;
  private readonly refreshTokenStorageKey: string;

  constructor(
    @inject(CORE_SYMBOLS.IConfig) private config: IConfig,
    @inject(CORE_SYMBOLS.IStorageService) private storage: IStorageService,
    @inject(CORE_SYMBOLS.ILogger) private logger: ILogger,
    @inject(AUTH_SYMBOLS.IAuthRepository) private repository: IAuthRepository,
    @inject(AUTH_SYMBOLS.AuthEventHandler) private eventHandler: AuthEventHandler
  ) {
    // Use config values for storage keys
    this.userStorageKey = this.config.auth.currentUserKey;
    this.tokenStorageKey = this.config.auth.tokenKey;
    this.refreshTokenStorageKey = `${this.config.auth.tokenKey}_refresh`;
    // Restore user from storage on initialization
    this.currentUser = this.storage.getItem<AuthUser>(this.userStorageKey);
    if (this.currentUser) {
      this.logger.info('User session restored', { userId: this.currentUser.id });
    }
  }

  // ============================================================================
  // Authentication
  // ============================================================================

  async login(dto: LoginDTO): Promise<AuthUser> {
    try {
      this.logger.info('Login attempt', { email: dto.email });
      
      const response = await this.repository.login(dto);
      
      // Store tokens
      this.storage.setItem(this.tokenStorageKey, response.accessToken);
      this.storage.setItem(this.refreshTokenStorageKey, response.refreshToken);
      
      // Store user
      this.currentUser = response.user;
      this.storage.setItem(this.userStorageKey, this.currentUser);
      
      // Publish success event
      this.eventHandler.publishLoginSuccess(response.user);
      
      this.logger.info('Login successful', { userId: response.user.id });
      
      return response.user;
    } catch (error) {
      this.logger.error('Login failed', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.eventHandler.publishLoginFailed(dto.email, message);
      throw error;
    }
  }

  async register(dto: RegisterDTO): Promise<AuthUser> {
    try {
      this.logger.info('Registration attempt', { email: dto.email });
      
      const response = await this.repository.register(dto);
      
      // Store tokens
      this.storage.setItem(this.tokenStorageKey, response.accessToken);
      this.storage.setItem(this.refreshTokenStorageKey, response.refreshToken);
      
      // Store user
      this.currentUser = response.user;
      this.storage.setItem(this.userStorageKey, this.currentUser);
      
      // Publish success event (reuse login success)
      this.eventHandler.publishLoginSuccess(response.user);
      
      this.logger.info('Registration successful', { userId: response.user.id });
      
      return response.user;
    } catch (error) {
      this.logger.error('Registration failed', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    const userId = this.currentUser?.id;
    
    try {
      this.logger.info('Logout attempt', { userId });
      
      // Call logout endpoint (invalidate token on server)
      await this.repository.logout();
      
      // Clear local state
      this.clearSession();
      
      // Publish logout event
      this.eventHandler.publishLogout(userId);
      
      this.logger.info('Logout successful', { userId });
    } catch (error) {
      // Even if API call fails, clear local session
      this.clearSession();
      this.eventHandler.publishLogout(userId);
      
      this.logger.error('Logout error (session cleared anyway)', error);
    }
  }

  // ============================================================================
  // Password Management
  // ============================================================================

  async forgotPassword(dto: ForgotPasswordDTO): Promise<void> {
    try {
      this.logger.info('Forgot password request', { email: dto.email });
      await this.repository.forgotPassword(dto);
      this.logger.info('Password reset email sent', { email: dto.email });
    } catch (error) {
      this.logger.error('Forgot password failed', error);
      throw error;
    }
  }

  async resetPassword(dto: ResetPasswordDTO): Promise<void> {
    try {
      this.logger.info('Reset password attempt');
      await this.repository.resetPassword(dto);
      this.logger.info('Password reset successful');
    } catch (error) {
      this.logger.error('Reset password failed', error);
      throw error;
    }
  }

  // ============================================================================
  // Email Verification
  // ============================================================================

  async verifyEmail(dto: VerifyEmailDTO): Promise<void> {
    try {
      this.logger.info('Email verification attempt');
      const response = await this.repository.verifyEmail(dto);
      
      // Update current user if returned
      if (response.user && this.currentUser) {
        this.currentUser = { ...this.currentUser, emailVerified: true };
        this.storage.setItem(this.userStorageKey, this.currentUser);
        this.eventHandler.publishUserUpdated(this.currentUser);
      }
      
      this.logger.info('Email verified successfully');
    } catch (error) {
      this.logger.error('Email verification failed', error);
      throw error;
    }
  }

  // ============================================================================
  // MFA
  // ============================================================================

  async setupMfa(dto: MfaSetupDTO): Promise<{ secret: string; qrCode: string }> {
    try {
      this.logger.info('MFA setup attempt', { userId: dto.userId });
      const response = await this.repository.setupMfa(dto);
      this.logger.info('MFA setup successful');
      return { secret: response.secret, qrCode: response.qrCode };
    } catch (error) {
      this.logger.error('MFA setup failed', error);
      throw error;
    }
  }

  async verifyMfa(dto: MfaVerifyDTO): Promise<void> {
    try {
      this.logger.info('MFA verification attempt');
      const response = await this.repository.verifyMfa(dto);
      
      // Update token after MFA verification
      this.storage.setItem(this.tokenStorageKey, response.accessToken);
      
      this.logger.info('MFA verified successfully');
    } catch (error) {
      this.logger.error('MFA verification failed', error);
      throw error;
    }
  }

  // ============================================================================
  // Token Management
  // ============================================================================

  async refreshToken(dto: RefreshTokenDTO): Promise<void> {
    try {
      this.logger.debug('Token refresh attempt');
      const response = await this.repository.refreshToken(dto);
      
      // Update tokens
      this.storage.setItem(this.tokenStorageKey, response.accessToken);
      this.storage.setItem(this.refreshTokenStorageKey, response.refreshToken);
      
      // Publish event
      this.eventHandler.publishTokenRefreshed();
      
      this.logger.debug('Token refreshed successfully');
    } catch (error) {
      this.logger.error('Token refresh failed', error);
      this.eventHandler.publishSessionExpired();
      throw error;
    }
  }

  // ============================================================================
  // User State
  // ============================================================================

  getCurrentUser(): AuthUser | null {
    return this.currentUser;
  }

  isAuthenticated(): boolean {
    return !!this.currentUser && !!this.storage.getItem(this.tokenStorageKey);
  }

  hasAnyRole(roles: Role[]): boolean {
    if (!this.currentUser) return false;
    return this.currentUser.roles.some(r => roles.includes(r));
  }

  hasAllRoles(roles: Role[]): boolean {
    if (!this.currentUser) return false;
    return roles.every(r => this.currentUser!.roles.includes(r));
  }

  // ============================================================================
  // Session Management
  // ============================================================================

  clearSession(): void {
    this.currentUser = null;
    this.storage.removeItem(this.userStorageKey);
    this.storage.removeItem(this.tokenStorageKey);
    this.storage.removeItem(this.refreshTokenStorageKey);
    this.logger.debug('Session cleared');
  }
}
