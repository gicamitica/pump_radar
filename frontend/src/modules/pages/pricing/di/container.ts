import type { Container } from 'inversify';
import type { AppModule } from '@/core/di/module-loader';
import { PRICING_ROUTES } from '../ui/routes';

export function createPricingModule(_parent: Container): AppModule {
  const registerBindings = () => {
    // No bindings needed for this module
  };

  return {
    name: 'pages-pricing',
    routes: PRICING_ROUTES,
    registerBindings,
  };
}
