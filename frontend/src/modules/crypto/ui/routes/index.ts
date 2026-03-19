import type { ModuleRoute } from '@/core/router/types';
import { CRYPTO_PATHS } from './paths';
import { lazy } from 'react';

const SignalsDashboard = lazy(() => import('../pages/SignalsDashboard'));
const SubscriptionPage = lazy(() => import('../pages/SubscriptionPage'));
const SubscriptionSuccess = lazy(() => import('../pages/SubscriptionSuccess'));
const AIChatPage = lazy(() => import('../pages/AIChatPage'));
const AdminPage = lazy(() => import('../pages/AdminPage'));
const CoinDetailPage = lazy(() => import('../pages/CoinDetailPage'));

export const CRYPTO_ROUTES: ModuleRoute[] = [
  { path: CRYPTO_PATHS.DASHBOARD, module: 'crypto', layout: 'app', title: 'Signals Dashboard', component: SignalsDashboard },
  { path: CRYPTO_PATHS.PUMP_SIGNALS, module: 'crypto', layout: 'app', title: 'PUMP Signals', component: SignalsDashboard },
  { path: CRYPTO_PATHS.DUMP_SIGNALS, module: 'crypto', layout: 'app', title: 'DUMP Signals', component: SignalsDashboard },
  { path: CRYPTO_PATHS.HISTORY, module: 'crypto', layout: 'app', title: 'History', component: SignalsDashboard },
  { path: CRYPTO_PATHS.SUBSCRIPTION, module: 'crypto', layout: 'app', title: 'Subscription', component: SubscriptionPage },
  { path: CRYPTO_PATHS.SUBSCRIPTION_SUCCESS, module: 'crypto', layout: 'app', title: 'Payment Successful', component: SubscriptionSuccess },
  { path: CRYPTO_PATHS.AI_CHAT, module: 'crypto', layout: 'app', title: 'AI Assistant', component: AIChatPage },
  { path: CRYPTO_PATHS.ADMIN, module: 'crypto', layout: 'app', title: 'Admin Panel', component: AdminPage },
  { path: CRYPTO_PATHS.COIN_DETAIL, module: 'crypto', layout: 'app', title: 'Coin Details', component: CoinDetailPage },
];

export { CRYPTO_PATHS } from './paths';
