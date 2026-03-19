import { Container } from 'inversify';
import type { AppModule } from '@/core/di/module-loader';
import { PLAYGROUND_ROUTES } from '../ui/routes';

export const createPlaygroundModule = (_container: Container): AppModule => {
  return {
    name: 'playground',
    routes: PLAYGROUND_ROUTES,
  };
};
