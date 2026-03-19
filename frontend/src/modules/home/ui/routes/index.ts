import type { ModuleRoute } from '@/core/router/types';
import { HOME_PATHS } from './paths';
import { lazy } from 'react';

const HomePage = lazy(() => import('../pages/HomePage'));
const GuidedWorkspaceSetupPage = lazy(() => import('../pages/GuidedWorkspaceSetupPage'));
const ActionActivityHubPage = lazy(() => import('../pages/ActionActivityHubPage'));

export const HOME_ROUTES: ModuleRoute[] = [
  {
    path: HOME_PATHS.HOME,
    module: 'home',
    layout: 'app',
    title: 'Home',
    description: 'User home page',
    component: HomePage
  },
  {
    path: HOME_PATHS.GUIDED_SETUP,
    module: 'home',
    layout: 'app',
    title: 'Guided Setup',
    description: 'Guided workspace setup',
    component: GuidedWorkspaceSetupPage
  },
  {
    path: HOME_PATHS.ACTIVITY_HUB,
    module: 'home',
    layout: 'app',
    title: 'Activity Hub',
    description: 'Action and activity hub',
    component: ActionActivityHubPage
  },
];

export const getHomeRoutes = (): ModuleRoute[] => HOME_ROUTES;

// Export path constants for use in other modules
export { HOME_PATHS } from './paths';
