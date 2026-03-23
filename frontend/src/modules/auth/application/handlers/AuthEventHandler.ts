/**
 * AuthEventHandler - Handles auth-related events
 * 
 * Listens to auth events and performs side effects like:
 * - Logging
 * - Analytics tracking
 * - Clearing cached data
 * - Redirecting users
 * - Showing notifications
 */

import { injectable, inject } from 'inversify';
import { CORE_SYMBOLS } from '@/core/di/symbols';
import type { IEventBus } from '@/shared/infrastructure/events/EventBus';
import type { ILogger } from '@/shared/utils/Logger';
import type { INavigationService } from '@/shared/infrastructure/navigation/NavigationService';
import type { AuthUser } from '@/modules/auth/domain/models/AuthModels';

export const AUTH_EVENTS = {
  LOGIN_SUCCESS: 'auth:login:success',
  LOGIN_FAILED: 'auth:login:failed',
  LOGOUT: 'auth:logout',
  TOKEN_REFRESHED: 'auth:token:refreshed',
  SESSION_EXPIRED: 'auth:session:expired',
  USER_UPDATED: 'auth:user:updated',
} as const;

export interface LoginSuccessPayload {
  user: AuthUser;
  timestamp: number;
}

export interface LoginFailedPayload {
  email: string;
  error: string;
  timestamp: number;
}

export interface LogoutPayload {
  userId?: string;
  timestamp: number;
}

export interface TokenRefreshedPayload {
  timestamp: number;
}

export interface SessionExpiredPayload {
  timestamp: number;
}

export interface UserUpdatedPayload {
  user: AuthUser;
  timestamp: number;
}

@injectable()
export class AuthEventHandler {
  constructor(
    @inject(CORE_SYMBOLS.IEventBus) private eventBus: IEventBus,
    @inject(CORE_SYMBOLS.ILogger) private logger: ILogger,
    @inject(CORE_SYMBOLS.INavigationService) private navigationService: INavigationService
  ) {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Login Success
    this.eventBus.subscribe<LoginSuccessPayload>(
      AUTH_EVENTS.LOGIN_SUCCESS,
      (payload) => {
        this.logger.info('User logged in successfully', {
          userId: payload.user.id,
          email: payload.user.email,
          roles: payload.user.roles,
        });

        // TODO: Track analytics
        // analytics.track('Login Success', { userId: payload.user.id });

        // TODO: Initialize user-specific services
        // userPreferencesService.load(payload.user.id);
      }
    );

    // Login Failed
    this.eventBus.subscribe<LoginFailedPayload>(
      AUTH_EVENTS.LOGIN_FAILED,
      (payload) => {
        this.logger.warn('Login failed', {
          email: payload.email,
          error: payload.error,
        });

        // TODO: Track failed login attempts
        // analytics.track('Login Failed', { email: payload.email });
      }
    );

    // Logout
    this.eventBus.subscribe<LogoutPayload>(
      AUTH_EVENTS.LOGOUT,
      (payload) => {
        this.logger.info('User logged out', { userId: payload.userId });

        // Navigate to landing page after logout
        this.logger.info('Navigating to landing page after logout');
        this.navigationService.navigateTo('/');

        // TODO: Clear user-specific data
        // userPreferencesService.clear();
        // cacheService.clearUserData();

        // TODO: Track analytics
        // analytics.track('Logout', { userId: payload.userId });
      }
    );

    // Token Refreshed
    this.eventBus.subscribe<TokenRefreshedPayload>(
      AUTH_EVENTS.TOKEN_REFRESHED,
      (payload) => {
        this.logger.debug('Auth token refreshed', { timestamp: payload.timestamp });
      }
    );

    // Session Expired
    this.eventBus.subscribe<SessionExpiredPayload>(
      AUTH_EVENTS.SESSION_EXPIRED,
      (payload) => {
        this.logger.warn('Session expired', { timestamp: payload.timestamp });

        // TODO: Show notification
        // notificationService.warning('Your session has expired. Please log in again.');
      }
    );

    // User Updated
    this.eventBus.subscribe<UserUpdatedPayload>(
      AUTH_EVENTS.USER_UPDATED,
      (payload) => {
        this.logger.info('User profile updated', {
          userId: payload.user.id,
          timestamp: payload.timestamp,
        });
      }
    );
  }

  // Helper methods to publish events
  publishLoginSuccess(user: AuthUser): void {
    this.eventBus.publish<LoginSuccessPayload>(AUTH_EVENTS.LOGIN_SUCCESS, {
      user,
      timestamp: Date.now(),
    });
  }

  publishLoginFailed(email: string, error: string): void {
    this.eventBus.publish<LoginFailedPayload>(AUTH_EVENTS.LOGIN_FAILED, {
      email,
      error,
      timestamp: Date.now(),
    });
  }

  publishLogout(userId?: string): void {
    this.eventBus.publish<LogoutPayload>(AUTH_EVENTS.LOGOUT, {
      userId,
      timestamp: Date.now(),
    });
  }

  publishTokenRefreshed(): void {
    this.eventBus.publish<TokenRefreshedPayload>(AUTH_EVENTS.TOKEN_REFRESHED, {
      timestamp: Date.now(),
    });
  }

  publishSessionExpired(): void {
    this.eventBus.publish<SessionExpiredPayload>(AUTH_EVENTS.SESSION_EXPIRED, {
      timestamp: Date.now(),
    });
  }

  publishUserUpdated(user: AuthUser): void {
    this.eventBus.publish<UserUpdatedPayload>(AUTH_EVENTS.USER_UPDATED, {
      user,
      timestamp: Date.now(),
    });
  }
}
