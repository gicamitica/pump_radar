import type { ModuleRoute } from '@/core/router/types';
import { PRICING_PATHS } from './paths';
import { lazy } from 'react';

const PricingPage = lazy(() => import('../pages/PricingPage'));

export const PRICING_ROUTES: ModuleRoute[] = [
  {
    path: PRICING_PATHS.HOME,
    module: 'pages-pricing',
    layout: 'app',
    titleKey: 'pricing:title',
    title: 'Pricing',
    description: 'Choose the best plan for your needs.',
    component: PricingPage,
  },
];

export { PRICING_PATHS } from './paths';
