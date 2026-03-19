import type { ModuleRoute } from '@/core/router/types';
import { SYSTEM_PATHS } from './paths';
import { lazy } from 'react';

const ChangelogPage = lazy(() => import('../pages/ChangelogPage'));
const SearchResultsPage = lazy(() => import('../pages/SearchResultsPage'));

export const SYSTEM_ROUTES: ModuleRoute[] = [
  {
    path: SYSTEM_PATHS.CHANGELOG,
    module: 'system',
    layout: 'app',
    title: 'Changelog',
    titleKey: 'system.changelog',
    component: ChangelogPage,
  },
  {
    path: SYSTEM_PATHS.SEARCH,
    module: 'system',
    layout: 'app',
    title: 'Search Results',
    titleKey: 'system.search',
    component: SearchResultsPage,
  },
];

export { SYSTEM_PATHS } from './paths';
