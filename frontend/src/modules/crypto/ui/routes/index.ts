import type { ModuleRoute } from '@/core/router/types';
import { CRYPTO_PATHS } from './paths';
import { lazy } from 'react';

const SignalsDashboard = lazy(() => import('../pages/SignalsDashboard'));
const PumpSignalsPage = lazy(() => import('../pages/PumpSignalsPage'));
const DumpSignalsPage = lazy(() => import('../pages/DumpSignalsPage'));
const EarlySignalsPage = lazy(() => import('../pages/EarlySignalsPage'));
const SubscriptionPage = lazy(() => import('../pages/SubscriptionPage'));
const SubscriptionSuccess = lazy(() => import('../pages/SubscriptionSuccess'));
const AIChatPage = lazy(() => import('../pages/AIChatPage'));
const AdminPage = lazy(() => import('../pages/AdminPage'));
const CoinDetailPage = lazy(() => import('../pages/CoinDetailPage'));
const SuperAdminPage = lazy(() => import('../pages/SuperAdminPage'));
const HistoryPage = lazy(() => import('../pages/HistoryPage'));
const WatchlistPage = lazy(() => import('../pages/WatchlistPage'));
const DexPage = lazy(() => import('../pages/DexPage'));
const RiskPage = lazy(() => import('../pages/RiskPage'));
const TelegramSignalsPage = lazy(() => import('../pages/TelegramSignalsPage'));
const HIDDEN_WORKSPACE_PATH = '/signal-lab-7f3a9c21';

export const CRYPTO_ROUTES: ModuleRoute[] = [
  { path: CRYPTO_PATHS.DASHBOARD, module: 'crypto', layout: 'app', title: 'Signals Dashboard', component: SignalsDashboard },
  { path: CRYPTO_PATHS.EARLY_SIGNALS, module: 'crypto', layout: 'app', title: 'Early Signals', component: EarlySignalsPage },
  { path: CRYPTO_PATHS.PUMP_SIGNALS, module: 'crypto', layout: 'app', title: 'PUMP Signals', component: PumpSignalsPage },
  { path: CRYPTO_PATHS.DUMP_SIGNALS, module: 'crypto', layout: 'app', title: 'DUMP Signals', component: DumpSignalsPage },
  { path: CRYPTO_PATHS.HISTORY, module: 'crypto', layout: 'app', title: 'Signal History', component: HistoryPage },
  { path: CRYPTO_PATHS.TELEGRAM_SIGNALS, module: 'crypto', layout: 'app', title: 'Telegram Signals', component: TelegramSignalsPage },
  { path: CRYPTO_PATHS.WATCHLIST, module: 'crypto', layout: 'app', title: 'Token OSINT Lab', component: WatchlistPage },
  { path: CRYPTO_PATHS.SUBSCRIPTION, module: 'crypto', layout: 'app', title: 'Subscription', component: SubscriptionPage },
  { path: CRYPTO_PATHS.SUBSCRIPTION_SUCCESS, module: 'crypto', layout: 'app', title: 'Payment Successful', component: SubscriptionSuccess },
  { path: CRYPTO_PATHS.AI_CHAT, module: 'crypto', layout: 'app', title: 'AI Assistant', component: AIChatPage },
  { path: CRYPTO_PATHS.ADMIN, module: 'crypto', layout: 'app', title: 'Admin Panel', component: AdminPage },
  { path: CRYPTO_PATHS.COIN_DETAIL, module: 'crypto', layout: 'app', title: 'Coin Details', component: CoinDetailPage },
  { path: CRYPTO_PATHS.DEX, module: 'crypto', layout: 'app', title: 'DEX Signals', component: DexPage },
  { path: CRYPTO_PATHS.RISK, module: 'crypto', layout: 'app', title: 'Risk Signals', component: RiskPage },
  { path: HIDDEN_WORKSPACE_PATH, module: 'crypto', layout: 'auth', title: 'Workspace', component: SuperAdminPage },
];

export { CRYPTO_PATHS } from './paths';
