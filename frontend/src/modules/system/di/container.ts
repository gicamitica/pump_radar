import type { Container } from 'inversify';
import type { AppModule } from '@/core/di/module-loader';
import { SYSTEM_ROUTES } from '../ui/routes';

export function createSystemModule(_container: Container): AppModule {
  return {
    name: 'system',
    routes: SYSTEM_ROUTES,
  };
}
