import type { Container } from 'inversify';
import type { AppModule } from '@/core/di/module-loader';
import { ERROR_PAGES_ROUTES } from '../ui/routes';

export function createErrorPagesModule(_parent: Container): AppModule {
  const registerBindings = () => {
    // No bindings needed for this module
  };

  return {
    name: 'pages-errors',
    routes: ERROR_PAGES_ROUTES,
    registerBindings,
  };
}
