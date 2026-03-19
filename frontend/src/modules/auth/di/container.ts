import type { Container } from 'inversify';
import { AUTH_SYMBOLS } from '@/modules/auth/di/symbols';
import type { IAuthService } from '@/modules/auth/application/ports/IAuthService';
import { AuthService } from '@/modules/auth/infrastructure/services/AuthService';
import type { IAuthRepository } from '@/modules/auth/infrastructure/repositories/AuthRepository';
import { AuthRepository } from '@/modules/auth/infrastructure/repositories/AuthRepository';
import { AuthEventHandler } from '@/modules/auth/application/handlers/AuthEventHandler';
import type { AppModule } from '@/core/di/module-loader';
import { AUTH_ROUTES } from '../ui/routes';

export function createAuthModule(parent: Container): AppModule {
  const registerBindings = () => {
    // Register repository
    parent.bind<IAuthRepository>(AUTH_SYMBOLS.IAuthRepository).to(AuthRepository).inSingletonScope();
    
    // Register event handler
    parent.bind<AuthEventHandler>(AUTH_SYMBOLS.AuthEventHandler).to(AuthEventHandler).inSingletonScope();
    
    // Register service (depends on repository and event handler)
    parent.bind<IAuthService>(AUTH_SYMBOLS.IAuthService).to(AuthService).inSingletonScope();
  };

  return {
    name: 'auth',
    routes: AUTH_ROUTES,
    registerBindings,
  };
}
