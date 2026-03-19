import type { ModuleRoute } from '@/core/router/types';
import { HOME_PATHS } from './paths';
import { lazy } from 'react';

const LandingPage = lazy(() => import('../pages/LandingPage'));
const GuidedWorkspaceSetupPage = lazy(() => import('../pages/GuidedWorkspaceSetupPage'));
const ActionActivityHubPage = lazy(() => import('../pages/ActionActivityHubPage'));

export const HOME_ROUTES: ModuleRoute[] = [
  {
    path: HOME_PATHS.HOME,
    module: 'home',
    layout: 'none',   // Public - no auth, no sidebar
    title: 'PumpRadar - AI Crypto Signals',
    component: LandingPage,
  },
  {
    path: HOME_PATHS.GUIDED_SETUP,
    module: 'home',
    layout: 'app',
    title: 'Guided Setup',
    component: GuidedWorkspaceSetupPage,
  },
  {
    path: HOME_PATHS.ACTIVITY_HUB,
    module: 'home',
    layout: 'app',
    title: 'Activity Hub',
    component: ActionActivityHubPage,
  },
];

export const getHomeRoutes = (): ModuleRoute[] => HOME_ROUTES;
export { HOME_PATHS } from './paths';
