import type { ModuleRoute } from '@/core/router/types';
import { CRYPTO_PATHS } from './paths';
import { lazy } from 'react';

const SignalsDashboard = lazy(() => import('../pages/SignalsDashboard'));
const SubscriptionPage = lazy(() => import('../pages/SubscriptionPage'));
const SubscriptionSuccess = lazy(() => import('../pages/SubscriptionSuccess'));

export const CRYPTO_ROUTES: ModuleRoute[] = [
  {
    path: CRYPTO_PATHS.DASHBOARD,
    module: 'crypto',
    layout: 'app',
    title: 'Dashboard',
    component: SignalsDashboard,
  },
  {
    path: CRYPTO_PATHS.PUMP_SIGNALS,
    module: 'crypto',
    layout: 'app',
    title: 'Pump Signals',
    component: SignalsDashboard,
  },
  {
    path: CRYPTO_PATHS.DUMP_SIGNALS,
    module: 'crypto',
    layout: 'app',
    title: 'Dump Signals',
    component: SignalsDashboard,
  },
  {
    path: CRYPTO_PATHS.HISTORY,
    module: 'crypto',
    layout: 'app',
    title: 'History',
    component: SignalsDashboard,
  },
  {
    path: CRYPTO_PATHS.SUBSCRIPTION,
    module: 'crypto',
    layout: 'app',
    title: 'Subscription',
    component: SubscriptionPage,
  },
  {
    path: CRYPTO_PATHS.SUBSCRIPTION_SUCCESS,
    module: 'crypto',
    layout: 'app',
    title: 'Payment Success',
    component: SubscriptionSuccess,
  },
];

export { CRYPTO_PATHS } from './paths';
