import type { Container } from 'inversify';
import type { AppModule } from '@/core/di/module-loader';
import { CRYPTO_ROUTES } from '../ui/routes';

export function createCryptoModule(_parent: Container): AppModule {
  return {
    name: 'crypto',
    routes: CRYPTO_ROUTES,
  };
}
